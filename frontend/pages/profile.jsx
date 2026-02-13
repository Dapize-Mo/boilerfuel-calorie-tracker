import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <Head>
        <title>Profile - BoilerFuel</title>
        <meta name="description" content="BoilerFuel preferences" />
      </Head>

      <div
        className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono"
        style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-16">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Profile</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Preferences
            </p>
          </header>

          {/* Theme Toggle */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Appearance
            </h2>

            <div className="border border-theme-text-primary/20">
              <button
                onClick={() => setTheme('light')}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                  theme === 'light' ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <div className="text-left">
                    <span className="text-sm font-bold uppercase tracking-wider block">Light</span>
                    <span className={`text-xs ${theme === 'light' ? 'opacity-60' : 'text-theme-text-tertiary'}`}>Bright background, dark text</span>
                  </div>
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] uppercase tracking-widest font-bold">Active</span>
                )}
              </button>

              <div className="h-px bg-theme-text-primary/10" />

              <button
                onClick={() => setTheme('dark')}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                  theme === 'dark' ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <div className="text-left">
                    <span className="text-sm font-bold uppercase tracking-wider block">Dark</span>
                    <span className={`text-xs ${theme === 'dark' ? 'opacity-60' : 'text-theme-text-tertiary'}`}>Dark background, light text</span>
                  </div>
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] uppercase tracking-widest font-bold">Active</span>
                )}
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
            </div>
            <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

ProfilePage.getLayout = (page) => page;
