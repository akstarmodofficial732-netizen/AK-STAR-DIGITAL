export type ServiceType = 'photo' | 'video';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  price: number;
  description: string;
  features: string[];
  deliveryDays: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: ServiceType;
  mediaUrl: string; // Used as standard image/thumbnail or video URL
  beforeUrl?: string; // Optional for photo "Before/After" slider comparison
  afterUrl?: string;  // Optional for photo "Before/After" slider comparison
  description: string;
  tags: string[];
  isFeatured: boolean;
}

export type OrderStatus = 'pending' | 'in_progress' | 'under_review' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  currency?: string;
  priceConverted?: number;
  status: OrderStatus;
  requirements: {
    description: string;
    aspectRatio: string;
    urgency: 'standard' | 'express' | 'rush';
    referenceLinks?: string;
  };
  fileUrls: string[]; // Client uploaded project assets
  deliveryUrl?: string; // Final output URL delivered by admin
  deliveryNotes?: string;
  createdAt: any; // Firebase Timestamp or ISO string
  invoiceNo: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  statusNotes?: string;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any; // Firebase Timestamp or ISO string
  fileUrl?: string;
  isReadByAdmin: boolean;
  isReadByClient: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'client';
  createdAt: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'chat' | 'payment' | 'general';
  createdAt: string;
  isRead: boolean;
  linkTo?: string;
  clientId?: string;
}
