import React from 'react';
import { ShieldCheck, Zap, Award } from 'lucide-react';
import { VALUE_PROPS } from '../data';

export const ValueProps: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-rose-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-rose-500" />;
      case 'award':
        return <Award className="w-5 h-5 text-rose-500" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <section className="bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3 Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center shadow-2xs hover:shadow-xs transition duration-200"
            >
              {/* Red outline icon square */}
              <div className="p-3 bg-rose-50 rounded-2xl mr-4 flex-shrink-0">
                {getIcon(prop.icon)}
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-0.5">
                  {prop.title}
                </h3>
                <p className="text-slate-500 text-xs font-normal">
                  {prop.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="border-t border-slate-100 mt-12 mb-4" />
      </div>
    </section>
  );
};
