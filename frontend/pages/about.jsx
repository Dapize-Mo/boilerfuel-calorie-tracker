import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function About() {
  const [fbType, setFbType] = useState('idea');
  const [fbMessage, setFbMessage] = useState('');
  const [fbContact, setFbContact] = useState('');
  const [fbStatus, setFbStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!fbMessage.trim()) return;
    setFbStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: fbType, message: fbMessage, contact: fbContact }),
      });
      if (!res.ok) throw new Error();
      setFbStatus('sent');
      setFbMessage('');
      setFbContact('');
      setTimeout(() => setFbStatus(''), 4000);
    } catch {
      setFbStatus('error');
      setTimeout(() => setFbStatus(''), 4000);
    }
  };

  return (
    <>
      <Head>
        <title>About - BoilerFuel</title>
        <meta name="description" content="Learn about BoilerFuel Calorie Tracker" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-16">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">About</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Purdue dining nutrition tracker
            </p>
          </header>

          {/* What is BoilerFuel */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              What is BoilerFuel
            </h2>
            <p className="text-theme-text-secondary leading-relaxed">
              A privacy-focused calorie and macro tracker designed for Purdue students. 
              Browse dining court menus, track your meals, and monitor nutrition&mdash;all 
              without creating an account. Your data never leaves your device.
            </p>
          </section>

          {/* Features — grid of bordered boxes */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-theme-text-primary/10">
              {[
                { label: 'Privacy-First', desc: 'All data stored locally. No accounts, no cloud, no tracking.' },
                { label: 'Full Nutrition', desc: 'Calories, protein, carbs, and fats for every menu item.' },
                { label: 'Filter & Sort', desc: 'Browse by dining court, meal time, and sort by any nutrient.' },
                { label: 'Organized', desc: 'Menu items grouped by station — Grill, Salad Bar, and more.' },
                { label: 'Quick Add', desc: 'One-click meal logging for fast daily tracking.' },
                { label: 'Macro Goals', desc: 'Set custom calorie and macro targets in your profile.' },
              ].map(f => (
                <div key={f.label} className="bg-theme-bg-primary p-5 space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-primary">{f.label}</h3>
                  <p className="text-xs text-theme-text-tertiary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works — numbered list */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              How It Works
            </h2>
            <div className="space-y-0 border border-theme-text-primary/20">
              {[
                { n: '01', title: 'Browse', desc: 'Select a dining court and meal time to view the menu.' },
                { n: '02', title: 'Log', desc: 'Add foods to your daily log with one click.' },
                { n: '03', title: 'Track', desc: 'See your running calorie and macro totals for the day.' },
                { n: '04', title: 'Adjust', desc: 'Update your goals anytime from your profile.' },
              ].map((step, i) => (
                <div key={step.n}
                  className={`flex items-start gap-5 px-5 py-4 ${i > 0 ? 'border-t border-theme-text-primary/10' : ''}`}>
                  <span className="text-lg font-bold text-theme-text-primary/20 tabular-nums shrink-0">{step.n}</span>
                  <div>
                    <span className="text-sm font-bold uppercase tracking-wider text-theme-text-primary">{step.title}</span>
                    <p className="text-xs text-theme-text-tertiary mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Privacy &amp; Data
            </h2>
            <p className="text-theme-text-secondary leading-relaxed">
              All meal and activity logs are stored locally in your browser. Nothing is sent to a server.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
              {['No Accounts', 'No Cloud Sync', 'No Tracking', 'Device Only'].map(item => (
                <div key={item} className="bg-theme-bg-primary py-3 px-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-theme-text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-theme-text-tertiary">
              Clearing your browser cookies will delete your logs. Data does not sync across devices.
            </p>
          </section>

          {/* Tech Stack */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Technology
            </h2>
            <div className="grid grid-cols-2 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
              <div className="bg-theme-bg-primary p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Frontend</h3>
                <ul className="text-xs text-theme-text-tertiary space-y-1">
                  <li>Next.js &amp; React</li>
                  <li>TailwindCSS</li>
                  <li>Vercel</li>
                </ul>
              </div>
              <div className="bg-theme-bg-primary p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Backend</h3>
                <ul className="text-xs text-theme-text-tertiary space-y-1">
                  <li>Flask (Python)</li>
                  <li>PostgreSQL</li>
                  <li>Web Scraper</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ═══ FEEDBACK ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Feedback
            </h2>
            <p className="text-xs text-theme-text-tertiary">
              Have an idea or found a problem? Let us know. All feedback is anonymous unless you include contact info.
            </p>
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div className="flex gap-px border border-theme-text-primary/20 w-fit">
                {[{ key: 'idea', label: 'Idea' }, { key: 'bug', label: 'Bug' }, { key: 'other', label: 'Other' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setFbType(t.key)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      fbType === t.key ? 'bg-theme-text-primary text-theme-bg-primary' : 'text-theme-text-tertiary hover:text-theme-text-primary'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={fbMessage}
                onChange={e => setFbMessage(e.target.value)}
                placeholder={fbType === 'idea' ? 'Describe your idea or feature request...' : fbType === 'bug' ? 'Describe the issue you encountered...' : 'Your feedback...'}
                rows={4}
                maxLength={2000}
                className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-xs focus:border-theme-text-primary focus:outline-none transition-colors resize-none"
                required
              />
              <input
                type="text"
                value={fbContact}
                onChange={e => setFbContact(e.target.value)}
                placeholder="Contact (optional — email or @handle)"
                className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-xs focus:border-theme-text-primary focus:outline-none transition-colors"
              />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={fbStatus === 'sending' || !fbMessage.trim()}
                  className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {fbStatus === 'sending' ? 'Sending...' : 'Submit'}
                </button>
                {fbStatus === 'sent' && <span className="text-xs text-green-500">Sent! Thanks for the feedback.</span>}
                {fbStatus === 'error' && <span className="text-xs text-red-500">Failed to send. Try again.</span>}
              </div>
            </form>
          </section>

          {/* Footer links */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
            </div>
            <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

// About uses its own full-page layout
About.getLayout = (page) => page;
