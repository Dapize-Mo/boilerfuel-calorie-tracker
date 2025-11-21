import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { readCookie, writeCookie } from '../utils/cookies';

export default function ProfilePage() {
  const [logs, setLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 });
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // New Body Stats State
  const [bodyStats, setBodyStats] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activityLevel: '1.2',
    goal: 'maintain'
  });
  const [calculatedStats, setCalculatedStats] = useState(null);

  useEffect(() => {
    const savedLogs = readCookie('boilerfuel_logs_v1');
    const savedActivityLogs = readCookie('boilerfuel_activity_logs_v1');
    const savedGoals = readCookie('boilerfuel_goals_v1');
    const savedUserName = readCookie('userName');
    const savedUserEmail = readCookie('userEmail');
    const savedBodyStats = readCookie('boilerfuel_body_stats_v1');

    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedActivityLogs) setActivityLogs(JSON.parse(savedActivityLogs));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedUserName) setUserName(savedUserName);
    if (savedUserEmail) setUserEmail(savedUserEmail);
    if (savedBodyStats) {
      const parsedStats = JSON.parse(savedBodyStats);
      setBodyStats(parsedStats);
      calculateStats(parsedStats);
    }
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

  const handleStatsChange = (e) => {
    const { name, value } = e.target;
    const newStats = { ...bodyStats, [name]: value };
    setBodyStats(newStats);
    writeCookie('boilerfuel_body_stats_v1', JSON.stringify(newStats));
    calculateStats(newStats);
  };

  const calculateStats = (stats) => {
    if (!stats.age || !stats.height || !stats.weight) return;

    const age = Number(stats.age);
    const height = Number(stats.height); // cm
    const weight = Number(stats.weight); // kg
    const gender = stats.gender;
    const activity = Number(stats.activityLevel);

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;

    const tdee = Math.round(bmr * activity);

    // Calculate BMI
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal weight';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    // Goal Adjustment
    let targetCalories = tdee;
    if (stats.goal === 'lose') targetCalories -= 500;
    else if (stats.goal === 'gain') targetCalories += 500;

    // Macro Split (40/30/30 default)
    const protein = Math.round((targetCalories * 0.3) / 4);
    const fats = Math.round((targetCalories * 0.3) / 9);
    const carbs = Math.round((targetCalories * 0.4) / 4);

    setCalculatedStats({
      bmr: Math.round(bmr),
      tdee,
      bmi,
      bmiCategory,
      targetCalories,
      macros: { protein, fats, carbs }
    });
  };

  const applyCalculatedGoals = () => {
    if (!calculatedStats) return;

    const newGoals = {
      ...goals,
      calories: calculatedStats.targetCalories,
      protein: calculatedStats.macros.protein,
      carbs: calculatedStats.macros.carbs,
      fats: calculatedStats.macros.fats,
    };
    setGoals(newGoals);
    writeCookie('boilerfuel_goals_v1', JSON.stringify(newGoals));
    alert('Goals updated successfully!');
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

      <div className="min-h-screen bg-theme-bg-primary p-6 font-sans text-theme-text-primary">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center pb-4 border-b border-theme-border-secondary">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-theme-text-primary">Profile & Stats</h1>
              <p className="text-theme-text-tertiary text-sm mt-1">Manage your personal data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & Stats Input */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-theme-bg-tertiary flex items-center justify-center text-theme-text-primary text-2xl font-light">
                    {getInitials()}
                  </div>
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <form onSubmit={handleSaveProfile} className="space-y-3">
                        <input
                          type="text"
                          name="name"
                          defaultValue={userName}
                          className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm focus:ring-2 focus:ring-theme-accent outline-none text-theme-text-primary"
                          placeholder="Your Name"
                        />
                        <input
                          type="email"
                          name="email"
                          defaultValue={userEmail}
                          className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-sm focus:ring-2 focus:ring-theme-accent outline-none text-theme-text-primary"
                          placeholder="Email"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1 rounded-lg text-xs font-medium bg-theme-text-primary text-theme-bg-secondary hover:opacity-90">Save</button>
                          <button type="button" onClick={() => setIsEditingProfile(false)} className="px-3 py-1 bg-theme-bg-tertiary text-theme-text-secondary rounded-lg text-xs">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h2 className="text-xl font-medium text-theme-text-primary">{userName || 'Guest User'}</h2>
                        <p className="text-theme-text-tertiary text-sm mb-2">{userEmail || 'No email set'}</p>
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        >
                          Edit Details →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Body Stats Calculator */}
              <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                <h3 className="text-lg font-medium text-theme-text-primary mb-4 flex items-center gap-2">
                  Body Stats
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Gender</label>
                      <select
                        name="gender"
                        value={bodyStats.gender}
                        onChange={handleStatsChange}
                        className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={bodyStats.age}
                        onChange={handleStatsChange}
                        className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                        placeholder="Years"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Height (cm)</label>
                      <input
                        type="number"
                        name="height"
                        value={bodyStats.height}
                        onChange={handleStatsChange}
                        className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                        placeholder="cm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={bodyStats.weight}
                        onChange={handleStatsChange}
                        className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                        placeholder="kg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Activity Level</label>
                    <select
                      name="activityLevel"
                      value={bodyStats.activityLevel}
                      onChange={handleStatsChange}
                      className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                    >
                      <option value="1.2">Sedentary (Office job)</option>
                      <option value="1.375">Light Exercise (1-2 days/week)</option>
                      <option value="1.55">Moderate Exercise (3-5 days/week)</option>
                      <option value="1.725">Heavy Exercise (6-7 days/week)</option>
                      <option value="1.9">Athlete (2x per day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Goal</label>
                    <select
                      name="goal"
                      value={bodyStats.goal}
                      onChange={handleStatsChange}
                      className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary px-3 py-2 text-theme-text-primary text-sm focus:ring-2 focus:ring-theme-accent outline-none"
                    >
                      <option value="lose">Lose Weight (-500 cal)</option>
                      <option value="maintain">Maintain Weight</option>
                      <option value="gain">Gain Muscle (+500 cal)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Results & Goals */}
            <div className="lg:col-span-2 space-y-6">
              {calculatedStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Health Overview */}
                  <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border">
                    <h3 className="text-lg font-medium text-theme-text-primary mb-4">Health Overview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-theme-bg-tertiary rounded-xl border border-theme-card-border">
                        <span className="text-theme-text-secondary text-sm">BMI</span>
                        <div className="text-right">
                          <span className="block text-xl font-medium text-theme-text-primary">{calculatedStats.bmi}</span>
                          <span className={`text-xs font-medium ${calculatedStats.bmiCategory === 'Normal weight' ? 'text-green-500' : 'text-orange-500'
                            }`}>{calculatedStats.bmiCategory}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-theme-bg-tertiary rounded-xl border border-theme-card-border">
                        <span className="text-theme-text-secondary text-sm">BMR (Resting)</span>
                        <span className="text-xl font-medium text-theme-text-primary">{calculatedStats.bmr} <span className="text-xs text-theme-text-tertiary font-normal">cal/day</span></span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-theme-bg-tertiary rounded-xl border border-theme-card-border">
                        <span className="text-theme-text-secondary text-sm">TDEE (Maintenance)</span>
                        <span className="text-xl font-medium text-theme-text-primary">{calculatedStats.tdee} <span className="text-xs text-theme-text-tertiary font-normal">cal/day</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Goals */}
                  <div className="bg-theme-card-bg rounded-3xl p-6 shadow-sm border border-theme-card-border flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-theme-text-primary">Daily Targets</h3>
                      <button
                        onClick={applyCalculatedGoals}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-text-primary text-theme-bg-secondary hover:opacity-90 transition-colors"
                      >
                        Apply to Tracker
                      </button>
                    </div>

                    <div className="text-center mb-6">
                      <span className="text-5xl font-light text-theme-text-primary">
                        {calculatedStats.targetCalories}
                      </span>
                      <span className="text-theme-text-tertiary ml-2 text-sm">calories</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <MacroBox label="Protein" value={`${calculatedStats.macros.protein}g`} color="text-theme-text-primary" bg="bg-theme-bg-tertiary" />
                      <MacroBox label="Carbs" value={`${calculatedStats.macros.carbs}g`} color="text-theme-text-primary" bg="bg-theme-bg-tertiary" />
                      <MacroBox label="Fats" value={`${calculatedStats.macros.fats}g`} color="text-theme-text-primary" bg="bg-theme-bg-tertiary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div>
                <h2 className="text-xl font-medium text-theme-text-primary mb-6 flex items-center gap-2">
                  Activity Stats
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Meals"
                    value={stats.totalMeals}
                    icon="🍽️"
                  />
                  <StatCard
                    label="Total Workouts"
                    value={stats.totalWorkouts}
                    icon="💪"
                  />
                  <StatCard
                    label="Current Streak"
                    value={`${stats.streak} days`}
                    icon="🔥"
                  />
                  <StatCard
                    label="Days Active"
                    value={stats.daysActive}
                    icon="📅"
                  />
                  <StatCard
                    label="Total Calories In"
                    value={stats.totalCaloriesConsumed.toLocaleString()}
                    icon="📈"
                  />
                  <StatCard
                    label="Total Calories Out"
                    value={stats.totalCaloriesBurned.toLocaleString()}
                    icon="🔥"
                  />
                  <StatCard
                    label="Avg Calories/Day"
                    value={stats.avgCaloriesPerDay.toLocaleString()}
                    icon="📊"
                  />
                  <StatCard
                    label="Workouts/Week"
                    value={stats.avgWorkoutsPerWeek}
                    icon="💯"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-theme-card-bg rounded-3xl p-8 shadow-sm border border-theme-card-border">
                <h2 className="text-xl font-medium text-theme-text-primary mb-6">Achievements</h2>
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
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="p-4 rounded-2xl border border-theme-card-border bg-theme-card-bg hover:shadow-sm transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-theme-text-tertiary font-medium uppercase tracking-wider">{label}</p>
        <span className="text-xl grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{icon}</span>
      </div>
      <p className="text-2xl font-light text-theme-text-primary">
        {value}
      </p>
    </div>
  );
}

function MacroBox({ label, value, color, bg }) {
  return (
    <div className={`p-3 rounded-xl ${bg} border border-theme-card-border text-center`}>
      <p className="text-xs text-theme-text-tertiary mb-1">{label}</p>
      <p className={`text-lg font-medium ${color}`}>{value}</p>
    </div>
  );
}

function Achievement({ icon, title, description, unlocked }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${unlocked
      ? 'bg-theme-card-bg border-theme-card-border'
      : 'bg-theme-bg-tertiary border-theme-card-border opacity-50 grayscale'
      }`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-medium text-theme-text-primary mb-1 text-sm">{title}</h3>
      <p className="text-xs text-theme-text-tertiary">{description}</p>
      {unlocked && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </div>
  );
}
