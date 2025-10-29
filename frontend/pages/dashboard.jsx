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

export default function Dashboard() {
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [userPrefs, setUserPrefs] = useState(() => parseUserPrefsCookie());
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState(() => parseGoalsCookie());
  const [loading, setLoading] = useState(true);
  const successTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [foodsData, activitiesData] = await Promise.all([
          apiCall('/api/foods'),
          apiCall('/api/activities')
        ]);
        if (!isMounted) return;
        setFoods(Array.isArray(foodsData) ? foodsData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
      const timeout = successTimeout.current;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const foodsById = useMemo(() => {
    const map = new Map();
    if (Array.isArray(foods)) {
      foods.forEach((food) => {
        if (food && typeof food.id === 'number') {
          map.set(food.id, food);
        }
      });
    }
    return map;
  }, [foods]);

  const activitiesById = useMemo(() => {
    const map = new Map();
    if (Array.isArray(activities)) {
      activities.forEach((activity) => {
        if (activity && typeof activity.id === 'number') {
          map.set(activity.id, activity);
        }
      });
    }
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
    try {
      const consumed = (Array.isArray(selectedDayLogs) ? selectedDayLogs : []).reduce(
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

      const burned = (Array.isArray(selectedDayActivityLogs) ? selectedDayActivityLogs : []).reduce((total, log) => {
        const activity = activitiesById.get(log.activityId);
        if (!activity) {
          return total;
        }
        const durationValue = Number(log.duration) || 0;
        return total + ((activity.calories_per_hour || 0) * durationValue) / 60;
      }, 0);

      const totalActivityMinutes = (Array.isArray(selectedDayActivityLogs) ? selectedDayActivityLogs : []).reduce((total, log) => {
        return total + (Number(log.duration) || 0);
      }, 0);

      return {
        ...consumed,
        burned,
        net: consumed.calories - burned,
        activityMinutes: totalActivityMinutes,
      };
    } catch (error) {
      console.error('Error calculating totals:', error);
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        burned: 0,
        net: 0,
        activityMinutes: 0,
      };
    }
  }, [selectedDayLogs, selectedDayActivityLogs, foodsById, activitiesById]);

  function persistGoals(nextGoals) {
    setGoals(nextGoals);
    writeCookie(GOALS_COOKIE_KEY, JSON.stringify(nextGoals));
  }

  function persistUserPrefs(nextPrefs) {
    setUserPrefs(nextPrefs);
    writeCookie(USER_PREFS_COOKIE_KEY, JSON.stringify(nextPrefs));
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
        <title>BoilerFuel Dashboard - Overview</title>
        <meta name="description" content="Your health and fitness overview with BoilerFuel" />
      </Head>
  <div className="min-h-screen bg-theme-bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          {/* Header */}
          <header className="pb-6 border-b border-theme-border-primary">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🎯</span>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Dashboard Overview
                  </h1>
                </div>
                <p className="text-theme-text-tertiary mt-2">Your daily nutrition and fitness summary—all data stays on this device only.</p>
              </div>
            </div>
          </header>

          {/* Date Selector */}
          <div className="py-6 border-b border-theme-border-primary">
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
              value={Math.round(totals?.calories || 0)}
              goal={userPrefs.showGoals ? goals.calories : null}
              gradient="from-yellow-500 to-orange-500"
              icon="🔥"
            />
            <StatCardModern
              label="Calories Out"
              value={Math.round(totals?.burned || 0)}
              gradient="from-orange-500 to-red-500"
              icon="💪"
            />
            <StatCardModern
              label="Net Calories"
              value={Math.round(totals?.net || 0)}
              gradient="from-cyan-500 to-blue-500"
              icon="📊"
            />
            <StatCardModern
              label="Protein"
              value={`${Math.round(totals?.protein || 0)}g`}
              goal={userPrefs.showGoals ? goals.protein : null}
              gradient="from-green-500 to-emerald-500"
              icon="🥩"
            />
            <StatCardModern
              label="Carbs"
              value={`${Math.round(totals?.carbs || 0)}g`}
              goal={userPrefs.showGoals ? goals.carbs : null}
              gradient="from-blue-500 to-indigo-500"
              icon="🍞"
            />
          </div>

          {/* Goals Section */}
          <div className="py-6 border-t border-theme-border-primary">
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
                    className="rounded-xl bg-theme-bg-tertiary px-4 py-2 text-sm font-semibold text-theme-text-primary hover:bg-theme-bg-hover"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GoalCardModern label="Calories" value={goals.calories} current={Math.round(totals?.calories || 0)} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Protein" value={`${goals.protein}g`} current={`${Math.round(totals?.protein || 0)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Carbs" value={`${goals.carbs}g`} current={`${Math.round(totals?.carbs || 0)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Fats" value={`${goals.fats}g`} current={`${Math.round(totals?.fats || 0)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Activity" value={`${goals.activityMinutes} min`} current={`${Math.round(totals?.activityMinutes || 0)} min`} showProgress={userPrefs.showGoals} />
              </div>
            )}
          </div>

          {/* Quick Access Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Food Tracker Card */}
            <Link
              href="/food-dashboard"
              className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 hover:border-theme-accent/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🍽️</span>
                  <div>
                    <h2 className="text-2xl font-bold text-theme-text-primary group-hover:text-yellow-400 transition-colors">Food Tracker</h2>
                    <p className="text-theme-text-tertiary">Track your meals and nutrition</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-theme-text-tertiary group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-tertiary">Today&apos;s meals logged:</span>
                  <span className="text-theme-text-primary font-semibold">{selectedDayLogs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-tertiary">Calories consumed:</span>
                  <span className="text-yellow-400 font-semibold">{Math.round(totals?.calories || 0)} cal</span>
                </div>
              </div>
            </Link>

            {/* Gym Tracker Card */}
            <Link
              href="/gym"
              className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 hover:border-theme-accent/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">💪</span>
                  <div>
                    <h2 className="text-2xl font-bold text-theme-text-primary group-hover:text-orange-400 transition-colors">Gym Tracker</h2>
                    <p className="text-theme-text-tertiary">Log your workouts and activities</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-theme-text-tertiary group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-tertiary">Today&apos;s activities:</span>
                  <span className="text-theme-text-primary font-semibold">{selectedDayActivityLogs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-tertiary">Calories burned:</span>
                  <span className="text-orange-400 font-semibold">{Math.round(totals?.burned || 0)} cal</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid gap-6 md:grid-cols-2 py-6 border-t border-theme-border-primary">
            {/* Recent Meals */}
            <div className="p-6 border-l-4 border-theme-border-primary hover:border-yellow-500 transition-colors bg-theme-bg-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-theme-text-primary">📝 Recent Meals</h3>
                <Link href="/food-dashboard" className="text-sm text-yellow-400 hover:text-yellow-300">
                  View all →
                </Link>
              </div>
              {selectedDayLogs.length === 0 ? (
                <p className="text-theme-text-tertiary">No meals logged today.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayLogs.slice(0, 3).map((log) => {
                    const food = foodsById.get(log.foodId);
                    if (!food) return null;
                    const servingsValue = Number(log.servings) || 0;
                    return (
                      <div key={log.id} className="rounded-lg bg-theme-bg-tertiary/50 p-3 border border-theme-border-primary">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-theme-text-primary text-sm">{food.name}</p>
                            <p className="text-xs text-theme-text-tertiary">{servingsValue} {servingsValue === 1 ? 'serving' : 'servings'}</p>
                          </div>
                          <p className="font-bold text-yellow-400 text-sm">{Math.round((food.calories || 0) * servingsValue)} cal</p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedDayLogs.length > 3 && (
                    <p className="text-center text-sm text-theme-text-tertiary">+{selectedDayLogs.length - 3} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="p-6 border-l-4 border-theme-border-primary hover:border-orange-500 transition-colors bg-theme-bg-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-theme-text-primary">🏋️ Recent Activities</h3>
                <Link href="/gym" className="text-sm text-orange-400 hover:text-orange-300">
                  View all →
                </Link>
              </div>
              {selectedDayActivityLogs.length === 0 ? (
                <p className="text-theme-text-tertiary">No activities logged today.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayActivityLogs.slice(0, 3).map((log) => {
                    const activity = activitiesById.get(log.activityId);
                    if (!activity) return null;
                    const durationValue = Number(log.duration) || 0;
                    const caloriesBurned = Math.round((activity.calories_per_hour * durationValue) / 60);
                    return (
                      <div key={log.id} className="rounded-lg bg-theme-bg-tertiary/50 p-3 border border-theme-border-primary">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-theme-text-primary text-sm">{activity.name}</p>
                            <p className="text-xs text-theme-text-tertiary">{durationValue} {durationValue === 1 ? 'minute' : 'minutes'}</p>
                          </div>
                          <p className="font-bold text-orange-400 text-sm">{caloriesBurned} cal</p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedDayActivityLogs.length > 3 && (
                    <p className="text-center text-sm text-theme-text-tertiary">+{selectedDayActivityLogs.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
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
  <div className="p-4 border-l-4 border-theme-border-primary hover:border-yellow-500 transition-colors bg-theme-bg-primary/30">
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
          <div className="h-2 bg-theme-border-primary overflow-hidden">
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
    <div className="p-3 border-l-2 border-theme-border-primary hover:border-yellow-500 transition-colors bg-theme-bg-primary/20">
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
  <div className="h-1.5 bg-theme-border-primary overflow-hidden">
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
