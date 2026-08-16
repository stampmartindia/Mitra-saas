import { z } from 'zod';
import { BusinessCategory, StoreTemplateId, StockStatus } from '../src/types';

export const ALLOWED_CATEGORIES: [BusinessCategory, ...BusinessCategory[]] = [
  'Jewellery',
  'Fashion',
  'Handmade',
  'Gifts',
  'Beauty',
  'Bakery / Food',
  'Home Décor',
  'Crafts',
  'Accessories',
  'Other',
];

export const ALLOWED_TEMPLATES: [StoreTemplateId, ...StoreTemplateId[]] = [
  'jewellery-elegant',
  'fashion-modern',
  'handmade-warm',
  'beauty-minimal',
  'general-store',
];

export const ALLOWED_STOCK_STATUSES: [StockStatus, ...StockStatus[]] = [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'made_to_order',
];

export const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const paletteSchema = z.object({
  primary: z.string().regex(hexColorRegex, 'Invalid primary color hex code'),
  accent: z.string().regex(hexColorRegex, 'Invalid accent color hex code'),
  background: z.string().regex(hexColorRegex, 'Invalid background color hex code'),
  text: z.string().regex(hexColorRegex, 'Invalid text color hex code'),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug must be at least 3 characters')
    .max(40, 'Slug cannot exceed 40 characters')
    .regex(slugRegex, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  category: z.enum(ALLOWED_CATEGORIES),
  instagram: z.string().trim().max(60).optional().default(''),
  whatsapp: z
    .string()
    .trim()
    .min(10, 'WhatsApp number must contain at least 10 digits')
    .max(16, 'WhatsApp number is too long'),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
  logoUrl: z.string().trim().max(2000).optional().default(''),
  templateId: z.enum(ALLOWED_TEMPLATES).optional().default('jewellery-elegant'),
  colors: paletteSchema.optional(),
  tagline: z.string().trim().max(150).optional().default(''),
  firstProducts: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Product name required').max(150),
        price: z.coerce.number().min(0, 'Price must be 0 or higher'),
        compareAtPrice: z.coerce.number().min(0).optional(),
        category: z.string().trim().max(50).optional(),
        images: z.array(z.string().max(2000)).optional(),
        shortDescription: z.string().trim().max(300).optional(),
        description: z.string().trim().max(3000).optional(),
        sku: z.string().trim().max(50).optional(),
      })
    )
    .max(10, 'Initial products cannot exceed 10')
    .optional(),
});

export const storeUpdateSchema = z.object({
  businessName: z.string().trim().min(2).max(100).optional(),
  category: z.enum(ALLOWED_CATEGORIES).optional(),
  instagram: z.string().trim().max(60).optional(),
  whatsapp: z.string().trim().min(10).max(16).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
  logoUrl: z.string().trim().max(2000).optional(),
  templateId: z.enum(ALLOWED_TEMPLATES).optional(),
  colors: paletteSchema.optional(),
  tagline: z.string().trim().max(150).optional(),
  announcement: z.string().trim().max(250).optional(),
  aboutText: z.string().trim().max(2000).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(150),
  sku: z.string().trim().max(50).optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or greater').finite('Price must be a valid number'),
  compareAtPrice: z.coerce.number().min(0).finite().optional().nullable(),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().max(3000).optional().default(''),
  category: z.string().trim().max(50).optional().default('General'),
  images: z.array(z.string().max(2000)).max(8, 'Maximum 8 images per product').optional().default([]),
  stockStatus: z.enum(ALLOWED_STOCK_STATUSES).optional().default('in_stock'),
  isFeatured: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  sku: z.string().trim().max(50).optional().nullable(),
  price: z.coerce.number().min(0).finite().optional(),
  compareAtPrice: z.coerce.number().min(0).finite().optional().nullable(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  category: z.string().trim().max(50).optional(),
  images: z.array(z.string().max(2000)).max(8).optional(),
  stockStatus: z.enum(ALLOWED_STOCK_STATUSES).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const reportStoreSchema = z.object({
  storeId: z.string().trim().min(1, 'Store ID is required'),
  productId: z.string().trim().optional(),
  reason: z.enum(['spam', 'fraud', 'prohibited', 'misleading', 'other']),
  description: z.string().trim().min(5, 'Please provide more details in your report').max(1000),
  reporterEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
});

export const analyticsTrackSchema = z.object({
  storeId: z.string().trim().min(1),
  productId: z.string().trim().optional(),
  eventType: z.enum(['store_visit', 'product_view', 'whatsapp_click', 'share_click']),
  sessionId: z.string().trim().max(100).optional(),
});

export const adminSettingsUpdateSchema = z.object({
  platformName: z.string().trim().min(2).max(60).optional(),
  supportEmail: z.string().trim().email().optional(),
  defaultFreeProductLimit: z.coerce.number().int().min(1).max(50).optional(),
  footerBrandingText: z.string().trim().max(200).optional(),
  availableCategories: z.array(z.enum(ALLOWED_CATEGORIES)).min(1).optional(),
  enabledTemplates: z.array(z.enum(ALLOWED_TEMPLATES)).min(1).optional(),
});
