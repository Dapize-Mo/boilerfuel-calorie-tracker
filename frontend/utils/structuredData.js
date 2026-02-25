// JSON-LD structured data generators for SEO.
// Each function returns a plain object suitable for JSON.stringify() inside a <script> tag.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

/**
 * WebApplication schema for BoilerFuel.
 * Tells search engines this is a free health/nutrition web app.
 */
export function getWebAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BoilerFuel',
    description:
      'Free nutrition tracker for Purdue University students. Track calories and macros from campus dining halls and restaurants — no account required.',
    url: siteUrl,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

/**
 * BreadcrumbList schema.
 * @param {Array<{ name: string, url: string }>} items - Ordered breadcrumb items.
 *   Each item should have a `name` (display label) and `url` (full or relative path).
 */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

/**
 * FAQPage schema — useful for the About page.
 * @param {Array<{ question: string, answer: string }>} faqs
 */
export function getFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
