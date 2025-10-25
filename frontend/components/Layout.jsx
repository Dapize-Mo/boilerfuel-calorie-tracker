import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

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
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary antialiased">
      <Header open={open} setOpen={setOpen} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header({ open, setOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-theme-border-secondary bg-theme-header-bg backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 font-bold text-yellow-400 hover:text-yellow-300 transition-colors group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg group-hover:shadow-yellow-400/50 transition-shadow">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-slate-900"
              >
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
            </div>
            <span className="text-lg tracking-tight">BoilerFuel</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <HeaderLink href="/">Home</HeaderLink>
            <HeaderLink href="/food-dashboard">Food</HeaderLink>
            <HeaderLink href="/gym">Gym</HeaderLink>
            <HeaderLink href="/about">About</HeaderLink>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ProfileMenu />
            </div>
          </nav>

          <button
            aria-label="Toggle menu"
            className="lg:hidden inline-flex items-center justify-center rounded-md border border-theme-border-primary bg-theme-bg-secondary/50 p-2 text-theme-text-primary hover:bg-theme-bg-hover/50 transition"
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-theme-border-secondary bg-theme-bg-secondary/90 lg:hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid gap-2 text-sm">
              <MobileLink href="/" onClick={() => setOpen(false)}>Home</MobileLink>
              <MobileLink href="/food-dashboard" onClick={() => setOpen(false)}>Food</MobileLink>
              <MobileLink href="/gym" onClick={() => setOpen(false)}>Gym</MobileLink>
              <MobileLink href="/about" onClick={() => setOpen(false)}>About</MobileLink>
              <div className="px-3 py-2 flex items-center gap-3">
                <ThemeToggle />
                <MobileProfileLinks />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function HeaderLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-theme-text-secondary hover:text-theme-accent-hover transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-md px-3 py-2 text-theme-text-primary hover:text-theme-accent-hover hover:bg-theme-bg-hover/50 transition"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-theme-border-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-theme-text-tertiary flex flex-wrap items-center justify-between gap-3">
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

function ProfileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-theme-border-primary bg-theme-bg-secondary/70 text-theme-text-primary hover:bg-theme-bg-hover/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/60"
      >
        <span className="sr-only">Open profile menu</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M12 2.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zM4.5 20.25a7.5 7.5 0 0115 0 .75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-theme-border-primary bg-theme-bg-secondary shadow-soft p-1 z-50">
          <div className="px-3 py-2">
            <p className="text-xs text-theme-text-tertiary">Signed out</p>
          </div>
          <MenuItem href="#" onClick={() => setOpen(false)}>Profile (coming soon)</MenuItem>
          <MenuItem href="#" onClick={() => setOpen(false)}>Settings (coming soon)</MenuItem>
          <div className="my-1 h-px bg-theme-border-primary/60" />
          <MenuItem href="#" onClick={() => setOpen(false)}>
            <span className="text-theme-accent">Sign in</span>
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-md px-3 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover/60 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileProfileLinks() {
  return (
    <div className="flex items-center gap-2">
      <Link href="#" className="text-theme-text-secondary hover:text-theme-text-primary text-sm">Profile</Link>
      <span className="text-theme-text-tertiary">•</span>
      <Link href="#" className="text-theme-text-secondary hover:text-theme-text-primary text-sm">Settings (coming soon)</Link>
      <span className="text-theme-text-tertiary">•</span>
      <Link href="#" className="text-theme-text-secondary hover:text-theme-text-primary text-sm">Sign in</Link>
    </div>
  );
}
