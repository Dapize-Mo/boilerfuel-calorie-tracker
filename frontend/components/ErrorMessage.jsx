/**
 * ErrorMessage — Contextual, user-friendly error display for API/fetch failures.
 * Replaces generic "Could not load foods" with actionable guidance.
 */

const ERROR_HINTS = {
  network: {
    title: 'Connection issue',
    message: 'Unable to reach the server. Check your internet connection and try again.',
    icon: 'wifi',
  },
  timeout: {
    title: 'Request timed out',
    message: 'The server took too long to respond. This usually resolves itself — try again in a moment.',
    icon: 'clock',
  },
  server: {
    title: 'Server error',
    message: 'Something went wrong on our end. The team has been notified. Try again shortly.',
    icon: 'server',
  },
  notFound: {
    title: 'No data found',
    message: 'No menu items were found for this selection. Try a different date, location, or meal time.',
    icon: 'search',
  },
  offline: {
    title: 'You are offline',
    message: 'Showing cached data. Some features may be limited until you reconnect.',
    icon: 'wifi-off',
  },
  auth: {
    title: 'Session expired',
    message: 'Your session has expired. Please sign in again.',
    icon: 'lock',
  },
  unknown: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    icon: 'alert',
  },
};

function classifyError(error) {
  if (!error) return 'unknown';
  const msg = typeof error === 'string' ? error : error.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('offline') || lower.includes('cached')) return 'offline';
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch') || lower.includes('err_internet')) return 'network';
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) return 'timeout';
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('session')) return 'auth';
  if (lower.includes('404') || lower.includes('not found') || lower.includes('no ') || lower.includes('empty')) return 'notFound';
  if (lower.includes('500') || lower.includes('server') || lower.includes('internal')) return 'server';
  return 'unknown';
}

const icons = {
  wifi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  'wifi-off': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0119 12.55" /><path d="M5 12.55a10.94 10.94 0 015.17-2.39" /><path d="M10.71 5.05A16 16 0 0122.56 9" /><path d="M1.42 9a15.91 15.91 0 014.7-2.88" /><path d="M8.53 16.11a6 6 0 016.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  server: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export default function ErrorMessage({ error, onRetry, onDismiss, className = '' }) {
  const type = classifyError(error);
  const hint = ERROR_HINTS[type];
  const isWarning = type === 'offline' || type === 'notFound';

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 border text-sm ${
        isWarning
          ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400'
          : 'border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400'
      } ${className}`}
    >
      <span className="shrink-0 mt-0.5 opacity-70">{icons[hint.icon]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{hint.title}</p>
        <p className="text-xs mt-0.5 opacity-80">{hint.message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
