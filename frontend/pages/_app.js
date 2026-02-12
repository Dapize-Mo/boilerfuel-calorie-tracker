import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider } from "next-auth/react";
import { DashboardProvider } from '../utils/DashboardContext';
import { SWRConfig } from 'swr';
import { ToastProvider } from '../components/ToastContainer';
import CommandPalette from '../components/CommandPalette';

// SWR configuration for optimized data fetching
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  focusThrottleInterval: 10000,
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  suspense: false,
  shouldRetryOnError: true,
  keepPreviousData: true,
};

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // Set lang attribute on html element
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  // Prefer per-page custom layout when provided. Otherwise, wrap with the
  // shared <Layout> so the header/footer appear across the site.
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

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
      <SWRConfig value={swrConfig}>
        <ThemeProvider>
          <ToastProvider>
            <DashboardProvider>
              <Component {...pageProps} />
              <CommandPalette />
            </DashboardProvider>
          </ToastProvider>
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}

export default MyApp;
