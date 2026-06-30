export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥'
};

export const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.50,
  CAD: 1.37,
  JPY: 155.0
};

// Map of currencies to their names for nice displays
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'USD (United States Dollar)',
  INR: 'INR (Indian Rupee)',
  EUR: 'EUR (Euro)',
  GBP: 'GBP (British Pound)',
  AUD: 'AUD (Australian Dollar)',
  CAD: 'CAD (Canadian Dollar)',
  JPY: 'JPY (Japanese Yen)'
};

export async function detectUserCurrency(): Promise<string> {
  try {
    // Try freeipapi.com (HTTPS, free, fast, CORS-enabled)
    const res = await fetch('https://freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      if (data.currency?.code && CURRENCY_SYMBOLS[data.currency.code]) {
        return data.currency.code;
      }
    }
  } catch (e) {
    console.warn('First IP location API failed, trying fallback...', e);
  }
  
  try {
    // Try ipapi.co as second choice
    const res2 = await fetch('https://ipapi.co/json/');
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.currency && CURRENCY_SYMBOLS[data2.currency]) {
        return data2.currency;
      }
    }
  } catch (e) {
    console.warn('Second IP location API failed', e);
  }

  // Fallback 3: Guess from browser settings (timezone, language)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('Asia/Kolkata') || tz.includes('India')) {
        return 'INR';
      }
      if (tz.includes('Europe/')) {
        return 'EUR';
      }
      if (tz.includes('London') || tz.includes('Europe/London')) {
        return 'GBP';
      }
      if (tz.includes('Australia/') || tz.includes('Sydney') || tz.includes('Melbourne')) {
        return 'AUD';
      }
      if (tz.includes('America/Toronto') || tz.includes('America/Vancouver') || tz.includes('Canada')) {
        return 'CAD';
      }
      if (tz.includes('Asia/Tokyo') || tz.includes('Tokyo')) {
        return 'JPY';
      }
    }
    const lang = navigator.language || '';
    if (lang.includes('IN') || lang.startsWith('hi')) return 'INR';
    if (lang.includes('GB')) return 'GBP';
    if (lang.includes('AU')) return 'AUD';
    if (lang.includes('CA')) return 'CAD';
    if (lang.includes('JP')) return 'JPY';
  } catch (e) {
    console.warn('Browser environment currency guess failed', e);
  }

  return 'USD';
}

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const rates: Record<string, number> = { ...DEFAULT_RATES };
        Object.keys(DEFAULT_RATES).forEach(code => {
          if (data.rates[code]) {
            rates[code] = data.rates[code];
          }
        });
        localStorage.setItem('cached_rates', JSON.stringify(rates));
        return rates;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch exchange rates, using defaults/cached', e);
  }
  
  const cached = localStorage.getItem('cached_rates');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return DEFAULT_RATES;
}

export function convertUSD(priceUSD: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] || DEFAULT_RATES[currency] || 1;
  return Number((priceUSD * rate).toFixed(2));
}

export function formatConvertedPrice(convertedPrice: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  if (currency === 'JPY') {
    return `${symbol}${Math.round(convertedPrice).toLocaleString()}`;
  }
  return `${symbol}${convertedPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatPrice(priceUSD: number, currency: string, rates: Record<string, number>): string {
  const converted = convertUSD(priceUSD, currency, rates);
  return formatConvertedPrice(converted, currency);
}
