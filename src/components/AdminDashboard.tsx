import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FileText,
  Trash2,
  Plus,
  Edit2,
  Lock,
  LogOut,
  Search,
  CheckCircle2,
  X,
  PlusCircle,
  AlertTriangle,
  Inbox,
  Loader2,
  ShieldCheck,
  Bell,
  BellRing,
  Volume2,
  Mail,
  Settings,
  CheckCheck,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  ArrowRight,
  Globe,
  Database,
  Filter,
  Check
} from 'lucide-react';
import { AdminAuth } from './AdminAuth';
import { Product, TechSpec, AdminNotification, NotificationSettings } from '../types';
import { FEATURED_PRODUCTS } from '../data';
import {
  isSupabaseConfigured,
  supabase,
  formatSpecToString,
  normalizeTechSpecs,
  mapDbProductToUiProduct
} from '../lib/supabase';
import { useRouter } from '../lib/router';
import { useAdminSession } from '../lib/useAdminSession';
import {
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  saveNotificationSettings,
  subscribeToNotifications,
  triggerQuoteNotification,
  playNotificationSound
} from '../lib/notifications';

interface QuoteItem {
  id: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  quantity: number;
  notes?: string;
  admin_notes?: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { navigate } = useRouter();

  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tab & View State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'quotes'>('products');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');

