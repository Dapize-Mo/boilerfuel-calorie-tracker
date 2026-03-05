import Head from 'next/head';
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 — BoilerFuel</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-theme-text-tertiary">Error 404</p>
            <h1 className="text-6xl sm:text-8xl font-bold tabular-nums text-theme-text-primary/20">404</h1>
            <p className="text-sm text-theme-text-secondary leading-relaxed">
              This page doesn&apos;t exist.
            </p>
          </div>

          <div className="space-y-px border border-theme-text-primary/10 text-left">
            {[
              { href: '/', label: 'Home', desc: 'Browse dining menus' },
              { href: '/stats', label: 'Stats', desc: 'Nutrition analytics' },
              { href: '/profile', label: 'Profile', desc: 'Goals & settings' },
              { href: '/about', label: 'About', desc: 'About BoilerFuel' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center justify-between px-4 py-3 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary group-hover:text-theme-text-primary transition-colors">
                    {link.label}
                  </span>
                  <span className="text-[10px] text-theme-text-tertiary/60">{link.desc}</span>
                </div>
                <span className="text-theme-text-tertiary/30 group-hover:text-theme-text-tertiary transition-colors text-xs">&rarr;</span>
              </Link>
            ))}
          </div>

          <p className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">
            BoilerFuel &middot; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}

NotFound.getLayout = (page) => page;
