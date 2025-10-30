import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const WORKOUT_TEMPLATES_COOKIE_KEY = 'boilerfuel_workout_templates_v1';
const PERSONAL_RECORDS_COOKIE_KEY = 'boilerfuel_personal_records_v1';

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
          weight: entry?.weight ? Number(entry.weight) : null,
          reps: entry?.reps ? Number(entry.reps) : null,
          sets: entry?.sets ? Number(entry.sets) : null,
          notes: entry?.notes || '',
        };
      })
      .filter(Boolean);
  } catch (error) {
    deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    return [];
  }
}

function parseWorkoutTemplatesCookie() {
  const raw = readCookie(WORKOUT_TEMPLATES_COOKIE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    deleteCookie(WORKOUT_TEMPLATES_COOKIE_KEY);
    return [];
  }
}

function parsePersonalRecordsCookie() {
  const raw = readCookie(PERSONAL_RECORDS_COOKIE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    deleteCookie(PERSONAL_RECORDS_COOKIE_KEY);
    return {};
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
  const [workoutTemplates, setWorkoutTemplates] = useState(() => parseWorkoutTemplatesCookie());
  const [personalRecords, setPersonalRecords] = useState(() => parsePersonalRecordsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [selectedActivity, setSelectedActivity] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [duration, setDuration] = useState('30');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showPRs, setShowPRs] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [templateName, setTemplateName] = useState('');
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

  const filteredActivities = useMemo(() => {
    if (!activitySearchQuery) return activities;

    const query = activitySearchQuery.toLowerCase();
    return activities.filter((activity) => {
      return (
        activity.name.toLowerCase().includes(query) ||
        (activity.category || '').toLowerCase().includes(query) ||
        (activity.equipment || '').toLowerCase().includes(query) ||
        (activity.muscle_groups || []).some(mg => mg.toLowerCase().includes(query))
      );
    });
  }, [activities, activitySearchQuery]);

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
    const categoryBreakdown = {};
    const muscleGroupFrequency = {};
    let totalVolume = 0;

    filteredLogs.forEach((log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) return;

      // Activity breakdown
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

      // Category breakdown
      const category = activity.category || 'other';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          duration: 0,
          calories: 0,
          count: 0,
        };
      }
      categoryBreakdown[category].duration += log.duration;
      categoryBreakdown[category].calories += (activity.calories_per_hour * log.duration) / 60;
      categoryBreakdown[category].count += 1;

      // Muscle group frequency
      if (activity.muscle_groups && Array.isArray(activity.muscle_groups)) {
        activity.muscle_groups.forEach((group) => {
          muscleGroupFrequency[group] = (muscleGroupFrequency[group] || 0) + 1;
        });
      }

      // Total volume (weight × reps × sets)
      if (log.weight && log.reps) {
        const sets = log.sets || 1;
        totalVolume += log.weight * log.reps * sets;
      }
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalDuration: Math.round(totalDuration),
      totalSessions: filteredLogs.length,
      totalVolume: Math.round(totalVolume),
      activityBreakdown,
      categoryBreakdown,
      muscleGroupFrequency,
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

    // Add optional fields
    if (weight && weight.trim() !== '') {
      const weightValue = Number(weight);
      if (Number.isFinite(weightValue) && weightValue > 0) {
        newLog.weight = weightValue;
      }
    }

    if (reps && reps.trim() !== '') {
      const repsValue = Number(reps);
      if (Number.isInteger(repsValue) && repsValue > 0) {
        newLog.reps = repsValue;
      }
    }

    if (sets && sets.trim() !== '') {
      const setsValue = Number(sets);
      if (Number.isInteger(setsValue) && setsValue > 0) {
        newLog.sets = setsValue;
      }
    }

    if (notes && notes.trim() !== '') {
      newLog.notes = notes.trim();
    }

    const nextLogs = [newLog, ...activityLogs];
    persistActivityLogs(nextLogs);

    // Check for personal record
    let successMessage = 'Activity logged successfully!';
    if (newLog.weight && newLog.reps) {
      const isPR = checkAndUpdatePR(newLog.activityId, newLog.weight, newLog.reps);
      if (isPR) {
        successMessage = '🏆 New Personal Record! Activity logged successfully!';
      }
    }

    setSelectedActivity('');
    setActivitySearchQuery('');
    setDuration('30');
    setWeight('');
    setReps('');
    setSets('');
    setNotes('');
    setSuccess(successMessage);

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

  function persistWorkoutTemplates(nextTemplates) {
    setWorkoutTemplates(nextTemplates);
    if (nextTemplates.length === 0) {
      deleteCookie(WORKOUT_TEMPLATES_COOKIE_KEY);
    } else {
      writeCookie(WORKOUT_TEMPLATES_COOKIE_KEY, JSON.stringify(nextTemplates));
    }
  }

  function handleSaveAsTemplate() {
    if (!selectedActivity) {
      setFormError('Please select an activity first.');
      return;
    }

    if (!templateName.trim()) {
      setFormError('Please enter a template name.');
      return;
    }

    const template = {
      id: Date.now(),
      name: templateName.trim(),
      activityId: Number(selectedActivity),
      duration: Number(duration) || 30,
      weight: weight ? Number(weight) : null,
      reps: reps ? Number(reps) : null,
      sets: sets ? Number(sets) : null,
      notes: notes.trim() || '',
    };

    const nextTemplates = [...workoutTemplates, template];
    persistWorkoutTemplates(nextTemplates);
    setTemplateName('');
    setShowSaveTemplate(false);
    setSuccess('Workout template saved!');

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);
  }

  function handleLoadTemplate(template) {
    setSelectedActivity(String(template.activityId));
    setDuration(String(template.duration));
    setWeight(template.weight ? String(template.weight) : '');
    setReps(template.reps ? String(template.reps) : '');
    setSets(template.sets ? String(template.sets) : '');
    setNotes(template.notes || '');

    if (template.weight || template.reps || template.sets || template.notes) {
      setShowAdvanced(true);
    }

    setShowTemplates(false);
    setSuccess(`Template "${template.name}" loaded!`);

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);
  }

  function handleDeleteTemplate(templateId) {
    if (window.confirm('Delete this workout template?')) {
      const nextTemplates = workoutTemplates.filter((t) => t.id !== templateId);
      persistWorkoutTemplates(nextTemplates);
    }
  }

  function persistPersonalRecords(nextRecords) {
    setPersonalRecords(nextRecords);
    if (Object.keys(nextRecords).length === 0) {
      deleteCookie(PERSONAL_RECORDS_COOKIE_KEY);
    } else {
      writeCookie(PERSONAL_RECORDS_COOKIE_KEY, JSON.stringify(nextRecords));
    }
  }

  function checkAndUpdatePR(activityId, weight, reps) {
    if (!weight || !reps) return false;

    const key = `${activityId}`;
    const currentPR = personalRecords[key];
    const newVolume = weight * reps;

    if (!currentPR || newVolume > currentPR.volume) {
      const nextRecords = {
        ...personalRecords,
        [key]: {
          activityId,
          weight,
          reps,
          volume: newVolume,
          date: new Date().toISOString(),
        },
      };
      persistPersonalRecords(nextRecords);
      return true;
    }

    return false;
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
      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
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

          {/* Personal Records */}
          {Object.keys(personalRecords).length > 0 && (
            <section className="py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🏆 Personal Records</h2>
                <button
                  type="button"
                  onClick={() => setShowPRs(!showPRs)}
                  className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  {showPRs ? '▼ Hide' : '▶ Show'} ({Object.keys(personalRecords).length})
                </button>
              </div>

              {showPRs && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(personalRecords).map(([key, pr]) => {
                    const activity = activitiesById.get(pr.activityId);
                    if (!activity) return null;

                    const prDate = new Date(pr.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={key}
                        className="p-4 border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20 transition-colors"
                      >
                        <h3 className="font-bold text-lg mb-2 text-yellow-400">{activity.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-theme-text-primary">
                            <span className="font-semibold">💪 {pr.weight} lbs</span>
                            <span className="text-theme-text-tertiary"> × </span>
                            <span className="font-semibold">{pr.reps} reps</span>
                          </p>
                          <p className="text-theme-text-secondary">
                            Total Volume: <span className="font-semibold">{pr.volume} lbs</span>
                          </p>
                          <p className="text-xs text-theme-text-tertiary">Set on {prDate}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Advanced Analytics */}
          {filteredLogs.length > 0 && (
            <section className="py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">📊 Workout Insights</h2>
                <button
                  type="button"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showAnalytics ? '▼ Hide' : '▶ Show'} Analytics
                </button>
              </div>

              {showAnalytics && (
                <div className="space-y-6">
                  {/* Category Breakdown */}
                  {Object.keys(stats.categoryBreakdown).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">By Category</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stats.categoryBreakdown)
                          .sort((a, b) => b[1].duration - a[1].duration)
                          .map(([category, data]) => (
                            <div key={category} className="p-4 border border-theme-border-primary rounded bg-theme-bg-primary/30">
                              <h4 className="font-bold capitalize mb-2">{category}</h4>
                              <div className="space-y-1 text-sm text-theme-text-secondary">
                                <p>⏱️ {Math.round(data.duration)} minutes</p>
                                <p>🔥 {Math.round(data.calories)} calories</p>
                                <p>📊 {data.count} sessions</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Muscle Group Frequency */}
                  {Object.keys(stats.muscleGroupFrequency).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Muscle Groups Trained</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.muscleGroupFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([group, count]) => (
                            <div
                              key={group}
                              className="px-4 py-2 rounded bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
                            >
                              <span className="font-semibold capitalize">{group}</span>
                              <span className="ml-2 text-sm text-theme-text-tertiary">× {count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Volume Stats */}
                  {stats.totalVolume > 0 && (
                    <div className="p-4 border-l-4 border-purple-500 bg-purple-500/10">
                      <h3 className="text-lg font-semibold mb-2">💪 Total Volume Lifted</h3>
                      <p className="text-3xl font-bold text-purple-400">
                        {stats.totalVolume.toLocaleString()} lbs
                      </p>
                      <p className="text-sm text-theme-text-tertiary mt-1">
                        Weight × Reps × Sets across all strength exercises
                      </p>
                    </div>
                  )}

                  {/* Consistency Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-theme-border-primary rounded">
                      <h4 className="font-semibold mb-2">Average Session Duration</h4>
                      <p className="text-2xl font-bold text-blue-400">
                        {stats.totalSessions > 0 ? Math.round(stats.totalDuration / stats.totalSessions) : 0} min
                      </p>
                    </div>
                    <div className="p-4 border border-theme-border-primary rounded">
                      <h4 className="font-semibold mb-2">Average Calories/Session</h4>
                      <p className="text-2xl font-bold text-orange-400">
                        {stats.totalSessions > 0 ? Math.round(stats.totalCalories / stats.totalSessions) : 0} cal
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Activity Breakdown */}
          {Object.keys(stats.activityBreakdown).length > 0 && (
            <section className="py-6">
              <h2 className="mb-4 text-2xl font-bold">Activity Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.activityBreakdown)
                  .sort((a, b) => b[1].calories - a[1].calories)
                  .map(([name, data]) => (
                    <div key={name} className="p-4 border-l-4 border-orange-500 bg-theme-bg-primary/50">
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
          <section className="py-6 border-t border-theme-border-primary">
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
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label htmlFor="activity-search" className="mb-2 block text-sm font-medium">
                    Activity Type
                  </label>
                  <input
                    id="activity-search"
                    type="text"
                    placeholder="Search exercises..."
                    value={activitySearchQuery}
                    onChange={(event) => setActivitySearchQuery(event.target.value)}
                    className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    id="activity"
                    value={selectedActivity}
                    onChange={(event) => setSelectedActivity(event.target.value)}
                    required
                    className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select an activity...</option>
                    {filteredActivities.length === 0 && activitySearchQuery && <option disabled value="">No matching activities found</option>}
                    {filteredActivities.length === 0 && !activitySearchQuery && <option disabled value="">No activities available yet</option>}
                    {filteredActivities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} ({activity.calories_per_hour} cal/hr)
                        {activity.category && ` - ${activity.category}`}
                      </option>
                    ))}
                  </select>
                  {activitySearchQuery && (
                    <p className="text-xs text-theme-text-tertiary mt-1">
                      {filteredActivities.length} of {activities.length} exercises
                    </p>
                  )}
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
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full rounded bg-theme-bg-tertiary px-4 py-2 font-semibold text-theme-text-secondary hover:bg-theme-bg-hover transition-colors"
                  >
                    {showAdvanced ? '− Less Options' : '+ More Options'}
                  </button>
                </div>
              </div>

              {/* Advanced Fields */}
              {showAdvanced && (
                <div className="grid gap-4 md:grid-cols-3 p-4 border border-theme-border-primary rounded bg-theme-bg-primary/20">
                  <div>
                    <label htmlFor="weight" className="mb-2 block text-sm font-medium">
                      Weight (lbs/kg) <span className="text-theme-text-tertiary">- Optional</span>
                    </label>
                    <input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.5"
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                      placeholder="e.g., 135"
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="reps" className="mb-2 block text-sm font-medium">
                      Reps <span className="text-theme-text-tertiary">- Optional</span>
                    </label>
                    <input
                      id="reps"
                      type="number"
                      min="1"
                      step="1"
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      placeholder="e.g., 10"
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="sets" className="mb-2 block text-sm font-medium">
                      Sets <span className="text-theme-text-tertiary">- Optional</span>
                    </label>
                    <input
                      id="sets"
                      type="number"
                      min="1"
                      step="1"
                      value={sets}
                      onChange={(event) => setSets(event.target.value)}
                      placeholder="e.g., 3"
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor="notes" className="mb-2 block text-sm font-medium">
                      Notes <span className="text-theme-text-tertiary">- Optional</span>
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="e.g., Felt strong today, focus on form..."
                      rows="2"
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="submit"
                  className="w-full rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600 transition-all duration-300 glow-orange"
                >
                  Log Activity
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                  className="w-full rounded bg-blue-500 px-4 py-2 font-semibold text-slate-900 hover:bg-blue-600 transition-all duration-300 glow-blue"
                >
                  {showSaveTemplate ? 'Cancel' : 'Save as Template'}
                </button>
              </div>

              {/* Save Template Form */}
              {showSaveTemplate && (
                <div className="p-4 border border-blue-500 rounded bg-blue-500/10">
                  <label htmlFor="templateName" className="mb-2 block text-sm font-medium">
                    Template Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="templateName"
                      type="text"
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="e.g., Morning Run, Chest Day..."
                      className="flex-1 rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      className="rounded bg-blue-500 px-4 py-2 font-semibold text-slate-900 hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Workout Templates Section */}
            {workoutTemplates.length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="mb-3 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showTemplates ? '▼ Hide Templates' : '▶ Show Saved Templates'} ({workoutTemplates.length})
                </button>

                {showTemplates && (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {workoutTemplates.map((template) => {
                      const activity = activitiesById.get(template.activityId);
                      if (!activity) return null;

                      return (
                        <div
                          key={template.id}
                          className="p-3 border border-theme-border-primary rounded bg-theme-bg-primary/30 hover:border-blue-500 transition-colors"
                        >
                          <h4 className="font-semibold text-blue-400 mb-1">{template.name}</h4>
                          <p className="text-sm text-theme-text-secondary mb-2">{activity.name}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-theme-text-tertiary mb-3">
                            <span>⏱️ {template.duration}min</span>
                            {template.sets && template.reps && <span>🏋️ {template.sets}×{template.reps}</span>}
                            {template.weight && <span>💪 {template.weight}lbs</span>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadTemplate(template)}
                              className="flex-1 px-3 py-1 rounded bg-blue-500 text-slate-900 text-sm font-semibold hover:bg-blue-600 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="px-3 py-1 rounded bg-theme-bg-tertiary text-theme-text-tertiary text-sm hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Activity History */}
          <section className="py-6 border-t border-theme-border-primary">
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

                          const hasExtraDetails = log.weight || log.reps || log.sets || log.notes;

                          return (
                            <article
                              key={log.id}
                              className="p-4 border-l border-theme-border-primary hover:border-orange-500 transition-all duration-300 card-glow"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg">{activity.name}</h4>
                                  <p className="text-sm text-theme-text-tertiary mt-1">
                                    ⏱️ {log.duration} {log.duration === 1 ? 'minute' : 'minutes'}
                                    <span className="mx-2">•</span>
                                    🕐 {logTime}
                                  </p>

                                  {/* Extra workout details */}
                                  {hasExtraDetails && (
                                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                      {log.sets && log.reps && (
                                        <span className="px-2 py-1 rounded bg-theme-bg-tertiary text-theme-text-secondary">
                                          🏋️ {log.sets} × {log.reps} reps
                                        </span>
                                      )}
                                      {log.sets && !log.reps && (
                                        <span className="px-2 py-1 rounded bg-theme-bg-tertiary text-theme-text-secondary">
                                          🏋️ {log.sets} sets
                                        </span>
                                      )}
                                      {!log.sets && log.reps && (
                                        <span className="px-2 py-1 rounded bg-theme-bg-tertiary text-theme-text-secondary">
                                          🏋️ {log.reps} reps
                                        </span>
                                      )}
                                      {log.weight && (
                                        <span className="px-2 py-1 rounded bg-theme-bg-tertiary text-theme-text-secondary">
                                          💪 {log.weight} lbs
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {log.notes && (
                                    <p className="mt-2 text-sm text-theme-text-tertiary italic border-l-2 border-theme-border-primary pl-2">
                                      &ldquo;{log.notes}&rdquo;
                                    </p>
                                  )}
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
    <div className="p-6 border-l-4 border-theme-border-primary hover:border-orange-500 transition-colors bg-theme-bg-primary/30">
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
          <div className="h-1.5 bg-theme-border-primary overflow-hidden">
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
