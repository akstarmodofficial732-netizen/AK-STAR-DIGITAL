import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ClipboardList, Clock, MessageSquare, Download, CheckCircle, 
  Sparkles, FileText, Plus, HelpCircle, ChevronRight, Video, Image as ImageIcon,
  Check, ArrowRight
} from 'lucide-react';
import { getOrders, getServices, listenToOrders } from '../lib/dbService';
import { Order, Service, OrderStatus } from '../types';
import ChatWindow from './ChatWindow';
import InvoicePDF from './InvoicePDF';
import OrderFormModal from './OrderFormModal';
import { CURRENCY_SYMBOLS, formatConvertedPrice, convertUSD } from '../lib/currencyService';

interface ClientDashboardProps {
  userEmail: string;
  userName: string;
  userId: string;
  currency: string;
  exchangeRates: Record<string, number>;
}

export default function ClientDashboard({ userEmail, userName, userId, currency, exchangeRates }: ClientDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [activeOrderModal, setActiveOrderModal] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatOrderPrice = (ord: Order) => {
    const symbol = CURRENCY_SYMBOLS[ord.currency || 'USD'] || '$';
    const amount = ord.priceConverted !== undefined ? ord.priceConverted : ord.price;
    if (ord.currency === 'JPY') {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const initData = async () => {
      setIsLoading(true);
      try {
        const fetchedServices = await getServices();
        setServices(fetchedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
      }

      unsubscribeOrders = listenToOrders(userEmail, false, (fetchedOrders) => {
        setOrders(fetchedOrders);
        setIsLoading(false);
      });
    };

    initData();

    return () => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    };
  }, [userEmail]);

  // Keep selectedOrder in sync with live updates of orders list
  useEffect(() => {
    if (orders.length > 0) {
      if (!selectedOrder) {
        setSelectedOrder(orders[0]);
      } else {
        const updated = orders.find(o => o.id === selectedOrder.id);
        if (updated) {
          if (updated.status !== selectedOrder.status || 
              updated.deliveryUrl !== selectedOrder.deliveryUrl ||
              updated.deliveryNotes !== selectedOrder.deliveryNotes ||
              JSON.stringify(updated.fileUrls) !== JSON.stringify(selectedOrder.fileUrls)) {
            setSelectedOrder(updated);
          }
        }
      }
    } else {
      setSelectedOrder(null);
    }
  }, [orders, selectedOrder]);

  const loadClientData = async () => {
    try {
      const fetchedServices = await getServices();
      setServices(fetchedServices);
    } catch (err) {
      console.error('Error refreshing services:', err);
    }
  };

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'in_progress': return 2;
      case 'under_review': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const handleOrderSuccess = (newOrderId: string) => {
    setActiveOrderModal(null);
    // Reload database
    loadClientData();
  };

  return (
    <div id="client-panel" className="bg-neutral-50 dark:bg-neutral-950 min-h-screen text-neutral-800 dark:text-neutral-100 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 animate-fade-in">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-mono mt-4">Syncing your active projects...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* WELCOME BANNER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
              <div>
                <h2 className="font-sans font-bold text-xl text-neutral-900 dark:text-white flex items-center gap-1.5">
                  Welcome, {userName}! <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Track your active editing pipelines, download files, or discuss parameters with your editor.</p>
              </div>
              <button
                id="btn-place-order-top"
                onClick={() => {
                  // Scroll to services
                  document.getElementById('services-shop-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4.5 py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-400 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Book Editing Service
              </button>
            </div>

            {/* DASHBOARD SECTIONS: Active Orders Pipeline & Chat side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Order selection and tracker */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Active Projects Selection List */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-white mb-4">Your Production Pipeline</h3>
                  
                  {orders.length === 0 ? (
                    <div className="py-8 text-center">
                      <ClipboardList className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">You haven't booked any projects yet</p>
                      <p className="text-3xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-sm mx-auto">
                        Explore our professional photo and video editing rates below to book your first project!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {orders.map((ord) => (
                        <div 
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedOrder?.id === ord.id
                              ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/5'
                              : 'border-neutral-100 hover:border-neutral-200 dark:border-neutral-800 dark:hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-4xs font-mono text-neutral-400 uppercase">{ord.invoiceNo}</span>
                                {ord.requirements.urgency !== 'standard' && (
                                  <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 text-5xs uppercase font-bold tracking-wider rounded font-mono">
                                    {ord.requirements.urgency} speed
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white mt-1">{ord.serviceName}</h4>
                              <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Due: {new Date(ord.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between border-t md:border-0 border-neutral-100 dark:border-neutral-800 pt-3 md:pt-0">
                              <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-100">{formatOrderPrice(ord)}</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-4xs font-bold font-mono uppercase tracking-wider ${
                                ord.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : ord.status === 'under_review'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                                  : ord.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}>
                                {ord.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Order Detailed Progress */}
                {selectedOrder && (
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6 text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                      <div>
                        <span className="text-4xs font-mono text-neutral-400 uppercase tracking-wider block">Currently tracking</span>
                        <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-white mt-1">
                          {selectedOrder.serviceName}
                        </h3>
                      </div>
                      <button
                        id="btn-invoice-client"
                        onClick={() => setSelectedInvoice(selectedOrder)}
                        className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-2xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 text-amber-500" />
                        Download Invoice
                      </button>
                    </div>

                    {/* Progress Workflow Pipeline Stage Tracker */}
                    <div className="py-4">
                      <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                        {/* Connecting Line for desktop */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 dark:bg-neutral-800 hidden md:block z-0" />
                        
                        {/* Active Progress colored overlay */}
                        <div 
                          className="absolute top-4 left-4 h-0.5 bg-amber-500 hidden md:block z-0 transition-all duration-500" 
                          style={{ width: `${(getStatusStep(selectedOrder.status) - 1) * 33.3}%` }}
                        />

                        {/* Pipeline stages */}
                        {[
                          { step: 1, label: 'Order Placed', desc: 'Secure payment confirmed' },
                          { step: 2, label: 'In Production', desc: 'Active video/photo grading' },
                          { step: 3, label: 'Review Delivery', desc: 'Editor uploaded drafts' },
                          { step: 4, label: 'Completed', desc: 'Files finalized' }
                        ].map((stage) => {
                          const activeStep = getStatusStep(selectedOrder.status);
                          const isDone = stage.step < activeStep;
                          const isCurrent = stage.step === activeStep;

                          return (
                            <div key={stage.step} className="relative z-10 flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2.5 md:w-32">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                isDone 
                                  ? 'bg-amber-500 border-amber-500 text-neutral-950 font-bold' 
                                  : isCurrent 
                                  ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-400 font-bold animate-pulse'
                                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                              }`}>
                                {isDone ? <Check className="w-4 h-4" /> : stage.step}
                              </div>
                              <div>
                                <h5 className={`text-2xs font-bold ${isCurrent ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>{stage.label}</h5>
                                <p className="text-4xs text-neutral-400 mt-0.5 max-w-[120px]">{stage.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deliveries / Downloads Box */}
                    {selectedOrder.status === 'under_review' || selectedOrder.status === 'completed' ? (
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <span className="text-4xs font-mono text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider block">Production Output Ready</span>
                          <h4 className="font-sans font-bold text-xs text-neutral-950 dark:text-white mt-1">Edited files are ready for download!</h4>
                          {selectedOrder.deliveryNotes && (
                            <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-1 italic">Message: "{selectedOrder.deliveryNotes}"</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <a 
                            href={selectedOrder.deliveryUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-400 rounded-xl text-2xs font-semibold shadow flex items-center gap-1.5 font-sans"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download High-Res Deliverable
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-3xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>The editor is currently work-rendering your media according to parameters. Check back shortly!</span>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Right Side: Chat Sidebar (Only visible when order selected) */}
              <div className="col-span-1 space-y-6">
                {selectedOrder ? (
                  <div className="sticky top-6">
                    <ChatWindow 
                      orderId={selectedOrder.id}
                      senderId={userId}
                      senderName={`${userName} (Client)`}
                      placeholder="Discuss parameters or request revisions with editor..."
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-400">
                    Select a project in your pipeline to open the live editor collaboration chat.
                  </div>
                )}
              </div>

            </div>

            {/* SERVICES SHOP rates BOARD */}
            <div id="services-shop-anchor" className="space-y-6 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="text-left">
                <span className="text-4xs font-mono text-amber-500 uppercase font-bold tracking-wider">Book New Projects</span>
                <h3 className="font-sans font-bold text-lg text-neutral-900 dark:text-white mt-1">Photo & Video Editing Solutions</h3>
                <p className="text-2xs text-neutral-500 dark:text-neutral-400 mt-0.5">Select a service level below to instantly launch the dynamic briefing ordering wizard.</p>
              </div>

              {/* Grid of services */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {services.map((svc) => (
                  <div 
                    key={svc.id} 
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-850 text-neutral-500 rounded text-4xs font-mono uppercase font-bold">
                          {svc.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-500">
                          {formatConvertedPrice(convertUSD(svc.price, currency, exchangeRates), currency)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{svc.name}</h4>
                      <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-normal line-clamp-3">{svc.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
                      <button
                        id={`btn-order-svc-${svc.id}`}
                        onClick={() => setActiveOrderModal(svc)}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 rounded-xl text-3xs font-semibold tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        Order Project
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FULLSCREEN AUTOMATED PDF INVOICE OVERLAY */}
      {selectedInvoice && (
        <InvoicePDF 
          order={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* ORDER BOOKING FORM MODAL */}
      {activeOrderModal && (
        <OrderFormModal 
          service={activeOrderModal}
          clientEmail={userEmail}
          clientName={userName}
          clientId={userId}
          currency={currency}
          exchangeRates={exchangeRates}
          onClose={() => setActiveOrderModal(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

    </div>
  );
}
