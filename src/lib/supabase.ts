import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbProduct, DbCustomer, DbQuoteRequest, Product } from '../types';
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

// Helper function to map a DB product or merge with rich UI metadata
export const mapDbProductToUiProduct = (dbItem: DbProduct): Product => {
  const fallback = FEATURED_PRODUCTS.find(
    (p) =>
      p.id === dbItem.id ||
      p.name.toLowerCase() === dbItem.name.toLowerCase() ||
      dbItem.name.toLowerCase().includes(p.name.toLowerCase())
  );

  return {
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category || (fallback ? fallback.category : 'General Equipment'),
    brand: fallback?.brand,
    subtitle: fallback?.subtitle || `${dbItem.category || 'Precision Optical Hardware'} • Stock: ${dbItem.stock_quantity ?? 'Available'}`,
    description: dbItem.description || fallback?.description || 'High precision fiber optic tool.',
    isBestSeller: fallback?.isBestSeller ?? false,
    image: fallback?.image || 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80',
    gallery: fallback?.gallery || [fallback?.image || 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80'],
    specs: fallback?.specs || [`Stock Quantity: ${dbItem.stock_quantity ?? 10} Units`, `Category: ${dbItem.category}`],
    techSpecs: fallback?.techSpecs || [
      { label: 'Category', value: dbItem.category || 'Fiber Optics' },
      { label: 'Stock Available', value: `${dbItem.stock_quantity ?? 0} Units` },
      { label: 'Database ID', value: dbItem.id },
    ],
    features: fallback?.features,
    inTheBox: fallback?.inTheBox,
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
        quoteRequestId: 'demo-quote-req-id',
      };
    }

    // Step 1: Check if customer exists in 'customers' table by email
    const { data: existingCustomers, error: customerSearchError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', userEmail);

    if (customerSearchError) {
      throw new Error(`Customer check failed: ${customerSearchError.message}`);
    }

    let customerId: string;

    if (existingCustomers && existingCustomers.length > 0) {
      // Customer already exists
      customerId = existingCustomers[0].id;
    } else {
      // Customer does not exist; insert new customer record
      const { data: newCustomer, error: insertCustomerError } = await supabase
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

      if (insertCustomerError) {
        throw new Error(`Failed to create customer record: ${insertCustomerError.message}`);
      }

      if (!newCustomer?.id) {
        throw new Error('Customer created but no ID returned.');
      }

      customerId = newCustomer.id;
    }

    // Step 2: Insert into 'quote_requests'
    // Find or format product_id as valid uuid if applicable, or pass payload.productId
    let validProductId: string | null = payload.productId || null;

    // Check if productId is a valid UUID format; if not and we have products in DB, look it up
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (validProductId && !uuidRegex.test(validProductId)) {
      // Try to find product UUID by slug or name in DB
      const { data: matchedProd } = await supabase
        .from('products')
        .select('id')
        .ilike('name', `%${validProductId.replace(/-/g, ' ')}%`)
        .limit(1);

      if (matchedProd && matchedProd.length > 0) {
        validProductId = matchedProd[0].id;
      } else {
        validProductId = null;
      }
    }

    const { data: newQuote, error: insertQuoteError } = await supabase
      .from('quote_requests')
      .insert({
        customer_id: customerId,
        product_id: validProductId,
        quantity: payload.quantity || 1,
        status: 'pending',
        notes: payload.notes?.trim() || null,
      })
      .select('id')
      .single();

    if (insertQuoteError) {
      throw new Error(`Failed to insert quote request: ${insertQuoteError.message}`);
    }

    return {
      success: true,
      customerId,
      quoteRequestId: newQuote?.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Error submitting quote request:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
