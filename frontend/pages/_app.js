import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../context/ThemeContext';
import { MealProvider } from '../context/MealContext';
import { SessionProvider } from "next-auth/react";
import InstallPrompt from '../components/InstallPrompt';
import OfflineIndicator from '../components/OfflineIndicator';
import Onboarding from '../components/Onboarding';
import NotificationManager from '../components/NotificationManager';
import ErrorBoundary from '../components/ErrorBoundary';
import { initSentry } from '../utils/sentry';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initialize Sentry error tracking (no-op if DSN not configured)
    initSentry();
    // Fade in on initial mount
    requestAnimationFrame(() => setDisplayChildren(true));

    // Register service worker with update detection
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Already a waiting worker (e.g. page was open during a previous update)
        if (registration.waiting) {
          setUpdateAvailable(true);
        }
        // Watch for a new worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      }).catch(() => {});
    }
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

  const applyUpdate = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        // Once the new SW activates, reload the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
        reg.waiting.postMessage('SKIP_WAITING');
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, []);

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
        <MealProvider>
          <ErrorBoundary>
          {/* Page content with fade */}
          <div style={{
            opacity: displayChildren && !transitioning ? 1 : 0,
            transition: `opacity 0.35s ${EASE}`,
          }}>
            {getLayout(<Component {...pageProps} />)}
          </div>

          <InstallPrompt />
          <OfflineIndicator />
          <Onboarding />
          <NotificationManager />

          {/* App update toast */}
          {updateAvailable && (
            <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
              <div className="flex items-center gap-3 bg-theme-bg-secondary border border-theme-border-secondary rounded-xl shadow-2xl px-4 py-3 pointer-events-auto max-w-sm w-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-text-primary">Update available</p>
                  <p className="text-xs text-theme-text-tertiary">Reload to get the latest version.</p>
                </div>
                <button
                  onClick={applyUpdate}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-bold transition-colors"
                >
                  Reload
                </button>
                <button
                  onClick={() => setUpdateAvailable(false)}
                  aria-label="Dismiss"
                  className="shrink-0 p-1 rounded text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          </ErrorBoundary>

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
        </MealProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
