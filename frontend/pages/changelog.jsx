import Link from 'next/link';
import Head from 'next/head';

const VERSIONS = [
  {
    version: '3.0.0',
    date: 'February 20, 2026',
    latest: true,
    changes: [
      { cat: 'Feature', items: [
        'Animated landing-to-results transition with scroll and swipe navigation',
        'Grouped location dropdown with dining courts, retail, and convenience categories',
        'Custom black-and-white calendar date picker with inline month navigation',
        'Hover-to-preview macro tooltips showing calories, protein, carbs, and fat',
        'Sortable calorie column with ascending/descending toggle',
        'Progressive rendering with chunked loading and "Show more" pagination',
        'Station-grouped food tables with court headers for multi-location views',
        'Beverages added to Quick Bites locations and Lawson On-the-GO!',
        'Grouped logged foods with two-column profile layout and yellow accents',
        'Offline support with service worker and menu caching',
        'Line charts for stats, macro trends, and feedback form',
        'Beverages grouped into milk/non-milk; water tracker moved to sidebar',
        'Cross-device sync with encrypted data relay',
        'Favorites, search, filters, stats, water/weight tracking, and barcode scanner',
        'Live scraper progress tracking in admin panel',
        'Collection components scraped via GraphQL v3 API with expandable station items',
        'Full macro goals editing with profile accessible from landing page',
      ]},
      { cat: 'UI', items: [
        'Minimal brutalist monospace design language with theme support',
        'GPU-composited title animation sliding from center to top-left',
        'Responsive layout adapting filters, fonts, and positions for mobile',
        'Profile icon and back arrow that appear contextually in results view',
        'Consistent page styling across About, Profile, Changelog, and Admin pages',
        'Light and dark mode toggle on Profile page',
        'Improved expanded panel layout with Late Lunch meal time added',
      ]},
      { cat: 'Fix', items: [
        'Load retail_menu_seed.sql in init_db for static beverage data',
        'Calories now visible on mobile; tablet sidebar overlap resolved',
        'Mobile horizontal overflow clipping content on left side prevented',
        'Hover tooltip on mobile disabled to prevent horizontal overflow',
        'Water item filtered out from drinks list to avoid duplication',
        '+/- buttons kept fixed position; serving size and select styling corrected',
        'Unsupported GraphQL fields removed to fix 400 error',
      ]},
      { cat: 'Technical', items: [
        'Enterprise security with Argon2 hashing, rate limiting, and input sanitization',
        '40 backend tests with pytest (error classes + API endpoints)',
        'Database optimization with 7 indexes, materialized views, and pg_trgm fuzzy search',
        '10 custom React hooks (debounce, lazy load, intersection observer, and more)',
        'PWA manifest with installable app support and home screen shortcuts',
        'Vercel + Neon PostgreSQL deployment pipeline with auto-deploy on push',
        'RAF-throttled tooltip tracking to prevent render storms',
      ]},
      { cat: 'Infrastructure', items: [
        'Repository cleaned from 45+ root files down to 10 essential files',
        'Organized tooling into tools/maintenance, migrations, scripts, and analysis',
        'GitHub Actions workflow for scheduled menu scraping',
        'Exercises tab removed from admin panel',
      ]},
    ],
  },
  {
    version: '2.0.0',
    date: 'February 12, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Google OAuth sign-in with NextAuth.js and profile menu integration',
        'On-demand scraper trigger in admin with live UI polling and toast notifications',
        'Global dark mode and nutrition stats across all pages',
        'Filter dining courts by meal time (backend + frontend)',
        'Activity seeding script with 20 pre-populated workout types',
        '7-day forecast display in admin food panel',
        'Filter foods to show only items available today',
        'Visual feedback for food additions and improved meal removal UX',
        'Date-clickable food picker with multi-select "Done" flow',
        'Redesigned dashboard with fluid, integrated layout',
        'Streamlined "Add Meal" flow with Purdue Dining vs Custom Meal choice',
        'Search filters for exercises and food selection in Add Meal modal',
        'Immersive scrolling dashboard with glassmorphism and glow effects',
        'Comprehensive gym tracker with workout logging and calorie burn',
        'Redesigned admin panel with tabs and performance optimizations',
        'API proxy endpoints for scraper functionality on Vercel',
      ]},
      { cat: 'UI', items: [
        'Minimal brutalist "Bare Bones" design language introduced and enforced',
        'Two-phase homepage: centered landing with filters, then results view',
        'Custom calendar dropdown replacing native date input',
        'Smooth animated landing-to-results cross-fade transition',
        'Unified Hybrid style design across all pages',
        'Full theme awareness (no hard-coded white/gray/black) across all pages',
        'Goals editor for daily calorie and macro targets',
        'Date navigation for viewing past and future days',
        'Modal-based meal logging with location filtering',
      ]},
      { cat: 'Technical', items: [
        'Extensive codebase refactor: cleanup, testing, security, and documentation',
        'Performance optimizations: React.memo, SWR config, bundle splitting, DB indexes',
        'Progressive rendering for large food lists',
        'Cookie-based local storage for goals and meal logs',
        'Neon PostgreSQL as primary database, mock data removed',
        'PWA manifest improvements and responsive design polishing',
        'Meal time and location filters made case-insensitive',
        'Avoided localhost timeouts on Vercel with proper BACKEND_URL guards',
        'Removed sidebar; restructured to top navigation and full-width layout',
      ]},
      { cat: 'Fix', items: [
        'Meal time case sensitivity in Add Meal modal resolved',
        'Stats no longer disappear when changing dining court filters',
        'Duplicate header removed from food dashboard',
        'Date handling fixed: parse YYYY-MM-DD as local date to prevent day mismatch',
        'Late Lunch dining court list corrected using schedule fallback',
        'Google sign-in double header fixed',
      ]},
    ],
  },
  {
    version: '1.5.0',
    date: 'October 24, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Light/dark mode theme toggle with system preference detection',
        'Food details modal with full nutritional info and 7-day forecast',
        'Hover tooltip on meal_time badge showing 7-day availability dates',
        'Profile menu placeholder on desktop and mobile header',
        'Food dashboard: 3-column menu grid on medium+ screens',
        'About page generalized for all college students',
      ]},
      { cat: 'Technical', items: [
        'Modular CSS variable-based theme system with centralized color palette',
        'ThemeContext for global theme state with localStorage persistence',
        'All pages converted to modular theme system with smooth transitions',
        'Tailwind dark mode with class-based strategy',
        'Full theme awareness across dashboard, food, gym, profile, and admin',
      ]},
    ],
  },
  {
    version: '1.4.0',
    date: 'October 22, 2025',
    changes: [
      { cat: 'Feature', items: [
        '7-day menu forecasting with multi-day scheduling and caching',
        'Hover tooltip on food cards showing 7-day availability forecast',
        'Admin GitHub Actions trigger for on-demand scraping (protected endpoint)',
        'Comprehensive database viewer in admin with search, filter, and sort',
        'Modern glass-morphism dashboard design with 3 alternative layouts',
        'Goal setting and progress tracking with enhanced data persistence',
        'Comprehensive meal time support with auto-update functionality',
        'Separate Food and Gym dashboards with unified overview home page',
      ]},
      { cat: 'Technical', items: [
        'next_available JSONB column with GIN index for forecasting data',
        'Migrated primary database to Neon PostgreSQL',
        'GitHub Actions scraper workflow with pre/post verification queries',
        'Weekly scraper schedule changed to Sunday 8am UTC',
        'Date parsing fixed to use local date, preventing Today/Yesterday mismatch',
      ]},
      { cat: 'Fix', items: [
        'Neon database not updating in production resolved',
        'Post-scrape verification added to confirm data integrity',
        'ESLint warnings for stale useEffect dependencies resolved',
      ]},
    ],
  },
  {
    version: '1.3.0',
    date: 'October 2, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Meal time filter (breakfast, lunch, dinner) on food dashboard',
        'Active filter pills with clear button',
        'About page and Changelog page added',
        'Separate gym dashboard with in-depth workout features',
        'Grouped menu display with station sections as styled grid blocks',
        'Async Purdue menu scraper to avoid Railway timeouts',
        'Show/hide password toggle on admin login',
      ]},
      { cat: 'Accessibility', items: [
        'Proper page titles on all pages',
        'HTML lang attribute for screen readers',
        'ARIA labels and focus indicators',
        'CORS support for Vercel preview deployments',
      ]},
      { cat: 'Technical', items: [
        'meal_time database column and API parameter',
        'Database indexes for improved query performance',
        'Upgraded Next.js to 13.5.11 to fix security vulnerabilities',
        'Admin page updated to poll async scraper status',
      ]},
    ],
  },
  {
    version: '1.2.0',
    date: 'October 1, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Purdue dining court menu scraper integration with nutrition caching',
        'Dining court filter for menu items',
        'Station grouping (Grill, Salad Bar, etc.) with quick add buttons',
        'Quick add button for one-click meal logging',
        'Endpoint to clear placeholder foods from database',
      ]},
      { cat: 'Technical', items: [
        'Migrated backend to Django and removed Railway dependencies',
        'Migrated to free-only architecture: Next.js API routes + Neon Postgres + GitHub Actions',
        'Frontend API routes updated to proxy scraper requests',
        'Vercel monorepo configuration with frontend subdirectory',
      ]},
    ],
  },
  {
    version: '1.1.0',
    date: 'October 1, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Activity tracking with workout logging',
        'Calories burned calculation (net calories)',
        'Pre-populated exercise database',
        'Complete activity tracker feature with tests and documentation',
      ]},
      { cat: 'Technical', items: [
        'Backend API and database schema for activities',
        'Security: removed exposed credentials and updated .gitignore',
      ]},
    ],
  },
  {
    version: '1.0.0',
    date: 'September 29, 2025',
    initial: true,
    changes: [
      { cat: 'Feature', items: [
        'Food logging with calories and macros',
        'Daily nutrition totals',
        'Privacy-first local storage (no account required)',
        'Admin panel for food database management',
        'Automated Purdue dining hall menu scraper',
        'Responsive design for desktop and mobile',
      ]},
      { cat: 'Technical', items: [
        'Flask REST API backend with SQLAlchemy',
        'PostgreSQL on Railway with robust DB URL resolution',
        'Next.js frontend deployed to Vercel',
        'Dockerfile and .dockerignore for reliable Railway build',
        'SQLAlchemy 1.4.x pinned for Flask-SQLAlchemy 2.5.1 compatibility',
      ]},
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <Head>
        <title>Changelog - BoilerFuel</title>
        <meta name="description" content="BoilerFuel version history and updates" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-16">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Changelog</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Version history &amp; updates
            </p>
          </header>

          {/* Versions */}
          {VERSIONS.map((v) => (
            <section key={v.version} className="space-y-4">
              {/* Version header */}
              <div className="flex items-baseline justify-between border-b border-theme-text-primary/10 pb-2">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-bold uppercase tracking-wider">{v.version}</h2>
                  {v.latest && (
                    <span className="text-[10px] uppercase tracking-widest border border-theme-text-primary/30 px-2 py-0.5 text-theme-text-tertiary">
                      Latest
                    </span>
                  )}
                  {v.initial && (
                    <span className="text-[10px] uppercase tracking-widest border border-theme-text-primary/30 px-2 py-0.5 text-theme-text-tertiary">
                      Initial
                    </span>
                  )}
                </div>
                <span className="text-xs text-theme-text-tertiary">{v.date}</span>
              </div>

              {/* Change categories */}
              <div className="border border-theme-text-primary/10">
                {v.changes.map((group, gi) => (
                  <div key={group.cat}>
                    {gi > 0 && <div className="h-px bg-theme-text-primary/10" />}
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-theme-text-tertiary mb-2">
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
            </section>
          ))}

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
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

Changelog.getLayout = (page) => page;
