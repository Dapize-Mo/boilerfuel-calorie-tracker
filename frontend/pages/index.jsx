import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const [location, setLocation] = useState('All');
  const [mealTime, setMealTime] = useState('All');

  const locations = ['All', 'Ford', 'Wiley', 'Hillenbrand', 'Earhart', 'Windsor'];
  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  // Mock data for display purposes
  const foods = [
    { id: 1, name: 'Scrambled Eggs', location: 'Earhart', meal: 'Breakfast', calories: 150 },
    { id: 2, name: 'Grilled Chicken Breast', location: 'Ford', meal: 'Lunch', calories: 180 },
    { id: 3, name: 'Cheeseburger', location: 'Wiley', meal: 'Dinner', calories: 450 },
    { id: 4, name: 'Oatmeal', location: 'Windsor', meal: 'Breakfast', calories: 120 },
    { id: 5, name: 'Pasta with Marinara', location: 'Hillenbrand', meal: 'Lunch', calories: 300 },
    { id: 6, name: 'Pizza Slice', location: 'Ford', meal: 'Dinner', calories: 280 },
  ];

  const filteredFoods = foods.filter(food => {
    const locMatch = location === 'All' || food.location === location;
    const timeMatch = mealTime === 'All' || food.meal === mealTime;
    return locMatch && timeMatch;
  });

  return (
    <div className="min-h-screen p-8 bg-theme-bg-primary text-theme-text-primary font-mono max-w-4xl mx-auto">
      <Head>
        <title>BoilerFuel - Simply Food</title>
      </Head>

      <header className="mb-12 border-b-2 border-theme-text-primary pb-8">
        <h1 className="text-3xl font-bold mb-4 uppercase tracking-widest">Statua: Restarting Project</h1>
        <p className="mb-4 text-theme-text-secondary">
          Rest Notice: I am restarting the project. Just listing available foods for now.
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
              {filteredFoods.map(food => (
                <tr key={food.id} className="border-b border-theme-text-primary/10 hover:bg-theme-bg-secondary">
                  <td className="py-3 pr-4">{food.name}</td>
                  <td className="py-3 px-4 text-theme-text-secondary">{food.location}</td>
                  <td className="py-3 px-4 text-theme-text-secondary">{food.meal}</td>
                  <td className="py-3 pl-4 text-right font-mono">{food.calories}</td>
                </tr>
              ))}
              {filteredFoods.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-theme-text-secondary italic">
                    No foods found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
