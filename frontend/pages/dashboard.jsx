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

function startOfDate(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  const today = startOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (formatDateForInput(date) === formatDateForInput(today)) {
    return 'Today';
  } else if (formatDateForInput(date) === formatDateForInput(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function isSameDay(timestamp, selectedDateStart) {
  if (!timestamp) {
    return false;
  }
  const date = new Date(timestamp);
  return (
    date.getFullYear() === selectedDateStart.getFullYear() &&
    date.getMonth() === selectedDateStart.getMonth() &&
    date.getDate() === selectedDateStart.getDate()
  );
}

export default function Dashboard() {
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [diningCourts, setDiningCourts] = useState([]);
  const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
  const [selectedMealTime, setSelectedMealTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
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

  const selectedDateStart = useMemo(() => startOfDate(selectedDate), [selectedDate]);

  const selectedDayLogs = useMemo(
    () => logs.filter((log) => isSameDay(log.timestamp, selectedDateStart)),
    [logs, selectedDateStart]
  );

  const selectedDayActivityLogs = useMemo(
    () => activityLogs.filter((log) => isSameDay(log.timestamp, selectedDateStart)),
    [activityLogs, selectedDateStart]
  );

  const totals = useMemo(() => {
    const consumed = selectedDayLogs.reduce(
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

    const burned = selectedDayActivityLogs.reduce((total, log) => {
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
  }, [selectedDayLogs, selectedDayActivityLogs, foodsById, activitiesById]);

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
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-xl">Loading menu...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>BoilerFuel Dashboard - Track Your Meals</title>
        <meta name="description" content="Track your meals and activities with BoilerFuel calorie tracker" />
      </Head>
      <div>
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Global header provides navigation */}

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
          </header>
        {menuError && (
          <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
            {menuError}
          </div>
        )}

        <section className="rounded-lg bg-slate-900 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold">Daily Totals</h2>
            <div className="flex items-center gap-3">
              <label htmlFor="date-picker" className="text-sm font-medium text-slate-300">
                View Date:
              </label>
              <input
                type="date"
                id="date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(startOfToday())}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              />
              <span className="text-sm font-semibold text-yellow-400">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
          </div>
          {selectedDayLogs.length === 0 && selectedDayActivityLogs.length === 0 ? (
            <p className="text-slate-400">No meals or activities logged for this date.</p>
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(foodsByStation).sort(([a], [b]) => a.localeCompare(b)).map(([station, stationFoods]) => (
                <div key={station} className="rounded-lg bg-slate-800 border-2 border-yellow-600 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-3">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide text-center">
                      {station}
                    </h3>
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    {stationFoods.map((food) => {
                      const macros = food.macros || {};
                      return (
                        <div
                          key={food.id}
                          className="bg-slate-700 rounded px-3 py-2 hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-sm">{food.name}</div>
                              <div className="text-xs text-slate-300 mt-1">
                                {food.calories} cal
                                {(macros.protein || macros.carbs || macros.fats) && (
                                  <span className="block mt-0.5">
                                    P: {Math.round(macros.protein || 0)}g
                                    • C: {Math.round(macros.carbs || 0)}g
                                    • F: {Math.round(macros.fats || 0)}g
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(food.id, 1)}
                              className="rounded bg-green-600 hover:bg-green-700 text-white font-bold w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
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
            <h2 className="mb-4 text-2xl font-bold">Meals for {formatDateDisplay(selectedDate)}</h2>
            {selectedDayLogs.length === 0 ? (
              <p className="text-slate-400">No meals logged for this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayLogs.map((log) => {
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Activities for {formatDateDisplay(selectedDate)}</h2>
              <Link 
                href="/gym"
                className="text-sm bg-orange-500 hover:bg-orange-600 text-slate-900 font-semibold px-4 py-2 rounded transition-colors"
              >
                💪 Full Gym Dashboard
              </Link>
            </div>
            {selectedDayActivityLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No activities logged for this date.</p>
                <Link 
                  href="/gym"
                  className="inline-block text-orange-400 hover:text-orange-300 underline"
                >
                  Go to Gym Dashboard to log activities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayActivityLogs.slice(0, 3).map((log) => {
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
                        </div>
                      </div>
                    </article>
                  );
                })}
                {selectedDayActivityLogs.length > 3 && (
                  <Link 
                    href="/gym"
                    className="block text-center py-3 text-sm text-orange-400 hover:text-orange-300 underline"
                  >
                    View all {selectedDayActivityLogs.length} activities in Gym Dashboard
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
  </div>
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
