import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';

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

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function GymDashboard() {
  const [activities, setActivities] = useState([]);
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('today'); // today, week, month, all
  const successTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        const data = await apiCall('/api/activities');
        if (!isMounted) return;
        setActivities(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load activities.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      isMounted = false;
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  const activitiesById = useMemo(() => {
    const map = new Map();
    activities.forEach((activity) => {
      if (activity && typeof activity.id === 'number') {
        map.set(activity.id, activity);
      }
    });
    return map;
  }, [activities]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    return activityLogs
      .filter((log) => {
        const logDate = new Date(log.timestamp);
        
        switch (viewMode) {
          case 'today':
            return startOfDay(logDate).getTime() === today.getTime();
          case 'week':
            return logDate >= weekStart;
          case 'month':
            return logDate >= monthStart;
          case 'all':
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [activityLogs, viewMode]);

  const stats = useMemo(() => {
    const totalCalories = filteredLogs.reduce((sum, log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) return sum;
      return sum + (activity.calories_per_hour * log.duration) / 60;
    }, 0);

    const totalDuration = filteredLogs.reduce((sum, log) => sum + log.duration, 0);

    const activityBreakdown = {};
    filteredLogs.forEach((log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) return;
      
      if (!activityBreakdown[activity.name]) {
        activityBreakdown[activity.name] = {
          duration: 0,
          calories: 0,
          count: 0,
        };
      }
      
      activityBreakdown[activity.name].duration += log.duration;
      activityBreakdown[activity.name].calories += (activity.calories_per_hour * log.duration) / 60;
      activityBreakdown[activity.name].count += 1;
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalDuration: Math.round(totalDuration),
      totalSessions: filteredLogs.length,
      activityBreakdown,
    };
  }, [filteredLogs, activitiesById]);

  const logsByDate = useMemo(() => {
    const grouped = {};
    filteredLogs.forEach((log) => {
      const date = startOfDay(new Date(log.timestamp));
      const dateKey = date.toISOString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date,
          logs: [],
        };
      }
      
      grouped[dateKey].logs.push(log);
    });
    
    return Object.values(grouped).sort((a, b) => b.date - a.date);
  }, [filteredLogs]);

  function persistActivityLogs(nextLogs) {
    setActivityLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    } else {
      writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(nextLogs));
    }
  }

  function handleAddActivity(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    if (!selectedActivity) {
      setFormError('Please select an activity.');
      return;
    }

    const durationValue = Number(duration);
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setFormError('Duration must be a positive number.');
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
    setSuccess('Activity logged successfully!');

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);
  }

  function handleRemoveLog(logId) {
    const nextLogs = activityLogs.filter((log) => log.id !== logId);
    persistActivityLogs(nextLogs);
  }

  function handleClearAllLogs() {
    if (window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) {
      persistActivityLogs([]);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - Gym Dashboard</title>
        </Head>
        <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center">
          <div className="text-xl">Loading activities...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Gym Dashboard - BoilerFuel</title>
        <meta name="description" content="Track your gym and fitness activities with BoilerFuel" />
      </Head>
      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm text-theme-text-tertiary">
            <Link href="/" className="hover:text-yellow-400 transition-colors">← Home</Link>
            <span className="text-theme-text-tertiary">|</span>
            <Link href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</Link>
            <span className="text-theme-text-tertiary">|</span>
            <Link href="/about" className="hover:text-yellow-400 transition-colors">About</Link>
          </nav>

          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <span>💪</span>
                Gym Dashboard
              </h1>
              <p className="text-theme-text-tertiary">Track your workouts and fitness activities—all data stays on this device only.</p>
            </div>
            <button
              type="button"
              onClick={handleClearAllLogs}
              className="self-start rounded bg-theme-bg-tertiary px-4 py-2 text-sm font-semibold text-theme-text-secondary hover:bg-theme-bg-hover"
            >
              Clear all logs
            </button>
          </header>

          {error && (
            <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {error}
            </div>
          )}

          {/* View Mode Selector */}
          <div className="flex gap-2 flex-wrap">
            {['today', 'week', 'month', 'all'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  viewMode === mode
                    ? 'bg-orange-500 text-slate-900'
                    : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              label="Total Calories Burned" 
              value={stats.totalCalories} 
              unit="cal"
              icon="🔥"
              accent="text-orange-500" 
            />
            <StatCard 
              label="Total Duration" 
              value={stats.totalDuration} 
              unit="min"
              goal={viewMode === 'today' ? goals.activityMinutes : null}
              icon="⏱️"
              accent="text-blue-500" 
            />
            <StatCard 
              label="Workout Sessions" 
              value={stats.totalSessions} 
              unit=""
              icon="📊"
              accent="text-green-500" 
            />
          </div>

          {/* Activity Breakdown */}
          {Object.keys(stats.activityBreakdown).length > 0 && (
            <section className="rounded-lg bg-theme-card-bg p-6">
              <h2 className="mb-4 text-2xl font-bold">Activity Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.activityBreakdown)
                  .sort((a, b) => b[1].calories - a[1].calories)
                  .map(([name, data]) => (
                    <div key={name} className="rounded-lg bg-theme-bg-tertiary p-4 border-l-4 border-orange-500">
                      <h3 className="font-bold text-lg mb-2">{name}</h3>
                      <div className="space-y-1 text-sm text-theme-text-secondary">
                        <p>🔥 {Math.round(data.calories)} calories burned</p>
                        <p>⏱️ {Math.round(data.duration)} minutes total</p>
                        <p>📊 {data.count} {data.count === 1 ? 'session' : 'sessions'}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Log New Activity */}
          <section className="rounded-lg bg-theme-card-bg p-6">
            <h2 className="mb-4 text-2xl font-bold">Log New Activity</h2>
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
            <form onSubmit={handleAddActivity} className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label htmlFor="activity" className="mb-2 block text-sm font-medium">
                  Activity Type
                </label>
                <select
                  id="activity"
                  value={selectedActivity}
                  onChange={(event) => setSelectedActivity(event.target.value)}
                  required
                  className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <div className="md:col-span-1">
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
                  className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600 transition-colors"
                >
                  Log Activity
                </button>
              </div>
            </form>
          </section>

          {/* Activity History */}
          <section className="rounded-lg bg-theme-card-bg p-6">
            <h2 className="mb-4 text-2xl font-bold">Activity History</h2>
            {filteredLogs.length === 0 ? (
              <p className="text-theme-text-tertiary">
                No activities logged for this period. Start logging your workouts above!
              </p>
            ) : (
              <div className="space-y-6">
                {logsByDate.map((dateGroup) => {
                  const totalDayCalories = dateGroup.logs.reduce((sum, log) => {
                    const activity = activitiesById.get(log.activityId);
                    if (!activity) return sum;
                    return sum + (activity.calories_per_hour * log.duration) / 60;
                  }, 0);
                  
                  const totalDayDuration = dateGroup.logs.reduce((sum, log) => sum + log.duration, 0);

                  return (
                    <div key={dateGroup.date.toISOString()} className="border-l-4 border-orange-500 pl-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xl font-bold">{formatDate(dateGroup.date)}</h3>
                        <div className="text-sm text-theme-text-tertiary">
                          🔥 {Math.round(totalDayCalories)} cal • ⏱️ {Math.round(totalDayDuration)} min
                        </div>
                      </div>
                      <div className="space-y-2">
                        {dateGroup.logs.map((log) => {
                          const activity = activitiesById.get(log.activityId);
                          if (!activity) return null;

                          const caloriesBurned = Math.round((activity.calories_per_hour * log.duration) / 60);
                          const logTime = new Date(log.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          });

                          return (
                            <article 
                              key={log.id} 
                              className="rounded bg-theme-bg-tertiary p-4 hover:bg-slate-750 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg">{activity.name}</h4>
                                  <p className="text-sm text-theme-text-tertiary mt-1">
                                    ⏱️ {log.duration} {log.duration === 1 ? 'minute' : 'minutes'}
                                    <span className="mx-2">•</span>
                                    🕐 {logTime}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-orange-500 text-lg">
                                    🔥 {caloriesBurned} cal
                                  </p>
                                  <p className="text-xs text-theme-text-tertiary mt-1">
                                    {activity.calories_per_hour} cal/hr
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
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, unit, icon, accent, goal }) {
  const hasGoal = goal !== null && goal !== undefined;
  const percentage = hasGoal && goal > 0 ? Math.min(100, (value / goal) * 100) : null;

  return (
    <div className="rounded-lg bg-theme-card-bg p-6 border-2 border-theme-border-primary hover:border-theme-border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-theme-text-tertiary">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-4xl font-bold ${accent}`}>
        {value}{unit && <span className="text-xl ml-1">{unit}</span>}
      </p>
      {hasGoal && percentage !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-theme-text-tertiary mb-1">
            <span>Daily Goal: {goal}{unit}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-1.5 bg-theme-bg-hover rounded-full overflow-hidden">
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
