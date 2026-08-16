export type UserRole = 'seller' | 'admin';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboardingStatus?: OnboardingStatus;
  createdAt: string;
}

export type BusinessCategory =
  | 'Jewellery'
  | 'Fashion'
  | 'Handmade'
  | 'Gifts'
  | 'Beauty'
  | 'Bakery / Food'
  | 'Home Décor'
  | 'Crafts'
  | 'Accessories'
  | 'Other';

export type StoreTemplateId =
  | 'jewellery-elegant'
  | 'fashion-modern'
  | 'handmade-warm'
  | 'beauty-minimal'
  | 'general-store';

export type StoreStatus = 'draft' | 'published' | 'suspended';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';

export interface Business {
  id: string;
  userId: string;
  name: string;
  slug: string;
  category: BusinessCategory;
  instagram: string;
  whatsapp: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePalette {
  primary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Store {
  id: string;
  businessId: string;
  userId: string;
  slug: string;
  templateId: StoreTemplateId;
  status: StoreStatus;
  colors: StorePalette;
  tagline?: string;
  announcement?: string;
  aboutText?: string;
  headerImage?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  storeId: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  shortDescription?: string;
  description?: string;
  category: string;
  images: string[];
  stockStatus: StockStatus;
  isFeatured: boolean;
  isActive: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  storeVisits: number;
  productViews: number;
  whatsappClicks: number;
  activeProductsCount: number;
  topProduct?: {
    id: string;
    name: string;
    views: number;
    whatsappClicks: number;
  };
  dailyVisits: { date: string; visits: number; whatsappClicks: number }[];
}

export interface StoreReport {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId?: string;
  productName?: string;
  reason: 'spam' | 'fraud' | 'prohibited' | 'misleading' | 'other';
  description: string;
  reporterEmail?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
}

export interface AdminSettings {
  platformName: string;
  platformLogo?: string;
  supportEmail: string;
  defaultFreeProductLimit: number;
  footerBrandingText: string;
  availableCategories: BusinessCategory[];
  enabledTemplates: StoreTemplateId[];
}

export interface AdminStoreView {
  id: string;
  businessId: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  businessName: string;
  category: BusinessCategory;
  slug: string;
  status: StoreStatus;
  productCount: number;
  activeProductCount: number;
  whatsappClicks: number;
  visitors: number;
  createdAt: string;
  lastActive: string;
  adminNotes?: string;
}
