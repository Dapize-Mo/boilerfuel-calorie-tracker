import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import {
  adminLogin,
  apiCall,
  deleteFood,
  getAdminToken,
  logoutAdmin,
  setAdminToken,
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

  useEffect(() => {
    async function bootstrap() {
      if (session?.user) {
        setAuthenticated(true);
        // Exchange Google session for admin JWT so API calls work
        try {
          const res = await fetch('/api/admin/google-token', { method: 'POST' });
          if (res.ok) {
            const { token } = await res.json();
            if (token) setAdminToken(token);
          }
        } catch {
          // User is still authenticated via Google session
        }
        setLoading(false);
        return;
      }

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
    if (session?.user) {
      await signOut({ redirect: false });
    }
    await logoutAdmin();
    setAuthenticated(false);
    setActiveTab('stats');
  }

  async function handleGoogleSignIn() {
    try {
      await signIn('google', { redirect: false });
    } catch {
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

          <div className="max-w-md space-y-6">
            <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">Authentication required</p>

            <form onSubmit={handleLogin} className="space-y-3">
              {loginError && (
                <div className="border border-theme-text-primary/30 px-4 py-3 text-xs uppercase tracking-widest text-theme-text-secondary">
                  {loginError}
                </div>
              )}

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
          {[
            { key: 'stats', label: 'Stats' },
            { key: 'accuracy', label: 'Accuracy' },
            { key: 'foods', label: 'Foods' },
            { key: 'docs', label: 'Docs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab.key
                  ? 'bg-theme-text-primary text-theme-bg-primary'
                  : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'accuracy' && <MenuAccuracyTab />}
          {activeTab === 'foods' && <FoodsTab />}
          {activeTab === 'docs' && <DocsTab />}
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

// ── Docs Tab ──
function DocsTab() {
  const [open, setOpen] = useState({});
  const toggle = (k) => setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  const Section = ({ id, title, children }) => (
    <div className="border border-theme-text-primary/10">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-theme-bg-secondary transition-colors text-left"
      >
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-primary">{title}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="text-theme-text-tertiary shrink-0"
          style={{ transform: open[id] ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open[id] && <div className="px-5 pb-5 space-y-4 border-t border-theme-text-primary/10">{children}</div>}
    </div>
  );

  const kv = (label, value) => (
    <div className="flex gap-4 text-xs">
      <span className="shrink-0 w-44 text-theme-text-tertiary font-mono">{label}</span>
      <span className="text-theme-text-secondary">{value}</span>
    </div>
  );

  const code = (txt) => (
    <code className="block bg-theme-bg-secondary border border-theme-text-primary/10 px-3 py-2 text-[11px] font-mono text-theme-text-secondary whitespace-pre-wrap break-all">{txt}</code>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-theme-text-primary/10 pb-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">System Documentation</h2>
        <p className="text-[10px] text-theme-text-tertiary/60 mt-1">Architecture, database schema, and API reference for BoilerFuel.</p>
      </div>

      <Section id="arch" title="Frontend Architecture">
        <div className="space-y-3 text-xs text-theme-text-secondary leading-relaxed">
          <p><strong className="text-theme-text-primary">Framework:</strong> Next.js (pages router, no App Router). All pages in <code className="font-mono bg-theme-bg-secondary px-1">frontend/pages/</code>. Every page uses <code className="font-mono bg-theme-bg-secondary px-1">Page.getLayout = (page) =&gt; page</code> to bypass the Layout component (currently unused).</p>
          <p><strong className="text-theme-text-primary">State:</strong> MealContext (<code className="font-mono bg-theme-bg-secondary px-1">context/MealContext.js</code>) holds all user data — meals by date, goals, water, weight, favorites, templates, dietary prefs. All persisted to localStorage. Synced to server when Device Sync is enabled (encrypted blob).</p>
          <p><strong className="text-theme-text-primary">Theming:</strong> CSS variables defined in <code className="font-mono bg-theme-bg-secondary px-1">styles/globals.css</code> under <code className="font-mono bg-theme-bg-secondary px-1">:root</code> (light) and <code className="font-mono bg-theme-bg-secondary px-1">.dark</code>. Tailwind classes map to these via <code className="font-mono bg-theme-bg-secondary px-1">tailwind.config.js</code> theme extension (e.g. <code className="font-mono bg-theme-bg-secondary px-1">bg-theme-bg-primary</code>).</p>
          <p><strong className="text-theme-text-primary">PWA:</strong> Service worker (<code className="font-mono bg-theme-bg-secondary px-1">public/sw.js</code>) handles offline caching. <code className="font-mono bg-theme-bg-secondary px-1">manifest.json</code> in public/. iOS install prompt uses <code className="font-mono bg-theme-bg-secondary px-1">beforeinstallprompt</code> (Android) or manual Safari share flow (iOS).</p>
          <p><strong className="text-theme-text-primary">Auth:</strong> NextAuth.js with Google OAuth for admin access. Admin JWT (<code className="font-mono bg-theme-bg-secondary px-1">boilerfuel_admin_token</code>) stored in localStorage, exchanged via <code className="font-mono bg-theme-bg-secondary px-1">/api/admin/google-token</code> on each admin page load.</p>
        </div>
      </Section>

      <Section id="db" title="Database Schema">
        <div className="space-y-4 text-xs text-theme-text-secondary">
          <p className="leading-relaxed">PostgreSQL (Neon serverless). Schema auto-created via <code className="font-mono bg-theme-bg-secondary px-1">utils/db.js:ensureSchema()</code> on first API call.</p>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-theme-text-primary mb-1">foods</p>
              {code(`id            SERIAL PRIMARY KEY
name          TEXT NOT NULL
calories      INTEGER
dining_court  TEXT          -- location name (e.g. "Ford", "Wiley")
station       TEXT          -- station within dining court
meal_time     TEXT          -- "Breakfast", "Lunch", "Dinner", etc.
macros        JSONB         -- { protein, carbs, fats, fiber, sugar, sodium, ... }
allergens     TEXT[]        -- e.g. ["Wheat", "Milk"]
dietary_flags TEXT[]        -- e.g. ["Vegetarian", "Vegan"]
source        TEXT          -- "hfs" | "retail" | "custom"
created_at    TIMESTAMPTZ`)}
            </div>
            <div>
              <p className="font-bold text-theme-text-primary mb-1">menu_snapshots</p>
              {code(`id            SERIAL PRIMARY KEY
menu_date     DATE NOT NULL  -- date the menu is valid for
name          TEXT NOT NULL
calories      INTEGER
dining_court  TEXT
station       TEXT
meal_time     TEXT
macros        JSONB
allergens     TEXT[]
dietary_flags TEXT[]
source        TEXT
created_at    TIMESTAMPTZ
UNIQUE(menu_date, name, dining_court, meal_time)`)}
              <p className="text-[10px] text-theme-text-tertiary mt-1">Date-specific menus scraped from HFS API. Queried when a date param is passed to <code className="font-mono bg-theme-bg-secondary px-0.5">/api/foods</code>.</p>
            </div>
            <div>
              <p className="font-bold text-theme-text-primary mb-1">sync_data</p>
              {code(`device_id     TEXT PRIMARY KEY
encrypted_data TEXT NOT NULL  -- AES-GCM encrypted JSON blob
iv            TEXT NOT NULL   -- base64 IV
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ`)}
              <p className="text-[10px] text-theme-text-tertiary mt-1">Encrypted sync blobs. Server cannot read contents. Key never leaves device.</p>
            </div>
            <div>
              <p className="font-bold text-theme-text-primary mb-1">custom_foods</p>
              {code(`id            SERIAL PRIMARY KEY
user_id       TEXT NOT NULL   -- from JWT sub claim
name          TEXT NOT NULL
calories      INTEGER
macros        JSONB
serving_size  TEXT
notes         TEXT
created_at    TIMESTAMPTZ`)}
            </div>
            <div>
              <p className="font-bold text-theme-text-primary mb-1">feedback</p>
              {code(`id            SERIAL PRIMARY KEY
food_id       INTEGER REFERENCES foods(id)
issue         TEXT NOT NULL   -- "wrong_calories" | "wrong_macros" | "missing_allergen" | etc.
note          TEXT
created_at    TIMESTAMPTZ`)}
            </div>
          </div>
        </div>
      </Section>

      <Section id="api" title="API Reference">
        <div className="space-y-4 text-xs">
          {[
            { method: 'GET', path: '/api/foods', desc: 'Query food catalog or menu snapshots. Params: q (search), dining_court (comma-sep), meal_time, station, date (YYYY-MM-DD). Returns array of food objects.' },
            { method: 'GET', path: '/api/foods/[id]', desc: 'Get single food by ID.' },
            { method: 'GET', path: '/api/dining-courts', desc: 'Returns array of distinct dining_court strings present in foods table.' },
            { method: 'GET', path: '/api/retail-locations', desc: 'Returns Purdue Food Co retail restaurant list.' },
            { method: 'POST', path: '/api/feedback', desc: 'Submit accuracy feedback for a food item. Body: { food_id, issue, note }.' },
            { method: 'GET/POST/PUT/DELETE', path: '/api/custom-foods', desc: 'CRUD for user custom foods. Requires Bearer JWT (Google session). GET returns user\'s foods; POST creates; PUT /[id] updates; DELETE /[id] removes.' },
            { method: 'GET/POST', path: '/api/sync', desc: 'Device sync. POST stores encrypted blob; GET retrieves it. Requires device_id + passphrase-derived key (never sent to server).' },
            { method: 'POST', path: '/api/google-fit-export', desc: 'Export selected meals to Google Fit. Requires google_token in body. Writes com.google.nutrition data points.' },
            { method: 'GET', path: '/api/admin/stats', desc: 'Admin stats (food count, dining courts, avg calories). Requires admin JWT.' },
            { method: 'POST', path: '/api/admin/google-token', desc: 'Exchange NextAuth Google session for admin JWT. Returns { token }.' },
            { method: 'POST', path: '/api/admin/login', desc: 'Legacy password-based admin login. Returns JWT.' },
          ].map(e => (
            <div key={e.path} className="border border-theme-text-primary/10 p-4 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-theme-text-tertiary">{e.method}</span>
                <code className="font-mono text-theme-text-primary text-[11px]">{e.path}</code>
              </div>
              <p className="text-[10px] text-theme-text-tertiary leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="storage" title="localStorage Keys">
        <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5 text-xs">
          {[
            ['boilerfuel_meals', 'Object: { [YYYY-MM-DD]: meal[] }. Each meal has id, name, calories, macros, dining_court, station, meal_time, servings, addedAt.'],
            ['boilerfuel_goals', 'Object: calories, protein, carbs, fat, saturated_fat, fiber, sugar, sodium, cholesterol, added_sugar.'],
            ['boilerfuel_water', 'Object: { [YYYY-MM-DD]: number } — glasses per day.'],
            ['boilerfuel_weight', 'Object: { [YYYY-MM-DD]: number } — lbs/kg per day.'],
            ['boilerfuel_favorites', 'JSON array of food IDs.'],
            ['boilerfuel_templates', 'Array of { id, name, foods[], createdAt }.'],
            ['boilerfuel_dietary', 'Object: { vegetarian, vegan, excludeAllergens[] }.'],
            ['boilerfuel_sync_device_id', 'UUID for cross-device sync pairing.'],
            ['boilerfuel_sync_paired', '"1" if sync is active.'],
            ['boilerfuel_notif_meal', '"1" if meal reminders enabled.'],
            ['boilerfuel_notif_streak_hour', 'Hour (0–23) for streak reminder.'],
            ['boilerfuel_notif_breakfast_hour', 'Hour for breakfast reminder.'],
            ['boilerfuel_install-dismissed', '"1" if install PWA prompt dismissed.'],
            ['boilerfuel_admin_token', 'Admin JWT (short-lived). Auto-refreshed on admin page load.'],
          ].map(([key, desc]) => (
            <div key={key} className="px-4 py-3 space-y-0.5">
              <code className="text-[10px] font-mono text-theme-text-primary">{key}</code>
              <p className="text-[10px] text-theme-text-tertiary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="dataflow" title="Data Flow">
        <div className="space-y-3 text-xs text-theme-text-secondary leading-relaxed">
          <div className="border border-theme-text-primary/10 p-4 space-y-2">
            <p className="font-bold text-theme-text-primary uppercase tracking-wider text-[10px]">Menu Display</p>
            <p>User selects location + date → <code className="font-mono bg-theme-bg-secondary px-1">GET /api/foods?dining_court=Ford&date=2026-02-26</code> → server queries <code className="font-mono bg-theme-bg-secondary px-1">menu_snapshots</code> (date-specific) or <code className="font-mono bg-theme-bg-secondary px-1">foods</code> (general catalog) → response cached in localStorage under <code className="font-mono bg-theme-bg-secondary px-1">bf_menu_...</code> key for offline use.</p>
          </div>
          <div className="border border-theme-text-primary/10 p-4 space-y-2">
            <p className="font-bold text-theme-text-primary uppercase tracking-wider text-[10px]">Meal Logging</p>
            <p>User taps + on a food → <code className="font-mono bg-theme-bg-secondary px-1">MealContext.addMeal()</code> → appends to <code className="font-mono bg-theme-bg-secondary px-1">mealsByDate[today]</code> in React state → <code className="font-mono bg-theme-bg-secondary px-1">useEffect</code> persists to localStorage → if sync enabled, debounced push (3s) to <code className="font-mono bg-theme-bg-secondary px-1">POST /api/sync</code> with encrypted payload.</p>
          </div>
          <div className="border border-theme-text-primary/10 p-4 space-y-2">
            <p className="font-bold text-theme-text-primary uppercase tracking-wider text-[10px]">Device Sync Encryption</p>
            <p>User enters a passphrase → PBKDF2 (100k iterations, SHA-256) derives a 256-bit AES-GCM key in-browser → all localStorage data serialized to JSON → encrypted with random IV → only ciphertext + IV sent to server. Server stores opaque blob, cannot decrypt.</p>
          </div>
          <div className="border border-theme-text-primary/10 p-4 space-y-2">
            <p className="font-bold text-theme-text-primary uppercase tracking-wider text-[10px]">Menu Scraping</p>
            <p>HFS (Purdue Dining) menus are scraped via a scheduled job that calls the Purdue API and upserts into <code className="font-mono bg-theme-bg-secondary px-1">menu_snapshots</code>. Retail (Purdue Food Co) items are stored in the <code className="font-mono bg-theme-bg-secondary px-1">foods</code> table with <code className="font-mono bg-theme-bg-secondary px-1">source = &apos;retail&apos;</code> and always appear regardless of date filter.</p>
          </div>
        </div>
      </Section>

      <Section id="env" title="Environment Variables">
        <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
          {[
            ['DATABASE_URL', 'PostgreSQL connection string (Neon). Required for all API routes.'],
            ['ADMIN_PASSWORD_HASH', 'bcrypt hash of admin panel password (legacy login).'],
            ['JWT_SECRET', 'Secret for signing admin JWTs. Min 32 chars.'],
            ['NEXTAUTH_URL', 'Full URL of the site (e.g. https://boilerfuel.vercel.app). Required for NextAuth.'],
            ['NEXTAUTH_SECRET', 'Random secret for NextAuth session encryption.'],
            ['GOOGLE_CLIENT_ID', 'OAuth 2.0 client ID from Google Cloud Console.'],
            ['GOOGLE_CLIENT_SECRET', 'OAuth 2.0 client secret.'],
            ['NEXT_PUBLIC_SITE_URL', 'Public site URL for OG tags (same as NEXTAUTH_URL without trailing slash).'],
            ['NEXT_PUBLIC_API_URL', 'API base URL (usually same origin). Used for preconnect hint in _document.js.'],
          ].map(([key, desc]) => (
            <div key={key} className="px-4 py-3 space-y-0.5">
              <code className="text-[10px] font-mono text-theme-text-primary">{key}</code>
              <p className="text-[10px] text-theme-text-tertiary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

AdminPanel.getLayout = (page) => page;

// ── Stats Tab ──
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
            avgCalories: foods?.length ? Math.round(foods.reduce((sum, f) => sum + (f.calories || 0), 0) / foods.length) : 0,
          },
          activities: {
            total: activities?.length || 0,
            categories: [...new Set(activities?.map(a => a.category).filter(Boolean))].length,
            avgCalories: activities?.length ? Math.round(activities.reduce((sum, a) => sum + (a.calories_per_hour || 0), 0) / activities.length) : 0,
          },
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-12">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-12">Failed to load statistics</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
        Database Statistics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
        {/* Food Database */}
        <div className="bg-theme-bg-primary p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Food Database</div>
          <div className="divide-y divide-theme-text-primary/5">
            {[
              { label: 'Total Foods', value: stats.foods.total.toLocaleString() },
              { label: 'Dining Courts', value: stats.foods.diningCourts },
              { label: 'Avg Calories', value: `${stats.foods.avgCalories} cal` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3">
                <span className="text-xs text-theme-text-secondary">{s.label}</span>
                <span className="text-lg font-bold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise Database */}
        <div className="bg-theme-bg-primary p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Exercise Database</div>
          <div className="divide-y divide-theme-text-primary/5">
            {[
              { label: 'Total Exercises', value: stats.activities.total },
              { label: 'Categories', value: stats.activities.categories },
              { label: 'Avg Cal/hr', value: `${stats.activities.avgCalories} cal` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3">
                <span className="text-xs text-theme-text-secondary">{s.label}</span>
                <span className="text-lg font-bold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
          Quick Actions
        </h2>
        <div className="space-y-px border border-theme-text-primary/10">
          {[
            { href: '/admin-scraper', label: 'Scrape Menus', desc: 'Import dining hall menus' },
            { href: '/settings', label: 'Settings', desc: 'Configure app settings' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between px-4 py-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-theme-text-primary group-hover:text-theme-text-primary">{action.label}</div>
                <div className="text-[10px] text-theme-text-tertiary mt-0.5">{action.desc}</div>
              </div>
              <span className="text-theme-text-tertiary/40 group-hover:text-theme-text-tertiary transition-colors text-xs">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Menu Accuracy Tab ──
function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 2);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedByDate = useMemo(() => {
    if (!report?.results) return {};
    return report.results.reduce((acc, item) => {
      acc[item.date] ||= [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [report]);

  const PREVIEW_LIMIT = 3;

  return (
    <div className="space-y-8">
      {/* Header + Run */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-theme-text-primary/10 pb-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">Menu Accuracy</h2>
          <p className="text-xs text-theme-text-tertiary/60 mt-1">Compare site data to Purdue menus</p>
        </div>
        <button
          onClick={runComparison}
          disabled={loading}
          className="px-4 py-2 border border-theme-text-primary/30 bg-theme-text-primary text-theme-bg-primary font-bold uppercase tracking-widest text-xs hover:bg-theme-text-secondary transition-colors disabled:opacity-40"
        >
          {loading ? 'Running...' : 'Run Comparison'}
        </button>
      </div>

      {/* Date Range + Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
        <div className="bg-theme-bg-primary p-4 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 transition-colors"
          />
        </div>
        <div className="bg-theme-bg-primary p-4 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 transition-colors"
          />
        </div>
        <div className="bg-theme-bg-primary p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Summary</div>
          {report?.summary ? (
            <div className="divide-y divide-theme-text-primary/5">
              {[
                { label: 'Missing', value: report.summary.total_missing },
                { label: 'Extra', value: report.summary.total_extra },
                { label: 'Nutrition mismatches', value: report.summary.total_nutrition_mismatches },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1.5">
                  <span className="text-xs text-theme-text-tertiary">{s.label}</span>
                  <span className="text-xs font-bold tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-theme-text-tertiary/50 pt-2">Run comparison to see results</div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-theme-text-primary/30 px-4 py-3 text-xs text-theme-text-secondary">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-6">Running comparison...</div>
      )}

      {!report && !loading && !error && (
        <div className="text-xs text-theme-text-tertiary py-6">No report available. Click Run Comparison to start.</div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          {Object.keys(groupedByDate).sort().map(date => (
            <div key={date} className="space-y-2">
              <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary">{date}</h3>
                <span className="text-[10px] text-theme-text-tertiary/50">
                  {report.range?.start} &rarr; {report.range?.end}
                </span>
              </div>
              <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                {groupedByDate[date].map((item, idx) => {
                  const itemKey = `${date}-${item.court_code}-${idx}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const hasMismatches = item.status === 'open' && (item.missing_count > 0 || item.extra_count > 0 || item.nutrition_mismatch_count > 0);

                  return (
                    <div key={`${item.court_code}-${idx}`} className={`px-4 py-3 ${hasMismatches ? 'bg-theme-text-primary/[0.02]' : ''}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">{item.display_name}</span>
                        <span className="text-[10px] text-theme-text-tertiary/50 uppercase tracking-wider">src: {item.source}</span>
                      </div>

                      {item.status !== 'open' ? (
                        <div className="text-[10px] text-theme-text-tertiary mt-1">
                          {item.status === 'closed' ? `Closed — ${item.reason}` : `Error — ${item.error}`}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-4 mt-1 text-[10px] font-mono text-theme-text-tertiary">
                          <span>Coverage <span className="font-bold text-theme-text-primary">{item.coverage_percent}%</span></span>
                          <span>API <span className="font-bold">{item.api_count}</span></span>
                          <span>DB <span className="font-bold">{item.db_count}</span></span>
                          <span>Missing <span className={`font-bold ${item.missing_count > 0 ? 'text-theme-text-primary' : 'text-theme-text-tertiary/50'}`}>{item.missing_count}</span></span>
                          <span>Extra <span className={`font-bold ${item.extra_count > 0 ? 'text-theme-text-primary' : 'text-theme-text-tertiary/50'}`}>{item.extra_count}</span></span>
                          <span>Nutrition <span className="font-bold">{item.nutrition_mismatch_count}</span></span>
                        </div>
                      )}

                      {item.missing?.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          <div className="text-[10px] uppercase tracking-wider text-theme-text-tertiary">Missing in DB ({item.missing_count})</div>
                          <div className="text-[10px] text-theme-text-secondary space-y-0.5 pl-2 border-l border-theme-text-primary/20">
                            {(isExpanded ? item.missing : item.missing.slice(0, PREVIEW_LIMIT)).map((m, i) => (
                              <div key={i}>{m}</div>
                            ))}
                            {item.missing.length > PREVIEW_LIMIT && (
                              <button
                                onClick={() => {
                                  const s = new Set(expandedItems);
                                  isExpanded ? s.delete(itemKey) : s.add(itemKey);
                                  setExpandedItems(s);
                                }}
                                className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors underline"
                              >
                                {isExpanded ? 'Show less' : `+${item.missing.length - PREVIEW_LIMIT} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {item.extra?.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          <div className="text-[10px] uppercase tracking-wider text-theme-text-tertiary">Extra in DB ({item.extra_count})</div>
                          <div className="text-[10px] text-theme-text-secondary space-y-0.5 pl-2 border-l border-theme-text-primary/20">
                            {(isExpanded ? item.extra : item.extra.slice(0, PREVIEW_LIMIT)).map((e, i) => (
                              <div key={i}>{e}</div>
                            ))}
                            {item.extra.length > PREVIEW_LIMIT && (
                              <button
                                onClick={() => {
                                  const s = new Set(expandedItems);
                                  isExpanded ? s.delete(itemKey) : s.add(itemKey);
                                  setExpandedItems(s);
                                }}
                                className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors underline"
                              >
                                {isExpanded ? 'Show less' : `+${item.extra.length - PREVIEW_LIMIT} more`}
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

// ── Foods Tab ──
function FoodsTab() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => { loadFoods(); }, []);

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

  const filteredFoods = useMemo(() => foods.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.dining_court?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [foods, searchTerm]);

  const totalPages = Math.ceil(filteredFoods.length / ITEMS_PER_PAGE);
  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFoods.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFoods, currentPage]);

  if (loading) {
    return <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
          Food Database <span className="font-normal">({filteredFoods.length.toLocaleString()})</span>
        </h2>
        <Link
          href="/admin-scraper"
          className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors border-b border-theme-text-primary/20"
        >
          + Add Food
        </Link>
      </div>

      {error && (
        <div className="border border-theme-text-primary/30 px-4 py-3 text-xs text-theme-text-secondary">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or dining court..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono placeholder:text-theme-text-tertiary/50 focus:outline-none focus:border-theme-text-primary/50 transition-colors pl-8"
        />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-tertiary">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Foods list */}
      <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
        {paginatedFoods.length === 0 ? (
          <div className="px-4 py-6 text-xs text-theme-text-tertiary text-center">
            {searchTerm ? `No foods matching "${searchTerm}"` : 'No foods found'}
          </div>
        ) : paginatedFoods.map(food => {
          const upcoming = (food.next_available || []).slice(0, 7);
          return (
            <div key={food.id} className="px-4 py-3 hover:bg-theme-bg-secondary transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{food.name}</p>
                  <p className="text-[10px] text-theme-text-tertiary mt-0.5">
                    {food.calories} cal &middot; {food.dining_court} &middot; {food.meal_time}
                  </p>
                  {upcoming.length > 0 && (
                    <p className="text-[10px] text-theme-text-tertiary/60 mt-0.5">
                      {upcoming.map((slot, idx) => {
                        const date = new Date(slot.date);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        let label;
                        if (date.toDateString() === today.toDateString()) label = 'Today';
                        else if (date.toDateString() === tomorrow.toDateString()) label = 'Tomorrow';
                        else label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        return `${label} (${slot.meal_time})${idx < upcoming.length - 1 ? ', ' : ''}`;
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(food.id, food.name)}
                  className="text-[10px] uppercase tracking-wider text-theme-text-tertiary/40 hover:text-theme-text-primary transition-colors shrink-0 pt-0.5"
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
        <div className="flex items-center justify-center gap-6 text-xs uppercase tracking-wider">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-theme-text-tertiary hover:text-theme-text-primary disabled:opacity-30 transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-theme-text-tertiary">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-theme-text-tertiary hover:text-theme-text-primary disabled:opacity-30 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

