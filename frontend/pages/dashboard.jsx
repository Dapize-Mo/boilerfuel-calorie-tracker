import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';

function parseGoalsCookie() {
  const raw = readCookie(GOALS_COOKIE_KEY);
  if (!raw) {
    return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 };
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
    return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 };
  }
}

function parseLogsCookie() {
  const raw = readCookie(LOG_COOKIE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(LOG_COOKIE_KEY);
      return [];
    }
    return parsed.map((entry, index) => {
      const foodId = Number(entry?.foodId);
      const servings = Number(entry?.servings);
      if (!Number.isInteger(foodId) || !Number.isFinite(servings) || servings <= 0) return null;
      const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
      const id = Number(entry?.id) || Date.now() - index;
      return { id, foodId, servings, timestamp };
    }).filter(Boolean);
  } catch (error) {
    deleteCookie(LOG_COOKIE_KEY);
    return [];
  }
}

function parseActivityLogsCookie() {
  const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
      return [];
    }
    return parsed.map((entry, index) => {
      const activityId = Number(entry?.activityId);
      const duration = Number(entry?.duration);
      if (!Number.isInteger(activityId) || !Number.isFinite(duration) || duration <= 0) return null;
      const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
      const id = Number(entry?.id) || Date.now() - index;
      return { id, activityId, duration, timestamp };
    }).filter(Boolean);
  } catch (error) {
    deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    return [];
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Dashboard() {
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
  const [loading, setLoading] = useState(true);

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
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  const foodsById = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => {
      if (food && typeof food.id === 'number') map.set(food.id, food);
    });
    return map;
  }, [foods]);

  const activitiesById = useMemo(() => {
    const map = new Map();
    activities.forEach((activity) => {
      if (activity && typeof activity.id === 'number') map.set(activity.id, activity);
    });
    return map;
  }, [activities]);

  const selectedDateStart = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  function isLogOnSelectedDate(timestamp) {
    const date = new Date(timestamp);
    return (
      date.getFullYear() === selectedDateStart.getFullYear() &&
      date.getMonth() === selectedDateStart.getMonth() &&
      date.getDate() === selectedDateStart.getDate()
    );
  }

  const selectedDayLogs = useMemo(() => {
    return logs.filter((log) => isLogOnSelectedDate(log.timestamp));
  }, [logs, selectedDateStart]);

  const selectedDayActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => isLogOnSelectedDate(log.timestamp));
  }, [activityLogs, selectedDateStart]);

  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fats = 0;
    selectedDayLogs.forEach((log) => {
      const food = foodsById.get(log.foodId);
      if (!food) return;
      const servings = log.servings;
      calories += (food.calories || 0) * servings;
      const macros = food.macros || {};
      protein += (macros.protein || 0) * servings;
      carbs += (macros.carbs || 0) * servings;
      fats += (macros.fats || 0) * servings;
    });

    let burned = 0, activityMinutes = 0;
    selectedDayActivityLogs.forEach((log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) return;
      burned += (activity.calories_per_hour * log.duration) / 60;
      activityMinutes += log.duration;
    });

    return {
      calories,
      protein,
      carbs,
      fats,
      burned,
      net: calories - burned,
      activityMinutes,
    };
  }, [selectedDayLogs, selectedDayActivityLogs, foodsById, activitiesById]);

  if (loading) {
    return (
      <>
        <Head><title>Loading... - Dashboard</title></Head>
        <main className="min-h-screen bg-theme-bg-primary flex items-center justify-center">
          <div className="text-theme-text-secondary">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - BoilerFuel</title>
        <meta name="description" content="Your health and fitness dashboard" />
      </Head>

      <main className="font-sans text-theme-text-primary">
        {/* Hero Section */}
        <section className="relative py-20 px-6 flex flex-col items-center justify-center text-center space-y-6 bg-theme-bg-secondary border-b border-theme-border-primary">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-theme-text-primary">
            BoilerFuel
          </h1>
          <p className="text-xl text-theme-text-tertiary font-light max-w-2xl">
            Your daily health overview. Track calories, macros, and workouts with precision.
          </p>

          {/* Date Selector */}
          <div className="pt-8">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={formatDateForInput(startOfToday())}
              className="text-lg font-medium rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all hover:bg-theme-bg-hover"
            />
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Calories In"
              value={Math.round(totals?.calories || 0)}
              goal={goals.calories}
              icon="🔥"
            />
            <StatCard
              label="Calories Out"
              value={Math.round(totals?.burned || 0)}
              icon="⚡"
            />
            <StatCard
              label="Net Balance"
              value={Math.round(totals?.net || 0)}
              icon="⚖️"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActionCard
              href="/food-dashboard"
              icon="🍽️"
              title="Food Tracker"
              description="Log meals & track macros"
              stat={`${selectedDayLogs.length} meals today`}
            />
            <QuickActionCard
              href="/gym"
              icon="💪"
              title="Gym Tracker"
              description="Log workouts & exercises"
              stat={`${Math.round(totals?.activityMinutes || 0)} min active`}
            />
          </div>

          {/* Macros Detail */}
          <div className="bg-theme-card-bg rounded-3xl p-8 shadow-sm border border-theme-card-border">
            <h2 className="text-xl font-medium text-theme-text-primary mb-6">Daily Nutrition</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <MacroCard label="Protein" value={Math.round(totals?.protein || 0)} goal={goals.protein} unit="g" />
              <MacroCard label="Carbs" value={Math.round(totals?.carbs || 0)} goal={goals.carbs} unit="g" />
              <MacroCard label="Fats" value={Math.round(totals?.fats || 0)} goal={goals.fats} unit="g" />
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 pt-12 border-t border-theme-border-secondary">
            <Link href="/profile" className="text-sm text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              Profile
            </Link>
            <Link href="/about" className="text-sm text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              About
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, goal, icon }) {
  const percentage = goal ? Math.min(100, (value / goal) * 100) : null;

  return (
    <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-theme-text-secondary font-medium uppercase tracking-wider">{label}</p>
        <span className="text-2xl opacity-50 grayscale">{icon}</span>
      </div>
      <p className="text-5xl font-light text-theme-text-primary mb-2">
        {value}
      </p>
      {goal && (
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

function QuickActionCard({ href, icon, title, description, stat }) {
  return (
    <Link href={href} className="group block p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm hover:shadow-md hover:border-theme-border-secondary transition-all duration-300">
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-theme-bg-tertiary flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-medium text-theme-text-primary mb-1 group-hover:text-theme-text-primary transition-colors">{title}</h3>
          <p className="text-theme-text-tertiary text-sm mb-4">{description}</p>
          <div className="inline-block px-3 py-1 rounded-lg bg-theme-bg-tertiary text-xs font-medium text-theme-text-secondary">
            {stat}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-theme-card-border flex items-center justify-center text-theme-text-tertiary group-hover:border-theme-text-primary group-hover:text-theme-text-primary transition-all">
          →
        </div>
      </div>
    </Link>
  );
}

function MacroCard({ label, value, goal, unit }) {
  const percentage = goal ? Math.min(100, (value / goal) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-sm text-theme-text-secondary font-medium">{label}</p>
        <p className="text-2xl font-light text-theme-text-primary">
          {value}<span className="text-sm text-theme-text-tertiary ml-0.5">{unit}</span>
        </p>
      </div>
      <div className="h-1.5 w-full bg-theme-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-theme-text-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-theme-text-tertiary mt-2 text-right">Goal: {goal}{unit}</p>
    </div>
  );
}
