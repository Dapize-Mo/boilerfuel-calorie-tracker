import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggleButton from './ThemeToggleButton';
import SkipToContent from './SkipToContent';
import { useMeals } from '../context/MealContext';

// Brutalist app shell. Black/white + one yellow, hairline rules, heavy Inter
// caps for the wordmark, monospace uppercase nav. No emoji, no gradients, no
// rounded pills, no soft shadows — square edges only. Pairs with the brutalist
// base in styles/globals.css.

function SyncIndicator() {
  const { syncStatus } = useMeals();
  if (syncStatus === 'idle') return null;
  const label = syncStatus === 'syncing' ? 'SYNCING' : syncStatus === 'success' ? 'SYNCED' : 'SYNC ERR';
  const dot =
    syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
    syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div title={label} className="flex items-center gap-1.5 px-2 font-mono text-[10px] tracking-[0.16em] text-theme-text-tertiary">
      <span className={`w-2 h-2 ${dot}`} />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <>
      <SkipToContent />
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary antialiased flex flex-col">
        <TopNav />
        <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {children}
        </main>
        <Footer />
      </div>
      <div className="fixed right-6 z-50" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
        <ThemeToggleButton />
      </div>
    </>
  );
}

const TopNav = memo(function TopNav() {
  const router = useRouter();
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/database', label: 'Database' },
    { href: '/about', label: 'About' },
    { href: '/changelog', label: 'Log' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-theme-text-primary bg-theme-bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center bg-theme-accent text-slate-900 font-black text-sm tracking-tight">
              BF
            </span>
            <span className="hidden sm:inline font-black tracking-tight text-lg uppercase text-theme-text-primary">
              BoilerFuel
            </span>
          </Link>

          <div className="flex items-center">
            <nav aria-label="Main navigation" className="flex items-center border border-theme-text-primary">
              {navItems.map((item, i) => {
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`px-3 sm:px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] min-h-[44px] flex items-center transition-colors ${i ? 'border-l border-theme-text-primary' : ''} ${
                      active
                        ? 'bg-theme-accent text-slate-900 font-bold'
                        : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <SyncIndicator />

            <Link
              href="/profile"
              title="Profile"
              className={`ml-2 h-11 w-11 flex items-center justify-center border border-theme-text-primary transition-colors ${
                router.pathname === '/profile' ? 'bg-theme-accent text-slate-900' : 'text-theme-text-secondary hover:bg-theme-bg-hover'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-theme-text-primary mt-auto bg-theme-bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-safe font-mono text-[10px] uppercase tracking-[0.12em] text-theme-text-tertiary flex flex-wrap items-center justify-between gap-3">
        <p>Your data stays on this device · No accounts</p>
        <div className="flex items-center gap-5">
          <Link href="/about" className="hover:text-theme-text-primary transition-colors py-1">About</Link>
          <Link href="/changelog" className="hover:text-theme-text-primary transition-colors py-1">Changelog</Link>
          <Link href="/privacy" className="hover:text-theme-text-primary transition-colors py-1">Privacy</Link>
          <Link href="/admin" className="hover:text-theme-text-primary transition-colors py-1">Admin</Link>
        </div>
      </div>
    </footer>
  );
});
