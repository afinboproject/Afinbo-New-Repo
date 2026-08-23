import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ValueProps } from './components/ValueProps';
import { CategoryGrid } from './components/CategoryGrid';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ProductsCatalog } from './components/ProductsCatalog';
import { Footer } from './components/Footer';
import { QuoteModal } from './components/QuoteModal';
import { CategoryModal } from './components/CategoryModal';
import { ContactModal } from './components/ContactModal';
import { SearchModal } from './components/SearchModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { Product, Category } from './types';
import { CATEGORIES } from './data';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'products'>('products');
  const [initialCatalogCategory, setInitialCatalogCategory] = useState<string | null>(null);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<Product | null>(null);

  const [quickViewModalOpen, setQuickViewModalOpen] = useState(false);
  const [selectedProductForQuickView, setSelectedProductForQuickView] = useState<Product | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

  const handleSelectCategory = (category: Category) => {
    setInitialCatalogCategory(category.name);
    setCurrentTab('products');
  };

  const handleOpenCategoryByName = (categoryName: string) => {
    setInitialCatalogCategory(categoryName);
    setCurrentTab('products');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900 flex flex-col justify-between">
      <div>
        {/* 1. Header / Navigation */}
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'home') setInitialCatalogCategory(null);
          }}
          onRequestQuote={handleOpenGeneralQuote}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* Dynamic Main View */}
        {currentTab === 'home' ? (
          <>
            {/* Hero Section */}
            <Hero
              onExploreCatalog={() => setCurrentTab('products')}
              onContactSales={() => setContactModalOpen(true)}
            />

            {/* Value Props Section */}
            <ValueProps />

            {/* Category Grid ("Shop by Category") */}
            <CategoryGrid onSelectCategory={handleSelectCategory} />

            {/* Featured Equipment */}
            <FeaturedProducts
              onRequestQuoteProduct={handleOpenProductQuote}
              onQuickViewProduct={handleOpenQuickView}
              onViewAllProducts={() => setCurrentTab('products')}
            />
          </>
        ) : (
          /* Store / Products Catalog View */
          <ProductsCatalog
            onRequestQuoteProduct={handleOpenProductQuote}
            onQuickViewProduct={handleOpenQuickView}
            onNavigateHome={() => setCurrentTab('home')}
            initialCategory={initialCatalogCategory}
          />
        )}
      </div>

      {/* Footer */}
      <Footer
        onOpenCategory={handleOpenCategoryByName}
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

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        category={selectedCategory}
        onRequestQuoteProduct={handleOpenProductQuote}
        onQuickViewProduct={handleOpenQuickView}
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
        onSelectCategory={handleSelectCategory}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
