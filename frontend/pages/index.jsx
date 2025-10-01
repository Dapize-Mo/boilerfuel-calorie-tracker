import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold">BoilerFuel Calorie Tracker</h1>
        <p className="text-lg text-slate-300">
          Track your dining hall meals, log servings, and keep an eye on your macros.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-3 px-6 rounded"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded"
          >
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