  // Data State
  const [products, setProducts] = useState<Product[]>(FEATURED_PRODUCTS);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Notification System State
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => getStoredNotifications());
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [activeInAppAlert, setActiveInAppAlert] = useState<AdminNotification | null>(null);

  // Test Notification State
  const [testSending, setTestSending] = useState(false);
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Splicers');
  const [prodModel, setProdModel] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBrand, setProdBrand] = useState('AFINBO');
  const [prodImage, setProdImage] = useState('');
  const [prodSubtitle, setProdSubtitle] = useState('');
  const [prodOverview, setProdOverview] = useState('');
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [techSpecs, setTechSpecs] = useState<TechSpec[]>([
    { label: 'Applicable Fiber', value: 'SM, MM, DS, NZDS' },
    { label: 'Splice Time', value: '6 seconds (Quick Mode)' },
  ]);
  const [features, setFeatures] = useState<string[]>([
    'Core-to-core optical alignment technology',
    'Reinforced shock-proof and dust-resistant casing',
  ]);

  // Quote Review Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);
  const [quoteEditStatus, setQuoteEditStatus] = useState<QuoteItem['status']>('pending');
  const [quoteAdminNotes, setQuoteAdminNotes] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Comprehensive view state clearance callback for session timeout & logout
  const clearDashboardViewState = useCallback(() => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProdName('');
    setProdCategory('Splicers');
    setProdModel('');
    setProdSku('');
    setProdBrand('AFINBO');
    setProdImage('');
    setProdSubtitle('');
    setProdOverview('');
    setProdBestSeller(false);
    setTechSpecs([
      { label: 'Applicable Fiber', value: 'SM, MM, DS, NZDS' },
      { label: 'Splice Time', value: '6 seconds (Quick Mode)' },
    ]);
    setFeatures([
      'Core-to-core optical alignment technology',
      'Reinforced shock-proof and dust-resistant casing',
    ]);

    setIsQuoteModalOpen(false);
    setSelectedQuote(null);
    setQuoteAdminNotes('');

    setIsNotificationDrawerOpen(false);
    setIsSettingsModalOpen(false);
    setActiveInAppAlert(null);

    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setQuoteStatusFilter('all');
    setActiveTab('products');
    setIsMobileMenuOpen(false);
    setToastMessage(null);
    setTestSuccessMsg(null);
  }, []);

  // Admin session check & inactivity timer hook
  const {
    isAuthenticated,
    user,
    logout,
    resetActivity,
    formattedTimeRemaining,
    timeRemainingMs,
  } = useAdminSession({
    onSessionExpired: clearDashboardViewState,
    redirectTo: '/admin',
    requireAuth: true,
  });

  // Sync with URL search params (e.g. /admin?tab=quotes or /admin?tab=settings)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'products' || tabParam === 'quotes' || tabParam === 'overview') {
        setActiveTab(tabParam);
      } else if (tabParam === 'notifications') {
        setIsNotificationDrawerOpen(true);
      } else if (tabParam === 'settings') {
        setIsSettingsModalOpen(true);
      }
    }
  }, []);

  // Load Data on Auth & Subscribe to Realtime Notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadProductsData();
      loadQuotesData();
    }
  }, [isAuthenticated]);

  // Realtime notification subscription across tabs and database events
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((incoming) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });

      const currentSettings = getNotificationSettings();
      if (currentSettings.inAppBannerEnabled) {
        setActiveInAppAlert(incoming);
      }

      // Automatically reload quotes data so the quotes tab stays synchronized
      loadQuotesData();
    });

    return () => unsubscribe();
  }, []);

  // Auto-dismiss in-app notification banner after 9 seconds
  useEffect(() => {
    if (activeInAppAlert) {
      const timer = setTimeout(() => {
        setActiveInAppAlert(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [activeInAppAlert]);

  // Periodic polling for quotes synchronization when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      loadQuotesData();
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;
  const pendingQuoteCount = quotes.filter((q) => q.status === 'pending').length;

  const handleMarkAllNotificationsRead = () => {
    const updated = markAllNotificationsRead();
    setNotifications(updated);
    showToast('All notifications marked as read');
  };

  const handleMarkNotificationRead = (id: string) => {
    const updated = markNotificationRead(id);
    setNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = deleteNotification(id);
    setNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
    setNotifications([]);
    showToast('Notification log cleared');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationSettings(notifSettings);
    showToast('Notification & email preferences saved');
    setIsSettingsModalOpen(false);
  };

  const handleOpenNotificationQuote = (notif: AdminNotification) => {
    handleMarkNotificationRead(notif.id);
    setIsNotificationDrawerOpen(false);
    setActiveInAppAlert(null);

    const existing = quotes.find(
      (q) =>
        q.id === notif.quoteId ||
        (q.customer_email === notif.customerEmail && q.product_name === notif.productName)
    );

    if (existing) {
      handleOpenQuoteDetail(existing);
    } else {
      setActiveTab('quotes');
      showToast(`Reviewing inquiry for ${notif.productName}`);
    }
  };

  const handleTriggerTestNotification = async () => {
    setTestSending(true);
    setTestSuccessMsg(null);
    try {
      await triggerQuoteNotification({
        customerName: 'Engr. Adebayo Davies',
        customerEmail: notifSettings.adminEmail || 'procurement@broadband-telecoms.ng',
        customerPhone: '+234 803 555 8920',
        companyName: 'West Africa Fiber Backbone Ltd',
        productName: 'Fujikura 90S+ Core Alignment Splicer',
        quantity: 2,
        notes: 'Urgent proforma invoice required for phase-2 fiber rollout project in Ikeja.',
        quoteId: `quote-${Date.now()}`
      });

      setTestSuccessMsg('Test notification dispatched via in-app & alert sound!');
      showToast('Live test notification sent successfully');
    } catch (e) {
      console.error(e);
      showToast('Failed to trigger test notification');
    } finally {
      setTestSending(false);
    }
  };

  const handleLogoutAction = () => {
    logout();
    showToast('Signed out of Administrator Console');
  };

  // Data fetchers
  const loadProductsData = async () => {
    if (!isSupabaseConfigured()) {
      setProducts(FEATURED_PRODUCTS);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase fetch error, fallback to initial products:', error.message);
        setProducts(FEATURED_PRODUCTS);
      } else if (data && data.length > 0) {
        setProducts(data.map(mapDbProductToUiProduct));
      } else {
        setProducts(FEATURED_PRODUCTS);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts(FEATURED_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuotesData = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setQuotes(data);
      }
    } catch (e) {
      console.error('Error loading quotes:', e);
    }
  };

  // Product Form Handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory('Splicers');
    setProdModel('');
    setProdSku('');
    setProdBrand('AFINBO');
    setProdImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80');
    setProdSubtitle('');
    setProdOverview('');
    setProdBestSeller(false);
    setTechSpecs([
      { label: 'Applicable Fiber', value: 'SM / MM / DS / NZDS' },
      { label: 'Splice Time', value: '6 sec (Fast Mode)' }
    ]);
    setFeatures([
      'Core-to-core optical fiber alignment mechanism',
      'Compact shock-proof and dust-resistant casing'
    ]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdModel(p.model || '');
    setProdSku(p.sku || '');
    setProdBrand(p.brand || 'AFINBO');
    setProdImage(p.image);
    setProdSubtitle(p.subtitle || '');
    setProdOverview(p.description || '');
    setProdBestSeller(Boolean(p.isBestSeller));
    const normalized = normalizeTechSpecs(p.techSpecs || p.specs);
    setTechSpecs(
      normalized.length > 0
        ? normalized
        : [{ label: 'Applicable Fiber', value: 'SM / MM' }]
    );
    setFeatures(
      p.features && p.features.length > 0
        ? p.features
        : ['High durability telecom grade engineering']
    );
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('Product name is required');
      return;
    }

    const cleanSpecs = techSpecs.filter((s) => s.label.trim() && s.value.trim());
    const cleanFeatures = features.filter((f) => f.trim());

    const productPayload: Product = {
      id: editingProductId || `prod-${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      brand: prodBrand.trim() || 'AFINBO',
      model: prodModel.trim(),
      sku: prodSku.trim(),
      image: prodImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      subtitle: prodSubtitle.trim() || 'Precision telecom installation equipment',
      description: prodOverview.trim() || 'Professional telecommunications equipment distributed by AFINBO Nigeria.',
      isBestSeller: prodBestSeller,
      specs: cleanSpecs.map((s) => `${s.label}: ${s.value}`),
      techSpecs: cleanSpecs,
      features: cleanFeatures,
      inStock: true,
    };

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          name: productPayload.name,
          category: productPayload.category,
          brand: productPayload.brand,
          model: productPayload.model,
          sku: productPayload.sku,
          image_url: productPayload.image,
          subtitle: productPayload.subtitle,
          overview: productPayload.description,
          best_seller: productPayload.isBestSeller,
          specifications: cleanSpecs,
          features: cleanFeatures,
        };

        if (editingProductId) {
          await supabase.from('products').update(dbPayload).eq('id', editingProductId);
        } else {
          await supabase.from('products').insert([dbPayload]);
        }
      } catch (err) {
        console.error('Supabase product sync error:', err);
      }
    }

    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? productPayload : p)));
      showToast('Equipment details updated successfully');
    } else {
      setProducts((prev) => [productPayload, ...prev]);
      showToast('New equipment added to catalog');
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this equipment from the catalog?')) return;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Equipment removed from catalog');
  };

  // Quote Review Handlers
  const handleOpenQuoteDetail = (q: QuoteItem) => {
    setSelectedQuote(q);
    setQuoteEditStatus(q.status);
    setQuoteAdminNotes(q.admin_notes || '');
    setIsQuoteModalOpen(true);
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('quotes')
          .update({ status: quoteEditStatus, admin_notes: quoteAdminNotes })
          .eq('id', selectedQuote.id);
      } catch (e) {
        console.error(e);
      }
    }
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === selectedQuote.id
          ? { ...q, status: quoteEditStatus, admin_notes: quoteAdminNotes }
          : q
      )
    );
    showToast(`Quote request marked as ${quoteEditStatus}`);
    setIsQuoteModalOpen(false);
  };

  const handleDeleteQuote = async (id: string) => {
    if (!window.confirm('Delete this quote request permanently?')) return;
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('quotes').delete().eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setIsQuoteModalOpen(false);
    showToast('Quote request deleted');
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const filteredQuotes = quotes.filter((q) => {
    if (quoteStatusFilter === 'all') return true;
    return q.status === quoteStatusFilter;
  });

  // -------------------------------------------------------------
  // RENDER: DISTINCT AUTHENTICATION LOGIN / SIGN UP PORTAL
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return <AdminAuth onSuccess={() => showToast('Authenticated successfully. Welcome back to AFINBO Admin.')} />;
  }

  // -------------------------------------------------------------
  // RENDER: DEDICATED AUTHENTICATED ADMIN DASHBOARD (PLAIN LIGHT SAAS)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* ========================================================= */}
      {/* 1. DISTINCT TOP ADMIN CONTROL BAR (LIGHT SAAS) */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top vibrant brand accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600 w-full" />

        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Sidebar Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sidebar Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              title={isSidebarCollapsed ? 'Expand Navigation Menu' : 'Collapse Navigation Menu'}
              aria-label="Toggle Sidebar Menu"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* AFINBO Logo (CLICKABLE TO HOMEPAGE) */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group cursor-pointer text-left"
              title="Click to visit Public Storefront Home (AFINBO)"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-rose-600 transition">
                    AFINBO
                  </span>
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                    Console
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Quick Link: Preview Public Store */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
              title="View Public Customer Storefront"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Public Store</span>
            </button>

            {/* Realtime Notification Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition flex items-center justify-center cursor-pointer group border border-slate-200"
              title="Inquiry Notifications"
            >
              {unreadNotificationCount > 0 ? (
                <BellRing className="w-4 h-4 text-rose-600 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              )}
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition flex items-center justify-center cursor-pointer border border-slate-200"
              title="Notification & Email Dispatch Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Admin Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden xl:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Administrator'}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium mt-0.5" title="Session auto-renews on activity. Expires after 30 minutes of inactivity.">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Session: {formattedTimeRemaining}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutAction}
                className="text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Sign out of Admin Dashboard"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. BODY LAYOUT: COLLAPSIBLE SIDEBAR + MAIN CONTENT */}
      {/* ========================================================= */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        
        {/* DESKTOP COLLAPSIBLE SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="p-4 flex-1 flex flex-col justify-between space-y-6">
            
            {/* Sidebar Nav Items */}
            <div className="space-y-6">
              {/* Section 1: Main Control */}
              <div>
                {!isSidebarCollapsed && (
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
                    Management
                  </p>
                )}
                <div className="space-y-1">
                  {/* Overview Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title="Dashboard Overview"
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Overview & KPIs</span>}
                  </button>

                  {/* Products Catalog Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'products'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title="Products Catalog"
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4 flex-shrink-0" />
                      {!isSidebarCollapsed && <span>Equipment Catalog</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {products.length}
                      </span>
                    )}
                  </button>

                  {/* Quote Requests Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('quotes')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'quotes'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title="Quote Requests"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      {!isSidebarCollapsed && <span>Quote Inquiries</span>}
                    </div>
                    {!isSidebarCollapsed && pendingQuoteCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        {pendingQuoteCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Section 2: Quick Tools */}
              <div>
                {!isSidebarCollapsed && (
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
                    Quick Actions
                  </p>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title="Add New Equipment"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>+ Add Equipment</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNotificationDrawerOpen(true)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title="Inquiry Notifications"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      {!isSidebarCollapsed && <span>Notifications</span>}
                    </div>
                    {!isSidebarCollapsed && unreadNotificationCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title="Notification & Email Settings"
                  >
                    <Settings className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>Alert & Email Settings</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Bottom: Storage Status & Collapse Toggle */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              {!isSidebarCollapsed && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Database Sync
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isSupabaseConfigured() ? 'Supabase Cloud Connected' : 'Local Memory Storage'}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-semibold cursor-pointer border border-transparent hover:border-slate-200"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Collapse Menu</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </aside>

        {/* MOBILE SLIDE-OUT DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between z-10 animate-slide-left">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm">
                      A
                    </div>
                    <span className="font-black text-lg text-slate-900">AFINBO Admin</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1 text-sm font-bold">
                  <button
                    onClick={() => {
                      setActiveTab('overview');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl ${
                      activeTab === 'overview' ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('products');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl ${
                      activeTab === 'products' ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4" />
                      <span>Equipment Catalog</span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                      {products.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('quotes');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl ${
                      activeTab === 'quotes' ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      <span>Quote Requests</span>
                    </div>
                    {pendingQuoteCount > 0 && (
                      <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingQuoteCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleOpenAddProduct();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Equipment</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-3 rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-200"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>View Public Storefront</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogoutAction}
                  className="w-full text-rose-600 font-bold p-3 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN ADMIN DASHBOARD WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          
          {/* Top KPI Metric Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Equipment in Catalog */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Total Equipment
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{products.length}</h3>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Active in Procurement Catalog</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Box className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total Quote Requests */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Quote Inquiries
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{quotes.length}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Procurement Requests Received</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Pending Action */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                  Pending Review
                </p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{pendingQuoteCount}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Awaiting Proforma Invoice</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Live Notifications */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Unread Alerts
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{unreadNotificationCount}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Real-time quote notifications</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB CONTENT: OVERVIEW / PRODUCTS / QUOTES */}
          {/* ========================================================= */}

          {/* TAB 0: OVERVIEW & ACTIVITY HUB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Recent Quote Inquiries</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct client submissions needing proforma invoices or sales outreach.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('quotes')}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all {quotes.length} quotes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-4">
                  {quotes.slice(0, 5).map((q) => (
                    <div key={q.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{q.customer_name}</span>
                          {q.company_name && (
                            <span className="text-xs text-slate-500">• {q.company_name}</span>
                          )}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize ${
                            q.status === 'pending'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5">
                          Requested: <span className="font-semibold text-rose-600">{q.quantity}x {q.product_name}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {q.customer_email} {q.customer_phone ? `• ${q.customer_phone}` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenQuoteDetail(q)}
                        className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Process</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {quotes.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No quotes in database.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Add New Equipment</h4>
                  <p className="text-xs text-slate-500">
                    Publish optical fusion splicers, precision cleavers, or testers into the quote catalog.
                  </p>
                  <button
                    onClick={handleOpenAddProduct}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    Launch Equipment Form
                  </button>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Dispatch Test Alert</h4>
                  <p className="text-xs text-slate-500">
                    Verify email alerting channels, audio chimes, and instant in-app toast alerts.
                  </p>
                  <button
                    onClick={handleTriggerTestNotification}
                    disabled={testSending}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Simulate Live Quote
                  </button>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Visit Storefront</h4>
                  <p className="text-xs text-slate-500">
                    Review public equipment listings, technical specifications, and quote inquiry forms.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Open AFINBO Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PRODUCTS TABLE */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filter & Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter Pills */}
                  {['all', 'Splicers', 'Cleavers', 'Strippers', 'Testers'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer capitalize ${
                        selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by name, model, brand..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Equipment</span>
                  </button>
                </div>
              </div>

              {/* Products Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-4 w-16">Image</th>
                        <th className="py-3.5 px-4">Equipment Name</th>
                        <th className="py-3.5 px-4">Category / Brand</th>
                        <th className="py-3.5 px-4">Specifications Highlight</th>
                        <th className="py-3.5 px-4">Catalog Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{p.subtitle}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-rose-600">{p.brand || 'AFINBO'}</span>
                            <span className="text-slate-500 block text-[10px]">{p.category}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="line-clamp-1">
                              {formatSpecToString(p.specs?.[0]) || 'High precision fiber tool'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              Active in Catalog
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
                                title="Edit Equipment"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-slate-200"
                                title="Delete Equipment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="p-12 text-center">
                    <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No equipment found matching filter</p>
                    <p className="text-xs text-slate-500 mt-1">Adjust search parameters or add new equipment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUOTE REQUESTS TABLE */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold w-fit shadow-xs">
                {['all', 'pending', 'contacted', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setQuoteStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition cursor-pointer ${
                      quoteStatusFilter === status
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                    {status === 'pending' && pendingQuoteCount > 0 && (
                      <span className="ml-1.5 bg-white text-rose-600 px-1.5 py-0.2 rounded-full text-[9px] font-black">
                        {pendingQuoteCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Quote Inquiries Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-4">Date Received</th>
                        <th className="py-3.5 px-4">Customer / Contact</th>
                        <th className="py-3.5 px-4">Requested Equipment</th>
                        <th className="py-3.5 px-4">Quantity</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {filteredQuotes.map((q) => {
                        let statusBadge = (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            Pending Review
                          </span>
                        );
                        if (q.status === 'contacted') {
                          statusBadge = (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              Contacted / Proforma Sent
                            </span>
                          );
                        } else if (q.status === 'completed') {
                          statusBadge = (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              Completed
                            </span>
                          );
                        } else if (q.status === 'cancelled') {
                          statusBadge = (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              Cancelled
                            </span>
                          );
                        }

                        return (
                          <tr key={q.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(q.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{q.customer_name}</div>
                              <div className="text-[11px] text-slate-500">{q.company_name || 'Direct Procurement'}</div>
                              <div className="text-[11px] text-blue-600 font-mono">{q.customer_email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{q.product_name}</div>
                              {q.notes && (
                                <div className="text-[11px] text-slate-500 italic line-clamp-1 mt-0.5">
                                  &quot;{q.notes}&quot;
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-sm text-slate-900">{q.quantity}</span>
                              <span className="text-slate-400 text-[10px] ml-1">units</span>
                            </td>
                            <td className="py-3 px-4">{statusBadge}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenQuoteDetail(q)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                              >
                                Process Quote
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredQuotes.length === 0 && (
                  <div className="p-12 text-center">
                    <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No quote requests found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Client submissions from product pages will be queued here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. MODALS & SLIDE-OUT PANELS (LIGHT SAAS) */}
      {/* ========================================================= */}

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] flex flex-col text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingProductId ? 'Edit Equipment in Catalog' : 'Add New Equipment'}
                </h2>
                <p className="text-xs text-slate-500">Quote-based procurement equipment specification</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto space-y-4 pt-4 pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Equipment Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Fujikura 90S+ Core Alignment Splicer"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  >
                    <option value="Splicers">Fusion Splicers</option>
                    <option value="Cleavers">Precision Cleavers</option>
                    <option value="Strippers">Thermal & Fiber Strippers</option>
                    <option value="Testers">Testers & Inspection (OTDR/Power Meters)</option>
                    <option value="Cleaning">Cleaning & Maintenance Kits</option>
                    <option value="Tools">Ribbon Separation & Hand Tools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="AFINBO, Fujikura, Sumitomo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Main Image URL</label>
                  <input
                    type="url"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Short Subtitle</label>
                <input
                  type="text"
                  value={prodSubtitle}
                  onChange={(e) => setProdSubtitle(e.target.value)}
                  placeholder="Brief technical summary..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Engineering Product Overview</label>
                <textarea
                  rows={3}
                  value={prodOverview}
                  onChange={(e) => setProdOverview(e.target.value)}
                  placeholder="Detailed equipment description..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Dynamic Tech Specs Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold uppercase tracking-wider text-slate-700">Technical Specifications</label>
                  <button
                    type="button"
                    onClick={() => setTechSpecs((prev) => [...prev, { label: '', value: '' }])}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Spec</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {techSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. Splice Time)"
                        value={spec.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTechSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, label: val } : s)));
                        }}
                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-rose-600"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 6 seconds)"
                        value={spec.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTechSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, value: val } : s)));
                        }}
                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-rose-600"
                      />
                      <button
                        type="button"
                        onClick={() => setTechSpecs((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Features Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold uppercase tracking-wider text-slate-700">Key Features</label>
                  <button
                    type="button"
                    onClick={() => setFeatures((prev) => [...prev, ''])}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Feature</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Feature point..."
                        value={feat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFeatures((prev) => prev.map((f, i) => (i === idx ? val : f)));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-rose-600"
                      />
                      <button
                        type="button"
                        onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bestseller-cb"
                  checked={prodBestSeller}
                  onChange={(e) => setProdBestSeller(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 bg-white focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="bestseller-cb" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display &quot;Best Seller&quot; badge on storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUOTE REVIEW & STATUS UPDATE MODAL */}
      {isQuoteModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] flex flex-col text-xs text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Procurement Inquiry Details</h2>
                <p className="text-xs text-slate-500">
                  Received: {new Date(selectedQuote.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pt-4 pr-1 flex-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Client Details</p>
                <div className="grid grid-cols-2 gap-3 text-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <span className="font-bold text-sm text-slate-900">{selectedQuote.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Company</span>
                    <span className="font-semibold">{selectedQuote.company_name || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <a href={`mailto:${selectedQuote.customer_email}`} className="font-semibold text-blue-600 hover:underline">
                      {selectedQuote.customer_email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone</span>
                    <a href={`tel:${selectedQuote.customer_phone}`} className="font-semibold text-blue-600 hover:underline">
                      {selectedQuote.customer_phone || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Equipment Requested</p>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{selectedQuote.product_name}</span>
                  <span className="bg-rose-50 text-rose-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-200">
                    Qty: {selectedQuote.quantity}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Customer Procurement Notes</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic">
                  {selectedQuote.notes || 'No extra notes provided by customer.'}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Update Status</label>
                  <select
                    value={quoteEditStatus}
                    onChange={(e) => setQuoteEditStatus(e.target.value as QuoteItem['status'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="contacted">Contacted / Proforma Sent</option>
                    <option value="completed">Completed / Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Internal Admin Notes</label>
                  <textarea
                    rows={2}
                    value={quoteAdminNotes}
                    onChange={(e) => setQuoteAdminNotes(e.target.value)}
                    placeholder="Log internal follow-up steps..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteQuote(selectedQuote.id)}
                  className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Request</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateQuote}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME IN-APP ALERT BANNER */}
      {activeInAppAlert && notifSettings.inAppBannerEnabled && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-white text-slate-900 rounded-2xl p-4 shadow-2xl border-2 border-rose-500 animate-bounce-short">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm text-white">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                    Live Inquiry
                  </span>
                  <span className="text-slate-400 text-[11px]">Just now</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 mt-1">
                  New Quote Request Received!
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  <strong className="text-slate-900">{activeInAppAlert.customerName}</strong> ({activeInAppAlert.companyName || 'Direct'}) requested{' '}
                  <span className="text-rose-600 font-bold">{activeInAppAlert.quantity}x {activeInAppAlert.productName}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveInAppAlert(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveInAppAlert(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => handleOpenNotificationQuote(activeInAppAlert)}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <span>Review Quote</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATION CENTER SLIDE-OVER DRAWER (LIGHT SAAS) */}
      {isNotificationDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsNotificationDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white text-slate-900 h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Inquiry Notifications
                  </h3>
                  <p className="text-xs text-slate-500">
                    {unreadNotificationCount} unread • {notifications.length} total alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotificationDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No Notifications Yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Incoming equipment quote inquiries will alert you here in real time.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition relative ${
                      notif.read
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-rose-50/40 border-rose-200 shadow-xs'
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-600 rounded-full ring-4 ring-rose-100" />
                    )}

                    <div className="pr-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Quote Alert
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
                        {notif.productName}
                      </h4>

                      <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                        <p>
                          <strong className="text-slate-900 font-semibold">{notif.customerName}</strong>
                          {notif.companyName && <span> • {notif.companyName}</span>}
                        </p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          {notif.customerEmail} {notif.customerPhone ? `• ${notif.customerPhone}` : ''}
                        </p>
                        <p className="text-rose-600 font-bold text-[11px] mt-1">
                          Requested Units: {notif.quantity}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => handleOpenNotificationQuote(notif)}
                          className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Review & Process</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationDrawerOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Alert Settings</span>
              </button>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION & EMAIL SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] flex flex-col text-xs text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Alert & Email Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure notifications for incoming equipment inquiries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="overflow-y-auto space-y-4 pt-4 pr-1 flex-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Administrator Notification Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={notifSettings.adminEmail}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, adminEmail: e.target.value.trim() })
                    }
                    placeholder="e.g. afinboproject@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  All automated quote inquiries will be delivered directly to this administrator inbox.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Email Dispatch Alerts</span>
                    <span className="text-[11px] text-slate-500">
                      Send formatted HTML quote summaries to the administrator email.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.emailAlertsEnabled}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, emailAlertsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 bg-white focus:ring-rose-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                      Audio Chime Alert
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Play a two-tone audio chime when a quote arrives.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={playNotificationSound}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      Test Chime
                    </button>
                    <input
                      type="checkbox"
                      checked={notifSettings.soundAlertsEnabled}
                      onChange={(e) =>
                        setNotifSettings({ ...notifSettings, soundAlertsEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 bg-white focus:ring-rose-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Floating In-App Toast Banner
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Show an interactive top-right pop-up card when a quote is submitted.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.inAppBannerEnabled}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, inAppBannerEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 bg-white focus:ring-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-medium leading-relaxed">{toastMessage}</div>
        </div>
      )}

    </div>
  );
};
