import React, { useState, useEffect } from 'react';
import { Shield, Eye, Check, X } from 'lucide-react';

export default function GDPRConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted
    const consent = localStorage.getItem('pixelcraft_gdpr_consent');
    if (!consent) {
      // Trigger slide-in shortly after mount
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pixelcraft_gdpr_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pixelcraft_gdpr_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      id="gdpr-banner"
      className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-neutral-800 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-5 transition-transform duration-500 animate-slide-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            GDPR Compliance Notice
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
            AK STAR DIGITAL uses encrypted cookies and local data storage to synchronize chat history, order details, and secure checkout sessions. We protect and never share your data.
          </p>

          {showDetails && (
            <div className="mt-3 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3 text-2xs text-neutral-400 dark:text-neutral-500 font-mono">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span><strong>Essential Cookies:</strong> Session verification, invoice metadata.</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span><strong>Database Sync:</strong> Firestore cached messaging.</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span><strong>Privacy Contact:</strong> privacy@akstardigital.com</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button 
              id="gdpr-accept"
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-neutral-950 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Accept All
            </button>
            <button 
              id="gdpr-details"
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            <button 
              id="gdpr-decline"
              onClick={handleDecline}
              className="ml-auto text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
