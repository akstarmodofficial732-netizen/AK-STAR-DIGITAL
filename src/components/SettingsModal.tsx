import React, { useState } from 'react';
import { 
  X, Globe, Settings as GearIcon, Sliders, Palette, Link, 
  MapPin, Mail, Phone, Type, MessageSquare, Check, Sparkles, HardDrive
} from 'lucide-react';
import { SiteSettings } from '../lib/cmsService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  setCurrency: (currency: string) => void;
  settings: SiteSettings | null;
  onUpdateSettings: (updated: Partial<SiteSettings>) => Promise<void>;
  isAdmin: boolean;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currency,
  setCurrency,
  settings,
  onUpdateSettings,
  isAdmin
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'branding' | 'contact' | 'hero'>('app');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states initialized from settings or default
  const [siteTitle, setSiteTitle] = useState(settings?.siteTitle || '');
  const [siteTagline, setSiteTagline] = useState(settings?.siteTagline || '');
  const [logoText, setLogoText] = useState(settings?.logoText || '');
  const [faviconUrl, setFaviconUrl] = useState(settings?.faviconUrl || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [email, setEmail] = useState(settings?.email || '');
  const [address, setAddress] = useState(settings?.address || '');
  const [facebook, setFacebook] = useState(settings?.facebook || '');
  const [instagram, setInstagram] = useState(settings?.instagram || '');
  const [linkedin, setLinkedin] = useState(settings?.linkedin || '');
  const [bannerTitle, setBannerTitle] = useState(settings?.bannerTitle || '');
  const [bannerSubtitle, setBannerSubtitle] = useState(settings?.bannerSubtitle || '');
  const [bannerButtonText, setBannerButtonText] = useState(settings?.bannerButtonText || '');
  const [bannerButtonLink, setBannerButtonLink] = useState(settings?.bannerButtonLink || '');
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || 'amber');
  const [fontTheme, setFontTheme] = useState(settings?.fontTheme || 'sans');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedFields: Partial<SiteSettings> = {
        siteTitle,
        siteTagline,
        logoText,
        faviconUrl,
        phone,
        email,
        address,
        facebook,
        instagram,
        linkedin,
        bannerTitle,
        bannerSubtitle,
        bannerButtonText,
        bannerButtonLink,
        primaryColor,
        fontTheme
      };

      await onUpdateSettings(updatedFields);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const colors = [
    { id: 'amber', name: 'Amber Gold', hex: '#f59e0b', bg: 'bg-amber-500' },
    { id: 'emerald', name: 'Emerald Green', hex: '#10b981', bg: 'bg-emerald-500' },
    { id: 'blue', name: 'Neon Blue', hex: '#3b82f6', bg: 'bg-blue-500' },
    { id: 'violet', name: 'Deep Violet', hex: '#8b5cf6', bg: 'bg-violet-500' },
    { id: 'rose', name: 'Electric Rose', hex: '#f43f5e', bg: 'bg-rose-500' }
  ];

  const fonts = [
    { id: 'sans', name: 'Inter (Sans-Serif)' },
    { id: 'serif', name: 'Playfair Display (Elegant Serif)' },
    { id: 'mono', name: 'JetBrains Mono (Technical Mono)' },
    { id: 'space', name: 'Space Grotesk (Modern Display)' }
  ];

  return (
    <div id="settings-lightbox-overlay" className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-850 dark:text-amber-500">
              <GearIcon className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
                System Control & Settings
              </h3>
              <p className="text-4xs font-mono text-neutral-400">Configure global currency, branding options, and metadata</p>
            </div>
          </div>
          <button 
            id="close-settings-modal"
            onClick={onClose} 
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ADMIN MODE BANNER */}
        <div className={`px-5 py-2.5 text-4xs font-mono shrink-0 flex items-center justify-between ${
          isAdmin 
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-500/15' 
            : 'bg-neutral-100 dark:bg-neutral-950/40 text-neutral-500 border-b border-neutral-150 dark:border-neutral-800/50'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500 animate-ping' : 'bg-neutral-400'}`} />
            <span>
              {isAdmin 
                ? '⚡ ADMIN / OWNER MODE ACTIVE — SAVED CHANGES UPDATE CLOUD DATABASE LIVE' 
                : '🔧 PREVIEW MODE ACTIVE — CURRENCY IS ACTIVE, OTHER LOGOS & STYLING EDITABLE LOCALLY'
              }
            </span>
          </div>
          {saveSuccess && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ CHANGES SAVED SUCCESSFULLY</span>
          )}
        </div>

        {/* TABS SIDEBAR / SEGMENT CONTAINER (RESPONSIVE) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* TABS SELECTOR */}
          <div className="w-full md:w-48 bg-neutral-50/50 dark:bg-neutral-950/20 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 p-4 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 gap-2 md:gap-0">
            <button
              id="tab-btn-app"
              type="button"
              onClick={() => setActiveTab('app')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-3xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0 md:shrink ${
                activeTab === 'app' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500' 
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Web Currency
            </button>
            <button
              id="tab-btn-branding"
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-3xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0 md:shrink ${
                activeTab === 'branding' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500' 
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Visual Design
            </button>
            <button
              id="tab-btn-contact"
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-3xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0 md:shrink ${
                activeTab === 'contact' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500' 
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Studio Info
            </button>
            <button
              id="tab-btn-hero"
              type="button"
              onClick={() => setActiveTab('hero')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-3xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0 md:shrink ${
                activeTab === 'hero' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500' 
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Hero Banner
            </button>
          </div>

          {/* MAIN FORM */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-left">
            
            {/* TAB 1: WEB CURRENCY CONFIGURATION */}
            {activeTab === 'app' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 dark:bg-amber-500/2 rounded-2xl border border-amber-500/10 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-2xs">
                    <Globe className="w-4 h-4 animate-pulse" />
                    <span>Active Website Currency</span>
                  </div>
                  <p className="text-neutral-500 text-3xs leading-relaxed">
                    Changing the active currency translates and updates all standard, rush, and professional editing rates in real-time. Order checkout invoices are generated natively using your preference.
                  </p>
                </div>

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider mb-1.5">Select Primary Web Currency (Exchange Rates Auto-Convert)</label>
                  <select
                    id="setting-currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white font-sans font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="USD">USD ($) - US Dollars (Global Standard)</option>
                    <option value="INR">INR (₹) - Indian Rupee (Studio Origin)</option>
                    <option value="EUR">EUR (€) - Euro (EU Market)</option>
                    <option value="GBP">GBP (£) - British Pound Sterling</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/60 space-y-3">
                  <span className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider">Current Exchange Rate Metrics (Dynamic references)</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-[10px]">
                    <div className="bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center">
                      <span className="block text-[9px] text-neutral-400">INR vs USD</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">₹83.50</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center">
                      <span className="block text-[9px] text-neutral-400">EUR vs USD</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">€0.92</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center">
                      <span className="block text-[9px] text-neutral-400">GBP vs USD</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">£0.78</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VISUAL BRANDING DESIGN */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Studio Brand Name</label>
                    <input 
                      id="setting-logo-text"
                      type="text" 
                      value={logoText} 
                      onChange={(e) => setLogoText(e.target.value)}
                      placeholder="e.g. AK STAR"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Web Page Title Tag</label>
                    <input 
                      id="setting-site-title"
                      type="text" 
                      value={siteTitle} 
                      onChange={(e) => setSiteTitle(e.target.value)}
                      placeholder="e.g. AK STAR DIGITAL"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Brand Site Tagline</label>
                    <input 
                      id="setting-site-tagline"
                      type="text" 
                      value={siteTagline} 
                      onChange={(e) => setSiteTagline(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Favicon Emoji Prefix</label>
                    <input 
                      id="setting-favicon-url"
                      type="text" 
                      value={faviconUrl} 
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      maxLength={2}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white text-center font-bold"
                    />
                  </div>
                </div>

                {/* Accent Theme Selection */}
                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Accent Theme Colors</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPrimaryColor(c.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          primaryColor === c.id 
                            ? 'border-neutral-900 dark:border-white ring-2 ring-amber-500/50 bg-neutral-50 dark:bg-neutral-950' 
                            : 'border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50/50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.bg} shadow-sm`} />
                        <span className="text-[10px] font-medium font-sans">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Fonts Selection */}
                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1.5">Primary Typography Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {fonts.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontTheme(f.id)}
                        className={`px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          fontTheme === f.id 
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-950 font-bold' 
                            : 'border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50/50'
                        }`}
                      >
                        <span className="text-[10px] block">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STUDIO CONTACT INFO */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Studio Support Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input 
                      id="setting-phone"
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Studio Business Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input 
                      id="setting-email"
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">HQ Address / Studio Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input 
                      id="setting-address"
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Facebook Handle</label>
                    <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-[10px] text-neutral-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Instagram Handle</label>
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-[10px] text-neutral-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">LinkedIn Page</label>
                    <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-[10px] text-neutral-900 dark:text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: HERO SEGMENT CONTENT */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Hero Title Heading text</label>
                  <textarea 
                    id="setting-banner-title"
                    rows={2} 
                    value={bannerTitle} 
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Hero Subtitle Paragraph</label>
                  <textarea 
                    id="setting-banner-subtitle"
                    rows={3} 
                    value={bannerSubtitle} 
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white leading-relaxed text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Action Button Text</label>
                    <input 
                      id="setting-banner-btn-text"
                      type="text" 
                      value={bannerButtonText} 
                      onChange={(e) => setBannerButtonText(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Action Button Link / ID Anchor</label>
                    <input 
                      id="setting-banner-btn-link"
                      type="text" 
                      value={bannerButtonLink} 
                      onChange={(e) => setBannerButtonLink(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BUTTON FOOTER (ONLY SAVES PERSISTENTLY IF ADMIN) */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/60 shrink-0 flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-xl text-3xs font-bold uppercase hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
              {isAdmin ? (
                <button
                  id="save-settings-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-850 text-white dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 rounded-xl text-3xs font-bold uppercase cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              ) : (
                <button
                  id="apply-local-settings-btn"
                  type="submit"
                  className="px-5 py-2 bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 rounded-xl text-3xs font-bold uppercase cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Preview Settings
                </button>
              )}
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
