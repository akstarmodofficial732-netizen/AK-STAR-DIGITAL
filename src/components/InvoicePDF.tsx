import React from 'react';
import { FileText, Printer, Shield, CheckCircle } from 'lucide-react';
import { Order } from '../types';
import { CURRENCY_SYMBOLS } from '../lib/currencyService';

interface InvoicePDFProps {
  order: Order;
  onClose: () => void;
}

export default function InvoicePDF({ order, onClose }: InvoicePDFProps) {
  const handlePrint = () => {
    window.print();
  };

  const currency = order.currency || 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  const calculateSubtotal = () => {
    return order.priceConverted || order.price;
  };

  const calculateTax = () => {
    return Number((calculateSubtotal() * 0.18).toFixed(2));
  };

  const calculateTotal = () => {
    return Number((calculateSubtotal() + calculateTax()).toFixed(2));
  };

  const formatAmount = (val: number) => {
    if (currency === 'JPY') {
      return `${symbol}${Math.round(val).toLocaleString()}`;
    }
    return `${symbol}${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="invoice-container"
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
      >
        {/* HEADER CONTROLS (Hidden during print) */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-semibold text-lg text-neutral-900 dark:text-neutral-50">Invoice Generator</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              id="invoice-print-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors rounded-lg shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button 
              id="invoice-close-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div id="invoice-printable-area" className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible">
          {/* Company Branding & Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-100 dark:border-neutral-800 pb-8">
            <div>
              <h1 className="font-sans font-bold text-3xl tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                AK STAR<span className="text-amber-500 font-mono">DIGITAL</span>
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">High-End Photo & Video Post-Production</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">support@akstardigital.com | Odisha, India</p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.status === 'completed' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
              }`}>
                <CheckCircle className="w-3.5 h-3.5" />
                {order.status === 'completed' ? 'PAID & DELIVERED' : 'PAYMENT DUE'}
              </span>
              <p className="text-sm font-mono text-neutral-500 dark:text-neutral-400">Invoice: {order.invoiceNo}</p>
            </div>
          </div>

          {/* Client & Billing Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 text-sm">
            <div>
              <p className="font-mono text-xs text-neutral-400 uppercase tracking-wider mb-2">Billed To</p>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">{order.clientName}</h4>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">{order.clientEmail}</p>
              <p className="text-neutral-500 dark:text-neutral-500 mt-2 text-xs">Client ID: {order.clientId.substring(0, 8)}...</p>
            </div>
            <div className="flex flex-col md:items-end">
              <p className="font-mono text-xs text-neutral-400 uppercase tracking-wider mb-2">Invoice Dates</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right">
                <span className="text-neutral-500 dark:text-neutral-400 text-left md:text-right">Issued Date:</span>
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                  {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                
                <span className="text-neutral-500 dark:text-neutral-400 text-left md:text-right">Due Date:</span>
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                  {new Date(order.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>

                {order.paidAt && (
                  <>
                    <span className="text-emerald-500 text-left md:text-right">Paid At:</span>
                    <span className="font-mono font-medium text-emerald-500">
                      {new Date(order.paidAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-mono text-xs uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-center">Urgency</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">{order.serviceName}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                      Professional production assets edit, sound composition, fine tuning, color matching & grade profile configuration.
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {order.requirements.urgency}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                    {formatAmount(calculateSubtotal())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-neutral-100 dark:border-neutral-800 pt-8">
            <div className="max-w-xs text-xs text-neutral-400 dark:text-neutral-50 flex items-start gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                AK STAR DIGITAL operates fully within certified, secure billing protocols. This receipt conforms directly to GDPR standards regarding personal purchase tracing and billing transparency.
              </span>
            </div>

            <div className="w-full md:w-64 flex flex-col gap-2 text-sm font-mono self-end">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>Subtotal:</span>
                <span>{formatAmount(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>GST / Taxes (18%):</span>
                <span>{formatAmount(calculateTax())}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 font-sans font-bold text-lg text-neutral-900 dark:text-white">
                <span>Grand Total:</span>
                <span>{formatAmount(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            Thank you for working with AK STAR DIGITAL! Our team is dedicated to bringing your visuals to life.
          </div>
        </div>
      </div>
    </div>
  );
}
