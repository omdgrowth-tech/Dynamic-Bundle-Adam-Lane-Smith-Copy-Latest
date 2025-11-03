/**
 * Safe localStorage utilities with error handling and fallbacks
 */

export const storage = {
  /**
   * Safely get an item from localStorage
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set an item in localStorage
   */
  setItem: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage items with a specific prefix
   */
  clearPrefix: (prefix: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          window.localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn(`Error clearing localStorage prefix "${prefix}":`, error);
      return false;
    }
  }
};

// Storage keys
export const STORAGE_KEYS = {
  UTM_PARAMS: 'als_utm_params',
  CART_STATE: 'als_cart_state',
  CONTACT_INFO: 'als_contact_info',
  USER_PREFERENCES: 'als_user_preferences'
} as const;