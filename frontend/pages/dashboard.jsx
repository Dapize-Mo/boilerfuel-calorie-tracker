import { useEffect, useMemo, useRef, useState } from 'react';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';

function parseLogsCookie() {
  const raw = readCookie(LOG_COOKIE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(LOG_COOKIE_KEY);
      return [];
    }

    return parsed
      .map((entry, index) => {
        const foodId = Number(entry?.foodId);
        const servings = Number(entry?.servings);
        if (!Number.isInteger(foodId) || !Number.isFinite(servings) || servings <= 0) {
          return null;
        }

        const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
        const id = Number(entry?.id) || Date.now() - index;

        return {
          id,
          foodId,
          servings,
          timestamp,
        };
      })
      .filter(Boolean);
  } catch (error) {
    deleteCookie(LOG_COOKIE_KEY);
    return [];
  }
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isSameDay(timestamp, todayStart) {
  if (!timestamp) {
    return false;
  }
  const date = new Date(timestamp);
  return (
    date.getFullYear() === todayStart.getFullYear() &&
    date.getMonth() === todayStart.getMonth() &&
    date.getDate() === todayStart.getDate()
  );
}

export default function Dashboard() {
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [selectedFood, setSelectedFood] = useState('');
  const [servings, setServings] = useState('1');
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const successTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFoods() {
      try {
        const data = await apiCall('/api/foods');
        if (!isMounted) return;
        setFoods(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setMenuError(error?.message || 'Failed to load menu items.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFoods();

    return () => {
      isMounted = false;
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  const foodsById = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => {
      if (food && typeof food.id === 'number') {
        map.set(food.id, food);
      }
    });
    return map;
  }, [foods]);

  const todayStart = useMemo(() => startOfToday(), []);

  const todaysLogs = useMemo(
    () => logs.filter((log) => isSameDay(log.timestamp, todayStart)),
    [logs, todayStart]
  );

  const totals = useMemo(() => {
    return todaysLogs.reduce(
      (acc, log) => {
        const food = foodsById.get(log.foodId);
        if (!food) {
          return acc;
        }

        const servingsValue = Number(log.servings) || 0;
        const macros = food.macros || {};

        acc.calories += (food.calories || 0) * servingsValue;
        acc.protein += (macros.protein || 0) * servingsValue;
        acc.carbs += (macros.carbs || 0) * servingsValue;
        acc.fats += (macros.fats || 0) * servingsValue;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [todaysLogs, foodsById]);

  function persistLogs(nextLogs) {
    setLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(LOG_COOKIE_KEY);
    } else {
      writeCookie(LOG_COOKIE_KEY, JSON.stringify(nextLogs));
    }
  }

  function handleAddLog(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    if (!selectedFood) {
      setFormError('Please select a food item.');
      return;
    }

    const servingsValue = Number(servings);
    if (!Number.isFinite(servingsValue) || servingsValue <= 0) {
      setFormError('Servings must be a positive number.');
      return;
    }

    const newLog = {
      id: Date.now(),
      foodId: Number(selectedFood),
      servings: servingsValue,
      timestamp: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...logs];
    persistLogs(nextLogs);
    setSelectedFood('');
    setServings('1');
    setSuccess('Meal saved to this device!');

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);
  }

  function handleRemoveLog(logId) {
    const nextLogs = logs.filter((log) => log.id !== logId);
    persistLogs(nextLogs);
  }

  function handleClearLogs() {
    persistLogs([]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading menu...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">BoilerFuel Dashboard</h1>
            <p className="text-slate-400">Meals you log here stay on this device only.</p>
          </div>
          <button
            type="button"
            onClick={handleClearLogs}
            className="self-start rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Clear saved meals
          </button>
        </header>

        {menuError && (
          <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
            {menuError}
          </div>
        )}

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Today’s Totals</h2>
          {todaysLogs.length === 0 ? (
            <p className="text-slate-400">No meals logged yet today.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Calories" value={Math.round(totals.calories)} accent="text-yellow-500" />
              <StatCard label="Protein" value={`${Math.round(totals.protein)}g`} accent="text-green-500" />
              <StatCard label="Carbs" value={`${Math.round(totals.carbs)}g`} accent="text-blue-500" />
              <StatCard label="Fats" value={`${Math.round(totals.fats)}g`} accent="text-red-500" />
            </div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">Log a Meal</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
                {formError}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
                {success}
              </div>
            )}
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label htmlFor="food" className="mb-2 block text-sm font-medium">
                  Food Item
                </label>
                <select
                  id="food"
                  value={selectedFood}
                  onChange={(event) => setSelectedFood(event.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select a food...</option>
                  {foods.length === 0 && <option disabled value="">No foods available yet</option>}
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({food.calories} cal)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="servings" className="mb-2 block text-sm font-medium">
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-yellow-500 px-4 py-2 font-semibold text-slate-900 hover:bg-yellow-600"
              >
                Save Meal Locally
              </button>
            </form>
          </section>

          <section className="rounded-lg bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">Today’s Meals</h2>
            {todaysLogs.length === 0 ? (
              <p className="text-slate-400">No meals logged yet today.</p>
            ) : (
              <div className="space-y-3">
                {todaysLogs.map((log) => {
                  const food = foodsById.get(log.foodId);
                  if (!food) {
                    return null;
                  }

                  const macros = food.macros || {};
                  const servingsValue = Number(log.servings) || 0;

                  return (
                    <article key={log.id} className="rounded bg-slate-800 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{food.name}</h3>
                          <p className="text-sm text-slate-400">
                            {servingsValue} {servingsValue === 1 ? 'serving' : 'servings'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-yellow-500">
                            {Math.round((food.calories || 0) * servingsValue)} cal
                          </p>
                          <p className="text-sm text-slate-400">
                            P: {Math.round((macros.protein || 0) * servingsValue)}g • C:{' '}
                            {Math.round((macros.carbs || 0) * servingsValue)}g • F:{' '}
                            {Math.round((macros.fats || 0) * servingsValue)}g
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLog(log.id)}
                        className="mt-3 text-sm text-slate-400 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded bg-slate-800 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
