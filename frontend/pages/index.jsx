import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>BoilerFuel Calorie Tracker - Home</title>
        <meta name="description" content="Track dining hall meals, calculate macros, and keep your data private" />
      </Head>
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          BoilerFuel Calorie Tracker
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Log dining hall meals, calculate macros, and keep everything private by storing your data
          locally in your browser. Admins can update the shared food list to keep the menu fresh.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-yellow-500 px-5 py-3 text-center font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5 hover:bg-yellow-400"
          >
            Open dashboard
          </Link>
          <Link
            href="/gym"
            className="rounded-md bg-orange-500 px-5 py-3 text-center font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5 hover:bg-orange-400"
          >
            💪 Gym Dashboard
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-slate-600 px-5 py-3 text-center font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-yellow-500 hover:text-yellow-400"
          >
            Admin login
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/about" className="text-slate-400 hover:text-yellow-400 transition-colors">About</Link>
          <span className="text-slate-600">•</span>
          <Link href="/changelog" className="text-slate-400 hover:text-yellow-400 transition-colors">Changelog</Link>
        </div>
      </section>
    </>
  );
}
