import { useState, useMemo } from 'react';

const ALLERGENS = [
  { key: 'Gluten', label: 'Gluten', icon: '🌾' },
  { key: 'Dairy', label: 'Dairy', icon: '🥛' },
  { key: 'Eggs', label: 'Eggs', icon: '🥚' },
  { key: 'Soy', label: 'Soy', icon: '🫘' },
  { key: 'Tree Nuts', label: 'Tree Nuts', icon: '🌰' },
  { key: 'Peanuts', label: 'Peanuts', icon: '🥜' },
  { key: 'Fish', label: 'Fish', icon: '🐟' },
  { key: 'Shellfish', label: 'Shellfish', icon: '🦐' },
  { key: 'Sesame', label: 'Sesame', icon: '🫓' },
];

/**
 * AllergenFilter - A nutritional and allergen filtering component.
 *
 * Props:
 *   filters: {
 *     minProtein: string,
 *     maxCalories: string,
 *     vegetarian: boolean,
 *     vegan: boolean,
 *     allergenFree: string   // comma-separated allergen names to exclude
 *   }
 *   onChange: (updatedFilters) => void
 *   onClear: () => void
 */
export default function AllergenFilter({ filters, onChange, onClear }) {
  const [expanded, setExpanded] = useState(false);

  // Parse the comma-separated allergenFree string into a Set for quick lookup
  const activeAllergens = useMemo(() => {
    if (!filters.allergenFree || filters.allergenFree.trim() === '') return new Set();
    return new Set(
      filters.allergenFree
        .split(',')
        .map(a => a.trim())
        .filter(Boolean)
    );
  }, [filters.allergenFree]);

  // Count of all active filters (allergens + dietary toggles + number inputs)
  const activeCount = useMemo(() => {
    let count = activeAllergens.size;
    if (filters.vegetarian) count++;
    if (filters.vegan) count++;
    if (filters.minProtein && parseFloat(filters.minProtein) > 0) count++;
    if (filters.maxCalories && parseFloat(filters.maxCalories) > 0) count++;
    return count;
  }, [activeAllergens, filters]);

  function toggleAllergen(allergenKey) {
    const next = new Set(activeAllergens);
    if (next.has(allergenKey)) {
      next.delete(allergenKey);
    } else {
      next.add(allergenKey);
    }
    onChange({
      ...filters,
      allergenFree: [...next].join(', '),
    });
  }

  function handleToggle(field) {
    const updated = { ...filters, [field]: !filters[field] };
    // If vegan is turned on, also turn on vegetarian
    if (field === 'vegan' && !filters.vegan) {
      updated.vegetarian = true;
    }
    onChange(updated);
  }

  function handleNumberChange(field, value) {
    // Allow empty string or valid non-negative numbers
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      onChange({ ...filters, [field]: value });
    }
  }

  return (
    <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-xl overflow-hidden">
      {/* Header / Toggle Bar */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-theme-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-theme-text-secondary"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span className="text-sm font-semibold text-theme-text-primary">
            Dietary Filters
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-theme-accent text-xs font-bold text-slate-900">
              {activeCount}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-theme-text-tertiary transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded Filter Panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-theme-border-primary space-y-5 animate-fade-in">
          {/* Dietary Toggles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-2">
              Dietary Preference
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleToggle('vegetarian')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filters.vegetarian
                    ? 'bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400'
                    : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:bg-theme-bg-hover'
                }`}
              >
                <span className="text-base leading-none">🥬</span>
                Vegetarian
              </button>
              <button
                type="button"
                onClick={() => handleToggle('vegan')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filters.vegan
                    ? 'bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400'
                    : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:bg-theme-bg-hover'
                }`}
              >
                <span className="text-base leading-none">🌱</span>
                Vegan
              </button>
            </div>
          </div>

          {/* Allergen Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-2">
              Exclude Allergens
            </label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map(allergen => {
                const isActive = activeAllergens.has(allergen.key);
                return (
                  <button
                    key={allergen.key}
                    type="button"
                    onClick={() => toggleAllergen(allergen.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
                        : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary hover:bg-theme-bg-hover'
                    }`}
                    title={isActive ? `Remove ${allergen.label} filter` : `Exclude items containing ${allergen.label}`}
                  >
                    <span className="text-base leading-none">{allergen.icon}</span>
                    {allergen.label}
                    {isActive && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="ml-0.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nutrition Number Inputs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-2">
              Nutrition Ranges
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="min-protein"
                  className="block text-xs text-theme-text-secondary mb-1"
                >
                  Min Protein (g)
                </label>
                <input
                  id="min-protein"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={filters.minProtein}
                  onChange={e => handleNumberChange('minProtein', e.target.value)}
                  className="w-full bg-theme-bg-tertiary border border-theme-border-primary rounded-lg px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted font-mono focus:outline-none focus:border-theme-border-focus transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="max-calories"
                  className="block text-xs text-theme-text-secondary mb-1"
                >
                  Max Calories
                </label>
                <input
                  id="max-calories"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="No limit"
                  value={filters.maxCalories}
                  onChange={e => handleNumberChange('maxCalories', e.target.value)}
                  className="w-full bg-theme-bg-tertiary border border-theme-border-primary rounded-lg px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted font-mono focus:outline-none focus:border-theme-border-focus transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Clear All Button */}
          {activeCount > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-theme-text-tertiary hover:text-theme-error transition-colors uppercase tracking-wider"
              >
                Clear all filters ({activeCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
