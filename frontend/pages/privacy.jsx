import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Privacy Policy - BoilerFuel</title>
        <meta name="description" content="BoilerFuel privacy policy — your data stays on your device." />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-12">

          {/* Header */}
          <header className="space-y-4 border-b border-theme-text-primary/10 pb-10">
            <button onClick={() => router.back()} className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </button>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-[0.2em]">Privacy</h1>
                <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
                  Your data stays on your device
                </p>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed max-w-md">
                BoilerFuel is designed with privacy first. No accounts, no tracking, no cloud storage by default.
              </p>
            </div>
          </header>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

            {/* Left: main content */}
            <div className="lg:col-span-2 space-y-10">

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Summary
                </h2>
                <p className="text-sm text-theme-text-secondary leading-relaxed">
                  BoilerFuel is designed with privacy first. <strong className="text-theme-text-primary font-bold">Your meal logs, goals, and personal data are stored only on your own device</strong> — in your browser&apos;s local storage. We do not have a user account system, and we do not collect or store personal information on our servers.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Data We Collect
                </h2>
                <div className="space-y-6 text-sm text-theme-text-secondary leading-relaxed">
                  <div className="border border-theme-text-primary/10 p-5 space-y-2">
                    <p className="font-bold text-theme-text-primary uppercase tracking-wider text-xs">Nothing — by default</p>
                    <p>All data you enter (meals, goals, weight, water intake, dietary preferences, templates) is stored in your browser&apos;s <code className="font-mono text-xs bg-theme-text-primary/10 px-1.5 py-0.5">localStorage</code>. It never leaves your device unless you explicitly use one of the optional features below.</p>
                  </div>
                  <div className="border border-theme-text-primary/10 p-5 space-y-2">
                    <p className="font-bold text-theme-text-primary uppercase tracking-wider text-xs">Food catalog (read-only)</p>
                    <p>When you search for foods, your browser fetches menu data from our server. We do not log what you search for or what foods you view.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Optional Features
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Google Fit Export',
                      body: <>If you choose to connect Google, we request a Google OAuth token with the <code className="font-mono text-xs bg-theme-text-primary/10 px-1.5 py-0.5">fitness.nutrition.write</code> scope. This token is used only to write nutrition data you explicitly choose to export. We do not store your Google credentials or access token on our servers — it is held temporarily in your session. You can disconnect at any time from <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">Google Account permissions</a>.</>
                    },
                    {
                      title: 'Cross-Device Sync',
                      body: 'If you enable device sync, your data is encrypted in your browser before being uploaded. Our server stores only an encrypted blob — we cannot read your meal data. The encryption key never leaves your device. You can unpair at any time from Profile → Device Sync, which deletes the encrypted copy from our server.'
                    },
                    {
                      title: 'Notifications',
                      body: 'If you grant notification permission, reminders are triggered locally by your browser — no data is sent to any server. You can revoke permission at any time in your browser settings.'
                    },
                  ].map(item => (
                    <div key={item.title} className="border border-theme-text-primary/10 p-5 space-y-2">
                      <p className="font-bold text-theme-text-primary uppercase tracking-wider text-xs">{item.title}</p>
                      <p className="text-sm text-theme-text-secondary leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Third-Party Services
                </h2>
                <div className="space-y-3 text-sm text-theme-text-secondary leading-relaxed">
                  <p>We do not use any advertising, analytics, or tracking services. There are no third-party cookies.</p>
                  <p>The app is hosted on <strong className="text-theme-text-primary">Vercel</strong> — their <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">privacy policy</a> applies to infrastructure-level hosting.</p>
                  <p>Google Fit integration uses <strong className="text-theme-text-primary">Google&apos;s OAuth 2.0</strong> and is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">Google&apos;s Privacy Policy</a>.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Your Data Rights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
                  {[
                    { label: 'Access', desc: 'All your data is already accessible to you — it lives in your browser\'s local storage.' },
                    { label: 'Deletion', desc: 'Clear your browser\'s site data for this domain to delete all local data. If you used Device Sync, unpair from Profile → Device Sync.' },
                    { label: 'Portability', desc: 'Export all your data as CSV or JSON from Profile → Export Data at any time.' },
                  ].map(r => (
                    <div key={r.label} className="bg-theme-bg-primary p-5 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">{r.label}</p>
                      <p className="text-xs text-theme-text-tertiary leading-relaxed">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Children&apos;s Privacy
                </h2>
                <p className="text-sm text-theme-text-secondary leading-relaxed">
                  BoilerFuel is intended for use by Purdue University students and does not knowingly collect information from children under 13. The app does not collect personal information from any user by default.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Changes to This Policy
                </h2>
                <p className="text-sm text-theme-text-secondary leading-relaxed">
                  We may update this policy as features change. Material changes will be noted in the <Link href="/changelog" className="underline hover:text-theme-text-primary">Changelog</Link>.
                </p>
                <p className="text-xs text-theme-text-tertiary">Last updated: February 2026</p>
              </section>

            </div>

            {/* Right: sidebar */}
            <div className="space-y-8">

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Key Points
                </h2>
                <div className="space-y-px border border-theme-text-primary/10">
                  {[
                    'No user accounts',
                    'No analytics or tracking',
                    'No third-party cookies',
                    'Local storage only',
                    'Sync is encrypted',
                    'Export anytime',
                  ].map(point => (
                    <div key={point} className="bg-theme-bg-primary px-4 py-3 text-xs text-theme-text-secondary flex items-center gap-2">
                      <span className="text-theme-text-primary/20">&mdash;</span>
                      {point}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                  Navigate
                </h2>
                <div className="space-y-px border border-theme-text-primary/10">
                  {[
                    { href: '/', label: 'Home' },
                    { href: '/stats', label: 'Stats' },
                    { href: '/profile', label: 'Profile' },
                    { href: '/about', label: 'About' },
                    { href: '/changelog', label: 'Changelog' },
                  ].map(link => (
                    <Link key={link.href} href={link.href}
                      className="flex items-center justify-between px-4 py-3 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group">
                      <span className="text-xs uppercase tracking-wider text-theme-text-secondary group-hover:text-theme-text-primary transition-colors">
                        {link.label}
                      </span>
                      <span className="text-theme-text-tertiary/40 group-hover:text-theme-text-tertiary transition-colors text-xs">&rarr;</span>
                    </Link>
                  ))}
                </div>
              </section>

            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/stats" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Stats</Link>
              <Link href="/compare" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Compare</Link>
              <Link href="/custom-foods" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Custom Foods</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel · {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

PrivacyPage.getLayout = (page) => page;
