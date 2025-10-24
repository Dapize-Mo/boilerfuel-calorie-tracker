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

export default function DashboardDesign1() {
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
        <title>Design 1 - Modern Card Layout</title>
        <meta name="description" content="Modern card-based dashboard design" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          {/* Header with Glass Effect */}
          <header className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🎯</span>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Design 1: Modern Cards
                  </h1>
                </div>
                <p className="text-theme-text-tertiary mt-2">Sleek glass-morphism design with vibrant gradients</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/dashboard-selector"
                  className="px-4 py-2 rounded-xl bg-theme-bg-hover/50 hover:bg-theme-border-primary/50 border border-theme-border-primary text-theme-text-primary font-semibold transition-all"
                >
                  ← Back to Selector
                </Link>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold transition-all"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </header>

          {menuError && (
            <div className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {menuError}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {success}
            </div>
          )}

          {/* Date Selector */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-theme-text-primary">📅 {formatDateDisplay(selectedDate)}</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(startOfToday())}
                className="rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Stats Grid with Gradient Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCardModern
              label="Calories In"
              value={Math.round(totals.calories)}
              goal={userPrefs.showGoals ? goals.calories : null}
              gradient="from-yellow-500 to-orange-500"
              icon="🔥"
            />
            <StatCardModern
              label="Calories Out"
              value={Math.round(totals.burned)}
              gradient="from-orange-500 to-red-500"
              icon="💪"
            />
            <StatCardModern
              label="Net Calories"
              value={Math.round(totals.net)}
              gradient="from-cyan-500 to-blue-500"
              icon="📊"
            />
            <StatCardModern
              label="Protein"
              value={`${Math.round(totals.protein)}g`}
              goal={userPrefs.showGoals ? goals.protein : null}
              gradient="from-green-500 to-emerald-500"
              icon="🥩"
            />
            <StatCardModern
              label="Carbs"
              value={`${Math.round(totals.carbs)}g`}
              goal={userPrefs.showGoals ? goals.carbs : null}
              gradient="from-blue-500 to-indigo-500"
              icon="🍞"
            />
          </div>

          {/* Goals Section */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-theme-text-primary">🎯 Daily Goals</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userPrefs.showGoals}
                    onChange={handleToggleGoals}
                    className="rounded border-theme-border-primary bg-theme-bg-tertiary text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-theme-text-secondary">Show progress</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm(goals);
                    setEditingGoals(true);
                  }}
                  className="rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 px-4 py-2 text-sm font-semibold text-yellow-300 transition-all"
                >
                  Edit Goals
                </button>
              </div>
            </div>

            {editingGoals ? (
              <form onSubmit={handleSaveGoals} className="bg-theme-bg-tertiary/50 rounded-xl p-4 border border-theme-border-primary">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Calories</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={goalForm.calories}
                      onChange={(e) => setGoalForm({ ...goalForm, calories: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.protein}
                      onChange={(e) => setGoalForm({ ...goalForm, protein: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.carbs}
                      onChange={(e) => setGoalForm({ ...goalForm, carbs: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Fats (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.fats}
                      onChange={(e) => setGoalForm({ ...goalForm, fats: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Activity (min)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.activityMinutes}
                      onChange={(e) => setGoalForm({ ...goalForm, activityMinutes: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-600"
                  >
                    Save Goals
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGoals}
                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GoalCardModern label="Calories" value={goals.calories} current={Math.round(totals.calories)} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Protein" value={`${goals.protein}g`} current={`${Math.round(totals.protein)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Carbs" value={`${goals.carbs}g`} current={`${Math.round(totals.carbs)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Fats" value={`${goals.fats}g`} current={`${Math.round(totals.fats)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Activity" value={`${goals.activityMinutes} min`} current={`${Math.round(totals.activityMinutes)} min`} showProgress={userPrefs.showGoals} />
              </div>
            )}
          </div>

          {/* Food Section */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <h2 className="text-2xl font-bold mb-6 text-theme-text-primary">🍽️ Food Menu</h2>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {diningCourts.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-theme-text-secondary">Dining Court</label>
                  <select
                    value={selectedDiningCourt}
                    onChange={(e) => setSelectedDiningCourt(e.target.value)}
                    className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-yellow-500"
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
                <label className="mb-2 block text-sm font-medium text-theme-text-secondary">Meal Time</label>
                <select
                  value={selectedMealTime}
                  onChange={(e) => setSelectedMealTime(e.target.value)}
                  className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">All Meal Times</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="late lunch">Late Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            {foods.length === 0 ? (
              <p className="text-theme-text-tertiary">No foods available</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {Object.entries(foodsByStation)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([station, stationFoods]) => (
                    <div key={station} className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-yellow-500/30 overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-600 to-orange-500 px-4 py-3">
                        <h3 className="text-lg font-bold text-slate-900">{station}</h3>
                      </div>
                      <div className="p-4 space-y-2">
                        {stationFoods.map((food) => {
                          const macros = food.macros || {};
                          return (
                            <div
                              key={food.id}
                              className="bg-theme-bg-hover/50 backdrop-blur rounded-lg px-3 py-2 hover:bg-theme-border-primary/50 transition-all border border-theme-border-primary/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-theme-text-primary text-sm">{food.name}</div>
                                  <div className="text-xs text-theme-text-secondary mt-1">
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
                                  className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-theme-text-primary font-bold w-8 h-8 flex items-center justify-center transition-all shadow-lg"
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
          </div>

          {/* Meals Log */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <h3 className="text-xl font-bold mb-4 text-theme-text-primary">📝 Logged Meals</h3>
            {selectedDayLogs.length === 0 ? (
              <p className="text-theme-text-tertiary">No meals logged for this date.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedDayLogs.map((log) => {
                  const food = foodsById.get(log.foodId);
                  if (!food) return null;

                  const macros = food.macros || {};
                  const servingsValue = Number(log.servings) || 0;

                  return (
                    <div key={log.id} className="rounded-xl bg-theme-bg-tertiary/50 backdrop-blur border border-theme-border-primary p-4 hover:border-yellow-500/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-theme-text-primary">{food.name}</h4>
                          <p className="text-sm text-theme-text-tertiary">
                            {servingsValue} {servingsValue === 1 ? 'serving' : 'servings'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-yellow-400">
                            {Math.round((food.calories || 0) * servingsValue)} cal
                          </p>
                          <p className="text-xs text-theme-text-tertiary">
                            P: {Math.round((macros.protein || 0) * servingsValue)}g
                            • C: {Math.round((macros.carbs || 0) * servingsValue)}g
                            • F: {Math.round((macros.fats || 0) * servingsValue)}g
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLog(log.id)}
                        className="mt-3 text-sm text-theme-text-tertiary hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-theme-text-primary">💪 Activities</h2>
              <Link
                href="/gym"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-theme-text-primary font-semibold transition-all shadow-lg"
              >
                Gym Dashboard
              </Link>
            </div>

            {selectedDayActivityLogs.length === 0 ? (
              <p className="text-theme-text-tertiary">No activities logged for this date.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedDayActivityLogs.map((log) => {
                  const activity = activitiesById.get(log.activityId);
                  if (!activity) return null;

                  const durationValue = Number(log.duration) || 0;
                  const caloriesBurned = Math.round((activity.calories_per_hour * durationValue) / 60);

                  return (
                    <div key={log.id} className="rounded-xl bg-theme-bg-tertiary/50 backdrop-blur border border-theme-border-primary p-4 hover:border-orange-500/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-theme-text-primary">{activity.name}</h4>
                          <p className="text-sm text-theme-text-tertiary">
                            {durationValue} {durationValue === 1 ? 'minute' : 'minutes'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-400">{caloriesBurned} cal</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivityLog(log.id)}
                        className="mt-3 text-sm text-theme-text-tertiary hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCardModern({ label, value, goal, gradient, icon }) {
  const hasGoal = goal !== null && goal !== undefined;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericGoal = typeof goal === 'string' ? parseFloat(goal) : goal;
  const percentage = hasGoal && numericGoal > 0 ? Math.min(100, (numericValue / numericGoal) * 100) : null;

  return (
  <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-4 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-theme-text-tertiary font-medium">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
      {hasGoal && percentage !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-theme-text-tertiary mb-1">
            <span>Goal: {goal}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-2 bg-theme-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCardModern({ label, value, current, showProgress }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericCurrent = typeof current === 'string' ? parseFloat(current) : current;
  const percentage = numericValue > 0 ? Math.min(100, (numericCurrent / numericValue) * 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className="rounded-xl bg-theme-bg-tertiary/50 backdrop-blur border border-theme-border-primary p-3">
      <p className="text-xs text-theme-text-tertiary mb-1">{label}</p>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-lg font-bold text-theme-text-primary">{value}</p>
        {showProgress && (
          <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-theme-text-tertiary'}`}>
            ({current})
          </p>
        )}
      </div>
      {showProgress && (
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
