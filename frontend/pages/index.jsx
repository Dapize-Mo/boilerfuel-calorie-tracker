import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold">BoilerFuel Calorie Tracker</h1>
        <p className="text-lg text-slate-300">
          Log dining hall meals, calculate macros, and keep everything private by storing your data
          locally in your browser. Admins can update the shared food list to keep the menu fresh.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="w-full rounded bg-yellow-500 px-5 py-3 text-center font-semibold text-slate-900 shadow hover:bg-yellow-600 sm:w-auto"
          >
            Open dashboard
          </Link>
          <Link
            href="/admin"
            className="w-full rounded border border-slate-500 px-5 py-3 text-center font-semibold text-slate-200 hover:border-yellow-500 hover:text-yellow-400 sm:w-auto"
          >
            Admin login
          </Link>
        </div>
      </section>
    </main>
  );
}
