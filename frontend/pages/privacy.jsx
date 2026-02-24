import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - BoilerFuel</title>
        <meta name="description" content="BoilerFuel privacy policy — your data stays on your device." />
      </Head>

      <div className="max-w-2xl mx-auto py-8 space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
            &larr; Back
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-theme-text-tertiary">Last updated: February 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Summary</h2>
          <p className="text-sm text-theme-text-secondary leading-relaxed">
            BoilerFuel is designed with privacy first. <strong className="text-theme-text-primary">Your meal logs, goals, and personal data are stored only on your own device</strong> — in your browser&apos;s local storage. We do not have a user account system, and we do not collect or store personal information on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Data We Collect</h2>
          <div className="space-y-4 text-sm text-theme-text-secondary leading-relaxed">
            <div>
              <p className="font-semibold text-theme-text-primary mb-1">Nothing — by default</p>
              <p>All data you enter (meals, goals, weight, water intake, dietary preferences, templates) is stored in your browser&apos;s <code className="text-xs bg-theme-bg-secondary px-1 py-0.5 rounded">localStorage</code>. It never leaves your device unless you explicitly use one of the optional features below.</p>
            </div>

            <div>
              <p className="font-semibold text-theme-text-primary mb-1">Food catalog (read-only)</p>
              <p>When you search for foods, your browser fetches menu data from our server. We do not log what you search for or what foods you view.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Optional Features</h2>
          <div className="space-y-4 text-sm text-theme-text-secondary leading-relaxed">
            <div>
              <p className="font-semibold text-theme-text-primary mb-1">Google Fit Export (optional)</p>
              <p>If you choose to connect Google, we request a Google OAuth token with the <code className="text-xs bg-theme-bg-secondary px-1 py-0.5 rounded">fitness.nutrition.write</code> scope. This token is used only to write nutrition data you explicitly choose to export. We do not store your Google credentials or access token on our servers — it is held temporarily in your session. You can disconnect at any time from <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">Google Account permissions</a>.</p>
            </div>

            <div>
              <p className="font-semibold text-theme-text-primary mb-1">Cross-Device Sync (optional)</p>
              <p>If you enable device sync, your data is <strong className="text-theme-text-primary">encrypted in your browser before being uploaded</strong>. Our server stores only an encrypted blob — we cannot read your meal data. The encryption key never leaves your device. You can unpair at any time from Profile → Device Sync, which deletes the encrypted copy from our server.</p>
            </div>

            <div>
              <p className="font-semibold text-theme-text-primary mb-1">Notifications (optional)</p>
              <p>If you grant notification permission, reminders are triggered locally by your browser — no data is sent to any server. You can revoke permission at any time in your browser settings.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Third-Party Services</h2>
          <div className="space-y-2 text-sm text-theme-text-secondary leading-relaxed">
            <p>We do not use any advertising, analytics, or tracking services. There are no third-party cookies.</p>
            <p>The app is hosted on <strong className="text-theme-text-primary">Vercel</strong> — their <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">privacy policy</a> applies to infrastructure-level hosting.</p>
            <p>Google Fit integration uses <strong className="text-theme-text-primary">Google&apos;s OAuth 2.0</strong> and is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">Google&apos;s Privacy Policy</a>.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Your Data Rights</h2>
          <div className="space-y-2 text-sm text-theme-text-secondary leading-relaxed">
            <p><strong className="text-theme-text-primary">Access:</strong> All your data is already accessible to you — it lives in your browser&apos;s local storage.</p>
            <p><strong className="text-theme-text-primary">Deletion:</strong> Clear your browser&apos;s site data for this domain to delete all local data. If you used Device Sync, unpair from Profile → Device Sync to delete the server copy.</p>
            <p><strong className="text-theme-text-primary">Portability:</strong> You can export all your data as CSV or JSON from Profile → Export Data at any time.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Children&apos;s Privacy</h2>
          <p className="text-sm text-theme-text-secondary leading-relaxed">
            BoilerFuel is intended for use by Purdue University students and does not knowingly collect information from children under 13. The app does not collect personal information from any user by default.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-tertiary border-b border-theme-border-secondary pb-2">Changes to This Policy</h2>
          <p className="text-sm text-theme-text-secondary leading-relaxed">
            We may update this policy as features change. Material changes will be noted in the <Link href="/changelog" className="underline hover:text-theme-text-primary">Changelog</Link>.
          </p>
        </section>

        <footer className="border-t border-theme-border-secondary pt-6 text-xs text-theme-text-tertiary">
          <Link href="/" className="hover:text-theme-text-primary transition-colors">← Back to BoilerFuel</Link>
        </footer>
      </div>
    </>
  );
}

PrivacyPage.getLayout = (page) => <Layout>{page}</Layout>;
