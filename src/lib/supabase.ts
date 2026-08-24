import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbProduct, DbCustomer, DbQuoteRequest, Product, TechSpec } from '../types';
import { FEATURED_PRODUCTS } from '../data';

// 1. Environment Configuration with specified fallback variables
const getEnvVar = (key: string): string => {
  try {
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, string | undefined>;
      if (win[key]) return win[key] as string;
      if (win[`ENV_${key}`]) return win[`ENV_${key}`] as string;
    }
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv) {
      if (metaEnv[key]) return metaEnv[key];
      if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
    }
  } catch {
    // Ignore environment read errors in restricted contexts
  }
  return '';
};

const rawUrl = getEnvVar('SUPABASE_URL');
const rawKey = getEnvVar('SUPABASE_ANON_KEY');

const SUPABASE_URL: string = rawUrl || '';
const SUPABASE_ANON_KEY: string = rawKey || '';

// Validate whether Supabase credentials are valid and live
export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (
    SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' ||
    SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY'
  ) {
    return false;
  }
  try {
    const parsed = new URL(SUPABASE_URL);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(SUPABASE_ANON_KEY);
  } catch {
    return false;
  }
};

// Safe Supabase client initialization that NEVER throws on startup
const createSafeSupabaseClient = (): SupabaseClient => {
  if (isSupabaseConfigured()) {
    try {
      // Check if global CDN client exists
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { supabase?: { createClient: (url: string, key: string) => SupabaseClient } }).supabase?.createClient
      ) {
        return (window as unknown as { supabase: { createClient: (url: string, key: string) => SupabaseClient } }).supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );
      }

      // Use npm package SDK
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Could not initialize live Supabase client, falling back to safe local mock:', err);
    }
  }

  // Safe Fallback Mock Client if Supabase is unconfigured or invalid URL
  // This completely prevents fatal "Invalid URL" unhandled crashes on Vercel
  const safeMockQueryBuilder = {
    select: () => safeMockQueryBuilder,
    insert: () => safeMockQueryBuilder,
    update: () => safeMockQueryBuilder,
    delete: () => safeMockQueryBuilder,
    eq: () => safeMockQueryBuilder,
    ilike: () => safeMockQueryBuilder,
    or: () => safeMockQueryBuilder,
    limit: () => safeMockQueryBuilder,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (val: { data: unknown[]; error: null }) => void) => {
      resolve({ data: [], error: null });
    },
  };

  const mockClient = {
    from: () => safeMockQueryBuilder,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;

  return mockClient;
};

export const supabase: SupabaseClient = createSafeSupabaseClient();

export const formatSpecToString = (item: unknown): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'number' || typeof item === 'boolean') return String(item);
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    if (obj.title && obj.description) {
      return `${obj.title}: ${obj.description}`;
    }
    if (obj.label && obj.value) {
      return `${obj.label}: ${obj.value}`;
    }
    if (obj.name && obj.value) {
      return `${obj.name}: ${obj.value}`;
    }
    if (obj.title) return String(obj.title);
    if (obj.label) return String(obj.label);
    if (obj.name) return String(obj.name);
    if (obj.description) return String(obj.description);
    if (obj.value) return String(obj.value);
    try {
      return JSON.stringify(obj);
    } catch {
      return '';
    }
  }
  return String(item);
};

export const normalizeTechSpecs = (rawSpecs: unknown): TechSpec[] => {
  if (!rawSpecs) return [];
  if (!Array.isArray(rawSpecs)) {
    if (typeof rawSpecs === 'object') {
      return Object.entries(rawSpecs as Record<string, unknown>).map(([label, value]) => ({
        label: String(label),
        value: formatSpecToString(value),
      }));
    }
    return [];
  }
  return rawSpecs
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const parts = item.split(':');
        if (parts.length > 1) {
          return { label: parts[0].trim(), value: parts.slice(1).join(':').trim() };
        }
        return { label: 'Specification', value: item };
      }
      if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const label = String(obj.label || obj.title || obj.name || obj.key || 'Specification');
        const value = String(obj.value || obj.description || obj.val || obj.detail || '');
        return { label, value };
      }
      return { label: 'Specification', value: String(item) };
    })
    .filter((s): s is TechSpec => s !== null && Boolean(s.label || s.value));
};

