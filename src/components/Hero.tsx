import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '../lib/router';

interface HeroProps {
  onContactSales: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onContactSales }) => {
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-20 lg:py-24">
      {/* Background subtle light geometric mesh grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          
          {/* Main Content Column with Red Accent Bar */}
          <div className="relative pl-6 md:pl-8 max-w-2xl">
            {/* Left Vertical Red Accent Bar matching screenshot */}
            <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-rose-600 rounded-full" />

            {/* Premium Quality Solutions Badge */}
            <div className="inline-flex items-center gap-1.5 mb-5 bg-blue-50 text-blue-600 border border-blue-200/60 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PREMIUM QUALITY SOLUTIONS</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Precision<br />
              Equipment for<br />
              <span className="text-blue-600">Professionals.</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg mb-8 font-normal">
              Equip your team with industry-leading fiber optic tools, precise testing instruments, and world-class calibration services.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-xs hover:shadow-md transition duration-150 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={onContactSales}
                className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-sm px-6 py-3 rounded-full transition duration-150 cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>

          {/* Hero Decorative High-Tech Fiber Graphic Panel */}
          <div className="hidden lg:block relative w-full max-w-md">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-900 aspect-4/3 group">
              <img
                src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80"
                alt="Fiber Optic Precision Equipment"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white p-2">
                <p className="text-xs uppercase font-bold tracking-widest text-blue-400">AFINBO Certified</p>
                <p className="text-sm font-semibold text-slate-100">Next-Gen Optical Fusion & Testing Technology</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
