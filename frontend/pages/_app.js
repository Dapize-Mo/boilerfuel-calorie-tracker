import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
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
        {getLayout(<Component {...pageProps} />)}
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
