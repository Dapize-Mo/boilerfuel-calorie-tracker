import Link from 'next/link';
import Head from 'next/head';

const VERSIONS = [
  {
    version: '3.0.0',
    date: 'February 13, 2026',
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
      ]},
      { cat: 'UI', items: [
        'Minimal brutalist monospace design language with theme support',
        'GPU-composited title animation sliding from center to top-left',
        'Responsive layout adapting filters, fonts, and positions for mobile',
        'Profile icon and back arrow that appear contextually in results view',
        'Consistent page styling across About, Profile, Changelog, and Admin pages',
        'Light and dark mode toggle on Profile page',
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
        'Comprehensive documentation: Architecture, Deployment, Contributing, and Quick Start',
        'GitHub Actions workflow for scheduled menu scraping',
      ]},
    ],
  },
  {
    version: '2.0.0',
    date: 'February 12, 2026',
    changes: [
      { cat: 'Feature', items: [
        'Redesigned home page with animated landing to results transition',
        'Advanced macro tracker with visual progress rings',
        'Enhanced dining menu browser with macro filtering and sorting',
        'Retail food database: 60+ items from popular chains',
        'Profile page with theme toggle',
      ]},
      { cat: 'UI', items: [
        'Minimal brutalist design language across all pages',
        'Modal-based meal logging with location filtering',
        'Goals editor for daily calorie and macro targets',
        'Date navigation for viewing past/future days',
      ]},
      { cat: 'Technical', items: [
        'Progressive rendering for large food lists',
        'Cookie-based local storage for goals and meal logs',
        'Retail foods database seeding',
        'Scroll-driven view transitions with GPU compositing',
      ]},
    ],
  },
  {
    version: '1.5.0',
    date: 'October 24, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Light/dark mode theme toggle with system preference detection',
        'Food details modal with full nutritional info',
        '7-day forecast tooltips for menu item availability',
      ]},
      { cat: 'Technical', items: [
        'ThemeContext for global theme state',
        'localStorage persistence for theme preference',
        'Tailwind dark mode with class-based strategy',
      ]},
    ],
  },
  {
    version: '1.4.0',
    date: 'October 23, 2025',
    changes: [
      { cat: 'Feature', items: [
        '7-day menu forecasting with multi-day scheduling',
        'Admin GitHub Actions trigger for on-demand scraping',
        'Enhanced scraper with multi-day caching',
      ]},
      { cat: 'Technical', items: [
        'next_available JSONB column with GIN index',
        'Database migration to Neon PostgreSQL',
        'GitHub Actions workflow with verification queries',
      ]},
      { cat: 'Fix', items: [
        'Fixed Neon database not updating in production',
        'Added post-scrape verification',
      ]},
    ],
  },
  {
    version: '1.3.0',
    date: 'October 2, 2025',
    changes: [
      { cat: 'Feature', items: [
        'Meal time filter (breakfast, lunch, dinner)',
        'Active filter pills with clear button',
        'About page and changelog page',
      ]},
      { cat: 'Accessibility', items: [
        'Proper page titles on all pages',
        'HTML lang attribute for screen readers',
        'ARIA labels and focus indicators',
      ]},
      { cat: 'Technical', items: [
        'meal_time database column and API parameter',
        'Database indexes for query performance',
      ]},
    ],
  },
  {
    version: '1.2.0',
    date: 'September 2025',
    changes: [
      { cat: 'Feature', items: [
        'Dining court filter for menu items',
        'Station grouping (Grill, Salad Bar, etc.)',
        'Quick add button for one-click meal logging',
      ]},
    ],
  },
  {
    version: '1.1.0',
    date: 'August 2025',
    changes: [
      { cat: 'Feature', items: [
        'Activity tracking with workout logging',
        'Calories burned calculation (net calories)',
        'Pre-populated exercise database',
      ]},
    ],
  },
  {
    version: '1.0.0',
    date: 'July 2025',
    initial: true,
    changes: [
      { cat: 'Feature', items: [
        'Food logging with calories and macros',
        'Daily nutrition totals',
        'Privacy-first local storage',
        'Admin panel for food database management',
        'Automated dining hall menu scraper',
        'Responsive design for desktop and mobile',
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
