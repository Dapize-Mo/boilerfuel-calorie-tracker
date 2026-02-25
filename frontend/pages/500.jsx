import Link from 'next/link';
import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error | BoilerFuel</title>
      </Head>
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center px-6 font-mono">
        <div className="text-center max-w-md space-y-6">
          <div className="text-8xl font-bold text-red-500/30">500</div>
          <h1 className="text-xl font-bold uppercase tracking-widest">Server Error</h1>
          <p className="text-sm text-theme-text-tertiary">
            Something went wrong on our end. Please try again in a moment.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
            >
              Reload Page
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
