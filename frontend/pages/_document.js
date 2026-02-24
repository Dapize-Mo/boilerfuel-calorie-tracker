import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  return (
    <Html lang="en">
      <Head>
        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* SEO meta tags */}
        <meta name="description" content="Track your calories and macros with BoilerFuel - the calorie tracker for Purdue students" />
        <meta name="keywords" content="Purdue, calorie tracker, nutrition, fitness, dining halls, macros, health" />
        <meta name="theme-color" content="#0a0a0a" />

        {/* Open Graph / social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BoilerFuel" />
        <meta property="og:title" content="BoilerFuel — Nutrition Tracker for Purdue" />
        <meta property="og:description" content="Track calories & macros from Purdue dining halls and campus restaurants. Free, private, no account needed." />
        <meta property="og:image" content={`${siteUrl}/icons/icon-512x512.png`} />
        <meta property="og:url" content={siteUrl} />

        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="BoilerFuel — Nutrition Tracker for Purdue" />
        <meta name="twitter:description" content="Track calories & macros from Purdue dining halls and campus restaurants. Free, private, no account needed." />
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

        {/* Performance hints */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || ''} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
