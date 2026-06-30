import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Service, PortfolioItem, Order, Message, NotificationItem, OrderStatus } from '../types';
import { INITIAL_SERVICES, INITIAL_PORTFOLIO } from '../data/mockData';

// Enable automatic localStorage backing for offline robustness
const isOnline = () => navigator.onLine;

// Initialize collections if empty
export async function initializeDatabaseIfEmpty() {
  try {
    // Check services
    const servicesRef = collection(db, 'services');
    const servicesSnap = await getDocs(servicesRef);
    if (servicesSnap.empty) {
      console.log('Initializing services collection with default data...');
      const batch = writeBatch(db);
      INITIAL_SERVICES.forEach((s) => {
        const docRef = doc(servicesRef, s.id);
        batch.set(docRef, s);
      });
      await batch.commit();
    }

    // Check portfolio
    const portfolioRef = collection(db, 'portfolio');
    const portfolioSnap = await getDocs(portfolioRef);
    if (portfolioSnap.empty) {
      console.log('Initializing portfolio collection with default data...');
      const batch = writeBatch(db);
      INITIAL_PORTFOLIO.forEach((p) => {
        const docRef = doc(portfolioRef, p.id);
        batch.set(docRef, p);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Database initialization warning (likely offline or permission):', err);
  }
}

// SERVICES OPERATIONS
export async function getServices(): Promise<Service[]> {
  try {
    const servicesRef = collection(db, 'services');
    const snap = await getDocs(servicesRef);
    const list: Service[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as Service);
    });
    // Save locally for offline use
    localStorage.setItem('cached_services', JSON.stringify(list));
    return list.length > 0 ? list : INITIAL_SERVICES;
  } catch (err) {
    console.warn('Failed to fetch services from firestore, using cache/mock:', err);
    const cached = localStorage.getItem('cached_services');
    return cached ? JSON.parse(cached) : INITIAL_SERVICES;
  }
}

export async function addOrUpdateService(service: Service): Promise<void> {
  const docRef = doc(db, 'services', service.id);
  await setDoc(docRef, service);
}

export async function deleteService(id: string): Promise<void> {
  const docRef = doc(db, 'services', id);
  await deleteDoc(docRef);
}

// PORTFOLIO OPERATIONS
export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const portfolioRef = collection(db, 'portfolio');
    const snap = await getDocs(portfolioRef);
    const list: PortfolioItem[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as PortfolioItem);
    });
    // Save locally for offline use
    localStorage.setItem('cached_portfolio', JSON.stringify(list));
    return list.length > 0 ? list : INITIAL_PORTFOLIO;
  } catch (err) {
    console.warn('Failed to fetch portfolio from firestore, using cache/mock:', err);
    const cached = localStorage.getItem('cached_portfolio');
    return cached ? JSON.parse(cached) : INITIAL_PORTFOLIO;
  }
}

export async function addOrUpdatePortfolioItem(item: PortfolioItem): Promise<void> {
  const docRef = doc(db, 'portfolio', item.id);
  await setDoc(docRef, item);
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const docRef = doc(db, 'portfolio', id);
  await deleteDoc(docRef);
}

// ORDERS OPERATIONS
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'invoiceNo'>): Promise<string> {
  const ordersRef = collection(db, 'orders');
  const invoiceNo = 'INV-' + Math.floor(100000 + Math.random() * 900000);
  const orderDoc = doc(ordersRef); // Auto generate ID
  
  const newOrder: Order = {
    ...orderData,
    id: orderDoc.id,
    invoiceNo,
    createdAt: new Date().toISOString(), // ISO string is easier for cross-environment comparisons and serialization
  };

  await setDoc(orderDoc, newOrder);

  // Send a system notification for the new order
  await addNotification(
    'New Order Received!',
    `Order ${invoiceNo} for "${orderData.serviceName}" has been placed by ${orderData.clientName}.`,
    'order',
    `/order/${orderDoc.id}`,
    orderData.clientId
  );

  return orderDoc.id;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Order;
    }
    return null;
  } catch (err) {
    console.error('Error fetching order:', err);
    return null;
  }
}

export async function getOrders(userEmail: string, isAdmin: boolean): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    if (isAdmin) {
      q = query(ordersRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(ordersRef, where('clientEmail', '==', userEmail));
    }
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as Order);
    });
    localStorage.setItem(`cached_orders_${userEmail}`, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn('Failed to fetch orders, returning local cache:', err);
    const cached = localStorage.getItem(`cached_orders_${userEmail}`);
    return cached ? JSON.parse(cached) : [];
  }
}

