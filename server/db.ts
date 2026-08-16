import {
  User,
  Business,
  Store,
  Product,
  StoreReport,
  AdminSettings,
  AnalyticsSummary,
  OnboardingStatus,
  AdminStoreView,
  BusinessCategory,
  StoreTemplateId,
  StoreStatus,
  StockStatus,
} from '../src/types';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

export interface DBUser extends User {}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  createdAt: string;
}

// ----------------------------------------------------
// DTO MAPPERS (Database snake_case <-> Application camelCase)
// ----------------------------------------------------

function mapProfile(row: any): DBUser {
  return {
    id: row.id,
    name: row.name || 'Seller',
    email: row.email,
    role: (row.role as any) || 'seller',
    onboardingStatus: (row.onboarding_status as any) || 'not_started',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapBusiness(row: any): Business {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    category: row.category as BusinessCategory,
    instagram: row.instagram || '',
    whatsapp: row.whatsapp,
    phone: row.phone || row.whatsapp,
    email: row.email,
    city: row.city || '',
    state: row.state || '',
    description: row.description || '',
    logoUrl: row.logo_url || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapStore(row: any): Store {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    slug: row.slug,
    templateId: (row.template_id as StoreTemplateId) || 'jewellery-elegant',
    status: (row.status as StoreStatus) || 'draft',
    colors: {
      primary: row.primary_color || (row.colors?.primary) || '#b45309',
      accent: row.accent_color || (row.colors?.accent) || '#fef3c7',
      background: row.background_color || (row.colors?.background) || '#fffbeb',
      text: row.text_color || (row.colors?.text) || '#1f2937',
    },
    tagline: row.tagline || '',
    announcement: row.announcement || '',
    aboutText: row.about_text || '',
    headerImage: row.header_image || '',
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapProduct(row: any): Product {
  let images: string[] = [];
  if (Array.isArray(row.product_images) && row.product_images.length > 0) {
    images = [...row.product_images]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img: any) => (typeof img === 'string' ? img : img.public_url || img.storage_path))
      .filter(Boolean);
  } else if (Array.isArray(row.images)) {
    images = row.images.filter(Boolean);
  }

  return {
    id: row.id,
    businessId: row.business_id || row.businessId,
    storeId: row.store_id || row.storeId,
    name: row.name,
    slug: row.slug,
    sku: row.sku || undefined,
    price: Number(row.price),
    compareAtPrice:
      row.compare_at_price != null
        ? Number(row.compare_at_price)
        : row.compareAtPrice != null
        ? Number(row.compareAtPrice)
        : undefined,
    shortDescription: row.short_description || row.shortDescription || '',
    description: row.description || '',
    category: row.category || 'General',
    images,
    stockStatus: (row.stock_status || row.stockStatus || 'in_stock') as StockStatus,
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
    isActive: Boolean(row.is_active ?? row.isActive),
    isSuspended: Boolean(row.is_suspended ?? row.isSuspended),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function mapReport(row: any, storeName?: string, storeSlug?: string, prodName?: string): StoreReport {
  return {
    id: row.id,
    storeId: row.store_id,
    storeName: storeName || row.store_name || 'Store',
    storeSlug: storeSlug || row.store_slug || 'store',
    productId: row.product_id || undefined,
    productName: prodName || row.product_name || undefined,
    reason: row.reason,
    description: row.description,
    reporterEmail: row.reporter_email || undefined,
    status: row.status || 'pending',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapSettings(row: any): AdminSettings {
  return {
    platformName: row.platform_name || 'MicroStore',
    supportEmail: row.support_email || 'support@microstore.live',
    defaultFreeProductLimit: Number(row.default_free_product_limit) || 10,
    footerBrandingText: row.footer_branding_text || 'Powered by MicroStore',
    availableCategories: row.available_categories || [
      'Jewellery', 'Fashion', 'Handmade', 'Gifts', 'Beauty',
      'Bakery / Food', 'Home Décor', 'Crafts', 'Accessories', 'Other',
    ],
    enabledTemplates: row.enabled_templates || [
      'jewellery-elegant', 'fashion-modern', 'handmade-warm', 'beauty-minimal', 'general-store',
    ],
  };
}

// ----------------------------------------------------
// LOCAL FALLBACK IN-MEMORY STORE (Dev / Sandbox only)
// ----------------------------------------------------

interface InMemoryState {
  users: DBUser[];
  businesses: Business[];
  stores: Store[];
  products: Product[];
  analyticsEvents: {
    id: string;
    storeId: string;
    productId?: string;
    eventType: 'store_visit' | 'product_view' | 'whatsapp_click' | 'share_click';
    sessionId?: string;
    ipHash?: string;
    referrer?: string;
    createdAt: string;
  }[];
  reports: StoreReport[];
  settings: AdminSettings;
  auditLogs: AuditLogEntry[];
}

const localFallbackState: InMemoryState = {
  users: [
    {
      id: 'usr_aarohi',
      name: 'Aarohi Sharma',
      email: 'aarohi@example.com',
      role: 'seller',
      onboardingStatus: 'completed',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr_admin',
      name: 'Platform Admin',
      email: 'admin@microstore.in',
      role: 'admin',
      onboardingStatus: 'completed',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
  ],
  businesses: [
    {
      id: 'biz_aarohi',
      userId: 'usr_aarohi',
      name: 'Aarohi Silver Studio',
      slug: 'aarohi-silver',
      category: 'Jewellery',
      instagram: 'aarohisilvers',
      whatsapp: '919876543210',
      phone: '919876543210',
      email: 'contact@aarohisilvers.com',
      city: 'Jaipur',
      state: 'Rajasthan',
      description: 'Handcrafted 925 sterling silver jewelry made by artisans in Jaipur.',
      logoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  stores: [
    {
      id: 'store_aarohi',
      businessId: 'biz_aarohi',
      userId: 'usr_aarohi',
      slug: 'aarohi-silver',
      templateId: 'jewellery-elegant',
      status: 'published',
      colors: {
        primary: '#b45309',
        accent: '#fef3c7',
        background: '#fffbeb',
        text: '#1f2937',
      },
      tagline: 'Timeless Sterling Silver handcrafted with passion in Jaipur',
      announcement: '✨ Festive Season Offer: Free Silver Polish Cloth with every order!',
      aboutText: 'Welcome to Aarohi Silver Studio. Every piece is hallmarked 925 pure silver.',
      headerImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80',
      isVerified: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: 'prod_aarohi_1',
      businessId: 'biz_aarohi',
      storeId: 'store_aarohi',
      name: 'Kundan Choker Necklace with Pearls',
      slug: 'kundan-choker-necklace',
      sku: 'ARH-JW-001',
      price: 3499,
      compareAtPrice: 4299,
      shortDescription: 'Exquisite 925 silver kundan choker set with freshwater pearls.',
      description: 'Handcrafted with intricate meenakari work on reverse and 22k gold plating on pure silver.',
      category: 'Necklaces',
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
      ],
      stockStatus: 'in_stock',
      isFeatured: true,
      isActive: true,
      isSuspended: false,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  analyticsEvents: [
    {
      id: 'evt_1',
      storeId: 'store_aarohi',
      eventType: 'store_visit',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'evt_2',
      storeId: 'store_aarohi',
      productId: 'prod_aarohi_1',
      eventType: 'product_view',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  reports: [],
  settings: {
    platformName: 'MicroStore',
    supportEmail: 'support@microstore.live',
    defaultFreeProductLimit: 10,
    footerBrandingText: 'Powered by MicroStore',
    availableCategories: [
      'Jewellery', 'Fashion', 'Handmade', 'Gifts', 'Beauty',
      'Bakery / Food', 'Home Décor', 'Crafts', 'Accessories', 'Other',
    ],
    enabledTemplates: [
      'jewellery-elegant', 'fashion-modern', 'handmade-warm', 'beauty-minimal', 'general-store',
    ],
  },
  auditLogs: [],
};

// ----------------------------------------------------
// REPOSITORY LAYER (SUPABASE POSTGRESQL + LOCAL FALLBACK)
// ----------------------------------------------------

export class DatabaseRepository {
  private local: InMemoryState;
  private client: any;

  constructor(client?: any, localState?: InMemoryState) {
    this.client = client || supabaseAdmin;
    this.local = localState || localFallbackState;
  }

  /**
   * Returns a new DatabaseRepository scoped to the caller's Supabase client (e.g. carrying seller JWT).
   * Ensures PostgreSQL Row Level Security (RLS) evaluates auth.uid() = caller's user UUID.
   */
  withClient(client: any): DatabaseRepository {
    return new DatabaseRepository(client, this.local);
  }

  // ---------------- USER / PROFILES ----------------

  async findUserById(id: string): Promise<DBUser | null> {
    if (isSupabaseConfigured) {
      let { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!data && supabaseAdmin && this.client !== supabaseAdmin) {
        const adminCheck = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (adminCheck.data && !adminCheck.error) {
          data = adminCheck.data;
          error = null;
        }
      }

      if (!error && data) {
        return mapProfile(data);
      }
    }
    return this.local.users.find((u) => u.id === id) || null;
  }

  async findUserByEmail(email: string): Promise<DBUser | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured) {
      let { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!data && supabaseAdmin && this.client !== supabaseAdmin) {
        const adminCheck = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (adminCheck.data && !adminCheck.error) {
          data = adminCheck.data;
          error = null;
        }
      }

      if (!error && data) {
        return mapProfile(data);
      }
    }
    return this.local.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  /**
   * Securely guarantees that a verified Supabase Auth user (auth.users.id) has a corresponding
   * profile row in public.profiles.
   * - Strictly uses verified auth.users.id UUID. Never generates random IDs.
   * - Strictly assigns role = 'seller' (never trusting raw metadata or browser inputs for roles).
   * - Preserves existing profiles and existing roles if row is already present.
   * - Executed via supabaseAdmin (service role) to provision profile when trigger did not execute.
   */
  async ensureUserProfile(params: {
    id: string;
    name?: string;
    email: string;
  }): Promise<DBUser | null> {
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanName = (params.name || '').trim() || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Seller');

    if (isSupabaseConfigured) {
      try {
        // 1. Check if profile already exists in public.profiles
        const { data: existing, error: findError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .maybeSingle();

        if (existing && !findError) {
          return mapProfile(existing);
        }

        // 2. Insert missing profile via supabaseAdmin
        // Uses ON CONFLICT DO UPDATE preserving existing role
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              id: params.id,
              name: cleanName,
              email: cleanEmail,
              role: 'seller',
              onboarding_status: 'not_started',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (inserted && !insertError) {
          return mapProfile(inserted);
        }

        if (insertError) {
          console.error(`Error ensuring public.profiles row for auth user ${params.id}:`, insertError.message);
          return null;
        }
      } catch (err: any) {
        console.error(`Exception during ensureUserProfile for auth user ${params.id}:`, err.message);
        return null;
      }
    }

    // Local in-memory fallback only when Supabase is not configured
    let localUser = this.local.users.find((u) => u.id === params.id);
    if (!localUser) {
      localUser = {
        id: params.id,
        name: cleanName,
        email: cleanEmail,
        role: 'seller',
        onboardingStatus: 'not_started',
        createdAt: new Date().toISOString(),
      };
      this.local.users.push(localUser);
    }
    return localUser;
  }

  async createUser(
    name: string,
    email: string,
    role: 'seller' | 'admin' = 'seller',
    onboardingStatus: OnboardingStatus = 'not_started',
    id?: string
  ): Promise<DBUser> {
    const userId = id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              id: userId,
              name: name.trim(),
              email: cleanEmail,
              role,
              onboarding_status: onboardingStatus,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (!error && data) {
          return mapProfile(data);
        }
        if (error) console.warn('Supabase profile creation error:', error.message);
      } catch (err: any) {
        console.error('Supabase profile exception:', err.message);
      }
    }

    const localUser: DBUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role,
      onboardingStatus,
      createdAt: new Date().toISOString(),
    };
    this.local.users.push(localUser);
    return localUser;
  }

  async linkSupabaseUser(oldUserId: string, supabaseUserId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await this.client
          .from('businesses')
          .update({ user_id: supabaseUserId })
          .eq('user_id', oldUserId);

        await this.client
          .from('stores')
          .update({ user_id: supabaseUserId })
          .eq('user_id', oldUserId);
      } catch (e: any) {
        console.warn('Supabase user linking notice:', e.message);
      }
    }

    const user = this.local.users.find((u) => u.id === oldUserId);
    if (user) user.id = supabaseUserId;

    for (const biz of this.local.businesses) {
      if (biz.userId === oldUserId) biz.userId = supabaseUserId;
    }
    for (const st of this.local.stores) {
      if (st.userId === oldUserId) st.userId = supabaseUserId;
    }
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<DBUser, 'name' | 'email' | 'onboardingStatus'>>
  ): Promise<DBUser | null> {
    if (isSupabaseConfigured) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
      if (updates.onboardingStatus !== undefined) payload.onboarding_status = updates.onboardingStatus;

      const { data, error } = await this.client
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) return mapProfile(data);
    }

    const user = this.local.users.find((u) => u.id === id);
    if (!user) return null;
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email.toLowerCase().trim();
    if (updates.onboardingStatus !== undefined) user.onboardingStatus = updates.onboardingStatus;
    return user;
  }

  // ---------------- BUSINESS & STORE ----------------

  async getBusinessByUserId(userId: string): Promise<Business | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await this.client
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return mapBusiness(data);
    }
    return this.local.businesses.find((b) => b.userId === userId) || null;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    if (isSupabaseConfigured) {
      // Use supabaseAdmin or client to retrieve public business info safely
      const clientToUse = supabaseAdmin || this.client;
      const { data, error } = await clientToUse
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return mapBusiness(data);
    }
    return this.local.businesses.find((b) => b.id === id) || null;
  }

  async getStoreByUserId(userId: string): Promise<Store | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await this.client
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return mapStore(data);
    }
    return this.local.stores.find((s) => s.userId === userId) || null;
  }

  async getStoreById(id: string): Promise<Store | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await this.client
        .from('stores')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return mapStore(data);
    }
    return this.local.stores.find((s) => s.id === id) || null;
  }

  async getStoreBySlug(slug: string): Promise<Store | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (isSupabaseConfigured) {
      const clientToUse = supabaseAdmin || this.client;
      let { data, error } = await clientToUse
        .from('stores')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!error && data) return mapStore(data);
    }
    return this.local.stores.find((s) => s.slug.toLowerCase() === cleanSlug) || null;
  }

  async isSlugTaken(slug: string, excludeStoreId?: string): Promise<boolean> {
    const cleanSlug = slug.toLowerCase().trim();
    const RESERVED_SLUGS = ['admin', 'api', 'app', 'auth', 'dashboard', 'settings', 'public', 'login', 'signup', 'store', 'shop'];
    if (RESERVED_SLUGS.includes(cleanSlug)) return true;

    if (isSupabaseConfigured) {
      let query = this.client.from('stores').select('id').eq('slug', cleanSlug);
      if (excludeStoreId) {
        query = query.neq('id', excludeStoreId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return true;
    }

    return this.local.stores.some(
      (s) => s.slug.toLowerCase() === cleanSlug && s.id !== excludeStoreId
    );
  }

  async createBusinessAndStore(data: {
    userId: string;
    name: string;
    slug: string;
    category: BusinessCategory;
    instagram?: string;
    whatsapp: string;
    phone: string;
    email: string;
    city?: string;
    state?: string;
    description?: string;
    logoUrl?: string;
    templateId?: StoreTemplateId;
    colors?: { primary: string; accent: string; background: string; text: string };
    tagline?: string;
  }): Promise<{ business: Business; store: Store }> {
    const bizId = isSupabaseConfigured
      ? undefined
      : `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storeId = isSupabaseConfigured
      ? undefined
      : `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (isSupabaseConfigured) {
      // 1. Insert Business (Scoped to authenticated seller JWT where auth.uid() = user_id)
      const { data: bizData, error: bizError } = await this.client
        .from('businesses')
        .insert({
          user_id: data.userId,
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          category: data.category,
          instagram: data.instagram ? data.instagram.replace(/^@/, '').trim() : '',
          whatsapp: data.whatsapp.replace(/[^0-9]/g, ''),
          phone: data.phone || data.whatsapp,
          email: data.email.toLowerCase().trim(),
          city: data.city || '',
          state: data.state || '',
          description: data.description || '',
          logo_url: data.logoUrl || '',
        })
        .select()
        .single();

      if (bizError || !bizData) {
        throw new Error(`Failed to create business: ${bizError?.message || 'Database error'}`);
      }

      // 2. Insert Store (Scoped to authenticated seller JWT where auth.uid() = user_id)
      const { data: storeData, error: storeError } = await this.client
        .from('stores')
        .insert({
          business_id: bizData.id,
          user_id: data.userId,
          slug: data.slug.toLowerCase().trim(),
          template_id: data.templateId || 'jewellery-elegant',
          status: 'published',
          primary_color: data.colors?.primary || '#b45309',
          accent_color: data.colors?.accent || '#fef3c7',
          background_color: data.colors?.background || '#fffbeb',
          text_color: data.colors?.text || '#1f2937',
          tagline: data.tagline || '',
        })
        .select()
        .single();

      if (storeError || !storeData) {
        throw new Error(`Failed to create store: ${storeError?.message || 'Database error'}`);
      }

      // 3. Mark user onboarding completed
      await this.updateUser(data.userId, { onboardingStatus: 'completed' });

      return {
        business: mapBusiness(bizData),
        store: mapStore(storeData),
      };
    }

    // Local in-memory creation
    const business: Business = {
      id: bizId!,
      userId: data.userId,
      name: data.name.trim(),
      slug: data.slug.toLowerCase().trim(),
      category: data.category,
      instagram: data.instagram ? data.instagram.replace(/^@/, '').trim() : '',
      whatsapp: data.whatsapp.replace(/[^0-9]/g, ''),
      phone: data.phone || data.whatsapp,
      email: data.email.toLowerCase().trim(),
      city: data.city || '',
      state: data.state || '',
      description: data.description || '',
      logoUrl: data.logoUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store: Store = {
      id: storeId!,
      businessId: business.id,
      userId: data.userId,
      slug: data.slug.toLowerCase().trim(),
      templateId: data.templateId || 'jewellery-elegant',
      status: 'published',
      colors: data.colors || {
        primary: '#b45309',
        accent: '#fef3c7',
        background: '#fffbeb',
        text: '#1f2937',
      },
      tagline: data.tagline || '',
      announcement: '',
      aboutText: '',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.local.businesses.push(business);
    this.local.stores.push(store);
    await this.updateUser(data.userId, { onboardingStatus: 'completed' });

    return { business, store };
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    if (isSupabaseConfigured) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.instagram !== undefined) payload.instagram = updates.instagram;
      if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.state !== undefined) payload.state = updates.state;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;

      const { data, error } = await this.client
        .from('businesses')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`[DB] Error updating business ${id}:`, error.message);
        throw new Error(`Failed to update business in database: ${error.message}`);
      }

      if (!data) {
        console.error(`[DB] Business update returned no data (id=${id}). Verify RLS permissions.`);
        throw new Error(`Business update failed: Business ${id} not found or unauthorized`);
      }

      const cached = this.local.businesses.find((b) => b.id === id);
      if (cached) {
        Object.assign(cached, updates, { updatedAt: new Date().toISOString() });
      }

      return mapBusiness(data);
    }

    const biz = this.local.businesses.find((b) => b.id === id);
    if (!biz) return null;
    Object.assign(biz, updates, { updatedAt: new Date().toISOString() });
    return biz;
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
    if (isSupabaseConfigured) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.templateId !== undefined) payload.template_id = updates.templateId;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.tagline !== undefined) payload.tagline = updates.tagline;
      if (updates.announcement !== undefined) payload.announcement = updates.announcement;
      if (updates.aboutText !== undefined) payload.about_text = updates.aboutText;
      if (updates.headerImage !== undefined) payload.header_image = updates.headerImage;
      if (updates.isVerified !== undefined) payload.is_verified = updates.isVerified;
      if (updates.colors) {
        payload.primary_color = updates.colors.primary;
        payload.accent_color = updates.colors.accent;
        payload.background_color = updates.colors.background;
        payload.text_color = updates.colors.text;
      }

      const { data, error } = await this.client
        .from('stores')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`[DB] Error updating store ${id}:`, error.message);
        throw new Error(`Failed to update store in database: ${error.message}`);
      }

      if (!data) {
        console.error(`[DB] Store update returned no data (id=${id}). Verify RLS permissions.`);
        throw new Error(`Store update failed: Store ${id} not found or unauthorized`);
      }

      const cached = this.local.stores.find((s) => s.id === id);
      if (cached) {
        Object.assign(cached, updates, { updatedAt: new Date().toISOString() });
      }

      return mapStore(data);
    }

    const store = this.local.stores.find((s) => s.id === id);
    if (!store) return null;
    Object.assign(store, updates, { updatedAt: new Date().toISOString() });
    return store;
  }

  // ---------------- PRODUCTS & 10 ACTIVE LIMIT ----------------

  async getProductsByStoreId(storeId: string, publishedOnly: boolean = false): Promise<Product[]> {
    if (isSupabaseConfigured) {
      const clientToUse = supabaseAdmin || this.client;
      let query = clientToUse
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (publishedOnly) {
        query = query.eq('is_active', true).eq('is_suspended', false);
      }

      const { data: prodsData, error: prodsError } = await query;

      if (prodsError) {
        console.error(`[DB] Error fetching products for store ${storeId}:`, prodsError.message);
      } else if (prodsData) {
        let imagesByProdId: Record<string, any[]> = {};
        if (prodsData.length > 0) {
          const prodIds = prodsData.map((p: any) => p.id);
          const { data: imgData, error: imgError } = await clientToUse
            .from('product_images')
            .select('product_id, public_url, storage_path, sort_order')
            .in('product_id', prodIds)
            .order('sort_order', { ascending: true });

          if (imgError) {
            console.warn(`[DB] Warning: product_images query for store ${storeId}:`, imgError.message);
          } else if (imgData) {
            for (const img of imgData) {
              if (!imagesByProdId[img.product_id]) {
                imagesByProdId[img.product_id] = [];
              }
              imagesByProdId[img.product_id].push(img);
            }
          }
        }

        const mapped = prodsData.map((p: any) =>
          mapProduct({
            ...p,
            product_images: imagesByProdId[p.id] || [],
          })
        );
        return mapped;
      }
    }

    return this.local.products.filter((p) => {
      if (p.storeId !== storeId) return false;
      if (publishedOnly && (!p.isActive || p.isSuspended)) return false;
      return true;
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      const { data: prodData, error } = await this.client
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && prodData) {
        const { data: imgData, error: imgError } = await this.client
          .from('product_images')
          .select('product_id, public_url, storage_path, sort_order')
          .eq('product_id', prodData.id)
          .order('sort_order', { ascending: true });

        if (imgError) {
          console.warn(`[DB] Warning: product_images query for product ${id}:`, imgError.message);
        }

        return mapProduct({
          ...prodData,
          product_images: imgData || [],
        });
      }
    }
    return this.local.products.find((p) => p.id === id) || null;
  }

  async getProductBySlug(storeId: string, slug: string): Promise<Product | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (isSupabaseConfigured) {
      const clientToUse = supabaseAdmin || this.client;
      const { data: prodData, error } = await clientToUse
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!error && prodData) {
        const { data: imgData, error: imgError } = await clientToUse
          .from('product_images')
          .select('product_id, public_url, storage_path, sort_order')
          .eq('product_id', prodData.id)
          .order('sort_order', { ascending: true });

        if (imgError) {
          console.warn(`[DB] Warning: product_images query for slug ${slug}:`, imgError.message);
        }

        return mapProduct({
          ...prodData,
          product_images: imgData || [],
        });
      }
    }
    return this.local.products.find((p) => p.storeId === storeId && p.slug.toLowerCase() === cleanSlug) || null;
  }

  async getActiveProductCount(storeId: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { count, error } = await this.client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('is_active', true)
        .eq('is_suspended', false);

      if (!error && count !== null) return count;
    }

    return this.local.products.filter(
      (p) => p.storeId === storeId && p.isActive && !p.isSuspended
    ).length;
  }

  async createProduct(data: {
    businessId: string;
    storeId: string;
    name: string;
    slug: string;
    sku?: string;
    price: number;
    compareAtPrice?: number;
    shortDescription?: string;
    description?: string;
    category?: string;
    images?: string[];
    stockStatus?: StockStatus;
    isFeatured?: boolean;
    isActive?: boolean;
  }): Promise<Product> {
    const isActive = data.isActive ?? true;

    // Strict 10-active-product limit check
    if (isActive) {
      const currentActiveCount = await this.getActiveProductCount(data.storeId);
      if (currentActiveCount >= 10) {
        throw new Error('You have reached the maximum limit of 10 active products on the Free tier. Deactivate an existing product to add a new active one.');
      }
    }

    if (isSupabaseConfigured) {
      const { data: prodData, error } = await this.client
        .from('products')
        .insert({
          business_id: data.businessId,
          store_id: data.storeId,
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          sku: data.sku || null,
          price: data.price,
          compare_at_price: data.compareAtPrice ?? null,
          short_description: data.shortDescription || '',
          description: data.description || '',
          category: data.category || 'General',
          stock_status: data.stockStatus || 'in_stock',
          is_featured: data.isFeatured ?? false,
          is_active: isActive,
          is_suspended: false,
        })
        .select()
        .single();

      if (error || !prodData) {
        throw new Error(`Failed to create product: ${error?.message || 'Database error'}`);
      }

      let insertedImages: any[] = [];
      // Record canonical product_images entries
      if (Array.isArray(data.images) && data.images.length > 0) {
        insertedImages = data.images.map((url, idx) => ({
          product_id: prodData.id,
          store_id: data.storeId,
          storage_path: url,
          public_url: url,
          sort_order: idx,
        }));
        await this.client.from('product_images').insert(insertedImages);
      }

      return mapProduct({ ...prodData, product_images: insertedImages });
    }

    // Local fallback
    const product: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId: data.businessId,
      storeId: data.storeId,
      name: data.name.trim(),
      slug: data.slug.toLowerCase().trim(),
      sku: data.sku,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      category: data.category || 'General',
      images: data.images || [],
      stockStatus: data.stockStatus || 'in_stock',
      isFeatured: data.isFeatured ?? false,
      isActive,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.local.products.push(product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const existing = await this.getProductById(id);
    if (!existing) return null;

    // If activating an inactive product, verify active limit
    if (updates.isActive === true && !existing.isActive) {
      const currentActiveCount = await this.getActiveProductCount(existing.storeId);
      if (currentActiveCount >= 10) {
        throw new Error('Cannot activate product. You have reached the maximum limit of 10 active products on the Free tier.');
      }
    }

    if (isSupabaseConfigured) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.sku !== undefined) payload.sku = updates.sku;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.compareAtPrice !== undefined) payload.compare_at_price = updates.compareAtPrice;
      if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.stockStatus !== undefined) payload.stock_status = updates.stockStatus;
      if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.isSuspended !== undefined) payload.is_suspended = updates.isSuspended;

      const { data, error } = await this.client
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error || !data) {
        throw new Error(`Failed to update product: ${error?.message || 'Database error'}`);
      }

      // Update canonical product_images if provided
      let currentImages: any[] = [];
      if (updates.images !== undefined) {
        await this.client.from('product_images').delete().eq('product_id', id);
        if (Array.isArray(updates.images) && updates.images.length > 0) {
          currentImages = updates.images.map((url, idx) => ({
            product_id: id,
            store_id: existing.storeId,
            storage_path: url,
            public_url: url,
            sort_order: idx,
          }));
          await this.client.from('product_images').insert(currentImages);
        }
      } else {
        const { data: imgData } = await this.client
          .from('product_images')
          .select('public_url, storage_path, sort_order')
          .eq('product_id', id)
          .order('sort_order', { ascending: true });
        currentImages = imgData || [];
      }

      return mapProduct({ ...data, product_images: currentImages });
    }

    Object.assign(existing, updates, { updatedAt: new Date().toISOString() });
    return existing;
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      await this.client.from('product_images').delete().eq('product_id', id);
      const { error } = await this.client.from('products').delete().eq('id', id);
      return !error;
    }

    const idx = this.local.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.local.products.splice(idx, 1);
      return true;
    }
    return false;
  }

  async duplicateProduct(id: string): Promise<Product | null> {
    const original = await this.getProductById(id);
    if (!original) return null;

    const currentActiveCount = await this.getActiveProductCount(original.storeId);
    const shouldBeActive = currentActiveCount < 10;

    const duplicateSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    return this.createProduct({
      businessId: original.businessId,
      storeId: original.storeId,
      name: `${original.name} (Copy)`,
      slug: duplicateSlug,
      sku: original.sku ? `${original.sku}-COPY` : undefined,
      price: original.price,
      compareAtPrice: original.compareAtPrice,
      shortDescription: original.shortDescription,
      description: original.description,
      category: original.category,
      images: [...original.images],
      stockStatus: original.stockStatus,
      isFeatured: false,
      isActive: shouldBeActive,
    });
  }

  // ---------------- ANALYTICS & EVENTS ----------------

  async recordAnalyticsEvent(event: {
    storeId: string;
    productId?: string;
    eventType: 'store_visit' | 'product_view' | 'whatsapp_click' | 'share_click';
    sessionId?: string;
    referrer?: string;
  }): Promise<{ id: string }> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('analytics_events')
        .insert({
          store_id: event.storeId,
          product_id: event.productId || null,
          event_type: event.eventType,
          session_id: event.sessionId || null,
          referrer: event.referrer || '',
        })
        .select('id')
        .single();

      if (!error && data) return { id: data.id };
    }

    const newEvt = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeId: event.storeId,
      productId: event.productId,
      eventType: event.eventType,
      sessionId: event.sessionId,
      referrer: event.referrer,
      createdAt: new Date().toISOString(),
    };
    this.local.analyticsEvents.push(newEvt);
    return { id: newEvt.id };
  }

  async getAnalyticsSummary(storeId: string, days: number = 30): Promise<AnalyticsSummary> {
    const cutoff = new Date(Date.now() - days * 86400000);

    let events: any[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', cutoff.toISOString());

      if (data) events = data;
    } else {
      events = this.local.analyticsEvents.filter(
        (e) => e.storeId === storeId && new Date(e.createdAt) >= cutoff
      );
    }

    const storeVisits = events.filter((e) => e.event_type === 'store_visit' || e.eventType === 'store_visit').length;
    const productViews = events.filter((e) => e.event_type === 'product_view' || e.eventType === 'product_view').length;
    const whatsappClicks = events.filter((e) => e.event_type === 'whatsapp_click' || e.eventType === 'whatsapp_click').length;
    const activeProductsCount = await this.getActiveProductCount(storeId);

    // Calculate product view counts
    const productViewMap = new Map<string, { views: number; clicks: number }>();
    for (const evt of events) {
      const pid = evt.product_id || evt.productId;
      const type = evt.event_type || evt.eventType;
      if (pid) {
        const curr = productViewMap.get(pid) || { views: 0, clicks: 0 };
        if (type === 'product_view') curr.views += 1;
        if (type === 'whatsapp_click') curr.clicks += 1;
        productViewMap.set(pid, curr);
      }
    }

    let topProduct: AnalyticsSummary['topProduct'] | undefined = undefined;
    let maxViews = -1;
    for (const [pid, stats] of productViewMap.entries()) {
      if (stats.views > maxViews) {
        maxViews = stats.views;
        const prod = await this.getProductById(pid);
        if (prod) {
          topProduct = {
            id: prod.id,
            name: prod.name,
            views: stats.views,
            whatsappClicks: stats.clicks,
          };
        }
      }
    }

    // Daily breakdown for charts
    const dailyMap = new Map<string, { visits: number; whatsappClicks: number }>();
    for (let i = 0; i < Math.min(days, 14); i++) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap.set(dateKey, { visits: 0, whatsappClicks: 0 });
    }

    for (const evt of events) {
      const dateKey = (evt.created_at || evt.createdAt || '').split('T')[0];
      const type = evt.event_type || evt.eventType;
      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey)!;
        if (type === 'store_visit') item.visits += 1;
        if (type === 'whatsapp_click') item.whatsappClicks += 1;
      }
    }

    const dailyVisits = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visits: counts.visits,
        whatsappClicks: counts.whatsappClicks,
      }))
      .reverse();

    return {
      storeVisits,
      productViews,
      whatsappClicks,
      activeProductsCount,
      topProduct,
      dailyVisits,
    };
  }

  // ---------------- REPORTS & MODERATION ----------------

  async createReport(data: {
    storeId: string;
    productId?: string;
    reason: 'spam' | 'fraud' | 'prohibited' | 'misleading' | 'other';
    description: string;
    reporterEmail?: string;
  }): Promise<StoreReport> {
    const store = await this.getStoreById(data.storeId);
    const prod = data.productId ? await this.getProductById(data.productId) : null;

    if (isSupabaseConfigured) {
      const { data: repData, error } = await supabaseAdmin
        .from('store_reports')
        .insert({
          store_id: data.storeId,
          product_id: data.productId || null,
          reason: data.reason,
          description: data.description,
          reporter_email: data.reporterEmail || null,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && repData) {
        return mapReport(repData, store?.slug, store?.slug, prod?.name);
      }
    }

    const report: StoreReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeId: data.storeId,
      storeName: store?.slug || 'Store',
      storeSlug: store?.slug || 'store',
      productId: data.productId,
      productName: prod?.name,
      reason: data.reason,
      description: data.description,
      reporterEmail: data.reporterEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.local.reports.push(report);
    return report;
  }

  async getReports(): Promise<StoreReport[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabaseAdmin
        .from('store_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        return Promise.all(
          data.map(async (row) => {
            const store = await this.getStoreById(row.store_id);
            const prod = row.product_id ? await this.getProductById(row.product_id) : null;
            return mapReport(row, store?.slug, store?.slug, prod?.name);
          })
        );
      }
    }
    return this.local.reports;
  }

  async updateReportStatus(id: string, status: StoreReport['status'], actorId: string): Promise<StoreReport | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('store_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        await this.logAudit(actorId, 'UPDATE_REPORT_STATUS', 'report', id, { newStatus: status });
        return mapReport(data);
      }
    }

    const report = this.local.reports.find((r) => r.id === id);
    if (!report) return null;
    report.status = status;
    await this.logAudit(actorId, 'UPDATE_REPORT_STATUS', 'report', id, { newStatus: status });
    return report;
  }

  // ---------------- AUDIT LOGS ----------------

  async logAudit(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('audit_logs').insert({
          actor_user_id: actorId,
          action,
          target_type: targetType,
          target_id: targetId,
          metadata: details || {},
        });
        return;
      } catch (e: any) {
        console.warn('Audit log write note:', e.message);
      }
    }

    this.local.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorId,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    });
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        return data.map((row) => ({
          id: row.id,
          actorId: row.actor_user_id || 'system',
          action: row.action,
          targetType: row.target_type,
          targetId: row.target_id,
          details: row.metadata || {},
          createdAt: row.created_at,
        }));
      }
    }
    return this.local.auditLogs;
  }

  // ---------------- PLATFORM SETTINGS ----------------

  async getPlatformSettings(): Promise<AdminSettings> {
    if (isSupabaseConfigured) {
      const { data } = await supabaseAdmin
        .from('platform_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) return mapSettings(data);
    }
    return this.local.settings;
  }

  async updatePlatformSettings(updates: Partial<AdminSettings>, actorId: string): Promise<AdminSettings> {
    if (isSupabaseConfigured) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.platformName) payload.platform_name = updates.platformName;
      if (updates.supportEmail) payload.support_email = updates.supportEmail;
      if (updates.defaultFreeProductLimit) payload.default_free_product_limit = updates.defaultFreeProductLimit;
      if (updates.footerBrandingText) payload.footer_branding_text = updates.footerBrandingText;
      if (updates.availableCategories) payload.available_categories = updates.availableCategories;
      if (updates.enabledTemplates) payload.enabled_templates = updates.enabledTemplates;

      await supabaseAdmin.from('platform_settings').update(payload).neq('id', '00000000-0000-0000-0000-000000000000');
      await this.logAudit(actorId, 'ADMIN_SETTINGS_UPDATED', 'settings', 'global', updates);
      return this.getPlatformSettings();
    }

    Object.assign(this.local.settings, updates);
    await this.logAudit(actorId, 'ADMIN_SETTINGS_UPDATED', 'settings', 'global', updates);
    return this.local.settings;
  }

  // ---------------- ADMIN DASHBOARD VIEWS ----------------

  async getAdminOverview(): Promise<{
    totalStores: number;
    publishedStores: number;
    draftStores: number;
    suspendedStores: number;
    totalProducts: number;
    activeProducts: number;
    totalWhatsappClicks: number;
    totalVisits: number;
    pendingReports: number;
  }> {
    if (isSupabaseConfigured) {
      const { count: totalStores } = await supabaseAdmin.from('stores').select('*', { count: 'exact', head: true });
      const { count: publishedStores } = await supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: draftStores } = await supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'draft');
      const { count: suspendedStores } = await supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'suspended');
      const { count: totalProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
      const { count: activeProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_suspended', false);
      const { count: totalWhatsappClicks } = await supabaseAdmin.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'whatsapp_click');
      const { count: totalVisits } = await supabaseAdmin.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'store_visit');
      const { count: pendingReports } = await supabaseAdmin.from('store_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      return {
        totalStores: totalStores || 0,
        publishedStores: publishedStores || 0,
        draftStores: draftStores || 0,
        suspendedStores: suspendedStores || 0,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalWhatsappClicks: totalWhatsappClicks || 0,
        totalVisits: totalVisits || 0,
        pendingReports: pendingReports || 0,
      };
    }

    const stores = this.local.stores;
    const prods = this.local.products;
    const evts = this.local.analyticsEvents;

    return {
      totalStores: stores.length,
      publishedStores: stores.filter((s) => s.status === 'published').length,
      draftStores: stores.filter((s) => s.status === 'draft').length,
      suspendedStores: stores.filter((s) => s.status === 'suspended').length,
      totalProducts: prods.length,
      activeProducts: prods.filter((p) => p.isActive && !p.isSuspended).length,
      totalWhatsappClicks: evts.filter((e) => e.eventType === 'whatsapp_click').length,
      totalVisits: evts.filter((e) => e.eventType === 'store_visit').length,
      pendingReports: this.local.reports.filter((r) => r.status === 'pending').length,
    };
  }

  async getAdminStoresList(): Promise<AdminStoreView[]> {
    let stores: Store[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabaseAdmin.from('stores').select('*').order('created_at', { ascending: false });
      if (data) stores = data.map(mapStore);
    } else {
      stores = this.local.stores;
    }

    return Promise.all(
      stores.map(async (st) => {
        const biz = await this.getBusinessById(st.businessId);
        const owner = await this.findUserById(st.userId);
        const prods = await this.getProductsByStoreId(st.id, false);
        const activeProds = prods.filter((p) => p.isActive && !p.isSuspended);

        return {
          id: st.id,
          businessId: st.businessId,
          sellerId: st.userId,
          sellerName: owner?.name || 'Seller',
          sellerEmail: owner?.email || '',
          businessName: biz?.name || 'Business',
          category: biz?.category || 'General' as any,
          slug: st.slug,
          status: st.status,
          productCount: prods.length,
          activeProductCount: activeProds.length,
          whatsappClicks: 0,
          visitors: 0,
          createdAt: st.createdAt,
          lastActive: st.updatedAt,
        };
      })
    );
  }

  // Compatibility helper for legacy state inspection
  getState() {
    return this.local;
  }
}

export const db = new DatabaseRepository();
