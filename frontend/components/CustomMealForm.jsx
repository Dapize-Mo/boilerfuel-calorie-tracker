import { useState } from 'react';
import { motion } from 'framer-motion';
import { writeCookie, readCookie } from '../utils/cookies';
import { useToast } from './ToastContainer';

export default function CustomMealForm({ onSuccess, onCancel }) {
  const toast = useToast();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!mealName.trim() || !calories.trim()) {
      toast.error('Please enter meal name and calories');
      return;
    }

    setLoading(true);

    // Create food-like object and add to logs
    const mealEntry = {
      id: Date.now(),
      foodId: `custom_${Date.now()}`,
      servings: 1,
      timestamp: new Date().toISOString(),
      customMeal: {
        name: mealName,
        calories: parseFloat(calories) || 0,
        macros: {
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fats: parseFloat(fats) || 0,
        }
      }
    };

    try {
      // Get existing logs
      const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
      const raw = readCookie(LOG_COOKIE_KEY);
      const logs = raw ? JSON.parse(raw) : [];

      // Add new entry
      const updatedLogs = [mealEntry, ...logs];
      writeCookie(LOG_COOKIE_KEY, JSON.stringify(updatedLogs));

      toast.success(`Added ${mealName}!`);
      setMealName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');

      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.error('Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Meal Name */}
      <div>
        <label className="block text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wide">
          Meal Name
        </label>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder="e.g., Chicken & Rice"
          className="w-full px-4 py-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all"
          required
        />
      </div>

      {/* Calories */}
      <div>
        <label className="block text-xs font-semibold text-theme-text-secondary mb-2 uppercase tracking-wide">
          Calories
        </label>
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="e.g., 500"
          className="w-full px-4 py-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all"
          required
        />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">
            Protein (g)
          </label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary placeholder-theme-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-500 mb-2 uppercase tracking-wide">
            Carbs (g)
          </label>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary placeholder-theme-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-yellow-500 mb-2 uppercase tracking-wide">
            Fats (g)
          </label>
          <input
            type="number"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary placeholder-theme-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
          />
        </div>
      </div>

      {/* Quick Macros Summary */}
      {calories && (
        <div className="p-3 bg-theme-bg-tertiary/50 border border-theme-border-primary rounded-lg">
          <p className="text-xs text-theme-text-tertiary font-medium">
            💪 {protein || '0'} • 🍞 {carbs || '0'} • 🥑 {fats || '0'}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-3 px-4 bg-theme-bg-tertiary border border-theme-border-primary text-theme-text-primary rounded-xl font-semibold hover:bg-theme-bg-hover transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Meal'}
        </button>
      </div>
    </motion.form>
  );
}
