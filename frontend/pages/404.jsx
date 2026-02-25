import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | BoilerFuel</title>
      </Head>
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center px-6 font-mono">
        <div className="text-center max-w-md space-y-6">
          <div className="text-8xl font-bold text-yellow-500/30">404</div>
          <h1 className="text-xl font-bold uppercase tracking-widest">Page Not Found</h1>
          <p className="text-sm text-theme-text-tertiary">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/about"
              className="px-5 py-2.5 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
