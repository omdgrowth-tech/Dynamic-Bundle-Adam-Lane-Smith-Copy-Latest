import { CartLine, Totals } from '@/types/bundle';
import { storage, STORAGE_KEYS } from './localStorage';

export interface PersistedCartState {
  selectedSkus: string[];
  giftSkus: string[];
  oneTimeOfferSkus: string[];
  timestamp: number;
}

export interface PersistedContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  streetAddress?: string;
  state?: string;
  zipCode?: string;
  newsletter?: boolean;
  smsConsent?: boolean;
  timestamp: number;
}

// Cart persistence utilities
export const cartPersistence = {
  /**
   * Save cart state to localStorage
   */
  saveCart: (selectedSkus: string[], giftSkus: string[] = [], oneTimeOfferSkus: string[] = []): void => {
    const cartState: PersistedCartState = {
      selectedSkus,
      giftSkus,
      oneTimeOfferSkus,
      timestamp: Date.now()
    };
    
    storage.setItem(STORAGE_KEYS.CART_STATE, cartState);
  },

  /**
   * Load cart state from localStorage
   */
  loadCart: (): PersistedCartState | null => {
    const stored = storage.getItem<PersistedCartState | null>(STORAGE_KEYS.CART_STATE, null);
    
    // Return cart if it's less than 7 days old
    if (stored && stored.timestamp && Date.now() - stored.timestamp < 7 * 24 * 60 * 60 * 1000) {
      return stored;
    }
    
    // Clean up old cart data
    if (stored) {
      storage.removeItem(STORAGE_KEYS.CART_STATE);
    }
    
    return null;
  },

  /**
   * Clear cart from localStorage
   */
  clearCart: (): void => {
    storage.removeItem(STORAGE_KEYS.CART_STATE);
  }
};

// Contact info persistence utilities
export const contactPersistence = {
  /**
   * Save contact info to localStorage
   */
  saveContact: (contactInfo: Partial<PersistedContactInfo>): void => {
    const existingContact = contactPersistence.loadContact();
    
    const updatedContact: PersistedContactInfo = {
      ...existingContact,
      ...contactInfo,
      timestamp: Date.now()
    };
    
    storage.setItem(STORAGE_KEYS.CONTACT_INFO, updatedContact);
  },

  /**
   * Load contact info from localStorage
   */
  loadContact: (): PersistedContactInfo | null => {
    const stored = storage.getItem<PersistedContactInfo | null>(STORAGE_KEYS.CONTACT_INFO, null);
    
    // Return contact info if it's less than 90 days old
    if (stored && stored.timestamp && Date.now() - stored.timestamp < 90 * 24 * 60 * 60 * 1000) {
      return stored;
    }
    
    // Clean up old contact data
    if (stored) {
      storage.removeItem(STORAGE_KEYS.CONTACT_INFO);
    }
    
    return null;
  },

  /**
   * Clear contact info from localStorage
   */
  clearContact: (): void => {
    storage.removeItem(STORAGE_KEYS.CONTACT_INFO);
  },

  /**
   * Update specific contact field
   */
  updateContactField: <K extends keyof PersistedContactInfo>(
    field: K, 
    value: PersistedContactInfo[K]
  ): void => {
    const existing = contactPersistence.loadContact() || { timestamp: Date.now() };
    contactPersistence.saveContact({
      ...existing,
      [field]: value
    });
  }
};

// Utility to check if cart has items
export const hasPersistedCart = (): boolean => {
  const cart = cartPersistence.loadCart();
  return !!(cart && cart.selectedSkus.length > 0);
};

// Utility to check if contact info exists
export const hasPersistedContact = (): boolean => {
  const contact = contactPersistence.loadContact();
  return !!(contact && (contact.email || contact.firstName));
};