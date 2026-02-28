import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boilerfuel.vercel.app';

  return (
    <Html lang="en">
      <Head>
        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://world.openfoodfacts.org" />
        <link rel="dns-prefetch" href="https://world.openfoodfacts.org" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Global SEO defaults (overridden per-page) */}
        <meta name="keywords" content="Purdue, calorie tracker, nutrition, fitness, dining halls, macros, health, Boilermaker" />
        <meta name="author" content="BoilerFuel" />
        <meta name="theme-color" content="#0a0a0a" />

        {/* Open Graph defaults — pages override og:title, og:description, og:url */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BoilerFuel" />
        <meta property="og:image" content={`${siteUrl}/icons/icon-512x512.png`} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="BoilerFuel logo" />

        {/* Twitter / X card defaults */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={`${siteUrl}/icons/icon-512x512.png`} />

        {/* PWA-like experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BoilerFuel" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#0a0a0a" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
