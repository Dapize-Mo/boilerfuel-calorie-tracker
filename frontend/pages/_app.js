import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import { ThemeProvider } from '../utils/ThemeContext';
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // Set lang attribute on html element
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  // Use the layout defined at the page level. Many pages already include
  // <Layout> directly, so the default should not double-wrap. Pages that
  // need a shared layout can export `getLayout`.
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent flash of unstyled content during theme initialization */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'system';
                let resolvedTheme = theme;
                if (theme === 'system') {
                  resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (resolvedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                // Add loaded class after a brief moment to enable transitions
                setTimeout(() => {
                  document.documentElement.classList.add('theme-loaded');
                }, 50);
              })();
            `,
          }}
        />
      </Head>
      <ThemeProvider>
        {getLayout(<Component {...pageProps} />)}
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
