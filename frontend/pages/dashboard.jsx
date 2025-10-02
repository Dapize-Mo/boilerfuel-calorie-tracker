import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';

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

function parseActivityLogsCookie() {
  const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
      return [];
    }

    return parsed
      .map((entry, index) => {
        const activityId = Number(entry?.activityId);
        const duration = Number(entry?.duration);
        if (!Number.isInteger(activityId) || !Number.isFinite(duration) || duration <= 0) {
          return null;
        }

        const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
        const id = Number(entry?.id) || Date.now() - index;

        return {
          id,
          activityId,
          duration,
          timestamp,
        };
      })
      .filter(Boolean);
  } catch (error) {
    deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
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
  const [activities, setActivities] = useState([]);
  const [diningCourts, setDiningCourts] = useState([]);
  const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
  const [selectedMealTime, setSelectedMealTime] = useState('');
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [selectedFood, setSelectedFood] = useState('');
  const [servings, setServings] = useState('1');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [formError, setFormError] = useState('');
  const [activityFormError, setActivityFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [activitySuccess, setActivitySuccess] = useState('');
  const successTimeout = useRef(null);
  const activitySuccessTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDiningCourts() {
      try {
        const data = await apiCall('/api/dining-courts');
        if (!isMounted) return;
        setDiningCourts(Array.isArray(data) ? data : []);
      } catch (error) {
        // Not critical if this fails
        console.error('Failed to load dining courts:', error);
      }
    }

    async function loadActivities() {
      try {
        const data = await apiCall('/api/activities');
        if (!isMounted) return;
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        // Don't override menuError if it's already set
        if (!menuError) {
          setMenuError(error?.message || 'Failed to load activities.');
        }
      }
    }

    loadDiningCourts();
    loadActivities();
    setLoading(false);

    return () => {
      isMounted = false;
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
      if (activitySuccessTimeout.current) {
        clearTimeout(activitySuccessTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFoods() {
      try {
        const params = new URLSearchParams();
        if (selectedDiningCourt) {
          params.append('dining_court', selectedDiningCourt);
        }
        if (selectedMealTime) {
          params.append('meal_time', selectedMealTime);
        }
        const url = params.toString() ? `/api/foods?${params.toString()}` : '/api/foods';
        const data = await apiCall(url);
        if (!isMounted) return;
        setFoods(Array.isArray(data) ? data : []);
        setMenuError('');
      } catch (error) {
        if (!isMounted) return;
        setMenuError(error?.message || 'Failed to load menu items.');
      }
    }

    loadFoods();

    return () => {
      isMounted = false;
    };
  }, [selectedDiningCourt, selectedMealTime]);

  const foodsById = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => {
      if (food && typeof food.id === 'number') {
        map.set(food.id, food);
      }
    });
    return map;
  }, [foods]);

  const foodsByStation = useMemo(() => {
    const grouped = {};
    foods.forEach((food) => {
      const station = food.station || 'Other Items';
      if (!grouped[station]) {
        grouped[station] = [];
      }
      grouped[station].push(food);
    });
    return grouped;
  }, [foods]);

  const activitiesById = useMemo(() => {
    const map = new Map();
    activities.forEach((activity) => {
      if (activity && typeof activity.id === 'number') {
        map.set(activity.id, activity);
      }
    });
    return map;
  }, [activities]);

  const todayStart = useMemo(() => startOfToday(), []);

  const todaysLogs = useMemo(
    () => logs.filter((log) => isSameDay(log.timestamp, todayStart)),
    [logs, todayStart]
  );

  const todaysActivityLogs = useMemo(
    () => activityLogs.filter((log) => isSameDay(log.timestamp, todayStart)),
    [activityLogs, todayStart]
  );

  const totals = useMemo(() => {
    const consumed = todaysLogs.reduce(
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

    const burned = todaysActivityLogs.reduce((total, log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) {
        return total;
      }
      const durationValue = Number(log.duration) || 0;
      return total + ((activity.calories_per_hour || 0) * durationValue) / 60;
    }, 0);

    return {
      ...consumed,
      burned,
      net: consumed.calories - burned,
    };
  }, [todaysLogs, todaysActivityLogs, foodsById, activitiesById]);

  function persistLogs(nextLogs) {
    setLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(LOG_COOKIE_KEY);
    } else {
      writeCookie(LOG_COOKIE_KEY, JSON.stringify(nextLogs));
    }
  }

  function persistActivityLogs(nextLogs) {
    setActivityLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    } else {
      writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(nextLogs));
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

  function handleQuickAdd(foodId, servingAmount = 1) {
    const newLog = {
      id: Date.now(),
      foodId: Number(foodId),
      servings: servingAmount,
      timestamp: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...logs];
    persistLogs(nextLogs);
    setSuccess('Meal added!');

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);
  }

  function handleRemoveLog(logId) {
    const nextLogs = logs.filter((log) => log.id !== logId);
    persistLogs(nextLogs);
  }

  function handleAddActivity(event) {
    event.preventDefault();
    setActivityFormError('');
    setActivitySuccess('');

    if (!selectedActivity) {
      setActivityFormError('Please select an activity.');
      return;
    }

    const durationValue = Number(duration);
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setActivityFormError('Duration must be a positive number.');
      return;
    }

    const newLog = {
      id: Date.now(),
      activityId: Number(selectedActivity),
      duration: durationValue,
      timestamp: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...activityLogs];
    persistActivityLogs(nextLogs);
    setSelectedActivity('');
    setDuration('30');
    setActivitySuccess('Activity saved to this device!');

    if (activitySuccessTimeout.current) {
      clearTimeout(activitySuccessTimeout.current);
    }
    activitySuccessTimeout.current = window.setTimeout(() => setActivitySuccess(''), 2500);
  }

  function handleRemoveActivityLog(logId) {
    const nextLogs = activityLogs.filter((log) => log.id !== logId);
    persistActivityLogs(nextLogs);
  }

  function handleClearLogs() {
    persistLogs([]);
    persistActivityLogs([]);
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - BoilerFuel Dashboard</title>
        </Head>
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">Loading menu...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>BoilerFuel Dashboard - Track Your Meals</title>
        <meta name="description" content="Track your meals and activities with BoilerFuel calorie tracker" />
      </Head>
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/" className="hover:text-yellow-400 transition-colors">← Home</Link>
            <span className="text-slate-600">|</span>
            <Link href="/about" className="hover:text-yellow-400 transition-colors">About</Link>
            <span className="text-slate-600">|</span>
            <Link href="/changelog" className="hover:text-yellow-400 transition-colors">Changelog</Link>
          </nav>

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">BoilerFuel Dashboard</h1>
              <p className="text-slate-400">Track meals and activities—all data stays on this device only.</p>
            </div>
            <button
              type="button"
              onClick={handleClearLogs}
              className="self-start rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Clear all logs
            </button>
          </header>        {menuError && (
          <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
            {menuError}
          </div>
        )}

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Today’s Totals</h2>
          {todaysLogs.length === 0 && todaysActivityLogs.length === 0 ? (
            <p className="text-slate-400">No meals or activities logged yet today.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="Calories In" value={Math.round(totals.calories)} accent="text-yellow-500" />
              <StatCard label="Calories Out" value={Math.round(totals.burned)} accent="text-orange-500" />
              <StatCard label="Net Calories" value={Math.round(totals.net)} accent="text-cyan-500" />
              <StatCard label="Protein" value={`${Math.round(totals.protein)}g`} accent="text-green-500" />
              <StatCard label="Carbs" value={`${Math.round(totals.carbs)}g`} accent="text-blue-500" />
            </div>
          )}
        </section>

        <section className="rounded-lg bg-slate-900 p-6 mb-6">
          <h2 className="mb-4 text-2xl font-bold">Select Menu Items</h2>
          {success && (
            <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {success}
            </div>
          )}
          
          <div className="grid gap-4 mb-4 md:grid-cols-2">
            {diningCourts.length > 0 && (
              <div>
                <label htmlFor="dining-court" className="mb-2 block text-sm font-medium text-slate-300">
                  Dining Court
                </label>
                <select
                  id="dining-court"
                  value={selectedDiningCourt}
                  onChange={(event) => {
                    setSelectedDiningCourt(event.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                >
                  <option value="">All Dining Courts</option>
                  {diningCourts.map((court) => (
                    <option key={court} value={court}>
                      {court.charAt(0).toUpperCase() + court.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="meal-time" className="mb-2 block text-sm font-medium text-slate-300">
                Meal Time
              </label>
              <select
                id="meal-time"
                value={selectedMealTime}
                onChange={(event) => {
                  setSelectedMealTime(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              >
                <option value="">All Meal Times</option>
                <option value="breakfast">🌅 Breakfast</option>
                <option value="lunch">☀️ Lunch</option>
                <option value="dinner">🌙 Dinner</option>
              </select>
            </div>
          </div>

          {(selectedDiningCourt || selectedMealTime) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-slate-400">Filtering by:</span>
              {selectedDiningCourt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 px-3 py-1 text-sm font-medium text-yellow-300">
                  📍 {selectedDiningCourt.charAt(0).toUpperCase() + selectedDiningCourt.slice(1)}
                </span>
              )}
              {selectedMealTime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/50 px-3 py-1 text-sm font-medium text-blue-300">
                  {selectedMealTime === 'breakfast' && '🌅'}
                  {selectedMealTime === 'lunch' && '☀️'}
                  {selectedMealTime === 'dinner' && '🌙'}
                  {' '}{selectedMealTime.charAt(0).toUpperCase() + selectedMealTime.slice(1)}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedDiningCourt('');
                  setSelectedMealTime('');
                }}
                className="text-sm text-slate-400 hover:text-yellow-400 underline transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {foods.length === 0 ? (
            <p className="text-slate-400">
              {selectedDiningCourt || selectedMealTime
                ? 'No foods available for the selected filters' 
                : 'No foods available yet'}
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(foodsByStation).sort(([a], [b]) => a.localeCompare(b)).map(([station, stationFoods]) => (
                <div key={station} className="rounded-lg bg-slate-800 p-4">
                  <h3 className="text-xl font-bold mb-3 text-yellow-500 uppercase tracking-wide">
                    {station}
                  </h3>
                  <div className="space-y-2">
                    {stationFoods.map((food) => {
                      const macros = food.macros || {};
                      return (
                        <div
                          key={food.id}
                          className="flex items-center justify-between bg-slate-700 rounded px-4 py-3 hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-white">{food.name}</div>
                            <div className="text-sm text-slate-300">
                              {food.calories} cal
                              {(macros.protein || macros.carbs || macros.fats) && (
                                <span className="ml-2">
                                  • P: {Math.round(macros.protein || 0)}g
                                  • C: {Math.round(macros.carbs || 0)}g
                                  • F: {Math.round(macros.fats || 0)}g
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(food.id, 1)}
                              className="rounded bg-green-600 hover:bg-green-700 text-white font-bold w-10 h-10 flex items-center justify-center transition-colors"
                              title="Add 1 serving"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">Log an Activity</h2>
            {activityFormError && (
              <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
                {activityFormError}
              </div>
            )}
            {activitySuccess && (
              <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
                {activitySuccess}
              </div>
            )}
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label htmlFor="activity" className="mb-2 block text-sm font-medium">
                  Activity
                </label>
                <select
                  id="activity"
                  value={selectedActivity}
                  onChange={(event) => setSelectedActivity(event.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select an activity...</option>
                  {activities.length === 0 && <option disabled value="">No activities available yet</option>}
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} ({activity.calories_per_hour} cal/hr)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="mb-2 block text-sm font-medium">
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600"
              >
                Save Activity Locally
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
                          {(food.dining_court || food.station) && (
                            <p className="text-xs text-slate-500 mt-1">
                              {food.dining_court && (
                                <span className="capitalize">{food.dining_court}</span>
                              )}
                              {food.dining_court && food.station && ' • '}
                              {food.station}
                            </p>
                          )}
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

          <section className="rounded-lg bg-slate-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">Today&apos;s Activities</h2>
            {todaysActivityLogs.length === 0 ? (
              <p className="text-slate-400">No activities logged yet today.</p>
            ) : (
              <div className="space-y-3">
                {todaysActivityLogs.map((log) => {
                  const activity = activitiesById.get(log.activityId);
                  if (!activity) {
                    return null;
                  }

                  const durationValue = Number(log.duration) || 0;
                  const caloriesBurned = Math.round((activity.calories_per_hour * durationValue) / 60);

                  return (
                    <article key={log.id} className="rounded bg-slate-800 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{activity.name}</h3>
                          <p className="text-sm text-slate-400">
                            {durationValue} {durationValue === 1 ? 'minute' : 'minutes'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-500">
                            {caloriesBurned} cal burned
                          </p>
                          <p className="text-sm text-slate-400">
                            {activity.calories_per_hour} cal/hr
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivityLog(log.id)}
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
    </>
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
