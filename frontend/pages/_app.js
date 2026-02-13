import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider } from "next-auth/react";

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(false);

  useEffect(() => {
    // Fade in on initial mount
    requestAnimationFrame(() => setDisplayChildren(true));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  // Listen for route changes to trigger transitions
  useEffect(() => {
    const handleStart = () => setTransitioning(true);
    const handleComplete = () => {
      // Small delay to let the overlay fully cover before revealing new page
      setTimeout(() => {
        setTransitioning(false);
      }, 50);
    };
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                setTimeout(() => {
                  document.documentElement.classList.add('theme-loaded');
                }, 50);
              })();
            `,
          }}
        />
      </Head>
      <ThemeProvider>
        {/* Page content with fade */}
        <div style={{
          opacity: displayChildren && !transitioning ? 1 : 0,
          transition: `opacity 0.35s ${EASE}`,
        }}>
          {getLayout(<Component {...pageProps} />)}
        </div>
        {/* Transition overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgb(var(--color-bg-primary))',
            opacity: transitioning ? 1 : 0,
            pointerEvents: transitioning ? 'all' : 'none',
            transition: `opacity 0.35s ${EASE}`,
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
