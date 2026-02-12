import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall } from '../utils/auth';
import { readCookie, writeCookie } from '../utils/cookies';
import { useToast } from '../components/ToastContainer';
import BottomSheet from '../components/BottomSheet';
import EmptyState from '../components/EmptyState';
import confetti from 'canvas-confetti';

const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const WORKOUT_TEMPLATES_COOKIE_KEY = 'boilerfuel_workout_templates_v1';
const PERSONAL_RECORDS_COOKIE_KEY = 'boilerfuel_personal_records_v1';

const WORKOUT_PRESETS = [
  {
    id: 'push',
    name: '💪 Push Day',
    emoji: '💪',
    exercises: ['Bench Press', 'Overhead Press', 'Tricep Dips', 'Chest Fly'],
  },
  {
    id: 'pull',
    name: '🏋️ Pull Day',
    emoji: '🏋️',
    exercises: ['Pull-ups', 'Rows', 'Bicep Curls', 'Face Pulls'],
  },
  {
    id: 'legs',
    name: '🦵 Leg Day',
    emoji: '🦵',
    exercises: ['Squats', 'Deadlifts', 'Lunges', 'Leg Press'],
  },
  {
    id: 'cardio',
    name: '🏃 Cardio',
    emoji: '🏃',
    exercises: ['Running', 'Cycling', 'Rowing', 'Swimming'],
  },
];

