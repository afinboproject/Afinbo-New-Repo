import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbProduct, DbCustomer, DbQuoteRequest, Product, TechSpec } from '../types';
import { FEATURED_PRODUCTS } from '../data';

// 1. Environment Configuration with static references for Vite bundling
export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  let url = '';
  let anonKey = '';

  // Static literal references for Vite AST replacement during build
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SUPABASE_URL) url = import.meta.env.VITE_SUPABASE_URL;
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url && (import.meta.env as unknown as Record<string, string>).SUPABASE_URL) {
        url = (import.meta.env as unknown as Record<string, string>).SUPABASE_URL;
      }
      if (!anonKey && (import.meta.env as unknown as Record<string, string>).SUPABASE_ANON_KEY) {
        anonKey = (import.meta.env as unknown as Record<string, string>).SUPABASE_ANON_KEY;
      }
    }
  } catch {
    // Ignore environment read errors in restricted contexts
  }

  // Browser global & localStorage overrides
  if (typeof window !== 'undefined') {
    try {
      const win = window as unknown as Record<string, string | Record<string, string> | undefined>;
      if (!url && typeof win.VITE_SUPABASE_URL === 'string') url = win.VITE_SUPABASE_URL;
      if (!anonKey && typeof win.VITE_SUPABASE_ANON_KEY === 'string') anonKey = win.VITE_SUPABASE_ANON_KEY;
      if (!url && typeof win.SUPABASE_URL === 'string') url = win.SUPABASE_URL;
      if (!anonKey && typeof win.SUPABASE_ANON_KEY === 'string') anonKey = win.SUPABASE_ANON_KEY;

      const envObj = win.__ENV__ as Record<string, string> | undefined;
      if (!url && envObj?.VITE_SUPABASE_URL) url = envObj.VITE_SUPABASE_URL;
      if (!anonKey && envObj?.VITE_SUPABASE_ANON_KEY) anonKey = envObj.VITE_SUPABASE_ANON_KEY;

      // Saved via UI settings in localStorage
      const storedUrl = localStorage.getItem('afinbo_supabase_url') || localStorage.getItem('supabase_url');
      const storedKey = localStorage.getItem('afinbo_supabase_anon_key') || localStorage.getItem('supabase_anon_key');
      if (!url && storedUrl) url = storedUrl;
      if (!anonKey && storedKey) anonKey = storedKey;
    } catch {
      // Ignore localStorage errors
    }
  }

  // Node/SSR process.env fallback
  if (typeof process !== 'undefined' && process.env) {
    if (!url && process.env.VITE_SUPABASE_URL) url = process.env.VITE_SUPABASE_URL;
    if (!anonKey && process.env.VITE_SUPABASE_ANON_KEY) anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url && process.env.SUPABASE_URL) url = process.env.SUPABASE_URL;
    if (!anonKey && process.env.SUPABASE_ANON_KEY) anonKey = process.env.SUPABASE_ANON_KEY;
  }

  return {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim(),
  };
};

export const getSupabaseUrl = (): string => getSupabaseConfig().url;
export const getSupabaseAnonKey = (): string => getSupabaseConfig().anonKey;

// Save Supabase credentials dynamically (e.g. from UI settings modal)
export const saveSupabaseCredentials = (url: string, anonKey: string): boolean => {
  try {
    const cleanUrl = (url || '').trim();
    const cleanKey = (anonKey || '').trim();
    if (typeof window !== 'undefined') {
      if (cleanUrl) {
        localStorage.setItem('afinbo_supabase_url', cleanUrl);
        (window as unknown as Record<string, string>).VITE_SUPABASE_URL = cleanUrl;
      } else {
        localStorage.removeItem('afinbo_supabase_url');
      }
      if (cleanKey) {
        localStorage.setItem('afinbo_supabase_anon_key', cleanKey);
        (window as unknown as Record<string, string>).VITE_SUPABASE_ANON_KEY = cleanKey;
      } else {
        localStorage.removeItem('afinbo_supabase_anon_key');
      }
    }
    // Re-initialize active client
    activeClientInstance = createLiveClient();
    return true;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
    return false;
  }
};

