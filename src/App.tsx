import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { 
  getPortfolioItems, getServices, initializeDatabaseIfEmpty, addNotification 
} from './lib/dbService';
import { PortfolioItem, Service } from './types';
import { detectUserCurrency, fetchExchangeRates, formatConvertedPrice, convertUSD } from './lib/currencyService';
import { getSiteSettings, getNavLinks, getPageContents, SiteSettings, NavLink, PageContent, updateSiteSettings } from './lib/cmsService';

// Icons
import { 
  Sun, Moon, LogIn, LogOut, Menu, X, Play, Sparkles, Filter, Settings as GearIcon,
  ChevronDown, Layers, Video, Image as ImageIcon, ArrowRight, HelpCircle, Laptop,
  Facebook, Instagram, Linkedin, Phone, Mail, MapPin
} from 'lucide-react';

// Subcomponents
import BeforeAfterSlider from './components/BeforeAfterSlider';
import NotificationCenter from './components/NotificationCenter';
import GDPRConsent from './components/GDPRConsent';
import OfflineIndicator from './components/OfflineIndicator';
import AuthModal from './components/AuthModal';
import OrderFormModal from './components/OrderFormModal';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import SettingsModal from './components/SettingsModal';
import FilePreviewModal from './components/FilePreviewModal';

