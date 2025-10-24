import Link from 'next/link';
import Head from 'next/head';

export default function Changelog() {
  return (
    <>
      <Head>
        <title>Changelog - BoilerFuel</title>
        <meta name="description" content="BoilerFuel version history and updates" />
      </Head>
      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-theme-text-secondary hover:text-theme-accent-hover transition-colors">
              ← Home
            </Link>
            <span className="text-theme-text-tertiary">|</span>
            <Link href="/dashboard" className="text-theme-text-secondary hover:text-theme-accent-hover transition-colors">
              Dashboard
            </Link>
            <span className="text-theme-text-tertiary">|</span>
            <Link href="/about" className="text-theme-text-secondary hover:text-theme-accent-hover transition-colors">
              About
            </Link>
          </nav>

          {/* Header */}
          <header className="border-b border-theme-border-primary pb-6">
            <h1 className="text-4xl font-bold mb-2">Changelog</h1>
            <p className="text-xl text-theme-text-secondary">Version history and updates</p>
          </header>

          {/* Version 1.5.0 */}
          <section className="rounded-lg bg-theme-card-bg p-6 border border-theme-card-border space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-theme-accent">Version 1.5.0</h2>
                <p className="text-sm text-theme-text-secondary">October 24, 2025</p>
              </div>
              <span className="rounded-full bg-theme-success/20 text-theme-success px-3 py-1 text-xs font-semibold">
                Latest
              </span>
            </div>
            <div className="space-y-3 text-theme-text-secondary">
              <h3 className="font-bold text-theme-text-primary">✨ New Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Light/Dark Mode Theme:</strong> Toggle between light mode, dark mode, or automatic system preference detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Food Details Modal:</strong> Click any food item to view detailed nutritional info, dining court, station, and 7-day forecast</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>7-Day Forecast Tooltips:</strong> Hover over meal time badges to see when items will be available over the next week</span>
                </li>
              </ul>
              
              <h3 className="font-bold text-theme-text-primary mt-4">🎨 UI Improvements</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Theme toggle in navigation with ☀️ Light, 💻 System, 🌙 Dark modes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Light mode styling throughout app with adaptive colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Interactive food cards with hover states and click-to-expand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Improved tooltip visibility with proper z-index layering</span>
                </li>
              </ul>

              <h3 className="font-bold text-theme-text-primary mt-4">🔧 Technical Updates</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>ThemeContext for global theme state management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>localStorage persistence for theme preference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Real-time system theme change detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Tailwind dark mode with class-based strategy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Fixed React Hook ESLint warnings for cleaner builds</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Version 1.4.0 */}
          <section className="rounded-lg bg-white dark:bg-theme-card-bg p-6 border border-theme-card-border space-y-4 border border-slate-200 dark:border-transparent">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-theme-text-secondary">Version 1.4.0</h2>
                <p className="text-sm text-theme-text-secondary">October 23, 2025</p>
              </div>
            </div>
            <div className="space-y-3 text-theme-text-secondary">
              <h3 className="font-bold text-theme-text-primary">✨ New Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>7-Day Menu Forecasting:</strong> See when foods will be available over the next week with multi-day scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Admin GitHub Actions Trigger:</strong> Manually trigger menu scraper from admin panel to update database on-demand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Enhanced Scraper:</strong> Multi-day scraping with caching and configurable day range (default 7 days)</span>
                </li>
              </ul>
              
              <h3 className="font-bold text-theme-text-primary mt-4">🔧 Technical Updates</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Added next_available JSONB column with GIN index for forecast data storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Database migration to Neon PostgreSQL with proper connection handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>GitHub Actions workflow improvements with verification queries and SCRAPE_DAYS env var</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Backend endpoint for CI workflow dispatch via GitHub API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Selenium fallback gracefully skips in CI if unavailable</span>
                </li>
              </ul>

              <h3 className="font-bold text-theme-text-primary mt-4">🐛 Bug Fixes</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-error">•</span>
                  <span>Fixed Neon database not updating in production environment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-error">•</span>
                  <span>Added post-scrape verification to ensure data populated correctly</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Version 1.3.0 */}
          <section className="rounded-lg bg-white dark:bg-theme-card-bg p-6 border border-theme-card-border space-y-4 border border-slate-200 dark:border-transparent">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-theme-text-secondary">Version 1.3.0</h2>
                <p className="text-sm text-theme-text-secondary">October 2, 2025</p>
              </div>
            </div>
            <div className="space-y-3 text-theme-text-secondary">
              <h3 className="font-bold text-theme-text-primary">✨ New Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Meal Time Filter:</strong> Filter foods by breakfast 🌅, lunch ☀️, or dinner 🌙</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Enhanced Filter UI:</strong> Side-by-side dining court and meal time selectors with improved styling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Active Filter Pills:</strong> Visual indicators showing active filters with clear button</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>About Page:</strong> Learn more about BoilerFuel and how it works</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Changelog Page:</strong> Track all updates and improvements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Home Button:</strong> Easy navigation back to the home page from anywhere</span>
                </li>
              </ul>
              
              <h3 className="font-bold text-theme-text-primary mt-4">♿ Accessibility</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Added proper page titles to all pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Set HTML lang attribute for screen readers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Improved ARIA labels for decorative elements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Enhanced focus indicators for better keyboard navigation</span>
                </li>
              </ul>

              <h3 className="font-bold text-theme-text-primary mt-4">🎨 UI Improvements</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Responsive grid layout for filters (stacks on mobile)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Color-coded filter pills (yellow for dining court, blue for meal time)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Improved empty state messages based on active filters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Better visual hierarchy with emojis and icons</span>
                </li>
              </ul>

              <h3 className="font-bold text-theme-text-primary mt-4">🔧 Technical Updates</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Added meal_time column to database schema</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Database indexes for improved query performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>API now supports meal_time filtering parameter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-purple">•</span>
                  <span>Migration scripts for database updates</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Version 1.2.0 */}
          <section className="rounded-lg bg-theme-card-bg p-6 border border-theme-card-border space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-300">Version 1.2.0</h2>
                <p className="text-sm text-slate-400">September 2025</p>
              </div>
            </div>
            <div className="space-y-3 text-slate-300">
              <h3 className="font-bold text-theme-text-primary">✨ New Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Dining Court Filter:</strong> Filter menu items by specific dining locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Station Grouping:</strong> Foods organized by dining hall stations (Grill, Salad Bar, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Quick Add Button:</strong> One-click meal logging with + button</span>
                </li>
              </ul>
              
              <h3 className="font-bold text-theme-text-primary mt-4">🎨 UI Improvements</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Card-based layout for station grouping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Improved visual hierarchy with colors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-info">•</span>
                  <span>Better mobile responsiveness</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Version 1.1.0 */}
          <section className="rounded-lg bg-theme-card-bg p-6 border border-theme-card-border space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-300">Version 1.1.0</h2>
                <p className="text-sm text-slate-400">August 2025</p>
              </div>
            </div>
            <div className="space-y-3 text-slate-300">
              <h3 className="font-bold text-theme-text-primary">✨ New Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Activity Tracking:</strong> Log workouts and exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Calories Burned:</strong> Calculate net calories (consumed - burned)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Activity Database:</strong> Pre-populated with common exercises and calorie rates</span>
                </li>
              </ul>
              
              <h3 className="font-bold text-theme-text-primary mt-4">🔧 Improvements</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Separate activity log storage using cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-success">•</span>
                  <span>Admin panel support for managing activities</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Version 1.0.0 */}
          <section className="rounded-lg bg-theme-card-bg p-6 border border-theme-card-border space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-300">Version 1.0.0</h2>
                <p className="text-sm text-slate-400">July 2025</p>
              </div>
              <span className="rounded-full bg-blue-500/20 text-blue-400 px-3 py-1 text-xs font-semibold">
                Initial Release
              </span>
            </div>
            <div className="space-y-3 text-slate-300">
              <h3 className="font-bold text-theme-text-primary">🚀 Initial Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Food Logging:</strong> Track meals with calories and macros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Daily Totals:</strong> View calories, protein, carbs, and fats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Local Storage:</strong> Privacy-first approach with cookie-based storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Admin Panel:</strong> Manage food database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Menu Scraper:</strong> Automated dining hall menu updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent">•</span>
                  <span><strong>Responsive Design:</strong> Works on desktop and mobile</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-sm text-slate-500 pt-8 pb-4">
            <p>
              <Link href="/about" className="text-slate-400 hover:text-yellow-400 transition-colors">
                Learn more about BoilerFuel
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
