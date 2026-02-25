/**
 * Sentry error tracking integration.
 *
 * To enable Sentry, set the NEXT_PUBLIC_SENTRY_DSN environment variable.
 * Without a DSN, all Sentry calls are no-ops, so the app works fine without it.
 *
 * Usage:
 *   import { captureException, captureMessage, setUser } from '../utils/sentry';
 *   captureException(error);
 *   captureMessage('something happened');
 *   setUser({ id: '123', email: 'user@example.com' });
 */

let sentryInstance = null;
let initialized = false;

/**
 * Initialize Sentry. Called once from _app.js on mount.
 * Loads the Sentry SDK lazily to avoid blocking initial render.
 */
export async function initSentry() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Sentry] No DSN configured — error tracking disabled');
    }
    return;
  }

  try {
    const Sentry = await import(/* webpackIgnore: true */ '@sentry/nextjs');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
      integrations: [],
      // Don't send PII unless explicitly set
      sendDefaultPii: false,
      // Ignore common non-actionable errors
      ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error promise rejection captured',
        'AbortError',
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'ChunkLoadError',
      ],
      beforeSend(event) {
        // Strip any localStorage data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.filter(
            b => !(b.category === 'console' && b.message?.includes('localStorage'))
          );
        }
        return event;
      },
    });
    sentryInstance = Sentry;
    // Expose globally for ErrorBoundary
    if (typeof window !== 'undefined') {
      window.Sentry = Sentry;
    }
  } catch (err) {
    console.warn('[Sentry] Failed to load:', err.message);
  }
}

/** Capture an exception */
export function captureException(error, context) {
  if (sentryInstance) {
    sentryInstance.captureException(error, context ? { extra: context } : undefined);
  }
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry.captureException]', error, context);
  }
}

/** Capture a message */
export function captureMessage(message, level = 'info') {
  if (sentryInstance) {
    sentryInstance.captureMessage(message, level);
  }
}

/** Set user context */
export function setUser(user) {
  if (sentryInstance) {
    sentryInstance.setUser(user);
  }
}

/** Clear user context */
export function clearUser() {
  if (sentryInstance) {
    sentryInstance.setUser(null);
  }
}

/** Add breadcrumb for debugging */
export function addBreadcrumb(breadcrumb) {
  if (sentryInstance) {
    sentryInstance.addBreadcrumb(breadcrumb);
  }
}
