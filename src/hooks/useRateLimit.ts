import { useState, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs?: number;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  isBlocked: boolean;
  nextAllowedTime?: number;
}

/**
 * Custom hook for client-side rate limiting to prevent payment spam
 * Note: This is a basic client-side protection and should be supplemented with server-side rate limiting
 */
export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>(() => {
    // Load state from localStorage if available
    const stored = localStorage.getItem(`rateLimit_${key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Reset if window has expired
        if (now - parsed.windowStart > config.windowMs) {
          return { attempts: 0, windowStart: now, isBlocked: false };
        }
        
        // Check if still in cooldown
        if (parsed.nextAllowedTime && now < parsed.nextAllowedTime) {
          return { ...parsed, isBlocked: true };
        }
        
        return { ...parsed, isBlocked: false };
      } catch {
        return { attempts: 0, windowStart: Date.now(), isBlocked: false };
      }
    }
    
    return { attempts: 0, windowStart: Date.now(), isBlocked: false };
  });

  const canProceed = useCallback(() => {
    const now = Date.now();
    
    // Check if still in cooldown
    if (state.nextAllowedTime && now < state.nextAllowedTime) {
      return false;
    }
    
    // Reset window if expired
    if (now - state.windowStart > config.windowMs) {
      const newState = { attempts: 0, windowStart: now, isBlocked: false };
      setState(newState);
      localStorage.setItem(`rateLimit_${key}`, JSON.stringify(newState));
      return true;
    }
    
    // Check if within limits
    return state.attempts < config.maxAttempts;
  }, [state, config, key]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    let newState: RateLimitState;
    
    // Reset window if expired
    if (now - state.windowStart > config.windowMs) {
      newState = { 
        attempts: 1, 
        windowStart: now, 
        isBlocked: false 
      };
    } else {
      const newAttempts = state.attempts + 1;
      const exceedsLimit = newAttempts >= config.maxAttempts;
      
      newState = {
        attempts: newAttempts,
        windowStart: state.windowStart,
        isBlocked: exceedsLimit,
        nextAllowedTime: exceedsLimit && config.cooldownMs 
          ? now + config.cooldownMs 
          : undefined
      };
    }
    
    setState(newState);
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(newState));
    
    return !newState.isBlocked;
  }, [state, config, key]);

  const getRemainingTime = useCallback(() => {
    if (!state.nextAllowedTime) return 0;
    return Math.max(0, state.nextAllowedTime - Date.now());
  }, [state.nextAllowedTime]);

  const reset = useCallback(() => {
    const newState = { attempts: 0, windowStart: Date.now(), isBlocked: false };
    setState(newState);
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(newState));
  }, [key]);

  return {
    canProceed: canProceed(),
    recordAttempt,
    getRemainingTime,
    reset,
    attemptsRemaining: Math.max(0, config.maxAttempts - state.attempts),
    isBlocked: state.isBlocked
  };
};