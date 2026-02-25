/**
 * Web Vitals reporting for BoilerFuel.
 *
 * Next.js automatically calls this exported function with Core Web Vitals
 * metrics when added to _app.js.
 *
 * Metrics reported:
 *   - CLS  (Cumulative Layout Shift)
 *   - FCP  (First Contentful Paint)
 *   - FID  (First Input Delay)
 *   - INP  (Interaction to Next Paint)
 *   - LCP  (Largest Contentful Paint)
 *   - TTFB (Time to First Byte)
 *
 * In development, metrics are logged to the console.
 * In production, they can be sent to an analytics endpoint.
 */
export function reportWebVitals(metric) {
  const { id, name, label, value } = metric;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${name}: ${Math.round(value * 100) / 100}ms (${label})`);
  }

  // Send to analytics endpoint if configured
  const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;
  if (analyticsUrl) {
    const body = JSON.stringify({ id, name, label, value });
    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsUrl, body);
    } else {
      fetch(analyticsUrl, { body, method: 'POST', keepalive: true }).catch(() => {});
    }
  }
}
