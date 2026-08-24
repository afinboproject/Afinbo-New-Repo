/*
vercel.json setup:
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
*/

import React, { useState } from 'react';
import { RouterProvider, useRouter, normalizePath } from './lib/router';
import { AuthProvider } from './lib/auth';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ValueProps } from './components/ValueProps';
import { CategoryGrid } from './components/CategoryGrid';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ProductsCatalog } from './components/ProductsCatalog';
import { AboutAfinbo } from './components/AboutAfinbo';
import { Footer } from './components/Footer';
import { QuoteModal } from './components/QuoteModal';
import { ContactModal } from './components/ContactModal';
import { SearchModal } from './components/SearchModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Product } from './types';
import { CheckCircle2, X } from 'lucide-react';

function AppContent() {
  const { currentPath } = useRouter();

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<Product | null>(null);

  const [quickViewModalOpen, setQuickViewModalOpen] = useState(false);
  const [selectedProductForQuickView, setSelectedProductForQuickView] = useState<Product | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenGeneralQuote = () => {
    setSelectedProductForQuote(null);
    setQuoteModalOpen(true);
  };

  const handleOpenProductQuote = (product: Product) => {
    setSelectedProductForQuote(product);
    setQuoteModalOpen(true);
  };

  const handleOpenQuickView = (product: Product) => {
    setSelectedProductForQuickView(product);
    setQuickViewModalOpen(true);
  };

  // Route Resolution based on clean pathname
  const normalized = normalizePath(currentPath);
  const isAdminRoute = normalized === '/admin' || normalized === '/login';

  const renderCurrentView = () => {
    switch (normalized) {
      case '/':
        return (
          <main>
            {/* Hero Section */}
            <Hero onContactSales={() => setContactModalOpen(true)} />

            {/* Value Props Section */}
            <ValueProps />

            {/* Category Grid ("Shop by Category") with Clean Links */}
            <CategoryGrid />

            {/* Featured Equipment */}
            <FeaturedProducts
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );

      case '/about-afinbo':
        return (
          <main>
            <AboutAfinbo
              onRequestQuote={handleOpenGeneralQuote}
              onOpenContact={() => setContactModalOpen(true)}
            />
          </main>
        );

      case '/strippers':
        return (
          <main>
            <ProductsCatalog
              routeCategory="Strippers"
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );

      case '/cleavers':
        return (
          <main>
            <ProductsCatalog
              routeCategory="Cleavers"
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );

      case '/testers':
        return (
          <main>
            <ProductsCatalog
              routeCategory="Testers"
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );

      case '/splicers':
        return (
          <main>
            <ProductsCatalog
              routeCategory="Splicers"
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );

      case '/admin':
      case '/login':
        return (
          <main>
            <AdminDashboard />
          </main>
        );

      case '/products':
      default:
        return (
          <main>
            <ProductsCatalog
              routeCategory={null}
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
            />
          </main>
        );
    }
  };

  // If on Admin Route, render distinct and unique admin dashboard without public Header or Footer
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Isolated Distinct Admin Dashboard View */}
        <AdminDashboard />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex items-start gap-3 animate-slide-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs leading-relaxed">{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Standard Public Storefront Layout with Public Header & Footer
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900 flex flex-col justify-between">
      <div>
        {/* Public Header with Clean Path Navigation & Active State */}
        <Header
          onRequestQuote={handleOpenGeneralQuote}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* Dynamic Public Route View */}
        {renderCurrentView()}
      </div>

      {/* Public Footer with Clean Paths */}
      <Footer
        onOpenContact={() => setContactModalOpen(true)}
      />

      {/* Interactive Modals */}
      <ProductQuickViewModal
        isOpen={quickViewModalOpen}
        onClose={() => setQuickViewModalOpen(false)}
        product={selectedProductForQuickView}
        onRequestQuote={handleOpenProductQuote}
      />

      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        selectedProduct={selectedProductForQuote}
        onSuccess={showToast}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSuccess={showToast}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onRequestQuoteProduct={handleOpenProductQuote}
        onQuickViewProduct={handleOpenQuickView}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
}

