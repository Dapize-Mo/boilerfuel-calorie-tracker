import React from 'react';
import Link from 'next/link';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send error to an error reporting service
    // For example, you could send to Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page or reset app state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono flex items-center justify-center px-6">
          <div className="max-w-2xl w-full space-y-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                className="text-red-500"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-wider">
                Oops! Something Went Wrong
              </h1>
              <p className="text-theme-text-secondary text-sm sm:text-base">
                We encountered an unexpected error. Don&apos;t worry — your data is safe in your browser.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-theme-bg-secondary border border-theme-text-primary/20 p-4 rounded text-xs">
                <summary className="cursor-pointer font-bold text-red-400 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="overflow-auto text-theme-text-tertiary whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-theme-text-primary text-theme-bg-primary font-bold uppercase text-sm tracking-wider hover:opacity-80 transition-opacity"
              >
                Reload Page
              </button>
              <Link
                href="/"
                className="px-6 py-3 border border-theme-text-primary text-theme-text-primary font-bold uppercase text-sm tracking-wider hover:bg-theme-bg-hover transition-colors"
              >
                Go Home
              </Link>
            </div>

            {/* Additional Help */}
            <div className="pt-8 border-t border-theme-text-primary/10">
              <p className="text-xs text-theme-text-tertiary">
                If this problem persists,{' '}
                <Link href="/about" className="underline hover:text-theme-text-primary">
                  contact us
                </Link>{' '}
                or try clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
