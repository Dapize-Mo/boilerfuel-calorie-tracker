import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiningCourt, setFilterDiningCourt] = useState('');
  const [filterMealTime, setFilterMealTime] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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
      const startResp = await apiCall(
        '/api/scrape-menus',
        {
          method: 'POST',
        },
        { requireAdmin: true }
      );
      // If the API indicates scraping is handled externally (stub), surface that and stop.
      if (startResp && startResp.message && !startResp.status) {
        setScrapeSuccess(startResp.message);
        setScrapeLoading(false);
        return;
      }
      
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

  async function handleClearDatabase() {
    setClearLoading(true);
    setClearError('');
    setClearSuccess('');

    // Confirm action
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to clear ALL foods from the database? This action cannot be undone!'
    );

    if (!confirmed) {
      setClearLoading(false);
      return;
    }

    try {
      const response = await apiCall(
        '/api/clear-database',
        {
          method: 'POST',
        },
        { requireAdmin: true }
      );
      
      setClearSuccess(response.message || 'Database cleared successfully!');
      await loadFoods();
      setTimeout(() => setClearSuccess(''), 5000);
    } catch (error) {
      setClearError(error.message || 'Failed to clear database');
    } finally {
      setClearLoading(false);
    }
  }

  // Filter and sort foods for database viewer
  const filteredAndSortedFoods = foods
    .filter((food) => {
      const matchesSearch = !searchTerm || 
        food.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiningCourt = !filterDiningCourt || 
        food.dining_court === filterDiningCourt;
      const matchesMealTime = !filterMealTime || 
        food.meal_time === filterMealTime;
      const matchesStation = !filterStation || 
        food.station === filterStation;
      return matchesSearch && matchesDiningCourt && matchesMealTime && matchesStation;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === 'calories') {
        aVal = a.calories || 0;
        bVal = b.calories || 0;
      } else if (sortBy === 'protein') {
        aVal = a.macros?.protein || 0;
        bVal = b.macros?.protein || 0;
      } else if (sortBy === 'dining_court') {
        aVal = a.dining_court || '';
        bVal = b.dining_court || '';
      } else if (sortBy === 'station') {
        aVal = a.station || '';
        bVal = b.station || '';
      } else {
        return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  // Get unique values for filters
  const uniqueDiningCourts = [...new Set(foods.map(f => f.dining_court).filter(Boolean))].sort();
  const uniqueMealTimes = [...new Set(foods.map(f => f.meal_time).filter(Boolean))].sort();
  const uniqueStations = [...new Set(foods.map(f => f.station).filter(Boolean))].sort();

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - Admin Panel</title>
        </Head>
        <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center">
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
        <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-lg bg-theme-card-bg p-8 shadow-xl">
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
                  className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-tertiary hover:text-theme-text-secondary"
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
              className="w-full rounded bg-yellow-500 px-4 py-2 font-semibold text-theme-bg-primary hover:bg-yellow-600"
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
      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm text-theme-text-tertiary">
            <Link href="/" className="hover:text-yellow-400 transition-colors">← Home</Link>
            <span className="text-theme-text-muted">|</span>
            <Link href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</Link>
            <span className="text-theme-text-muted">|</span>
            <Link href="/about" className="hover:text-yellow-400 transition-colors">About</Link>
          </nav>

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Admin Food & Activity Manager</h1>
            <p className="text-theme-text-tertiary">
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
              {scrapeLoading ? 'Scraping...' : 'Scrape Purdue Menus (Server)'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setScrapeLoading(true);
                setScrapeError('');
                setScrapeSuccess('');
                try {
                  const resp = await apiCall('/api/ci/trigger-scrape', { method: 'POST' }, { requireAdmin: true });
                  setScrapeSuccess(resp?.message || 'Workflow dispatched');
                } catch (e) {
                  setScrapeError(e?.message || 'Failed to trigger GitHub Action');
                } finally {
                  setScrapeLoading(false);
                }
              }}
              className="self-start rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Trigger GitHub Action
            </button>
            <button
              type="button"
              onClick={handleClearDatabase}
              disabled={clearLoading}
              className="self-start rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearLoading ? 'Clearing...' : '🗑️ Clear Database'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start rounded bg-theme-bg-tertiary px-4 py-2 font-semibold text-theme-text-secondary hover:bg-theme-bg-hover"
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
        
        {clearError && (
          <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
            {clearError}
          </div>
        )}
        {clearSuccess && (
          <div className="rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
            {clearSuccess}
          </div>
        )}

        {/* Database Viewer Section */}
        <section className="rounded-lg bg-theme-card-bg p-6">
          <h2 className="mb-6 text-3xl font-bold">📊 Database Viewer</h2>
          
          {/* Search and Filter Controls */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="mb-2 block text-sm font-medium">
                Search Foods
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <div>
              <label htmlFor="filter-dining-court" className="mb-2 block text-sm font-medium">
                Dining Court
              </label>
              <select
                id="filter-dining-court"
                value={filterDiningCourt}
                onChange={(e) => setFilterDiningCourt(e.target.value)}
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Courts</option>
                {uniqueDiningCourts.map((court) => (
                  <option key={court} value={court}>{court}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="filter-meal-time" className="mb-2 block text-sm font-medium">
                Meal Time
              </label>
              <select
                id="filter-meal-time"
                value={filterMealTime}
                onChange={(e) => setFilterMealTime(e.target.value)}
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Times</option>
                {uniqueMealTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="filter-station" className="mb-2 block text-sm font-medium">
                Station
              </label>
              <select
                id="filter-station"
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Stations</option>
                {uniqueStations.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-sm font-medium">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded border border-theme-border-primary bg-theme-bg-tertiary px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="name">Name</option>
                <option value="calories">Calories</option>
                <option value="protein">Protein</option>
                <option value="dining_court">Dining Court</option>
                <option value="station">Station</option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded border border-theme-border-primary bg-theme-bg-tertiary px-3 py-1 text-sm hover:bg-theme-bg-hover focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>

            <div className="ml-auto text-sm text-theme-text-tertiary">
              Showing {filteredAndSortedFoods.length} of {foods.length} items
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterDiningCourt || filterMealTime || filterStation) && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDiningCourt('');
                  setFilterMealTime('');
                  setFilterStation('');
                }}
                className="text-sm text-yellow-400 hover:text-yellow-300"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            {filteredAndSortedFoods.length === 0 ? (
              <p className="text-theme-text-tertiary text-center py-8">
                {foods.length === 0 ? 'No foods in database yet.' : 'No foods match your filters.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme-border-primary text-left">
                    <th className="pb-3 pr-4 font-semibold">Name</th>
                    <th className="pb-3 pr-4 font-semibold">Calories</th>
                    <th className="pb-3 pr-4 font-semibold">Protein</th>
                    <th className="pb-3 pr-4 font-semibold">Carbs</th>
                    <th className="pb-3 pr-4 font-semibold">Fats</th>
                    <th className="pb-3 pr-4 font-semibold">Dining Court</th>
                    <th className="pb-3 pr-4 font-semibold">Meal Time</th>
                    <th className="pb-3 pr-4 font-semibold">Station</th>
                    <th className="pb-3 font-semibold">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedFoods.map((food, index) => (
                    <tr 
                      key={food.id}
                      className={`border-b border-slate-800 hover:bg-theme-bg-tertiary/50 ${
                        index % 2 === 0 ? 'bg-theme-card-bg/50' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 font-medium">{food.name}</td>
                      <td className="py-3 pr-4">{food.calories || 0}</td>
                      <td className="py-3 pr-4">{food.macros?.protein || 0}g</td>
                      <td className="py-3 pr-4">{food.macros?.carbs || 0}g</td>
                      <td className="py-3 pr-4">{food.macros?.fats || 0}g</td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded bg-theme-bg-hover px-2 py-1 text-xs">
                          {food.dining_court || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded bg-theme-bg-hover px-2 py-1 text-xs">
                          {food.meal_time || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded bg-theme-bg-hover px-2 py-1 text-xs">
                          {food.station || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">{food.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-theme-card-bg p-6">
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded bg-yellow-500 px-4 py-2 font-semibold text-theme-bg-primary hover:bg-yellow-600"
              >
                Add Food
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg bg-theme-card-bg p-6">
          <h2 className="mb-4 text-2xl font-bold">Current Foods</h2>
          {foods.length === 0 ? (
            <p className="text-theme-text-tertiary">No foods available yet.</p>
          ) : (
            <ul className="space-y-3">
              {foods.map((food) => (
                <li key={food.id} className="flex items-start justify-between gap-4 rounded bg-theme-bg-tertiary p-4">
                  <div>
                    <p className="font-semibold">{food.name}</p>
                    <p className="text-sm text-theme-text-tertiary">
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

        <section className="rounded-lg bg-theme-card-bg p-6">
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., 600"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded bg-orange-500 px-4 py-2 font-semibold text-theme-bg-primary hover:bg-orange-600"
              >
                Add Activity
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg bg-theme-card-bg p-6">
          <h2 className="mb-4 text-2xl font-bold">Current Activities</h2>
          {activities.length === 0 ? (
            <p className="text-theme-text-tertiary">No activities available yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-4 rounded bg-theme-bg-tertiary p-4">
                  <div>
                    <p className="font-semibold">{activity.name}</p>
                    <p className="text-sm text-theme-text-tertiary">
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
