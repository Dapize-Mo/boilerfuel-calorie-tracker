import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggleButton from './ThemeToggleButton';
import SkipToContent from './SkipToContent';
import { useMeals } from '../context/MealContext';

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
      title={label}
      className="flex items-center gap-1.5 text-xs text-theme-text-tertiary px-2"
    >
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
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

      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggleButton />
      </div>
    </>
  );
}

const TopNav = memo(function TopNav() {
  const router = useRouter();
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
    { href: '/changelog', label: 'Changelog', icon: '📝' },
    { href: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-theme-border-secondary bg-theme-bg-secondary/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-theme-text-primary hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-900">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
            </div>
            <span className="tracking-tight hidden sm:inline">BoilerFuel</span>
          </Link>

          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] flex items-center justify-center sm:justify-start ${
                    router.pathname === item.href
                      ? 'bg-theme-accent text-white'
                      : 'text-theme-text-secondary hover:bg-theme-bg-hover'
                  }`}
                >
                  <span className="sm:mr-1">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            <SyncIndicator />

            {/* Profile button */}
            <Link
              href="/profile"
              className={`ml-2 p-2 rounded-full transition-colors ${
                router.pathname === '/profile'
                  ? 'bg-theme-accent text-white'
                  : 'text-theme-text-secondary hover:bg-theme-bg-hover'
              }`}
              title="Profile"
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
    <footer className="border-t border-theme-border-secondary mt-auto bg-theme-bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-xs text-theme-text-tertiary flex flex-wrap items-center justify-between gap-3">
        <p>
          Your data stays on this device. No accounts required.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-yellow-400 transition-colors">About</Link>
          <Link href="/changelog" className="hover:text-yellow-400 transition-colors">Changelog</Link>
          <Link href="/admin" className="hover:text-yellow-400 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
});
