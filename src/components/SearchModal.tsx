import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingBag, Eye, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data';
import { Product } from '../types';
import { fetchProductsFromDb } from '../lib/supabase';
import { getCategoryRoute } from './CategoryGrid';
import { useRouter } from '../lib/router';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuoteProduct: (product: Product) => void;
  onQuickViewProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onRequestQuoteProduct,
  onQuickViewProduct,
}) => {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await fetchProductsFromDb({ searchQuery: query });
        if (isMounted) {
          setSearchResults(result.products);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  const filteredCategories = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleCategoryClick = (categoryName: string) => {
    onClose();
    const route = getCategoryRoute(categoryName);
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[80vh] flex flex-col">
        
        {/* Search Input Bar */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search splicers, cleavers, strippers, testers (ilike query)..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto space-y-4 pr-1">
          {/* Categories */}
          {filteredCategories.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCategoryClick(c.name)}
                    className="p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="text-xs font-bold text-slate-800">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Products {isSearching && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-blue-600" />}
              </p>
              <span className="text-[10px] text-slate-400">
                {searchResults.length} {searchResults.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition"
                  >
                    <div
                      onClick={() => {
                        onClose();
                        onQuickViewProduct(p);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 hover:text-blue-600 transition">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onClose();
                          onQuickViewProduct(p);
                        }}
                        className="bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-medium"
                        title="Quick View"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onRequestQuoteProduct(p);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Quote</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredCategories.length === 0 && searchResults.length === 0 && !isSearching && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No equipment found matching &quot;{query}&quot;. Try searching for &quot;splicer&quot; or &quot;cleaver&quot;.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
