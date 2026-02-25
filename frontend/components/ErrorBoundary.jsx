import { Component } from 'react';

/**
 * ErrorBoundary — Catches unhandled errors in the React component tree
 * and displays a user-friendly fallback UI instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    // If Sentry is configured, report the error
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary text-theme-text-primary p-6">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="text-4xl mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-theme-error">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-theme-text-secondary text-sm">
                An unexpected error occurred. Try refreshing the page.
              </p>
              {this.state.error?.message && (
                <details className="text-left mt-4 p-3 border border-theme-border-primary rounded bg-theme-bg-secondary text-xs">
                  <summary className="cursor-pointer text-theme-text-tertiary font-medium">
                    Error details
                  </summary>
                  <pre className="mt-2 text-theme-text-tertiary overflow-auto whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 border-2 border-theme-text-primary text-theme-text-primary font-bold uppercase text-sm tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
