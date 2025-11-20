import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import ThemeToggleButton from './ThemeToggleButton';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change hash or resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary antialiased flex">
      <Sidebar open={open} setOpen={setOpen} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-72 transition-all duration-300">
        <MobileHeader open={open} setOpen={setOpen} />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {children}
        </main>

        <Footer />
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggleButton />
      </div>
    </div>
  );
}

function MobileHeader({ open, setOpen }) {
  return (
    <header className="sticky top-0 z-30 lg:hidden border-b border-theme-border-secondary bg-theme-bg-secondary/80 backdrop-blur-md">
      <div className="px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-theme-text-primary">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-900">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
          </div>
          <span className="tracking-tight">BoilerFuel</span>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-theme-text-secondary hover:bg-theme-bg-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function Footer() {
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
}
