import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import { ThemeProvider } from '../utils/ThemeContext';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Set lang attribute on html element
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
