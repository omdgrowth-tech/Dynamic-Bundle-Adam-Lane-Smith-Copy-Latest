/**
 * Memory optimization utilities for better performance
 */

// Cleanup function for development memory leaks
export const cleanupMemory = () => {
  if (process.env.NODE_ENV === 'development') {
    // Force garbage collection in development (if available)
    if (window.gc) {
      window.gc();
    }
  }
};

// Image optimization utilities
export const getOptimizedImageUrl = (url: string, width?: number, quality = 85): string => {
  // For production, you could integrate with image optimization services
  // For now, return original URL
  return url;
};

// Memory-friendly array operations
export const createMemoizedArray = <T>(array: T[], sortFn?: (a: T, b: T) => number): T[] => {
  const result = array.slice(); // Shallow copy
  if (sortFn) {
    result.sort(sortFn);
  }
  return result;
};

// Debounced resize observer for performance
export const createResizeObserver = (callback: ResizeObserverCallback, debounceMs = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(entries, observer), debounceMs);
  };
  
  return new ResizeObserver(debouncedCallback);
};