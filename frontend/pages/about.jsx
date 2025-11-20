import Link from 'next/link';
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>About - BoilerFuel</title>
        <meta name="description" content="Learn about BoilerFuel Calorie Tracker" />
      </Head>
      <div className="mx-auto max-w-4xl space-y-10">
          {/* Header */}
          <header className="border-b border-theme-border-primary pb-8">
            <h1 className="text-5xl font-bold mb-4">About BoilerFuel</h1>
            <p className="text-xl text-theme-text-tertiary">Your personal dining hall nutrition tracker</p>
          </header>

          {/* What is BoilerFuel */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-5">
            <h2 className="text-2xl font-bold text-yellow-500">What is BoilerFuel?</h2>
            <p className="text-theme-text-secondary leading-relaxed text-lg">
              BoilerFuel is a privacy-focused calorie and macro tracker designed for college students and campus
              dining halls. Track your meals, monitor your nutrition, and make informed decisions about your diet—all
              while keeping your data completely private on your device.
            </p>
          </section>

          {/* Key Features */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-yellow-500">Key Features</h2>
            <ul className="space-y-3 text-theme-text-secondary">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">100% Privacy-First:</strong> All your meal logs stay on your device. 
                  No accounts, no cloud storage, no tracking.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">Complete Nutrition Info:</strong> Track calories, protein, carbs, 
                  and fats for every meal.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">Activity Tracking:</strong> Log your workouts and see net calories 
                  for the day.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">Filter by Dining Hall & Meal Time:</strong> Easily find foods from 
                  your favorite location and meal period.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">Organized by Station:</strong> Menu items grouped by dining hall 
                  stations (Grill, Salad Bar, etc.).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <strong className="text-theme-text-primary">Quick Add:</strong> One-click meal logging for fast tracking.
                </div>
              </li>
            </ul>
          </section>

          {/* How It Works */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-yellow-500">How It Works</h2>
            <div className="space-y-4 text-theme-text-secondary">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                  1
                </div>
                <div>
                  <strong className="text-theme-text-primary">Browse the Menu:</strong> Select your dining hall and meal time 
                  to see available foods.
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                  2
                </div>
                <div>
                  <strong className="text-theme-text-primary">Log Your Meals:</strong> Click the + button to quickly add foods 
                  to your daily log.
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                  3
                </div>
                <div>
                  <strong className="text-theme-text-primary">Track Activities:</strong> Log your workouts to see calories 
                  burned vs. consumed.
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                  4
                </div>
                <div>
                  <strong className="text-theme-text-primary">Monitor Your Progress:</strong> View your daily totals and make 
                  informed nutrition decisions.
                </div>
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-yellow-500">Privacy & Security</h2>
            <div className="space-y-3 text-theme-text-secondary">
              <p>
                <strong className="text-theme-text-primary">Your data is yours.</strong> BoilerFuel stores all meal and activity 
                logs locally in your browser using cookies. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>No user accounts or sign-ups required</li>
                <li>No personal data sent to servers</li>
                <li>No tracking or analytics on your eating habits</li>
                <li>Data stays on your device only</li>
              </ul>
              <p className="text-sm text-theme-text-tertiary mt-4">
                <strong>Note:</strong> Because data is stored locally, it won&apos;t sync across devices. If you clear 
                your browser cookies, your logs will be deleted.
              </p>
            </div>
          </section>

          {/* Technology */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-yellow-500">Technology</h2>
            <p className="text-theme-text-secondary">
              BoilerFuel is built with modern web technologies:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-theme-bg-tertiary rounded p-4">
                <h3 className="font-bold text-theme-text-primary mb-2">Frontend</h3>
                <ul className="text-sm text-theme-text-tertiary space-y-1">
                  <li>• Next.js & React</li>
                  <li>• TailwindCSS</li>
                  <li>• Deployed on Vercel</li>
                </ul>
              </div>
              <div className="bg-theme-bg-tertiary rounded p-4">
                <h3 className="font-bold text-theme-text-primary mb-2">Backend</h3>
                <ul className="text-sm text-theme-text-tertiary space-y-1">
                  <li>• Flask (Python)</li>
                  <li>• PostgreSQL Database</li>
                  <li>• Deployed on a cloud platform</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Admin Info */}
          <section className="rounded-lg bg-theme-card-bg p-8 space-y-5">
            <h2 className="text-2xl font-bold text-yellow-500">For Administrators</h2>
            <p className="text-theme-text-secondary">
              Administrators can log in to manage the shared food database and activities list. The admin panel 
              allows you to add, update, and remove menu items to keep the information current for all users.
            </p>
            <Link 
              href="/admin"
              className="inline-block rounded bg-theme-bg-tertiary border border-theme-card-border px-4 py-2 text-sm font-semibold text-theme-text-secondary hover:border-yellow-500 hover:text-theme-accent transition-colors"
            >
              Admin Login →
            </Link>
          </section>

          {/* Get Started */}
          <section className="rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-10 text-center space-y-5">
            <h2 className="text-2xl font-bold">Ready to Start Tracking?</h2>
            <p className="text-theme-text-secondary">
              Head to the dashboard and begin logging your meals today!
            </p>
            <Link 
              href="/dashboard"
              className="inline-block rounded bg-yellow-500 px-6 py-3 font-semibold text-slate-900 hover:bg-yellow-600 transition-colors"
            >
              Open Dashboard
            </Link>
          </section>

        </div>
    </>
  );
}
