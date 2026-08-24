import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Package,
  Sparkles,
  ShieldCheck,
  Share2,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { formatSpecToString } from '../lib/supabase';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (product: Product) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onRequestQuote,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'features' | 'box'>('specs');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset active image index and tab when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setActiveTab('specs');
    }
  }, [product]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const galleryImages = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [product.image];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      id="product-quick-view-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        id="product-quick-view-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden relative my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Accent Line */}
        <div className="h-1 bg-gradient-to-r from-rose-600 via-blue-600 to-rose-600 w-full" />

        {/* Modal Header Bar with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
              Quick View
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Catalog Reference #{product.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Copy product link"
              className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-200/60 transition cursor-pointer flex items-center gap-1 text-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold text-[11px]">Copied</span>
                </>
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            <button
              id="close-quick-view-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* LEFT COLUMN: High-Resolution Gallery Viewer (5 of 12 cols) */}
          <div className="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-slate-50/30">
            <div>
              {/* Main Image Frame with zoom container */}
              <div className="relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden aspect-square flex items-center justify-center group shadow-2xs">
                {product.isBestSeller && (
                  <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full absolute top-3 left-3 z-10 shadow-2xs">
                    Best Seller
                  </span>
                )}

                <img
                  src={galleryImages[activeImageIndex]}
                  alt={`${product.name} - Angle ${activeImageIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Left/Right Navigation Arrows if > 1 image */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-md transition opacity-80 hover:opacity-100 cursor-pointer"
                      title="Previous Image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-md transition opacity-80 hover:opacity-100 cursor-pointer"
                      title="Next Image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Image Counter Pill */}
                <div className="absolute bottom-2.5 right-2.5 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </div>

              {/* Gallery Thumbnails Strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality badge footer */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Afinbo Certified Hardware</span>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details & Detailed Specs (7 of 12 cols) */}
          <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Brand and category info */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.brand && (
                  <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                    {product.brand}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  {product.category}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
                {product.name}
              </h2>
              <p className="text-xs text-blue-600 font-semibold mb-3">
                {product.subtitle}
              </p>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Price Callout */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between mb-5">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Pricing & Availability
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    Contact for Custom Price Quote
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Warranty</span>
                  <span className="text-xs font-bold text-slate-700">1-Year Standard + Support</span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'specs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Technical Specs</span>
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'features'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Key Features</span>
                </button>
                <button
                  onClick={() => setActiveTab('box')}
                  className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'box'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>In The Box</span>
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="min-h-[160px] max-h-[240px] overflow-y-auto pr-1">
                {/* TAB 1: TECHNICAL SPECS TABLE */}
                {activeTab === 'specs' && (
                  <div className="space-y-1.5">
                    {product.techSpecs && product.techSpecs.length > 0 ? (
                      <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                        {product.techSpecs.map((spec, i) => (
                          <div
                            key={i}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-1 ${
                              i % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                            }`}
                          >
                            <span className="font-semibold text-slate-600 text-[11px] sm:w-1/2">
                              {formatSpecToString(spec.label)}
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:w-1/2 sm:text-right">
                              {formatSpecToString(spec.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {product.specs.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>{formatSpecToString(item)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: FEATURES */}
                {activeTab === 'features' && (
                  <div className="space-y-2.5">
                    {(product.features || product.specs).map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{formatSpecToString(feat)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: IN THE BOX */}
                {activeTab === 'box' && (
                  <div className="space-y-2">
                    {product.inTheBox && product.inTheBox.length > 0 ? (
                      product.inTheBox.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 text-xs text-slate-800 bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl"
                        >
                          <Package className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span className="font-medium">{formatSpecToString(item)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">
                        Standard manufacturer retail packaging includes equipment body, battery/power accessories, and quick setup documentation.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="quick-view-request-quote-btn"
                onClick={() => {
                  onClose();
                  onRequestQuote(product);
                }}
                className="w-full sm:flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition duration-150 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Request Custom Quote</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
