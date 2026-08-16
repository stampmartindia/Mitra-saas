-- ====================================================================
-- PHASE 1: COMPLETE DATABASE SCHEMA & SECURITY MIGRATION FOR MICROSTORE
-- Compatible with Supabase PostgreSQL (uuid-ossp / pgcrypto)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. UPDATED_AT TRIGGER FUNCTION (SECURE DEFINER)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ====================================================================
-- 2. PROFILES TABLE (Supabase Auth Integration)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Seller',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  onboarding_status TEXT NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 3. PLANS TABLE & SEED
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_active_products INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.plans (code, name, price_inr, max_active_products, is_active)
VALUES ('FREE', 'Free Starter', 0.00, 10, true)
ON CONFLICT (code) DO NOTHING;

-- ====================================================================
-- 4. BUSINESSES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  category TEXT NOT NULL CHECK (
    category IN (
      'Jewellery', 'Fashion', 'Handmade', 'Gifts', 'Beauty',
      'Bakery / Food', 'Home Décor', 'Crafts', 'Accessories', 'Other'
    )
  ),
  instagram TEXT DEFAULT '',
  whatsapp TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON public.businesses;
CREATE TRIGGER trg_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 5. STORES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  template_id TEXT NOT NULL DEFAULT 'jewellery-elegant' CHECK (
    template_id IN (
      'jewellery-elegant', 'fashion-modern', 'handmade-warm',
      'beauty-minimal', 'general-store'
    )
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
  primary_color TEXT NOT NULL DEFAULT '#b45309',
  accent_color TEXT NOT NULL DEFAULT '#fef3c7',
  background_color TEXT NOT NULL DEFAULT '#fffbeb',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  tagline TEXT DEFAULT '',
  announcement TEXT DEFAULT '',
  about_text TEXT DEFAULT '',
  header_image TEXT DEFAULT '',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_stores_updated_at ON public.stores;
CREATE TRIGGER trg_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 6. STORE SETTINGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  custom_domain TEXT UNIQUE,
  enable_inquiries BOOLEAN NOT NULL DEFAULT true,
  enable_reviews BOOLEAN NOT NULL DEFAULT false,
  whatsapp_number TEXT,
  analytics_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 7. PRODUCTS TABLE (Images normalized into public.product_images)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  sku TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (
    stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'made_to_order')
  ),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_store_product_slug UNIQUE (store_id, slug),
  CONSTRAINT unique_store_product UNIQUE (id, store_id)
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 8. PRODUCT IMAGES TABLE (CANONICAL STORAGE ENTITY & INTEGRITY ENFORCED)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fk_product_images_product_store FOREIGN KEY (product_id, store_id) REFERENCES public.products(id, store_id) ON DELETE CASCADE
);

-- ====================================================================
-- 9. ANALYTICS EVENTS TABLE (Backend Service-Role Ingestion)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('store_visit', 'product_view', 'whatsapp_click', 'share_click')
  ),
  session_id TEXT,
  ip_hash TEXT,
  referrer TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 10. STORE REPORTS TABLE (Backend Service-Role Ingestion)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.store_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (
    reason IN ('spam', 'fraud', 'prohibited', 'misleading', 'other')
  ),
  description TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewed', 'action_taken', 'dismissed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_store_reports_updated_at ON public.store_reports;