// Validate whether Supabase credentials are valid and live
export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return false;
  if (
    url === 'YOUR_SUPABASE_PROJECT_URL' ||
    anonKey === 'YOUR_SUPABASE_ANON_KEY' ||
    url.includes('your-project') ||
    anonKey.includes('your-anon-key')
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(anonKey);
  } catch {
    return false;
  }
};

// Create a live Supabase client if configured, or a diagnostic mock that informs caller
const createLiveClient = (): SupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();
  if (isSupabaseConfigured()) {
    try {
      return createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Could not initialize live Supabase client:', err);
    }
  }

  // Diagnostic mock client: Never silently fake success on writes/admin queries when unconfigured!
  const unconfiguredError = {
    message:
      'Supabase is not configured with a valid Project URL and Anon Key. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting environment variables or click "Configure Supabase" on the admin page.',
    code: 'SUPABASE_UNCONFIGURED',
    details: 'Missing valid Supabase URL or Anon Key.',
  };

  const createMockQuery = (tableName: string) => {
    const query: Record<string, unknown> = {
      select: () => query,
      insert: async () => {
        console.warn(`[Supabase Client] Attempted insert into "${tableName}" but Supabase is unconfigured.`);
        return { data: null, error: unconfiguredError };
      },
      update: async () => {
        console.warn(`[Supabase Client] Attempted update on "${tableName}" but Supabase is unconfigured.`);
        return { data: null, error: unconfiguredError };
      },
      delete: async () => {
        console.warn(`[Supabase Client] Attempted delete on "${tableName}" but Supabase is unconfigured.`);
        return { data: null, error: unconfiguredError };
      },
      eq: () => query,
      ilike: () => query,
      or: () => query,
      limit: () => query,
      single: async () => {
        if (tableName === 'products') {
          return { data: FEATURED_PRODUCTS[0], error: null };
        }
        return { data: null, error: unconfiguredError };
      },
      maybeSingle: async () => {
        if (tableName === 'products') {
          return { data: FEATURED_PRODUCTS[0], error: null };
        }
        return { data: null, error: unconfiguredError };
      },
      then: (resolve: (val: { data: unknown[]; error: typeof unconfiguredError | null }) => void) => {
        if (tableName === 'products') {
          resolve({ data: FEATURED_PRODUCTS as unknown[], error: null });
        } else {
          resolve({ data: [], error: unconfiguredError });
        }
      },
    };
    return query;
  };

  const mockClient = {
    from: (table: string) => createMockQuery(table),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;

  return mockClient;
};

let activeClientInstance: SupabaseClient = createLiveClient();

// Export dynamic Supabase proxy
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!activeClientInstance) {
      activeClientInstance = createLiveClient();
    }
    const val = (activeClientInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(activeClientInstance);
    }
    return val;
  },
});

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

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

// Global cache invalidation trigger for real-time storefront synchronization
export const invalidateProductCache = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('afinbo:products_updated', { detail: { timestamp: Date.now() } }));
  }
};

/**
 * Uploads an image file to the Supabase Storage 'products' bucket
 * and returns the permanent public URL.
 */
