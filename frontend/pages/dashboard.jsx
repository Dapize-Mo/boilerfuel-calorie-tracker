import { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie } from '../utils/cookies';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import WaterTracker from '../components/WaterTracker';
import StreakTracker from '../components/StreakTracker';
import BMICalculator from '../components/BMICalculator';

// Lazy load heavy chart component
const WeightChart = dynamic(() => import('../components/WeightChart'), {
  loading: () => <div className="h-full w-full min-h-[300px] bg-theme-card-bg animate-pulse rounded-3xl border border-theme-card-border" />,
  ssr: false
});

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

const fetcher = (url) => apiCall(url);

export default function Dashboard() {
  const { data: foodsData, error: foodsError } = useSWR('/api/foods', fetcher);
  const { data: activitiesData, error: activitiesError } = useSWR('/api/activities', fetcher);

  const foods = Array.isArray(foodsData) ? foodsData : [];
  const activities = Array.isArray(activitiesData) ? activitiesData : [];

  const [logs] = useState(() => parseLogsCookie());
  const [activityLogs] = useState(() => parseActivityLogsCookie());
  const [goals] = useState(() => parseGoalsCookie());
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));

  const loading = !foodsData && !foodsError && !activitiesData && !activitiesError;

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
    return <DashboardSkeleton />;
  }

  return (
    <>
      <Head>
        <title>Dashboard - BoilerFuel</title>
        <meta name="description" content="Your health and fitness dashboard" />
      </Head>

      <main className="font-sans text-theme-text-primary pb-20">
        {/* Hero Section */}
        <section className="relative py-24 px-6 flex flex-col items-center justify-center text-center space-y-8 bg-theme-bg-secondary dark:bg-hero-black border-b border-theme-border-primary overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="relative z-10 space-y-8">
            {/* Streak Tracker */}
            <div className="floating">
              <StreakTracker />
            </div>

            <h1 className="text-7xl md:text-9xl font-extralight tracking-tighter text-theme-text-primary animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r from-theme-text-primary via-yellow-400 to-theme-text-primary">
              BoilerFuel
            </h1>
            <p className="text-xl md:text-2xl text-theme-text-tertiary font-light max-w-2xl animate-fade-in-up delay-100 leading-relaxed">
              Your daily health overview. Track calories, macros, and workouts with precision.
            </p>

            {/* Date Selector */}
            <div className="pt-4 animate-fade-in-up delay-200">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(startOfToday())}
                className="text-lg font-semibold rounded-2xl border-2 border-theme-border-primary bg-theme-bg-tertiary/50 backdrop-blur-sm px-6 py-3 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all hover:bg-theme-bg-hover hover:scale-105 shadow-lg cursor-pointer"
              />
            </div>
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

          {/* New Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WaterTracker />
            <WeightChart />
          </div>

          {/* BMI Calculator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BMICalculator />
            {/* Placeholder for future feature or ad */}
            <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm flex items-center justify-center text-theme-text-tertiary">
              <div className="text-center">
                <span className="text-4xl block mb-2">🚀</span>
                <p>More features coming soon...</p>
              </div>
            </div>
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

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-theme-bg-primary animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-[40vh] bg-theme-bg-secondary border-b border-theme-border-primary flex flex-col items-center justify-center space-y-6">
        <div className="h-20 w-64 bg-theme-bg-tertiary rounded-2xl"></div>
        <div className="h-6 w-96 bg-theme-bg-tertiary rounded-full"></div>
        <div className="h-12 w-48 bg-theme-bg-tertiary rounded-xl mt-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-theme-card-bg rounded-3xl border border-theme-card-border p-8 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-theme-bg-tertiary rounded"></div>
                <div className="h-8 w-8 bg-theme-bg-tertiary rounded-full"></div>
              </div>
              <div className="h-12 w-32 bg-theme-bg-tertiary rounded"></div>
              <div className="h-2 w-full bg-theme-bg-tertiary rounded-full mt-4"></div>
            </div>
          ))}
        </div>

        {/* Features Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-theme-card-bg rounded-3xl border border-theme-card-border"></div>
          <div className="h-64 bg-theme-card-bg rounded-3xl border border-theme-card-border"></div>
        </div>
      </div>
    </div>
  );
}
