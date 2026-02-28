const SITE_URL = 'https://boilerfuel.vercel.app';

const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/compare', changefreq: 'weekly', priority: '0.8' },
  { url: '/about', changefreq: 'monthly', priority: '0.6' },
  { url: '/changelog', changefreq: 'weekly', priority: '0.5' },
  { url: '/privacy', changefreq: 'monthly', priority: '0.3' },
];

function generateSitemap(pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ url, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.write(generateSitemap(staticPages));
  res.end();
  return { props: {} };
}