function parseActivityLogsCookie() {
  const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePersonalRecordsCookie() {
  const raw = readCookie(PERSONAL_RECORDS_COOKIE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function GymModernPage() {
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showLogWorkout, setShowLogWorkout] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPRs, setShowPRs] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Log workout form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [duration, setDuration] = useState(30);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(90);
  const [restTimeLeft, setRestTimeLeft] = useState(90);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiCall('/api/activities');
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to load exercises');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    setActivityLogs(parseActivityLogsCookie());
    setPersonalRecords(parsePersonalRecordsCookie());
  }, []);

  // Rest timer effect
  useEffect(() => {
    if (!timerActive || restTimeLeft === 0) return;

    const interval = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          toast.success('Rest complete! Time to lift! 💪');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, restTimeLeft, toast]);

  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter(
      (activity) =>
        activity.name.toLowerCase().includes(query) ||
        (activity.category || '').toLowerCase().includes(query)
    );
  }, [activities, searchQuery]);

  const todayLogs = useMemo(() => {
    const today = new Date();
    return activityLogs.filter((log) => isSameDay(new Date(log.timestamp), today));
  }, [activityLogs]);

  const todayStats = useMemo(() => {
    let totalDuration = 0;
    let totalCalories = 0;

    todayLogs.forEach((log) => {
      const activity = activities.find((a) => a.id === log.activityId);
      if (activity) {
        totalDuration += log.duration;
        totalCalories += (activity.calories_per_hour * log.duration) / 60;
      }
    });

    return {
      duration: Math.round(totalDuration),
      calories: Math.round(totalCalories),
      workouts: todayLogs.length,
    };
  }, [todayLogs, activities]);

  const weeklyStreak = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const hasWorkout = activityLogs.some((log) =>
        isSameDay(new Date(log.timestamp), date)
      );
      last7Days.push({ date, hasWorkout });
    }
    return last7Days;
  }, [activityLogs]);

  const handleLogWorkout = () => {
    if (!selectedActivity) {
      toast.error('Please select an exercise');
      return;
    }

    const newLog = {
      id: Date.now(),
      activityId: selectedActivity.id,
      duration: Number(duration),
      weight: weight ? Number(weight) : null,
      reps: reps ? Number(reps) : null,
      sets: sets ? Number(sets) : null,
      timestamp: new Date().toISOString(),
    };

    // Check for PR
    const activityPRs = personalRecords[selectedActivity.id] || {};
    let newPR = false;

    if (weight && reps) {
      const oneRepMax = Number(weight) * (1 + Number(reps) / 30);
      if (!activityPRs.oneRepMax || oneRepMax > activityPRs.oneRepMax) {
        activityPRs.oneRepMax = oneRepMax;
        activityPRs.date = new Date().toISOString();
        personalRecords[selectedActivity.id] = activityPRs;
        writeCookie(PERSONAL_RECORDS_COOKIE_KEY, JSON.stringify(personalRecords), 365);
        newPR = true;
      }
    }

    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(updatedLogs), 365);

    // Reset form
    setSelectedActivity(null);
    setSearchQuery('');
    setDuration(30);
    setWeight('');
    setReps('');
    setSets('');
    setShowLogWorkout(false);

    if (newPR) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success(`🎉 New PR! ${selectedActivity.name}`);
    } else {
      toast.success('Workout logged successfully!');
    }
  };

  const handleDeleteLog = (logId) => {
    const updatedLogs = activityLogs.filter((log) => log.id !== logId);
    setActivityLogs(updatedLogs);
    writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(updatedLogs), 365);
    toast.success('Workout deleted');
  };

  const startRestTimer = () => {
    setRestTimeLeft(restSeconds);
    setTimerActive(true);
  };

  const stopRestTimer = () => {
    setTimerActive(false);
  };

  const resetRestTimer = () => {
    setRestTimeLeft(restSeconds);
    setTimerActive(false);
  };

  return (
    <>
      <Head>
        <title>Gym Tracker - BoilerFuel</title>
      </Head>

      <div className="min-h-screen pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-theme-text-primary mb-2">💪 Gym Tracker</h1>
          <p className="text-theme-text-tertiary">Track your workouts and monitor progress</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setShowLogWorkout(true)}
            className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-1">✍️</div>
            <div className="text-sm">Log Workout</div>
          </button>

          <button
            onClick={() => setShowTemplates(true)}
            className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-sm">Templates</div>
          </button>

          <button
            onClick={() => setShowPRs(true)}
            className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm">PRs</div>
          </button>

          <button
            onClick={() => setShowRestTimer(true)}
            className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-sm">Rest Timer</div>
          </button>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="modern-card p-6"
          >
            <div className="text-sm text-theme-text-tertiary mb-2">Total Duration</div>
            <div className="text-3xl font-bold text-theme-text-primary">
              {todayStats.duration}
              <span className="text-lg text-theme-text-tertiary ml-1">min</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="modern-card p-6"
          >
            <div className="text-sm text-theme-text-tertiary mb-2">Calories Burned</div>
            <div className="text-3xl font-bold text-theme-text-primary">
              {todayStats.calories}
              <span className="text-lg text-theme-text-tertiary ml-1">cal</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="modern-card p-6"
          >
            <div className="text-sm text-theme-text-tertiary mb-2">Workouts</div>
            <div className="text-3xl font-bold text-theme-text-primary">
              {todayStats.workouts}
            </div>
          </motion.div>
        </div>

        {/* Weekly Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="modern-card p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
            7-Day Activity Streak
          </h2>
          <div className="flex justify-between gap-2">
            {weeklyStreak.map((day, index) => {
              const isToday = isSameDay(day.date, new Date());
              return (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`aspect-square rounded-lg mb-2 flex items-center justify-center text-2xl ${
                      day.hasWorkout
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-theme-bg-tertiary'
                    } ${isToday ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-theme-bg-primary' : ''}`}
                  >
                    {day.hasWorkout ? '✅' : ''}
                  </div>
                  <div className={`text-xs ${isToday ? 'text-yellow-400 font-semibold' : 'text-theme-text-tertiary'}`}>
                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Today's Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="modern-card p-6"
        >
          <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
            Today&apos;s Workouts
          </h2>

          {todayLogs.length === 0 ? (
            <EmptyState
              icon="💪"
              title="No workouts logged today"
              description="Start your first workout to build your streak!"
              actionLabel="Log Workout"
              onAction={() => setShowLogWorkout(true)}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {todayLogs.map((log) => {
                  const activity = activities.find((a) => a.id === log.activityId);
                  if (!activity) return null;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-center justify-between p-4 bg-theme-bg-tertiary rounded-xl hover:bg-theme-bg-hover transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-theme-text-primary">
                          {activity.name}
                        </div>
                        <div className="text-sm text-theme-text-tertiary flex items-center gap-3 mt-1">
                          <span>⏱️ {log.duration} min</span>
                          {log.weight && log.reps && (
                            <span>
                              💪 {log.weight}kg × {log.reps} reps
                              {log.sets ? ` × ${log.sets} sets` : ''}
                            </span>
                          )}
                          <span>
                            🔥 {Math.round((activity.calories_per_hour * log.duration) / 60)} cal
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity p-2"
                      >
                        🗑️
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Log Workout Modal */}
        <BottomSheet
          isOpen={showLogWorkout}
          onClose={() => setShowLogWorkout(false)}
          title="Log Workout"
        >
          <div className="space-y-4">
            {/* Search Exercise */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Exercise
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              {/* Exercise Results */}
              {searchQuery && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {filteredActivities.slice(0, 5).map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setSearchQuery(activity.name);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedActivity?.id === activity.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'hover:bg-theme-bg-hover text-theme-text-secondary'
                      }`}
                    >
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-xs text-theme-text-tertiary">
                        {activity.category} • {activity.calories_per_hour} cal/hr
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedActivity && (
              <>
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Optional: Weight Training Fields */}
                {selectedActivity.category === 'strength' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                        Reps
                      </label>
                      <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogWorkout}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
                >
                  Log Workout
                </button>
              </>
            )}
          </div>
        </BottomSheet>

        {/* Workout Templates Modal */}
        <BottomSheet
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          title="Workout Templates"
        >
          <div className="space-y-3">
            {WORKOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  toast.info(`Starting ${preset.name}...`);
                  setShowTemplates(false);
                  setShowLogWorkout(true);
                }}
                className="w-full p-4 bg-theme-bg-tertiary hover:bg-theme-bg-hover rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{preset.emoji}</span>
                  <span className="font-semibold text-theme-text-primary">{preset.name}</span>
                </div>
                <div className="text-xs text-theme-text-tertiary">
                  {preset.exercises.join(' • ')}
                </div>
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* Personal Records Modal */}
        <BottomSheet
          isOpen={showPRs}
          onClose={() => setShowPRs(false)}
          title="🏆 Personal Records"
        >
          {Object.keys(personalRecords).length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No PRs yet"
              description="Complete strength workouts to track your personal records!"
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(personalRecords).map(([activityId, pr]) => {
                const activity = activities.find((a) => a.id === Number(activityId));
                if (!activity) return null;

                return (
                  <div
                    key={activityId}
                    className="p-4 bg-theme-bg-tertiary rounded-xl"
                  >
                    <div className="font-semibold text-theme-text-primary mb-1">
                      {activity.name}
                    </div>
                    <div className="text-sm text-theme-text-secondary">
                      Est. 1RM: {Math.round(pr.oneRepMax)}kg
                    </div>
                    <div className="text-xs text-theme-text-tertiary mt-1">
                      {new Date(pr.date).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BottomSheet>

        {/* Rest Timer Modal */}
        <BottomSheet
          isOpen={showRestTimer}
          onClose={() => {
            setShowRestTimer(false);
            stopRestTimer();
          }}
          title="⏱️ Rest Timer"
        >
          <div className="space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${timerActive ? 'text-green-500' : 'text-theme-text-primary'}`}>
                {Math.floor(restTimeLeft / 60)}:{String(restTimeLeft % 60).padStart(2, '0')}
              </div>
              <div className="text-theme-text-tertiary">
                {timerActive ? 'Rest in progress...' : 'Ready to start'}
              </div>
            </div>

            {/* Preset Buttons */}
            {!timerActive && (
              <div className="grid grid-cols-4 gap-2">
                {[60, 90, 120, 180].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => {
                      setRestSeconds(seconds);
                      setRestTimeLeft(seconds);
                    }}
                    className={`py-2 rounded-lg transition-colors ${
                      restSeconds === seconds
                        ? 'bg-green-500 text-white'
                        : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3">
              {!timerActive ? (
                <button
                  onClick={startRestTimer}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
                >
                  Start
                </button>
              ) : (
                <>
                  <button
                    onClick={stopRestTimer}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
                  >
                    Stop
                  </button>
                  <button
                    onClick={resetRestTimer}
                    className="flex-1 py-3 bg-theme-bg-tertiary text-theme-text-primary font-semibold rounded-xl hover:bg-theme-bg-hover transition-colors"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        </BottomSheet>
      </div>
    </>
  );
}
