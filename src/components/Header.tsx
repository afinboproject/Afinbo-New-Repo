import React, { useState, useEffect } from 'react';
import { FileText, Menu, X, Search, ChevronRight, PhoneCall } from 'lucide-react';
import { Link, useRouter } from '../lib/router';

interface HeaderProps {
  onRequestQuote: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRequestQuote,
  onOpenSearch,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentPath, isPathActive } = useRouter();

  // Strictly only the requested menu items
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About AFINBO', href: '/about-afinbo' },
  ];

  // Close menu on route change or ESC key
  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
      {/* Top primary vibrant red accent bar */}
      <div className="h-[3px] bg-rose-600 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-2xl font-black tracking-tight text-blue-950 group-hover:text-blue-900 transition">
            AFINBO
          </span>
        </Link>

        {/* Right Controls: Search button + Fine Hamburger Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer"
            title="Search Catalog"
            aria-label="Search Products"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fine Hamburger Menu Icon Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition duration-200 cursor-pointer ${
              menuOpen
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
            aria-label="Toggle Navigation Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
            <span className="text-xs font-bold tracking-tight hidden sm:inline">
              {menuOpen ? 'Close' : 'Menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Hamburger Drawer / Flyout Navigation */}
      {menuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 top-[75px] bg-slate-950/40 backdrop-blur-2xs z-30 transition-opacity animate-in fade-in duration-150"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Flyout Menu Container */}
          <div className="absolute top-[75px] right-0 left-0 sm:left-auto sm:right-6 sm:w-80 bg-white sm:rounded-2xl border-b sm:border border-slate-200 shadow-xl z-40 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Navigation
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                AFINBO Nigeria
              </span>
            </div>

            {/* Menu items: Home, Products, About AFINBO */}
            <div className="space-y-1.5">
              {navLinks.map((link) => {
                const active = isPathActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        active ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Request Quote Button inside the Hamburger Menu */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRequestQuote();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition duration-150 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Request Quote</span>
              </button>
            </div>

            {/* Quick Contact hotline note */}
            <div className="pt-1 text-center">
              <a
                href="tel:+2348033922029"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
              >
                <PhoneCall className="w-3 h-3 text-rose-600" />
                <span>Need immediate support? +234 803 392 2029</span>
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
