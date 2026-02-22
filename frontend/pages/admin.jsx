import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import {
  adminLogin,
  apiCall,
  createFood,
  deleteFood,
  logoutAdmin,
  verifyAdminSession,
} from '../utils/auth';

const ITEMS_PER_PAGE = 20;

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  // Scraper state
  const [scrapeStatus, setScrapeStatus] = useState('idle'); // idle | running | success | error
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [scrapeProgress, setScrapeProgress] = useState(null); // { steps, current_step, elapsed_seconds, ... }
  const pollRef = useRef(null);

  useEffect(() => {
    async function bootstrap() {
      if (session?.user) {
        setAuthenticated(true);
        setLoading(false);
        return;
      }
      const sessionOk = await verifyAdminSession();
      if (sessionOk) setAuthenticated(true);
      setLoading(false);
    }
    if (status !== 'loading') bootstrap();
  }, [session, status]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    if (!password.trim()) { setLoginError('Password is required'); return; }
    try {
      await adminLogin(password.trim());
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      setLoginError(error.message || 'Invalid password');
    }
  }

  async function handleLogout() {
    if (session?.user) await signOut({ redirect: false });
    await logoutAdmin();
    setAuthenticated(false);
    setActiveTab('stats');
  }

  async function handleGoogleSignIn() {
    try { await signIn('google', { redirect: false }); }
    catch { setLoginError('Failed to sign in with Google'); }
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollScrapeStatus = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/scrape-status');
        const data = await res.json();
        setScrapeProgress(data);

        if (data.status === 'completed') {
          stopPolling();
          setScrapeStatus(data.conclusion === 'success' ? 'success' : 'error');
          setScrapeMessage(
            data.conclusion === 'success'
              ? `Scrape completed in ${formatElapsed(data.elapsed_seconds)}`
              : `Scrape ${data.conclusion || 'failed'}`
          );
        }
      } catch {
        // Silently continue polling
      }
    }, 4000); // Poll every 4 seconds
  }, [stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleRunScraper() {
    setScrapeStatus('running');
    setScrapeMessage('Dispatching workflow...');
    setScrapeProgress(null);
    try {
      const res = await fetch('/api/admin/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.debug) console.log('[scrape debug]', data.debug);
      if (!res.ok) {
        const debugStr = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : '';
        throw new Error((data.error || 'Scrape failed') + (data.details ? ` — ${data.details}` : '') + debugStr);
      }
      setScrapeMessage('Workflow dispatched. Waiting for runner...');
      // Start polling for progress after a brief delay (GitHub needs time to create the run)
      setTimeout(() => pollScrapeStatus(), 3000);
    } catch (err) {
      setScrapeStatus('error');
      setScrapeMessage(err.message || 'Scrape request failed');
    }
  }

  // Loading screen
  if (loading) {
    return (
      <>
        <Head><title>Loading... - Admin</title></Head>
        <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono flex items-center justify-center">
          <span className="text-sm uppercase tracking-widest text-theme-text-tertiary">Loading...</span>
        </div>
      </>
    );
  }

  // Login screen
  if (!authenticated) {
    return (
      <>
        <Head><title>Admin Login - BoilerFuel</title></Head>
        <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-10">
            <header className="space-y-3">
              <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                &larr; Back
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.2em]">Admin</h1>
              <div className="w-12 h-px bg-theme-text-primary/30" />
              <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">
                Authenticate to continue
              </p>
            </header>

            {loginError && (
              <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full border border-theme-text-primary/20 px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-theme-bg-secondary transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-theme-text-primary/10" />
                <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">or</span>
                <div className="flex-1 h-px bg-theme-text-primary/10" />
              </div>

              {/* Password */}
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full border border-theme-text-primary/20 bg-transparent px-4 py-3 text-sm font-mono placeholder:text-theme-text-tertiary/50 focus:outline-none focus:border-theme-text-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-theme-text-primary text-theme-bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Authenticated panel
  const TABS = [
    { key: 'stats', label: 'Stats' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'foods', label: 'Foods' },
    { key: 'feedback', label: 'Feedback' },
  ];

  return (
    <>
      <Head>
        <title>Admin Panel - BoilerFuel</title>
        <meta name="description" content="Manage foods, exercises, and view statistics" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-12">

          {/* Header */}
          <header className="border-b border-theme-text-primary/10 pb-10">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-[0.2em]">Admin</h1>
                <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
                  {session?.user?.email ?? 'Authenticated'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="border border-theme-text-primary/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-theme-text-tertiary hover:text-theme-text-primary hover:border-theme-text-primary/40 transition-colors"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Manual Scraper */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Scraper
            </h2>
            <div className="border border-theme-text-primary/20 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider">Menu Scraper</p>
                  <p className="text-xs text-theme-text-tertiary mt-1">
                    Trigger a manual scrape of Purdue dining menus
                  </p>
                </div>
                <button
                  onClick={handleRunScraper}
                  disabled={scrapeStatus === 'running'}
                  className={`shrink-0 border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    scrapeStatus === 'running'
                      ? 'border-theme-text-primary/10 text-theme-text-tertiary cursor-wait'
                      : scrapeStatus === 'success'
                      ? 'border-green-500/50 text-green-400'
                      : scrapeStatus === 'error'
                      ? 'border-red-500/50 text-red-400'
                      : 'border-theme-text-primary/40 text-theme-text-primary hover:bg-theme-text-primary hover:text-theme-bg-primary'
                  }`}
                >
                  {scrapeStatus === 'running' ? 'Running...' :
                   scrapeStatus === 'success' ? 'Done' :
                   scrapeStatus === 'error' ? 'Failed' :
                   'Run Scraper'}
                </button>
              </div>

              {/* Status message */}
              {scrapeMessage && (
                <p className={`text-xs ${scrapeStatus === 'error' ? 'text-red-400' : 'text-theme-text-tertiary'}`}>
                  {scrapeMessage}
                </p>
              )}

              {/* Live progress panel */}
              {scrapeStatus === 'running' && scrapeProgress && scrapeProgress.steps && (
                <div className="border border-theme-text-primary/10 bg-theme-bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">
                      Progress
                    </span>
                    <span className="text-[10px] text-theme-text-tertiary tabular-nums">
                      {formatElapsed(scrapeProgress.elapsed_seconds)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {scrapeProgress.total_steps > 0 && (
                    <div className="w-full h-1 bg-theme-text-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-theme-text-primary/60 transition-all duration-500"
                        style={{ width: `${Math.round((scrapeProgress.completed_steps / scrapeProgress.total_steps) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Steps list */}
                  <div className="space-y-1">
                    {scrapeProgress.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center shrink-0">
                          {step.status === 'completed' && step.conclusion === 'success' ? (
                            <span className="text-green-400">&#10003;</span>
                          ) : step.status === 'completed' && step.conclusion !== 'success' ? (
                            <span className="text-red-400">&#10007;</span>
                          ) : step.status === 'in_progress' ? (
                            <span className="text-theme-text-primary animate-pulse">&#9679;</span>
                          ) : (
                            <span className="text-theme-text-tertiary/30">&#9675;</span>
                          )}
                        </span>
                        <span className={
                          step.status === 'in_progress' ? 'text-theme-text-primary font-bold' :
                          step.status === 'completed' ? 'text-theme-text-tertiary' :
                          'text-theme-text-tertiary/40'
                        }>
                          {step.name}
                        </span>
                        {step.status === 'completed' && step.started_at && step.completed_at && (
                          <span className="text-[10px] text-theme-text-tertiary/40 tabular-nums ml-auto">
                            {formatElapsed(Math.round((new Date(step.completed_at) - new Date(step.started_at)) / 1000))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Current step highlight */}
                  {scrapeProgress.current_step && (
                    <div className="text-xs text-theme-text-secondary">
                      Running: <span className="font-bold">{scrapeProgress.current_step}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Completed progress summary */}
              {(scrapeStatus === 'success' || scrapeStatus === 'error') && scrapeProgress?.steps && (
                <div className={`border p-4 space-y-2 ${scrapeStatus === 'success' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">
                      {scrapeStatus === 'success' ? 'Completed' : 'Failed'}
                    </span>
                    {scrapeProgress.html_url && (
                      <a href={scrapeProgress.html_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-theme-text-tertiary hover:text-theme-text-primary underline">
                        View logs
                      </a>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {scrapeProgress.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center shrink-0">
                          {step.conclusion === 'success' ? (
                            <span className="text-green-400">&#10003;</span>
                          ) : step.conclusion === 'failure' ? (
                            <span className="text-red-400">&#10007;</span>
                          ) : step.conclusion === 'skipped' ? (
                            <span className="text-theme-text-tertiary/40">&#8211;</span>
                          ) : (
                            <span className="text-theme-text-tertiary/30">&#9675;</span>
                          )}
                        </span>
                        <span className={step.conclusion === 'failure' ? 'text-red-400' : 'text-theme-text-tertiary'}>
                          {step.name}
                        </span>
                        {step.started_at && step.completed_at && (
                          <span className="text-[10px] text-theme-text-tertiary/40 tabular-nums ml-auto">
                            {formatElapsed(Math.round((new Date(step.completed_at) - new Date(step.started_at)) / 1000))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <section className="space-y-6">
            <div className="flex gap-0 border-b border-theme-text-primary/10 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-theme-text-primary text-theme-text-primary'
                      : 'border-transparent text-theme-text-tertiary hover:text-theme-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'accuracy' && <MenuAccuracyTab />}
              {activeTab === 'foods' && <FoodsTab />}
              {activeTab === 'feedback' && <FeedbackTab />}
            </div>
          </section>

          {/* Danger Zone */}
          <DangerZone />

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-6 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel</span>
            <span className="text-[10px] text-theme-text-tertiary">{new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

AdminPanel.getLayout = function getLayout(page) {
  return page;
};

function formatElapsed(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ── Helper sub-components ────────────────────────────────── */

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 2);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2 mb-4">
      {children}
    </h3>
  );
}

/* ── Stats Tab ────────────────────────────────────────────── */

function StatsTab() {
  const [foods, setFoods] = useState(null);
  const [scrapeInfo, setScrapeInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [foodData, scrapeData] = await Promise.allSettled([
          apiCall('/api/foods'),
          fetch('/api/admin/scrape-status').then(r => r.json()),
        ]);
        if (foodData.status === 'fulfilled') setFoods(foodData.value || []);
        if (scrapeData.status === 'fulfilled') setScrapeInfo(scrapeData.value);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Loading...</p>;

  // For BYO items with no direct calories, estimate from component data — sum all non-zero components
  function getEffectiveCalories(food) {
    if (food.calories > 0) return food.calories;
    const components = food.macros?.components;
    if (!components || components.length === 0) return 0;
    return components.filter(c => c.calories > 0).reduce((s, c) => s + c.calories, 0);
  }

  const total = foods?.length || 0;
  // Use effective calories (real or BYO-estimated) for stats
  const calFoods = (foods || []).map(f => ({ ...f, _eff: getEffectiveCalories(f) })).filter(f => f._eff > 0);
  const avgCal = calFoods.length ? Math.round(calFoods.reduce((s, f) => s + f._eff, 0) / calFoods.length) : null;

  // Per-court breakdown — use estimated calories for BYO items
  const courtMap = {};
  for (const f of (foods || [])) {
    const c = f.dining_court || 'Unknown';
    if (!courtMap[c]) courtMap[c] = { count: 0, calCount: 0, totalCal: 0, minCal: Infinity, maxCal: -Infinity, hasEstimates: false };
    courtMap[c].count++;
    const eff = getEffectiveCalories(f);
    if (eff > 0) {
      courtMap[c].calCount++;
      courtMap[c].totalCal += eff;
      if (eff < courtMap[c].minCal) courtMap[c].minCal = eff;
      if (eff > courtMap[c].maxCal) courtMap[c].maxCal = eff;
      if (f.calories === 0) courtMap[c].hasEstimates = true;
    }
  }
  const courts = Object.entries(courtMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-10">
      {/* Summary row */}
      <div>
        <SectionLabel>Database Overview</SectionLabel>
        <div className="grid grid-cols-3 gap-px bg-theme-text-primary/10 border border-theme-text-primary/20">
          {[
            { label: 'Total Items', value: total },
            { label: 'Dining Courts', value: courts.length },
            { label: 'Avg Calories', value: avgCal != null ? `${avgCal} cal` : '—' },
          ].map(s => (
            <div key={s.label} className="bg-theme-bg-primary p-5 text-center">
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-court breakdown */}
      {courts.length > 0 && (
        <div>
          <SectionLabel>By Dining Court</SectionLabel>
          <div className="border border-theme-text-primary/20 divide-y divide-theme-text-primary/10">
            {courts.map(([name, d]) => (
              <div key={name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm font-bold capitalize">{name}</span>
                  <span className="ml-3 text-xs text-theme-text-tertiary tabular-nums">{d.count} items</span>
                </div>
                <div className="text-xs text-theme-text-tertiary tabular-nums text-right">
                  {d.calCount > 0 ? (
                    <>
                      <span className="font-mono">{Math.round(d.totalCal / d.calCount)} avg</span>
                      <span className="ml-3 text-theme-text-tertiary/50">{d.minCal}–{d.maxCal} cal</span>
                      {d.hasEstimates && (
                        <span
                          className="ml-1 text-theme-text-tertiary/50 text-[9px] border border-theme-text-primary/15 px-1 cursor-help"
                          title="~est: Some items at this location (e.g. 1bowl Build Your Own) have no direct calorie value — their calories are estimated by summing individual components (base + protein + toppings). These estimates are included in the average.">
                          ~est
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-theme-text-tertiary/40">no calorie data</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent scrape activity */}
      <div>
        <SectionLabel>Recent Activity</SectionLabel>
        {scrapeInfo ? (
          <div className="border border-theme-text-primary/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Last Scrape
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                scrapeInfo.status === 'completed' && scrapeInfo.conclusion === 'success'
                  ? 'border-green-500/40 text-green-400'
                  : scrapeInfo.status === 'in_progress'
                  ? 'border-theme-text-primary/30 text-theme-text-secondary animate-pulse'
                  : 'border-red-500/40 text-red-400'
              }`}>
                {scrapeInfo.status === 'completed' ? (scrapeInfo.conclusion || 'done') : scrapeInfo.status || 'unknown'}
              </span>
            </div>
            {scrapeInfo.elapsed_seconds != null && (
              <p className="text-xs text-theme-text-tertiary">
                Duration: <span className="font-mono">{formatElapsed(scrapeInfo.elapsed_seconds)}</span>
              </p>
            )}
            {scrapeInfo.html_url && (
              <a href={scrapeInfo.html_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-theme-text-tertiary hover:text-theme-text-primary underline">
                View run on GitHub &rarr;
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-theme-text-tertiary">No recent scrape data available.</p>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-theme-text-tertiary">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/* ── Feedback Tab ─────────────────────────────────────────── */

function FeedbackTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | idea | bug | other

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/feedback');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setEntries(data.feedback || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Loading feedback...</p>;
  if (error) return <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>;

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  const typeStyle = {
    idea: 'border-blue-500/40 text-blue-400',
    bug: 'border-red-500/40 text-red-400',
    other: 'border-theme-text-primary/30 text-theme-text-tertiary',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionLabel>Feedback ({filtered.length})</SectionLabel>
        <div className="flex gap-px border border-theme-text-primary/20">
          {['all', 'idea', 'bug', 'other'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f ? 'bg-theme-text-primary text-theme-bg-primary' : 'text-theme-text-tertiary hover:text-theme-text-primary'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-theme-text-tertiary text-center py-8">No feedback yet.</p>
      )}

      <div className="space-y-3">
        {filtered.map(fb => (
          <div key={fb.id} className="border border-theme-text-primary/20 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 ${typeStyle[fb.type] || typeStyle.other}`}>
                {fb.type}
              </span>
              <span className="text-[10px] text-theme-text-tertiary tabular-nums">
                {new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-theme-text-secondary leading-relaxed">{fb.message}</p>
            {fb.contact && (
              <p className="text-xs text-theme-text-tertiary">
                Contact: <span className="font-mono">{fb.contact}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Danger Zone ──────────────────────────────────────────── */

function DangerZone() {
  const [unlocked, setUnlocked] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');
  const REQUIRED = 'DELETE FOODS';

  async function handleClearFoods() {
    if (confirm !== REQUIRED) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/admin/clear-foods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('success');
      setMsg(`Cleared ${data.deleted} food items from the database.`);
      setConfirm('');
    } catch (err) {
      setStatus('error');
      setMsg(err.message || 'Failed to clear foods.');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 border-b border-red-500/20 pb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-red-500/70">
          Danger Zone
        </h2>
        <span className="text-[10px] border border-red-500/30 text-red-500/60 px-1.5 py-0.5 uppercase tracking-wider">
          Irreversible
        </span>
      </div>

      <div className="border border-red-500/20 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-wider text-theme-text-primary">Clear Food Database</p>
            <p className="text-xs text-theme-text-tertiary">
              Permanently deletes all items from the foods table. Does not affect user meal logs, weight data, or any other user data.
            </p>
          </div>
          {!unlocked && (
            <button
              onClick={() => setUnlocked(true)}
              className="shrink-0 border border-red-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500/70 hover:text-red-400 hover:border-red-500/60 transition-colors">
              Unlock
            </button>
          )}
        </div>

        {unlocked && (
          <div className="space-y-3 border-t border-red-500/10 pt-4">
            <p className="text-xs text-theme-text-tertiary">
              Type <span className="font-mono font-bold text-red-400">{REQUIRED}</span> to confirm.
            </p>
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={REQUIRED}
              className="w-full max-w-xs border border-red-500/30 bg-transparent text-red-400 px-3 py-2 text-xs font-mono tracking-wider focus:border-red-500/60 focus:outline-none transition-colors placeholder:text-red-500/20"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearFoods}
                disabled={confirm !== REQUIRED || status === 'loading'}
                className="px-4 py-2 border border-red-500/60 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {status === 'loading' ? 'Clearing...' : 'Clear All Foods'}
              </button>
              <button
                onClick={() => { setUnlocked(false); setConfirm(''); setStatus('idle'); setMsg(''); }}
                className="text-xs text-theme-text-tertiary hover:text-theme-text-primary uppercase tracking-wider transition-colors">
                Cancel
              </button>
            </div>
            {msg && (
              <p className={`text-xs ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Menu Accuracy Tab ───────────────────────────────────── */

function MenuAccuracyTab() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  async function runComparison() {
    try {
      setLoading(true); setError('');
      const data = await apiCall(
        `/api/admin/menu-compare?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
        { method: 'GET' }, { requireAdmin: true }
      );
      setReport(data || null);
    } catch (err) { setError(err.message || 'Failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { runComparison(); }, []);

  const groupedByDate = useMemo(() => {
    if (!report?.results) return {};
    return report.results.reduce((acc, item) => {
      acc[item.date] ||= [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [report]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionLabel>Menu Accuracy</SectionLabel>
        <button
          onClick={runComparison}
          disabled={loading}
          className="border border-theme-text-primary/30 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors disabled:opacity-40"
        >
          {loading ? 'Running...' : 'Run Comparison'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-theme-text-primary/20">
        <div className="p-4">
          <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">Start</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full bg-transparent border border-theme-text-primary/20 px-3 py-2 text-sm font-mono focus:outline-none" />
        </div>
        <div className="p-4 border-x border-theme-text-primary/20">
          <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">End</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full bg-transparent border border-theme-text-primary/20 px-3 py-2 text-sm font-mono focus:outline-none" />
        </div>
        <div className="p-4">
          <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">Summary</label>
          {report?.summary ? (
            <div className="text-xs space-y-1">
              <div>Missing: <span className="font-bold">{report.summary.total_missing}</span></div>
              <div>Extra: <span className="font-bold">{report.summary.total_extra}</span></div>
              <div>Nutrition: <span className="font-bold">{report.summary.total_nutrition_mismatches}</span></div>
            </div>
          ) : <span className="text-xs text-theme-text-tertiary">—</span>}
        </div>
      </div>

      {error && <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}
      {!report && !loading && !error && (
        <p className="text-xs uppercase tracking-widest text-theme-text-tertiary text-center py-8">No report</p>
      )}

      {report && Object.keys(groupedByDate).sort().map(date => (
        <div key={date} className="border border-theme-text-primary/20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme-text-primary/10">
            <span className="text-sm font-bold uppercase tracking-wider">{date}</span>
            <span className="text-[10px] text-theme-text-tertiary">{report.range?.start} → {report.range?.end}</span>
          </div>
          <div className="divide-y divide-theme-text-primary/5">
            {groupedByDate[date].map((item, idx) => {
              const hasMismatches = item.status === 'open' && (item.missing_count > 0 || item.extra_count > 0 || item.nutrition_mismatch_count > 0);
              const itemKey = `${date}-${item.court_code}-${idx}`;
              const isExpanded = expandedItems.has(itemKey);
              const PREVIEW_LIMIT = 3;

              return (
                <div key={`${item.court_code}-${idx}`} className={`px-4 py-3 ${hasMismatches ? 'border-l-2 border-l-red-500/60' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">{item.display_name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{item.source}</span>
                  </div>
                  {item.status !== 'open' ? (
                    <p className="text-xs text-theme-text-tertiary mt-1">
                      {item.status === 'closed' ? `Closed: ${item.reason}` : `Error: ${item.error}`}
                    </p>
                  ) : (
                    <p className="text-xs text-theme-text-tertiary mt-1 space-x-2">
                      <span className={item.coverage_percent === 100 ? 'text-green-400' : 'text-theme-text-secondary'}>{item.coverage_percent}%</span>
                      <span>API {item.api_count}</span>
                      <span>DB {item.db_count}</span>
                      <span className={item.missing_count > 0 ? 'text-red-400 font-bold' : ''}>-{item.missing_count}</span>
                      <span className={item.extra_count > 0 ? 'text-theme-text-secondary font-bold' : ''}>+{item.extra_count}</span>
                    </p>
                  )}
                  {item.missing?.length > 0 && (
                    <div className="mt-2 text-xs text-red-400/80 space-y-0.5">
                      {(isExpanded ? item.missing : item.missing.slice(0, PREVIEW_LIMIT)).map((m, i) => <div key={i}>- {m}</div>)}
                      {item.missing.length > PREVIEW_LIMIT && (
                        <button onClick={() => {
                          const s = new Set(expandedItems);
                          isExpanded ? s.delete(itemKey) : s.add(itemKey);
                          setExpandedItems(s);
                        }} className="text-red-300 hover:text-red-200 underline">
                          {isExpanded ? 'less' : `+${item.missing.length - PREVIEW_LIMIT} more`}
                        </button>
                      )}
                    </div>
                  )}
                  {item.extra?.length > 0 && (
                    <div className="mt-1 text-xs text-theme-text-tertiary space-y-0.5">
                      {(isExpanded ? item.extra : item.extra.slice(0, PREVIEW_LIMIT)).map((e, i) => <div key={i}>+ {e}</div>)}
                      {item.extra.length > PREVIEW_LIMIT && (
                        <button onClick={() => {
                          const s = new Set(expandedItems);
                          isExpanded ? s.delete(itemKey) : s.add(itemKey);
                          setExpandedItems(s);
                        }} className="text-theme-text-tertiary hover:text-theme-text-secondary underline">
                          {isExpanded ? 'less' : `+${item.extra.length - PREVIEW_LIMIT} more`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Foods Tab ────────────────────────────────────────────── */

function FoodsTab() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => { loadFoods(); }, []);

  async function loadFoods() {
    try { setLoading(true); const data = await apiCall('/api/foods'); setFoods(data || []); setError(''); }
    catch (err) { setError(err.message || 'Failed to load foods'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteFood(id); await loadFoods(); }
    catch (err) { setError(err.message || 'Failed to delete'); }
  }

  const courts = useMemo(() => {
    const s = new Set(foods.map(f => f.dining_court).filter(Boolean));
    return [...s].sort();
  }, [foods]);

  const filteredFoods = useMemo(() => foods.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.dining_court?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourt = !courtFilter || f.dining_court === courtFilter;
    return matchesSearch && matchesCourt;
  }), [foods, searchTerm, courtFilter]);

  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFoods.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFoods, currentPage]);

  const totalPages = Math.ceil(filteredFoods.length / ITEMS_PER_PAGE);

  if (loading) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Loading foods...</p>;

  return (
    <div className="space-y-6">
      <SectionLabel>Foods ({filteredFoods.length})</SectionLabel>

      {error && <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search foods..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="flex-1 border border-theme-text-primary/20 bg-transparent px-4 py-3 text-sm font-mono placeholder:text-theme-text-tertiary/50 focus:outline-none focus:border-theme-text-primary/40"
        />
        <select
          value={courtFilter}
          onChange={e => { setCourtFilter(e.target.value); setCurrentPage(1); }}
          className="border border-theme-text-primary/20 bg-theme-bg-primary text-theme-text-secondary px-3 py-3 text-xs font-mono focus:outline-none focus:border-theme-text-primary/40 cursor-pointer"
        >
          <option value="">All courts</option>
          {courts.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="border border-theme-text-primary/20 divide-y divide-theme-text-primary/10">
        {paginatedFoods.map(food => (
          <div key={food.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-theme-bg-secondary transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{food.name}</p>
              <p className="text-xs text-theme-text-tertiary">
                {food.calories} cal / {food.dining_court} / {food.meal_time}
              </p>
            </div>
            <button
              onClick={() => handleDelete(food.id, food.name)}
              className="shrink-0 text-xs text-theme-text-tertiary hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Del
            </button>
          </div>
        ))}
        {paginatedFoods.length === 0 && (
          <p className="text-xs text-theme-text-tertiary text-center py-6">No foods found</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-wider">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="text-theme-text-tertiary hover:text-theme-text-primary disabled:opacity-30 transition-colors">&larr; Prev</button>
          <span className="text-theme-text-tertiary">{currentPage}/{totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="text-theme-text-tertiary hover:text-theme-text-primary disabled:opacity-30 transition-colors">Next &rarr;</button>
        </div>
      )}
    </div>
  );
}

