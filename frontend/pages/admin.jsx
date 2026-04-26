import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSmartBack } from '../utils/useSmartBack';
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
  const router = useRouter();
  const goBack = useSmartBack();
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
            <button onClick={goBack} className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </button>
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
        <title>Admin Panel — BoilerFuel</title>
        <meta name="description" content="BoilerFuel admin panel — manage foods and view site statistics." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="relative overflow-hidden max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_45%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_38%)]" />
        <div className="pointer-events-none absolute -left-24 top-28 -z-10 h-64 w-64 rounded-full bg-theme-text-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-72 -z-10 h-72 w-72 rounded-full bg-theme-text-primary/5 blur-3xl" />

        {/* Header */}
        <header className="space-y-6 border border-theme-text-primary/10 bg-theme-bg-secondary/80 backdrop-blur-sm p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <button onClick={goBack} className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
            &larr; Back
          </button>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-theme-text-tertiary">
                <span className="border border-theme-text-primary/10 px-2 py-1">Control Center</span>
                <span className="border border-theme-text-primary/10 px-2 py-1">Live data</span>
                <span className="border border-theme-text-primary/10 px-2 py-1">No public exposure</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-[0.2em]">Admin</h1>
              <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">Manage application data</p>
              <p className="max-w-2xl text-sm text-theme-text-secondary leading-relaxed">
                Inspect menu health, scrape fresh items, and read the operational docs that explain how BoilerFuel stays fast,
                private, and resilient across devices.
              </p>
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
            { key: 'design', label: 'Design' },
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
          {activeTab === 'foods' && <FoodsTab onOpenScraper={() => setActiveTab('stats')} />}
          {activeTab === 'design' && <DesignTab />}
          {activeTab === 'docs' && <DocsTab />}
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
            <Link href="/privacy" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Privacy</Link>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel · {new Date().getFullYear()}</span>
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
      <div className="border-b border-theme-text-primary/10 pb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">System Documentation</h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-theme-text-tertiary/50 border border-theme-text-primary/10 px-2 py-1">Admin only</span>
        </div>
        <p className="text-[10px] text-theme-text-tertiary/60 max-w-3xl leading-relaxed">
          Architecture, product intent, and operational reference for BoilerFuel. Use this section to understand how the app is
          assembled, how sync behaves, and what to inspect when something looks off.
        </p>
      </div>

      <Section id="about" title="About BoilerFuel">
        <div className="space-y-4 text-xs text-theme-text-secondary leading-relaxed">
          <p>
            BoilerFuel is a privacy-first Purdue dining tracker that keeps meal logging fast, local, and low-friction. Users can
            browse dining hall menus, log meals with a single click, and review calories, macros, water, weight, and nutrition
            trends without creating an account.
          </p>
          <p>
            The core idea is simple: the browser holds the user&apos;s data, and the server only stores what it needs to serve menus,
            admin operations, and encrypted sync blobs. That keeps the app lightweight while still supporting recovery, offline
            usage, and cross-device continuity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
            {[
              { label: 'Primary goal', value: 'Make meal logging faster than opening a notes app.' },
              { label: 'Data model', value: 'Local-first state with optional encrypted device sync.' },
              { label: 'Ops focus', value: 'Keep menus fresh, errors visible, and admin actions auditable.' },
            ].map(item => (
              <div key={item.label} className="bg-theme-bg-primary p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-theme-text-tertiary">{item.label}</div>
                <p className="text-xs text-theme-text-secondary leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="border border-theme-text-primary/10 bg-theme-bg-secondary p-4 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-theme-text-primary">What makes it different</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-theme-text-secondary">
              {[
                'No account wall before the first meal is logged',
                'Encrypted sync uses a shared passphrase instead of a user profile',
                'Menu filters are tuned for real campus dining choices',
                'Admin tools are built to keep stale or wrong food data easy to fix',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-theme-text-primary/40 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

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

// ── Design Tab ──
function DesignTab() {
  const [currentLayout, setCurrentLayout] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('boilerfuel_drinks_layout') || 'sidebar';
    return 'sidebar';
  });

  function applyLayout(value) {
    localStorage.setItem('boilerfuel_drinks_layout', value);
    setCurrentLayout(value);
  }

  const layouts = [
    {
      key: 'sidebar',
      label: 'Always-Visible Sidebar',
      tag: 'Recommended',
      description: 'Water tracker + condiments always visible on the right. Beverages section appears below when menu data has drinks. Sidebar never disappears.',
    },
    {
      key: 'strip',
      label: 'Horizontal Strip',
      tag: 'Compact',
      description: 'Compact inline row above the food table: water counter + ketchup/BBQ chips + available beverages. No sidebar column, food list uses full width.',
    },
    {
      key: 'floating',
      label: 'Floating Panel',
      tag: 'Minimal',
      description: 'Small floating button in the bottom-right corner. Tap to expand a card with water, condiments, and beverages. Food list is full-width on all screen sizes.',
    },
    {
      key: 'legacy',
      label: 'Legacy + Condiments',
      tag: 'Original',
      description: 'Current sidebar behavior: only shown when the menu has beverage items. Condiments added at the bottom. Sidebar hides when no drinks are in menu data.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border border-theme-text-primary/10 bg-theme-bg-secondary/20 p-6 sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-primary mb-1">Drinks & Extras Layout</h2>
        <p className="text-xs text-theme-text-tertiary mb-6 leading-relaxed">
          Choose how water tracking, condiments (ketchup/BBQ sauce), and beverages appear on the food list page.
          Changes take effect immediately — visit the home page to preview.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {layouts.map(layout => (
            <button
              key={layout.key}
              onClick={() => applyLayout(layout.key)}
              className={`text-left p-5 border transition-all ${
                currentLayout === layout.key
                  ? 'border-theme-text-primary bg-theme-text-primary/[0.04]'
                  : 'border-theme-text-primary/20 hover:border-theme-text-primary/60 hover:bg-theme-bg-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-text-primary leading-tight">{layout.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentLayout === layout.key && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 border border-yellow-500/30">Active</span>
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary/60 border border-theme-text-primary/10 px-1.5 py-0.5">{layout.tag}</span>
                </div>
              </div>
              <p className="text-xs text-theme-text-tertiary leading-relaxed">{layout.description}</p>
            </button>
          ))}
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
        >
          Open home page to preview &rarr;
        </Link>
      </div>
    </div>
  );
}

// ── Scrape Progress Panel ──
function ScrapeProgressPanel({ data }) {
  if (!data) {
    return (
      <div className="px-4 py-3 bg-theme-bg-secondary border-t border-theme-text-primary/10">
        <div className="text-[10px] text-theme-text-tertiary animate-pulse">Waiting for workflow to start...</div>
      </div>
    );
  }

  if (data.status === 'unknown') {
    return (
      <div className="px-4 py-3 bg-theme-bg-secondary border-t border-theme-text-primary/10">
        <div className="text-[10px] text-theme-text-tertiary">{data.message || 'Unable to fetch status'}</div>
      </div>
    );
  }

  const formatElapsed = (seconds) => {
    if (!seconds || seconds < 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const stepIcon = (step) => {
    if (step.status === 'completed') {
      return step.conclusion === 'success'
        ? <span className="text-green-500">&#10003;</span>
        : step.conclusion === 'skipped'
          ? <span className="text-theme-text-tertiary/40">&#8212;</span>
          : <span className="text-red-400">&#10007;</span>;
    }
    if (step.status === 'in_progress') {
      return <span className="text-yellow-400 animate-pulse">&#9679;</span>;
    }
    return <span className="text-theme-text-tertiary/20">&#9675;</span>;
  };

  const stepDuration = (step) => {
    if (!step.started_at) return '';
    const end = step.completed_at ? new Date(step.completed_at) : new Date();
    const secs = Math.round((end - new Date(step.started_at)) / 1000);
    return formatElapsed(secs);
  };

  const isRunning = data.status === 'in_progress' || data.status === 'queued';

  return (
    <div className="bg-theme-bg-secondary border-t border-theme-text-primary/10">
      {/* Header bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-theme-text-primary/5">
        <div className="flex items-center gap-2 text-[10px]">
          {isRunning ? (
            <span className="text-yellow-400 animate-pulse">&#9679; {data.status === 'queued' ? 'Queued' : 'Running'}</span>
          ) : (
            <span className={data.conclusion === 'success' ? 'text-green-500' : 'text-red-400'}>
              {data.conclusion === 'success' ? '&#10003; Completed' : `&#10007; ${data.conclusion || 'Failed'}`}
            </span>
          )}
          {data.total_steps && (
            <span className="text-theme-text-tertiary">
              Step {data.completed_steps}/{data.total_steps}
            </span>
          )}
          {data.elapsed_seconds != null && (
            <span className="text-theme-text-tertiary">{formatElapsed(data.elapsed_seconds)}</span>
          )}
        </div>
        {data.html_url && (
          <a
            href={data.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-theme-text-tertiary hover:text-theme-text-secondary transition-colors"
          >
            View on GitHub &rarr;
          </a>
        )}
      </div>
      {/* Steps list */}
      {data.steps && data.steps.length > 0 && (
        <div className="px-4 py-2 space-y-1">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-[10px] font-mono ${
                step.status === 'in_progress'
                  ? 'text-theme-text-primary'
                  : step.status === 'completed'
                    ? 'text-theme-text-tertiary'
                    : 'text-theme-text-tertiary/40'
              }`}
            >
              <span className="w-3 text-center flex-shrink-0">{stepIcon(step)}</span>
              <span className="flex-1 truncate">{step.name}</span>
              <span className="text-theme-text-tertiary/40 tabular-nums">{stepDuration(step)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stats Tab ──
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  const [dbStatsLoading, setDbStatsLoading] = useState(true);
  const [retailScrapeStatus, setRetailScrapeStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [retailScrapeMsg, setRetailScrapeMsg] = useState('');
  const [hfsScrapeStatus, setHfsScrapeStatus] = useState(null);
  const [hfsScrapeMsg, setHfsScrapeMsg] = useState('');
  const [hfsExpanded, setHfsExpanded] = useState(false);
  const [hfsRunData, setHfsRunData] = useState(null);
  const hfsPollRef = useRef(null);
  const [cleanupStatus, setCleanupStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [cleanupResult, setCleanupResult] = useState(null);

  const pollScrapeStatus = useCallback(async () => {
    try {
      const data = await apiCall('/api/admin/scrape-status', {}, { requireAdmin: true });
      setHfsRunData(data);
      if (data.status === 'completed') {
        clearInterval(hfsPollRef.current);
        hfsPollRef.current = null;
        setHfsScrapeStatus(data.conclusion === 'success' ? 'ok' : 'error');
        setHfsScrapeMsg(data.conclusion === 'success' ? 'Scrape completed successfully' : `Scrape failed (${data.conclusion})`);
      } else if (data.status === 'in_progress') {
        setHfsScrapeStatus('ok');
        setHfsScrapeMsg(data.current_step ? `Running: ${data.current_step}` : 'Running...');
      }
    } catch {
      // silently ignore poll errors
    }
  }, []);

  const startPolling = useCallback(() => {
    if (hfsPollRef.current) clearInterval(hfsPollRef.current);
    pollScrapeStatus();
    hfsPollRef.current = setInterval(pollScrapeStatus, 5000);
  }, [pollScrapeStatus]);

  useEffect(() => {
    return () => { if (hfsPollRef.current) clearInterval(hfsPollRef.current); };
  }, []);

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

    async function loadDbStats() {
      try {
        const data = await apiCall('/api/admin/db-stats', {}, { requireAdmin: true });
        setDbStats(data);
      } catch (error) {
        console.error('Failed to load DB stats:', error);
      } finally {
        setDbStatsLoading(false);
      }
    }

    loadStats();
    loadDbStats();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
        Database Statistics
      </h2>

      {loading && <div className="text-xs uppercase tracking-widest text-theme-text-tertiary">Loading...</div>}
      {!loading && !stats && <div className="text-xs uppercase tracking-widest text-theme-text-tertiary">Failed to load statistics — DB may be over quota</div>}

      {stats && <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
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
      </div>}

      {/* Database Storage Stats */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
          Storage
        </h2>
        {dbStatsLoading && <div className="text-xs uppercase tracking-widest text-theme-text-tertiary">Loading...</div>}
        {!dbStatsLoading && !dbStats && <div className="text-xs uppercase tracking-widest text-theme-text-tertiary">Failed to load storage stats</div>}
        {dbStats && (
          <div className="space-y-3">
            {/* DB size + capacity bar */}
            <div className="border border-theme-text-primary/10 bg-theme-bg-primary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-secondary">Total DB Size</span>
                <span className="text-lg font-bold tabular-nums">{dbStats.db_size}</span>
              </div>
              {dbStats.capacity?.hasConfiguredLimit && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-text-tertiary">Capacity</span>
                    <span className={`font-bold tabular-nums ${dbStats.capacity.shouldPauseScraping ? 'text-red-400' : dbStats.capacity.usedPercent > 75 ? 'text-yellow-400' : 'text-green-500'}`}>
                      {dbStats.capacity.usedPercent.toFixed(1)}% of {(dbStats.capacity.maxBytes / 1073741824).toFixed(2)} GiB
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-theme-text-primary/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${dbStats.capacity.shouldPauseScraping ? 'bg-red-400' : dbStats.capacity.usedPercent > 75 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(dbStats.capacity.usedPercent, 100).toFixed(1)}%` }}
                    />
                  </div>
                  {dbStats.capacity.shouldPauseScraping && (
                    <div className="text-[10px] text-red-400 uppercase tracking-wider">Scraping paused — over {dbStats.capacity.thresholdPercent}% threshold</div>
                  )}
                </>
              )}
            </div>

            {/* Per-table breakdown */}
            {dbStats.tables?.length > 0 && (
              <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                {dbStats.tables.map(t => (
                  <div key={t.name} className="flex items-center justify-between px-4 py-2.5 bg-theme-bg-primary">
                    <div>
                      <span className="text-xs font-mono text-theme-text-secondary">{t.name}</span>
                      {t.rows != null && (
                        <span className="ml-2 text-[10px] text-theme-text-tertiary">{t.rows.toLocaleString()} rows</span>
                      )}
                    </div>
                    <span className="text-xs tabular-nums text-theme-text-tertiary">{t.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
          Quick Actions
        </h2>
        <div className="space-y-px border border-theme-text-primary/10">
          {/* Settings link */}
          <Link
            href="/settings"
            className="flex items-center justify-between px-4 py-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Settings</div>
              <div className="text-[10px] text-theme-text-tertiary mt-0.5">Configure app settings</div>
            </div>
            <span className="text-theme-text-tertiary/40 group-hover:text-theme-text-tertiary transition-colors text-xs">&rarr;</span>
          </Link>

          {/* HFS scraper trigger */}
          <div>
            <div className="flex">
              <button
                onClick={async () => {
                  setHfsScrapeStatus('loading');
                  setHfsScrapeMsg('');
                  setHfsExpanded(true);
                  setHfsRunData(null);
                  try {
                    const res = await apiCall('/api/admin/scrape', { method: 'POST' }, { requireAdmin: true });
                    setHfsScrapeStatus('ok');
                    setHfsScrapeMsg(res?.message || 'Workflow dispatched. Status will update when the run starts.');
                    // Start polling after a short delay to let GH Actions queue the run
                    setTimeout(() => startPolling(), 3000);
                  } catch (err) {
                    setHfsScrapeStatus('error');
                    setHfsScrapeMsg(err.message || 'Failed to trigger workflow');
                  }
                }}
                disabled={hfsScrapeStatus === 'loading'}
                className="flex-1 flex items-center justify-between px-4 py-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group text-left disabled:opacity-50"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Scrape Dining Hall Menus</div>
                  <div className="text-[10px] text-theme-text-tertiary mt-0.5">
                    {hfsScrapeStatus === 'loading' && 'Dispatching workflow...'}
                    {hfsScrapeStatus === 'ok' && <span className="text-green-500">{hfsScrapeMsg}</span>}
                    {hfsScrapeStatus === 'error' && <span className="text-red-400">{hfsScrapeMsg}</span>}
                    {!hfsScrapeStatus && 'Import HFS dining court menus (runs scrape.yml) — click ▼ to track progress'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setHfsExpanded(prev => !prev);
                  if (!hfsExpanded && !hfsPollRef.current && hfsScrapeStatus) {
                    pollScrapeStatus();
                  }
                }}
                className="px-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors border-l border-theme-text-primary/10 flex items-center"
                title={hfsExpanded ? 'Collapse progress' : 'Show progress'}
              >
                <span className={`text-theme-text-secondary text-xs transition-transform duration-200 ${hfsExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
              </button>
            </div>
            {hfsExpanded && (
              <ScrapeProgressPanel data={hfsRunData} />
            )}
          </div>

          {/* Retail scraper trigger */}
          <button
            onClick={async () => {
              setRetailScrapeStatus('loading');
              setRetailScrapeMsg('');
              try {
                const res = await apiCall('/api/admin/scrape-retail', { method: 'POST' }, { requireAdmin: true });
                setRetailScrapeStatus('ok');
                setRetailScrapeMsg(res?.message || 'Workflow dispatched');
              } catch (err) {
                setRetailScrapeStatus('error');
                setRetailScrapeMsg(err.message || 'Failed to trigger workflow');
              }
            }}
            disabled={retailScrapeStatus === 'loading'}
            className="w-full flex items-center justify-between px-4 py-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group text-left disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Update Retail Menus</div>
              <div className="text-[10px] text-theme-text-tertiary mt-0.5">
                {retailScrapeStatus === 'loading' && 'Dispatching workflow...'}
                {retailScrapeStatus === 'ok' && <span className="text-green-500">{retailScrapeMsg}</span>}
                {retailScrapeStatus === 'error' && <span className="text-red-400">{retailScrapeMsg}</span>}
                {!retailScrapeStatus && 'Refresh beverages for 1Bowl, Pete\'s Za, Sushi Boss'}
              </div>
            </div>
            <span className="text-theme-text-tertiary/40 group-hover:text-theme-text-tertiary transition-colors text-xs">
              {retailScrapeStatus === 'loading' ? '...' : '\u2192'}
            </span>
          </button>

          {/* DB cleanup */}
          <button
            onClick={async () => {
              setCleanupStatus('loading');
              setCleanupResult(null);
              try {
                const res = await apiCall('/api/admin/cleanup-db', { method: 'POST' }, { requireAdmin: true });
                setCleanupStatus('ok');
                setCleanupResult(res);
              } catch (err) {
                setCleanupStatus('error');
                setCleanupResult({ error: err.message });
              }
            }}
            disabled={cleanupStatus === 'loading'}
            className="w-full flex items-center justify-between px-4 py-4 bg-theme-bg-primary hover:bg-theme-text-primary/5 transition-colors group text-left disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">Clean Database</div>
              <div className="text-[10px] text-theme-text-tertiary mt-0.5">
                {cleanupStatus === 'loading' && 'Running cleanup...'}
                {cleanupStatus === 'ok' && cleanupResult && (
                  <span className="text-green-500">
                    Deleted {cleanupResult.snapshots_deleted} old snapshots · DB size: {cleanupResult.db_size}
                  </span>
                )}
                {cleanupStatus === 'error' && <span className="text-red-400">{cleanupResult?.error}</span>}
                {!cleanupStatus && 'Delete menu snapshots older than 7 days'}
              </div>
            </div>
            <span className="text-theme-text-tertiary/40 group-hover:text-theme-text-tertiary transition-colors text-xs">
              {cleanupStatus === 'loading' ? '...' : '\u2192'}
            </span>
          </button>
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
function FoodsTab({ onOpenScraper }) {
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
        <button
          onClick={onOpenScraper}
          className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors border-b border-theme-text-primary/20"
        >
          Run Scraper →
        </button>
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

