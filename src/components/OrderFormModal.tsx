import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, CreditCard, Clock, Check, HelpCircle, FileVideo, FileImage, ShieldCheck } from 'lucide-react';
import { Service, Order } from '../types';
import { createOrder } from '../lib/dbService';
import { convertUSD, formatConvertedPrice, CURRENCY_SYMBOLS } from '../lib/currencyService';
import { getPromoCodes, PromoCode } from '../lib/cmsService';
import AestheticFileUploader from './AestheticFileUploader';

interface OrderFormModalProps {
  service: Service;
  clientEmail: string;
  clientName: string;
  clientId: string;
  currency: string;
  exchangeRates: Record<string, number>;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function OrderFormModal({ service, clientEmail, clientName, clientId, currency, exchangeRates, onClose, onSuccess }: OrderFormModalProps) {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9 Widescreen');
  const [urgency, setUrgency] = useState<'standard' | 'express' | 'rush'>('standard');
  const [referenceLinks, setReferenceLinks] = useState('');
  
  // Credit card state
  const [cardName, setCardName] = useState(clientName);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  // Convert standard service price to local currency
  const servicePriceLocal = convertUSD(service.price, currency, exchangeRates);

  // Pricing calculations
  const getUrgencyMultiplier = () => {
    if (urgency === 'express') return 1.25; // +25%
    if (urgency === 'rush') return 1.5;    // +50%
    return 1.0;
  };

  const getUrgencyDeliveryDays = () => {
    if (urgency === 'express') return Math.max(1, Math.round(service.deliveryDays / 2));
    if (urgency === 'rush') return 1;
    return service.deliveryDays;
  };

  const calculateSubtotal = () => {
    return Math.round(servicePriceLocal * getUrgencyMultiplier());
  };

  const calculateTax = () => {
    if (service.price === 0 || calculateSubtotal() === 0) return 0;
    return Number((calculateSubtotal() * 0.18).toFixed(2));
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    const rawTotal = calculateSubtotal() + calculateTax();
    return Number((rawTotal * (appliedPromo.discount / 100)).toFixed(2));
  };

  const calculateTotal = () => {
    if (service.price === 0) return 0;
    const totalRaw = calculateSubtotal() + calculateTax();
    const result = Number((totalRaw - calculateDiscount()).toFixed(2));
    return result < 0 ? 0 : result;
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const activePromos = await getPromoCodes();
      const code = promoCodeInput.trim().toUpperCase();
      const matched = activePromos.find(p => p.code === code);
      if (!matched) {
        setPromoError('Invalid coupon code.');
        setAppliedPromo(null);
        return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (matched.expiryDate && matched.expiryDate < todayStr) {
        setPromoError('This coupon code has expired.');
        setAppliedPromo(null);
        return;
      }
      if (matched.usageLimit && matched.usageCount >= matched.usageLimit) {
        setPromoError('This coupon code limit has been reached.');
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo(matched);
      setPromoError('');
    } catch (e) {
      console.error(e);
      setPromoError('Error verifying coupon.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const isFree = calculateTotal() <= 0;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!isFree) {
        setStep(3);
        return;
      }
      // If it is free, we proceed directly to place the order without Step 3!
    }

    // Step 3 or Free Order placement
    setIsPaying(true);
    
    // Simulate payment response latency
    setTimeout(async () => {
      try {
        // Calculate standard price considering promo discount
        const originalPriceUsd = Math.round(service.price * getUrgencyMultiplier());
        const finalPriceUsd = appliedPromo 
          ? Math.round(originalPriceUsd * (1 - appliedPromo.discount / 100))
          : originalPriceUsd;

        const orderData: Omit<Order, 'id' | 'createdAt' | 'invoiceNo'> = {
          clientId,
          clientEmail,
          clientName,
          serviceId: service.id,
          serviceName: service.name,
          price: finalPriceUsd, // store standard/urgency total in USD with promo discount
          currency,
          priceConverted: calculateTotal(), // store standard/urgency total in chosen local currency with discount
          status: 'pending',
          requirements: {
            description: description || `Edit raw visual assets according to ${service.name} checklist.`,
            aspectRatio,
            urgency,
            referenceLinks: referenceLinks || ""
          },
          fileUrls: referenceLinks ? [referenceLinks] : [],
          dueDate: new Date(Date.now() + getUrgencyDeliveryDays() * 24 * 60 * 60 * 1000).toISOString(),
          paidAt: new Date().toISOString(),
          paymentMethod: isFree 
            ? `Free Offer / Coupon Applied (${appliedPromo ? appliedPromo.code : 'Free Service'})` 
            : `Secure Simulated Gateway (Visa ending in ${cardNumber.slice(-4)})`
        };

        const newOrderId = await createOrder(orderData);
        setIsPaying(false);
        onSuccess(newOrderId);
      } catch (err) {
        console.error('Failed to create order in database:', err);
        setIsPaying(false);
      }
    }, 1500);
  };

  return (
    <div id="order-form-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="order-form-container"
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50 truncate max-w-xs md:max-w-md">
              Order: {service.name}
            </h3>
          </div>
          <button 
            id="close-order-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-2xs font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>1</span>
            <span className={step >= 1 ? 'font-bold text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'}>Preferences</span>
          </div>
          <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 mx-3" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>2</span>
            <span className={step >= 2 ? 'font-bold text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'}>Brief Details</span>
          </div>
          <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 mx-3" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>3</span>
            <span className={step >= 3 ? 'font-bold text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'}>Secure Pay</span>
          </div>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {/* STEP 1: SERVICE OPTIONS & URGENCY */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Delivery Urgency & Speed</label>
                <div className="grid grid-cols-1 gap-3">
                  
                  {/* Standard Option */}
                  <div 
                    onClick={() => setUrgency('standard')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      urgency === 'standard' 
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/5' 
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${urgency === 'standard' ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>
                        {urgency === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Standard Delivery</h4>
                        <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">Shipped within {service.deliveryDays} business days</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{formatConvertedPrice(servicePriceLocal, currency)}</span>
                  </div>

                  {/* Express Option */}
                  <div 
                    onClick={() => setUrgency('express')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      urgency === 'express' 
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/5' 
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${urgency === 'express' ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>
                        {urgency === 'express' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Express Delivery</h4>
                          <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 text-4xs font-mono rounded">Fast</span>
                        </div>
                        <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">Shipped within {getUrgencyDeliveryDays()} business days • Priority Queue</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{formatConvertedPrice(Math.round(servicePriceLocal * 1.25), currency)}</span>
                  </div>

                  {/* Rush 24h Option */}
                  <div 
                    onClick={() => setUrgency('rush')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      urgency === 'rush' 
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/5' 
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${urgency === 'rush' ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>
                        {urgency === 'rush' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">24-Hour Super Rush</h4>
                          <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 text-4xs font-mono rounded animate-pulse">Ultra Fast</span>
                        </div>
                        <p className="text-3xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">Guaranteed delivery under 24 hours • Top Priority Placement</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{formatConvertedPrice(Math.round(servicePriceLocal * 1.5), currency)}</span>
                  </div>

                </div>
              </div>

              <div>
                <label className="block text-2xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Target Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {['16:9 Widescreen', '9:16 Vertical Reel', '1:1 Square Frame', '4:5 Social Portrait'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 px-3 rounded-lg border font-medium transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-neutral-950'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRIEFING & FILES */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-mono text-neutral-400 uppercase tracking-wider mb-1.5">Project Description & Edit Instructions</label>
                <textarea
                  id="order-requirements"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain exactly how you want your media edited. Mention mood, pacing, color palette preference, and any text lower-thirds or captions to add."
                  className="w-full text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-3 text-left">
                <label className="block text-2xs font-mono text-neutral-400 uppercase tracking-wider">Asset Requirements / Folder Link</label>
                
                <AestheticFileUploader 
                  id="order-form-uploader"
                  placeholderText="Select local file or choose from Google Drive"
                  onFileSelected={(url, name) => {
                    setReferenceLinks(url);
                  }}
                />

                <div className="pt-1">
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Selected Reference / Asset Link</label>
                  <input
                    id="order-attachments"
                    type="url"
                    value={referenceLinks}
                    onChange={(e) => setReferenceLinks(e.target.value)}
                    placeholder="Auto-populated upload URL or paste backup link"
                    className="w-full text-[11px] font-mono border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <p className="text-3xs font-mono text-neutral-400">
                  You can upload files from internal storage, import directly from Google Drive, or paste a backup cloud path.
                </p>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
                  {/* Promo Code Coupon Input Box (Step 2 Entry) */}
                  <div className="bg-neutral-50/50 dark:bg-neutral-950/20 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <span className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider">Do you have an offers/coupon code?</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder="e.g. FIRST20"
                        className="flex-1 uppercase border px-3 py-1.5 rounded-lg text-3xs bg-transparent text-neutral-900 dark:text-white"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo}
                        className="px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100 rounded-lg text-3xs font-bold uppercase cursor-pointer"
                      >
                        {isApplyingPromo ? 'Verifying...' : 'Apply'}
                      </button>
                    </div>
                    {appliedPromo && (
                      <p className="text-emerald-600 dark:text-emerald-400 text-4xs font-mono">⚡ Coupon successfully applied! {appliedPromo.discount}% OFF your production edit.</p>
                    )}
                    {promoError && (
                      <p className="text-red-500 text-4xs font-mono">{promoError}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY SUBMISSION */}
          {step === 3 && (
            <div className="space-y-4">
              
              {/* Payment Summary Box */}
              <div className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between text-neutral-500">
                  <span>Ordered Service:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{service.name}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Aspect Ratio:</span>
                  <span className="font-mono">{aspectRatio}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Urgency Fee:</span>
                  <span className="font-mono capitalize">{urgency}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatConvertedPrice(calculateSubtotal(), currency)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Service GST (18%):</span>
                  <span className="font-mono font-medium">{formatConvertedPrice(calculateTax(), currency)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount Coupon ({appliedPromo.code} - {appliedPromo.discount}%):</span>
                    <span className="font-mono">-{formatConvertedPrice(calculateDiscount(), currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 font-bold text-sm text-neutral-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-500">{formatConvertedPrice(calculateTotal(), currency)}</span>
                </div>
              </div>

              {/* Promo Code Coupon Input Box */}
              <div className="bg-neutral-50/50 dark:bg-neutral-950/20 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <span className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider">Do you have an offers/coupon code?</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="e.g. FIRST20"
                    className="flex-1 uppercase border px-3 py-1.5 rounded-lg text-3xs bg-transparent text-neutral-900 dark:text-white"
                  />
                  <button 
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo}
                    className="px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100 rounded-lg text-3xs font-bold uppercase cursor-pointer"
                  >
                    {isApplyingPromo ? 'Verifying...' : 'Apply'}
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-emerald-600 dark:text-emerald-400 text-4xs font-mono">⚡ Coupon successfully applied! {appliedPromo.discount}% OFF your production edit.</p>
                )}
                {promoError && (
                  <p className="text-red-500 text-4xs font-mono">{promoError}</p>
                )}
              </div>

              {/* Card Inputs */}
              <div>
                <label className="block text-2xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Secure Credit/Debit Card Details</label>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/30 dark:bg-neutral-950/10 divide-y divide-neutral-200 dark:divide-neutral-800">
                  
                  {/* Cardholder Name */}
                  <div className="p-3">
                    <span className="text-4xs font-mono text-neutral-400 uppercase block mb-1">Cardholder Name</span>
                    <input 
                      id="cc-name"
                      type="text" 
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-transparent text-xs text-neutral-900 dark:text-white focus:outline-none font-medium"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  {/* Card Number & Brand Detection Logo */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-4xs font-mono text-neutral-400 uppercase block mb-1">Card Number</span>
                      <input 
                        id="cc-number"
                        type="text" 
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-transparent text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                        placeholder="4242 4242 4242 4242"
                        required
                      />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <CreditCard className="w-6 h-6 text-neutral-400" />
                    </div>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
                    <div className="p-3">
                      <span className="text-4xs font-mono text-neutral-400 uppercase block mb-1">Expires</span>
                      <input 
                        id="cc-expiry"
                        type="text" 
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-transparent text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="p-3">
                      <span className="text-4xs font-mono text-neutral-400 uppercase block mb-1">CVV / CVC</span>
                      <input 
                        id="cc-cvv"
                        type="password" 
                        value={cardCvv}
                        onChange={handleCvvChange}
                        className="w-full bg-transparent text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Secure checkout assurances */}
              <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-3 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-4xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-sans">
                  This transaction is processed via secure SSL 256-bit sandbox routing. No real currency is charged during this design test phase, but full invoicing protocols remain active.
                </p>
              </div>

            </div>
          )}

        </form>

        {/* MODAL ACTION FOOTER */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 rounded-b-2xl flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              id="back-step-btn"
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 dark:text-neutral-350 dark:hover:text-neutral-100 cursor-pointer"
              disabled={isPaying}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {(() => {
            const isFree = calculateTotal() <= 0;
            return (
              <button
                id="next-step-btn"
                type="button"
                onClick={handleSubmitOrder}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  (step === 3 || (isFree && step === 2))
                    ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-95' 
                    : 'bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800'
                }`}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    {isFree ? 'Processing Free Order...' : 'Securing Funds...'}
                  </>
                ) : step === 3 ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay & Order ({formatConvertedPrice(calculateTotal(), currency)})
                  </>
                ) : (isFree && step === 2) ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Claim Free Offer (0 Cost)
                  </>
                ) : (
                  'Continue to Next'
                )}
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
