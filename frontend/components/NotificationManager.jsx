import { useEffect } from 'react';
import { useMeals } from '../context/MealContext';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(mealsByDate) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if ((mealsByDate[key] || []).length > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Non-rendering component: fires browser notifications based on meal data + time
export default function NotificationManager() {
  const { mealsByDate } = useMeals();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const today = getTodayKey();
    const hour = new Date().getHours();
    const todayMeals = (mealsByDate[today] || []).length;
    const streak = computeStreak(mealsByDate);

    // ── Streak reminder: past 8pm, has active streak, nothing logged today ──
    const streakKey = `boilerfuel_notif_streak_${today}`;
    if (streak >= 1 && todayMeals === 0 && hour >= 20 && !localStorage.getItem(streakKey)) {
      localStorage.setItem(streakKey, '1');
      new Notification('BoilerFuel — Streak at risk!', {
        body: `You have a ${streak}-day streak. Log today's meals to keep it alive! 🔥`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'streak-reminder',
      });
      return;
    }

    // ── Meal reminders (only if enabled in profile settings) ──
    if (localStorage.getItem('boilerfuel_notif_meal') !== '1') return;

    // Lunch reminder: noon–1pm with nothing logged yet
    if (todayMeals === 0 && hour >= 12 && hour < 13) {
      const key = `boilerfuel_notif_lunch_${today}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        new Notification('BoilerFuel — Log your lunch!', {
          body: "Don't forget to track your meals today.",
          icon: '/icons/icon-192x192.png',
          tag: 'meal-reminder-lunch',
        });
      }
      return;
    }

    // Dinner reminder: 6pm–7pm
    if (hour >= 18 && hour < 19) {
      const key = `boilerfuel_notif_dinner_${today}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        new Notification('BoilerFuel — Log your dinner!', {
          body: 'Track your nutrition to hit your daily goals.',
          icon: '/icons/icon-192x192.png',
          tag: 'meal-reminder-dinner',
        });
      }
    }
  }, [mealsByDate]);

  return null;
}
