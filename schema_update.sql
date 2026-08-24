-- =====================================================================
-- AFINBO NIGERIA LTD - Database Schema Update & Demo Wipe Script
-- Platform: Supabase / PostgreSQL
-- Description:
--   1. Wipes demo product and quote records safely.
--   2. Ensures 'products' table uses quote-based model (NO pricing fields).
--   3. Creates/updates 'quotes' table for procurement inquiries.
--   4. Configures Row Level Security (RLS) policies and indexes.
-- =====================================================================

-- Step 1: Create or update the 'products' table (Quote-Based Model)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model_number TEXT,
    sku TEXT,
    brand TEXT DEFAULT 'AFINBO',
    category TEXT NOT NULL,
    short_description TEXT,
    product_overview TEXT,
    main_image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    technical_specs JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    in_the_box JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    is_best_seller BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure old pricing columns are removed if they existed previously
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE public.products DROP COLUMN price;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'compare_at_price') THEN
        ALTER TABLE public.products DROP COLUMN compare_at_price;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'currency') THEN
        ALTER TABLE public.products DROP COLUMN currency;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_on_sale') THEN
        ALTER TABLE public.products DROP COLUMN is_on_sale;
    END IF;
END $$;

-- Step 2: Create or update the 'quotes' table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    company_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    admin_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Step 3: Create or update 'admin_users' table for GAS / Supabase Authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- SHA-256 or bcrypt hash
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Step 4: Add Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON public.quotes (customer_email);

-- Step 5: Configure Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Products RLS: Public can read active products; Service role/Admins full access
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (status = 'active' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role has full access to products" ON public.products;
CREATE POLICY "Service role has full access to products"
    ON public.products FOR ALL
    USING (true)
    WITH CHECK (true);

-- Quotes RLS: Public can insert quote requests; Service role/Admins can read & update
DROP POLICY IF EXISTS "Public can submit quotes" ON public.quotes;
CREATE POLICY "Public can submit quotes"
    ON public.quotes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to quotes" ON public.quotes;
CREATE POLICY "Service role has full access to quotes"
    ON public.quotes FOR ALL
    USING (true)
    WITH CHECK (true);

-- Admin Users RLS
DROP POLICY IF EXISTS "Service role has full access to admin_users" ON public.admin_users;
CREATE POLICY "Service role has full access to admin_users"
    ON public.admin_users FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 6: Demo Data Wipe Procedure (Run to clear existing mock rows)
TRUNCATE TABLE public.quotes CASCADE;
TRUNCATE TABLE public.products CASCADE;

-- Insert Default Admin User (Password: AfinboAdmin2026! -> SHA-256)
-- Note: You can change the admin credentials anytime via GAS Script Properties or SQL
INSERT INTO public.admin_users (username, email, password_hash, full_name, role)
VALUES (
    'admin',
    'afinboproject@gmail.com',
    '33a0b8098c47f711204cf01ea64871e48110b9be032049ba3802e3b2e75e11f8', -- SHA256 of 'AfinboAdmin2026!'
    'AFINBO Master Administrator',
    'superadmin'
)
ON CONFLICT (username) DO NOTHING;

-- Verification query
SELECT 'products count' AS table_name, count(*) FROM public.products
UNION ALL
SELECT 'quotes count' AS table_name, count(*) FROM public.quotes
UNION ALL
SELECT 'admin_users count' AS table_name, count(*) FROM public.admin_users;
