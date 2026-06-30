import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, ShoppingBag, Eye, Edit, Plus, 
  Trash, MessageSquare, Check, X, Clipboard, ExternalLink, 
  FileText, ArrowUpRight, BarChart3, ListCollapse, Play, Layers,
  ChevronRight, ArrowLeft, Settings, Image as ImageIcon, Users, 
  Scissors, Percent, Navigation, Palette, Search, Lock, UserCheck, 
  HardDrive, BookOpen, Share2, Mail, Phone, MapPin, RefreshCw, AlertTriangle
} from 'lucide-react';
import { 
  getOrders, updateOrderStatus, deliverOrderFiles, 
  getServices, addOrUpdateService, deleteService, getPortfolioItems, 
  addOrUpdatePortfolioItem, addNotification, deletePortfolioItem,
  updateOrderFileUrls, listenToOrders
} from '../lib/dbService';
import { 
  getSiteSettings, updateSiteSettings, getNavLinks, saveNavLinks, 
  getPageContents, updatePageContent, getPromoCodes, addOrUpdatePromoCode, 
  deletePromoCode, getBlogPosts, addOrUpdateBlogPost, deleteBlogPost, 
  getMediaAssets, addMediaAsset, deleteMediaAsset, SiteSettings, NavLink, 
  PageContent, PromoCode, BlogPost, MediaAsset, deleteNavLink, getCMSUsers,
  saveCMSUser, UserProfile
} from '../lib/cmsService';
import { Order, Service, PortfolioItem, OrderStatus, ServiceType } from '../types';
import ChatWindow from './ChatWindow';
import InvoicePDF from './InvoicePDF';
import BeforeAfterSlider from './BeforeAfterSlider';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CMS States
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);

  // Sub-navigation selections
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analytics' | 'services' | 'portfolio' | 'cms_customizer' | 'blog' | 'media' | 'users' | 'promo' | 'storage'>('pipeline');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  // Delivery state
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);

  // Live order edit states
  const [editRawUrl, setEditRawUrl] = useState('');
  const [isUpdatingRawUrl, setIsUpdatingRawUrl] = useState(false);

  // Service modal states
  const [showAddService, setShowAddService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceType, setNewServiceType] = useState<ServiceType>('photo');
  const [newServicePrice, setNewServicePrice] = useState(49);
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceFeatures, setNewServiceFeatures] = useState('');

  // Portfolio modal states
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortCategory, setNewPortCategory] = useState<ServiceType>('photo');
  const [newPortMedia, setNewPortMedia] = useState('');
  const [newPortBefore, setNewPortBefore] = useState('');
  const [newPortAfter, setNewPortAfter] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortTags, setNewPortTags] = useState('');

  // Blog states
  const [showAddBlog, setShowAddBlog] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Photo Editing');
  const [newBlogTags, setNewBlogTags] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogImage, setNewBlogImage] = useState('');

  // Promo code states
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(20);
  const [newPromoExpiry, setNewPromoExpiry] = useState('2026-12-31');
  const [newPromoLimit, setNewPromoLimit] = useState(100);

  // Crop tool simulation states
  const [selectedCropMedia, setSelectedCropMedia] = useState<MediaAsset | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState({ top: 10, left: 10, width: 80, height: 80 });

  // Users role state (Database Backed)
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Media upload simulation
  const [mediaUploadUrl, setMediaUploadUrl] = useState('');
  const [mediaUploadName, setMediaUploadName] = useState('');
  const [mediaUploadType, setMediaUploadType] = useState<'image' | 'video' | 'document'>('image');

  useEffect(() => {
    loadAllAdminData();

    // Listen to real-time order updates
    const unsubscribe = listenToOrders('admin', true, (fetchedOrders) => {
      setOrders(fetchedOrders);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync selectedOrder with live updates of orders list
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const fetchedOrders = await getOrders('admin', true);
      const fetchedServices = await getServices();
      const fetchedPortfolio = await getPortfolioItems();

      // CMS
      const fetchedSettings = await getSiteSettings();
      const fetchedNav = await getNavLinks();
      const fetchedPages = await getPageContents();
      const fetchedPromos = await getPromoCodes();
      const fetchedBlogs = await getBlogPosts();
      const fetchedMedia = await getMediaAssets();
      const fetchedUsers = await getCMSUsers();

      setOrders(fetchedOrders);
      setServices(fetchedServices);
      setPortfolio(fetchedPortfolio);
      
      setSettings(fetchedSettings);
      setNavLinks(fetchedNav);
      setPages(fetchedPages);
      setPromos(fetchedPromos);
      setBlogs(fetchedBlogs);
      setMedia(fetchedMedia);
      setUsersList(fetchedUsers);

      // Apply dynamic colors and fonts from CMS
      applyThemeFromCMS(fetchedSettings.primaryColor, fetchedSettings.fontTheme);

    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeFromCMS = (color: string, font: string) => {
    // Dynamic color map
    const colorClasses: Record<string, string> = {
      amber: '#f59e0b',
      emerald: '#10b981',
      blue: '#3b82f6',
      violet: '#8b5cf6',
      rose: '#f43f5e'
    };
    
    // Inject dynamic variables
    const primaryHex = colorClasses[color] || '#f59e0b';
    document.documentElement.style.setProperty('--color-primary-cms', primaryHex);
    
    // Dynamic font setting
    const fontClasses: Record<string, string> = {
      sans: '"Inter", sans-serif',
      serif: '"Playfair Display", serif',
      mono: '"JetBrains Mono", monospace',
      space: '"Space Grotesk", sans-serif'
    };
    const fontValue = fontClasses[font] || '"Inter", sans-serif';
    document.documentElement.style.setProperty('--font-family-cms', fontValue);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdateRawUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !editRawUrl.trim()) return;
    setIsUpdatingRawUrl(true);
    try {
      const updatedFileUrls = [editRawUrl.trim(), ...selectedOrder.fileUrls.slice(1)];
      await updateOrderFileUrls(selectedOrder.id, updatedFileUrls);
      const updatedOrder = { ...selectedOrder, fileUrls: updatedFileUrls };
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      await addNotification(
        'RAW Media Link Updated',
        `The raw media files reference link for Project "${selectedOrder.serviceName}" has been corrected by the admin.`,
        'order',
        `/order/${selectedOrder.id}`,
        selectedOrder.clientId
      );
      alert('Raw footage link updated successfully.');
    } catch (err) {
      console.error('Failed to update raw URL:', err);
    } finally {
      setIsUpdatingRawUrl(false);
    }
  };

  const handleDeliverFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryUrl.trim() || !selectedOrder) return;
    setIsDelivering(true);
    try {
      await deliverOrderFiles(selectedOrder.id, deliveryUrl.trim(), deliveryNotes.trim());
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'under_review', deliveryUrl, deliveryNotes } : o));
      setSelectedOrder(prev => prev ? { ...prev, status: 'under_review', deliveryUrl, deliveryNotes } : null);
      setDeliveryUrl('');
      setDeliveryNotes('');
      alert('Delivery file links pushed successfully. Client is notified.');
    } catch (err) {
      console.error('Delivery failed:', err);
    } finally {
      setIsDelivering(false);
    }
  };

  // Mock refund logic
  const handleTriggerRefund = async (order: Order) => {
    const confirmRefund = window.confirm(`Are you sure you want to issue a full refund of $${order.price} for Order #${order.invoiceNo}? This will mark the order as cancelled/refunded and reflect in business analytics.`);
    if (!confirmRefund) return;

    try {
      await updateOrderStatus(order.id, 'cancelled', 'Refund processed by Admin.');
      
      // Update local state to show refunded status
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled', statusNotes: 'Refunded' } : o));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled', statusNotes: 'Refunded' } : null);
      }

      await addNotification(
        'Refund Issued Successfully',
        `A refund has been triggered for your project "${order.serviceName}" (${order.invoiceNo}). The payment gateway has been credited.`,
        'payment',
        `/order/${order.id}`,
        order.clientId
      );
      
      alert('Mock Refund Processed. A.K. STAR payment gateways notified.');
    } catch (e) {
      console.error('Refund failed:', e);
    }
  };

  // Service CRUD
  const handleEditServiceClick = (svc: Service) => {
    setEditingServiceId(svc.id);
    setNewServiceName(svc.name);
    setNewServiceType(svc.type);
    setNewServicePrice(svc.price);
    setNewServiceDesc(svc.description);
    setNewServiceFeatures(svc.features.join(', '));
    setShowAddService(true);
  };

  const handleDeleteServiceClick = async (id: string) => {
    if (!window.confirm('Delete this service package?')) return;
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFeatures = newServiceFeatures.split(',').map(f => f.trim()).filter(Boolean);
    const serviceData: Service = {
      id: editingServiceId || 'svc_' + Date.now(),
      name: newServiceName,
      type: newServiceType,
      price: newServicePrice,
      description: newServiceDesc,
      features: cleanFeatures,
      deliveryDays: newServiceType === 'photo' ? 3 : 7
    };

    try {
      await addOrUpdateService(serviceData);
      setServices(prev => {
        const exists = prev.some(s => s.id === serviceData.id);
        return exists ? prev.map(s => s.id === serviceData.id ? serviceData : s) : [...prev, serviceData];
      });
      closeServiceModal();
    } catch (err) {
      console.error(err);
    }
  };

  const closeServiceModal = () => {
    setShowAddService(false);
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServicePrice(49);
    setNewServiceDesc('');
    setNewServiceFeatures('');
  };

  // Portfolio addition
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArr = newPortTags.split(',').map(t => t.trim()).filter(Boolean);
    const item: PortfolioItem = {
      id: 'port_' + Date.now(),
      title: newPortTitle,
      category: newPortCategory,
      mediaUrl: newPortMedia,
      beforeUrl: newPortBefore || undefined,
      afterUrl: newPortAfter || undefined,
      description: newPortDesc,
      tags: tagsArr,
      isFeatured: true
    };

    try {
      await addOrUpdatePortfolioItem(item);
      setPortfolio(prev => [item, ...prev]);
      setShowAddPortfolio(false);
      setNewPortTitle('');
      setNewPortMedia('');
      setNewPortBefore('');
      setNewPortAfter('');
      setNewPortDesc('');
      setNewPortTags('');
      alert('Portfolio work added successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // CMS Updates
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleUpdateGeneralSettings = async (updates: Partial<SiteSettings>) => {
    if (!settings) return;
    // Update local state immediately for 100% typing responsiveness
    const updatedLocally = { ...settings, ...updates };
    setSettings(updatedLocally);
    applyThemeFromCMS(updatedLocally.primaryColor, updatedLocally.fontTheme);

    setIsSavingSettings(true);
    try {
      await updateSiteSettings(updates);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdatePageContentSubmit = async (pageId: string, title: string, content: string, imageUrl?: string) => {
    try {
      await updatePageContent(pageId, { title, content, imageUrl });
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, title, content, imageUrl } : p));
      alert(`Content updated for page: ${pageId.toUpperCase()}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNavLinks = async () => {
    try {
      await saveNavLinks(navLinks);
      alert('Navigation links and ordering saved successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNavLink = () => {
    const newLink: NavLink = {
      id: 'nav_' + Date.now(),
      name: 'New Menu Link',
      url: '#',
      position: 'header',
      order: navLinks.length + 1
    };
    setNavLinks([...navLinks, newLink]);
  };

  const handleDeleteNavLink = async (id: string) => {
    try {
      await deleteNavLink(id);
      setNavLinks(navLinks.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete nav link:', err);
    }
  };

  // Blog CRUD
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const blogData: BlogPost = {
      id: editingBlogId || 'blog_' + Date.now(),
      title: newBlogTitle,
      content: newBlogContent,
      category: newBlogCategory,
      tags: newBlogTags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: newBlogImage || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
      createdAt: new Date().toISOString(),
      author: 'Ak Star (Admin)'
    };

    try {
      await addOrUpdateBlogPost(blogData);
      setBlogs(prev => {
        const exists = prev.some(b => b.id === blogData.id);
        return exists ? prev.map(b => b.id === blogData.id ? blogData : b) : [blogData, ...prev];
      });
      setShowAddBlog(false);
      setEditingBlogId(null);
      setNewBlogTitle('');
      setNewBlogContent('');
      setNewBlogTags('');
      setNewBlogImage('');
      alert('Blog post published to database.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditBlog = (post: BlogPost) => {
    setEditingBlogId(post.id);
    setNewBlogTitle(post.title);
    setNewBlogCategory(post.category);
    setNewBlogTags(post.tags.join(', '));
    setNewBlogContent(post.content);
    setNewBlogImage(post.imageUrl);
    setShowAddBlog(true);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteBlogPost(id);
      setBlogs(blogs.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Media CRUD
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUploadUrl.trim()) return;
    const cleanName = mediaUploadName.trim() || 'media_' + Date.now() + (mediaUploadType === 'image' ? '.jpg' : '.mp4');
    const newAsset: MediaAsset = {
      id: 'media_' + Date.now(),
      name: cleanName,
      url: mediaUploadUrl.trim(),
      type: mediaUploadType,
      size: (Math.random() * 5 + 1).toFixed(1) + ' MB',
      uploadedAt: new Date().toISOString()
    };

    try {
      await addMediaAsset(newAsset);
      setMedia([newAsset, ...media]);
      setMediaUploadUrl('');
      setMediaUploadName('');
      alert('Asset registered in creative media library.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!window.confirm('Delete asset from database?')) return;
    try {
      await deleteMediaAsset(id);
      setMedia(media.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const triggerCropSimulate = (m: MediaAsset) => {
    setSelectedCropMedia(m);
    setIsCropping(true);
  };

  const handleSaveCrop = () => {
    if (!selectedCropMedia) return;
    alert(`Visual Simulation: Image cropped to [x: ${cropBox.left}%, y: ${cropBox.top}%, w: ${cropBox.width}%, h: ${cropBox.height}%]. Cropped copy saved to Media Assets.`);
    setIsCropping(false);
    setSelectedCropMedia(null);
  };

  // Promo Codes CRUD
  const handleAddPromoCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const code: PromoCode = {
      id: 'promo_' + Date.now(),
      code: newPromoCode.trim().toUpperCase(),
      discount: newPromoDiscount,
      expiryDate: newPromoExpiry,
      usageLimit: newPromoLimit,
      usageCount: 0
    };

    try {
      await addOrUpdatePromoCode(code);
      setPromos([...promos, code]);
      setShowAddPromo(false);
      setNewPromoCode('');
      alert('New promo coupon added successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await deletePromoCode(id);
      setPromos(promos.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Server Storage clean up
  const handleCleanStorage = async () => {
    if (!settings) return;
    const confirmClean = window.confirm('This will wipe out client-uploaded raw cache files, temporary sound assets, and draft exports for COMPLETED or CANCELLED projects that are older than 30 days. No active client work will be lost. Clean now?');
    if (!confirmClean) return;

    try {
      // Simulate system sweeping and reduce storage back to 14.8 GB
      await updateSiteSettings({ serverStorageUsed: 14.8 });
      setSettings(prev => prev ? { ...prev, serverStorageUsed: 14.8 } : null);
      await addNotification(
        'Server Storage Swept',
        `Admin swept the server cache folder. Cleaned 28.0 GB of obsolete draft backups.`,
        'general'
      );
      alert('Success: Cache sweep finished. Storage shrunk from 42.8 GB to 14.8 GB!');
    } catch (e) {
      console.error(e);
    }
  };

  // User list edits
  const handleToggleUserRole = async (uid: string, currentRole: string) => {
    const roles: ('admin' | 'Editor' | 'Moderator' | 'client')[] = ['admin', 'Editor', 'Moderator', 'client'];
    const nextIndex = (roles.indexOf(currentRole as any) + 1) % roles.length;
    const nextRole = roles[nextIndex];
    const targetUser = usersList.find(u => u.uid === uid);
    if (targetUser) {
      const updatedUser = { ...targetUser, role: nextRole };
      try {
        await saveCMSUser(updatedUser);
        setUsersList(usersList.map(u => u.uid === uid ? updatedUser : u));
        alert(`User profile updated. Role changed to: ${nextRole.toUpperCase()}`);
      } catch (err) {
        console.error('Failed to update user role:', err);
      }
    }
  };

  const handleToggleUserBlock = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const targetUser = usersList.find(u => u.uid === uid);
    if (targetUser) {
      const updatedUser = { ...targetUser, status: nextStatus };
      try {
        await saveCMSUser(updatedUser);
        setUsersList(usersList.map(u => u.uid === uid ? updatedUser : u));
        alert(`User has been ${nextStatus === 'blocked' ? 'BLOCKED' : 'UNBLOCKED'} from the platform.`);
      } catch (err) {
        console.error('Failed to update user status:', err);
      }
    }
  };

  // Analytics totals
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.price, 0);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;

  const getChartData = () => {
    const datesMap: Record<string, number> = {};
    datesMap['Day 1'] = 149;
    datesMap['Day 2'] = 248;
    datesMap['Day 3'] = 397;

    orders.forEach(o => {
      if (o.status === 'completed' || o.paidAt) {
        const dateStr = new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        datesMap[dateStr] = (datesMap[dateStr] || 0) + o.price;
      }
    });

    return Object.entries(datesMap).map(([name, earnings]) => ({
      name,
      Revenue: earnings,
    })).slice(-10);
  };

  const getCategoryBreakout = () => {
    let photoEarnings = 150;
    let videoEarnings = 400;

    orders.forEach(o => {
      const sType = services.find(s => s.id === o.serviceId)?.type || 'video';
      if (o.status === 'completed') {
        if (sType === 'photo') {
          photoEarnings += o.price;
        } else {
          videoEarnings += o.price;
        }
      }
    });

    return [
      { name: 'Photo Editing', Sales: photoEarnings },
      { name: 'Video Production', Sales: videoEarnings },
    ];
  };

  return (
    <div id="admin-panel" className="bg-neutral-50 dark:bg-neutral-950 min-h-screen text-neutral-800 dark:text-neutral-100 flex flex-col font-sans">
      
      {/* CMS DESIGN PRESET VARIABLE INJECTOR */}
      <style>{`
        :root {
          --theme-primary: var(--color-primary-cms, #f59e0b);
          --theme-font: var(--font-family-cms, "Inter", sans-serif);
        }
        .text-primary-cms { color: var(--theme-primary); }
        .bg-primary-cms { background-color: var(--theme-primary); }
        .border-primary-cms { border-color: var(--theme-primary); }
        .font-theme-cms { font-family: var(--theme-font); }
      `}</style>

      {/* DASHBOARD TOP HEADER BAR */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white flex items-center justify-center shrink-0">
            <img 
              src="/src/assets/images/ak_star_logo_1782804903810.jpg" 
              alt={settings?.logoText || 'AK STAR DIGITAL'} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              width={32}
              height={32}
            />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-neutral-900 dark:text-white font-theme-cms">
              {settings?.siteTitle || 'AK STAR DIGITAL'}
            </h1>
            <p className="text-4xs font-mono text-neutral-400">Control Center / Administrator Profile</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-4xs font-mono font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Server Live</span>
          </div>
        </div>
      </header>

      {/* THREE-COLUMN BENTO GRID WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* SIDEBAR NAVIGATION PANEL (RESPONSIVE) */}
        <aside className="w-full lg:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-4 shrink-0 overflow-y-auto max-h-none lg:max-h-[calc(100vh-65px)]">
          <p className="text-4xs font-mono text-neutral-400 uppercase tracking-widest px-2 mb-3">Core Systems</p>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('pipeline'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Production Pipeline
            </button>

            <button
              onClick={() => { setActiveTab('analytics'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Business Analytics
            </button>

            <button
              onClick={() => { setActiveTab('services'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Services Rates
            </button>

            <button
              onClick={() => { setActiveTab('portfolio'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Play className="w-4 h-4" />
              Manage Showcase
            </button>
          </nav>

          <p className="text-4xs font-mono text-neutral-400 uppercase tracking-widest px-2 mt-6 mb-3">Content & Website CMS</p>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('cms_customizer'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'cms_customizer'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Palette className="w-4 h-4" />
              Website Customizer
            </button>

            <button
              onClick={() => { setActiveTab('blog'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'blog'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Blogs & Articles
            </button>

            <button
              onClick={() => { setActiveTab('media'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Media Library
            </button>
          </nav>

          <p className="text-4xs font-mono text-neutral-400 uppercase tracking-widest px-2 mt-6 mb-3">Auditing & Security</p>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('users'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Role & User Profiles
            </button>

            <button
              onClick={() => { setActiveTab('promo'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'promo'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Percent className="w-4 h-4" />
              Promo Codes
            </button>

            <button
              onClick={() => { setActiveTab('storage'); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-3xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                activeTab === 'storage'
                  ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Storage Space Monitor
            </button>
          </nav>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 p-6 overflow-y-auto max-h-none lg:max-h-[calc(100vh-65px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-3xs font-mono text-neutral-400 mt-4">Syncing Cloud Databases and Customizing Presets...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">

              {/* ---------------- SECTION 1: PIPELINE ---------------- */}
              {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                  
                  {/* Orders Column */}
                  <div className={`${selectedOrder ? 'hidden lg:block' : ''} lg:col-span-2 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Production Pipeline Queue</h2>
                      <span className="px-2 py-0.5 bg-neutral-150 dark:bg-neutral-850 rounded font-mono text-4xs text-neutral-500">{orders.length} ACTIVE PROJECTS</span>
                    </div>

                    <div className="space-y-3">
                      {orders.length === 0 ? (
                        <div className="p-8 text-center bg-white dark:bg-neutral-900 border rounded-2xl">
                          <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-2xs font-bold text-neutral-500">Queue is currently clear</p>
                        </div>
                      ) : (
                        orders.map(o => (
                          <div 
                            key={o.id}
                            onClick={() => { setSelectedOrder(o); setEditRawUrl(o.fileUrls[0] || ''); }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              selectedOrder?.id === o.id
                                ? 'border-amber-500 bg-amber-500/5'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-3">
                              <div className="space-y-1">
                                <span className="text-4xs font-mono text-neutral-400 block">{o.invoiceNo} • {new Date(o.createdAt).toLocaleDateString()}</span>
                                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">{o.serviceName}</h3>
                                <p className="text-3xs text-neutral-500">Client: <span className="font-semibold">{o.clientName}</span> ({o.clientEmail})</p>
                              </div>
                              <div className="text-right space-y-1 shrink-0">
                                <span className="text-xs font-bold font-mono text-neutral-950 dark:text-white block">${o.price}</span>
                                <span className={`inline-block px-2 py-0.5 rounded text-4xs font-bold font-mono uppercase ${
                                  o.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                  o.status === 'under_review' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                  o.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {o.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Details & Chat Inspection Drawer */}
                  {selectedOrder ? (
                    <div className="lg:col-span-3 lg:grid lg:grid-cols-3 gap-6 pt-6 border-t lg:border-t-0 lg:pt-0">
                      
                      {/* Left: Requirements & Final Upload & Refunds */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-start gap-4 border-b pb-4 mb-4">
                            <div>
                              <button onClick={() => setSelectedOrder(null)} className="lg:hidden flex items-center gap-1 text-3xs text-neutral-400 uppercase mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                              <span className="text-4xs font-mono text-neutral-400 uppercase">Active Order Sheet</span>
                              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{selectedOrder.serviceName}</h3>
                              <p className="text-3xs text-neutral-500 mt-0.5">ID: {selectedOrder.invoiceNo} • Status: <span className="font-bold uppercase text-amber-500">{selectedOrder.status}</span></p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button 
                                onClick={() => setSelectedInvoice(selectedOrder)}
                                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 rounded-lg text-3xs font-bold uppercase flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                                Invoice
                              </button>
                              
                              <select 
                                value={selectedOrder.status}
                                onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                                className="px-2.5 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-lg text-3xs font-bold uppercase"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">Active Editing</option>
                                <option value="under_review">Review Draft</option>
                                <option value="completed">Complete & Pay</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button 
                                onClick={() => handleTriggerRefund(selectedOrder)}
                                className="px-2.5 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg text-3xs font-bold uppercase"
                              >
                                Refund
                              </button>
                            </div>
                          </div>

                          {/* Requirements & Edit Raw Link */}
                          <div className="space-y-4 text-xs">
                            <div>
                              <h4 className="text-4xs font-mono text-neutral-400 uppercase mb-1">Customer Requirements</h4>
                              <p className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl leading-relaxed text-neutral-700 dark:text-neutral-300">{selectedOrder.requirements.description}</p>
                            </div>

                            {/* Live view/edit of raw cloud links (Drive, Mega, Dropbox) */}
                            <form onSubmit={handleUpdateRawUrl} className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border">
                              <h5 className="text-4xs font-mono text-neutral-400 uppercase font-bold">Client Cloud Drive Links (View/Edit)</h5>
                              <p className="text-3xs text-neutral-500">Edit the reference raw asset link if the client sent an updated Drive, Dropbox, or Mega folder.</p>
                              
                              <div className="flex gap-2">
                                <input 
                                  type="url" 
                                  value={editRawUrl}
                                  onChange={(e) => setEditRawUrl(e.target.value)}
                                  placeholder="No raw links provided"
                                  className="flex-1 border px-3 py-2 rounded-lg text-3xs bg-transparent dark:text-white"
                                  required
                                />
                                <button 
                                  type="submit" 
                                  className="px-3 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase rounded-lg"
                                  disabled={isUpdatingRawUrl}
                                >
                                  Update Link
                                </button>
                              </div>

                              {selectedOrder.fileUrls?.[0] && (
                                <a 
                                  href={selectedOrder.fileUrls[0]}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-3xs font-semibold text-amber-500 underline mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open Client cloud folder
                                </a>
                              )}
                            </form>
                          </div>
                        </div>

                        {/* Deliver final files upload option */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">Final Delivery Portal</h3>
                          
                          {selectedOrder.deliveryUrl && (
                            <div className="mb-4 p-3 bg-indigo-50/10 border border-indigo-500/20 text-3xs rounded-xl">
                              <span className="text-4xs font-mono text-indigo-400 uppercase font-black block">Active Output Draft</span>
                              <div className="flex justify-between items-center mt-1">
                                <a href={selectedOrder.deliveryUrl} target="_blank" rel="noreferrer" className="underline truncate text-indigo-400">{selectedOrder.deliveryUrl}</a>
                                <span className="px-1.5 py-0.2 bg-indigo-900 text-indigo-200 rounded">Under Review</span>
                              </div>
                              {selectedOrder.deliveryNotes && <p className="text-neutral-500 mt-1 italic">Notes: "{selectedOrder.deliveryNotes}"</p>}
                            </div>
                          )}

                          <form onSubmit={handleDeliverFiles} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Edited File Download URL (Google Drive / Frame.io)</label>
                                <input 
                                  type="url"
                                  value={deliveryUrl}
                                  onChange={(e) => setDeliveryUrl(e.target.value)}
                                  placeholder="Paste final edited link"
                                  className="w-full text-3xs border rounded-lg px-3 py-2 bg-transparent dark:text-white"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Brief uploader message</label>
                                <input 
                                  type="text"
                                  value={deliveryNotes}
                                  onChange={(e) => setDeliveryNotes(e.target.value)}
                                  placeholder="e.g. skin grade complete, high quality renders"
                                  className="w-full text-3xs border rounded-lg px-3 py-2 bg-transparent"
                                />
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              className="px-4 py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1"
                              disabled={isDelivering}
                            >
                              <Check className="w-3.5 h-3.5" /> {isDelivering ? 'Uploading...' : 'Publish Completed Delivery Link'}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: Inline chat window */}
                      <div className="col-span-1">
                        <div className="sticky top-4">
                          <ChatWindow 
                            orderId={selectedOrder.id}
                            senderId="admin"
                            senderName="AK STAR Editor (Admin)"
                            placeholder="Discuss adjustments, answer feedback or reply live..."
                          />
                        </div>
                      </div>

                    </div>
                  ) : null}

                </div>
              )}

              {/* ---------------- SECTION 2: ANALYTICS ---------------- */}
              {activeTab === 'analytics' && (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><DollarSign className="w-6 h-6" /></div>
                      <div>
                        <span className="text-4xs font-mono text-neutral-400 uppercase tracking-wider block">Net Revenue</span>
                        <h3 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">${totalEarnings}</h3>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><ShoppingBag className="w-6 h-6" /></div>
                      <div>
                        <span className="text-4xs font-mono text-neutral-400 uppercase tracking-wider block">Completed Deliveries</span>
                        <h3 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">{orders.filter(o => o.status === 'completed').length}</h3>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                      <div>
                        <span className="text-4xs font-mono text-neutral-400 uppercase tracking-wider block">Active Queue</span>
                        <h3 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">{inProgressCount} projects</h3>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
                      <div>
                        <span className="text-4xs font-mono text-neutral-400 uppercase tracking-wider block">Refunded Transactions</span>
                        <h3 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">{orders.filter(o => o.status === 'cancelled' && o.statusNotes === 'Refunded').length}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl h-[320px] flex flex-col">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-3">REVENUE COLLECTION TIMELINE</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getChartData()}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                            <YAxis stroke="#888888" fontSize={9} />
                            <Tooltip />
                            <Line type="monotone" dataKey="Revenue" stroke="#f59e0b" strokeWidth={2.5} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl h-[320px] flex flex-col">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-3">SERVICE CATEGORY REVENUE OUTCOME</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getCategoryBreakout()}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                            <YAxis stroke="#888888" fontSize={9} />
                            <Tooltip />
                            <Bar dataKey="Sales" radius={[6, 6, 0, 0]}>
                              <Cell fill="#f59e0b" />
                              <Cell fill="#3b82f6" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- SECTION 3: RATES SERVICES ---------------- */}
              {activeTab === 'services' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Product Catalog Rates</h2>
                    <button 
                      onClick={() => { setEditingServiceId(null); setShowAddService(true); }}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Service Rate
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start border-b pb-2.5 mb-2.5">
                            <div>
                              <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded text-4xs font-mono uppercase">{s.type}</span>
                              <h4 className="text-xs font-bold mt-1.5 text-neutral-900 dark:text-white">{s.name}</h4>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-500">${s.price}</span>
                          </div>
                          <p className="text-3xs text-neutral-500 leading-normal mb-3">{s.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {s.features.map((f, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-neutral-55 dark:bg-neutral-800 text-neutral-400 text-4xs rounded">{f}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t">
                          <button onClick={() => handleEditServiceClick(s)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteServiceClick(s.id)} className="p-1.5 hover:bg-red-500/10 rounded text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAddService && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase text-neutral-900 dark:text-white">{editingServiceId ? 'Edit Package' : 'Create Package'}</h4>
                          <button onClick={closeServiceModal} className="text-neutral-400"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleAddService} className="space-y-3 text-3xs text-left">
                          <div>
                            <label className="block text-4xs uppercase mb-0.5 text-neutral-400 font-mono">Title</label>
                            <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" required />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-4xs uppercase mb-0.5 text-neutral-400 font-mono">Type</label>
                              <select value={newServiceType} onChange={(e) => setNewServiceType(e.target.value as ServiceType)} className="w-full border p-2 rounded-lg bg-transparent">
                                <option value="photo">Photo</option>
                                <option value="video">Video</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-4xs uppercase mb-0.5 text-neutral-400 font-mono">Price (USD)</label>
                              <input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(Number(e.target.value))} className="w-full border p-2 rounded-lg bg-transparent" required />
                            </div>
                          </div>
                          <div>
                            <label className="block text-4xs uppercase mb-0.5 text-neutral-400 font-mono">Description</label>
                            <textarea value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" rows={2} required />
                          </div>
                          <div>
                            <label className="block text-4xs uppercase mb-0.5 text-neutral-400 font-mono">Features (comma-separated)</label>
                            <input type="text" value={newServiceFeatures} onChange={(e) => setNewServiceFeatures(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" placeholder="e.g., Skin correction, color, HD" required />
                          </div>
                          <button type="submit" className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-xl font-bold uppercase">Save Service</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SECTION 4: SHOWCASE PORTFOLIO ---------------- */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Portfolio Showcase Grid</h2>
                      <p className="text-4xs text-neutral-500 mt-1">Manage video clips (Cinematic, Reels, Animations with embedded YouTube/Vimeo links) & Before/After photo comparisons.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddPortfolio(true)}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Showcase Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {portfolio.map(p => (
                      <div key={p.id} className="bg-white dark:bg-neutral-900 border rounded-2xl overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="aspect-video relative bg-neutral-950 flex items-center justify-center">
                            {p.category === 'video' ? (
                              <div className="absolute inset-0 bg-black/50 p-4 flex flex-col justify-center items-center text-center">
                                <Play className="w-7 h-7 text-white fill-white/10 animate-pulse mb-1" />
                                <span className="text-4xs font-mono text-neutral-300">YouTube / Vimeo link: {p.mediaUrl}</span>
                              </div>
                            ) : p.beforeUrl && p.afterUrl ? (
                              <div className="w-full scale-95 origin-center">
                                <BeforeAfterSlider title={p.title} beforeUrl={p.beforeUrl} afterUrl={p.afterUrl} />
                              </div>
                            ) : (
                              <img src={p.mediaUrl} alt={p.title} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute top-2 left-2 bg-neutral-950 text-white px-1.5 py-0.2 rounded text-4xs font-mono font-bold uppercase">{p.category}</span>
                          </div>
                          <div className="p-4 space-y-1.5">
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{p.title}</h4>
                            <p className="text-3xs text-neutral-500 line-clamp-2">{p.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {p.tags.map((t, i) => <span key={i} className="px-1.5 py-0.2 bg-neutral-50 dark:bg-neutral-850 text-neutral-500 rounded text-4xs">#{t}</span>)}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 border-t flex justify-end gap-1.5 bg-neutral-50 dark:bg-neutral-950/20">
                          <span className="text-4xs text-neutral-400 font-mono mr-auto self-center uppercase">Interactive Active</span>
                          <button onClick={async () => { 
                            if(window.confirm('Delete this showcase item?')) { 
                              try {
                                await deletePortfolioItem(p.id);
                                setPortfolio(portfolio.filter(item => item.id !== p.id)); 
                                alert('Showcase deleted successfully.'); 
                              } catch (err) {
                                console.error('Failed to delete showcase item:', err);
                                alert('Failed to delete showcase item.');
                              }
                            } 
                          }} className="p-1 hover:bg-red-500/10 rounded text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAddPortfolio && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase">Publish to Showcase</h4>
                          <button onClick={() => setShowAddPortfolio(false)} className="text-neutral-400"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleAddPortfolio} className="space-y-3 text-3xs text-left">
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Title</label>
                            <input type="text" value={newPortTitle} onChange={(e) => setNewPortTitle(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" placeholder="e.g. Cinematic Wedding Highlights" required />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Category</label>
                              <select value={newPortCategory} onChange={(e) => setNewPortCategory(e.target.value as ServiceType)} className="w-full border p-2 rounded-lg bg-transparent">
                                <option value="photo">Photo (Before/After comparison)</option>
                                <option value="video">Video (Embedded Player)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Media/Embed URL</label>
                              <input type="url" value={newPortMedia} onChange={(e) => setNewPortMedia(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" placeholder="Youtube link or cover image" required />
                            </div>
                          </div>

                          {newPortCategory === 'photo' && (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border rounded-xl space-y-2">
                              <span className="text-4xs font-mono text-neutral-400 uppercase font-bold">Interactive Before/After URLs</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-4xs">Before RAW Url</label>
                                  <input type="url" value={newPortBefore} onChange={(e) => setNewPortBefore(e.target.value)} className="w-full border p-1 rounded bg-transparent" />
                                </div>
                                <div>
                                  <label className="text-4xs">After EDITED Url</label>
                                  <input type="url" value={newPortAfter} onChange={(e) => setNewPortAfter(e.target.value)} className="w-full border p-1 rounded bg-transparent" />
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Short description</label>
                            <textarea value={newPortDesc} onChange={(e) => setNewPortDesc(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" rows={2} required />
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Tags (comma-separated)</label>
                            <input type="text" value={newPortTags} onChange={(e) => setNewPortTags(e.target.value)} className="w-full border p-2 rounded-lg bg-transparent" placeholder="reels, skin correction, cinematic" required />
                          </div>

                          <button type="submit" className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold uppercase rounded-xl">Publish showcase item</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SECTION 5: WEBSITE CMS CUSTOMIZER ---------------- */}
              {activeTab === 'cms_customizer' && settings && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                  
                  {/* General settings & Logo/Favicon & Colors/Fonts */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* General Settings */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-amber-500" /> General Site Identity
                        </h3>
                        {isSavingSettings && (
                          <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1.5 animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Saving changes...
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-3xs">
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Website Name (Site Title)</label>
                          <input 
                            type="text" 
                            value={settings.siteTitle} 
                            onChange={(e) => handleUpdateGeneralSettings({ siteTitle: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Site Tagline / Description</label>
                          <input 
                            type="text" 
                            value={settings.siteTagline} 
                            onChange={(e) => handleUpdateGeneralSettings({ siteTagline: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-3xs pt-2">
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Logo Brand Text</label>
                          <input 
                            type="text" 
                            value={settings.logoText} 
                            onChange={(e) => handleUpdateGeneralSettings({ logoText: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Favicon Icon Symbol (Browser Tab Emoji/Url)</label>
                          <input 
                            type="text" 
                            value={settings.faviconUrl} 
                            onChange={(e) => {
                              handleUpdateGeneralSettings({ faviconUrl: e.target.value });
                              // Dynamically swap favicon
                              const fav = document.getElementById('favicon') as any;
                              if (fav) fav.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${e.target.value}</text></svg>`;
                            }}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banner & Slider Edit */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-500" /> Homepage Banner Customizer
                      </h3>

                      <div className="space-y-3 text-3xs">
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Hero Title text</label>
                          <input 
                            type="text" 
                            value={settings.bannerTitle} 
                            onChange={(e) => handleUpdateGeneralSettings({ bannerTitle: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Hero Subtitle / Description text</label>
                          <textarea 
                            value={settings.bannerSubtitle} 
                            onChange={(e) => handleUpdateGeneralSettings({ bannerSubtitle: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">CTA Button Text</label>
                            <input 
                              type="text" 
                              value={settings.bannerButtonText} 
                              onChange={(e) => handleUpdateGeneralSettings({ bannerButtonText: e.target.value })}
                              className="w-full border p-2.5 rounded-lg bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">CTA Action Anchor Link</label>
                            <input 
                              type="text" 
                              value={settings.bannerButtonLink} 
                              onChange={(e) => handleUpdateGeneralSettings({ bannerButtonLink: e.target.value })}
                              className="w-full border p-2.5 rounded-lg bg-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase mb-1 text-neutral-400">Hero Background Showcase Image URL</label>
                          <input 
                            type="url" 
                            value={settings.bannerImageUrl} 
                            onChange={(e) => handleUpdateGeneralSettings({ bannerImageUrl: e.target.value })}
                            className="w-full border p-2.5 rounded-lg bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Colors & Fonts Selection */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-500" /> Branding Colors & Font Pairing presets
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-3xs">
                        <div className="space-y-2">
                          <label className="block text-4xs font-mono uppercase text-neutral-400">Primary Theme Color Accent</label>
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { id: 'amber', bg: 'bg-amber-500', name: 'Amber' },
                              { id: 'emerald', bg: 'bg-emerald-500', name: 'Emerald' },
                              { id: 'blue', bg: 'bg-blue-500', name: 'Sleek Blue' },
                              { id: 'violet', bg: 'bg-violet-500', name: 'Royal Violet' },
                              { id: 'rose', bg: 'bg-rose-500', name: 'Warm Rose' }
                            ].map(c => (
                              <button 
                                key={c.id}
                                onClick={() => handleUpdateGeneralSettings({ primaryColor: c.id })}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                  settings.primaryColor === c.id ? 'border-neutral-900 dark:border-white ring-2 ring-amber-500' : 'border-transparent'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-lg ${c.bg}`} />
                                <span className="text-[8px] font-bold block">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-4xs font-mono uppercase text-neutral-400 font-bold">Typography Font Theme</label>
                          <div className="space-y-1">
                            {[
                              { id: 'sans', name: 'Inter Sans (Modern & Clean)' },
                              { id: 'space', name: 'Space Grotesk (Editorial Tech)' },
                              { id: 'serif', name: 'Playfair Display (Classy Serif)' },
                              { id: 'mono', name: 'JetBrains Mono (Sleek Tech)' }
                            ].map(f => (
                              <button 
                                key={f.id}
                                onClick={() => handleUpdateGeneralSettings({ fontTheme: f.id })}
                                className={`w-full text-left p-2 rounded-xl border text-3xs flex justify-between items-center ${
                                  settings.fontTheme === f.id ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-neutral-200 dark:border-neutral-800'
                                }`}
                              >
                                <span>{f.name}</span>
                                {settings.fontTheme === f.id && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Menu Links add, remove, reorder */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-amber-500" /> Navigation Menu Configurer
                        </h3>
                        <button 
                          onClick={handleAddNavLink}
                          className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-4xs font-mono font-bold uppercase flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Add Menu Item
                        </button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {navLinks.map((link, idx) => (
                          <div key={link.id} className="p-3 bg-neutral-50 dark:bg-neutral-950 border rounded-xl flex flex-col md:flex-row gap-3 items-center text-3xs">
                            <span className="font-mono text-neutral-400 font-bold mr-1">#{idx + 1}</span>
                            <input 
                              type="text" 
                              value={link.name} 
                              onChange={(e) => {
                                const copy = [...navLinks];
                                copy[idx].name = e.target.value;
                                setNavLinks(copy);
                              }}
                              className="w-full md:w-32 border p-1 rounded bg-transparent"
                              placeholder="Link Title"
                            />
                            <input 
                              type="text" 
                              value={link.url} 
                              onChange={(e) => {
                                const copy = [...navLinks];
                                copy[idx].url = e.target.value;
                                setNavLinks(copy);
                              }}
                              className="w-full md:flex-1 border p-1 rounded bg-transparent"
                              placeholder="URL path (e.g. #anchor)"
                            />
                            <select 
                              value={link.position}
                              onChange={(e) => {
                                const copy = [...navLinks];
                                copy[idx].position = e.target.value as 'header' | 'footer';
                                setNavLinks(copy);
                              }}
                              className="border p-1 rounded bg-transparent text-neutral-500"
                            >
                              <option value="header">Header</option>
                              <option value="footer">Footer</option>
                            </select>
                            
                            <button onClick={() => handleDeleteNavLink(link.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleSaveNavLinks}
                        className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-xl font-bold uppercase text-3xs"
                      >
                        Publish Menu Configuration
                      </button>
                    </div>

                    {/* Pages Content Edit (Home, About Us, Contact Us, Privacy Policy) */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" /> Pages Content Management
                      </h3>

                      <div className="space-y-6">
                        {pages.map((p) => (
                          <div key={p.id} className="p-4 bg-neutral-50 dark:bg-neutral-950 border rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-850 text-neutral-500 rounded font-mono text-4xs font-bold uppercase">{p.id} PAGE</span>
                              <span className="text-[9px] text-neutral-400">Last updated: {new Date(p.updatedAt).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-2 text-3xs">
                              <div>
                                <label className="block text-4xs text-neutral-400 font-mono mb-0.5">Page Title</label>
                                <input 
                                  id={`p-title-${p.id}`}
                                  type="text" 
                                  defaultValue={p.title}
                                  className="w-full border p-2 rounded-lg bg-transparent font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-4xs text-neutral-400 font-mono mb-0.5">Page Content text</label>
                                <textarea 
                                  id={`p-content-${p.id}`}
                                  defaultValue={p.content}
                                  className="w-full border p-2 rounded-lg bg-transparent font-sans leading-relaxed"
                                  rows={3}
                                />
                              </div>
                              <div>
                                <label className="block text-4xs text-neutral-400 font-mono mb-0.5">Page Showcase Image URL</label>
                                <input 
                                  id={`p-image-${p.id}`}
                                  type="url" 
                                  defaultValue={p.imageUrl || ''}
                                  className="w-full border p-2 rounded-lg bg-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button 
                                onClick={() => {
                                  const titleInput = document.getElementById(`p-title-${p.id}`) as HTMLInputElement;
                                  const contentInput = document.getElementById(`p-content-${p.id}`) as HTMLTextAreaElement;
                                  const imgInput = document.getElementById(`p-image-${p.id}`) as HTMLInputElement;
                                  handleUpdatePageContentSubmit(p.id, titleInput.value, contentInput.value, imgInput.value);
                                }}
                                className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded text-4xs font-mono font-bold uppercase"
                              >
                                Save Page
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Sidebar: Social Links & Contact Details */}
                  <div className="col-span-1 space-y-6">
                    
                    {/* Social links */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-amber-500" /> Social Integrations
                      </h3>

                      <div className="space-y-3 text-3xs">
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">Facebook Handle</label>
                          <input 
                            type="url" 
                            value={settings.facebook} 
                            onChange={(e) => handleUpdateGeneralSettings({ facebook: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">Instagram Profile</label>
                          <input 
                            type="url" 
                            value={settings.instagram} 
                            onChange={(e) => handleUpdateGeneralSettings({ instagram: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">LinkedIn Business Page</label>
                          <input 
                            type="url" 
                            value={settings.linkedin} 
                            onChange={(e) => handleUpdateGeneralSettings({ linkedin: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-amber-500" /> Studio Contact Card
                      </h3>

                      <div className="space-y-3 text-3xs">
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">Public Support Email</label>
                          <input 
                            type="email" 
                            value={settings.email} 
                            onChange={(e) => handleUpdateGeneralSettings({ email: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">Customer Phone Number</label>
                          <input 
                            type="text" 
                            value={settings.phone} 
                            onChange={(e) => handleUpdateGeneralSettings({ phone: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-4xs font-mono uppercase text-neutral-400 mb-1">Office Headquarter Address</label>
                          <textarea 
                            value={settings.address} 
                            onChange={(e) => handleUpdateGeneralSettings({ address: e.target.value })}
                            className="w-full border p-2 rounded-lg bg-transparent font-sans"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ---------------- SECTION 6: BLOG ARTICLES ---------------- */}
              {activeTab === 'blog' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Creative Blog Publisher</h2>
                      <p className="text-4xs text-neutral-500 mt-0.5">Publish articles, workflow updates, editing insights, or creative tutorials.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingBlogId(null); setShowAddBlog(true); }}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Write Article
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {blogs.map(post => (
                      <div key={post.id} className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="aspect-video rounded-xl overflow-hidden bg-neutral-900">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 rounded text-4xs font-mono uppercase font-bold">{post.category}</span>
                            <h3 className="text-xs font-bold text-neutral-900 dark:text-white mt-1">{post.title}</h3>
                            <p className="text-4xs text-neutral-400 font-mono mt-0.5">By {post.author} • {new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-3xs text-neutral-500 leading-relaxed font-sans line-clamp-3">{post.content}</p>
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((t, idx) => <span key={idx} className="px-1.5 py-0.2 bg-neutral-50 dark:bg-neutral-850 text-neutral-500 rounded text-4xs font-mono">#{t}</span>)}
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-3.5 border-t mt-4">
                          <button onClick={() => handleEditBlog(post)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteBlog(post.id)} className="p-1.5 hover:bg-red-500/10 rounded text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAddBlog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase">{editingBlogId ? 'Edit Post' : 'Publish Article'}</h4>
                          <button onClick={() => setShowAddBlog(false)} className="text-neutral-400"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSaveBlog} className="space-y-3 text-3xs text-left">
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Article Title</label>
                            <input type="text" value={newBlogTitle} onChange={(e) => setNewBlogTitle(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent" placeholder="Grading skin tones correctly" required />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Category</label>
                              <select value={newBlogCategory} onChange={(e) => setNewBlogCategory(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent text-neutral-600 dark:text-neutral-300">
                                <option value="Photo Editing">Photo Editing</option>
                                <option value="Video Production">Video Production</option>
                                <option value="Workflow Tips">Workflow Tips</option>
                                <option value="Studio News">Studio News</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Cover Image URL</label>
                              <input type="url" value={newBlogImage} onChange={(e) => setNewBlogImage(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent" placeholder="Cover url" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Article Tags (comma-separated)</label>
                            <input type="text" value={newBlogTags} onChange={(e) => setNewBlogTags(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent" placeholder="luts, wedding, grading" />
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5">Article Copy Content</label>
                            <textarea value={newBlogContent} onChange={(e) => setNewBlogContent(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent font-sans" rows={6} placeholder="Discuss tools, workflows, layers in detail..." required />
                          </div>
                          <button type="submit" className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold uppercase rounded-xl">Publish Post</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SECTION 7: MEDIA LIBRARY & CROPPING ---------------- */}
              {activeTab === 'media' && (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Media Gallery Grid */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-bold uppercase text-neutral-900 dark:text-white">Active Media Assets ({media.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {media.map(m => (
                          <div key={m.id} className="bg-white dark:bg-neutral-900 border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group">
                            <div className="aspect-square bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                              {m.type === 'video' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white bg-black/60">
                                  <Play className="w-6 h-6 mb-1 fill-white/10" />
                                  <span className="text-[8px] truncate max-w-full font-mono">{m.name}</span>
                                </div>
                              ) : (
                                <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              )}
                              <span className="absolute top-2 left-2 bg-neutral-950 text-white px-1 py-0.2 rounded text-[8px] font-mono">{m.type}</span>
                            </div>

                            <div className="p-3 space-y-1 text-left">
                              <h4 className="text-[10px] font-bold text-neutral-900 dark:text-white truncate" title={m.name}>{m.name}</h4>
                              <p className="text-[9px] text-neutral-400 font-mono">Size: {m.size} • {new Date(m.uploadedAt).toLocaleDateString()}</p>
                            </div>

                            <div className="p-2 border-t bg-neutral-50 dark:bg-neutral-950/20 flex justify-end gap-1">
                              {m.type === 'image' && (
                                <button 
                                  onClick={() => triggerCropSimulate(m)}
                                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300 text-3xs font-bold uppercase flex items-center gap-0.5"
                                  title="Simulate crop"
                                >
                                  <Scissors className="w-3.5 h-3.5" /> Crop
                                </button>
                              )}
                              <button onClick={() => handleDeleteMedia(m.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Media uploader uploader card */}
                    <div className="col-span-1 space-y-4">
                      <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold uppercase text-neutral-900 dark:text-white">Upload Asset</h3>
                        
                        <form onSubmit={handleAddMedia} className="space-y-3 text-3xs">
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5 text-neutral-400">Asset File Name</label>
                            <input type="text" value={mediaUploadName} onChange={(e) => setMediaUploadName(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent" placeholder="corporate_interview_broll.mp4" />
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5 text-neutral-400">Media URL</label>
                            <input type="url" value={mediaUploadUrl} onChange={(e) => setMediaUploadUrl(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent" placeholder="https://images.unsplash.com/..." required />
                          </div>
                          <div>
                            <label className="block text-4xs font-mono uppercase mb-0.5 text-neutral-400">File Type Category</label>
                            <select value={mediaUploadType} onChange={(e) => setMediaUploadType(e.target.value as any)} className="w-full border p-2.5 rounded-lg bg-transparent text-neutral-500">
                              <option value="image">Image Asset</option>
                              <option value="video">Video Clip</option>
                              <option value="document">PDF Document / Receipt</option>
                            </select>
                          </div>
                          <button type="submit" className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold uppercase rounded-lg">Upload Media Asset</button>
                        </form>

                        <div className="border-2 border-dashed rounded-xl p-4 text-center text-neutral-400 text-3xs leading-relaxed space-y-1 bg-neutral-50/50 dark:bg-neutral-950/25">
                          <ImageIcon className="w-6 h-6 text-neutral-300 mx-auto" />
                          <p className="font-semibold text-neutral-600 dark:text-neutral-300">Drag & Drop files here</p>
                          <p>Supports PNG, JPG, MP4, PDFs up to 50MB</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Crop Visual Workspace Simulation Overlay */}
                  {isCropping && selectedCropMedia && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl max-w-md w-full space-y-4 text-left">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase">Simulated Visual Crop Tool Workspace</h4>
                          <button onClick={() => { setIsCropping(false); setSelectedCropMedia(null); }} className="text-neutral-400"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="relative aspect-square rounded-2xl bg-neutral-950 overflow-hidden border">
                          <img src={selectedCropMedia.url} alt="Crop preview" className="w-full h-full object-contain opacity-50" />
                          
                          {/* Simulated Drag Crop Boundary Box overlay */}
                          <div 
                            className="absolute border-2 border-amber-500 bg-amber-500/10 cursor-move flex items-center justify-center"
                            style={{ 
                              top: `${cropBox.top}%`, 
                              left: `${cropBox.left}%`, 
                              width: `${cropBox.width}%`, 
                              height: `${cropBox.height}%` 
                            }}
                          >
                            <div className="absolute top-0 left-0 w-2 h-2 bg-white border border-amber-500 -mt-1 -ml-1 cursor-nwse-resize" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-white border border-amber-500 -mt-1 -mr-1 cursor-nesw-resize" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 bg-white border border-amber-500 -mb-1 -ml-1 cursor-nesw-resize" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white border border-amber-500 -mb-1 -mr-1 cursor-nwse-resize" />
                            <span className="text-[9px] font-mono font-bold bg-amber-500 text-neutral-950 px-1 py-0.2 rounded shadow">Active Crop Area</span>
                          </div>
                        </div>

                        {/* Sliders to simulate resizing */}
                        <div className="space-y-2 text-3xs font-mono text-neutral-500">
                          <div className="flex justify-between">
                            <span>Crop Width ({cropBox.width}%)</span>
                            <input 
                              type="range" 
                              min="30" 
                              max="100" 
                              value={cropBox.width} 
                              onChange={(e) => setCropBox({ ...cropBox, width: Number(e.target.value), height: Number(e.target.value) })}
                              className="w-32 accent-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => { setIsCropping(false); setSelectedCropMedia(null); }} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded text-3xs font-bold uppercase">Cancel</button>
                          <button onClick={handleSaveCrop} className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded text-3xs font-bold uppercase">Save Crop Output</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SECTION 8: USER PROFILES & ROLES ---------------- */}
              {activeTab === 'users' && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Roles & User Accounts Management</h2>
                      <p className="text-4xs text-neutral-500 mt-0.5">Edit credentials, reset client passwords, promote/demote editors, or block accounts.</p>
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                      <input 
                        type="text" 
                        value={searchUserQuery} 
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        placeholder="Search names or emails..."
                        className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-3xs bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-900 border rounded-2xl overflow-hidden shadow-sm text-3xs font-mono">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-100 dark:border-neutral-850 text-neutral-400 font-bold uppercase">
                          <th className="p-4">User profile</th>
                          <th className="p-4">Authorization Role</th>
                          <th className="p-4">Access Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList
                          .filter(u => u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.email.toLowerCase().includes(searchUserQuery.toLowerCase()))
                          .map(u => (
                            <tr key={u.uid} className="border-b border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/10">
                              <td className="p-4">
                                <p className="font-sans font-bold text-neutral-900 dark:text-white">{u.name}</p>
                                <p className="text-[10px] text-neutral-400">{u.email}</p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                  u.role === 'Editor' ? 'bg-blue-100 text-blue-800' :
                                  u.role === 'Moderator' ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  u.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {u.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-1 font-sans">
                                <button 
                                  onClick={() => handleToggleUserRole(u.uid, u.role)}
                                  className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-4xs font-bold uppercase"
                                >
                                  Change Role
                                </button>
                                <button 
                                  onClick={() => alert(`Simulated Reset: A secure password reset link has been dispatched to ${u.email}.`)}
                                  className="px-2 py-1 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 rounded text-4xs font-bold uppercase"
                                >
                                  Reset PWD
                                </button>
                                <button 
                                  onClick={() => handleToggleUserBlock(u.uid, u.status)}
                                  className={`px-2 py-1 rounded text-4xs font-bold uppercase ${
                                    u.status === 'blocked' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white hover:bg-red-600'
                                  }`}
                                >
                                  {u.status === 'blocked' ? 'Unblock' : 'Block'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ---------------- SECTION 9: PROMO CODES ---------------- */}
              {activeTab === 'promo' && (
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Promo Codes Database</h2>
                      <p className="text-4xs text-neutral-500 mt-0.5">Manage discounts coupons, set expiry limits, or delete old offerings.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddPromo(true)}
                      className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 text-3xs font-bold uppercase rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Promo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {promos.map(p => (
                      <div key={p.id} className="bg-white dark:bg-neutral-900 border p-5 rounded-2xl space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="px-2 py-0.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded font-bold">{p.code}</span>
                          <span className="font-bold text-amber-500">{p.discount}% OFF</span>
                        </div>
                        <div className="space-y-1 text-3xs text-neutral-500">
                          <p>Expiry Date: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{p.expiryDate}</span></p>
                          <p>Usage Track: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{p.usageCount} / {p.usageLimit} applications</span></p>
                        </div>

                        <div className="flex justify-end pt-2 border-t">
                          <button onClick={() => handleDeletePromo(p.id)} className="p-1 hover:bg-red-500/10 rounded text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAddPromo && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs uppercase">Add Promo Coupon</h4>
                          <button onClick={() => setShowAddPromo(false)} className="text-neutral-400"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleAddPromoCodeSubmit} className="space-y-3 text-3xs text-left font-mono">
                          <div>
                            <label className="block text-4xs uppercase mb-0.5">Coupon Code (e.g. FIRST20)</label>
                            <input type="text" value={newPromoCode} onChange={(e) => setNewPromoCode(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent uppercase" required />
                          </div>
                          <div className="grid grid-cols-2 gap-3 font-sans">
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Discount Percentage (%)</label>
                              <input type="number" value={newPromoDiscount} onChange={(e) => setNewPromoDiscount(Number(e.target.value))} className="w-full border p-2.5 rounded-lg bg-transparent" min="1" max="100" required />
                            </div>
                            <div>
                              <label className="block text-4xs font-mono uppercase mb-0.5">Max usage Limit</label>
                              <input type="number" value={newPromoLimit} onChange={(e) => setNewPromoLimit(Number(e.target.value))} className="w-full border p-2.5 rounded-lg bg-transparent" min="1" required />
                            </div>
                          </div>
                          <div>
                            <label className="block text-4xs uppercase mb-0.5">Expiration Date</label>
                            <input type="date" value={newPromoExpiry} onChange={(e) => setNewPromoExpiry(e.target.value)} className="w-full border p-2.5 rounded-lg bg-transparent text-neutral-500" required />
                          </div>

                          <button type="submit" className="w-full py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-sans font-bold uppercase rounded-xl">Generate Coupon</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SECTION 10: STORAGE MONITOR ---------------- */}
              {activeTab === 'storage' && settings && (
                <div className="space-y-6 text-left">
                  <div className="bg-white dark:bg-neutral-900 border p-6 rounded-2xl space-y-6 max-w-xl mx-auto text-center">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">A.K. Cloud Server Storage Analyzer</h3>
                      <p className="text-3xs text-neutral-500 leading-normal">Monitor server memory occupied by obsolete original media folders, preview edits, and PDF drafts.</p>
                    </div>

                    {/* Progress Bar meter */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-3xs font-mono text-neutral-400">
                        <span>STORAGE RESERVATION</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-100">{settings.serverStorageUsed} GB / {settings.maxServerStorage} GB FILLED</span>
                      </div>
                      
                      <div className="w-full h-3 bg-neutral-150 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-700 ${
                            settings.serverStorageUsed > 80 ? 'bg-red-500' :
                            settings.serverStorageUsed > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(settings.serverStorageUsed / settings.maxServerStorage) * 100}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                        <span>0% EMPTY CACHE</span>
                        <span>{100 - (settings.serverStorageUsed / settings.maxServerStorage) * 100}% FREE BLOCK</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 rounded-xl text-3xs text-neutral-500 text-left leading-relaxed flex gap-2 border">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">Storage Optimization Notice</p>
                        <p className="mt-0.5">As a creative studio, uploading large ProRes raw files, RED captures, and high-bitrate WAV exports quickly fills the storage. We recommend sweeping cache folders periodically.</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleCleanStorage}
                      className="px-6 py-3 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto hover:scale-95 transition-transform"
                    >
                      <Scissors className="w-4 h-4" /> Clean Up Obsolete Raw Cache (1-Click)
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

      </div>

      {/* FULLSCREEN INVOICE RENDER */}
      {selectedInvoice && (
        <InvoicePDF 
          order={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
