import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, RotateCcw, Eye, Loader2, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { fetchProductsFromDb } from '../lib/supabase';
import { FEATURED_PRODUCTS } from '../data';
import { Link, useRouter } from '../lib/router';

interface ProductsCatalogProps {
  onRequestQuoteProduct: (product: Product) => void;
  onQuickViewProduct: (product: Product) => void;
  routeCategory?: string | null;
}

const CATEGORY_ITEMS = [
  { label: 'All Products', route: '/products', match: null },
  { label: 'Splicers', route: '/splicers', match: 'Splicers' },
  { label: 'Cleavers', route: '/cleavers', match: 'Cleavers' },
  { label: 'Strippers', route: '/strippers', match: 'Strippers' },
  { label: 'Testers & Inspection', route: '/testers', match: 'Testers' },
  { label: 'Cleaning Kits', route: '/products', match: 'Cleaning' },
  { label: 'Ribbon Separation Tools', route: '/products', match: 'FST-12' },
];

const BRAND_FILTERS = [
  'Fujikura',
  'Sumitomo',
  'INNO',
  'Nyfors',
  'Fitel',
  'Afinbo',
];

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  onRequestQuoteProduct,
  onQuickViewProduct,
  routeCategory = null,
}) => {
  const { navigate, currentPath } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(routeCategory || null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [productsList, setProductsList] = useState<Product[]>(FEATURED_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);

  // Sync state whenever routeCategory changes from URL (e.g. user navigated /strippers -> /cleavers)
  useEffect(() => {
    setSelectedCategory(routeCategory || null);
  }, [routeCategory, currentPath]);

  // Dynamic Query execution using Supabase query (.eq / .ilike category)
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchProductsFromDb({
        category: selectedCategory,
        searchQuery: searchQuery,
      });

      let items = result.products;

      // Apply brand filter if selected
      if (selectedBrand) {
        items = items.filter(
          (p) =>
            p.brand?.toLowerCase() === selectedBrand.toLowerCase() ||
            p.name.toLowerCase().includes(selectedBrand.toLowerCase())
        );
      }

      setProductsList(items);
      setIsLiveDb(result.isLive);
    } catch (err) {
      console.error('Failed to load products from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedBrand]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSelectCategoryFilter = (catMatch: string | null, route: string) => {
    setSelectedCategory(catMatch);
    if (route && currentPath !== route) {
      navigate(route, { scrollToTop: false });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSearchQuery('');
    if (currentPath !== '/products') {
      navigate('/products', { scrollToTop: false });
    }
  };

  // Determine Title based on current route
  const getPageTitle = () => {
    if (selectedCategory) {
      return `${selectedCategory} Equipment`;
    }
    return 'Product Catalog';
  };

  return (
    <div className="bg-slate-50/70 py-8 md:py-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          
          {/* Title & Clean Breadcrumb */}
          <div className="flex items-start gap-3">
            {/* Red Vertical Accent Line */}
            <div className="w-[3.5px] bg-rose-600 rounded-full h-10 mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                <Link
                  href="/"
                  className="hover:text-slate-900 transition"
                >
                  Home
                </Link>
                <span className="text-slate-400">/</span>
                <Link
                  href="/products"
                  className={`hover:text-slate-900 transition ${!selectedCategory ? 'text-slate-900 font-bold' : ''}`}
                >
                  Products
                </Link>
                {selectedCategory && (
                  <>
                    <span className="text-slate-400">/</span>
                    <span className="text-rose-600 font-bold">{selectedCategory}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Search Box Right Aligned */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog (name, specs)..."
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

        </div>

        {/* Main Catalog Content: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Sidebar Filter Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
            {/* Red top border accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-600" />

            <div className="flex items-center justify-between mb-4 pt-1">
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Filters
              </h2>
              {(selectedCategory || selectedBrand || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* CATEGORY FILTER SECTION - Synchronized with URL routes */}
            <div className="mb-6">
              <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-3">
                CATEGORIES
              </h3>
              <div className="space-y-1.5">
                {CATEGORY_ITEMS.map((item) => {
                  const isSelected = 
                    (item.match === null && selectedCategory === null) ||
                    (item.match !== null && selectedCategory?.toLowerCase().includes(item.match.toLowerCase()));

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectCategoryFilter(item.match, item.route)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/70 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Radio indicator circle */}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border transition flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{item.label}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BRAND FILTER SECTION */}
            <div>
              <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-3">
                MANUFACTURER
              </h3>
              <div className="space-y-1.5">
                {BRAND_FILTERS.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(isSelected ? null : brand)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className={`w-3.5 h-3.5 rounded border transition flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-xs bg-white" />}
                      </div>
                      <span>{brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Calibration CTA Banner in Sidebar */}
            <div className="mt-8 p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800">
              <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Lab Services</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Need your equipment serviced or calibrated with NIST compliance?
              </p>
              <Link
                href="/about-afinbo"
                className="block text-center text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-3 rounded-lg transition"
              >
                Learn About Lab Services →
              </Link>
            </div>

          </div>

          {/* Product Cards Display Grid (3 Columns on Desktop) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Querying Supabase products database...</p>
              </div>
            ) : productsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsList.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between relative group"
                  >
                    {/* Best Seller Overlay Tag */}
                    {product.isBestSeller && (
                      <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full absolute top-6 left-6 z-10 shadow-2xs">
                        Best Seller
                      </span>
                    )}

                    <div>
                      {/* Product Image Thumbnail with Quick View Hover Overlay */}
                      <div
                        onClick={() => onQuickViewProduct(product)}
                        className="bg-slate-50 rounded-xl overflow-hidden h-44 w-full mb-4 flex items-center justify-center p-2 relative cursor-pointer"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition duration-300"
                        />
                        {/* Quick View Button Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl backdrop-blur-2xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickViewProduct(product);
                            }}
                            className="bg-white/95 hover:bg-white text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Quick View</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Category & Brand Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {product.brand || 'AFINBO'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">
                          {product.category}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <h3
                        onClick={() => onQuickViewProduct(product)}
                        className="text-slate-900 font-extrabold text-base tracking-tight leading-snug line-clamp-1 mb-1 hover:text-blue-600 transition cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                        {product.subtitle || product.description}
                      </p>
                    </div>

                    {/* Price Label & Action Buttons */}
                    <div>
                      <p className="text-slate-900 font-extrabold text-sm mb-3">
                        Contact for Price
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onQuickViewProduct(product)}
                          className="w-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
                          title="View technical specs & high-res gallery"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Specs</span>
                        </button>

                        <button
                          onClick={() => onRequestQuoteProduct(product)}
                          className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Quote</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
                <p className="text-base font-bold text-slate-800 mb-1">No products found</p>
                <p className="text-xs text-slate-500 mb-4">Try clearing filters or search query to view all available fiber optic tools.</p>
                <button
                  onClick={handleResetFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  View All Products
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
