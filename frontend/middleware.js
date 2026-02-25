import { NextResponse } from 'next/server';

/**
 * Next.js middleware — adds security headers to all responses.
 */
export function middleware(request) {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy — send origin only for cross-origin requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — disable unused browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security (HTTPS only, 1 year)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Basic Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com https://*.sentry.io",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files, images, and Next.js internals
    '/((?!_next/static|_next/image|favicon|icons|sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
  ],
};
