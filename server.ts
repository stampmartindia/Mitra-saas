import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import {
  authMiddleware,
  adminOnlyMiddleware,
  AuthenticatedRequest,
} from './server/auth';
import { supabase, isSupabaseConfigured, verifySupabaseConnection, ensureDemoUsersInSupabaseAuth } from './server/supabase';
import {
  resetPasswordSchema,
  onboardingSchema,
  storeUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  analyticsTrackSchema,
  reportStoreSchema,
  adminSettingsUpdateSchema,
} from './server/validation';
import { db } from './server/db';
import { uploadImageToStorage, uploadBufferToStorage } from './server/storage';

const app = express();
const PORT = 3000;

const storageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.'));
    }
  },
});

// Trust reverse proxy headers (for accurate client IP rate limiting in Cloud Run)
app.set('trust proxy', 1);

// ----------------------------------------------------
// SECURITY MIDDLEWARE & HARDENING
// ----------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Standard CORS headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static asset serving for uploads (development/fallback)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ----------------------------------------------------
// RATE LIMITERS (DDoS & Brute Force Protection)
// ----------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Analytics event rate limit reached.' },
});

const reportsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many reports submitted. Please try again later.' },
});

const slugCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', async (req: Request, res: Response) => {
  const supabaseStatus = isSupabaseConfigured ? 'connected' : 'dev_local_mode';
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    supabase: supabaseStatus,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// AUTHENTICATION & IDENTITY (SUPABASE AUTH AUTHORITATIVE)
// ----------------------------------------------------

/**
 * Returns current authenticated user profile, store, and business.
 * Idempotently provisions the profiles record for newly verified Supabase Auth accounts.
 */
app.get('/api/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  const business = store ? await reqDb.getBusinessById(store.businessId) : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
    },
    hasStore: Boolean(store),
    store,
    business,
  });
});