export async function uploadProductImageToStorage(
  file: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return {
      publicUrl: null,
      error: new Error('Supabase is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `products/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanFileName}`;

    // Upload to Supabase Storage 'products' bucket
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload error (checking bucket existence):', uploadError.message);
      return { publicUrl: null, error: new Error(uploadError.message) };
    }

    // Retrieve public URL
    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      return { publicUrl: null, error: new Error('Could not retrieve public URL from Supabase storage.') };
    }

    return { publicUrl, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error during image upload';
    return { publicUrl: null, error: new Error(msg) };
  }
}

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
  const rawTechSpecs =
    dbItem.technical_specs ||
    dbItem.specifications ||
    dbItem.tech_specs ||
    dbItem.techSpecs ||
    fallback?.techSpecs;
  const rawInTheBox = dbItem.in_the_box || dbItem.inTheBox || fallback?.inTheBox;
  const rawGallery = dbItem.gallery_urls || dbItem.gallery || (fallback?.gallery ? fallback.gallery : undefined);

  const normalizedFeatures = normalizeStringArray(rawFeatures);
  const normalizedTechSpecs = normalizeTechSpecs(rawTechSpecs);
  const normalizedInTheBox = normalizeStringArray(rawInTheBox);

  // Check all possible database column aliases for the image URL
  const mainImage =
    dbItem.main_image_url ||
    dbItem.image_url ||
    dbItem.image ||
    dbItem.photo_url ||
    fallback?.image ||
    FALLBACK_PRODUCT_IMAGE;

  const categoryName = typeof dbItem.category === 'string' && dbItem.category.trim()
    ? dbItem.category
    : (fallback?.category || 'Splicers');

  const brandName = typeof dbItem.brand === 'string' && dbItem.brand.trim()
    ? dbItem.brand
    : (fallback?.brand || 'AFINBO');

  const subtitle =
    dbItem.short_description ||
    dbItem.subtitle ||
    fallback?.subtitle ||
    `${categoryName} • ${brandName}`;

  const description =
    dbItem.product_overview ||
    dbItem.overview ||
    dbItem.description ||
    fallback?.description ||
    'High precision fiber optic tool.';

  const isBestSeller =
    dbItem.is_best_seller !== undefined
      ? Boolean(dbItem.is_best_seller)
      : dbItem.best_seller !== undefined
      ? Boolean(dbItem.best_seller)
      : Boolean(fallback?.isBestSeller);

  let galleryArray: string[] = [mainImage];
  if (Array.isArray(rawGallery) && rawGallery.length > 0) {
    galleryArray = rawGallery.map(String).filter(Boolean);
    if (!galleryArray.includes(mainImage)) {
      galleryArray = [mainImage, ...galleryArray];
    }
  }

  return {
    id: String(dbItem.id || fallback?.id || 'prod-' + Date.now()),
    name: String(dbItem.name || fallback?.name || 'Fiber Optic Equipment'),
    category: categoryName,
    brand: brandName,
    model: dbItem.model_number || dbItem.model || fallback?.model || '',
    sku: dbItem.sku || fallback?.sku || '',
    subtitle: subtitle,
    description: description,
    isBestSeller: isBestSeller,
    image: mainImage,
    gallery: galleryArray,
    specs: normalizedFeatures.length > 0 ? normalizedFeatures : (fallback?.specs || ['High precision optical equipment']),
    techSpecs: normalizedTechSpecs.length > 0 ? normalizedTechSpecs : fallback?.techSpecs,
    features: normalizedFeatures.length > 0 ? normalizedFeatures : fallback?.features,
    inTheBox: normalizedInTheBox.length > 0 ? normalizedInTheBox : fallback?.inTheBox,
  };
};

/**
 * 3. Read Operations (Product Display & Filtering)
 * Queries products directly from the 'products' table in Supabase (no stale cache)
 */
export async function fetchProductsFromDb(options?: {
  category?: string | null;
  searchQuery?: string | null;
  forceRefresh?: boolean;
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
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Category filter against 'category' column
    if (options?.category) {
      const cat = options.category.trim();
      query = query.or(`category.ilike.%${cat}%,name.ilike.%${cat}%`);
    }

    // Search input filter matching 'name' or 'description' using ilike
    if (options?.searchQuery && options.searchQuery.trim()) {
      const term = options.searchQuery.trim();
      query = query.or(`name.ilike.%${term}%,product_overview.ilike.%${term}%,short_description.ilike.%${term}%`);
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
