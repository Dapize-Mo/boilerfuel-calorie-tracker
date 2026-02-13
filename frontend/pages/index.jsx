import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const [location, setLocation] = useState('All');
  const [mealTime, setMealTime] = useState('All');
  const [foods, setFoods] = useState([]);
  const [locations, setLocations] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  // Fetch dining court locations from Neon DB
  useEffect(() => {
    fetch('/api/dining-courts')
      .then(res => res.json())
      .then(courts => {
        if (Array.isArray(courts)) {
          setLocations(['All', ...courts]);
        }
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  // Fetch foods from Neon DB whenever filters change
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (location !== 'All') params.set('dining_court', location);
      if (mealTime !== 'All') params.set('meal_time', mealTime);

      const res = await fetch(`/api/foods?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch foods:', err);
      setError('Could not load foods. Check your database connection.');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [location, mealTime]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  return (
    <div className="min-h-screen p-8 bg-theme-bg-primary text-theme-text-primary font-mono max-w-4xl mx-auto">
      <Head>
        <title>BoilerFuel - Dining Menu</title>
      </Head>

      <header className="mb-12 border-b-2 border-theme-text-primary pb-8">
        <h1 className="text-3xl font-bold mb-4 uppercase tracking-widest">BoilerFuel</h1>
        <p className="mb-4 text-theme-text-secondary">
          Browse dining court menus. Data powered by Neon PostgreSQL.
        </p>
        <Link href="/admin" className="text-sm underline hover:no-underline opacity-50 hover:opacity-100">
          Admin / Settings
        </Link>
      </header>

      <main>
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1">
            <label className="block mb-2 font-bold uppercase text-sm">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-theme-text-primary bg-theme-bg-secondary text-theme-text-primary rounded-none"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex-1">
            <label className="block mb-2 font-bold uppercase text-sm">Meal Time</label>
            <select
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full p-2 border border-theme-text-primary bg-theme-bg-secondary text-theme-text-primary rounded-none"
            >
              {mealTimes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="border-t border-theme-text-primary">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-text-primary/20">
                <th className="py-4 font-bold uppercase text-sm">Food Item</th>
                <th className="py-4 font-bold uppercase text-sm">Location</th>
                <th className="py-4 font-bold uppercase text-sm">Meal</th>
                <th className="py-4 font-bold uppercase text-sm text-right">Calories</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-theme-text-secondary">
                    Loading foods...
                  </td>
                </tr>
              ) : foods.length > 0 ? (
                foods.map(food => (
                  <tr key={food.id} className="border-b border-theme-text-primary/10 hover:bg-theme-bg-secondary">
                    <td className="py-3 pr-4">{food.name}</td>
                    <td className="py-3 px-4 text-theme-text-secondary">{food.dining_court}</td>
                    <td className="py-3 px-4 text-theme-text-secondary">{food.meal_time}</td>
                    <td className="py-3 pl-4 text-right font-mono">{food.calories}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-theme-text-secondary italic">
                    No foods found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!loading && foods.length > 0 && (
            <p className="mt-4 text-xs text-theme-text-secondary opacity-50">
              Showing {foods.length} item{foods.length !== 1 ? 's' : ''} from database
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
