import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  adminLogin,
  apiCall,
  createActivity,
  createFood,
  deleteActivity,
  deleteFood,
  logoutAdmin,
  verifyAdminSession,
} from '../utils/auth';

const initialFoodState = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
};

const initialActivityState = {
  name: '',
  calories_per_hour: '',
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [foodForm, setFoodForm] = useState(initialFoodState);
  const [activityForm, setActivityForm] = useState(initialActivityState);
  const [foodError, setFoodError] = useState('');
  const [foodSuccess, setFoodSuccess] = useState('');
  const [activityError, setActivityError] = useState('');
  const [activitySuccess, setActivitySuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapeSuccess, setScrapeSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const sessionOk = await verifyAdminSession();
      if (sessionOk) {
        setAuthenticated(true);
        await loadFoods();
        await loadActivities();
      }
      setLoading(false);
    }
    bootstrap();
  }, []);

  async function loadFoods() {
    try {
      const data = await apiCall('/api/foods');
      setFoods(data || []);
    } catch (error) {
      setFoodError(error.message || 'Failed to load foods');
    }
  }

  async function loadActivities() {
    try {
      const data = await apiCall('/api/activities');
      setActivities(data || []);
    } catch (error) {
      setActivityError(error.message || 'Failed to load activities');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!password.trim()) {
      setLoginError('Password is required');
      return;
    }

    try {
      await adminLogin(password.trim());
      setAuthenticated(true);
      setPassword('');
      await loadFoods();
      await loadActivities();
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    }
  }

  async function handleAddFood(event) {
    event.preventDefault();
    setFoodError('');
    setFoodSuccess('');

    const { name, calories, protein, carbs, fats } = foodForm;
    if (!name || !calories || !protein || !carbs || !fats) {
      setFoodError('All fields are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      calories: Number(calories),
      macros: {
        protein: Number(protein),
        carbs: Number(carbs),
        fats: Number(fats),
      },
    };

    try {
      await createFood(payload);
      setFoodSuccess('Food added!');
      setFoodForm(initialFoodState);
      await loadFoods();
      setTimeout(() => setFoodSuccess(''), 2000);
    } catch (error) {
      setFoodError(error.message || 'Failed to add food');
    }
  }

  async function handleDeleteFood(foodId) {
    setFoodError('');
    try {
      await deleteFood(foodId);
      await loadFoods();
    } catch (error) {
      setFoodError(error.message || 'Failed to delete food');
    }
  }

  async function handleAddActivity(event) {
    event.preventDefault();
    setActivityError('');
    setActivitySuccess('');

    const { name, calories_per_hour } = activityForm;
    if (!name || !calories_per_hour) {
      setActivityError('All fields are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      calories_per_hour: Number(calories_per_hour),
    };

    try {
      await createActivity(payload);
      setActivitySuccess('Activity added!');
      setActivityForm(initialActivityState);
      await loadActivities();
      setTimeout(() => setActivitySuccess(''), 2000);
    } catch (error) {
      setActivityError(error.message || 'Failed to add activity');
    }
  }

  async function handleDeleteActivity(activityId) {
    setActivityError('');
    try {
      await deleteActivity(activityId);
      await loadActivities();
    } catch (error) {
      setActivityError(error.message || 'Failed to delete activity');
    }
  }

  function handleLogout() {
    logoutAdmin();
    setAuthenticated(false);
    setFoods([]);
    setActivities([]);
  }

  async function handleScrapeMenus() {
    setScrapeLoading(true);
    setScrapeError('');
    setScrapeSuccess('');

    try {
      // Start the scraping process
      await apiCall(
        '/api/scrape-menus',
        {
          method: 'POST',
        },
        { requireAdmin: true }
      );
      
      // Poll for status
      const pollStatus = async () => {
        try {
          const response = await apiCall(
            '/api/scrape-status',
            { method: 'GET' },
            { requireAdmin: true }
          );
          
          if (response.status === 'in_progress') {
            setScrapeSuccess('Scraping in progress...');
            setTimeout(pollStatus, 2000); // Check again in 2 seconds
          } else if (response.status === 'complete') {
            setScrapeSuccess(response.message);
            await loadFoods();
            setTimeout(() => setScrapeSuccess(''), 10000);
            setScrapeLoading(false);
          } else if (response.status === 'error') {
            setScrapeError(response.error || 'Failed to scrape menus');
            setScrapeLoading(false);
          }
        } catch (error) {
          setScrapeError(error.message || 'Failed to check scrape status');
          setScrapeLoading(false);
        }
      };
      
      // Start polling
      pollStatus();
      
    } catch (error) {
      setScrapeError(error.message || 'Failed to start scraping');
      setScrapeLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - Admin Panel</title>
        </Head>
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">Checking session...</div>
        </main>
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - BoilerFuel</title>
          <meta name="description" content="Admin login for BoilerFuel calorie tracker" />
        </Head>
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-lg bg-slate-900 p-8 shadow-xl">
            <h1 className="mb-6 text-3xl font-bold text-center">Admin Login</h1>
          {loginError && (
            <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-yellow-500 px-4 py-2 font-semibold text-slate-900 hover:bg-yellow-600"
            >
              Login
            </button>
          </form>
        </section>
      </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - BoilerFuel</title>
        <meta name="description" content="Manage foods and activities for BoilerFuel calorie tracker" />
      </Head>
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm text-slate-400">
            <a href="/" className="hover:text-yellow-400 transition-colors">← Home</a>
            <span className="text-slate-600">|</span>
            <a href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</a>
            <span className="text-slate-600">|</span>
            <a href="/about" className="hover:text-yellow-400 transition-colors">About</a>
          </nav>

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Admin Food & Activity Manager</h1>
            <p className="text-slate-400">
              Manage foods and activities available to the public dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleScrapeMenus}
              disabled={scrapeLoading}
              className="self-start rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scrapeLoading ? 'Scraping...' : 'Scrape Purdue Menus'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start rounded bg-slate-800 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </header>

        {scrapeError && (
          <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
            {scrapeError}
          </div>
        )}
        {scrapeSuccess && (
          <div className="rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
            {scrapeSuccess}
          </div>
        )}

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Add Food</h2>
          {foodError && (
            <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {foodError}
            </div>
          )}
          {foodSuccess && (
            <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {foodSuccess}
            </div>
          )}
          <form onSubmit={handleAddFood} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="food-name" className="mb-2 block text-sm font-medium">
                Food name
              </label>
              <input
                id="food-name"
                type="text"
                value={foodForm.name}
                onChange={(event) => setFoodForm({ ...foodForm, name: event.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label htmlFor="food-calories" className="mb-2 block text-sm font-medium">
                Calories
              </label>
              <input
                id="food-calories"
                type="number"
                min="0"
                value={foodForm.calories}
                onChange={(event) => setFoodForm({ ...foodForm, calories: event.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label htmlFor="food-protein" className="mb-2 block text-sm font-medium">
                Protein (g)
              </label>
              <input
                id="food-protein"
                type="number"
                min="0"
                step="0.1"
                value={foodForm.protein}
                onChange={(event) => setFoodForm({ ...foodForm, protein: event.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label htmlFor="food-carbs" className="mb-2 block text-sm font-medium">
                Carbs (g)
              </label>
              <input
                id="food-carbs"
                type="number"
                min="0"
                step="0.1"
                value={foodForm.carbs}
                onChange={(event) => setFoodForm({ ...foodForm, carbs: event.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label htmlFor="food-fats" className="mb-2 block text-sm font-medium">
                Fats (g)
              </label>
              <input
                id="food-fats"
                type="number"
                min="0"
                step="0.1"
                value={foodForm.fats}
                onChange={(event) => setFoodForm({ ...foodForm, fats: event.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded bg-yellow-500 px-4 py-2 font-semibold text-slate-900 hover:bg-yellow-600"
              >
                Add Food
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Current Foods</h2>
          {foods.length === 0 ? (
            <p className="text-slate-400">No foods available yet.</p>
          ) : (
            <ul className="space-y-3">
              {foods.map((food) => (
                <li key={food.id} className="flex items-start justify-between gap-4 rounded bg-slate-800 p-4">
                  <div>
                    <p className="font-semibold">{food.name}</p>
                    <p className="text-sm text-slate-400">
                      {food.calories} cal • P: {food.macros?.protein ?? 0}g • C:{' '}
                      {food.macros?.carbs ?? 0}g • F: {food.macros?.fats ?? 0}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFood(food.id)}
                    className="rounded bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Add Activity</h2>
          {activityError && (
            <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {activityError}
            </div>
          )}
          {activitySuccess && (
            <div className="mb-4 rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {activitySuccess}
            </div>
          )}
          <form onSubmit={handleAddActivity} className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="activity-name" className="mb-2 block text-sm font-medium">
                Activity Name
              </label>
              <input
                id="activity-name"
                type="text"
                value={activityForm.name}
                onChange={(event) =>
                  setActivityForm({ ...activityForm, name: event.target.value })
                }
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Running"
              />
            </div>
            <div>
              <label htmlFor="calories-per-hour" className="mb-2 block text-sm font-medium">
                Calories per Hour
              </label>
              <input
                id="calories-per-hour"
                type="number"
                value={activityForm.calories_per_hour}
                onChange={(event) =>
                  setActivityForm({ ...activityForm, calories_per_hour: event.target.value })
                }
                className="w-full rounded border border-slate-700 bg-slate-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 600"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600"
              >
                Add Activity
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Current Activities</h2>
          {activities.length === 0 ? (
            <p className="text-slate-400">No activities available yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-4 rounded bg-slate-800 p-4">
                  <div>
                    <p className="font-semibold">{activity.name}</p>
                    <p className="text-sm text-slate-400">
                      {activity.calories_per_hour} cal/hour
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="rounded bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
    </>
  );
}