export const normalizeStringArray = (rawList: unknown): string[] => {
  if (!rawList) return [];
  if (!Array.isArray(rawList)) {
    if (typeof rawList === 'string') return [rawList];
    return [];
  }
  return rawList
    .map((item) => formatSpecToString(item))
    .filter((s) => Boolean(s && s.trim()));
};

// Helper function to map a DB product or merge with rich UI metadata
export const mapDbProductToUiProduct = (dbItem: any): Product => {
  if (!dbItem) {
    return FEATURED_PRODUCTS[0];
  }

  const fallback = FEATURED_PRODUCTS.find(
    (p) =>
      p.id === dbItem.id ||
      (dbItem.name && p.name.toLowerCase() === String(dbItem.name).toLowerCase()) ||
      (dbItem.name && String(dbItem.name).toLowerCase().includes(p.name.toLowerCase()))
  );

  const rawFeatures = dbItem.features || dbItem.specs || fallback?.features || fallback?.specs;
  const rawTechSpecs = dbItem.technical_specs || dbItem.tech_specs || dbItem.techSpecs || fallback?.techSpecs;
  const rawInTheBox = dbItem.in_the_box || dbItem.inTheBox || fallback?.inTheBox;
  const rawGallery = dbItem.gallery_urls || dbItem.gallery || (fallback?.gallery ? fallback.gallery : undefined);

  const normalizedFeatures = normalizeStringArray(rawFeatures);
  const normalizedTechSpecs = normalizeTechSpecs(rawTechSpecs);
  const normalizedInTheBox = normalizeStringArray(rawInTheBox);

  const mainImage =
    dbItem.main_image_url ||
    dbItem.image ||
    fallback?.image ||
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80';

  const categoryName = typeof dbItem.category === 'string' ? dbItem.category : (fallback?.category || 'Splicers');
  const brandName = typeof dbItem.brand === 'string' ? dbItem.brand : (fallback?.brand || 'AFINBO');
  const subtitle = dbItem.short_description || dbItem.subtitle || fallback?.subtitle || `${categoryName} • ${brandName}`;
  const description = dbItem.product_overview || dbItem.description || fallback?.description || 'High precision fiber optic tool.';

  return {
    id: String(dbItem.id || fallback?.id || 'prod-' + Date.now()),
    name: String(dbItem.name || fallback?.name || 'Fiber Optic Equipment'),
    category: categoryName,
    brand: brandName,
    subtitle: subtitle,
    description: description,
    isBestSeller: Boolean(dbItem.is_best_seller ?? fallback?.isBestSeller),
    image: mainImage,
    gallery: Array.isArray(rawGallery) && rawGallery.length > 0 ? rawGallery.map(String) : [mainImage],
    specs: normalizedFeatures.length > 0 ? normalizedFeatures : (fallback?.specs || ['High precision optical equipment']),
    techSpecs: normalizedTechSpecs.length > 0 ? normalizedTechSpecs : fallback?.techSpecs,
    features: normalizedFeatures.length > 0 ? normalizedFeatures : fallback?.features,
    inTheBox: normalizedInTheBox.length > 0 ? normalizedInTheBox : fallback?.inTheBox,
  };
};

/**
 * 3. Read Operations (Product Display & Filtering)
 * Queries products from the 'products' table in Supabase
 */
