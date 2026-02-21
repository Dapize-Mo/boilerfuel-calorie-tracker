import Link from 'next/link';
import Head from 'next/head';

// Versioning system — built from actual git commit dates:
//   x.0.0  Major — complete redesign or architectural overhaul
//   x.y.0  Minor — new feature or meaningful capability
//   x.y.z  Patch — bug fix, ESLint cleanup, or single-line correction

const VERSIONS = [

  // ─── 3.x.x  Beverages, Live Data & Sync  (Feb 17–20, 2026) ──────────────
  {
    version: '3.6.0',
    date: 'February 20, 2026',
    latest: true,
    changes: [
      { cat: 'Feature', items: [
        'Beverages added to Quick Bites locations and Lawson On-the-GO!',
        'Grouped logged foods with two-column profile layout and yellow accents',
      ]},
      { cat: 'Fix', items: [
        'Load retail_menu_seed.sql in init_db for static beverage data',
      ]},
    ],
  },
  {
    version: '3.5.1',
    date: 'February 19, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Hover tooltip disabled on mobile to prevent horizontal overflow',
        'Mobile horizontal overflow clipping left-side content prevented',
        'Calories now visible on mobile; tablet sidebar overlap resolved',
      ]},
    ],
  },
  {
    version: '3.5.0',
    date: 'February 19, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Offline support with service worker and menu caching',
        'Line charts for stats and macro trends; feedback form added',
        'Beverages grouped into milk/non-milk; water tracker moved to sidebar',
      ]},
      { cat: 'UI', items: [
        'Late Lunch added as a distinct meal time in expanded panel',
        'Improved expanded panel layout and select styling',
      ]},
      { cat: 'Fix', items: [
        'Water item filtered out from drinks list to avoid duplication',
      ]},
    ],
  },
  {
    version: '3.4.1',
    date: 'February 19, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Cross-device sync with encrypted data relay',
      ]},
      { cat: 'Fix', items: [
        '+/- buttons kept at fixed position; serving size corrected',
      ]},
    ],
  },
  {
    version: '3.4.0',
    date: 'February 19, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Favorites, search, filters, and stats panel',
        'Water and weight tracking',
        'Barcode scanner for custom food logging',
      ]},
    ],
  },
  {
    version: '3.3.1',
    date: 'February 18, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Local date used instead of UTC for meal tracking',
        'Clickable title to navigate back from results view',
        'Log meals under selected date instead of always today',
      ]},
    ],
  },
  {
    version: '3.3.0',
    date: 'February 18, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Full macro goals editing with profile accessible from landing page',
        'Meal time and location shown next to each logged food in profile',
        'N/A indicator for foods with missing nutrition data',
      ]},
    ],
  },
  {
    version: '3.2.1',
    date: 'February 18, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Unsupported GraphQL fields removed to resolve 400 error',
        'Exercises tab removed from admin panel',
        'GitHub Actions scraper workflow dispatch fixed',
      ]},
    ],
  },
  {
    version: '3.2.0',
    date: 'February 18, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Live scraper progress tracking in admin panel',
        'Menu collection components scraped via GraphQL v3 API',
        'Expandable station items with addable components',
      ]},
    ],
  },
  {
    version: '3.1.1',
    date: 'February 18, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Beverages added to scraper; meal_time filter corrected for compound times',
        'Beverages moved to sidebar; date navigation added to profile',
      ]},
    ],
  },
  {
    version: '3.1.0',
    date: 'February 17, 2026',
    changes: [
      { cat: 'Feature', items: [
        'PWA icons generated from BoilerFuel logo',
        'SkipToContent and ThemeToggleButton accessibility components',
      ]},
      { cat: 'Fix', items: [
        'Pylance errors resolved; CI argon2-cffi version pinned',
        'Missing getBackendUrl import removed from custom-foods routes',
        'ESLint quote escaping in custom-foods.jsx',
        'GitHub Actions scraper workflow dispatch corrected',
      ]},
    ],
  },
  {
    version: '3.0.0',
    date: 'February 17, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Beverages added to all dining courts (milk, soda, water)',
        'Date navigation on profile to view any past day',
      ]},
    ],
  },

  // ─── 2.x.x  Calorie Tracking System  (Feb 13–15, 2026) ──────────────────
  {
    version: '2.3.1',
    date: 'February 15, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Escape quotes in custom-foods.jsx to fix ESLint build error',
      ]},
    ],
  },
  {
    version: '2.3.0',
    date: 'February 14, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Complete Purdue Food Co integration with Custom Foods feature',
        'Detailed nutrition breakdown panel on profile page',
        'Retail menu data populated for all Purdue Food Co locations',
      ]},
    ],
  },
  {
    version: '2.2.1',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Escape apostrophe in retail JSX to fix ESLint build error',
      ]},
    ],
  },
  {
    version: '2.2.0',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Purdue Food Co retail locations added with categorized dropdown',
        'Extended nutrition data with dietary icons',
        'Ingredients info modal on food rows',
      ]},
    ],
  },
  {
    version: '2.1.0',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Hover tooltip with full nutrition stats on food rows',
        'Click-to-expand food rows with detailed macro breakdown',
        'Meal picker popup for compound meal times (Breakfast/Lunch)',
        'Grouped meals view in profile',
      ]},
      { cat: 'Fix', items: [
        'Compound meal_time filtering (Breakfast/Lunch shows under both)',
        'Late lunch normalized to lunch in profile meal grouping',
      ]},
    ],
  },
  {
    version: '2.0.0',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Calorie tracking with expandable food rows and add/remove buttons',
        'Nutrition dashboard on profile page with daily totals',
        'Goal setting for daily calorie and macro targets',
        'Date-clickable food picker with multi-select "Done" flow',
      ]},
    ],
  },

  // ─── 1.x.x  Monochrome Brutalist Redesign  (Feb 12–13, 2026) ─────────────
  {
    version: '1.2.1',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Filter z-index raised so dropdowns render above landing elements',
        'Macro tooltip z-index fixed to show only on results page',
        'By Request station sorted last; fade-in animation cleaned up',
        'Meal time dropdown border matched to other filter styles',
        'Removed 28 unused files: dev tools, dead code, applied migrations',
      ]},
    ],
  },
  {
    version: '1.2.0',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Profile page with scroll-triggered slide-in icon',
        'Redesigned About, Admin, Changelog, and Profile pages to match brutalist style',
        'BF monogram favicon matching black/white theme',
        'About, Changelog, and Admin links added to page footer',
        'Global page transitions: smooth fade on all navigation',
      ]},
      { cat: 'UI', items: [
        'Mobile: stacked header (title row + filters row)',
        'Filters stack on mobile; spacing adjusted for small screens',
      ]},
    ],
  },
  {
    version: '1.1.0',
    date: 'February 13, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Categorized location dropdown grouping courts, retail, and convenience',
        'Station grouping with court headers and quick-add buttons',
        'Macro tooltip showing calorie/protein/carb/fat preview on hover',
        'Calorie sort column with ascending/descending toggle',
        'Scroll navigation anchoring to results after search',
        'GPU-composited transforms; throttled tooltip; capped row animations',
        'Filter foods by date using menu_snapshots table',
      ]},
    ],
  },
  {
    version: '1.0.1',
    date: 'February 12, 2026',
    changes: [
      { cat: 'Fix', items: [
        'Smooth cross-fade between landing and results with no black-screen gap',
        'Inline styles used for transitions to avoid Tailwind purge issues',
        'Both views set to absolute positioning so back-press restores landing',
        'Compact date picker in header to match dropdown sizes',
        'FLIP animation: title slides to top-left on search',
      ]},
    ],
  },
  {
    version: '1.0.0',
    date: 'February 12, 2026',
    changes: [
      { cat: 'UI', items: [
        'Complete visual overhaul: minimal monochrome "Bare Bones" brutalist design',
        'Monospace font throughout; uppercase tracking; thin ruled borders',
        'Two-phase homepage: centered landing with filters, then results view',
        'Animated transition: title slides center → top-left on search',
        'Custom black-and-white calendar dropdown replacing native date input',
        'Cleaner full-width layout with refined typography and spacing',
        'Sidebar removed; restructured to full-width top-navigation layout',
        'Site simplified to 4 core pages; unused components and routes removed',
        'Neon DB used for all food data; mock data removed',
        'Case-insensitive meal and location filters',
      ]},
      { cat: 'Technical', items: [
        'Enterprise security: Argon2 hashing, rate limiting, input sanitization',
        '40 backend tests with pytest',
        'Database: 7 indexes, materialized views, pg_trgm fuzzy search',
        '10 custom React hooks (debounce, lazy load, intersection observer)',
        'PWA manifest with installable app and home screen shortcuts',
        'Vercel + Neon PostgreSQL deployment pipeline',
        'Performance: React.memo, SWR config, bundle splitting, DB optimizations',
        'Menu accuracy snapshots and admin compare tool',
        'Health check endpoint for deployment verification',
        'RAF-throttled tooltip to prevent render storms',
      ]},
    ],
  },

  // ─── 0.x.x  Bootstrap Era  (Sep 29 – Nov 22, 2025) ─────────────────────
  {
    version: '0.9.0',
    date: 'November 19–22, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Activity seeding script with 20 pre-populated workout types',
        'Global dark mode and nutrition stats across all pages',
        'Filter dining courts by meal time (backend + frontend)',
        'Date filtering for food dashboard using menu_snapshots',
        'Scraper coverage improvements and deployment verification',
      ]},
      { cat: 'Technical', items: [
        'Full theme awareness across all pages (no hard-coded colors)',
        'Explicit .light CSS class; unified toggle styling with CSS tokens',
        'Dashboard search performance optimized',
        'Backend, scraper, and seed data updated for production',
      ]},
      { cat: 'Fix', items: [
        'Late Lunch dining court list corrected using schedule fallback',
        'Food dashboard date filtering and gym activity logging fixed',
        'Duplicated content in globals.css removed',
      ]},
    ],
  },
  {
    version: '0.8.0',
    date: 'November 1–4, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Google OAuth sign-in with NextAuth.js and profile menu integration',
        'On-demand scraper trigger in admin with live UI polling and toast notifications',
        'Admin-scraper page with GitHub Actions fallback when no backend URL',
        'API proxy endpoints for scraper functionality on Vercel',
      ]},
      { cat: 'Fix', items: [
        'Localhost timeouts on Vercel avoided with proper BACKEND_URL guards',
        'Duplicate header from Google sign-in integration removed',
        'Global header/footer restored with opt-out for admin-scraper via getLayout',
      ]},
    ],
  },
  {
    version: '0.7.1',
    date: 'October 31, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Date-clickable food picker with multi-select and "Done" flow',
        'Visual feedback for food additions; improved meal removal UX',
        'Search filter for food selection in Add Meal modal',
        'Search filter for exercises in gym page',
        'Filter foods to show only items available today',
        '7-day forecast display in admin food panel',
      ]},
      { cat: 'Fix', items: [
        'Meal time case sensitivity in Add Meal modal resolved',
        'Stats no longer disappear when changing dining court filters',
        'Duplicate header removed from food dashboard',
      ]},
    ],
  },
  {
    version: '0.7.0',
    date: 'October 28–30, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Comprehensive gym tracker with workout logging and calorie burn',
        'Expanded Activity schema with database migration',
        'Streamlined "Add Meal" flow with Purdue Dining vs Custom Meal choice',
        'Profile and settings pages',
        'Glow effects on all hoverable elements and admin panel cards',
        'Immersive scrolling dashboard; redesigned admin panel with tabs',
        'Mobile responsiveness improvements across food dashboard',
      ]},
      { cat: 'Fix', items: [
        'Null safety for dashboard totals on clean branch',
        'Optional chaining added to totals.burned access',
        'Quote escaping in workout notes for ESLint',
      ]},
    ],
  },
  {
    version: '0.6.1',
    date: 'October 23–24, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Forecast tooltip and details modal on food dashboard (7-day dates)',
        'Admin GitHub Actions trigger for on-demand scraping (protected endpoint)',
        'Light/dark mode toggle with system preference detection',
        'Modular CSS variable-based theme system with centralized color palette',
        'ThemeContext with localStorage persistence',
        'All pages converted to theme system with smooth transitions',
        'Food dashboard: 3-column grid on medium+ screens',
        'About page generalized for all college students',
      ]},
      { cat: 'Fix', items: [
        'ESLint warnings for stale useEffect dependencies resolved',
        'Food card click handling fixed; tooltip pointer-events corrected',
        'Light mode: theme card styles on dashboard and food pages',
      ]},
    ],
  },
  {
    version: '0.6.0',
    date: 'October 22–23, 2025',
    changes: [
      { cat: 'Feature', items: [
        '7-day menu availability forecasting with multi-day scheduling',
        'next_available JSONB column with GIN index for forecast data',
        'Goal setting and progress tracking with enhanced data persistence',
        'Comprehensive meal time support with auto-update functionality',
        'Glassmorphism dashboard with 3 alternative layout options',
        'Separate Food and Gym dashboards with unified overview home page',
        'Comprehensive database viewer in admin with search, filter, and sort',
        'Date picker added to dashboard',
      ]},
      { cat: 'Technical', items: [
        'Migrated primary database to Neon PostgreSQL',
        'GitHub Actions scraper workflow with pre/post verification',
        'Weekly scraper schedule set to Sunday 8am UTC',
        'Date parsing fixed to use local date, preventing Today/Yesterday mismatch',
      ]},
      { cat: 'Fix', items: [
        'Scraper endpoints fixed for Vercel deployment',
        'Frontend API routes updated to proxy scraper requests',
        'ESLint apostrophe escaping in dashboard resolved',
      ]},
    ],
  },
  {
    version: '0.5.0',
    date: 'October 20–21, 2025',
    changes: [
      { cat: 'Technical', items: [
        'Migrated to free-only architecture: Next.js API routes + Neon Postgres + GitHub Actions',
        'Migrated backend from Railway/Django — no self-hosted server required',
        'Same-origin API enforced in production; localhost calls on Vercel eliminated',
        'Vercel monorepo configuration with frontend subdirectory',
        'Scraper database configuration fixed for local SQLite vs hosted Postgres',
        'Placeholder favicon added; serverless scraper message shown in admin',
      ]},
    ],
  },
  {
    version: '0.4.0',
    date: 'October 2–3, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Purdue dining court menu scraper with intelligent nutrition caching',
        'Async scraper running in a background thread to avoid Railway timeouts',
        'Grouped menu display with station sections as styled grid blocks',
        'Meal time filter (breakfast, lunch, dinner) on food dashboard',
        'About and Changelog pages added with accessibility improvements',
        'Separate gym dashboard with in-depth workout features',
        'Show/hide password toggle on admin login',
        'Admin page updated to poll async scraper status',
      ]},
      { cat: 'Technical', items: [
        'CORS support for Vercel preview deployments',
        'Next.js upgraded to 13.5.11 to fix security vulnerabilities',
        'meal_time database column and API filter parameter',
        'Database indexes for improved query performance',
        'Gunicorn timeout increased to 120s to prevent scraper kills',
        'Vercel monorepo configuration finalized',
      ]},
      { cat: 'Fix', items: [
        'ESLint: escape apostrophe and use Link components',
        'Admin authentication added to scrape-menus API call',
      ]},
    ],
  },
  {
    version: '0.3.0',
    date: 'October 1, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Activity tracking with workout logging and calorie burn calculation',
        'Pre-populated exercise database with 20 workout types',
        'Net calories display (consumed minus burned)',
        'Web is now live and publicly accessible',
      ]},
      { cat: 'Technical', items: [
        'Backend API and database schema for activities',
        'Security: exposed credentials removed and .gitignore updated',
        'Dining court scraper integration started (basic)',
      ]},
    ],
  },
  {
    version: '0.2.0',
    date: 'September 30, 2025',
    changes: [
      { cat: 'Technical', items: [
        'Flask backend deployed to Railway with Procfile',
        'Dockerfile and .dockerignore for reliable Railway Python build',
        'Robust DB URL resolution for Railway POSTGRES_* environment variables',
        'SSL support for hosted Postgres connections',
        '/init-db endpoint for schema initialization and seeding',
        'SQLAlchemy 1.4.x pinned for Flask-SQLAlchemy 2.5.1 compatibility',
        'Debug logging added for environment variable resolution',
      ]},
      { cat: 'Fix', items: [
        'DATABASE_URL Railway template variable parsing corrected',
        'Macros schema fixed in database endpoints',
        'GET allowed on /init-db with proper error handling',
      ]},
    ],
  },
  {
    version: '0.1.0',
    date: 'September 29, 2025',
    initial: true,
    changes: [
      { cat: 'Feature', items: [
        'Food list with calorie and macro display from Purdue dining data',
        'Admin panel for food database management',
        'Responsive layout for desktop and mobile',
      ]},
      { cat: 'Technical', items: [
        'Flask REST API backend with SQLAlchemy ORM',
        'PostgreSQL on Railway',
        'Next.js 13 frontend deployed to Vercel',
      ]},
    ],
  },
];

