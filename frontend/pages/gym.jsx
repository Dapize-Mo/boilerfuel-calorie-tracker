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
        <main className="min-h-screen bg-theme-bg-primary flex items-center justify-center">
          <div className="text-theme-text-secondary">Loading activities...</div>
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
      <main className="min-h-screen bg-theme-bg-primary font-sans text-theme-text-primary p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-theme-border-secondary">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-theme-text-primary">Gym Dashboard</h1>
              <p className="text-theme-text-tertiary text-sm mt-1">Track your workouts and fitness activities</p>
            </div>
            <button
              type="button"
              onClick={handleClearAllLogs}
              className="self-start px-4 py-2 rounded-xl bg-theme-bg-tertiary text-theme-text-secondary text-sm font-medium hover:text-red-600 transition-colors"
            >
              Clear all logs
            </button>
          </header>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* View Mode Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['today', 'week', 'month', 'all'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === mode
                    ? 'bg-theme-text-primary text-theme-bg-secondary shadow-md'
                    : 'bg-theme-card-bg text-theme-text-secondary hover:bg-theme-bg-tertiary border border-theme-card-border'
                  }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Calories Burned"
              value={stats.totalCalories}
              unit="cal"
              icon="🔥"
            />
            <StatCard
              label="Total Duration"
              value={stats.totalDuration}
              unit="min"
              goal={viewMode === 'today' ? goals.activityMinutes : null}
              icon="⏱️"
            />
            <StatCard
              label="Sessions"
              value={stats.totalSessions}
              unit=""
              icon="📊"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Log Activity */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                <h2 className="text-xl font-medium text-theme-text-primary mb-6">Log Activity</h2>

                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                    {formError}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-600 text-sm border border-green-100">
                    {success}
                  </div>
                )}

                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Activity Type</label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={activitySearchQuery}
                      onChange={(event) => setActivitySearchQuery(event.target.value)}
                      className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-theme-accent outline-none text-theme-text-primary"
                    />
                    <select
                      value={selectedActivity}
                      onChange={(event) => setSelectedActivity(event.target.value)}
                      required
                      className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm focus:ring-2 focus:ring-theme-accent outline-none text-theme-text-primary"
                    >
                      <option value="">Select activity...</option>
                      {filteredActivities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm focus:ring-2 focus:ring-theme-accent outline-none text-theme-text-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                  >
                    {showAdvanced ? '− Less Options' : '+ More Options (Weight, Reps, Sets)'}
                  </button>

                  {showAdvanced && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-theme-bg-tertiary rounded-xl border border-theme-card-border">
                      <div>
                        <label className="block text-[10px] font-medium text-theme-text-tertiary mb-1">Weight</label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-2 py-1 text-sm text-theme-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-theme-text-tertiary mb-1">Reps</label>
                        <input
                          type="number"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-2 py-1 text-sm text-theme-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-theme-text-tertiary mb-1">Sets</label>
                        <input
                          type="number"
                          value={sets}
                          onChange={(e) => setSets(e.target.value)}
                          className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-2 py-1 text-sm text-theme-text-primary"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-medium text-theme-text-tertiary mb-1">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows="2"
                          className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-2 py-1 text-sm resize-none text-theme-text-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-theme-text-primary text-theme-bg-secondary py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      Log Activity
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                      className="w-full rounded-xl bg-theme-bg-tertiary text-theme-text-secondary py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      {showSaveTemplate ? 'Cancel' : 'Save Template'}
                    </button>
                  </div>

                  {showSaveTemplate && (
                    <div className="pt-4 border-t border-theme-card-border">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Template Name"
                          className="flex-1 rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm text-theme-text-primary"
                        />
                        <button
                          type="button"
                          onClick={handleSaveAsTemplate}
                          className="px-4 py-2 rounded-xl bg-theme-text-primary text-theme-bg-secondary text-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Templates List */}
              {workoutTemplates.length > 0 && (
                <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-theme-text-primary">Templates</h3>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary"
                    >
                      {showTemplates ? 'Hide' : 'Show'} ({workoutTemplates.length})
                    </button>
                  </div>

                  {showTemplates && (
                    <div className="space-y-3">
                      {workoutTemplates.map((template) => {
                        const activity = activitiesById.get(template.activityId);
                        if (!activity) return null;
                        return (
                          <div key={template.id} className="p-3 rounded-xl border border-theme-card-border hover:border-theme-border-secondary transition-colors bg-theme-bg-tertiary">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-sm text-theme-text-primary">{template.name}</h4>
                                <p className="text-xs text-theme-text-secondary">{activity.name}</p>
                              </div>
                              <button onClick={() => handleDeleteTemplate(template.id)} className="text-theme-text-tertiary hover:text-red-500">×</button>
                            </div>
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="w-full py-1.5 rounded-lg bg-theme-card-bg border border-theme-card-border text-xs font-medium text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary transition-colors"
                            >
                              Load Template
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: History & Analytics */}
            <div className="lg:col-span-2 space-y-6">

              {/* Personal Records */}
              {Object.keys(personalRecords).length > 0 && (
                <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium text-theme-text-primary">Personal Records</h2>
                    <button onClick={() => setShowPRs(!showPRs)} className="text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary">
                      {showPRs ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showPRs && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(personalRecords).map(([key, pr]) => {
                        const activity = activitiesById.get(pr.activityId);
                        if (!activity) return null;
                        return (
                          <div key={key} className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-yellow-900">{activity.name}</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                  {pr.weight}lbs × {pr.reps} reps
                                </p>
                              </div>
                              <span className="text-2xl">🏆</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Activity History */}
              <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border min-h-[500px]">
                <h2 className="text-xl font-medium text-theme-text-primary mb-6">History</h2>

                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-theme-text-tertiary">
                    <p>No activities found for this period.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {logsByDate.map((dateGroup) => (
                      <div key={dateGroup.date.toISOString()}>
                        <h3 className="text-sm font-medium text-theme-text-tertiary mb-4 sticky top-0 bg-theme-card-bg py-2">
                          {formatDate(dateGroup.date)}
                        </h3>
                        <div className="space-y-3">
                          {dateGroup.logs.map((log) => {
                            const activity = activitiesById.get(log.activityId);
                            if (!activity) return null;
                            const caloriesBurned = Math.round((activity.calories_per_hour * log.duration) / 60);

                            return (
                              <div key={log.id} className="group flex items-center justify-between p-4 rounded-2xl bg-theme-bg-tertiary hover:bg-theme-bg-hover transition-colors border border-theme-card-border">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-theme-card-bg flex items-center justify-center text-lg shadow-sm">
                                    💪
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-theme-text-primary">{activity.name}</h4>
                                    <div className="flex gap-2 text-xs text-theme-text-secondary mt-0.5">
                                      <span>{log.duration} min</span>
                                      <span>•</span>
                                      <span>{caloriesBurned} cal</span>
                                      {(log.weight || log.reps) && (
                                        <>
                                          <span>•</span>
                                          <span className="text-theme-text-primary font-medium">
                                            {log.weight ? `${log.weight}lbs` : ''}
                                            {log.weight && log.reps ? ' × ' : ''}
                                            {log.reps ? `${log.reps} reps` : ''}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveLog(log.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-theme-text-tertiary hover:text-red-500 transition-all"
                                >
                                  ×
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, unit, icon, goal }) {
  const hasGoal = goal !== null && goal !== undefined;
  const percentage = hasGoal && goal > 0 ? Math.min(100, (value / goal) * 100) : null;

  return (
    <div className="p-6 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-theme-text-secondary font-medium">{label}</p>
        <span className="text-xl opacity-80 grayscale">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-light text-theme-text-primary">{value}</span>
        {unit && <span className="text-sm text-theme-text-tertiary">{unit}</span>}
      </div>
      {hasGoal && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-theme-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-theme-text-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-theme-text-tertiary mt-2 text-right">{Math.round(percentage)}% of goal</p>
        </div>
      )}
    </div>
  );
}
