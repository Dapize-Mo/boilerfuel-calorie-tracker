import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Performance optimizations */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        
        {/* SEO meta tags */}
        <meta name="description" content="Track your calories and macros with BoilerFuel - the calorie tracker for Purdue students" />
        <meta name="theme-color" content="#eab308" />
        
        {/* PWA-like experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BoilerFuel" />
        
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