const ERAS = [
  { id: 'v3', prefix: '3', label: '3.x.x', name: 'Beverages, Live Data & Sync',  span: 'Feb 17–20, 2026' },
  { id: 'v2', prefix: '2', label: '2.x.x', name: 'Calorie Tracking System',       span: 'Feb 13–15, 2026' },
  { id: 'v1', prefix: '1', label: '1.x.x', name: 'Monochrome Brutalist Redesign', span: 'Feb 12–13, 2026' },
  { id: 'v0', prefix: '0', label: '0.x.x', name: 'Bootstrap Era',                 span: 'Sep 29 – Nov 22, 2025' },
];

export default function Changelog() {
  const grouped = ERAS.map(era => ({
    ...era,
    versions: VERSIONS.filter(v => v.version.startsWith(era.prefix + '.')),
  }));

  return (
    <>
      <Head>
        <title>Changelog - BoilerFuel</title>
        <meta name="description" content="BoilerFuel version history and updates" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 sm:py-24">

          {/* Header */}
          <header className="mb-12 space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Changelog</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Version history &amp; updates
            </p>
          </header>

          {/* Mobile era pills */}
          <nav className="lg:hidden flex gap-2 flex-wrap mb-12">
            {ERAS.map(era => (
              <a
                key={era.id}
                href={`#${era.id}`}
                className="text-[10px] uppercase tracking-widest border border-theme-text-primary/20 px-3 py-1.5 text-theme-text-tertiary hover:text-theme-text-primary hover:border-theme-text-primary/50 transition-colors"
              >
                {era.label}
              </a>
            ))}
          </nav>

          {/* Body */}
          <div className="flex gap-12 xl:gap-20 items-start">

            {/* Sticky sidebar — desktop only */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="sticky top-10 space-y-1">
                <div className="text-[9px] uppercase tracking-[0.2em] text-theme-text-tertiary/50 mb-4 pb-2 border-b border-theme-text-primary/10">
                  Jump to era
                </div>
                {ERAS.map(era => (
                  <a
                    key={era.id}
                    href={`#${era.id}`}
                    className="block py-2.5 border-l-2 border-transparent pl-3 hover:border-theme-text-primary/40 hover:text-theme-text-primary transition-all group"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary group-hover:text-theme-text-primary transition-colors">
                      {era.label}
                    </div>
                    <div className="text-[10px] text-theme-text-tertiary mt-0.5 leading-tight">
                      {era.name}
                    </div>
                    <div className="text-[9px] text-theme-text-tertiary/50 mt-0.5">
                      {era.span}
                    </div>
                  </a>
                ))}

                <div className="pt-6 mt-6 border-t border-theme-text-primary/10 flex flex-col gap-2">
                  {[['/', 'Home'], ['/about', 'About'], ['/admin', 'Admin'], ['/profile', 'Profile']].map(([href, label]) => (
                    <Link key={href} href={href} className="text-[10px] uppercase tracking-widest text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 space-y-24">
              {grouped.map(era => (
                <section key={era.id} id={era.id}>

                  {/* Era header */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-theme-text-primary/20 pb-4 mb-8">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-theme-text-tertiary mb-1">
                        {era.name}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest">
                        {era.label}
                      </h2>
                    </div>
                    <span className="text-xs text-theme-text-tertiary">{era.span}</span>
                  </div>

                  {/* Version grid — 2 columns on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {era.versions.map(v => (
                      <div key={v.version} className="border border-theme-text-primary/10 flex flex-col">

                        {/* Version header row */}
                        <div className="flex items-baseline justify-between px-4 py-3 border-b border-theme-text-primary/10">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold uppercase tracking-wider">{v.version}</span>
                            {v.latest && (
                              <span className="text-[9px] uppercase tracking-widest border border-theme-text-primary/30 px-1.5 py-0.5 text-theme-text-tertiary">
                                Latest
                              </span>
                            )}
                            {v.initial && (
                              <span className="text-[9px] uppercase tracking-widest border border-theme-text-primary/30 px-1.5 py-0.5 text-theme-text-tertiary">
                                Initial
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-theme-text-tertiary shrink-0 ml-2">{v.date}</span>
                        </div>

                        {/* Change categories */}
                        {v.changes.map((group, gi) => (
                          <div key={group.cat}>
                            {gi > 0 && <div className="h-px bg-theme-text-primary/10" />}
                            <div className="px-4 py-3">
                              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-text-tertiary mb-2">
                                {group.cat}
                              </div>
                              <ul className="space-y-1">
                                {group.items.map((item, ii) => (
                                  <li key={ii} className="text-xs text-theme-text-secondary leading-relaxed flex gap-2">
                                    <span className="text-theme-text-primary/20 shrink-0">&mdash;</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Footer */}
              <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-6 text-xs uppercase tracking-widest lg:hidden">
                  <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
                  <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
                  <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
                  <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
                </div>
                <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
              </footer>
            </main>
          </div>

        </div>
      </div>
    </>
  );
}

Changelog.getLayout = (page) => page;
