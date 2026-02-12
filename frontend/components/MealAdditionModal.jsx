import { useState } from 'react';
import { motion } from 'framer-motion';
import BottomSheet from './BottomSheet';
import CustomMealForm from './CustomMealForm';

export default function MealAdditionModal({ isOpen, onClose, onAddMeal, allFoods }) {
    const [step, setStep] = useState('choice'); // 'choice', 'dining', 'retail', 'custom'
    const [selectedServings, setSelectedServings] = useState(1);
    const [selectedFoodId, setSelectedFoodId] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mealTimeFilter, setMealTimeFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [minProtein, setMinProtein] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const diningLocations = [
        'Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor',
        '1bowl at Meredith Hall', 'Pete\'s Za at Tarkington Hall', 
        'Sushi Boss at Meredith Hall',
        'On-the-GO at Earhart', 'On-the-GO at Ford', 
        'On-the-GO at Lawson', 'On-the-GO at Windsor'
    ];

    const mealTimes = ['breakfast', 'lunch', 'late lunch', 'dinner'];

    const handleClose = () => {
        setStep('choice');
        setSelectedLocation(null);
        setMealTimeFilter(null);
        setSearchQuery('');
        setMinProtein('');
        setSortBy('name');
        setSortOrder('asc');
        setSelectedFoodId(null);
        onClose();
    };

    const handleSelectFood = (food) => {
        const customMeal = {
            name: food.name,
            calories: food.calories,
            macros: food.macros
        };
        onAddMeal({ customMeal, servings: selectedServings });
        handleClose();
    };

    const handleAddCustomMeal = (customMeal) => {
        onAddMeal({ customMeal, servings: 1 });
        handleClose();
    };

    const getFilteredFoods = () => {
        let filtered = allFoods;

        // Filter by location if in dining view
        if (step === 'dining' && selectedLocation) {
            filtered = filtered.filter(f => f.dining_court === selectedLocation);
        }

        // Filter by meal time
        if (mealTimeFilter) {
            filtered = filtered.filter(f => f.meal_time === mealTimeFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(f => 
                f.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by minimum protein
        if (minProtein) {
            const minValue = parseInt(minProtein);
            filtered = filtered.filter(f => (f.macros?.protein || 0) >= minValue);
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'name') {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else if (sortBy === 'protein') {
                aVal = a.macros?.protein || 0;
                bVal = b.macros?.protein || 0;
            } else if (sortBy === 'carbs') {
                aVal = a.macros?.carbs || 0;
                bVal = b.macros?.carbs || 0;
            } else if (sortBy === 'fats') {
                aVal = a.macros?.fats || 0;
                bVal = b.macros?.fats || 0;
            } else if (sortBy === 'calories') {
                aVal = a.calories || 0;
                bVal = b.calories || 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    };

    const currentFoods = getFilteredFoods();

    return (
        <BottomSheet isOpen={isOpen} onClose={handleClose} title="">
            {/* Step 1: Choose meal source */}
            {step === 'choice' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 pb-4"
                >
                    <h2 className="text-xl font-bold text-theme-text-primary mb-6">Add a Meal</h2>

                    <button
                        onClick={() => setStep('dining')}
                        className="w-full p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className="text-left">
                            <p className="font-semibold text-theme-text-primary">🏛️ Dining Courts</p>
                            <p className="text-xs text-theme-text-secondary mt-1">Browse Purdue dining menus</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setStep('retail')}
                        className="w-full p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className="text-left">
                            <p className="font-semibold text-theme-text-primary">🍔 Retail</p>
                            <p className="text-xs text-theme-text-secondary mt-1">Restaurant chains & packaged foods</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setStep('custom')}
                        className="w-full p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className="text-left">
                            <p className="font-semibold text-theme-text-primary">✏️ Custom Meal</p>
                            <p className="text-xs text-theme-text-secondary mt-1">Manually enter any meal</p>
                        </div>
                    </button>
                </motion.div>
            )}

            {/* Step 2: Dining Courts */}
            {step === 'dining' && !selectedLocation && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 pb-4"
                >
                    <button
                        onClick={() => setStep('choice')}
                        className="text-theme-accent text-sm font-medium mb-3"
                    >
                        ← Back
                    </button>
                    <h2 className="text-lg font-bold text-theme-text-primary mb-4">Select Dining Court</h2>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pb-4">
                        {diningLocations.map((location) => (
                            <button
                                key={location}
                                onClick={() => setSelectedLocation(location)}
                                className="p-3 bg-theme-card-bg border border-theme-card-border rounded-lg hover:bg-theme-bg-secondary transition-colors text-left text-sm"
                            >
                                <p className="font-medium text-theme-text-primary truncate">{location}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 3: Dining Menu with filters */}
            {step === 'dining' && selectedLocation && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 pb-4"
                >
                    <button
                        onClick={() => setSelectedLocation(null)}
                        className="text-theme-accent text-sm font-medium mb-2"
                    >
                        ← Back to locations
                    </button>
                    <h2 className="text-lg font-bold text-theme-text-primary">{selectedLocation}</h2>

                    {/* Filters */}
                    <div className="bg-theme-bg-secondary rounded-lg p-3 space-y-3 border border-theme-card-border">
                        <div>
                            <label className="text-xs font-semibold text-theme-text-secondary mb-1 block">Meal Time</label>
                            <select
                                value={mealTimeFilter || ''}
                                onChange={(e) => setMealTimeFilter(e.target.value || null)}
                                className="w-full px-2 py-1 bg-theme-card-bg border border-theme-card-border rounded text-xs text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                            >
                                <option value="">All times</option>
                                {mealTimes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-theme-text-secondary mb-1 block">Min Protein (g)</label>
                            <input
                                type="number"
                                value={minProtein}
                                onChange={(e) => setMinProtein(e.target.value)}
                                placeholder="Any"
                                className="w-full px-2 py-1 bg-theme-card-bg border border-theme-card-border rounded text-xs text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-theme-text-secondary mb-1 block">Sort By</label>
                            <div className="flex gap-2 text-xs">
                                {['name', 'protein', 'carbs', 'fats', 'calories'].map(field => (
                                    <button
                                        key={field}
                                        onClick={() => {
                                            if (sortBy === field) {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy(field);
                                                setSortOrder('asc');
                                            }
                                        }}
                                        className={`px-2 py-1 rounded transition-colors ${
                                            sortBy === field
                                                ? 'bg-theme-accent text-white'
                                                : 'bg-theme-card-bg border border-theme-card-border text-theme-text-secondary'
                                        }`}
                                    >
                                        {field} {sortBy === field && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-2 py-1 bg-theme-card-bg border border-theme-card-border rounded text-xs text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {currentFoods.length === 0 ? (
                            <p className="text-center text-theme-text-tertiary text-sm py-4">No items match your filters</p>
                        ) : (
                            currentFoods.map((food) => (
                                <button
                                    key={food.id}
                                    onClick={() => handleSelectFood(food)}
                                    className="w-full p-2 bg-theme-card-bg border border-theme-card-border rounded-lg hover:bg-theme-bg-secondary transition-colors text-left"
                                >
                                    <p className="font-medium text-theme-text-primary text-sm">{food.name}</p>
                                    <p className="text-xs text-theme-text-secondary">
                                        {Math.round(food.calories)} cal • P: {Math.round(food.macros?.protein || 0)}g • C: {Math.round(food.macros?.carbs || 0)}g • F: {Math.round(food.macros?.fats || 0)}g
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}

            {/* Step 4: Retail */}
            {step === 'retail' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 pb-4"
                >
                    <button
                        onClick={() => setStep('choice')}
                        className="text-theme-accent text-sm font-medium mb-2"
                    >
                        ← Back
                    </button>
                    <h2 className="text-lg font-bold text-theme-text-primary">Retail & Chains</h2>

                    {/* Filters */}
                    <div className="bg-theme-bg-secondary rounded-lg p-3 space-y-3 border border-theme-card-border">
                        <div>
                            <label className="text-xs font-semibold text-theme-text-secondary mb-1 block">Sort By</label>
                            <div className="flex gap-2 text-xs">
                                {['name', 'protein', 'carbs', 'fats', 'calories'].map(field => (
                                    <button
                                        key={field}
                                        onClick={() => {
                                            if (sortBy === field) {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy(field);
                                                setSortOrder('asc');
                                            }
                                        }}
                                        className={`px-2 py-1 rounded transition-colors ${
                                            sortBy === field
                                                ? 'bg-theme-accent text-white'
                                                : 'bg-theme-card-bg border border-theme-card-border text-theme-text-secondary'
                                        }`}
                                    >
                                        {field} {sortBy === field && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-2 py-1 bg-theme-card-bg border border-theme-card-border rounded text-xs text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {currentFoods.filter(f => f.dining_court === 'Retail').length === 0 ? (
                            <p className="text-center text-theme-text-tertiary text-sm py-4">No retail items available yet</p>
                        ) : (
                            currentFoods.filter(f => f.dining_court === 'Retail').map((food) => (
                                <button
                                    key={food.id}
                                    onClick={() => handleSelectFood(food)}
                                    className="w-full p-2 bg-theme-card-bg border border-theme-card-border rounded-lg hover:bg-theme-bg-secondary transition-colors text-left"
                                >
                                    <p className="font-medium text-theme-text-primary text-sm">{food.name}</p>
                                    <p className="text-xs text-theme-text-secondary">
                                        {Math.round(food.calories)} cal • P: {Math.round(food.macros?.protein || 0)}g • C: {Math.round(food.macros?.carbs || 0)}g • F: {Math.round(food.macros?.fats || 0)}g
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}

            {step === 'custom' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <button
                        onClick={() => setStep('choice')}
                        className="text-theme-accent text-sm font-medium mb-3"
                    >
                        ← Back
                    </button>
                    <CustomMealForm 
                        onSuccess={() => handleClose()}
                        onCancel={() => setStep('choice')}
                    />
                </motion.div>
            )}
        </BottomSheet>
    );
}
