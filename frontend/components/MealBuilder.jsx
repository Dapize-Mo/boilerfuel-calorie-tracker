import { useState, useMemo, useCallback } from 'react';

/**
 * MealBuilder - Create custom meal combinations from available foods.
 *
 * Props:
 *   foods: Array of food objects, each with { id, name, calories, macros: { protein, carbs, fats/fat } }
 *   onSave: (mealData) => void   -- called with { name, items, totals }
 *   onClose: () => void
 */
export default function MealBuilder({ foods = [], onSave, onClose }) {
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState([]); // [{ food, servings }]
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filtered food list for the search panel
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return foods.filter(f => f.name?.toLowerCase().includes(q)).slice(0, 50);
  }, [foods, searchQuery]);

  // Compute combined nutrition totals
  const totals = useMemo(() => {
    return mealItems.reduce(
      (acc, item) => {
        const s = item.servings || 1;
        const m = item.food.macros || {};
        return {
          calories: acc.calories + Math.round((item.food.calories || 0) * s),
          protein: acc.protein + parseFloat(((parseFloat(m.protein) || 0) * s).toFixed(1)),
          carbs: acc.carbs + parseFloat(((parseFloat(m.carbs) || 0) * s).toFixed(1)),
          fat: acc.fat + parseFloat(((parseFloat(m.fats || m.fat) || 0) * s).toFixed(1)),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealItems]);

  const addFood = useCallback((food) => {
    setMealItems(prev => {
      // If this food is already in the meal, increment its servings
      const existingIdx = prev.findIndex(item => item.food.id === food.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          servings: updated[existingIdx].servings + 1,
        };
        return updated;
      }
      return [...prev, { food, servings: 1 }];
    });
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  const removeItem = useCallback((index) => {
    setMealItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateServings = useCallback((index, newServings) => {
    const val = parseFloat(newServings);
    if (isNaN(val) || val <= 0) return;
    setMealItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], servings: val };
      return updated;
    });
  }, []);

  function handleSave() {
    if (!mealName.trim() || mealItems.length === 0) return;
    onSave({
      name: mealName.trim(),
      items: mealItems.map(item => ({
        id: item.food.id,
        name: item.food.name,
        calories: item.food.calories,
        macros: item.food.macros,
        servings: item.servings,
        dining_court: item.food.dining_court || '',
        station: item.food.station || '',
      })),
      totals,
      createdAt: Date.now(),
    });
  }

  const canSave = mealName.trim().length > 0 && mealItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-theme-bg-primary border border-theme-border-primary rounded-2xl shadow-soft-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border-primary">
          <h2 className="text-lg font-bold text-theme-text-primary">Meal Builder</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-theme-bg-hover transition-colors text-theme-text-tertiary hover:text-theme-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Meal Name */}
          <div>
            <label htmlFor="meal-name" className="block text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-1.5">
              Meal Name
            </label>
            <input
              id="meal-name"
              type="text"
              placeholder="e.g., Post-Workout Meal"
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              className="w-full bg-theme-bg-secondary border border-theme-border-primary rounded-lg px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted font-mono focus:outline-none focus:border-theme-border-focus transition-colors"
            />
          </div>

          {/* Add Foods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-tertiary">
                Items ({mealItems.length})
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(s => !s)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Food
              </button>
            </div>

            {/* Search Panel */}
            {showSearch && (
              <div className="mb-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg overflow-hidden">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-theme-bg-secondary border border-theme-border-primary rounded-md px-3 py-1.5 text-sm text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-theme-border-focus transition-colors"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredFoods.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-theme-text-muted">
                      No foods found
                    </div>
                  ) : (
                    filteredFoods.map(food => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => addFood(food)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-hover transition-colors flex items-center justify-between"
                      >
                        <span className="text-theme-text-primary truncate mr-2">{food.name}</span>
                        <span className="text-xs text-theme-text-tertiary whitespace-nowrap font-mono">
                          {food.calories} cal
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Item List */}
            {mealItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-theme-text-muted">
                No items added yet. Click &quot;Add Food&quot; to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {mealItems.map((item, idx) => {
                  const macros = item.food.macros || {};
                  const s = item.servings;
                  return (
                    <div
                      key={`${item.food.id}-${idx}`}
                      className="bg-theme-bg-tertiary border border-theme-border-primary rounded-lg px-3 py-2.5 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-theme-text-primary truncate">
                          {item.food.name}
                        </div>
                        <div className="text-xs text-theme-text-tertiary font-mono mt-0.5">
                          {Math.round((item.food.calories || 0) * s)} cal
                          {' / '}
                          {((parseFloat(macros.protein) || 0) * s).toFixed(1)}p
                          {' / '}
                          {((parseFloat(macros.carbs) || 0) * s).toFixed(1)}c
                          {' / '}
                          {((parseFloat(macros.fats || macros.fat) || 0) * s).toFixed(1)}f
                        </div>
                      </div>

                      {/* Servings Control */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateServings(idx, item.servings - 0.5)}
                          disabled={item.servings <= 0.5}
                          className="w-6 h-6 flex items-center justify-center rounded bg-theme-bg-secondary border border-theme-border-primary text-theme-text-secondary hover:bg-theme-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={item.servings}
                          onChange={e => updateServings(idx, e.target.value)}
                          className="w-12 text-center bg-theme-bg-secondary border border-theme-border-primary rounded text-xs text-theme-text-primary font-mono py-0.5 focus:outline-none focus:border-theme-border-focus"
                        />
                        <button
                          type="button"
                          onClick={() => updateServings(idx, item.servings + 0.5)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-theme-bg-secondary border border-theme-border-primary text-theme-text-secondary hover:bg-theme-bg-hover transition-colors text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded hover:bg-red-500/15 text-theme-text-muted hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totals */}
          {mealItems.length > 0 && (
            <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-lg p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-2">
                Meal Totals
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-theme-accent font-mono">
                    {Math.round(totals.calories)}
                  </div>
                  <div className="text-2xs uppercase tracking-wider text-theme-text-muted">Calories</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-500 font-mono">
                    {totals.protein.toFixed(1)}g
                  </div>
                  <div className="text-2xs uppercase tracking-wider text-theme-text-muted">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-500 font-mono">
                    {totals.carbs.toFixed(1)}g
                  </div>
                  <div className="text-2xs uppercase tracking-wider text-theme-text-muted">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-500 font-mono">
                    {totals.fat.toFixed(1)}g
                  </div>
                  <div className="text-2xs uppercase tracking-wider text-theme-text-muted">Fat</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-theme-border-primary bg-theme-bg-secondary/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-theme-text-secondary hover:bg-theme-bg-hover border border-theme-border-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              canSave
                ? 'bg-theme-accent hover:bg-theme-accent-hover text-slate-900 shadow-glow-sm hover:shadow-glow'
                : 'bg-theme-bg-tertiary text-theme-text-muted cursor-not-allowed'
            }`}
          >
            Save Meal ({mealItems.length} item{mealItems.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
