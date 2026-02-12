import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FilterBar - Advanced filtering component for menu browser
 * 
 * Features:
 * - Quick filters (vegetarian, high-protein, low-carb)
 * - Sort options (calories, protein, name)
 * - Favorites toggle
 * 
 * Usage:
 * <FilterBar onFilterChange={(filters) => console.log(filters)} />
 */
export default function FilterBar({ onFilterChange, className = '' }) {
  const [activeFilters, setActiveFilters] = useState({
    vegetarian: false,
    highProtein: false,
    lowCarb: false,
  });
  const [sortBy, setSortBy] = useState('name');
  const [showFavorites, setShowFavorites] = useState(false);

  const toggleFilter = (filter) => {
    const newFilters = {
      ...activeFilters,
      [filter]: !activeFilters[filter],
    };
    setActiveFilters(newFilters);
    onFilterChange?.({ ...newFilters, sortBy, showFavorites });
  };

  const changeSortBy = (newSort) => {
    setSortBy(newSort);
    onFilterChange?.({ ...activeFilters, sortBy: newSort, showFavorites });
  };

  const toggleFavorites = () => {
    const newValue = !showFavorites;
    setShowFavorites(newValue);
    onFilterChange?.({ ...activeFilters, sortBy, showFavorites: newValue });
  };

  const activeFilterCount =
    Object.values(activeFilters).filter(Boolean).length +
    (showFavorites ? 1 : 0) +
    (sortBy !== 'name' ? 1 : 0);

  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-3 ${className}`}>
      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-theme-text-tertiary mr-1">Filters:</span>
        
        <button
          onClick={() => toggleFilter('vegetarian')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeFilters.vegetarian
              ? 'bg-green-500 text-white shadow-lg scale-105'
              : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
          }`}
        >
          🥗 Vegetarian
        </button>

        <button
          onClick={() => toggleFilter('highProtein')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeFilters.highProtein
              ? 'bg-purple-500 text-white shadow-lg scale-105'
              : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
          }`}
        >
          💪 High Protein
        </button>

        <button
          onClick={() => toggleFilter('lowCarb')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeFilters.lowCarb
              ? 'bg-blue-500 text-white shadow-lg scale-105'
              : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
          }`}
        >
          🥑 Low Carb
        </button>

        <button
          onClick={toggleFavorites}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            showFavorites
              ? 'bg-yellow-500 text-white shadow-lg scale-105'
              : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
          }`}
        >
          ❤️ Favorites
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-theme-text-tertiary">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => changeSortBy(e.target.value)}
          className="px-3 py-1.5 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="name">Name</option>
          <option value="calories-asc">Calories (Low to High)</option>
          <option value="calories-desc">Calories (High to Low)</option>
          <option value="protein-desc">Protein (High to Low)</option>
          <option value="carbs-asc">Carbs (Low to High)</option>
        </select>
      </div>

      {/* Active Filter Count Badge */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full"
          >
            {activeFilterCount} active
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Apply filters and sorting to a food array
 * 
 * @param {Array} foods - Array of food items
 * @param {Object} filters - Filter object from FilterBar
 * @param {Array} favorites - Array of favorite food IDs
 * @returns {Array} Filtered and sorted food array
 */
export function applyFilters(foods, filters, favorites = []) {
  let result = [...foods];

  // Apply filters
  if (filters.vegetarian) {
    result = result.filter(
      (food) =>
        food.tags?.includes('vegetarian') ||
        food.tags?.includes('vegan') ||
        food.name?.toLowerCase().includes('veggie') ||
        food.name?.toLowerCase().includes('salad')
    );
  }

  if (filters.highProtein) {
    result = result.filter((food) => (food.macros?.protein || 0) >= 20);
  }

  if (filters.lowCarb) {
    result = result.filter((food) => (food.macros?.carbs || 0) <= 30);
  }

  if (filters.showFavorites) {
    result = result.filter((food) => favorites.includes(food.id));
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'calories-asc':
      result.sort((a, b) => (a.calories || 0) - (b.calories || 0));
      break;
    case 'calories-desc':
      result.sort((a, b) => (b.calories || 0) - (a.calories || 0));
      break;
    case 'protein-desc':
      result.sort((a, b) => (b.macros?.protein || 0) - (a.macros?.protein || 0));
      break;
    case 'carbs-asc':
      result.sort((a, b) => (a.macros?.carbs || 0) - (b.macros?.carbs || 0));
      break;
    case 'name':
    default:
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return result;
}
