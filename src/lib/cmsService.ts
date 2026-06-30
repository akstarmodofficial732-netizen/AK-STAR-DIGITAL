import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface SiteSettings {
  siteTitle: string;
  siteTagline: string;
  logoText: string;
  faviconUrl: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerButtonText: string;
  bannerButtonLink: string;
  bannerImageUrl: string;
  primaryColor: string; // e.g., 'amber' | 'emerald' | 'blue' | 'violet' | 'rose'
  fontTheme: string; // e.g., 'sans' | 'serif' | 'mono' | 'space'
  serverStorageUsed: number; // in GB
  maxServerStorage: number; // in GB
}

export interface NavLink {
  id: string;
  name: string;
  url: string;
  position: 'header' | 'footer';
  order: number;
}

export interface PageContent {
  id: string; // 'home' | 'about' | 'contact' | 'privacy'
  title: string;
  content: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number; // percentage, e.g. 20 for 20%
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  author: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: string; // e.g., "4.2 MB"
  uploadedAt: string;
}

// Default initial values
const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'AK STAR DIGITAL',
  siteTagline: 'Flawless Photo & Video Editing for Creators & Brands',
  logoText: 'AK STAR',
  faviconUrl: '⚡',
  phone: '+91 98765 43210',
  email: 'akstarofficial732@gmail.com',
  address: 'Bhubaneswar, Odisha, India',
  facebook: 'https://facebook.com/akstar.digital',
  instagram: 'https://instagram.com/akstar.digital',
  linkedin: 'https://linkedin.com/company/akstar-digital',
  bannerTitle: 'Flawless Photo & Video Editing for Creators & Brands',
  bannerSubtitle: 'Elevate your raw assets into breathtaking cinematic masterpieces. We specialize in precision skin retouching, product composition, custom soundscapes, and color grading.',
  bannerButtonText: 'Browse Portfolio Works',
  bannerButtonLink: '#portfolio-section-anchor',
  bannerImageUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=1200',
  primaryColor: 'amber',
  fontTheme: 'sans',
  serverStorageUsed: 42.8,
  maxServerStorage: 100
};

const DEFAULT_NAV_LINKS: NavLink[] = [
  { id: 'h1', name: 'Home Portfolio', url: '#portfolio-section-anchor', position: 'header', order: 1 },
  { id: 'h2', name: 'Rates & Pricing', url: '#rates-section-anchor', position: 'header', order: 2 },
  { id: 'h3', name: 'FAQs', url: '#faq-anchor', position: 'header', order: 3 },
  { id: 'f1', name: 'About Us', url: '#about-modal', position: 'footer', order: 1 },
  { id: 'f2', name: 'Contact Info', url: '#contact-modal', position: 'footer', order: 2 },
  { id: 'f3', name: 'Privacy Policy', url: '#privacy-modal', position: 'footer', order: 3 }
];

const DEFAULT_PAGES: PageContent[] = [
  {
    id: 'about',
    title: 'About Our Creative Studio',
    content: 'AK STAR DIGITAL is a premium digital post-production and editing house based in Odisha, India. Formed in 2021, we have edited over 12,000+ commercial photos and 400+ cinematic videos for global creators, corporate brands, and marketing agencies. Our team of skilled retouchers, colorists, and sound designers work around the clock to turn standard raw content into elite industry-grade visual designs.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'contact',
    title: 'Get In Touch',
    content: 'Have a custom visual project or bulk volume post-production editing order? Send us your brief or request a free sample edit. Our client communication managers are available 24/7. Office Address: Pixel Tower, Phase II, Bhubaneswar, Odisha, India.',
    imageUrl: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=800',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'privacy',
    title: 'Privacy & Creative Integrity Policy',
    content: 'We take data integrity, confidentiality, and visual property security with extreme seriousness. All raw files (images, audio captures, raw video clips) uploaded by clients are stored securely behind dual-encrypted server paths. We never share, publicize, or use client media assets without explicit written consent. Completed edits are archived for exactly 30 days before being hard-cleaned to protect your identity.',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: '5 Color Grading Techniques for YouTube Reels',
    content: 'Cinematic grading can transform flat camera footage into highly engaging short clips. The secret lies in splitting your highlights and shadows correctly. In this post, we show how to apply custom cinematic LUTs, set neutral grey balanced skin tones, and boost the ambient glow of neon lighting. Highly saturated shadows should be avoided in favor of sleek, deep teal shades paired with warm orange-tinted skin highlights.',
    category: 'Video Production',
    tags: ['Reels', 'Color Grading', 'YouTube'],
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Ak Star'
  },
  {
    id: 'b2',
    title: 'The Ultimate Raw Skin Retouching Guide',
    content: 'High-end portrait editing requires preserving skin texture while smoothing tonal transitions. Frequency separation is the premier industry standard workflow for this task. By separating skin texture detail onto a high-frequency layer and skin color gradients onto a low-frequency layer, you can edit skin blemishes without creating a fake plastic effect. Remember to always work with 16-bit depth color files to avoid banding.',
    category: 'Photo Editing',
    tags: ['Skin Retouching', 'Photoshop', 'Portraits'],
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Ak Star'
  }
];

