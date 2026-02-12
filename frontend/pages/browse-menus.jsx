import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { apiCall } from '../utils/auth';

export default function BrowseMenus() {
    const [loading, setLoading] = useState(true);
    const [allFoods, setAllFoods] = useState([]);
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

    useEffect(() => {
        async function loadFoods() {
            try {
                const foodsData = await apiCall('/api/foods').catch(() => []);
                setAllFoods(Array.isArray(foodsData) ? foodsData : []);
                setLoading(false);
            } catch (e) {
                console.error('Error loading foods:', e);
                setLoading(false);
            }
        }
        loadFoods();
    }, []);

    const getFilteredFoods = () => {
        let filtered = allFoods;

        // Filter out retail items (show only dining court items)
        filtered = filtered.filter(f => f.dining_court !== 'Retail');

        // Filter by location if selected
        if (selectedLocation) {
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <motion.div 
                        className="w-16 h-16 border-4 border-theme-accent/30 border-t-theme-accent rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-theme-text-secondary text-sm mt-4">Loading menus...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Browse Menus · BoilerFuel</title>
                <meta name="description" content="Browse all Purdue dining menus" />
            </Head>

            <div className="min-h-screen pb-24 md:pb-8 pt-4 px-4 md:pt-8 md:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold text-theme-text-primary mb-2">Browse Menus</h1>
                        <p className="text-theme-text-secondary">Explore all dining court options and filter by nutrition</p>
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-theme-card-bg border border-theme-card-border rounded-2xl p-6 mb-8 space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Dining Court Filter */}
                            <div>
                                <label className="text-xs font-semibold text-theme-text-secondary mb-2 block uppercase">Dining Court</label>
                                <select
                                    value={selectedLocation || ''}
                                    onChange={(e) => setSelectedLocation(e.target.value || null)}
                                    className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-xs text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                                >
                                    <option value="">All locations</option>
                                    {diningLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>

                            {/* Meal Time Filter */}
                            <div>
                                <label className="text-xs font-semibold text-theme-text-secondary mb-2 block uppercase">Meal Time</label>
                                <select
                                    value={mealTimeFilter || ''}
                                    onChange={(e) => setMealTimeFilter(e.target.value || null)}
                                    className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-xs text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                                >
                                    <option value="">All times</option>
                                    {mealTimes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Min Protein */}
                            <div>
                                <label className="text-xs font-semibold text-theme-text-secondary mb-2 block uppercase">Min Protein (g)</label>
                                <input
                                    type="number"
                                    value={minProtein}
                                    onChange={(e) => setMinProtein(e.target.value)}
                                    placeholder="Any"
                                    className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-xs text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                                />
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="text-xs font-semibold text-theme-text-secondary mb-2 block uppercase">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-xs text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                                >
                                    <option value="name">Name</option>
                                    <option value="calories">Calories</option>
                                    <option value="protein">Protein</option>
                                    <option value="carbs">Carbs</option>
                                    <option value="fats">Fats</option>
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <div>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-sm text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            />
                        </div>

                        {/* Sort Order Button */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-theme-text-secondary">
                                {currentFoods.length} items found
                            </p>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-1 bg-theme-accent text-white text-xs rounded-lg transition-opacity hover:opacity-90"
                            >
                                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Menu Items Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {currentFoods.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-theme-text-tertiary">
                                <p className="text-lg font-medium mb-2">No items found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                            </div>
                        ) : (
                            currentFoods.map((food) => (
                                <motion.div
                                    key={food.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-theme-card-bg border border-theme-card-border rounded-lg p-4 hover:border-theme-accent transition-colors"
                                >
                                    <div className="mb-3">
                                        <p className="font-semibold text-theme-text-primary line-clamp-2">{food.name}</p>
                                        <p className="text-xs text-theme-text-tertiary mt-1">
                                            {food.dining_court} • {food.meal_time}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme-card-border">
                                        <p className="text-2xl font-bold text-theme-accent">{Math.round(food.calories)}</p>
                                        <p className="text-xs text-theme-text-secondary">cal</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="text-center">
                                            <p className="text-red-500 font-semibold">{Math.round(food.macros?.protein || 0)}</p>
                                            <p className="text-theme-text-tertiary text-xs">Protein</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-blue-500 font-semibold">{Math.round(food.macros?.carbs || 0)}</p>
                                            <p className="text-theme-text-tertiary text-xs">Carbs</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-yellow-500 font-semibold">{Math.round(food.macros?.fats || 0)}</p>
                                            <p className="text-theme-text-tertiary text-xs">Fats</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
}