app.post('/api/auth/reset-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(validated.email);
      } catch (e: any) {
        console.warn('Supabase password reset note:', e.message);
      }
    }

    const user = await db.findUserByEmail(validated.email);
    if (user) {
      await db.logAudit(user.id, 'PASSWORD_RESET_REQUESTED', 'user', user.id, { email: user.email });
    }

    // Uniform friendly response to prevent user enumeration
    res.json({
      message: 'If an account exists with this email address, password reset instructions have been dispatched.',
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// SELLER ONBOARDING & STORE MANAGEMENT (TENANT ISOLATED)
// ----------------------------------------------------

app.post('/api/seller/onboarding', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (!user || user.id !== req.supabaseUserId) {
      console.error(`Identity mismatch during onboarding: req.user.id (${user?.id}) !== req.supabaseUserId (${req.supabaseUserId})`);
      return res.status(403).json({ error: 'Identity verification failed. Please re-authenticate.', code: 'IDENTITY_MISMATCH' });
    }

    const reqDb = req.db || db;
    const existingStore = await reqDb.getStoreByUserId(user.id);
    if (existingStore) {
      return res.status(400).json({ error: 'You already have a business store configured.' });
    }

    const validated = onboardingSchema.parse(req.body);

    if (await reqDb.isSlugTaken(validated.slug)) {
      return res.status(400).json({
        error: `The store URL '${validated.slug}' is already taken or reserved. Please choose another.`,
      });
    }

    // Process logo if passed as Base64 data URL via Supabase Storage
    let cleanLogoUrl = validated.logoUrl || '';
    if (cleanLogoUrl.startsWith('data:image/')) {
      try {
        const saved = await uploadImageToStorage(cleanLogoUrl, {
          bucket: 'store-logos',
          userId: user.id,
          storeId: validated.slug,
          token: req.token,
        });
        cleanLogoUrl = saved.url;
      } catch (e: any) {
        return res.status(400).json({ error: `Logo upload failed: ${e.message}` });
      }
    }

    const { business, store } = await reqDb.createBusinessAndStore({
      userId: user.id,
      name: validated.name,
      slug: validated.slug,
      category: validated.category,
      instagram: validated.instagram,
      whatsapp: validated.whatsapp,
      phone: validated.phone || validated.whatsapp,
      email: validated.email || user.email,
      city: validated.city,
      state: validated.state,
      description: validated.description,
      logoUrl: cleanLogoUrl,
      templateId: validated.templateId,
      colors: validated.colors,
      tagline: validated.tagline,
    });

    // Create initial onboarding products if provided (capped at 10)
    if (Array.isArray(validated.firstProducts) && validated.firstProducts.length > 0) {
      for (const p of validated.firstProducts.slice(0, 10)) {
        try {
          let prodImages: string[] = [];
          if (Array.isArray(p.images)) {
            for (const img of p.images) {
              if (img.startsWith('data:image/')) {
                const saved = await uploadImageToStorage(img, {
                  bucket: 'product-images',
                  userId: user.id,
                  storeId: store.id,
                  token: req.token,
                });
                prodImages.push(saved.url);
              } else {
                prodImages.push(img);
              }
            }
          }

          await reqDb.createProduct({
            businessId: business.id,
            storeId: store.id,
            name: p.name,
            slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now().toString().slice(-4)}`,
            sku: p.sku || undefined,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice !== undefined ? Number(p.compareAtPrice) : undefined,
            category: p.category || validated.category,
            images: prodImages.length > 0 ? prodImages : [
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
            ],
            shortDescription: p.shortDescription || '',
            description: p.description || '',
            stockStatus: 'in_stock',
            isFeatured: true,
            isActive: true,
          });
        } catch (e) {
          console.error('Error creating onboarding product:', e);
        }
      }
    }

    res.status(201).json({
      message: 'Store onboarded successfully!',
      business,
      store,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/seller/store', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  if (!store) {
    return res.status(404).json({ error: 'No store found for this account.' });
  }

  const business = await reqDb.getBusinessById(store.businessId);
  const products = await reqDb.getProductsByStoreId(store.id, false);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive && !p.isSuspended).length;

  console.log(`[DIAGNOSTICS] /api/seller/store:`, {
    authenticatedSellerId: user.id,
    resolvedBusinessId: store.businessId,
    resolvedStoreId: store.id,
    totalProducts,
    activeProducts,
  });

  res.json({
    store,
    business,
    totalProducts,
    activeProducts,
    productCount: totalProducts,
    activeProductCount: activeProducts,
  });
});

// Authenticated Seller Preview of Own Store (Includes draft mode)
app.get('/api/seller/store/preview', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const business = await reqDb.getBusinessById(store.businessId);
  const products = await reqDb.getProductsByStoreId(store.id, false);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  res.json({
    store,
    business,
    products,
    categories,
    isPreviewMode: true,
  });
});

app.put('/api/seller/store', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const validated = storeUpdateSchema.parse(req.body);

    let cleanLogoUrl = validated.logoUrl;
    if (cleanLogoUrl && cleanLogoUrl.startsWith('data:image/')) {
      const saved = await uploadImageToStorage(cleanLogoUrl, {
        bucket: 'store-logos',
        userId: user.id,
        storeId: store.id,
        token: req.token,
      });
      cleanLogoUrl = saved.url;
    }

    await reqDb.updateBusiness(store.businessId, {
      ...(validated.businessName && { name: validated.businessName }),
      ...(validated.category && { category: validated.category }),
      ...(validated.instagram !== undefined && { instagram: validated.instagram.replace(/^@/, '').trim() }),
      ...(validated.whatsapp !== undefined && { whatsapp: validated.whatsapp.replace(/[^0-9]/g, '') }),
      ...(validated.phone !== undefined && { phone: validated.phone }),
      ...(validated.email !== undefined && { email: validated.email }),
      ...(validated.city !== undefined && { city: validated.city }),
      ...(validated.state !== undefined && { state: validated.state }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(cleanLogoUrl !== undefined && { logoUrl: cleanLogoUrl }),
    });

    const updatedStore = await reqDb.updateStore(store.id, {
      ...(validated.templateId && { templateId: validated.templateId }),
      ...(validated.colors && { colors: validated.colors }),
      ...(validated.tagline !== undefined && { tagline: validated.tagline }),
      ...(validated.announcement !== undefined && { announcement: validated.announcement }),
      ...(validated.aboutText !== undefined && { aboutText: validated.aboutText }),
    });

    const updatedBusiness = await reqDb.getBusinessById(store.businessId);

    res.json({
      message: 'Store settings updated successfully',
      store: updatedStore,
      business: updatedBusiness,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/seller/store/publish', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    if (store.status === 'suspended') {
      return res.status(403).json({
        error: 'Suspended stores cannot be published. Please contact platform support.',
        code: 'STORE_SUSPENDED',
      });
    }

    const oldStatus = store.status;
    const updated = await reqDb.updateStore(store.id, { status: 'published' });

    console.log(`[DIAGNOSTICS] /api/seller/store/publish:`, {
      authenticatedSellerId: user.id,
      resolvedStoreId: store.id,
      storeSlug: store.slug,
      oldStatus,
      newStatus: updated?.status,
      supabaseUpdateResult: updated?.status === 'published' ? 'SUCCESS' : 'FAILED',
    });

    await db.logAudit(user.id, 'STORE_PUBLISHED', 'store', store.id, { slug: store.slug });
    res.json({ message: 'Your store is now live!', store: updated });
  } catch (err) {
    next(err);
  }
});

app.post('/api/seller/store/unpublish', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    if (store.status === 'suspended') {
      return res.status(403).json({ error: 'Suspended stores cannot be modified directly.' });
    }

    const oldStatus = store.status;
    const updated = await reqDb.updateStore(store.id, { status: 'draft' });

    console.log(`[DIAGNOSTICS] /api/seller/store/unpublish:`, {
      authenticatedSellerId: user.id,
      resolvedStoreId: store.id,
      storeSlug: store.slug,
      oldStatus,
      newStatus: updated?.status,
      supabaseUpdateResult: updated?.status === 'draft' ? 'SUCCESS' : 'FAILED',
    });

    await db.logAudit(user.id, 'STORE_UNPUBLISHED', 'store', store.id, { slug: store.slug });
    res.json({ message: 'Store switched to draft mode.', store: updated });
  } catch (err) {
    next(err);
  }
});

app.get('/api/seller/check-slug', slugCheckLimiter, async (req: Request, res: Response) => {
  const rawSlug = String(req.query.slug || '').trim().toLowerCase();
  const excludeStoreId = req.query.excludeStoreId ? String(req.query.excludeStoreId) : undefined;

  if (!rawSlug) return res.status(400).json({ error: 'Slug parameter is required' });

  const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const isTaken = await db.isSlugTaken(cleanSlug, excludeStoreId);

  res.json({
    slug: cleanSlug,
    available: !isTaken,
  });
});

// ----------------------------------------------------
// PRODUCT MANAGEMENT (TENANT ISOLATED + 10 ACTIVE LIMIT)
// ----------------------------------------------------

app.get('/api/seller/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const products = await reqDb.getProductsByStoreId(store.id, false);
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive && !p.isSuspended).length;

  console.log(`[DIAGNOSTICS] /api/seller/products:`, {
    authenticatedSellerId: user.id,
    resolvedBusinessId: store.businessId,
    resolvedStoreId: store.id,
    mappedApiProductCount: totalProducts,
    activeProductCount: activeProducts,
  });

  res.json({
    products,
    totalProducts,
    activeProducts,
    totalCount: totalProducts,
    activeCount: activeProducts,
    maxLimit: 10,
  });
});

app.post('/api/seller/products', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const validated = productCreateSchema.parse(req.body);

    // Sanitize and persist any base64 images to Supabase Storage
    const cleanImages: string[] = [];
    if (Array.isArray(validated.images)) {
      for (const img of validated.images) {
        if (img.startsWith('data:image/')) {
          const saved = await uploadImageToStorage(img, {
            bucket: 'product-images',
            userId: user.id,
            storeId: store.id,
            token: req.token,
          });
          cleanImages.push(saved.url);
        } else {
          cleanImages.push(img);
        }
      }
    }

    const slug = `${validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

    const product = await reqDb.createProduct({
      businessId: store.businessId,
      storeId: store.id,
      name: validated.name,
      slug,
      sku: validated.sku || undefined,
      price: validated.price,
      compareAtPrice: validated.compareAtPrice || undefined,
      shortDescription: validated.shortDescription,
      description: validated.description,
      category: validated.category,
      images: cleanImages.length > 0 ? cleanImages : [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
      ],
      stockStatus: validated.stockStatus,
      isFeatured: validated.isFeatured,
      isActive: validated.isActive,
    });

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (err: any) {
    if (err.message && err.message.includes('maximum limit of 10 active products')) {
      return res.status(400).json({ error: err.message, code: 'PRODUCT_LIMIT_REACHED' });
    }
    next(err);
  }
});

app.put('/api/seller/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const product = await reqDb.getProductById(req.params.id);
    // Strict Tenant Isolation Check
    if (!product || product.storeId !== store.id) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const validated = productUpdateSchema.parse(req.body);

    let cleanImages: string[] | undefined = undefined;
    if (validated.images) {
      cleanImages = [];
      for (const img of validated.images) {
        if (img.startsWith('data:image/')) {
          const saved = await uploadImageToStorage(img, {
            bucket: 'product-images',
            userId: user.id,
            storeId: store.id,
            productId: product.id,
            token: req.token,
          });
          cleanImages.push(saved.url);
        } else {
          cleanImages.push(img);
        }
      }
    }

    // Whitelisted updates only - prevent overriding storeId, businessId, isSuspended
    const updated = await reqDb.updateProduct(req.params.id, {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.sku !== undefined && { sku: validated.sku || undefined }),
      ...(validated.price !== undefined && { price: validated.price }),
      ...(validated.compareAtPrice !== undefined && { compareAtPrice: validated.compareAtPrice || undefined }),
      ...(validated.shortDescription !== undefined && { shortDescription: validated.shortDescription }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.category !== undefined && { category: validated.category }),
      ...(cleanImages !== undefined && { images: cleanImages }),
      ...(validated.stockStatus !== undefined && { stockStatus: validated.stockStatus }),
      ...(validated.isFeatured !== undefined && { isFeatured: validated.isFeatured }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
    });

    res.json({ message: 'Product updated', product: updated });
  } catch (err: any) {
    if (err.message && err.message.includes('maximum limit of 10 active products')) {
      return res.status(400).json({ error: err.message, code: 'PRODUCT_LIMIT_REACHED' });
    }
    next(err);
  }
});

app.delete('/api/seller/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const product = await reqDb.getProductById(req.params.id);
  // Strict Tenant Isolation Check
  if (!product || product.storeId !== store.id) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await reqDb.deleteProduct(req.params.id);
  res.json({ message: 'Product deleted' });
});

app.post('/api/seller/products/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reqDb = req.db || db;
    const store = await reqDb.getStoreByUserId(user.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const product = await reqDb.getProductById(req.params.id);
    // Strict Tenant Isolation Check
    if (!product || product.storeId !== store.id) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const dup = await reqDb.duplicateProduct(req.params.id);
    res.json({ message: 'Product duplicated', product: dup });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// ANALYTICS (TENANT ISOLATED + SUPABASE PERSISTENT)
// ----------------------------------------------------

app.get('/api/seller/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const reqDb = req.db || db;
  const store = await reqDb.getStoreByUserId(user.id);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
  const summary = await reqDb.getAnalyticsSummary(store.id, Math.min(Math.max(days, 1), 90));

  res.json(summary);
});

// ----------------------------------------------------
// PUBLIC STOREFRONT & PUBLIC PRODUCT DETAILS (SAFE DTOs)
// ----------------------------------------------------

app.get('/api/public/store/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase().trim();
  const store = await db.getStoreBySlug(slug);

  console.log(`[DIAGNOSTICS] /api/public/store/:slug lookup:`, {
    requestedSlug: slug,
    matchingStoreId: store?.id || null,
    actualDatabaseStatus: store?.status || null,
  });

  if (!store) {
    return res.status(404).json({ error: 'Store not found', code: 'STORE_NOT_FOUND' });
  }

  // Strict Visibility Rules: Only 'published' stores are publicly visible
  if (store.status === 'suspended') {
    const biz = await db.getBusinessById(store.businessId);
    return res.status(403).json({
      error: 'This store is temporarily unavailable.',
      code: 'STORE_SUSPENDED',
      storeName: biz?.name || 'Store',
    });
  }

  if (store.status !== 'published') {
    return res.status(404).json({
      error: 'Store is currently in draft mode and not publicly available.',
      code: 'STORE_DRAFT',
    });
  }

  const business = await db.getBusinessById(store.businessId);
  const products = await db.getProductsByStoreId(store.id, true);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Record visit event asynchronously
  db.recordAnalyticsEvent({
    storeId: store.id,
    eventType: 'store_visit',
    referrer: (req.headers.referer || (req.headers.referrer as string) || '').slice(0, 300),
  }).catch(() => {});

  // Clean public DTO payload
  res.json({
    store: {
      id: store.id,
      slug: store.slug,
      templateId: store.templateId,
      status: store.status,
      colors: store.colors,
      tagline: store.tagline,
      announcement: store.announcement,
      aboutText: store.aboutText,
      isVerified: store.isVerified,
    },
    business: business ? {
      id: business.id,
      name: business.name,
      slug: business.slug,
      category: business.category,
      instagram: business.instagram,
      whatsapp: business.whatsapp,
      phone: business.phone,
      email: business.email,
      city: business.city,
      state: business.state,
      description: business.description,
      logoUrl: business.logoUrl,
    } : null,
    products,
    categories,
  });
});

app.get('/api/public/store/:slug/product/:productSlug', async (req: Request, res: Response) => {
  const { slug, productSlug } = req.params;
  const store = await db.getStoreBySlug(slug.toLowerCase().trim());

  if (!store) {
    return res.status(404).json({ error: 'Store not found', code: 'STORE_NOT_FOUND' });
  }

  if (store.status === 'suspended') {
    return res.status(403).json({ error: 'This store is temporarily unavailable.', code: 'STORE_SUSPENDED' });
  }

  if (store.status !== 'published') {
    return res.status(404).json({ error: 'Store is not published', code: 'STORE_DRAFT' });
  }

  const business = await db.getBusinessById(store.businessId);
  const product = await db.getProductBySlug(store.id, productSlug.toLowerCase().trim());

  if (!product || !product.isActive || product.isSuspended) {
    return res.status(404).json({ error: 'Product not found or unavailable', code: 'PRODUCT_NOT_FOUND' });
  }

  const allProds = await db.getProductsByStoreId(store.id, true);
  const related = allProds.filter((p) => p.id !== product.id).slice(0, 4);

  // Record product view
  db.recordAnalyticsEvent({
    storeId: store.id,
    productId: product.id,
    eventType: 'product_view',
  }).catch(() => {});

  res.json({
    store: {
      id: store.id,
      slug: store.slug,
      templateId: store.templateId,
      colors: store.colors,
      status: store.status,
    },
    business: business ? {
      name: business.name,
      whatsapp: business.whatsapp,
      city: business.city,
      logoUrl: business.logoUrl,
    } : null,
    product,
    relatedProducts: related,
  });
});

app.post('/api/public/track-event', analyticsLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = analyticsTrackSchema.parse(req.body);

    const store = await db.getStoreById(validated.storeId);
    if (!store || store.status !== 'published') {
      return res.status(400).json({ error: 'Invalid store for event tracking' });
    }

    if (validated.productId) {
      const prod = await db.getProductById(validated.productId);
      if (!prod || prod.storeId !== store.id) {
        return res.status(400).json({ error: 'Product does not belong to store' });
      }
    }

    const event = await db.recordAnalyticsEvent({
      storeId: validated.storeId,
      productId: validated.productId,
      eventType: validated.eventType,
      sessionId: validated.sessionId,
      referrer: (req.headers.referer || '').slice(0, 300),
    });

    res.json({ success: true, eventId: event.id });
  } catch (err) {
    next(err);
  }
});

app.post('/api/public/report-store', reportsLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = reportStoreSchema.parse(req.body);
    const store = await db.getStoreById(validated.storeId);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const report = await db.createReport({
      storeId: validated.storeId,
      productId: validated.productId,
      reason: validated.reason,
      description: validated.description,
      reporterEmail: validated.reporterEmail || undefined,
    });

    res.status(201).json({
      message: 'Thank you. Your report has been submitted to platform moderation for review.',
      reportId: report.id,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// IMAGE UPLOAD HANDLER (SUPABASE STORAGE MULTIPART UPLOADS)
// ----------------------------------------------------

app.post(
  '/api/upload/file',
  authMiddleware,
  storageUpload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const user = req.user!;
      const bucket = req.body.bucket === 'store-logos' ? 'store-logos' : 'product-images';
      const storeId = req.body.storeId || 'general';
      const productId = req.body.productId;

      const saved = await uploadBufferToStorage(
        req.file.buffer,
        req.file.mimetype,
        {
          bucket,
          userId: user.id,
          storeId,
          productId,
          token: req.token,
        },
        req.file.originalname
      );

      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Image upload failed' });
    }
  }
);

// ----------------------------------------------------
// ADMIN DASHBOARD & SECURITY AUDIT ROUTES
// ----------------------------------------------------

app.get('/api/admin/overview', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const overview = await db.getAdminOverview();
  res.json(overview);
});

app.get('/api/admin/stores', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const stores = await db.getAdminStoresList();
  res.json(stores);
});