import { FAQS } from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [loadingUser, setLoadingUser] = useState(true);

  // Currency States
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Data states
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'photo' | 'video'>('all');

  // CMS dynamic state values
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [activePage, setActivePage] = useState<PageContent | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    // Detect currency and fetch rates on startup
    async function initCurrency() {
      try {
        const detected = await detectUserCurrency();
        setCurrency(detected);
        const rates = await fetchExchangeRates();
        setExchangeRates(rates);
      } catch (err) {
        console.error('Failed to initialize local currency:', err);
      }
    }
    initCurrency();
  }, []);

  // UI state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pixelcraft_theme');
    return saved ? saved === 'dark' : true; // Default to eye-friendly dark theme
  });
  const [currentView, setCurrentView] = useState<'home' | 'client_dashboard' | 'admin_dashboard'>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [activeOrderModal, setActiveOrderModal] = useState<Service | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  // Mobile navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // File Preview Modal for akstar-storage.local URLs
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Global click interceptor for simulated storage URLs
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.includes('akstar-storage.local')) {
          e.preventDefault();
          setPreviewFileUrl(href);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  useEffect(() => {
    // Apply dark class to body/html
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pixelcraft_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    // 1. Initialize databases with mock defaults if empty on first startup
    initializeDatabaseIfEmpty();

    // 2. Fetch landing catalog items
    loadCatalogData();

    // 3. Listen to auth state updates
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Strict requirement: akstarofficial732@gmail.com, akashbehera599@gmail.com & akstarmodofficial732@gmail.com are granted Admin Panel role
        if (user.email === 'akstarofficial732@gmail.com' || user.email === 'akashbehera599@gmail.com' || user.email === 'akstarmodofficial732@gmail.com') {
          setUserRole('admin');
          setCurrentView('admin_dashboard');
        } else {
          setUserRole('client');
          setCurrentView('client_dashboard');
        }
        setLoadingUser(false);
      } else {
        // Fallback: Check if there is a local mock user saved
        const localUserStr = localStorage.getItem('local_mock_user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            setCurrentUser(localUser);
            if (localUser.email === 'akstarofficial732@gmail.com' || localUser.email === 'akashbehera599@gmail.com' || localUser.email === 'akstarmodofficial732@gmail.com') {
              setUserRole('admin');
              setCurrentView('admin_dashboard');
            } else {
              setUserRole('client');
              setCurrentView('client_dashboard');
            }
          } catch (e) {
            console.error(e);
            setCurrentUser(null);
            setUserRole('client');
            setCurrentView('home');
          }
        } else {
          setCurrentUser(null);
          setUserRole('client');
          setCurrentView('home');
        }
        setLoadingUser(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${settings.faviconUrl}</text></svg>`;
      }
      if (settings.siteTitle) {
        document.title = settings.siteTitle;
      }
    }
  }, [settings]);

  const applyThemeFromCMS = (color: string, font: string) => {
    const colorClasses: Record<string, string> = {
      amber: '#f59e0b',
      emerald: '#10b981',
      blue: '#3b82f6',
      violet: '#8b5cf6',
      rose: '#f43f5e'
    };
    const primaryHex = colorClasses[color] || '#f59e0b';
    document.documentElement.style.setProperty('--color-primary-cms', primaryHex);
    
    const fontClasses: Record<string, string> = {
      sans: '"Inter", sans-serif',
      serif: '"Playfair Display", serif',
      mono: '"JetBrains Mono", monospace',
      space: '"Space Grotesk", sans-serif'
    };
    const fontValue = fontClasses[font] || '"Inter", sans-serif';
    document.documentElement.style.setProperty('--font-family-cms', fontValue);
  };

  const loadCatalogData = async () => {
    try {
      const ports = await getPortfolioItems();
      const svcs = await getServices();
      setPortfolio(ports);
      setServices(svcs);

      // Fetch CMS options dynamically
      const fetchedSettings = await getSiteSettings();
      const fetchedNav = await getNavLinks();
      const fetchedPages = await getPageContents();

      setSettings(fetchedSettings);
      setNavLinks(fetchedNav);
      setPages(fetchedPages);

      if (fetchedSettings) {
        applyThemeFromCMS(fetchedSettings.primaryColor, fetchedSettings.fontTheme);
      }
    } catch (err) {
      console.error('Error loading home catalog:', err);
    }
  };

  const handleBookingClick = (service: Service) => {
    if (!currentUser) {
      // Prompt sign in
      setShowAuthModal(true);
    } else {
      // Open order details modal
      setActiveOrderModal(service);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('local_mock_user');
      await signOut(auth);
      setCurrentUser(null);
      setUserRole('client');
      setCurrentView('home');
    } catch (err) {
      console.error('Signout failed:', err);
    }
  };

  const handleNavLinkClick = (url: string) => {
    if (url.startsWith('#')) {
      const pageId = url.replace('#', '').replace('-modal', '');
      const matchedPage = pages.find(p => p.id === pageId);
      if (matchedPage) {
        setActivePage(matchedPage);
        return;
      }

      const anchorId = url.replace('#', '');
      const element = document.getElementById(anchorId);
      if (element) {
        setCurrentView('home');
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Safe navigation wrapper to close modals if navigating
  const navigateToOrderFromNotification = (orderId: string) => {
    if (userRole === 'admin') {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView('client_dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-sans transition-colors duration-300 flex flex-col">
      
      {/* FLOATING UTILITIES */}
      <OfflineIndicator />
      <GDPRConsent />

      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Branding */}
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white shadow-sm flex items-center justify-center shrink-0">
              <img 
                src="/src/assets/images/ak_star_logo_1782804903810.jpg" 
                alt={settings?.logoText || 'AK STAR DIGITAL'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                width={40}
                height={40}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="font-sans font-bold text-sm tracking-tight text-neutral-900 dark:text-white flex flex-col items-start leading-none text-left">
              <span className="text-amber-500 font-mono text-[9px] font-bold uppercase tracking-wider">PRODUCTION</span>
              <span>{settings?.logoText || 'AK STAR DIGITAL'}</span>
            </span>
          </button>

          {/* Dynamic Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <button 
              id="nav-link-home"
              onClick={() => setCurrentView('home')} 
              className={`px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${currentView === 'home' ? 'text-amber-500 bg-neutral-50 dark:bg-neutral-850' : ''}`}
            >
              Home Portfolio
            </button>

            {currentUser && (
              <button 
                id="nav-link-dashboard"
                onClick={() => setCurrentView(userRole === 'admin' ? 'admin_dashboard' : 'client_dashboard')}
                className={`px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${currentView !== 'home' ? 'text-amber-500 bg-neutral-50 dark:bg-neutral-850' : ''}`}
              >
                {userRole === 'admin' ? 'Owner Admin Panel' : 'Your Order Pipelines'}
              </button>
            )}

            {navLinks.filter(link => link.position === 'header').sort((a,b) => a.order - b.order).map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavLinkClick(link.url)}
                className="px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Right Header Panel (Utility controls) */}
          <div className="flex items-center gap-3">
            
            {/* Live Notifications dropdown chimes */}
            {currentUser && (
              <NotificationCenter 
                currentUser={currentUser}
                userRole={userRole}
                onNavigateToOrder={navigateToOrderFromNotification} 
              />
            )}

            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-neutral-150 dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl text-4xs font-bold text-neutral-600 dark:text-neutral-300">
              <span className="text-xs">🌐</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent border-none outline-none font-sans font-extrabold text-neutral-700 dark:text-neutral-200 cursor-pointer pr-1 animate-pulse"
                title="Select checkout currency"
              >
                <option value="USD" className="bg-white dark:bg-neutral-900">USD ($)</option>
                <option value="INR" className="bg-white dark:bg-neutral-900">INR (₹)</option>
                <option value="EUR" className="bg-white dark:bg-neutral-900">EUR (€)</option>
                <option value="GBP" className="bg-white dark:bg-neutral-900">GBP (£)</option>
                <option value="JPY" className="bg-white dark:bg-neutral-900">JPY (¥)</option>
                <option value="CAD" className="bg-white dark:bg-neutral-900">CAD (C$)</option>
                <option value="AUD" className="bg-white dark:bg-neutral-900">AUD (A$)</option>
              </select>
            </div>

            {/* Control Settings Trigger */}
            <button 
              id="header-settings-btn"
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="System Settings Panel"
            >
              <GearIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:rotate-45 transition-all duration-300" />
            </button>

            {/* Dark Mode Toggle */}
            <button 
              id="theme-toggler"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Authentication Action */}
            {loadingUser ? (
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
            ) : currentUser ? (
              <div className="flex items-center gap-2.5 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                <div className="hidden lg:block text-right">
                  <p className="text-3xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-4xs text-neutral-400 font-mono capitalize">
                    {userRole}
                  </p>
                </div>
                
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Sign out of account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 rounded-xl text-3xs font-bold uppercase tracking-wider shadow flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-6 py-4 flex flex-col gap-3 text-left">
            <button 
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              className="py-2 text-xs font-semibold border-b border-neutral-100 dark:border-neutral-800"
            >
              Browse Portfolio
            </button>
            
            {currentUser && (
              <button 
                onClick={() => { setCurrentView(userRole === 'admin' ? 'admin_dashboard' : 'client_dashboard'); setMobileMenuOpen(false); }}
                className="py-2 text-xs font-semibold border-b border-neutral-100 dark:border-neutral-800 text-amber-500"
              >
                {userRole === 'admin' ? 'Owner Admin Panel' : 'Track Your Orders'}
              </button>
            )}

            <button 
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
                setTimeout(() => document.getElementById('rates-section-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="py-2 text-xs font-semibold border-b border-neutral-100 dark:border-neutral-800"
            >
              Service Pricing
            </button>

            <button 
              onClick={() => { setShowSettingsModal(true); setMobileMenuOpen(false); }}
              className="py-2.5 text-xs font-semibold text-neutral-500 hover:text-amber-500 flex items-center gap-1.5 focus:outline-none"
            >
              <GearIcon className="w-4 h-4 text-amber-500 animate-spin-slow" />
              Settings & Currency Selector
            </button>
          </div>
        )}

      </header>

      {/* VIEW COORDINATOR */}
      <div className="flex-1 flex flex-col">
        
        {/* VIEW A: LANDING PAGE HOME */}
        {currentView === 'home' && (
          <div className="flex-1 flex flex-col">
            
            {/* HERO SEGMENT */}
            <section className="relative overflow-hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-900 text-left shrink-0">
              {/* Decorative backgrounds */}
              <div className="absolute inset-y-0 right-0 w-1/2 bg-amber-500/5 dark:bg-amber-500/2 rounded-l-full blur-3xl pointer-events-none" />
              
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Premium Post-Production Store
                  </div>
                  
                  <h1 className="font-sans font-extrabold text-3xl md:text-5xl lg:text-6xl text-neutral-900 dark:text-white leading-none tracking-tight">
                    {settings?.bannerTitle || 'Flawless Photo & Video Editing for Creators & Brands'}
                  </h1>
                  
                  <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                    {settings?.bannerSubtitle || 'Elevate your raw assets into breathtaking cinematic masterpieces. We specialize in precision skin retouching, product composition, custom soundscapes, and color grading. Direct, automated invoicing and real-time review queues.'}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button 
                      onClick={() => handleNavLinkClick(settings?.bannerButtonLink || '#portfolio-section-anchor')}
                      className="px-6 py-3 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {settings?.bannerButtonText || 'Browse Portfolio Works'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => document.getElementById('rates-section-anchor')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      View Production Rates
                    </button>
                  </div>
                </div>

                {/* Hero Showcase Display (Interactive before/after teaser) */}
                <div className="hidden lg:block relative p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                  <BeforeAfterSlider 
                    title="Cyberpunk Teaser comparison"
                    beforeUrl="https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=600"
                    afterUrl="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600"
                  />
                </div>
              </div>
            </section>

            {/* PORTFOLIO CATALOG GRID SECTION */}
            <section id="portfolio-section-anchor" className="max-w-7xl mx-auto w-full px-4 md:px-8 py-16 space-y-8 text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <span className="text-4xs font-mono text-amber-500 uppercase font-bold tracking-wider">CREATIVE ARCHIVE</span>
                  <h2 className="font-sans font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white mt-1">Our Featured Showcase</h2>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl">
                  {(['all', 'photo', 'video'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPortfolioFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        portfolioFilter === filter
                          ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio
                  .filter(item => portfolioFilter === 'all' || item.category === portfolioFilter)
                  .map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedPortfolioItem(item)}
                      className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col text-left"
                    >
                      {/* Media Cover thumbnail */}
                      <div className="aspect-video relative overflow-hidden bg-neutral-900 flex items-center justify-center">
                        <img 
                          src={item.mediaUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {item.category === 'video' ? (
                            <Play className="w-10 h-10 text-white fill-white" />
                          ) : (
                            <span className="px-3 py-1.5 bg-white text-neutral-950 font-bold text-xs rounded-xl shadow font-sans">Compare Raw & Edited</span>
                          )}
                        </div>
                        <span className="absolute top-3 left-3 bg-neutral-900/85 backdrop-blur text-white text-4xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{item.title}</h4>
                          <p className="text-2xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-4">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-850 text-neutral-400 text-4xs font-medium rounded-md font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* SERVICES & PRICING RATE TIERS */}
            <section id="rates-section-anchor" className="bg-white dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900 py-16 text-left">
              <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                <div>
                  <span className="text-4xs font-mono text-amber-500 uppercase font-bold tracking-wider">CLEAR CONTRACTING</span>
                  <h2 className="font-sans font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white mt-1">Our Standard Production Rates</h2>
                  <p className="text-2xs text-neutral-500 dark:text-neutral-400 mt-1">Pick a level. Submit your project requirements, configure speed, authorize sandbox checkout, and trace progress live.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((svc) => (
                    <div 
                      key={svc.id}
                      className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                          <div>
                            <span className="inline-block px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded text-4xs font-mono font-semibold uppercase">
                              {svc.type} Service
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white mt-1.5">{svc.name}</h4>
                          </div>
                          <span className="font-mono text-sm font-bold text-amber-500 shrink-0">
                            {formatConvertedPrice(convertUSD(svc.price, currency, exchangeRates), currency)}
                          </span>
                        </div>
                        
                        <p className="text-2xs text-neutral-500 dark:text-neutral-400 leading-normal">{svc.description}</p>
                        
                        <div className="space-y-1.5">
                          {svc.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-3xs text-neutral-600 dark:text-neutral-400">
                              <span className="text-amber-500 shrink-0">•</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        id={`btn-order-svc-landing-${svc.id}`}
                        onClick={() => handleBookingClick(svc)}
                        className="w-full mt-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 font-bold text-3xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        Book Editing
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* INTUITIVE FAQ SEGMENT */}
            <section className="max-w-4xl mx-auto w-full px-4 md:px-8 py-16 space-y-8 text-left">
              <div className="text-center space-y-1.5">
                <HelpCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="font-sans font-extrabold text-xl text-neutral-900 dark:text-white">Frequently Asked Questions</h3>
                <p className="text-2xs text-neutral-500 dark:text-neutral-400">Everything you need to know about files delivery, revision chimes, and receipts</p>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-5 flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-left focus:outline-none cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4.5 h-4.5 text-neutral-400 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
                    </button>
                    {faqOpen[idx] && (
                      <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/20 text-2xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* VIEW B: CLIENT PIPELINE DASHBOARD */}
        {currentView === 'client_dashboard' && currentUser && (
          <ClientDashboard 
            userEmail={currentUser.email!}
            userName={currentUser.displayName || currentUser.email!.split('@')[0]}
            userId={currentUser.uid}
            currency={currency}
            exchangeRates={exchangeRates}
          />
        )}

        {/* VIEW C: ADMIN OWNER PANEL */}
        {currentView === 'admin_dashboard' && currentUser && userRole === 'admin' && (
          <AdminDashboard />
        )}

      </div>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 py-10 mt-auto shrink-0 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white flex items-center justify-center shrink-0">
              <img 
                src="/src/assets/images/ak_star_logo_1782804903810.jpg" 
                alt={settings?.logoText || 'AK STAR DIGITAL'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={32}
                height={32}
              />
            </div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-300">
              {settings?.siteTitle || 'AK STAR DIGITAL'} • {settings?.address || 'Odisha, India'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-3xs font-mono flex-wrap justify-center">
            {navLinks.filter(link => link.position === 'footer').sort((a,b) => a.order - b.order).map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavLinkClick(link.url)}
                className="hover:underline hover:text-amber-500 cursor-pointer text-neutral-500"
              >
                {link.name}
              </button>
            ))}
            {settings?.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-amber-500">Facebook</a>
            )}
            {settings?.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-amber-500">Instagram</a>
            )}
            {settings?.linkedin && (
              <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-amber-500">LinkedIn</a>
            )}
            <span className="hidden md:inline">•</span>
            <span>GDPR Secure</span>
            <span>•</span>
            <span>TLS 256-Bit SSL Enforcements</span>
            {currentUser && (
              <>
                <span>•</span>
                <button 
                  onClick={() => setCurrentView(userRole === 'admin' ? 'admin_dashboard' : 'client_dashboard')}
                  className="hover:underline text-amber-500 cursor-pointer"
                >
                  Dashboard Access
                </button>
              </>
            )}
          </div>

          <p className="text-3xs font-mono">© 2026 {settings?.siteTitle || 'AK STAR DIGITAL'}. All Rights Reserved.</p>
        </div>
      </footer>

      {/* PORTFOLIO LIGHTBOX DETAIL COMPARATIVE OVERLAY */}
      {selectedPortfolioItem && (
        <div id="portfolio-lightbox-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <h4 className="font-sans font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                Showcase: {selectedPortfolioItem.title}
              </h4>
              <button 
                id="close-lightbox"
                onClick={() => setSelectedPortfolioItem(null)} 
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-left text-xs">
              {/* Media viewer */}
              {selectedPortfolioItem.category === 'video' ? (
                <div className="aspect-video relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex items-center justify-center">
                  <video 
                    id="lightbox-video-player"
                    src={selectedPortfolioItem.mediaUrl} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : selectedPortfolioItem.beforeUrl && selectedPortfolioItem.afterUrl ? (
                <div className="w-full">
                  <BeforeAfterSlider 
                    title={selectedPortfolioItem.title}
                    beforeUrl={selectedPortfolioItem.beforeUrl}
                    afterUrl={selectedPortfolioItem.afterUrl}
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950">
                  <img src={selectedPortfolioItem.mediaUrl} alt={selectedPortfolioItem.title} className="w-full h-full object-cover" referrerPolicy="referrer" />
                </div>
              )}

              {/* Description */}
              <div className="space-y-3">
                <div>
                  <h5 className="font-mono text-4xs uppercase tracking-wider text-neutral-400">Production parameters and techniques</h5>
                  <p className="text-neutral-700 dark:text-neutral-300 mt-1.5 leading-relaxed font-sans">{selectedPortfolioItem.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedPortfolioItem.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded text-3xs font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CMS DYNAMIC CUSTOM PAGE MODAL OVERLAY */}
      {activePage && (
        <div id="cms-page-lightbox-overlay" className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <h4 className="font-sans font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {activePage.title}
              </h4>
              <button 
                id="close-page-lightbox"
                onClick={() => setActivePage(null)} 
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-left text-xs leading-relaxed">
              {activePage.imageUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-100 dark:bg-neutral-950">
                  <img src={activePage.imageUrl} alt={activePage.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="space-y-3 font-sans">
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line text-xs">{activePage.content}</p>
              </div>
              <div className="text-4xs font-mono text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                Last updated: {new Date(activePage.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS LOGIN MODAL */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={(user) => {
            localStorage.setItem('local_mock_user', JSON.stringify(user));
            setCurrentUser(user);
            if (user.email === 'akstarofficial732@gmail.com' || user.email === 'akashbehera599@gmail.com' || user.email === 'akstarmodofficial732@gmail.com') {
              setUserRole('admin');
              setCurrentView('admin_dashboard');
            } else {
              setUserRole('client');
              setCurrentView('client_dashboard');
            }
          }}
        />
      )}

      {/* BOOKING ORDER MODAL */}
      {activeOrderModal && currentUser && (
        <OrderFormModal 
          service={activeOrderModal}
          clientEmail={currentUser.email!}
          clientName={currentUser.displayName || currentUser.email!.split('@')[0]}
          clientId={currentUser.uid}
          currency={currency}
          exchangeRates={exchangeRates}
          onClose={() => setActiveOrderModal(null)}
          onSuccess={(newOrderId) => {
            setActiveOrderModal(null);
            setCurrentView('client_dashboard');
          }}
        />
      )}

      {/* SYSTEM SETTINGS & CURRENCY CONTROL MODAL */}
      {showSettingsModal && (
        <SettingsModal 
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currency={currency}
          setCurrency={(newCurr) => {
            setCurrency(newCurr);
          }}
          settings={settings}
          isAdmin={userRole === 'admin'}
          onUpdateSettings={async (updatedFields) => {
            try {
              const updated = await updateSiteSettings(updatedFields);
              setSettings(updated);
            } catch (err) {
              console.error('Failed to save settings:', err);
            }
          }}
        />
      )}

      {/* AK STAR STORAGE PREVIEW MODAL */}
      {previewFileUrl && (
        <FilePreviewModal 
          fileUrl={previewFileUrl}
          onClose={() => setPreviewFileUrl(null)}
        />
      )}

    </div>
  );
}
