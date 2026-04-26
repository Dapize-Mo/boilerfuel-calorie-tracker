// CSRF protection via Origin/Referer header validation.
// Rejects cross-origin state-changing requests (POST, PUT, DELETE, PATCH).

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfCheck(req, res) {
  if (SAFE_METHODS.has(req.method)) return true;

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const host = req.headers['host'];

  if (!host) return true; // Can't validate without host

  // Allow requests from GitHub Actions / cron (no origin or referer)
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('vercel-cron') || req.headers['authorization']?.startsWith('Bearer ')) {
    // Server-to-server calls (cron, GitHub Actions) won't have origin headers
    if (!origin && !referer) return true;
  }

  // If origin is present, it must match the host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
      // Also allow localhost during development
      if (originHost.startsWith('localhost') && host.startsWith('localhost')) return true;
    } catch {
      // Invalid origin URL
    }
    res.status(403).json({ error: 'Cross-origin request blocked' });
    return false;
  }

  // Fall back to referer check
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
      if (refererHost.startsWith('localhost') && host.startsWith('localhost')) return true;
    } catch {
      // Invalid referer URL
    }
    res.status(403).json({ error: 'Cross-origin request blocked' });
    return false;
  }

  // No origin or referer on a state-changing request — allow it.
  // This handles same-origin fetch (browsers always send origin for cross-origin
  // but may omit it for same-origin), curl/Postman, and server-to-server.
  return true;
}
