import React, { Component, ReactNode } from 'react';
import { performanceMonitor } from '@/utils/performance';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Production-ready error boundary with performance monitoring
 * Prevents app crashes and provides graceful fallbacks
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Track error in performance monitoring
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.logMetrics();
    }

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.log(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-neutral-200 p-6 text-center">
              <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
              <h2 className="font-besley text-xl font-medium text-neutral-900 mb-2">
                Something went wrong
              </h2>
              <p className="font-outfit text-sm text-neutral-600 mb-4">
                We apologize for the inconvenience. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-outfit font-medium text-sm px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;