import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Eye } from 'lucide-react';
import { FEATURED_PRODUCTS } from '../data';
import { Product } from '../types';
import { fetchProductsFromDb } from '../lib/supabase';
import { Link } from '../lib/router';

interface FeaturedProductsProps {
  onRequestQuoteProduct: (product: Product) => void;
  onQuickViewProduct: (product: Product) => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  onRequestQuoteProduct,
  onQuickViewProduct,
}) => {
  const [products, setProducts] = useState<Product[]>(FEATURED_PRODUCTS.slice(0, 4));

  useEffect(() => {
    let isMounted = true;
    fetchProductsFromDb().then((result) => {
      if (isMounted && result.products.length > 0) {
        setProducts(result.products.slice(0, 4));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="featured" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Left Vertical Red Line */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-10 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-[3.5px] bg-rose-600 rounded-full h-12 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Equipment
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-normal">
                Top-rated tools trusted by telecom professionals across West Africa.
              </p>
            </div>
          </div>

          <Link
            href="/products"
            className="text-rose-600 hover:text-rose-700 font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer self-start sm:self-auto"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Featured Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group"
            >
              {/* Best Seller Tag */}
              {product.isBestSeller && (
                <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full absolute top-6 left-6 z-10 shadow-2xs">
                  Best Seller
                </span>
              )}

              <div>
                {/* Product Thumbnail Container with Quick View Hover Overlay */}
                <div
                  onClick={() => onQuickViewProduct(product)}
                  className="bg-slate-50 rounded-xl overflow-hidden h-40 w-full mb-4 flex items-center justify-center p-2 relative cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
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

                {/* Title & Subtitle */}
                <h3
                  onClick={() => onQuickViewProduct(product)}
                  className="text-slate-900 font-extrabold text-base tracking-tight leading-snug line-clamp-1 mb-1 hover:text-blue-600 transition cursor-pointer"
                >
                  {product.name}
                </h3>
                <p className="text-slate-500 text-xs mb-4 line-clamp-1">
                  {product.subtitle}
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
                    <span>Quick View</span>
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

      </div>
    </section>
  );
};