CREATE TRIGGER trg_store_reports_updated_at
BEFORE UPDATE ON public.store_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 11. AUDIT LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 12. PLATFORM SETTINGS TABLE & SEED
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL DEFAULT 'MicroStore',
  support_email TEXT NOT NULL DEFAULT 'support@microstore.live',
  default_free_product_limit INTEGER NOT NULL DEFAULT 10,
  footer_branding_text TEXT NOT NULL DEFAULT 'Powered by MicroStore',
  available_categories TEXT[] NOT NULL DEFAULT ARRAY[
    'Jewellery', 'Fashion', 'Handmade', 'Gifts', 'Beauty',
    'Bakery / Food', 'Home Décor', 'Crafts', 'Accessories', 'Other'
  ],
  enabled_templates TEXT[] NOT NULL DEFAULT ARRAY[
    'jewellery-elegant', 'fashion-modern', 'handmade-warm', 'beauty-minimal', 'general-store'
  ],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.platform_settings (
  platform_name,
  support_email,
  default_free_product_limit,
  footer_branding_text
)
SELECT 'MicroStore', 'support@microstore.live', 10, 'Powered by MicroStore'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- ====================================================================
-- 13. PERFORMANCE & INTEGRITY INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_business_id ON public.stores(business_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(store_id, is_active, is_suspended);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_store_id ON public.product_images(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_created ON public.analytics_events(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_store_reports_status ON public.store_reports(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ====================================================================
-- 14. ADMIN HELPER FUNCTION (SECURE DEFINER)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ====================================================================
-- 15. CROSS-TENANT INTEGRITY ENFORCEMENT TRIGGERS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.check_cross_tenant_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'stores' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = NEW.business_id AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Integrity violation: Target business does not belong to the store owner.';
    END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.businesses b ON b.id = s.business_id
      WHERE s.id = NEW.store_id
        AND b.id = NEW.business_id
        AND s.business_id = NEW.business_id
    ) THEN
      RAISE EXCEPTION 'Integrity violation: Product store and business do not belong to the same parent owner.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stores_cross_tenant_integrity ON public.stores;
CREATE TRIGGER trg_stores_cross_tenant_integrity
BEFORE INSERT OR UPDATE OF business_id, user_id ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.check_cross_tenant_integrity();

DROP TRIGGER IF EXISTS trg_products_cross_tenant_integrity ON public.products;
CREATE TRIGGER trg_products_cross_tenant_integrity
BEFORE INSERT OR UPDATE OF store_id, business_id ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_cross_tenant_integrity();

-- Product-Image Store Integrity Trigger
CREATE OR REPLACE FUNCTION public.check_product_image_store_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = NEW.product_id AND store_id = NEW.store_id
  ) THEN
    RAISE EXCEPTION 'Integrity violation: product_images.product_id does not belong to product_images.store_id.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_image_store_integrity ON public.product_images;
CREATE TRIGGER trg_product_image_store_integrity
BEFORE INSERT OR UPDATE OF product_id, store_id ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.check_product_image_store_integrity();

-- ====================================================================
-- 16. CONFIGURABLE & CONCURRENCY-SAFE PRODUCT LIMIT TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.check_active_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_active_count INTEGER;
  max_limit INTEGER;
BEGIN
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR OLD.is_active = false) THEN
    -- Acquire exclusive transaction lock on parent store to serialize concurrent product activations
    PERFORM 1 FROM public.stores WHERE id = NEW.store_id FOR UPDATE;

    -- Read configured max_active_products from FREE plan, with fallback to platform_settings or default 10
    SELECT COALESCE(
      (SELECT max_active_products FROM public.plans WHERE code = 'FREE' AND is_active = true LIMIT 1),
      (SELECT default_free_product_limit FROM public.platform_settings LIMIT 1),
      10
    ) INTO max_limit;

    SELECT COUNT(*) INTO current_active_count
    FROM public.products
    WHERE store_id = NEW.store_id
      AND is_active = true
      AND is_suspended = false
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF current_active_count >= max_limit THEN
      RAISE EXCEPTION 'Store has reached the maximum limit of % active products on the Free plan. Please deactivate an existing product first.', max_limit;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_active_product_limit ON public.products;
CREATE TRIGGER trg_enforce_active_product_limit
BEFORE INSERT OR UPDATE OF is_active ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_active_product_limit();

-- ====================================================================
-- 17. AUTH SIGNUP -> PROFILES SYNC (ROLE FIXED TO 'seller')
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, onboarding_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@user.supabase'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'Seller'), '@', 1), 'Seller'),
    'seller',
    'not_started'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE 
        WHEN public.profiles.name IS NULL OR public.profiles.name = '' OR public.profiles.name = 'Seller' 
        THEN EXCLUDED.name 
        ELSE public.profiles.name 
      END,
      updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- ====================================================================
-- 17.1 IDEMPOTENT BACKFILL FOR EXISTING AUTH USERS MISSING PROFILES
-- ====================================================================
INSERT INTO public.profiles (id, email, name, role, onboarding_status, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, u.id::text || '@user.supabase'),
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'Seller'), '@', 1), 'Seller'),
  'seller',
  'not_started',
  COALESCE(u.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 18. ROLE PRIVILEGE ESCALATION PREVENTION TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ====================================================================
-- 19. ROW LEVEL SECURITY (RLS) ENABLEMENT & POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- PROFILES RLS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ----------------------------------------------------
-- PLANS RLS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "plans_select_policy" ON public.plans;
CREATE POLICY "plans_select_policy" ON public.plans
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "plans_admin_manage_policy" ON public.plans;
CREATE POLICY "plans_admin_manage_policy" ON public.plans
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------
-- BUSINESSES RLS (OWNER/ADMIN ONLY)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
CREATE POLICY "businesses_select_policy" ON public.businesses
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
CREATE POLICY "businesses_insert_policy" ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
CREATE POLICY "businesses_update_policy" ON public.businesses
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;
CREATE POLICY "businesses_delete_policy" ON public.businesses
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------
-- STORES RLS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
CREATE POLICY "stores_select_policy" ON public.stores
  FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "stores_insert_policy" ON public.stores;
CREATE POLICY "stores_insert_policy" ON public.stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
CREATE POLICY "stores_update_policy" ON public.stores
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "stores_delete_policy" ON public.stores;
CREATE POLICY "stores_delete_policy" ON public.stores
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------
-- STORE SETTINGS RLS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "settings_select_policy" ON public.store_settings;
CREATE POLICY "settings_select_policy" ON public.store_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id
        AND (stores.status = 'published' OR stores.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "settings_manage_policy" ON public.store_settings;
CREATE POLICY "settings_manage_policy" ON public.store_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ----------------------------------------------------
-- PRODUCTS RLS (PUBLIC SELECT REQUIRES PUBLISHED STORE)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT
  USING (
    (
      is_active = true
      AND is_suspended = false
      AND EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = products.store_id
          AND stores.status = 'published'
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND stores.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "products_update_policy" ON public.products;
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ----------------------------------------------------
-- PRODUCT IMAGES RLS (STRICT STORE & PRODUCT OWNERSHIP)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "product_images_select_policy" ON public.product_images;
CREATE POLICY "product_images_select_policy" ON public.product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_images.product_id
        AND products.is_active = true
        AND products.is_suspended = false
        AND stores.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_images.store_id
        AND stores.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "product_images_insert_policy" ON public.product_images;
CREATE POLICY "product_images_insert_policy" ON public.product_images
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = product_images.store_id
          AND stores.user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id
          AND products.store_id = product_images.store_id
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "product_images_update_policy" ON public.product_images;
CREATE POLICY "product_images_update_policy" ON public.product_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_images.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = product_images.store_id
          AND stores.user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id
          AND products.store_id = product_images.store_id
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "product_images_delete_policy" ON public.product_images;
CREATE POLICY "product_images_delete_policy" ON public.product_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_images.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ----------------------------------------------------
-- ANALYTICS EVENTS RLS (OWNER/ADMIN SELECT ONLY, NO DIRECT CLIENT INSERT)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "analytics_insert_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_select_policy" ON public.analytics_events;
CREATE POLICY "analytics_select_policy" ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = analytics_events.store_id
        AND (stores.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ----------------------------------------------------
-- STORE REPORTS RLS (ADMIN ACCESS ONLY, NO DIRECT CLIENT INSERT)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "reports_insert_policy" ON public.store_reports;
DROP POLICY IF EXISTS "reports_select_policy" ON public.store_reports;
CREATE POLICY "reports_select_policy" ON public.store_reports
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "reports_update_policy" ON public.store_reports;
CREATE POLICY "reports_update_policy" ON public.store_reports
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reports_delete_policy" ON public.store_reports;
CREATE POLICY "reports_delete_policy" ON public.store_reports
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------
-- AUDIT LOGS RLS (ADMIN ONLY)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "audit_admin_policy" ON public.audit_logs;
CREATE POLICY "audit_admin_policy" ON public.audit_logs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------
-- PLATFORM SETTINGS RLS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "platform_settings_select_policy" ON public.platform_settings;
CREATE POLICY "platform_settings_select_policy" ON public.platform_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "platform_settings_update_policy" ON public.platform_settings;
CREATE POLICY "platform_settings_update_policy" ON public.platform_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================================
-- 20. SUPABASE STORAGE BUCKETS & STORAGE.OBJECTS RLS
-- ====================================================================
-- Ensure Storage buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('store-logos', 'store-logos', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ----------------------------------------------------
-- STORE-LOGOS BUCKET POLICIES (EXPLICIT BUCKET SCOPING)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "public_read_store_assets" ON storage.objects;
DROP POLICY IF EXISTS "sellers_upload_own_assets" ON storage.objects;
DROP POLICY IF EXISTS "sellers_update_own_assets" ON storage.objects;
DROP POLICY IF EXISTS "sellers_delete_own_assets" ON storage.objects;

DROP POLICY IF EXISTS "store_logos_public_read" ON storage.objects;
CREATE POLICY "store_logos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "store_logos_seller_insert" ON storage.objects;
CREATE POLICY "store_logos_seller_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_logos_seller_update" ON storage.objects;
CREATE POLICY "store_logos_seller_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'store-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_logos_seller_delete" ON storage.objects;
CREATE POLICY "store_logos_seller_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------
-- PRODUCT-IMAGES BUCKET POLICIES (EXPLICIT BUCKET SCOPING)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_seller_insert" ON storage.objects;
CREATE POLICY "product_images_seller_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product_images_seller_update" ON storage.objects;
CREATE POLICY "product_images_seller_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product_images_seller_delete" ON storage.objects;
CREATE POLICY "product_images_seller_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
