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
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [userPrefs, setUserPrefs] = useState(() => parseUserPrefsCookie());
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState(() => parseGoalsCookie());
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
              <StatCard 
                label="Calories In" 
                value={Math.round(totals.calories)} 
                goal={userPrefs.showGoals ? goals.calories : null}
                accent="text-yellow-500" 
              />
              <StatCard 
                label="Calories Out" 
                value={Math.round(totals.burned)} 
                accent="text-orange-500" 
              />
              <StatCard 
                label="Net Calories" 
                value={Math.round(totals.net)} 
                accent="text-cyan-500" 
              />
              <StatCard 
                label="Protein" 
                value={`${Math.round(totals.protein)}g`} 
                goal={userPrefs.showGoals ? goals.protein : null}
                accent="text-green-500" 
              />
              <StatCard 
                label="Carbs" 
                value={`${Math.round(totals.carbs)}g`} 
                goal={userPrefs.showGoals ? goals.carbs : null}
                accent="text-blue-500" 
              />
            </div>
          )}
          
          {/* Goals Section */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Daily Goals</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userPrefs.showGoals}
                    onChange={handleToggleGoals}
                    className="rounded border-slate-700 bg-slate-800 text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-slate-300">Show progress</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm(goals);
                    setEditingGoals(true);
                  }}
                  className="rounded bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Edit Goals
                </button>
              </div>
            </div>

            {editingGoals ? (
              <form onSubmit={handleSaveGoals} className="bg-slate-800 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label htmlFor="goal-calories" className="block text-xs font-medium text-slate-400 mb-1">
                      Calories
                    </label>
                    <input
                      id="goal-calories"
                      type="number"
                      min="0"
                      step="50"
                      value={goalForm.calories}
                      onChange={(e) => setGoalForm({ ...goalForm, calories: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-protein" className="block text-xs font-medium text-slate-400 mb-1">
                      Protein (g)
                    </label>
                    <input
                      id="goal-protein"
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.protein}
                      onChange={(e) => setGoalForm({ ...goalForm, protein: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-carbs" className="block text-xs font-medium text-slate-400 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      id="goal-carbs"
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.carbs}
                      onChange={(e) => setGoalForm({ ...goalForm, carbs: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-fats" className="block text-xs font-medium text-slate-400 mb-1">
                      Fats (g)
                    </label>
                    <input
                      id="goal-fats"
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.fats}
                      onChange={(e) => setGoalForm({ ...goalForm, fats: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal-activity" className="block text-xs font-medium text-slate-400 mb-1">
                      Activity (min)
                    </label>
                    <input
                      id="goal-activity"
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.activityMinutes}
                      onChange={(e) => setGoalForm({ ...goalForm, activityMinutes: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-600 transition-colors"
                  >
                    Save Goals
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGoals}
                    className="rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GoalCard label="Calories" value={goals.calories} current={Math.round(totals.calories)} showProgress={userPrefs.showGoals} />
                <GoalCard label="Protein" value={`${goals.protein}g`} current={`${Math.round(totals.protein)}g`} showProgress={userPrefs.showGoals} />
                <GoalCard label="Carbs" value={`${goals.carbs}g`} current={`${Math.round(totals.carbs)}g`} showProgress={userPrefs.showGoals} />
                <GoalCard label="Fats" value={`${goals.fats}g`} current={`${Math.round(totals.fats)}g`} showProgress={userPrefs.showGoals} />
                <GoalCard label="Activity" value={`${goals.activityMinutes} min`} current={`${Math.round(totals.activityMinutes)} min`} showProgress={userPrefs.showGoals} />
              </div>
            )}
          </div>
        </section>

        {/* Two big blocks: Food and Gym */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Food Block */}
          <section className="rounded-lg bg-slate-900 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🍽️ Food</h2>
            </div>

            {success && (
              <div className="rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
                {success}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
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
                  <option value="late lunch">🕒 Late Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                </select>
              </div>
            </div>

            {(selectedDiningCourt || selectedMealTime) && (
              <div className="flex flex-wrap gap-2 items-center">
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
                    {selectedMealTime === 'late lunch' && '🕒'}
                    {selectedMealTime === 'dinner' && '🌙'}
                    {' '}{selectedMealTime.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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

            {/* Menu items */}
            {foods.length === 0 ? (
              <p className="text-slate-400">
                {selectedDiningCourt || selectedMealTime
                  ? 'No foods available for the selected filters'
                  : 'No foods available yet'}
              </p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {Object.entries(foodsByStation)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([station, stationFoods]) => (
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
                                    {food.meal_time && (
                                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-900 text-blue-200 font-semibold text-[0.7rem] align-middle">
                                        {food.meal_time.charAt(0).toUpperCase() + food.meal_time.slice(1)}
                                      </span>
                                    )}
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

            {/* Meals list */}
            <div>
              <h3 className="mb-4 text-xl font-bold">Meals for {formatDateDisplay(selectedDate)}</h3>
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
                            <h4 className="font-semibold">{food.name}</h4>
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
            </div>
          </section>

          {/* Gym Block */}
          <section className="rounded-lg bg-slate-900 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">💪 Gym</h2>
              <Link
                href="/gym"
                className="text-sm bg-orange-500 hover:bg-orange-600 text-slate-900 font-semibold px-4 py-2 rounded transition-colors"
              >
                Open Gym Dashboard
              </Link>
            </div>

            {/* Activity Progress */}
            {userPrefs.showGoals && (
              <div className="rounded-lg bg-slate-800 p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-300">Daily Activity Goal</p>
                  <p className="text-lg font-bold text-orange-400">
                    {Math.round(totals.activityMinutes)} / {goals.activityMinutes} min
                  </p>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      totals.activityMinutes >= goals.activityMinutes ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (totals.activityMinutes / goals.activityMinutes) * 100)}%`,
                    }}
                  />
                </div>
                {totals.activityMinutes >= goals.activityMinutes && (
                  <p className="text-xs text-green-400 mt-2">🎉 Goal achieved!</p>
                )}
              </div>
            )}

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
                <h3 className="text-xl font-bold">Activities for {formatDateDisplay(selectedDate)}</h3>
                {selectedDayActivityLogs.slice(0, 4).map((log) => {
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
                          <h4 className="font-semibold">{activity.name}</h4>
                          <p className="text-sm text-slate-400">
                            {durationValue} {durationValue === 1 ? 'minute' : 'minutes'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-500">{caloriesBurned} cal burned</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {selectedDayActivityLogs.length > 4 && (
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

function StatCard({ label, value, goal, accent }) {
  const hasGoal = goal !== null && goal !== undefined;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericGoal = typeof goal === 'string' ? parseFloat(goal) : goal;
  const percentage = hasGoal && numericGoal > 0 ? Math.min(100, (numericValue / numericGoal) * 100) : null;

  return (
    <div className="rounded bg-slate-800 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      {hasGoal && percentage !== null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Goal: {goal}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${accent.replace('text-', 'bg-')} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ label, value, current, showProgress }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericCurrent = typeof current === 'string' ? parseFloat(current) : current;
  const percentage = numericValue > 0 ? Math.min(100, (numericCurrent / numericValue) * 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className="rounded bg-slate-800 p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-lg font-bold text-white">{value}</p>
        {showProgress && (
          <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
            ({current})
          </p>
        )}
      </div>
      {showProgress && (
        <div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
