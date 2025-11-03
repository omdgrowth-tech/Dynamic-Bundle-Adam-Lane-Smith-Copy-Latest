import React from 'react';

/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and component performance
 */

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};

  constructor() {
    this.initPerformanceObserver();
  }

  private initPerformanceObserver() {
    if (typeof window === 'undefined') return;

    try {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.lcp = entry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const perfEntry of list.getEntries()) {
          const eventEntry = perfEntry as PerformanceEventTiming;
          this.metrics.fid = eventEntry.processingStart - eventEntry.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as LayoutShiftEntry;
          if (!layoutEntry.hadRecentInput) {
            this.metrics.cls = (this.metrics.cls || 0) + layoutEntry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // Navigation timing
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logMetrics() {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.metrics);
    }
  }

  // Component performance tracking
  measureComponent(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} render time: ${(end - start).toFixed(2)}ms`);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React DevTools Profiler integration
export const withPerformanceProfiler = <T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) => {
  const ProfiledComponent = (props: T) => {
    return React.createElement(
      React.Profiler,
      {
        id: componentName,
        onRender: (id, phase, actualDuration) => {
          if (process.env.NODE_ENV === 'development' && actualDuration > 16) {
            console.warn(`${id} took ${actualDuration.toFixed(2)}ms to ${phase}`);
          }
        }
      },
      React.createElement(Component, props)
    );
  };

  ProfiledComponent.displayName = `withPerformanceProfiler(${componentName})`;
  return ProfiledComponent;
};

// Memory usage tracking
export const trackMemoryUsage = () => {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Memory usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
    });
  }
};

// Bundle size analysis
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsResources = resources.filter(r => r.name.includes('.js'));
  const cssResources = resources.filter(r => r.name.includes('.css'));

  const totalJSSize = jsResources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
  const totalCSSSize = cssResources.reduce((acc, r) => acc + (r.transferSize || 0), 0);

  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis:', {
      'Total JS': `${Math.round(totalJSSize / 1024)}KB`,
      'Total CSS': `${Math.round(totalCSSSize / 1024)}KB`,
      'JS Files': jsResources.length,
      'CSS Files': cssResources.length,
    });
  }
};