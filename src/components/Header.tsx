import React, { useState } from 'react';
import { FileText, Menu, X, Search } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'products';
  onSelectTab: (tab: 'home' | 'products') => void;
  onRequestQuote: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onRequestQuote,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* Top primary vibrant red accent bar */}
      <div className="h-[3px] bg-rose-600 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-2xl font-black tracking-tight text-blue-950 group-hover:text-blue-900 transition">
            AFINBO
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`font-semibold text-sm px-4 py-1.5 rounded-full transition cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('products')}
            className={`font-semibold text-sm px-4 py-1.5 rounded-full transition cursor-pointer ${
              currentTab === 'products'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Products
          </button>
          <button
            onClick={onOpenSearch}
            className="text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition ml-2 cursor-pointer"
            title="Search Catalog"
          >
            <Search className="w-4 h-4" />
          </button>
        </nav>

        {/* Desktop Request Quote Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onRequestQuote}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xs hover:shadow-md active:scale-98 transition duration-150 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Request Quote</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onSelectTab('home');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left text-sm px-4 py-2.5 rounded-xl font-semibold ${
              currentTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              onSelectTab('products');
              setMobileMenuOpen(false);
            }}
            className={`block w-full text-left text-sm px-4 py-2.5 rounded-xl font-semibold ${
              currentTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRequestQuote();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Request Quote</span>
          </button>
        </div>
      )}
    </header>
  );
};
