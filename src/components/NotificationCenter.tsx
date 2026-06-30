import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mail, ShoppingBag, CreditCard, MessageSquare, Trash2, Check, ExternalLink } from 'lucide-react';
import { User } from 'firebase/auth';
import { listenToNotifications, markNotificationAsRead, clearAllNotifications } from '../lib/dbService';
import { NotificationItem } from '../types';

// Web Audio synthesizer for an elegant chime sound (no external file needed!)
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn('Audio context playback blocked or unsupported:', err);
  }
};

interface NotificationCenterProps {
  currentUser: User | null;
  userRole: 'admin' | 'client';
  onNavigateToOrder?: (orderId: string) => void;
}

export default function NotificationCenter({ currentUser, userRole, onNavigateToOrder }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    // Listen to live database notifications
    const unsubscribe = listenToNotifications((notifs) => {
      // Filter notifications based on role
      const filtered = notifs.filter((n) => {
        if (userRole === 'admin') {
          return true; // Admin gets notifications for all users
        }
        // Client only gets notifications for their own project/orders
        return n.clientId === currentUser?.uid;
      });

      // Check if new unread notification arrived to trigger Toast & Audio Chime
      const unread = filtered.filter((n) => !n.isRead);
      if (unread.length > prevCountRef.current) {
        const latest = unread[0];
        if (latest) {
          setActiveToast(latest);
          playNotificationChime();
          
          // Auto-hide toast after 4 seconds
          setTimeout(() => {
            setActiveToast((prev) => prev?.id === latest.id ? null : prev);
          }, 4500);
        }
      }
      prevCountRef.current = unread.length;
      setNotifications(filtered);
    });

    // Close when clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      unsubscribe();
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [currentUser, userRole]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif: NotificationItem) => {
    await markNotificationAsRead(notif.id);
    setIsOpen(false);
    
    if (notif.linkTo && onNavigateToOrder) {
      // Extract order ID if link matches pattern /order/:id
      const match = notif.linkTo.match(/\/order\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        onNavigateToOrder(match[1]);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL TRIGGER */}
      <button 
        id="notification-bell-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
        aria-label="Toggle notifications"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span 
            id="notification-badge"
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 text-neutral-950 font-bold text-3xs rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 animate-pulse"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <div 
          id="notification-dropdown"
          className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
            <h4 className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
              Updates & Alerts
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 text-3xs font-bold rounded-md font-mono">
                  {unreadCount} NEW
                </span>
              )}
            </h4>
            
            <div className="flex items-center gap-2">
              <button 
                id="clear-all-notifs"
                onClick={clearAllNotifications}
                className="text-neutral-400 hover:text-red-500 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">All caught up!</p>
                <p className="text-3xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">No notifications to display</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer text-left ${
                    !notif.isRead ? 'bg-amber-50/25 dark:bg-amber-500/5' : ''
                  }`}
                >
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-semibold text-neutral-900 dark:text-white truncate ${
                        !notif.isRead ? 'text-amber-600 dark:text-amber-400' : ''
                      }`}>
                        {notif.title}
                      </p>
                      <span className="text-4xs text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-2xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.linkTo && (
                      <span className="inline-flex items-center gap-1 text-4xs text-amber-500 font-bold uppercase tracking-wider mt-2">
                        View Project
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FLOAT TOAST NOTIFICATION POPUP (Rendered outside the portal or absolute overlay) */}
      {activeToast && (
        <div 
          id="toast-notification-popup"
          onClick={() => {
            handleNotificationClick(activeToast);
            setActiveToast(null);
          }}
          className="fixed top-20 right-6 z-50 w-80 md:w-96 bg-neutral-900 text-white dark:bg-neutral-950 dark:text-neutral-200 p-4 rounded-xl shadow-2xl border border-neutral-800 flex items-start gap-3 cursor-pointer hover:bg-neutral-850 dark:hover:bg-neutral-900 transition-all transform hover:scale-[1.02] animate-slide-in duration-300"
        >
          <div className="p-2 bg-neutral-850 dark:bg-neutral-900 rounded-lg shrink-0 text-amber-500">
            {getIcon(activeToast.type)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
              {activeToast.title}
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
            </p>
            <p className="text-2xs text-neutral-300 dark:text-neutral-400 mt-1 leading-normal">
              {activeToast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
