import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { readCookie } from '../utils/cookies';
import EmptyState from '../components/EmptyState';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';

function parseLogsCookie() {
  const raw = readCookie(LOG_COOKIE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function parseGoalsCookie() {
  const raw = readCookie(GOALS_COOKIE_KEY);
  if (!raw) {
    return { calories: 2000, protein: 150, carbs: 250, fats: 65 };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { calories: 2000, protein: 150, carbs: 250, fats: 65 };
  }
}

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

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
}

function getDayOfWeek(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function InsightsPage() {
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fats: 65 });

  useEffect(() => {
    setLogs(parseLogsCookie());
    setActivities(parseActivityLogsCookie());
    setGoals(parseGoalsCookie());
  }, []);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const last7Days = getLast7Days();
    const dayStats = last7Days.map((day) => {
      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return isSameDay(logDate, day);
      });

      const totalCalories = dayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
      const totalProtein = dayLogs.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
      const totalCarbs = dayLogs.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
      const totalFats = dayLogs.reduce((sum, log) => sum + (log.macros?.fats || 0), 0);
      const mealsLogged = dayLogs.length;

      return {
        date: day,
        dayOfWeek: getDayOfWeek(day),
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats,
        mealsLogged,
      };
    });

    const avgCalories = dayStats.reduce((sum, day) => sum + day.calories, 0) / 7;
    const avgProtein = dayStats.reduce((sum, day) => sum + day.protein, 0) / 7;
    const avgCarbs = dayStats.reduce((sum, day) => sum + day.carbs, 0) / 7;
    const avgFats = dayStats.reduce((sum, day) => sum + day.fats, 0) / 7;
    const totalMeals = dayStats.reduce((sum, day) => sum + day.mealsLogged, 0);
    const daysWithLogs = dayStats.filter((day) => day.mealsLogged > 0).length;

    return {
      dayStats,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      avgCarbs: Math.round(avgCarbs),
      avgFats: Math.round(avgFats),
      totalMeals,
      daysWithLogs,
      consistency: Math.round((daysWithLogs / 7) * 100),
    };
  }, [logs]);

  // Calculate meal timing analysis
  const mealTiming = useMemo(() => {
    const timings = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const hour = logDate.getHours();

      if (hour >= 6 && hour < 11) {
        timings.breakfast.push(log);
      } else if (hour >= 11 && hour < 15) {
        timings.lunch.push(log);
      } else if (hour >= 17 && hour < 21) {
        timings.dinner.push(log);
      } else {
        timings.snacks.push(log);
      }
    });

    return {
      breakfast: timings.breakfast.length,
      lunch: timings.lunch.length,
      dinner: timings.dinner.length,
      snacks: timings.snacks.length,
    };
  }, [logs]);

  // Generate insights and tips
  const insights = useMemo(() => {
    const tips = [];

    // Consistency tip
    if (weeklyStats.consistency < 50) {
      tips.push({
        icon: '📊',
        title: 'Improve Consistency',
        description: `You logged meals on ${weeklyStats.daysWithLogs} out of 7 days. Try tracking daily for better insights!`,
        color: 'text-yellow-500',
      });
    } else if (weeklyStats.consistency >= 90) {
      tips.push({
        icon: '🔥',
        title: 'Exceptional Consistency!',
        description: "You're crushing it with daily tracking. Keep up the great work!",
        color: 'text-green-500',
      });
    }

    // Calorie goal analysis
    const calorieVariance = weeklyStats.avgCalories - goals.calories;
    if (Math.abs(calorieVariance) < 100) {
      tips.push({
        icon: '🎯',
        title: 'Perfect Balance',
        description: `Your average of ${weeklyStats.avgCalories} cal is right on target!`,
        color: 'text-green-500',
      });
    } else if (calorieVariance > 200) {
      tips.push({
        icon: '⚠️',
        title: 'Above Calorie Goal',
        description: `Averaging ${Math.abs(Math.round(calorieVariance))} cal over your goal. Consider smaller portions or lighter options.`,
        color: 'text-orange-500',
      });
    } else if (calorieVariance < -200) {
      tips.push({
        icon: '⚡',
        title: 'Below Calorie Goal',
        description: `Averaging ${Math.abs(Math.round(calorieVariance))} cal under your goal. Make sure you're eating enough!`,
        color: 'text-blue-500',
      });
    }

    // Protein analysis
    const proteinPercentage = (weeklyStats.avgProtein / goals.protein) * 100;
    if (proteinPercentage >= 90 && proteinPercentage <= 110) {
      tips.push({
        icon: '💪',
        title: 'Great Protein Intake',
        description: `Averaging ${weeklyStats.avgProtein}g protein daily. Perfect for muscle maintenance!`,
        color: 'text-purple-500',
      });
    } else if (proteinPercentage < 70) {
      tips.push({
        icon: '🥩',
        title: 'Boost Your Protein',
        description: 'Try adding chicken, eggs, Greek yogurt, or protein shakes to hit your goal.',
        color: 'text-red-500',
      });
    }

    // Meal timing tip
    if (mealTiming.snacks > mealTiming.breakfast + mealTiming.dinner) {
      tips.push({
        icon: '🍎',
        title: 'Optimize Meal Timing',
        description: 'Consider eating more at main meals to reduce snacking frequency.',
        color: 'text-yellow-500',
      });
    }

    return tips;
  }, [weeklyStats, goals, mealTiming]);

  const maxCalories = Math.max(...weeklyStats.dayStats.map((d) => d.calories), goals.calories);

  // Check if user has enough data
  const hasEnoughData = logs.length >= 5;

  return (
    <>
      <Head>
        <title>Insights & Analytics - BoilerFuel</title>
      </Head>

      <div className="min-h-screen pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-theme-text-primary mb-2">
            📈 Your Insights
          </h1>
          <p className="text-theme-text-tertiary">
            Weekly summary and personalized coaching tips
          </p>
        </div>

        {!hasEnoughData ? (
          <EmptyState
            icon="📊"
            title="Not Enough Data Yet"
            description="Log at least 5 meals to see your personalized insights and trends."
            actionLabel="Go to Dashboard"
            onAction={() => (window.location.href = '/')}
          />
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="modern-card p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-theme-text-tertiary text-sm">Avg Calories</span>
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="text-3xl font-bold text-theme-text-primary mb-1">
                  {weeklyStats.avgCalories}
                </div>
                <div className="text-xs text-theme-text-tertiary">
                  Goal: {goals.calories} cal/day
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="modern-card p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-theme-text-tertiary text-sm">Consistency</span>
                  <span className="text-2xl">📅</span>
                </div>
                <div className="text-3xl font-bold text-theme-text-primary mb-1">
                  {weeklyStats.consistency}%
                </div>
                <div className="text-xs text-theme-text-tertiary">
                  {weeklyStats.daysWithLogs}/7 days tracked
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="modern-card p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-theme-text-tertiary text-sm">Total Meals</span>
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="text-3xl font-bold text-theme-text-primary mb-1">
                  {weeklyStats.totalMeals}
                </div>
                <div className="text-xs text-theme-text-tertiary">meals this week</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="modern-card p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-theme-text-tertiary text-sm">Avg Protein</span>
                  <span className="text-2xl">💪</span>
                </div>
                <div className="text-3xl font-bold text-theme-text-primary mb-1">
                  {weeklyStats.avgProtein}g
                </div>
                <div className="text-xs text-theme-text-tertiary">
                  Goal: {goals.protein}g/day
                </div>
              </motion.div>
            </div>

            {/* 7-Day Calorie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="modern-card p-6"
            >
              <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
                7-Day Calorie Trend
              </h2>
              <div className="flex items-end justify-between gap-2 h-48">
                {weeklyStats.dayStats.map((day, index) => {
                  const heightPercent = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
                  const isToday = isSameDay(day.date, new Date());
                  const isOnTarget =
                    day.calories >= goals.calories * 0.9 && day.calories <= goals.calories * 1.1;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs text-theme-text-tertiary font-medium">
                        {day.calories > 0 ? day.calories : '-'}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: 0.5 + index * 0.05, type: 'spring', damping: 20 }}
                        className={`w-full rounded-t-lg transition-colors ${
                          isOnTarget
                            ? 'bg-gradient-to-t from-green-500 to-green-400'
                            : day.calories > goals.calories
                            ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                            : day.calories > 0
                            ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                            : 'bg-theme-border-primary'
                        } ${isToday ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-theme-bg-primary' : ''}`}
                        style={{ minHeight: day.calories > 0 ? '4px' : '2px' }}
                      />
                      <div className={`text-xs font-medium ${isToday ? 'text-yellow-400' : 'text-theme-text-tertiary'}`}>
                        {day.dayOfWeek}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-theme-border-primary">
                <div className="flex items-center justify-center gap-4 text-xs text-theme-text-tertiary">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>On Target</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span>Over Goal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Under Goal</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Macros Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="modern-card p-6"
            >
              <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
                Average Macro Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Protein */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-theme-text-secondary">Protein</span>
                    <span className="text-sm font-semibold text-purple-500">
                      {weeklyStats.avgProtein}g / {goals.protein}g
                    </span>
                  </div>
                  <div className="h-3 bg-theme-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((weeklyStats.avgProtein / goals.protein) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.6, type: 'spring', damping: 20 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-theme-text-secondary">Carbs</span>
                    <span className="text-sm font-semibold text-blue-500">
                      {weeklyStats.avgCarbs}g / {goals.carbs}g
                    </span>
                  </div>
                  <div className="h-3 bg-theme-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((weeklyStats.avgCarbs / goals.carbs) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.7, type: 'spring', damping: 20 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    />
                  </div>
                </div>

                {/* Fats */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-theme-text-secondary">Fats</span>
                    <span className="text-sm font-semibold text-orange-500">
                      {weeklyStats.avgFats}g / {goals.fats}g
                    </span>
                  </div>
                  <div className="h-3 bg-theme-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((weeklyStats.avgFats / goals.fats) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.8, type: 'spring', damping: 20 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Meal Timing Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="modern-card p-6"
            >
              <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
                Meal Timing Distribution
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🌅</div>
                  <div className="text-2xl font-bold text-theme-text-primary">
                    {mealTiming.breakfast}
                  </div>
                  <div className="text-sm text-theme-text-tertiary">Breakfast</div>
                  <div className="text-xs text-theme-text-muted">6am - 11am</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">☀️</div>
                  <div className="text-2xl font-bold text-theme-text-primary">
                    {mealTiming.lunch}
                  </div>
                  <div className="text-sm text-theme-text-tertiary">Lunch</div>
                  <div className="text-xs text-theme-text-muted">11am - 3pm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🌙</div>
                  <div className="text-2xl font-bold text-theme-text-primary">
                    {mealTiming.dinner}
                  </div>
                  <div className="text-sm text-theme-text-tertiary">Dinner</div>
                  <div className="text-xs text-theme-text-muted">5pm - 9pm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🍎</div>
                  <div className="text-2xl font-bold text-theme-text-primary">
                    {mealTiming.snacks}
                  </div>
                  <div className="text-sm text-theme-text-tertiary">Snacks</div>
                  <div className="text-xs text-theme-text-muted">Other times</div>
                </div>
              </div>
            </motion.div>

            {/* Coaching Tips */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="modern-card p-6"
              >
                <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
                  💡 Personalized Tips
                </h2>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-theme-bg-tertiary rounded-xl"
                    >
                      <span className="text-2xl mt-0.5">{insight.icon}</span>
                      <div className="flex-1">
                        <div className={`font-semibold ${insight.color} mb-1`}>
                          {insight.title}
                        </div>
                        <div className="text-sm text-theme-text-secondary">
                          {insight.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
