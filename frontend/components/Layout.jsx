import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
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
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-yellow-400">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.7)]" />
            <span className="tracking-tight">BoilerFuel</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <HeaderLink href="/dashboard">Dashboard</HeaderLink>
            <HeaderLink href="/gym">Gym</HeaderLink>
            <HeaderLink href="/about">About</HeaderLink>
            <HeaderLink href="/changelog">Changelog</HeaderLink>
            <HeaderLink href="/admin">Admin</HeaderLink>
          </nav>

          <button
            aria-label="Toggle menu"
            className="lg:hidden inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10 transition"
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
        <div className="border-t border-white/10 bg-slate-900/70 lg:hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid gap-2 text-sm">
              <MobileLink href="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
              <MobileLink href="/gym" onClick={() => setOpen(false)}>Gym</MobileLink>
              <MobileLink href="/about" onClick={() => setOpen(false)}>About</MobileLink>
              <MobileLink href="/changelog" onClick={() => setOpen(false)}>Changelog</MobileLink>
              <MobileLink href="/admin" onClick={() => setOpen(false)}>Admin</MobileLink>
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
      className="text-slate-300 hover:text-yellow-400 transition-colors"
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
      className="block rounded-md px-3 py-2 text-slate-200 hover:text-yellow-400 hover:bg-white/5 transition"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <p>
          Your data stays on this device. No accounts required.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-yellow-400 transition-colors">About</Link>
          <Link href="/changelog" className="hover:text-yellow-400 transition-colors">Changelog</Link>
        </div>
      </div>
    </footer>
  );
}