const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  { id: 'm1', name: 'cyberpunk_raw_shoot.jpg', url: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=600', type: 'image', size: '2.4 MB', uploadedAt: new Date().toISOString() },
  { id: 'm2', name: 'cyberpunk_graded_output.jpg', url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600', type: 'image', size: '3.1 MB', uploadedAt: new Date().toISOString() },
  { id: 'm3', name: 'broll_cinematic_landscape.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-the-mountains-42459-large.mp4', type: 'video', size: '18.4 MB', uploadedAt: new Date().toISOString() },
  { id: 'm4', name: 'customer_invoice_receipt.pdf', url: '#', type: 'document', size: '150 KB', uploadedAt: new Date().toISOString() }
];

const DEFAULT_PROMO_CODES: PromoCode[] = [
  { id: 'p1', code: 'FIRST20', discount: 20, expiryDate: '2026-12-31', usageLimit: 100, usageCount: 14 },
  { id: 'p2', code: 'AKSTAR50', discount: 50, expiryDate: '2026-08-31', usageLimit: 50, usageCount: 8 },
  { id: 'p3', code: 'FRESHPROD', discount: 15, expiryDate: '2026-10-15', usageLimit: 200, usageCount: 31 }
];

// Helper to set item with LocalStorage fallback
function saveLocal(key: string, data: any) {
  localStorage.setItem(`cms_${key}`, JSON.stringify(data));
}

function getLocal(key: string, defaults: any) {
  const cached = localStorage.getItem(`cms_${key}`);
  return cached ? JSON.parse(cached) : defaults;
}

// ---------------- SITE SETTINGS ----------------
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, 'cms', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      saveLocal('settings', data);
      return data;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch settings from Firestore, using local cache', err);
  }
  return getLocal('settings', DEFAULT_SETTINGS);
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const updated = { ...current, ...settings };
  try {
    const docRef = doc(db, 'cms', 'settings');
    await setDoc(docRef, updated);
  } catch (err) {
    console.warn('CMS: Failed to write settings to Firestore', err);
  }
  saveLocal('settings', updated);
  return updated;
}

// ---------------- NAV LINKS ----------------
export async function getNavLinks(): Promise<NavLink[]> {
  try {
    const colRef = collection(db, 'cms_nav_links');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: NavLink[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as NavLink));
      const sorted = list.sort((a, b) => a.order - b.order);
      saveLocal('nav_links', sorted);
      return sorted;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch nav links from Firestore', err);
  }
  return getLocal('nav_links', DEFAULT_NAV_LINKS);
}

export async function saveNavLinks(links: NavLink[]): Promise<void> {
  try {
    for (const link of links) {
      await setDoc(doc(db, 'cms_nav_links', link.id), link);
    }
  } catch (err) {
    console.warn('CMS: Failed to write nav links to Firestore', err);
  }
  saveLocal('nav_links', links);
}

export async function deleteNavLink(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cms_nav_links', id));
  } catch (err) {
    console.warn('CMS: Failed to delete nav link from Firestore', err);
  }
}

// ---------------- PAGE CONTENTS ----------------
export async function getPageContents(): Promise<PageContent[]> {
  try {
    const colRef = collection(db, 'cms_pages');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: PageContent[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as PageContent));
      saveLocal('pages', list);
      return list;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch pages from Firestore', err);
  }
  return getLocal('pages', DEFAULT_PAGES);
}

export async function updatePageContent(id: string, page: Partial<PageContent>): Promise<void> {
  const pages = await getPageContents();
  const updatedPages = pages.map(p => p.id === id ? { ...p, ...page, updatedAt: new Date().toISOString() } : p);
  const target = updatedPages.find(p => p.id === id);
  if (target) {
    try {
      await setDoc(doc(db, 'cms_pages', id), target);
    } catch (err) {
      console.warn('CMS: Failed to write page to Firestore', err);
    }
  }
  saveLocal('pages', updatedPages);
}

// ---------------- PROMO CODES ----------------
export async function getPromoCodes(): Promise<PromoCode[]> {
  try {
    const colRef = collection(db, 'cms_promo_codes');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: PromoCode[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as PromoCode));
      saveLocal('promo_codes', list);
      return list;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch promo codes from Firestore', err);
  }
  return getLocal('promo_codes', DEFAULT_PROMO_CODES);
}

