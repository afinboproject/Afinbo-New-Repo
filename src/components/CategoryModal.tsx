import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { Category, Product } from '../types';
import { fetchProductsFromDb } from '../lib/supabase';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onRequestQuoteProduct: (product: Product) => void;
  onQuickViewProduct: (product: Product) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onRequestQuoteProduct,
  onQuickViewProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !category) return;
    let isMounted = true;
    setIsLoading(true);

    fetchProductsFromDb({ category: category.name })
      .then((result) => {
        if (isMounted) {
          setProducts(result.products);
        }
      })
      .catch((err) => console.error('Error loading category products:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, category]);

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category Header Banner */}
        <div className="relative h-44 rounded-2xl overflow-hidden mb-6 bg-slate-900 border-t-4 border-rose-600">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block mb-1">
              Category
            </span>
            <h3 className="text-2xl font-black">{category.name}</h3>
            <p className="text-slate-300 text-xs mt-1 max-w-md">{category.description}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Available Equipment ({products.length} items)
          </h4>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-slate-300 transition"
              >
                <div
                  onClick={() => {
                    onClose();
                    onQuickViewProduct(product);
                  }}
                  className="flex items-center gap-3 w-full sm:w-auto cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white flex-shrink-0"
                  />
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900 hover:text-blue-600 transition">{product.name}</h5>
                    <p className="text-xs text-slate-500">{product.subtitle}</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">Contact for Price</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      onClose();
                      onQuickViewProduct(product);
                    }}
                    className="flex-1 sm:flex-initial border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Quick View</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onRequestQuoteProduct(product);
                    }}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Request Quote</span>
                  </button>
                </div>
              </div>
            ))
          ) : !isLoading ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">
                Full catalog available for {category.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Contact our technical sales team for the complete specification catalog and instant pricing.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onRequestQuoteProduct({
                    id: category.id,
                    name: category.name + ' Equipment',
                    category: category.name,
                    subtitle: 'Full Specification Catalog',
                    description: category.description,
                    image: category.image,
                    specs: ['Industry Standard Certified'],
                  });
                }}
                className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition cursor-pointer"
              >
                <span>Request Category Pricing</span>
              </button>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

