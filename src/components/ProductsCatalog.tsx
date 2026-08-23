import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, RotateCcw, Eye, Database, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { fetchProductsFromDb, isSupabaseConfigured } from '../lib/supabase';
import { FEATURED_PRODUCTS } from '../data';

interface ProductsCatalogProps {
  onRequestQuoteProduct: (product: Product) => void;
  onQuickViewProduct: (product: Product) => void;
  onNavigateHome: () => void;
  initialCategory?: string | null;
}

const CATEGORY_FILTERS = [
  'Cleaning',
  'Misc Accessories',
  'Thermal Strippers',
  'Strippers',
  'FST-12 Fiber Separation Tool',
  'Ribbon Fiber Tools',
  'Cleavers',
  'Fujikura 90S+ Fusion Splicer',
  'Splicers Single Fiber',
  'Splicers Ribbon Fiber',
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
  onNavigateHome,
  initialCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [productsList, setProductsList] = useState<Product[]>(FEATURED_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);

  // Dynamic Query execution using Supabase query
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

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSearchQuery('');
  };

  return (
    <div className="bg-slate-50/70 py-8 md:py-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          
          {/* Title & Breadcrumb */}
          <div className="flex items-start gap-3">
            {/* Red Vertical Accent Line matching screenshot */}
            <div className="w-[3.5px] bg-rose-600 rounded-full h-10 mt-1 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Our Products
                </h1>
                {isSupabaseConfigured() && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    <Database className="w-3 h-3" />
                    Supabase Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                <button
                  onClick={onNavigateHome}
                  className="hover:text-slate-900 transition cursor-pointer"
                >
                  Home
                </button>
                <span className="mx-1.5 text-slate-400">/</span>
                <span className="text-slate-800 font-semibold">Store</span>
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
              placeholder="Search by name or description (ilike)..."
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

            {/* CATEGORY FILTER SECTION - queries 'category' column */}
            <div className="mb-6">
              <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-3">
                CATEGORY
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {CATEGORY_FILTERS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <label
                      key={cat}
                      onClick={() => setSelectedCategory(isSelected ? null : cat)}
                      className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer group py-0.5 select-none"
                    >
                      {/* Custom Radio Button Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border transition flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={isSelected ? 'font-bold text-blue-900' : 'font-normal'}>
                        {cat}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* BRAND FILTER SECTION */}
            <div>
              <h3 className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-3">
                BRAND
              </h3>
              <div className="space-y-2">
                {BRAND_FILTERS.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <label
                      key={brand}
                      onClick={() => setSelectedBrand(isSelected ? null : brand)}
                      className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer group py-0.5 select-none"
                    >
                      {/* Custom Radio Button Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border transition flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={isSelected ? 'font-bold text-blue-900' : 'font-normal'}>
                        {brand}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Product Cards Display Grid (3 Columns on Desktop) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Querying Supabase products table...</p>
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
                        className="bg-slate-50 rounded-xl overflow-hidden h-44 w-full mb-4 flex items-center justify-center relative cursor-pointer"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            <Eye className="w-3.5 h-3.5 text-rose-600" />
                            <span>Quick View</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Name & Subtitle */}
                      <h3
                        onClick={() => onQuickViewProduct(product)}
                        className="text-slate-900 font-extrabold text-base tracking-tight leading-snug line-clamp-1 mb-1 hover:text-rose-600 transition cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <p className="text-slate-500 text-xs mb-4 line-clamp-1 font-normal">
                        {product.subtitle}
                      </p>
                    </div>

                    {/* Price & Action Buttons */}
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
                          <span>Quick View</span>
                        </button>

                        <button
                          onClick={() => onRequestQuoteProduct(product)}
                          className="w-full border border-rose-600 text-rose-600 hover:bg-rose-50 active:bg-rose-100 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
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
              /* Empty Search / Filter State */
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No matching equipment found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting or clearing your category, brand, or text search filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

