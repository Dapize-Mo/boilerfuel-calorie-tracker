import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
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
        <meta name="theme-color" content="#f59e0b" />
        
        {/* PWA-like experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BoilerFuel" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
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
