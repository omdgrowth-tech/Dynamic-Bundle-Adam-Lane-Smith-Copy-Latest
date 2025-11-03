import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/localStorage';

/**
 * Custom hook for persisted state using localStorage
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    expireAfter?: number; // milliseconds
  } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    expireAfter
  } = options;

  // Initialize state with persisted value or default
  const [state, setState] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return defaultValue;

      const stored = window.localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed = deserialize(stored);
      
      // Check expiration if specified
      if (expireAfter && parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
        const timestamp = (parsed as any).timestamp;
        if (Date.now() - timestamp > expireAfter) {
          storage.removeItem(key);
          return defaultValue;
        }
      }

      return parsed || defaultValue;
    } catch (error) {
      console.warn(`Error loading persisted state for key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update persisted state when state changes
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      let valueToStore = state;
      
      // Add timestamp if expiration is specified
      if (expireAfter && state && typeof state === 'object') {
        valueToStore = {
          ...state,
          timestamp: Date.now()
        } as T;
      }

      window.localStorage.setItem(key, serialize(valueToStore));
    } catch (error) {
      console.warn(`Error persisting state for key "${key}":`, error);
    }
  }, [key, state, serialize, expireAfter]);

  // Enhanced setState that supports function updates
  const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newState = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
      return newState;
    });
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    storage.removeItem(key);
    setState(defaultValue);
  }, [key, defaultValue]);

  return [state, setPersistedState, clearPersistedState];
}