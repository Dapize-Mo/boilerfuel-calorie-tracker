import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import Layout from '../components/Layout';
import {
  adminLogin,
  apiCall,
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
  const [activeTab, setActiveTab] = useState('stats'); // stats, accuracy, foods, exercises

  useEffect(() => {
    async function bootstrap() {
      // Check if user is signed in with Google
      if (session?.user) {
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      // Otherwise check traditional admin session
      const sessionOk = await verifyAdminSession();
      if (sessionOk) {
        setAuthenticated(true);
      }
      setLoading(false);
    }

    if (status !== 'loading') {
      bootstrap();
    }
  }, [session, status]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!password.trim()) {
      setLoginError('Password is required');
      return;
    }

    try {
      await adminLogin(password.trim());
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      setLoginError(error.message || 'Invalid password');
    }
  }

  async function handleLogout() {
    // Sign out from Google if using Google auth
    if (session?.user) {
      await signOut({ redirect: false });
    }
    // Also logout from traditional admin session
    await logoutAdmin();
    setAuthenticated(false);
    setActiveTab('stats');
  }

  async function handleGoogleSignIn() {
    try {
      await signIn('google', { redirect: false });
    } catch (error) {
      setLoginError('Failed to sign in with Google');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono flex items-center justify-center">
        <Head><title>Loading... - Admin</title></Head>
        <div className="text-xs uppercase tracking-widest text-theme-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <Head><title>Admin Login - BoilerFuel</title></Head>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20">

          <header className="space-y-4 border-b border-theme-text-primary/10 pb-10 mb-12">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-[0.2em]">Admin</h1>
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">Restricted access</p>
          </header>

          <div className="max-w-md">
            <div className="mb-8 space-y-1">
              <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">Authentication required</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              {loginError && (
                <div className="px-4 py-3 border border-theme-text-primary/30 text-theme-text-secondary text-xs uppercase tracking-widest">
                  {loginError}
                </div>
              )}

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full px-4 py-3 border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary font-bold hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
              >
                <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-theme-text-primary/10" />
                <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">or</span>
                <div className="flex-1 border-t border-theme-text-primary/10" />
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-4 py-3 border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary font-mono text-sm focus:outline-none focus:border-theme-text-primary transition-colors"
              />

              <button
                type="submit"
                className="w-full px-4 py-3 border border-theme-text-primary/30 bg-theme-text-primary text-theme-bg-primary font-bold uppercase tracking-widest text-xs hover:bg-theme-text-secondary transition-colors"
              >
                Login with Password
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
      <Head>
        <title>Admin Panel - BoilerFuel</title>
        <meta name="description" content="Manage foods, exercises, and view statistics" />
      </Head>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-10">

        {/* Header */}
        <header className="space-y-4 border-b border-theme-text-primary/10 pb-10">
          <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
            &larr; Back
          </Link>
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-[0.2em]">Admin</h1>
              <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">Manage application data</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary hover:text-theme-text-primary hover:border-theme-text-primary transition-colors text-xs uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-px border border-theme-text-primary/20 w-fit">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'stats'
                ? 'bg-theme-text-primary text-theme-bg-primary'
                : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('accuracy')}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'accuracy'
                ? 'bg-theme-text-primary text-theme-bg-primary'
                : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
            }`}
          >
            ✅ Accuracy
          </button>
          <button
            onClick={() => setActiveTab('foods')}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'foods'
                ? 'bg-theme-text-primary text-theme-bg-primary'
                : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
            }`}
          >
            Foods
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'exercises'
                ? 'bg-theme-text-primary text-theme-bg-primary'
                : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
            }`}
          >
            Exercises
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'accuracy' && <MenuAccuracyTab />}
          {activeTab === 'foods' && <FoodsTab />}
          {activeTab === 'exercises' && <ExercisesTab />}
        </div>

        {/* Footer */}
        <footer className="border-t border-theme-text-primary/10 pt-6 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel</span>
          <span className="text-[10px] text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}

function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 2);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

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
      setLoading(true);
      setError('');
      const data = await apiCall(
        `/api/admin/menu-compare?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
        { method: 'GET' },
        { requireAdmin: true }
      );
      setReport(data || null);
    } catch (err) {
      setError(err.message || 'Failed to run comparison');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runComparison();
  }, []);

  const groupedByDate = useMemo(() => {
    if (!report?.results) return {};
    return report.results.reduce((acc, item) => {
      acc[item.date] ||= [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [report]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Accuracy</h2>
          <p className="text-theme-text-tertiary">Compare site data to Purdue menus (API + snapshots)</p>
        </div>
        <button
          onClick={runComparison}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-green-500 text-slate-900 font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Running...' : 'Run Comparison'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border-primary">
          <label className="block text-sm text-theme-text-tertiary mb-2">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-theme-border-primary bg-theme-bg-tertiary"
          />
        </div>
        <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border-primary">
          <label className="block text-sm text-theme-text-tertiary mb-2">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-theme-border-primary bg-theme-bg-tertiary"
          />
        </div>
        <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border-primary">
          <label className="block text-sm text-theme-text-tertiary mb-2">Summary</label>
          {report?.summary ? (
            <div className="text-sm space-y-1">
              <div>Missing: <span className="font-semibold">{report.summary.total_missing}</span></div>
              <div>Extra: <span className="font-semibold">{report.summary.total_extra}</span></div>
              <div>Nutrition mismatches: <span className="font-semibold">{report.summary.total_nutrition_mismatches}</span></div>
            </div>
          ) : (
            <div className="text-sm text-theme-text-tertiary">Run comparison to see results</div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-400">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="text-center py-10 text-theme-text-tertiary">No report available</div>
      )}

      {report && (
        <div className="space-y-6">
          {Object.keys(groupedByDate).sort().map(date => (
            <div key={date} className="p-4 rounded-2xl bg-theme-bg-secondary border border-theme-border-primary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{date}</h3>
                <span className="text-xs text-theme-text-tertiary">Range source: {report.range?.start} → {report.range?.end}</span>
              </div>
              <div className="space-y-3">
                {groupedByDate[date].map((item, idx) => {
                  const hasMismatches = item.status === 'open' && (item.missing_count > 0 || item.extra_count > 0 || item.nutrition_mismatch_count > 0);
                  const borderColor = hasMismatches ? 'border-red-500/50' : 'border-theme-border-primary';
                  const itemKey = `${date}-${item.court_code}-${idx}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const PREVIEW_LIMIT = 3;
                  
                  return (
                  <div key={`${item.court_code}-${idx}`} className={`p-3 rounded-xl bg-theme-bg-primary border ${borderColor}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">{item.display_name}</div>
                      <div className="text-xs text-theme-text-tertiary">Source: {item.source}</div>
                    </div>
                    {item.status !== 'open' ? (
                      <div className="text-sm text-theme-text-tertiary mt-1">
                        {item.status === 'closed' ? `Closed: ${item.reason}` : `Error: ${item.error}`}
                      </div>
                    ) : (
                      <div className="text-sm text-theme-text-tertiary mt-1">
                        Coverage: <span className={`font-semibold ${item.coverage_percent === 100 ? 'text-green-400' : 'text-yellow-400'}`}>{item.coverage_percent}%</span> • API {item.api_count} • DB {item.db_count} • <span className={item.missing_count > 0 ? 'text-red-400 font-semibold' : ''}>Missing {item.missing_count}</span> • <span className={item.extra_count > 0 ? 'text-yellow-400 font-semibold' : ''}>Extra {item.extra_count}</span> • Nutrition {item.nutrition_mismatch_count}
                      </div>
                    )}
                    {item.missing?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-red-400 mb-1">Missing in DB ({item.missing_count}):</div>
                        <div className="text-xs text-red-400/80 space-y-0.5">
                          {(isExpanded ? item.missing : item.missing.slice(0, PREVIEW_LIMIT)).map((missingItem, i) => (
                            <div key={i}>• {missingItem}</div>
                          ))}
                          {item.missing.length > PREVIEW_LIMIT && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedItems);
                                if (isExpanded) newSet.delete(itemKey);
                                else newSet.add(itemKey);
                                setExpandedItems(newSet);
                              }}
                              className="text-red-300 hover:text-red-200 underline"
                            >
                              {isExpanded ? '▲ Show less' : `▼ Show ${item.missing.length - PREVIEW_LIMIT} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {item.extra?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-yellow-400 mb-1">Extra in DB ({item.extra_count}):</div>
                        <div className="text-xs text-yellow-300/80 space-y-0.5">
                          {(isExpanded ? item.extra : item.extra.slice(0, PREVIEW_LIMIT)).map((extraItem, i) => (
                            <div key={i}>• {extraItem}</div>
                          ))}
                          {item.extra.length > PREVIEW_LIMIT && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedItems);
                                if (isExpanded) newSet.delete(itemKey);
                                else newSet.add(itemKey);
                                setExpandedItems(newSet);
                              }}
                              className="text-yellow-300 hover:text-yellow-200 underline"
                            >
                              {isExpanded ? '▲ Show less' : `▼ Show ${item.extra.length - PREVIEW_LIMIT} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Stats Tab Component
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

        const foodStats = {
          total: foods?.length || 0,
          diningCourts: [...new Set(foods?.map(f => f.dining_court).filter(Boolean))].length,
          avgCalories: foods?.length ? Math.round(foods.reduce((sum, f) => sum + (f.calories || 0), 0) / foods.length) : 0,
        };

        const activityStats = {
          total: activities?.length || 0,
          categories: [...new Set(activities?.map(a => a.category).filter(Boolean))].length,
          avgCalories: activities?.length ? Math.round(activities.reduce((sum, a) => sum + (a.calories_per_hour || 0), 0) / activities.length) : 0,
        };

        setStats({ foods: foodStats, activities: activityStats });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-theme-text-tertiary">Failed to load statistics</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Database Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food Stats */}
        <div className="p-6 rounded-2xl bg-theme-bg-secondary border border-theme-border-primary card-glow glow-yellow">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🍽️</span>
            <h3 className="text-xl font-bold">Food Database</h3>
          </div>
          <div className="space-y-4">
            <StatItem label="Total Foods" value={stats.foods.total} />
            <StatItem label="Dining Courts" value={stats.foods.diningCourts} />
            <StatItem label="Avg Calories" value={`${stats.foods.avgCalories} cal`} />
          </div>
        </div>

        {/* Activity Stats */}
        <div className="p-6 rounded-2xl bg-theme-bg-secondary border border-theme-border-primary card-glow glow-orange">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">💪</span>
            <h3 className="text-xl font-bold">Exercise Database</h3>
          </div>
          <div className="space-y-4">
            <StatItem label="Total Exercises" value={stats.activities.total} />
            <StatItem label="Categories" value={stats.activities.categories} />
            <StatItem label="Avg Calories/hr" value={`${stats.activities.avgCalories} cal`} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link
          href="/admin-scraper"
          className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 transition-colors group card-glow glow-blue"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg mb-1">🔄 Scrape Menus</h4>
              <p className="text-sm text-theme-text-tertiary">Import dining hall menus</p>
            </div>
            <svg className="w-6 h-6 text-theme-text-tertiary group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/settings"
          className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500 transition-colors group card-glow glow-purple"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg mb-1">⚙️ Settings</h4>
              <p className="text-sm text-theme-text-tertiary">Configure app settings</p>
            </div>
            <svg className="w-6 h-6 text-theme-text-tertiary group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-primary">
      <span className="text-theme-text-secondary">{label}</span>
      <span className="text-xl font-bold text-theme-text-primary">{value}</span>
    </div>
  );
}

// Foods Tab Component
function FoodsTab() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    try {
      setLoading(true);
      const data = await apiCall('/api/foods');
      setFoods(data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await deleteFood(id);
      await loadFoods();
    } catch (err) {
      setError(err.message || 'Failed to delete food');
    }
  }

  const filteredFoods = useMemo(() => {
    return foods.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.dining_court?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [foods, searchTerm]);

  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFoods.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFoods, currentPage]);

  const totalPages = Math.ceil(filteredFoods.length / ITEMS_PER_PAGE);

  if (loading) {
    return <div className="text-center py-12">Loading foods...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Food Database ({filteredFoods.length})</h2>
        <Link
          href="/admin-scraper"
          className="px-4 py-2 rounded-xl bg-blue-500 text-slate-900 font-semibold hover:bg-blue-600 transition-colors"
        >
          + Add Food
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search foods..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full px-4 py-3 rounded-xl border border-theme-border-primary bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />

      {/* Foods List */}
      <div className="space-y-2">
        {paginatedFoods.map(food => {
          const nextAvailable = food.next_available || [];
          const upcoming = nextAvailable.slice(0, 7); // Show up to next 7 occurrences

          return (
            <div
              key={food.id}
              className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border-primary hover:border-yellow-500 transition-colors card-glow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold">{food.name}</h3>
                  <p className="text-sm text-theme-text-tertiary">
                    {food.calories} cal • {food.dining_court} • {food.meal_time}
                  </p>
                  {upcoming.length > 0 && (
                    <div className="mt-2 text-xs text-purple-400">
                      <span className="font-semibold">📅 Next 7 days: </span>
                      {upcoming.map((slot, idx) => {
                        const date = new Date(slot.date);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        let dayLabel;
                        if (date.toDateString() === today.toDateString()) {
                          dayLabel = 'Today';
                        } else if (date.toDateString() === tomorrow.toDateString()) {
                          dayLabel = 'Tomorrow';
                        } else {
                          dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        }

                        return (
                          <span key={idx} className="inline-block mr-2">
                            {dayLabel} ({slot.meal_time})
                            {idx < upcoming.length - 1 && ', '}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(food.id, food.name)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm whitespace-nowrap"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-theme-bg-tertiary disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-theme-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-theme-bg-tertiary disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// Exercises Tab Component
function ExercisesTab() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await apiCall('/api/activities');
      setActivities(data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await deleteActivity(id);
      await loadActivities();
    } catch (err) {
      setError(err.message || 'Failed to delete exercise');
    }
  }

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activities, searchTerm, filterCategory]);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

  if (loading) {
    return <div className="text-center py-12">Loading exercises...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exercise Database ({filteredActivities.length})</h2>
        <Link
          href="/admin-exercises"
          className="px-4 py-2 rounded-xl bg-orange-500 text-slate-900 font-semibold hover:bg-orange-600 transition-colors"
        >
          + Add Exercise
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 px-4 py-3 rounded-xl border border-theme-border-primary bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 rounded-xl border border-theme-border-primary bg-theme-bg-tertiary"
        >
          <option value="all">All Categories</option>
          <option value="cardio">Cardio</option>
          <option value="strength">Strength</option>
          <option value="flexibility">Flexibility</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Exercises List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedActivities.map(activity => (
          <div
            key={activity.id}
            className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border-primary hover:border-orange-500 transition-colors card-glow glow-orange"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{activity.name}</h3>
                <p className="text-sm text-theme-text-tertiary">
                  {activity.calories_per_hour} cal/hr • {activity.category || 'other'} • {activity.intensity || 'moderate'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(activity.id, activity.name)}
                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
            {activity.description && (
              <p className="text-xs text-theme-text-tertiary mt-2">{activity.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-theme-bg-tertiary disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-theme-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-theme-bg-tertiary disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