app.post('/api/admin/stores/:id/status', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { status, adminNotes } = req.body;
  if (!['draft', 'published', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const store = await db.getStoreById(req.params.id);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const updated = await db.updateStore(req.params.id, { status });
  await db.logAudit(req.user!.id, 'ADMIN_STORE_STATUS_CHANGE', 'store', req.params.id, {
    newStatus: status,
    adminNotes,
  });

  res.json({ message: `Store status updated to ${status}`, store: updated });
});

app.post('/api/admin/products/:id/suspend', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { isSuspended } = req.body;
  const prod = await db.getProductById(req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const updated = await db.updateProduct(req.params.id, { isSuspended: Boolean(isSuspended) });
  await db.logAudit(req.user!.id, 'ADMIN_PRODUCT_SUSPEND_CHANGE', 'product', req.params.id, {
    isSuspended: Boolean(isSuspended),
  });

  res.json({ message: 'Product suspension status updated', product: updated });
});

app.get('/api/admin/reports', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const reports = await db.getReports();
  res.json(reports);
});

app.post('/api/admin/reports/:id/status', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!['pending', 'reviewed', 'action_taken', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid report status' });
  }

  const updated = await db.updateReportStatus(req.params.id, status, req.user!.id);
  if (!updated) return res.status(404).json({ error: 'Report not found' });

  res.json({ message: 'Report updated', report: updated });
});

app.get('/api/admin/settings', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const settings = await db.getPlatformSettings();
  res.json(settings);
});

app.put('/api/admin/settings', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = adminSettingsUpdateSchema.parse(req.body);
    const updated = await db.updatePlatformSettings(validated, req.user!.id);
    res.json({ message: 'Settings saved', settings: updated });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/audit-logs', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const logs = await db.getAuditLogs();
  res.json(logs);
});

// ----------------------------------------------------
// CENTRALIZED ERROR HANDLER (NO LEAKED STACK TRACES)
// ----------------------------------------------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.name === 'ZodError' && Array.isArray(err.errors)) {
    const firstIssue = err.errors[0];
    const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';
    return res.status(400).json({ error: message, details: err.errors });
  }

  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected server error occurred.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ----------------------------------------------------
// Vite Dev Server & Production SPA Fallback
// ----------------------------------------------------
async function startServer() {
  // Validate Supabase connection at startup
  const connectionCheck = await verifySupabaseConnection();
  console.log(`[Database] ${connectionCheck.message}`);

  // Seed demo auth accounts in Supabase Auth if service key is provided
  await ensureDemoUsersInSupabaseAuth().catch(() => {});

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MicroStore Production Server running on port ${PORT}`);
  });
}

startServer();
