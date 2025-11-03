// Payment Method Configuration System
// This file centralizes all payment method configurations for easy management

export interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  countries: string[]; // Empty array means all countries
  currencies: string[]; // Supported currencies
  enabled: boolean;
  priority: number; // Lower number = higher priority
  stripePaymentMethod?: string;
  external?: boolean; // For non-Stripe methods like PayPal
  minAmount?: number; // Minimum amount in cents
  maxAmount?: number; // Maximum amount in cents
}

// Comprehensive payment method configuration
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express, and more',
    countries: [], // Available worldwide
    currencies: ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'],
    enabled: true,
    priority: 1,
    stripePaymentMethod: 'card',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    description: 'Pay with Touch ID or Face ID',
    countries: [], // Available where Apple Pay is supported
    currencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],
    enabled: true,
    priority: 2,
    stripePaymentMethod: 'apple_pay',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    description: 'Pay with one tap using Google Pay',
    countries: [], // Available where Google Pay is supported
    currencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],
    enabled: true,
    priority: 2,
    stripePaymentMethod: 'google_pay',
  },
  {
    id: 'klarna',
    name: 'Klarna',
    description: 'Buy now, pay later in installments',
    countries: ['US', 'CA', 'GB', 'DE', 'AT', 'NL', 'BE', 'CH', 'DK', 'FI', 'NO', 'SE'],
    currencies: ['usd', 'eur', 'gbp', 'cad'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'klarna',
    minAmount: 1000, // $10 minimum for Klarna
  },
  {
    id: 'affirm',
    name: 'Affirm',
    description: 'Pay over time with flexible installments',
    countries: ['US', 'CA'],
    currencies: ['usd', 'cad'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'affirm',
    minAmount: 5000, // $50 minimum for Affirm
  },
  {
    id: 'cashapp',
    name: 'Cash App Pay',
    description: 'Pay instantly with Cash App',
    countries: ['US'],
    currencies: ['usd'],
    enabled: true,
    priority: 4,
    stripePaymentMethod: 'cashapp',
  },
  {
    id: 'sepa_debit',
    name: 'SEPA Direct Debit',
    description: 'Direct debit from your bank account',
    countries: ['DE', 'AT', 'NL', 'BE', 'CH', 'DK', 'FI', 'FR', 'IE', 'IT', 'LU', 'NO', 'PT', 'SE', 'ES'],
    currencies: ['eur'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'sepa_debit',
  },
  {
    id: 'ideal',
    name: 'iDEAL',
    description: 'Pay with your Dutch bank account',
    countries: ['NL'],
    currencies: ['eur'],
    enabled: true,
    priority: 2,
    stripePaymentMethod: 'ideal',
  },
  {
    id: 'sofort',
    name: 'Sofort',
    description: 'Instant bank transfers',
    countries: ['DE', 'AT'],
    currencies: ['eur'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'sofort',
  },
  {
    id: 'bancontact',
    name: 'Bancontact',
    description: 'Popular payment method in Belgium',
    countries: ['BE'],
    currencies: ['eur'],
    enabled: true,
    priority: 2,
    stripePaymentMethod: 'bancontact',
  },
  {
    id: 'giropay',
    name: 'Giropay',
    description: 'German online banking payment',
    countries: ['DE'],
    currencies: ['eur'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'giropay',
  },
  {
    id: 'p24',
    name: 'Przelewy24',
    description: 'Popular payment method in Poland',
    countries: ['PL'],
    currencies: ['eur', 'pln'],
    enabled: true,
    priority: 3,
    stripePaymentMethod: 'p24',
  },
  // Future payment methods (currently disabled)
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    countries: [], // Available worldwide
    currencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],
    enabled: false, // Disabled for now, can be enabled when implemented
    priority: 2,
    external: true, // Indicates this is not a Stripe payment method
  },
  {
    id: 'amazon_pay',
    name: 'Amazon Pay',
    description: 'Pay with your Amazon account',
    countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'LU', 'AT', 'BE', 'CY', 'IE', 'NL', 'PT'],
    currencies: ['usd', 'eur', 'gbp'],
    enabled: false,
    priority: 3,
    external: true,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Pay with Bitcoin, Ethereum, and more',
    countries: [], // Available in supported regions
    currencies: ['usd', 'eur'],
    enabled: false,
    priority: 5,
    external: true,
  },
];

// Helper function to get available payment methods for a country and currency
export const getAvailablePaymentMethods = (
  country: string, 
  currency: string = 'usd',
  amount?: number
): PaymentMethodConfig[] => {
  return PAYMENT_METHODS
    .filter(method => {
      // Check if method is enabled
      if (!method.enabled) return false;
      
      // Check if currency is supported
      if (!method.currencies.includes(currency.toLowerCase())) return false;
      
      // Check if country is supported (empty array means all countries)
      if (method.countries.length > 0 && !method.countries.includes(country.toUpperCase())) return false;
      
      // Check amount limits if specified
      if (amount !== undefined) {
        if (method.minAmount && amount < method.minAmount) return false;
        if (method.maxAmount && amount > method.maxAmount) return false;
      }
      
      return true;
    })
    .sort((a, b) => a.priority - b.priority);
};

// Helper function to get Stripe payment method order
export const getStripePaymentMethodOrder = (
  country: string, 
  currency: string = 'usd',
  amount?: number
): string[] => {
  return getAvailablePaymentMethods(country, currency, amount)
    .filter(method => method.stripePaymentMethod && !method.external)
    .map(method => method.stripePaymentMethod!)
    .filter(Boolean);
};

// Helper function to get external payment methods
export const getExternalPaymentMethods = (
  country: string, 
  currency: string = 'usd',
  amount?: number
): PaymentMethodConfig[] => {
  return getAvailablePaymentMethods(country, currency, amount)
    .filter(method => method.external && method.enabled);
};

// Helper function to get payment method by ID
export const getPaymentMethodById = (id: string): PaymentMethodConfig | undefined => {
  return PAYMENT_METHODS.find(method => method.id === id);
};

// Function to enable/disable payment methods (for admin use)
export const togglePaymentMethod = (id: string, enabled: boolean): boolean => {
  const method = PAYMENT_METHODS.find(m => m.id === id);
  if (method) {
    method.enabled = enabled;
    return true;
  }
  return false;
};

// Country-specific currency mapping
export const getDefaultCurrencyForCountry = (country: string): string => {
  const currencyMap: Record<string, string> = {
    'US': 'usd',
    'CA': 'cad',
    'GB': 'gbp',
    'DE': 'eur',
    'FR': 'eur',
    'IT': 'eur',
    'ES': 'eur',
    'NL': 'eur',
    'BE': 'eur',
    'AT': 'eur',
    'CH': 'chf',
    'AU': 'aud',
    'JP': 'jpy',
    'PL': 'pln',
    'DK': 'dkk',
    'SE': 'sek',
    'NO': 'nok',
  };
  
  return currencyMap[country.toUpperCase()] || 'usd';
};