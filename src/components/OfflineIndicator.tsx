import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudLightning, Database } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatusBubble, setShowStatusBubble] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatusBubble(true);
      const timer = setTimeout(() => {
        setShowStatusBubble(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatusBubble(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check - if offline on mount, show bubble
    if (!navigator.onLine) {
      setShowStatusBubble(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatusBubble) return null;

  return (
    <div 
      id="network-status-indicator"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce"
    >
      {isOnline ? (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 px-4 py-2 rounded-full shadow-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
          <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Connected Online • Sync Complete</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-300 px-4 py-2.5 rounded-xl shadow-xl border border-red-200 dark:border-red-950 text-xs font-semibold max-w-sm text-center">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-500" />
            <span>Low Connectivity Mode Active</span>
          </div>
          <p className="text-3xs text-red-600 dark:text-red-400 font-mono mt-1 font-normal">
            You can still browse cached portfolio works, draft messages, and review active invoices offline.
          </p>
        </div>
      )}
    </div>
  );
}
