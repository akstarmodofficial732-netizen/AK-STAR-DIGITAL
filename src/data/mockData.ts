import { Service, PortfolioItem } from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Cinematic Video Color Grading & Editing',
    type: 'video',
    price: 149,
    description: 'Transform raw footage into a cinematic masterpiece. Perfect for music videos, vlogs, short films, and YouTube promos.',
    features: [
      'Advanced Color Grading & Match Matching',
      'Dynamic Transitions & Sound Design',
      'Full HD/4K Render output',
      'Royalty-free background music selection',
      'Up to 3 revisions included'
    ],
    deliveryDays: 5
  },
  {
    id: 's2',
    name: 'High-End Portrait & Fashion Retouching',
    type: 'photo',
    price: 49,
    description: 'Professional magazine-quality beauty retouching. Ideal for model portfolios, fashion shoots, and high-impact headshots.',
    features: [
      'Frequency separation skin retouching',
      'Eye and hair color enhancement',
      'Digital makeup & clothing cleanup',
      'High-end color grading & mood adjustment',
      'Includes original RAW & high-res exports'
    ],
    deliveryDays: 3
  },
  {
    id: 's3',
    name: 'E-Commerce Product Visual Manipulation',
    type: 'photo',
    price: 39,
    description: 'Stunning premium commercial listings. We place your products in luxury studio setups digitally to drive high sales conversion.',
    features: [
      'Precise background removal & cutout',
      'Digital studio shadow & reflection creation',
      'Texture and color correction',
      'Dust, scratch, and reflection removal',
      'Ready in Amazon/Shopify standard formats'
    ],
    deliveryDays: 2
  },
  {
    id: 's4',
    name: 'Social Media Reel & TikTok Editing Bundle',
    type: 'video',
    price: 89,
    description: 'Engaging, fast-paced edits designed to go viral. Perfect for creators looking to skyrocket their engagement on Shorts, Reels, and TikTok.',
    features: [
      'Trendy auto-captions & emojis',
      'Intense pacing, zooms, & sound effects',
      'Visual hook optimization',
      'Pack of 3 edited vertical videos',
      'Fast 24-hour express delivery option'
    ],
    deliveryDays: 2
  }
];

export const INITIAL_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'p1',
    title: 'Cyberpunk Neon City Manipulation',
    category: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=1200',
    beforeUrl: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=800',
    afterUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=800',
    description: 'Converted a flat daytime rainy city street photo into a vibrant cyberpunk scene using custom lighting, glowing neon signs, rain reflections, and futuristic color grading.',
    tags: ['Creative Editing', 'Color Grading', 'Photoshop'],
    isFeatured: true
  },
  {
    id: 'p2',
    title: 'Cinematic Travel Reel - Bali Escape',
    category: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-shot-of-a-waterfall-in-bali-43132-large.mp4',
    description: 'A breathtaking high-paced travel montage capturing the essence of Bali. Features speed ramps, seamless whip pans, custom foley/sound design, and deep cinematic golden-hour color grading.',
    tags: ['Video Editing', 'Color Grading', 'Sound Design'],
    isFeatured: true
  },
  {
    id: 'p3',
    title: 'Luxury Watch Product Commercial',
    category: 'photo',
    beforeUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800',
    afterUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800',
    mediaUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1200',
    description: 'Digital studio background replacement and professional high-gloss product retouching. Removed micro-scratches, balanced studio reflections, and enhanced the premium gold finish.',
    tags: ['Product Retouching', 'Commercial', 'Reflections'],
    isFeatured: true
  },
  {
    id: 'p4',
    title: 'Cinematic Drone Vlog - Alpine Explorer',
    category: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drone-shot-of-snowy-mountains-and-forest-42205-large.mp4',
    description: 'Color-graded flat LOG drone footage of the Swiss Alps, introducing warmth and atmospheric contrast. Balanced the highlights of the snow caps while enhancing shadow details in the pine forests.',
    tags: ['Drone Footage', 'LOG Grading', 'Cinematic'],
    isFeatured: false
  },
  {
    id: 'p5',
    title: 'Editorial Studio Portrait Retouch',
    category: 'photo',
    beforeUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    afterUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800', // Just different portraits to represent retouch
    mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
    description: 'High-end beauty skin retouching using frequency separation, maintaining micro skin texture while evening tones. Eye color enhancement, hair flyaway removal, and crisp digital sharpening.',
    tags: ['Beauty Retouch', 'Frequency Separation', 'Fashion'],
    isFeatured: true
  }
];

export const FAQS = [
  {
    q: 'How do I submit my raw photos or video files?',
    a: 'Once you place an order, you can upload files directly in your order dashboard or provide links to Google Drive, Dropbox, or WeTransfer in the project requirements.'
  },
  {
    q: 'What is the turnaround time for a project?',
    a: 'Turnaround time varies by service, ranging from 2 days for quick reels to 5 days for cinematic video grading. Express delivery options are available at checkout!'
  },
  {
    q: 'Can I request revisions if I am not satisfied?',
    a: 'Absolutely! Standard orders include up to 3 rounds of revisions. We will work closely with you via real-time chat to make sure the final result is exactly as you envisioned.'
  },
  {
    q: 'How does payment work? Is it secure?',
    a: 'We use a fully integrated, secure payment simulator on our app, which provides direct invoice receipts. Your transaction details are encrypted and secure.'
  }
];