export function listenToOrders(userEmail: string, isAdmin: boolean, callback: (orders: Order[]) => void) {
  const ordersRef = collection(db, 'orders');
  let q;
  if (isAdmin) {
    q = query(ordersRef, orderBy('createdAt', 'desc'));
  } else {
    q = query(ordersRef, where('clientEmail', '==', userEmail));
  }

  return onSnapshot(q, (snap) => {
    const list: Order[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as Order);
    });
    localStorage.setItem(`cached_orders_${userEmail}`, JSON.stringify(list));
    callback(list);
  }, (err) => {
    console.warn('Orders listener error, loading from local:', err);
    const cached = localStorage.getItem(`cached_orders_${userEmail}`);
    if (cached) {
      callback(JSON.parse(cached));
    }
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const updateData: Partial<Order> = { status };
  if (notes !== undefined) {
    updateData.statusNotes = notes;
  }
  
  // If completed, set paidAt if not set
  if (status === 'completed') {
    updateData.paidAt = new Date().toISOString();
    updateData.paymentMethod = 'Secure Simulated Gateway';
  }

  await updateDoc(docRef, updateData);

  // Fetch order to notify client
  const orderSnap = await getDoc(docRef);
  if (orderSnap.exists()) {
    const order = orderSnap.data() as Order;
    const statusLabels: Record<OrderStatus, string> = {
      pending: 'Received & Pending',
      in_progress: 'In Progress (Active Editing)',
      under_review: 'Under Review (Editor uploaded drafts)',
      completed: 'Completed & Delivered',
      cancelled: 'Cancelled'
    };

    await addNotification(
      'Order Status Updated',
      `Your project "${order.serviceName}" (${order.invoiceNo}) is now: ${statusLabels[status]}.`,
      'order',
      `/order/${orderId}`,
      order.clientId
    );
  }
}

export async function deliverOrderFiles(orderId: string, deliveryUrl: string, deliveryNotes: string): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, {
    deliveryUrl,
    deliveryNotes,
    status: 'under_review' as OrderStatus
  });

  const orderSnap = await getDoc(docRef);
  if (orderSnap.exists()) {
    const order = orderSnap.data() as Order;
    await addNotification(
      'Project Delivered!',
      `The editor has uploaded the edited files for your project "${order.serviceName}". Please review!`,
      'order',
      `/order/${orderId}`,
      order.clientId
    );
  }
}

export async function updateOrderFileUrls(orderId: string, fileUrls: string[]): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, { fileUrls });
}

// REALTIME CHAT OPERATIONS
export function listenToMessages(orderId: string, callback: (messages: Message[]) => void) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef, 
    where('orderId', '==', orderId), 
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const list: Message[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Message);
    });
    // Save locally
    localStorage.setItem(`cached_messages_${orderId}`, JSON.stringify(list));
    callback(list);
  }, (err) => {
    console.warn('Real-time listener failed, falling back to cached messages', err);
    const cached = localStorage.getItem(`cached_messages_${orderId}`);
    if (cached) {
      callback(JSON.parse(cached));
    }
  });
}

export async function sendMessage(orderId: string, senderId: string, senderName: string, text: string, fileUrl?: string): Promise<void> {
  const messagesRef = collection(db, 'messages');
  const messageData = {
    orderId,
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    fileUrl: fileUrl || null,
    isReadByAdmin: senderId === 'admin',
    isReadByClient: senderId !== 'admin'
  };

  await addDoc(messagesRef, messageData);

  // Retrieve order to fetch the clientId
  let orderClientId: string | undefined = undefined;
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderDocRef);
    if (orderSnap.exists()) {
      orderClientId = (orderSnap.data() as Order).clientId;
    }
  } catch (err) {
    console.warn('Could not fetch order to link notification with clientId:', err);
  }

  // Send a quick notification
  await addNotification(
    'New Chat Message',
    `${senderName}: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
    'chat',
    `/order/${orderId}`,
    orderClientId
  );
}

// NOTIFICATIONS OPERATIONS
export function listenToNotifications(callback: (notifications: NotificationItem[]) => void) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const list: NotificationItem[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as NotificationItem);
    });
    localStorage.setItem('cached_notifications', JSON.stringify(list));
    callback(list);
  }, (err) => {
    console.warn('Notifications listener error, loading from local:', err);
    const cached = localStorage.getItem('cached_notifications');
    if (cached) {
      callback(JSON.parse(cached));
    }
  });
}

export async function addNotification(title: string, message: string, type: 'order' | 'chat' | 'payment' | 'general', linkTo?: string, clientId?: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      linkTo: linkTo || null,
      clientId: clientId || null
    });
  } catch (err) {
    console.warn('Failed to write notification (local offline queue is handling):', err);
    // Push locally
    const cached = localStorage.getItem('cached_notifications');
    const list: NotificationItem[] = cached ? JSON.parse(cached) : [];
    const localNotif: NotificationItem = {
      id: 'local_' + Date.now(),
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      linkTo,
      clientId
    };
    list.unshift(localNotif);
    localStorage.setItem('cached_notifications', JSON.stringify(list));
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    if (id.startsWith('local_')) {
      const cached = localStorage.getItem('cached_notifications');
      if (cached) {
        const list: NotificationItem[] = JSON.parse(cached);
        const updated = list.map((n) => n.id === id ? { ...n, isRead: true } : n);
        localStorage.setItem('cached_notifications', JSON.stringify(updated));
      }
      return;
    }
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.warn('Offline: could not mark read in firestore', err);
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const snap = await getDocs(notificationsRef);
    const batch = writeBatch(db);
    snap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Offline: failed to clear notifications', err);
  }
  localStorage.setItem('cached_notifications', JSON.stringify([]));
}
