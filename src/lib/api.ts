import {
  User,
  Business,
  Store,
  Product,
  AnalyticsSummary,
  StoreReport,
  AdminSettings,
} from '../types';
import { supabase } from './supabase';

const API_BASE = '/api';

// Listener for unrecoverable session expiry (401 after failed refresh)
type SessionExpiredHandler = (message: string) => void;
const sessionExpiredHandlers: Set<SessionExpiredHandler> = new Set();

export function onSessionExpired(handler: SessionExpiredHandler) {
  sessionExpiredHandlers.add(handler);
  return () => {
    sessionExpiredHandlers.delete(handler);
  };
}

export function notifySessionExpired(message: string = 'Your session expired. Please log in again.') {
  sessionExpiredHandlers.forEach((handler) => {
    try {
      handler(message);
    } catch {}
  });
}

/**
 * Retrieves the current valid Supabase access token directly from the active Supabase session.
 * Never reads from or writes to legacy/custom localStorage tokens.
 */
async function getActiveSupabaseToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

// Single-flight promise lock to prevent concurrent redundant refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshSupabaseSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.access_token) {
        return null;
      }
      return data.session.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Standard HTTP Request Interceptor:
 * - Dynamically attaches the current Supabase session access_token as `Authorization: Bearer <token>`
 * - Automatically attempts 1 session refresh on 401 Unauthorized
 * - On failed refresh, securely signs out of Supabase and triggers expiry notifications
 */
async function request<T>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
  const token = await getActiveSupabaseToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (Expired or Invalid Supabase Session)
  if (res.status === 401 && !isRetry) {
    // Attempt one automatic session refresh using Supabase Auth
    const refreshedToken = await refreshSupabaseSession();
    if (refreshedToken) {
      // Retry original request with newly refreshed token
      return request<T>(endpoint, options, true);
    } else {
      // Refresh failed: securely clear local session and notify context/UI
      try {
        await supabase.auth.signOut();
      } catch {}
      notifySessionExpired('Your session expired. Please log in again.');
      throw new Error('Your session expired. Please log in again.');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      try {
        await supabase.auth.signOut();
      } catch {}
      notifySessionExpired('Your session expired. Please log in again.');
    }
    throw new Error(data.error || 'An unexpected error occurred');
  }

  return data as T;
}

export const api = {
  // Auth
  async getMe() {
    return request<{
      user: User;
      hasStore: boolean;
      store?: Store;
      business?: Business;
    }>('/auth/me');
  },

  async resetPassword(email: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Seller Onboarding & Store
  async checkSlug(slug: string, excludeStoreId?: string) {
    const q = new URLSearchParams({ slug, ...(excludeStoreId && { excludeStoreId }) });
    return request<{ slug: string; available: boolean }>(`/seller/check-slug?${q.toString()}`);
  },

  async completeOnboarding(data: any) {
    return request<{ message: string; business: Business; store: Store }>('/seller/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSellerStore() {
    return request<{
      store: Store;
      business: Business;
      productCount: number;
      activeProductCount: number;
      totalProducts?: number;
      activeProducts?: number;
    }>('/seller/store');
  },

  async getStorePreview() {
    return request<{
      store: Store;
      business: Business;
      products: Product[];
      categories: string[];
      isPreviewMode: boolean;
    }>('/seller/store/preview');
  },

  async updateSellerStore(data: any) {
    return request<{ message: string; store: Store; business: Business }>('/seller/store', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async publishStore() {
    return request<{ message: string; store: Store }>('/seller/store/publish', {
      method: 'POST',
    });
  },

  async unpublishStore() {
    return request<{ message: string; store: Store }>('/seller/store/unpublish', {
      method: 'POST',
    });
  },

  // Products
  async getProducts() {
    return request<{
      products: Product[];
      totalCount: number;
      activeCount: number;
      totalProducts?: number;
      activeProducts?: number;
      maxLimit: number;
    }>('/seller/products');
  },

  async createProduct(data: Partial<Product>) {
    return request<{ message: string; product: Product }>('/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<Product>) {
    return request<{ message: string; product: Product }>(`/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string) {
    return request<{ message: string }>(`/seller/products/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicateProduct(id: string) {
    return request<{ message: string; product: Product }>(`/seller/products/${id}/duplicate`, {
      method: 'POST',
    });
  },

  // Analytics
  async getSellerAnalytics(days: number = 30) {
    return request<AnalyticsSummary>(`/seller/analytics?days=${days}`);
  },

  // Public Storefront
  async getPublicStore(slug: string) {
    return request<{
      store: Store;
      business: Business;
      products: Product[];
      categories: string[];
    }>(`/public/store/${slug}`);
  },

  async getPublicProduct(slug: string, productSlug: string) {
    return request<{
      store: Store;
      business: Business;
      product: Product;
      relatedProducts: Product[];
    }>(`/public/store/${slug}/product/${productSlug}`);
  },

  async trackEvent(storeId: string, eventType: string, productId?: string) {
    return request<{ success: boolean; eventId: string }>('/public/track-event', {
      method: 'POST',
      body: JSON.stringify({ storeId, eventType, productId }),
    });
  },

  async recordEvent(storeId: string, eventType: string, productId?: string) {
    return this.trackEvent(storeId, eventType, productId);
  },

  async reportStore(data: {
    storeId: string;
    productId?: string;
    reason: string;
    description: string;
    reporterEmail?: string;
  }) {
    return request<{ message: string; reportId: string }>('/public/report-store', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Multipart Image upload
  async uploadImageFile(
    file: File,
    bucket: 'store-logos' | 'product-images' = 'product-images',
    storeId?: string,
    productId?: string
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (storeId) formData.append('storeId', storeId);
    if (productId) formData.append('productId', productId);

    const token = await getActiveSupabaseToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/upload/file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload image file.');
    }

    return (await res.json()) as {
      url: string;
      storagePath: string;
      size: number;
      filename: string;
    };
  },

  // Admin
  async getAdminOverview() {
    return request<any>('/admin/overview');
  },

  async getAdminStats() {
    return this.getAdminOverview();
  },

  async getAdminStores() {
    return request<{ stores: any[] } | any>('/admin/stores');
  },

  async setStoreStatus(storeId: string, status: string, adminNotes?: string) {
    return request<{ message: string; store: Store }>(`/admin/stores/${storeId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  async updateStoreStatusByAdmin(storeId: string, status: string) {
    return this.setStoreStatus(storeId, status);
  },

  async toggleProductSuspend(productId: string, isSuspended: boolean) {
    return request<{ message: string; product: Product }>(`/admin/products/${productId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ isSuspended }),
    });
  },

  async getAdminReports() {
    return request<StoreReport[]>('/admin/reports');
  },

  async updateReportStatus(reportId: string, status: string) {
    return request<{ message: string; report: StoreReport }>(`/admin/reports/${reportId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminSettings() {
    return request<AdminSettings>('/admin/settings');
  },

  async updateAdminSettings(settings: Partial<AdminSettings>) {
    return request<{ message: string; settings: AdminSettings }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
