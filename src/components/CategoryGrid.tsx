import React from 'react';
import { CATEGORIES } from '../data';
import { Link } from '../lib/router';

interface CategoryGridProps {
  onSelectCategory?: (categoryName: string) => void;
}

export const getCategoryRoute = (categoryName: string): string => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('stripper')) return '/strippers';
  if (lower.includes('cleaver')) return '/cleavers';
  if (lower.includes('tester') || lower.includes('cleaning') || lower.includes('inspection')) return '/testers';
  if (lower.includes('splicer') || lower.includes('fujikura 90s')) return '/splicers';
  return '/products';
};

export const CategoryGrid: React.FC<CategoryGridProps> = () => {
  return (
    <section id="categories" className="py-12 md:py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Shop by{' '}
            <span className="relative inline-block pb-1">
              Category
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-600 rounded-full" />
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Browse our comprehensive catalog of specialized fiber optic equipment tailored for your specific needs.
          </p>
        </div>

        {/* 8 Category Grid (4 cols x 2 rows) with Clean Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((category) => {
            const route = getCategoryRoute(category.name);
            return (
              <Link
                key={category.id}
                href={route}
                className="group relative h-48 sm:h-52 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 block bg-slate-900 border-t-4 border-rose-600"
              >
                {/* Category Background Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-80"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                {/* Category Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10 flex flex-col justify-end">
                  <h3 className="text-white font-extrabold text-base sm:text-lg tracking-tight leading-snug group-hover:text-rose-200 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-slate-300 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 font-medium">
                    <span>Explore category</span>
                    <span>&rarr;</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
