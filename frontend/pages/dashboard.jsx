import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, apiCall, logout } from '../utils/auth';

export default function Dashboard() {
  const router = useRouter();
  const [dailyTotals, setDailyTotals] = useState(null);
  const [logs, setLogs] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [totalsData, logsData, foodsData] = await Promise.all([
        apiCall('/api/daily-totals'),
        apiCall('/api/logs'),
        apiCall('/api/foods'),
      ]);
      
      setDailyTotals(totalsData);
      setLogs(logsData);
      setFoods(foodsData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFood) {
      setError('Please select a food item');
      return;
    }

    try {
      await apiCall('/api/logs', {
        method: 'POST',
        body: JSON.stringify({
          food_id: parseInt(selectedFood),
          servings: parseFloat(servings),
        }),
      });
      
      setSuccess('Meal logged successfully!');
      setSelectedFood('');
      setServings(1);
      
      // Reload data
      await loadDashboardData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to log meal');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">BoilerFuel Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* Daily Totals */}
        {dailyTotals && (
          <div className="bg-slate-900 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Today's Totals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded p-4">
                <div className="text-slate-400 text-sm">Calories</div>
                <div className="text-3xl font-bold text-yellow-500">{dailyTotals.calories}</div>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <div className="text-slate-400 text-sm">Protein</div>
                <div className="text-3xl font-bold text-green-500">{dailyTotals.protein}g</div>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <div className="text-slate-400 text-sm">Carbs</div>
                <div className="text-3xl font-bold text-blue-500">{dailyTotals.carbs}g</div>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <div className="text-slate-400 text-sm">Fats</div>
                <div className="text-3xl font-bold text-red-500">{dailyTotals.fats}g</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Log Meal Form */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Log a Meal</h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label htmlFor="food" className="block text-sm font-medium mb-2">
                  Food Item
                </label>
                <select
                  id="food"
                  value={selectedFood}
                  onChange={(e) => setSelectedFood(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select a food...</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({food.calories} cal)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium mb-2">
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded"
              >
                Log Meal
              </button>
            </form>
          </div>

          {/* Recent Logs */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Today's Meals</h2>
            
            {logs.length === 0 ? (
              <p className="text-slate-400">No meals logged yet today.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-800 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{log.food.name}</div>
                        <div className="text-sm text-slate-400">
                          {log.servings} serving{log.servings !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-yellow-500">
                          {Math.round(log.food.calories * log.servings)} cal
                        </div>
                        <div className="text-sm text-slate-400">
                          P: {Math.round(log.food.macros.protein * log.servings)}g •
                          C: {Math.round(log.food.macros.carbs * log.servings)}g •
                          F: {Math.round(log.food.macros.fats * log.servings)}g
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
