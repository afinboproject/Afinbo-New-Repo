import React, { useState } from 'react';
import { FileText, Menu, X, Search } from 'lucide-react';
import { Link, useRouter } from '../lib/router';

interface HeaderProps {
  onRequestQuote: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRequestQuote,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentPath, isPathActive } = useRouter();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/products' },
    { label: 'Splicers', href: '/splicers' },
    { label: 'Cleavers', href: '/cleavers' },
    { label: 'Strippers', href: '/strippers' },
    { label: 'Testers', href: '/testers' },
    { label: 'About AFINBO', href: '/about-afinbo' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
      {/* Top primary vibrant red accent bar */}
      <div className="h-[3px] bg-rose-600 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo with Clean Link */}
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-2xl font-black tracking-tight text-blue-950 group-hover:text-blue-900 transition">
            AFINBO
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const active = isPathActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-semibold text-xs xl:text-sm px-3.5 py-1.5 rounded-full transition whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={onOpenSearch}
            className="text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition ml-1 cursor-pointer"
            title="Search Catalog"
            aria-label="Search Products"
          >
            <Search className="w-4 h-4" />
          </button>
        </nav>

        {/* Desktop Tablet Compact Navigation (md to lg) */}
        <nav className="hidden md:flex lg:hidden items-center space-x-1">
          <Link
            href="/"
            className={`font-semibold text-xs px-3 py-1.5 rounded-full transition ${
              isPathActive('/') ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`font-semibold text-xs px-3 py-1.5 rounded-full transition ${
              isPathActive('/products') ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            Catalog
          </Link>
          <Link
            href="/about-afinbo"
            className={`font-semibold text-xs px-3 py-1.5 rounded-full transition ${
              isPathActive('/about-afinbo') ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            About
          </Link>
          <button
            onClick={onOpenSearch}
            className="text-slate-500 hover:text-slate-900 p-1.5 rounded-full hover:bg-slate-100 transition"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </nav>

        {/* Desktop Request Quote Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onRequestQuote}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs xl:text-sm px-4 xl:px-5 py-2 xl:py-2.5 rounded-full flex items-center gap-2 shadow-2xs hover:shadow-sm active:scale-98 transition duration-150 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
            <span>Request Quote</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Search Catalog"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in fade-in duration-150">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const active = isPathActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left text-sm px-4 py-2.5 rounded-xl font-semibold transition ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2">
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
        </div>
      )}
    </header>
  );
};
