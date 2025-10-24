import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const USER_PREFS_COOKIE_KEY = 'boilerfuel_user_prefs_v1';

function parseGoalsCookie() {
  const raw = readCookie(GOALS_COOKIE_KEY);
  if (!raw) {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      activityMinutes: 30,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      calories: Number(parsed?.calories) || 2000,
      protein: Number(parsed?.protein) || 150,
      carbs: Number(parsed?.carbs) || 250,
      fats: Number(parsed?.fats) || 65,
      activityMinutes: Number(parsed?.activityMinutes) || 30,
    };
  } catch (error) {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      activityMinutes: 30,
    };
  }
}

function parseUserPrefsCookie() {
  const raw = readCookie(USER_PREFS_COOKIE_KEY);
  if (!raw) {
    return {
      showGoals: true,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      showGoals: parsed?.showGoals !== false,
    };
  } catch (error) {
    return {
      showGoals: true,
    };
  }
}

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

// Parse a YYYY-MM-DD string as a local date (avoid UTC shifting)
function parseLocalDate(dateString) {
  if (!dateString) return startOfToday();
  const parts = String(dateString).split('-').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const fallback = new Date(dateString);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function startOfDate(dateString) {
  const date = parseLocalDate(dateString);
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
  const date = parseLocalDate(dateString);
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

export default function DashboardDesign2() {
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [diningCourts, setDiningCourts] = useState([]);
  const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
  const [selectedMealTime, setSelectedMealTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [userPrefs, setUserPrefs] = useState(() => parseUserPrefsCookie());
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState(() => parseGoalsCookie());
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [success, setSuccess] = useState('');
  const successTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDiningCourts() {
      try {
        const data = await apiCall('/api/dining-courts');
        if (!isMounted) return;
        setDiningCourts(Array.isArray(data) ? data : []);
      } catch (error) {
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
        setMenuError(error?.message || 'Failed to load activities.');
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
    };
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

    const totalActivityMinutes = selectedDayActivityLogs.reduce((total, log) => {
      return total + (Number(log.duration) || 0);
    }, 0);

    return {
      ...consumed,
      burned,
      net: consumed.calories - burned,
      activityMinutes: totalActivityMinutes,
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

  function persistGoals(nextGoals) {
    setGoals(nextGoals);
    writeCookie(GOALS_COOKIE_KEY, JSON.stringify(nextGoals));
  }

  function persistUserPrefs(nextPrefs) {
    setUserPrefs(nextPrefs);
    writeCookie(USER_PREFS_COOKIE_KEY, JSON.stringify(nextPrefs));
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

  function handleRemoveActivityLog(logId) {
    const nextLogs = activityLogs.filter((log) => log.id !== logId);
    persistActivityLogs(nextLogs);
  }

  function handleClearLogs() {
    persistLogs([]);
    persistActivityLogs([]);
  }

  function handleSaveGoals(event) {
    event.preventDefault();
    const newGoals = {
      calories: Math.max(0, Number(goalForm.calories) || 0),
      protein: Math.max(0, Number(goalForm.protein) || 0),
      carbs: Math.max(0, Number(goalForm.carbs) || 0),
      fats: Math.max(0, Number(goalForm.fats) || 0),
      activityMinutes: Math.max(0, Number(goalForm.activityMinutes) || 0),
    };
    persistGoals(newGoals);
    setEditingGoals(false);
  }

  function handleCancelGoals() {
    setGoalForm(goals);
    setEditingGoals(false);
  }

  function handleToggleGoals() {
    const nextPrefs = { ...userPrefs, showGoals: !userPrefs.showGoals };
    persistUserPrefs(nextPrefs);
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
        <title>Design 2 - Compact Stats Grid</title>
        <meta name="description" content="Compact grid-based dashboard design" />
      </Head>
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
          {/* Compact Header */}
          <header className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-yellow-400">Design 2: Compact Grid</h1>
                <p className="text-sm text-slate-500">Dense information layout for power users</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/dashboard-selector"
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium"
                >
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </header>

          {menuError && (
            <div className="rounded border border-red-500 bg-red-500/10 px-3 py-2 text-red-400 text-sm">
              {menuError}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-500 bg-green-500/10 px-3 py-2 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Compact Date Bar */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-white font-semibold">{formatDateDisplay(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={formatDateForInput(startOfToday())}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          {/* Compact Stats Grid - All in one row on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            <CompactStatCard label="Cal In" value={Math.round(totals.calories)} color="yellow" />
            <CompactStatCard label="Cal Out" value={Math.round(totals.burned)} color="orange" />
            <CompactStatCard label="Net" value={Math.round(totals.net)} color="cyan" />
            <CompactStatCard label="Protein" value={`${Math.round(totals.protein)}g`} color="green" />
            <CompactStatCard label="Carbs" value={`${Math.round(totals.carbs)}g`} color="blue" />
            <CompactStatCard label="Fats" value={`${Math.round(totals.fats)}g`} color="purple" />
            <CompactStatCard label="Activity" value={`${Math.round(totals.activityMinutes)}m`} color="red" />
          </div>

          {/* Goals Bar */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Goals</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userPrefs.showGoals}
                    onChange={handleToggleGoals}
                    className="rounded border-slate-700 bg-slate-800 text-yellow-500 w-3 h-3"
                  />
                  <span className="text-slate-400">Show</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm(goals);
                    setEditingGoals(true);
                  }}
                  className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-300"
                >
                  Edit
                </button>
              </div>
            </div>

            {editingGoals ? (
              <form onSubmit={handleSaveGoals} className="space-y-2">
                <div className="grid grid-cols-5 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={goalForm.calories}
                    onChange={(e) => setGoalForm({ ...goalForm, calories: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs"
                    placeholder="Cal"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.protein}
                    onChange={(e) => setGoalForm({ ...goalForm, protein: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs"
                    placeholder="Pro"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.carbs}
                    onChange={(e) => setGoalForm({ ...goalForm, carbs: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs"
                    placeholder="Carb"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.fats}
                    onChange={(e) => setGoalForm({ ...goalForm, fats: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs"
                    placeholder="Fat"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.activityMinutes}
                    onChange={(e) => setGoalForm({ ...goalForm, activityMinutes: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-xs"
                    placeholder="Act"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-yellow-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGoals}
                    className="rounded bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                <CompactGoalCard label="Cal" value={goals.calories} current={Math.round(totals.calories)} show={userPrefs.showGoals} />
                <CompactGoalCard label="Pro" value={`${goals.protein}g`} current={`${Math.round(totals.protein)}g`} show={userPrefs.showGoals} />
                <CompactGoalCard label="Carb" value={`${goals.carbs}g`} current={`${Math.round(totals.carbs)}g`} show={userPrefs.showGoals} />
                <CompactGoalCard label="Fat" value={`${goals.fats}g`} current={`${Math.round(totals.fats)}g`} show={userPrefs.showGoals} />
                <CompactGoalCard label="Act" value={`${goals.activityMinutes}m`} current={`${Math.round(totals.activityMinutes)}m`} show={userPrefs.showGoals} />
              </div>
            )}
          </div>

          {/* Two Column Layout for Food and Logs */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Food Menu */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
              <h2 className="text-lg font-bold mb-3 text-white">Food Menu</h2>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {diningCourts.length > 0 && (
                  <select
                    value={selectedDiningCourt}
                    onChange={(e) => setSelectedDiningCourt(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white text-xs"
                  >
                    <option value="">All Courts</option>
                    {diningCourts.map((court) => (
                      <option key={court} value={court}>
                        {court.charAt(0).toUpperCase() + court.slice(1)}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={selectedMealTime}
                  onChange={(e) => setSelectedMealTime(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white text-xs"
                >
                  <option value="">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="late lunch">Late Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              {foods.length === 0 ? (
                <p className="text-slate-500 text-sm">No foods available</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {Object.entries(foodsByStation)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([station, stationFoods]) => (
                      <div key={station}>
                        <div className="bg-yellow-600 px-2 py-1 rounded-t text-xs font-bold text-slate-900">
                          {station}
                        </div>
                        <div className="bg-slate-800 rounded-b p-2 space-y-1">
                          {stationFoods.map((food) => {
                            const macros = food.macros || {};
                            return (
                              <div
                                key={food.id}
                                className="flex items-center justify-between gap-2 bg-slate-900 hover:bg-slate-700 rounded px-2 py-1.5 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-white text-xs truncate">{food.name}</div>
                                  <div className="text-[0.65rem] text-slate-400">
                                    {food.calories}cal • P:{Math.round(macros.protein || 0)} C:{Math.round(macros.carbs || 0)} F:{Math.round(macros.fats || 0)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(food.id, 1)}
                                  className="rounded bg-green-600 hover:bg-green-700 text-white font-bold w-6 h-6 flex items-center justify-center text-xs flex-shrink-0"
                                >
                                  +
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Logs Column */}
            <div className="space-y-4">
              {/* Meals Log */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                <h3 className="text-lg font-bold mb-3 text-white">Logged Meals</h3>
                {selectedDayLogs.length === 0 ? (
                  <p className="text-slate-500 text-sm">No meals logged</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDayLogs.map((log) => {
                      const food = foodsById.get(log.foodId);
                      if (!food) return null;

                      const macros = food.macros || {};
                      const servingsValue = Number(log.servings) || 0;

                      return (
                        <div key={log.id} className="rounded bg-slate-800 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white text-xs truncate">{food.name}</h4>
                              <p className="text-[0.65rem] text-slate-400">
                                {servingsValue}x • {Math.round((food.calories || 0) * servingsValue)}cal
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLog(log.id)}
                              className="text-[0.65rem] text-red-400 hover:text-red-300 flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Activities</h3>
                  <Link
                    href="/gym"
                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded"
                  >
                    Gym
                  </Link>
                </div>

                {selectedDayActivityLogs.length === 0 ? (
                  <p className="text-slate-500 text-sm">No activities logged</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {selectedDayActivityLogs.map((log) => {
                      const activity = activitiesById.get(log.activityId);
                      if (!activity) return null;

                      const durationValue = Number(log.duration) || 0;
                      const caloriesBurned = Math.round((activity.calories_per_hour * durationValue) / 60);

                      return (
                        <div key={log.id} className="rounded bg-slate-800 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-xs">{activity.name}</h4>
                              <p className="text-[0.65rem] text-slate-400">
                                {durationValue}min • {caloriesBurned}cal
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveActivityLog(log.id)}
                              className="text-[0.65rem] text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CompactStatCard({ label, value, color }) {
  const colorClasses = {
    yellow: 'text-yellow-400 border-yellow-900',
    orange: 'text-orange-400 border-orange-900',
    cyan: 'text-cyan-400 border-cyan-900',
    green: 'text-green-400 border-green-900',
    blue: 'text-blue-400 border-blue-900',
    purple: 'text-purple-400 border-purple-900',
    red: 'text-red-400 border-red-900',
  };

  return (
    <div className={`bg-slate-900 rounded border ${colorClasses[color]} p-2 text-center`}>
      <p className="text-[0.65rem] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
    </div>
  );
}

function CompactGoalCard({ label, value, current, show }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericCurrent = typeof current === 'string' ? parseFloat(current) : current;
  const percentage = numericValue > 0 ? Math.min(100, (numericCurrent / numericValue) * 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className="bg-slate-800 rounded p-2 text-center">
      <p className="text-[0.65rem] text-slate-400 font-medium uppercase">{label}</p>
      <p className="text-xs font-bold text-white">{value}</p>
      {show && (
        <>
          <p className={`text-[0.6rem] ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
            {current}
          </p>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
