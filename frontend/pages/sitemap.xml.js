const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://boilerfuel.vercel.app';

const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/about', changefreq: 'monthly', priority: '0.9' },
  { url: '/tools', changefreq: 'monthly', priority: '0.8' },
  { url: '/compare', changefreq: 'weekly', priority: '0.8' },
  { url: '/changelog', changefreq: 'weekly', priority: '0.7' },
  { url: '/privacy', changefreq: 'monthly', priority: '0.5' },
];

function generateSitemap(pages) {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(({ url, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export default function Sitemap() {
  // This page only serves XML, no React component needed
  return null;
}

export async function getServerSideProps({ res }) {
  try {
    const sitemap = generateSitemap(staticPages);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800');
    res.write(sitemap);
    res.end();
    
    return { props: {} };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.statusCode = 500;
    res.end();
    return { props: {} };
  }
}

