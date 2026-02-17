import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import {
  adminLogin,
  apiCall,
  createActivity,
  createFood,
  deleteActivity,
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

  async function handleRunScraper() {
    setScrapeStatus('running');
    setScrapeMessage('');
    try {
      const res = await fetch('/api/admin/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.debug) console.log('[scrape debug]', data.debug);
      if (!res.ok) {
        const debugStr = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : '';
        throw new Error((data.error || 'Scrape failed') + (data.details ? ` — ${data.details}` : '') + debugStr);
      }
      setScrapeStatus('success');
      setScrapeMessage(`Scrape started via ${data.via || 'backend'}`);
      setTimeout(() => setScrapeStatus('idle'), 5000);
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
    { key: 'exercises', label: 'Exercises' },
  ];

  return (
    <>
      <Head>
        <title>Admin Panel - BoilerFuel</title>
        <meta name="description" content="Manage foods, exercises, and view statistics" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-16">

          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                  &larr; Back
                </Link>
                <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Admin</h1>
                <div className="w-12 h-px bg-theme-text-primary/30" />
              </div>
              <button
                onClick={handleLogout}
                className="border border-theme-text-primary/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-theme-text-tertiary hover:text-theme-text-primary hover:border-theme-text-primary/40 transition-colors mt-6"
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
              {scrapeMessage && (
                <p className={`text-xs ${scrapeStatus === 'error' ? 'text-red-400' : 'text-theme-text-tertiary'}`}>
                  {scrapeMessage}
                </p>
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
              {activeTab === 'exercises' && <ExercisesTab />}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
            </div>
            <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

AdminPanel.getLayout = function getLayout(page) {
  return page;
};

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [foods, activities] = await Promise.all([
          apiCall('/api/foods'),
          apiCall('/api/activities')
        ]);
        setStats({
          foods: {
            total: foods?.length || 0,
            diningCourts: [...new Set(foods?.map(f => f.dining_court).filter(Boolean))].length,
            avgCalories: foods?.length ? Math.round(foods.reduce((s, f) => s + (f.calories || 0), 0) / foods.length) : 0,
          },
          activities: {
            total: activities?.length || 0,
            categories: [...new Set(activities?.map(a => a.category).filter(Boolean))].length,
            avgCalories: activities?.length ? Math.round(activities.reduce((s, a) => s + (a.calories_per_hour || 0), 0) / activities.length) : 0,
          },
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    loadStats();
  }, []);

  if (loading) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Loading stats...</p>;
  if (!stats) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Failed to load</p>;

  return (
    <div className="space-y-8">
      <SectionLabel>Database Overview</SectionLabel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px border border-theme-text-primary/20">
        {/* Foods */}
        <div className="p-5 space-y-4 border-r border-b border-theme-text-primary/20 sm:border-b-0">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-text-tertiary">Foods</p>
          <div className="space-y-2">
            <StatRow label="Total" value={stats.foods.total} />
            <StatRow label="Dining Courts" value={stats.foods.diningCourts} />
            <StatRow label="Avg Calories" value={`${stats.foods.avgCalories} cal`} />
          </div>
        </div>
        {/* Activities */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-text-tertiary">Exercises</p>
          <div className="space-y-2">
            <StatRow label="Total" value={stats.activities.total} />
            <StatRow label="Categories" value={stats.activities.categories} />
            <StatRow label="Avg Cal/hr" value={`${stats.activities.avgCalories} cal`} />
          </div>
        </div>
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

  const filteredFoods = useMemo(() => foods.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.dining_court?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [foods, searchTerm]);

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

      <input
        type="text"
        placeholder="Search foods..."
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        className="w-full border border-theme-text-primary/20 bg-transparent px-4 py-3 text-sm font-mono placeholder:text-theme-text-tertiary/50 focus:outline-none focus:border-theme-text-primary/40"
      />

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

/* ── Exercises Tab ────────────────────────────────────────── */

function ExercisesTab() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadActivities(); }, []);

  async function loadActivities() {
    try { setLoading(true); const data = await apiCall('/api/activities'); setActivities(data || []); setError(''); }
    catch (err) { setError(err.message || 'Failed to load exercises'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteActivity(id); await loadActivities(); }
    catch (err) { setError(err.message || 'Failed to delete'); }
  }

  const filteredActivities = useMemo(() => activities.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [activities, searchTerm, filterCategory]);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

  if (loading) return <p className="text-xs uppercase tracking-widest text-theme-text-tertiary py-8 text-center">Loading exercises...</p>;

  return (
    <div className="space-y-6">
      <SectionLabel>Exercises ({filteredActivities.length})</SectionLabel>

      {error && <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="flex-1 border border-theme-text-primary/20 bg-transparent px-4 py-3 text-sm font-mono placeholder:text-theme-text-tertiary/50 focus:outline-none focus:border-theme-text-primary/40"
        />
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          className="border border-theme-text-primary/20 bg-theme-bg-primary px-3 py-3 text-xs font-mono uppercase tracking-wider focus:outline-none"
        >
          <option value="all">All</option>
          <option value="cardio">Cardio</option>
          <option value="strength">Strength</option>
          <option value="flexibility">Flexibility</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="border border-theme-text-primary/20 divide-y divide-theme-text-primary/10">
        {paginatedActivities.map(activity => (
          <div key={activity.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-theme-bg-secondary transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{activity.name}</p>
              <p className="text-xs text-theme-text-tertiary">
                {activity.calories_per_hour} cal/hr / {activity.category || 'other'} / {activity.intensity || 'moderate'}
              </p>
            </div>
            <button
              onClick={() => handleDelete(activity.id, activity.name)}
              className="shrink-0 text-xs text-theme-text-tertiary hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Del
            </button>
          </div>
        ))}
        {paginatedActivities.length === 0 && (
          <p className="text-xs text-theme-text-tertiary text-center py-6">No exercises found</p>
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