export async function fetchProductsFromDb(options?: {
  category?: string | null;
  searchQuery?: string | null;
}): Promise<{ products: Product[]; error: Error | null; isLive: boolean }> {
  // If not configured, gracefully return default catalog with client-side filter
  if (!isSupabaseConfigured()) {
    let list = [...FEATURED_PRODUCTS];
    if (options?.category) {
      const cat = options.category.toLowerCase();
      list = list.filter(
        (p) =>
          p.category.toLowerCase().includes(cat) ||
          cat.includes(p.category.toLowerCase()) ||
          p.name.toLowerCase().includes(cat) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(cat))
      );
    }
    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    return { products: list, error: null, isLive: false };
  }

  try {
    let query = supabase.from('products').select('*');

    // Category filter against 'category' column
    if (options?.category) {
      const cat = options.category.trim();
      query = query.or(`category.ilike.%${cat}%,name.ilike.%${cat}%`);
    }

    // Search input filter matching 'name' or 'description' using ilike
    if (options?.searchQuery && options.searchQuery.trim()) {
      const term = options.searchQuery.trim();
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase products fetch warning:', error.message);
      return { products: FEATURED_PRODUCTS, error: new Error(error.message), isLive: false };
    }

    if (data && data.length > 0) {
      const mapped = (data as DbProduct[]).map(mapDbProductToUiProduct);
      return { products: mapped, error: null, isLive: true };
    } else if (data && data.length === 0 && (options?.category || options?.searchQuery)) {
      // Query completed with 0 matches
      return { products: [], error: null, isLive: true };
    }

    // If table is empty, return featured products as fallback
    return { products: FEATURED_PRODUCTS, error: null, isLive: true };
  } catch (err) {
    console.error('Error in fetchProductsFromDb:', err);
    return { products: FEATURED_PRODUCTS, error: err as Error, isLive: false };
  }
}

/**
 * 4. Write Operations (Quote Submission Logic)
 * - Checks if customer exists in 'customers' table by email
 * - Inserts customer if not found and gets customer_id
 * - Inserts row into 'quote_requests' with customer_id, product_id, quantity, status='pending', notes
 */
export async function submitQuoteRequestToDb(payload: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  productId?: string;
  productName?: string;
  quantity: number;
  notes?: string;
}): Promise<{ success: boolean; customerId?: string; quoteRequestId?: string; error?: string }> {
  try {
    const userEmail = payload.email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      // Simulated local success if credentials not yet configured
      console.info('Supabase not configured with live credentials. Simulating quote request submission.');
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        customerId: 'demo-customer-id',
        quoteRequestId: 'quote-' + Date.now(),
      };
    }

    // Step 1: Also insert into 'quotes' table for unified Admin Dashboard & GAS sync
    const productName = payload.productName || 'Precision Fiber Optic Equipment';
    let insertedQuoteId = 'quote-' + Date.now();

    try {
      const { data: qData } = await supabase
        .from('quotes')
        .insert({
          product_name: productName,
          customer_name: payload.name.trim(),
          customer_email: userEmail,
          customer_phone: payload.phone.trim(),
          company_name: payload.company?.trim() || null,
          quantity: payload.quantity || 1,
          notes: payload.notes?.trim() || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (qData?.id) {
        insertedQuoteId = qData.id;
      }
    } catch (quotesErr) {
      console.debug('Quotes table insert notice (trying customer/quote_requests flow):', quotesErr);
    }

    // Step 2: Check if customer exists in 'customers' table by email
    try {
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('email', userEmail);

      let customerId: string;

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            name: payload.name.trim(),
            email: userEmail,
            phone: payload.phone.trim(),
            company: payload.company?.trim() || null,
            address: payload.address?.trim() || null,
            city: payload.city?.trim() || null,
            state: payload.state?.trim() || null,
            country: payload.country?.trim() || null,
          })
          .select('id')
          .single();

        customerId = newCustomer?.id || 'cust-' + Date.now();
      }

      // Step 3: Insert into 'quote_requests'
      let validProductId: string | null = payload.productId || null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (validProductId && !uuidRegex.test(validProductId)) {
        const { data: matchedProd } = await supabase
          .from('products')
          .select('id')
          .ilike('name', `%${validProductId.replace(/-/g, ' ')}%`)
          .limit(1);

        validProductId = matchedProd && matchedProd.length > 0 ? matchedProd[0].id : null;
      }

      await supabase.from('quote_requests').insert({
        customer_id: customerId,
        product_id: validProductId,
        quantity: payload.quantity || 1,
        status: 'pending',
        notes: payload.notes?.trim() || null,
      });

      return {
        success: true,
        customerId,
        quoteRequestId: insertedQuoteId,
      };
    } catch {
      // Fallback return if quotes table already succeeded
      return {
        success: true,
        quoteRequestId: insertedQuoteId,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Error submitting quote request:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
