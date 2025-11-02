import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
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
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary antialiased">
      <Header open={open} setOpen={setOpen} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
      <Footer />
      <ThemeToggleButton />
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
            <ProfileMenu />
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
              <div className="px-3 py-2">
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
      className="text-theme-text-secondary hover:text-theme-accent-hover transition-all duration-300 glow-yellow px-3 py-2 rounded-lg"
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
      className="block rounded-md px-3 py-2 text-theme-text-primary hover:text-theme-accent-hover hover:bg-theme-bg-hover/50 transition-all duration-300 glow-yellow"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-theme-border-secondary mt-16">
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

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSignIn = async () => {
    setOpen(false);
    await signIn('google');
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div className="relative">
      <button
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-theme-border-primary bg-theme-bg-secondary/70 text-theme-text-primary hover:bg-theme-bg-hover/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/60"
      >
        <span className="sr-only">Open profile menu</span>
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'Profile'}
            className="h-9 w-9 rounded-full"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M12 2.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zM4.5 20.25a7.5 7.5 0 0115 0 .75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-theme-border-primary bg-theme-bg-secondary shadow-soft p-1 z-50">
          {session?.user ? (
            <>
              <div className="px-3 py-2 border-b border-theme-border-primary/60">
                <p className="text-sm font-semibold text-theme-text-primary truncate">{session.user.name}</p>
                <p className="text-xs text-theme-text-tertiary truncate">{session.user.email}</p>
              </div>
              <MenuItem href="/profile" onClick={() => setOpen(false)}>Profile</MenuItem>
              <MenuItem href="/settings" onClick={() => setOpen(false)}>Settings</MenuItem>
              <div className="my-1 h-px bg-theme-border-primary/60" />
              <button
                onClick={handleSignOut}
                className="w-full text-left block rounded-md px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-theme-bg-hover/60 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2">
                <p className="text-xs text-theme-text-tertiary">Not signed in</p>
              </div>
              <MenuItem href="/profile" onClick={() => setOpen(false)}>Profile</MenuItem>
              <MenuItem href="/settings" onClick={() => setOpen(false)}>Settings</MenuItem>
              <div className="my-1 h-px bg-theme-border-primary/60" />
              <button
                onClick={handleSignIn}
                className="w-full text-left flex items-center gap-2 rounded-md px-3 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-hover/60 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </>
          )}
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
      <Link href="/profile" className="text-theme-text-secondary hover:text-theme-text-primary text-sm">Profile</Link>
      <span className="text-theme-text-tertiary">•</span>
      <Link href="/settings" className="text-theme-text-secondary hover:text-theme-text-primary text-sm">Settings</Link>
    </div>
  );
}
