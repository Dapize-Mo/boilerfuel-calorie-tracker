import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggleButton from './ThemeToggleButton';
import SkipToContent from './SkipToContent';
import { useMeals } from '../context/MealContext';

// Shared app shell: monospace uppercase nav with hairline rules, matching the
// styling the individual pages already use (font-mono, uppercase tracking,
// theme-text-primary/10 borders). No emoji, no gradients, square edges.

function SyncIndicator() {
  const { syncStatus } = useMeals();
  if (syncStatus === 'idle') return null;

  const label = syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'success' ? 'Synced' : 'Sync error';
  const dotClass =
    syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
    syncStatus === 'success' ? 'bg-green-400' :
    'bg-red-400';

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="flex items-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-theme-text-tertiary"
    >
      <span className={`w-2 h-2 ${dotClass}`} aria-hidden="true" />
      <span className="hidden sm:inline" aria-hidden="true">{label}</span>
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
    { href: '/stats', label: 'Stats' },
    { href: '/tools', label: 'Tools' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-theme-text-primary/10 bg-theme-bg-secondary/90 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-theme-accent text-slate-900 font-black text-sm tracking-tight" aria-hidden="true">
              BF
            </span>
            <span className="hidden sm:inline font-black tracking-tight text-lg uppercase text-theme-text-primary">
              BoilerFuel
            </span>
          </Link>

          <div className="flex items-center">
            <nav aria-label="Main navigation" className="flex items-center border border-theme-text-primary/20">
              {navItems.map((item, i) => {
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`px-2 sm:px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] min-h-[44px] flex items-center transition-colors ${i ? 'border-l border-theme-text-primary/20' : ''} ${
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
              aria-current={router.pathname === '/profile' ? 'page' : undefined}
              className={`ml-2 h-11 w-11 flex items-center justify-center border border-theme-text-primary/20 transition-colors ${
                router.pathname === '/profile' ? 'bg-theme-accent text-slate-900' : 'text-theme-text-secondary hover:bg-theme-bg-hover'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
              <span className="sr-only">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-theme-text-primary/10 mt-auto bg-theme-bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-safe font-mono text-[10px] uppercase tracking-[0.12em] text-theme-text-tertiary flex flex-wrap items-center justify-between gap-3">
        <p>Your data stays on this device · No accounts required</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/compare" className="hover:text-theme-text-primary transition-colors py-1">Compare</Link>
          <Link href="/custom-foods" className="hover:text-theme-text-primary transition-colors py-1">Custom Foods</Link>
          <Link href="/about" className="hover:text-theme-text-primary transition-colors py-1">About</Link>
          <Link href="/changelog" className="hover:text-theme-text-primary transition-colors py-1">Changelog</Link>
          <Link href="/privacy" className="hover:text-theme-text-primary transition-colors py-1">Privacy</Link>
          <Link href="/admin" className="hover:text-theme-text-primary transition-colors py-1">Admin</Link>
        </div>
      </div>
    </footer>
  );
});