export async function addOrUpdatePromoCode(promo: PromoCode): Promise<void> {
  try {
    await setDoc(doc(db, 'cms_promo_codes', promo.id), promo);
  } catch (err) {
    console.warn('CMS: Failed to save promo code to Firestore', err);
  }
  const promos = await getPromoCodes();
  const exists = promos.some(p => p.id === promo.id);
  const updated = exists ? promos.map(p => p.id === promo.id ? promo : p) : [...promos, promo];
  saveLocal('promo_codes', updated);
}

export async function deletePromoCode(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cms_promo_codes', id));
  } catch (err) {
    console.warn('CMS: Failed to delete promo code from Firestore', err);
  }
  const promos = await getPromoCodes();
  const updated = promos.filter(p => p.id !== id);
  saveLocal('promo_codes', updated);
}

// ---------------- BLOG POSTS ----------------
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const colRef = collection(db, 'cms_blog_posts');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: BlogPost[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as BlogPost));
      const sorted = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      saveLocal('blog_posts', sorted);
      return sorted;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch blog posts from Firestore', err);
  }
  return getLocal('blog_posts', DEFAULT_BLOG_POSTS);
}

export async function addOrUpdateBlogPost(post: BlogPost): Promise<void> {
  try {
    await setDoc(doc(db, 'cms_blog_posts', post.id), post);
  } catch (err) {
    console.warn('CMS: Failed to save blog post to Firestore', err);
  }
  const posts = await getBlogPosts();
  const exists = posts.some(p => p.id === post.id);
  const updated = exists ? posts.map(p => p.id === post.id ? post : p) : [post, ...posts];
  saveLocal('blog_posts', updated);
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cms_blog_posts', id));
  } catch (err) {
    console.warn('CMS: Failed to delete blog post from Firestore', err);
  }
  const posts = await getBlogPosts();
  const updated = posts.filter(p => p.id !== id);
  saveLocal('blog_posts', updated);
}

// ---------------- MEDIA ASSETS ----------------
export async function getMediaAssets(): Promise<MediaAsset[]> {
  try {
    const colRef = collection(db, 'cms_media_assets');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: MediaAsset[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as MediaAsset));
      saveLocal('media_assets', list);
      return list;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch media assets from Firestore', err);
  }
  return getLocal('media_assets', DEFAULT_MEDIA_ASSETS);
}

export async function addMediaAsset(asset: MediaAsset): Promise<void> {
  try {
    await setDoc(doc(db, 'cms_media_assets', asset.id), asset);
  } catch (err) {
    console.warn('CMS: Failed to add media asset to Firestore', err);
  }
  const assets = await getMediaAssets();
  saveLocal('media_assets', [asset, ...assets]);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cms_media_assets', id));
  } catch (err) {
    console.warn('CMS: Failed to delete media asset from Firestore', err);
  }
  const assets = await getMediaAssets();
  const updated = assets.filter(a => a.id !== id);
  saveLocal('media_assets', updated);
}

// ---------------- USER MANAGEMENT ----------------
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'Editor' | 'Moderator' | 'client';
  status: 'active' | 'blocked';
}

const DEFAULT_USERS: UserProfile[] = [
  { uid: 'u1', name: 'Ritesh Sharma', email: 'ritesh.sharma99@gmail.com', role: 'client', status: 'active' },
  { uid: 'u2', name: 'Nisha Patnaik', email: 'nisha.edit@gmail.com', role: 'Editor', status: 'active' },
  { uid: 'u3', name: 'Satyajit Ray', email: 'satyajit.reels@outlook.com', role: 'Moderator', status: 'active' },
  { uid: 'u4', name: 'Priyanka Das', email: 'priyanka_photos@yahoo.com', role: 'client', status: 'active' },
  { uid: 'u5', name: 'Ak Star', email: 'akstar599@gmail.com', role: 'admin', status: 'active' },
  { uid: 'u6', name: 'AK STAR Official', email: 'akstarofficial732@gmail.com', role: 'admin', status: 'active' }
];

export async function getCMSUsers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'cms_users');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: UserProfile[] = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() } as UserProfile));
      saveLocal('users_list', list);
      return list;
    }
  } catch (err) {
    console.warn('CMS: Failed to fetch users from Firestore', err);
  }
  return getLocal('users_list', DEFAULT_USERS);
}

export async function saveCMSUser(user: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'cms_users', user.uid), user);
  } catch (err) {
    console.warn('CMS: Failed to save user profile to Firestore', err);
  }
  const users = await getCMSUsers();
  const exists = users.some(u => u.uid === user.uid);
  const updated = exists ? users.map(u => u.uid === user.uid ? user : u) : [...users, user];
  saveLocal('users_list', updated);
}
