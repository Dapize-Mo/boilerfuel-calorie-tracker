import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

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

  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const opacity = Math.max(0, 1 - scrollY / 300);
  const scale = Math.max(0.8, 1 - scrollY / 1000);

  if (loading) {
    return (
      <>
        <Head><title>Loading... - Dashboard</title></Head>
        <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center">
          <div className="text-xl">Loading...</div>
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

      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
        {/* Hero Section - Fades out on scroll */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ opacity, transform: `scale(${scale})` }}
        >
          <div className="text-center space-y-6 px-6">
            <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              BoilerFuel
            </h1>
            <p className="text-2xl md:text-3xl text-theme-text-secondary">
              Your Daily Health Overview
            </p>
            <div className="flex flex-col items-center gap-2 pt-8">
              <p className="text-sm text-theme-text-tertiary">Scroll to explore</p>
              <svg className="w-6 h-6 text-theme-text-tertiary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>

        {/* Content Section - Fades in on scroll */}
        <div
          className="relative bg-theme-bg-primary"
          style={{ opacity: Math.min(1, scrollY / 300) }}
        >
          <div className="mx-auto max-w-6xl px-6 py-12 space-y-16">

            {/* Date Selector */}
            <div className="flex items-center justify-center gap-4 opacity-0 animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(startOfToday())}
                className="text-2xl font-bold rounded-2xl border-2 border-theme-border-primary bg-theme-bg-tertiary/80 px-6 py-3 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all hover:border-yellow-500"
              />
            </div>

            {/* Main Stats - 3 Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-0 animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <StatCard
                label="Calories In"
                value={Math.round(totals?.calories || 0)}
                goal={goals.calories}
                icon="🔥"
                color="yellow"
              />
              <StatCard
                label="Calories Out"
                value={Math.round(totals?.burned || 0)}
                icon="💪"
                color="orange"
              />
              <StatCard
                label="Net Balance"
                value={Math.round(totals?.net || 0)}
                icon="⚖️"
                color="blue"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 opacity-0 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <QuickActionCard
                href="/food-dashboard"
                icon="🍽️"
                title="Food Tracker"
                description="Track your meals"
                stat={`${selectedDayLogs.length} meals logged`}
                color="yellow"
              />
              <QuickActionCard
                href="/gym"
                icon="💪"
                title="Gym Tracker"
                description="Log your workouts"
                stat={`${Math.round(totals?.activityMinutes || 0)} min today`}
                color="orange"
              />
            </div>

            {/* Macros Detail - Collapsible */}
            <details className="group opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <summary className="cursor-pointer list-none flex items-center justify-between p-6 rounded-2xl bg-theme-bg-tertiary/50 border border-theme-border-primary hover:border-yellow-500 transition-all">
                <span className="text-xl font-bold">📊 Detailed Nutrition</span>
                <svg className="w-6 h-6 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 grid grid-cols-3 gap-4 p-6 rounded-2xl bg-theme-bg-secondary border border-theme-border-primary">
                <MacroCard label="Protein" value={Math.round(totals?.protein || 0)} goal={goals.protein} unit="g" color="green" />
                <MacroCard label="Carbs" value={Math.round(totals?.carbs || 0)} goal={goals.carbs} unit="g" color="blue" />
                <MacroCard label="Fats" value={Math.round(totals?.fats || 0)} goal={goals.fats} unit="g" color="purple" />
              </div>
            </details>

            {/* Quick Links */}
            <div className="flex justify-center gap-4 opacity-0 animate-fadeIn" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-yellow-400 transition-colors">
                Profile
              </Link>
              <span className="text-theme-text-tertiary">•</span>
              <Link href="/settings" className="text-theme-text-tertiary hover:text-yellow-400 transition-colors">
                Settings
              </Link>
              <span className="text-theme-text-tertiary">•</span>
              <Link href="/about" className="text-theme-text-tertiary hover:text-yellow-400 transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </>
  );
}

function StatCard({ label, value, goal, icon, color }) {
  const colors = {
    yellow: 'from-yellow-500 to-orange-500',
    orange: 'from-orange-500 to-red-500',
    blue: 'from-cyan-500 to-blue-500',
  };

  const percentage = goal ? Math.min(100, (value / goal) * 100) : null;

  return (
    <div className="relative p-8 rounded-3xl bg-theme-bg-secondary border border-theme-border-primary hover:border-yellow-500 transition-all group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: `linear-gradient(to bottom right, ${colors[color] || colors.yellow})` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-theme-text-tertiary font-medium">{label}</p>
          <span className="text-4xl">{icon}</span>
        </div>
        <p className={`text-5xl font-bold bg-gradient-to-r ${colors[color] || colors.yellow} bg-clip-text text-transparent`}>
          {value}
        </p>
        {goal && (
          <div className="mt-4">
            <div className="h-2 bg-theme-bg-primary rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors[color] || colors.yellow} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-theme-text-tertiary mt-1">Goal: {goal}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description, stat, color }) {
  const borderColors = {
    yellow: 'hover:border-yellow-500',
    orange: 'hover:border-orange-500',
  };

  return (
    <Link href={href} className={`group relative p-8 rounded-3xl bg-theme-bg-secondary border-2 border-theme-border-primary ${borderColors[color]} transition-all overflow-hidden`}>
      <div className="flex items-start gap-4">
        <span className="text-6xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">{title}</h3>
          <p className="text-theme-text-tertiary mb-4">{description}</p>
          <p className="text-sm font-semibold text-yellow-400">{stat}</p>
        </div>
        <svg className="w-8 h-8 text-theme-text-tertiary group-hover:text-yellow-400 group-hover:translate-x-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </Link>
  );
}

function MacroCard({ label, value, goal, unit, color }) {
  const colors = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-purple-500 to-pink-500',
  };

  const percentage = goal ? Math.min(100, (value / goal) * 100) : 0;

  return (
    <div className="p-4 rounded-xl bg-theme-bg-primary">
      <p className="text-xs text-theme-text-tertiary mb-2">{label}</p>
      <p className={`text-3xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent mb-2`}>
        {value}{unit}
      </p>
      <div className="h-1.5 bg-theme-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-theme-text-tertiary mt-1">{goal}{unit}</p>
    </div>
  );
}
