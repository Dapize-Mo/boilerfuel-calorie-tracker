import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { readCookie, writeCookie, deleteCookie } from '../utils/cookies';
import { useTheme } from '../utils/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 });
  const [userPrefs, setUserPrefs] = useState({ showGoals: true, units: 'imperial' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedGoals = readCookie('boilerfuel_goals_v1');
    const savedPrefs = readCookie('boilerfuel_user_prefs_v1');

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedPrefs) setUserPrefs(JSON.parse(savedPrefs));
  }, []);

  const handleSaveGoals = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGoals = {
      calories: Number(formData.get('calories')) || 2000,
      protein: Number(formData.get('protein')) || 150,
      carbs: Number(formData.get('carbs')) || 250,
      fats: Number(formData.get('fats')) || 65,
      activityMinutes: Number(formData.get('activityMinutes')) || 30,
    };

    setGoals(newGoals);
    writeCookie('boilerfuel_goals_v1', JSON.stringify(newGoals));
    showSuccessMessage();
  };

  const handleToggleGoals = () => {
    const newPrefs = { ...userPrefs, showGoals: !userPrefs.showGoals };
    setUserPrefs(newPrefs);
    writeCookie('boilerfuel_user_prefs_v1', JSON.stringify(newPrefs));
  };

  const handleExportData = () => {
    const foodsRaw = readCookie('foods');
    const logsRaw = readCookie('boilerfuel_logs_v1');
    const activitiesRaw = readCookie('activities');
    const activityLogsRaw = readCookie('boilerfuel_activity_logs_v1');
    const goalsRaw = readCookie('boilerfuel_goals_v1');
    const prefsRaw = readCookie('boilerfuel_user_prefs_v1');

    const data = {
      foods: foodsRaw ? JSON.parse(foodsRaw) : [],
      foodLogs: logsRaw ? JSON.parse(logsRaw) : [],
      activities: activitiesRaw ? JSON.parse(activitiesRaw) : [],
      activityLogs: activityLogsRaw ? JSON.parse(activityLogsRaw) : [],
      goals: goalsRaw ? JSON.parse(goalsRaw) : {},
      userPrefs: prefsRaw ? JSON.parse(prefsRaw) : {},
      userName: readCookie('userName') || '',
      userEmail: readCookie('userEmail') || '',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boilerfuel-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessMessage();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (data.foods) writeCookie('foods', JSON.stringify(data.foods));
        if (data.foodLogs) writeCookie('boilerfuel_logs_v1', JSON.stringify(data.foodLogs));
        if (data.activities) writeCookie('activities', JSON.stringify(data.activities));
        if (data.activityLogs) writeCookie('boilerfuel_activity_logs_v1', JSON.stringify(data.activityLogs));
        if (data.goals) {
          writeCookie('boilerfuel_goals_v1', JSON.stringify(data.goals));
          setGoals(data.goals);
        }
        if (data.userPrefs) {
          writeCookie('boilerfuel_user_prefs_v1', JSON.stringify(data.userPrefs));
          setUserPrefs(data.userPrefs);
        }
        if (data.userName) writeCookie('userName', data.userName);
        if (data.userEmail) writeCookie('userEmail', data.userEmail);

        showSuccessMessage();
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        setErrorMessage('Invalid backup file. Please select a valid BoilerFuel backup.');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone. Consider exporting your data first.')) {
      deleteCookie('foods');
      deleteCookie('boilerfuel_logs_v1');
      deleteCookie('activities');
      deleteCookie('boilerfuel_activity_logs_v1');
      deleteCookie('boilerfuel_goals_v1');
      deleteCookie('boilerfuel_user_prefs_v1');
      deleteCookie('userName');
      deleteCookie('userEmail');

      alert('All data has been cleared.');
      window.location.reload();
    }
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      <Head>
        <title>Settings – BoilerFuel</title>
        <meta name="description" content="Manage your BoilerFuel settings and preferences" />
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="py-6 border-b border-theme-border-primary">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-theme-text-tertiary mt-2">Customize your BoilerFuel experience</p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-green-400 animate-fadeIn">
              ✓ Settings saved successfully!
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-400 animate-fadeIn">
              ✕ {errorMessage}
            </div>
          )}

          {/* Appearance */}
          <section className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
              🎨 Appearance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-3">Theme</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 px-6 py-4 rounded-lg border transition-all duration-300 ${
                      resolvedTheme === 'light'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 glow-yellow'
                        : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:border-yellow-500/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">☀️</span>
                    <span className="font-semibold">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 px-6 py-4 rounded-lg border transition-all duration-300 ${
                      resolvedTheme === 'dark'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 glow-blue'
                        : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:border-blue-500/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">🌙</span>
                    <span className="font-semibold">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex-1 px-6 py-4 rounded-lg border transition-all duration-300 ${
                      theme === 'system'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 glow-purple'
                        : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:border-purple-500/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">💻</span>
                    <span className="font-semibold">System</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Daily Goals */}
          <section className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
              🎯 Daily Goals
            </h2>
            <form onSubmit={handleSaveGoals} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    name="calories"
                    defaultValue={goals.calories}
                    min="0"
                    step="50"
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    name="protein"
                    defaultValue={goals.protein}
                    min="0"
                    step="5"
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    name="carbs"
                    defaultValue={goals.carbs}
                    min="0"
                    step="5"
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    name="fats"
                    defaultValue={goals.fats}
                    min="0"
                    step="5"
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Activity Goal (minutes)
                  </label>
                  <input
                    type="number"
                    name="activityMinutes"
                    defaultValue={goals.activityMinutes}
                    min="0"
                    step="5"
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-lg bg-yellow-500 text-slate-900 font-semibold hover:bg-yellow-600 transition-all duration-300 glow-yellow"
              >
                Save Goals
              </button>
            </form>
          </section>

          {/* Preferences */}
          <section className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
              ⚙️ Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-theme-border-primary">
                <div>
                  <h3 className="font-semibold text-theme-text-primary">Show Goals on Dashboard</h3>
                  <p className="text-sm text-theme-text-tertiary">Display goal progress on the main dashboard</p>
                </div>
                <button
                  onClick={handleToggleGoals}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    userPrefs.showGoals ? 'bg-yellow-500' : 'bg-theme-bg-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userPrefs.showGoals ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
              💾 Data Management
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
                <p className="text-sm text-blue-300 mb-3">
                  <strong>Note:</strong> All your data is stored locally on your device. Use export/import to backup or transfer your data.
                </p>
              </div>

              <button
                onClick={handleExportData}
                className="w-full px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 font-semibold hover:bg-green-500/30 transition-all duration-300 glow-green"
              >
                📥 Export All Data
              </button>

              <div>
                <label className="block w-full px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300 font-semibold hover:bg-blue-500/30 transition-all duration-300 cursor-pointer text-center glow-blue">
                  📤 Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-theme-border-primary">
                <button
                  onClick={handleClearAllData}
                  className="w-full px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-semibold hover:bg-red-500/30 transition-all duration-300"
                >
                  🗑️ Clear All Data
                </button>
                <p className="text-xs text-theme-text-tertiary mt-2 text-center">
                  This will permanently delete all your data. Export first if you want to keep it.
                </p>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-8 card-glow">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
              ℹ️ About
            </h2>
            <div className="space-y-3 text-theme-text-secondary">
              <div className="flex justify-between py-2 border-b border-theme-border-primary">
                <span>Version</span>
                <span className="font-semibold text-theme-text-primary">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-theme-border-primary">
                <span>Data Storage</span>
                <span className="font-semibold text-theme-text-primary">Local (Browser Cookies)</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Privacy</span>
                <span className="font-semibold text-green-400">100% Private</span>
              </div>
              <p className="text-sm text-theme-text-tertiary pt-4">
                BoilerFuel is a privacy-first nutrition and fitness tracker. All your data stays on your device.
                No accounts, no tracking, no servers.
              </p>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
}
