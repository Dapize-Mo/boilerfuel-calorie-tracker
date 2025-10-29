import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { readCookie, writeCookie } from '../utils/cookies';

export default function ProfilePage() {
  const [logs, setLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 });
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    const savedLogs = readCookie('boilerfuel_logs_v1');
    const savedActivityLogs = readCookie('boilerfuel_activity_logs_v1');
    const savedGoals = readCookie('boilerfuel_goals_v1');
    const savedUserName = readCookie('userName');
    const savedUserEmail = readCookie('userEmail');

    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedActivityLogs) setActivityLogs(JSON.parse(savedActivityLogs));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedUserName) setUserName(savedUserName);
    if (savedUserEmail) setUserEmail(savedUserEmail);
  }, []);

  const stats = useMemo(() => {
    const totalMeals = logs.length;
    const totalWorkouts = activityLogs.length;

    const totalCaloriesConsumed = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const totalCaloriesBurned = activityLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

    // Calculate streak (consecutive days with logs)
    const allDates = [...new Set([...logs, ...activityLogs].map(log => log.date))].sort();
    let streak = 0;
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = allDates.length - 1; i >= 0; i--) {
      const date = allDates[i];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - currentStreak);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (date === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    streak = currentStreak;

    // Days active (unique days with any activity)
    const uniqueDays = new Set([...logs, ...activityLogs].map(log => log.date));
    const daysActive = uniqueDays.size;

    // Average per day
    const avgCaloriesPerDay = daysActive > 0 ? Math.round(totalCaloriesConsumed / daysActive) : 0;
    const avgWorkoutsPerWeek = daysActive > 0 ? ((totalWorkouts / daysActive) * 7).toFixed(1) : 0;

    return {
      totalMeals,
      totalWorkouts,
      totalCaloriesConsumed,
      totalCaloriesBurned,
      streak,
      daysActive,
      avgCaloriesPerDay,
      avgWorkoutsPerWeek,
    };
  }, [logs, activityLogs]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newName = formData.get('name');
    const newEmail = formData.get('email');

    setUserName(newName);
    setUserEmail(newEmail);
    writeCookie('userName', newName);
    writeCookie('userEmail', newEmail);
    setIsEditingProfile(false);
  };

  const getInitials = () => {
    if (!userName) return 'U';
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Head>
        <title>Profile – BoilerFuel</title>
        <meta name="description" content="Your BoilerFuel profile and statistics" />
      </Head>
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="py-6 border-b border-theme-border-primary">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-theme-text-tertiary mt-2">Manage your profile and view your progress</p>
          </div>

          {/* Profile Card */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 text-5xl font-bold shadow-2xl">
                  {getInitials()}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-text-secondary mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={userName}
                        className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text-secondary mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={userEmail}
                        className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-yellow-500 text-slate-900 font-semibold hover:bg-yellow-600 transition-all duration-300 glow-yellow"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-6 py-2 rounded-lg bg-theme-bg-tertiary text-theme-text-primary hover:bg-theme-bg-hover transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-theme-text-primary mb-2">
                      {userName || 'Guest User'}
                    </h2>
                    <p className="text-theme-text-tertiary mb-4">
                      {userEmail || 'No email set'}
                    </p>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-6 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all duration-300 glow-yellow"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div>
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">📊 Your Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Meals"
                value={stats.totalMeals}
                icon="🍽️"
                gradient="from-yellow-500 to-orange-500"
              />
              <StatCard
                label="Total Workouts"
                value={stats.totalWorkouts}
                icon="💪"
                gradient="from-orange-500 to-red-500"
              />
              <StatCard
                label="Current Streak"
                value={`${stats.streak} days`}
                icon="🔥"
                gradient="from-red-500 to-pink-500"
              />
              <StatCard
                label="Days Active"
                value={stats.daysActive}
                icon="📅"
                gradient="from-cyan-500 to-blue-500"
              />
              <StatCard
                label="Total Calories In"
                value={stats.totalCaloriesConsumed.toLocaleString()}
                icon="📈"
                gradient="from-green-500 to-emerald-500"
              />
              <StatCard
                label="Total Calories Out"
                value={stats.totalCaloriesBurned.toLocaleString()}
                icon="🔥"
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                label="Avg Calories/Day"
                value={stats.avgCaloriesPerDay.toLocaleString()}
                icon="📊"
                gradient="from-blue-500 to-indigo-500"
              />
              <StatCard
                label="Workouts/Week"
                value={stats.avgWorkoutsPerWeek}
                icon="💯"
                gradient="from-indigo-500 to-purple-500"
              />
            </div>
          </div>

          {/* Goals Overview */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6">🎯 Your Daily Goals</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <GoalItem label="Calories" value={`${goals.calories} cal`} />
              <GoalItem label="Protein" value={`${goals.protein}g`} />
              <GoalItem label="Carbs" value={`${goals.carbs}g`} />
              <GoalItem label="Fats" value={`${goals.fats}g`} />
              <GoalItem label="Activity" value={`${goals.activityMinutes} min`} />
            </div>
          </div>

          {/* Achievements */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6">🏆 Achievements</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Achievement
                icon="🎉"
                title="First Meal"
                description="Logged your first meal"
                unlocked={stats.totalMeals > 0}
              />
              <Achievement
                icon="💪"
                title="Workout Warrior"
                description="Completed 10 workouts"
                unlocked={stats.totalWorkouts >= 10}
              />
              <Achievement
                icon="🔥"
                title="Week Streak"
                description="7 day streak"
                unlocked={stats.streak >= 7}
              />
              <Achievement
                icon="📅"
                title="Month Strong"
                description="30 days active"
                unlocked={stats.daysActive >= 30}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="p-4 border-l-4 border-theme-border-primary hover:border-yellow-500 transition-all duration-300 bg-theme-bg-primary/30 card-glow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-theme-text-tertiary font-medium">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  );
}

function GoalItem({ label, value }) {
  return (
    <div className="text-center p-4 rounded-lg bg-theme-bg-tertiary/50 border border-theme-border-primary">
      <p className="text-xs text-theme-text-tertiary mb-1">{label}</p>
      <p className="text-lg font-bold text-theme-text-primary">{value}</p>
    </div>
  );
}

function Achievement({ icon, title, description, unlocked }) {
  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      unlocked
        ? 'bg-yellow-500/10 border-yellow-500/50 card-glow'
        : 'bg-theme-bg-tertiary/30 border-theme-border-primary opacity-50'
    }`}>
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-bold text-theme-text-primary mb-1">{title}</h3>
      <p className="text-xs text-theme-text-tertiary">{description}</p>
      {unlocked && (
        <div className="mt-2 text-xs text-green-400 font-semibold">✓ Unlocked</div>
      )}
    </div>
  );
}
