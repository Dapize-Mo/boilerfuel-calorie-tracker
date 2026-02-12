import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { apiCall } from '../utils/auth';
import { readCookie, writeCookie } from '../utils/cookies';
import BottomSheet from '../components/BottomSheet';
import CustomMealForm from '../components/CustomMealForm';
import WaterTracker from '../components/WaterTracker';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastContainer';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';

function parseGoalsCookie() {
    const raw = readCookie(GOALS_COOKIE_KEY);
    if (!raw) return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 };
    try { return JSON.parse(raw); } catch { return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 }; }
}

function parseLogsCookie() {
    const raw = readCookie(LOG_COOKIE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}

function formatDateForInput(d) { return d.toISOString().split('T')[0]; }
function isSameDay(ts, d) { 
    if (!ts) return false; 
    const date = new Date(ts); 
    return date.toDateString() === d.toDateString(); 
}

function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ModernDashboard() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()));
    
    const [allFoods, setAllFoods] = useState([]);
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    
    const [logMealSheet, setLogMealSheet] = useState(false);
    const [showLogMealChoice, setShowLogMealChoice] = useState(false);
    const [logMealMode, setLogMealMode] = useState(null); // 'purdue' or 'custom'

    const diningCourts = [
        { id: 'earhart', name: 'Earhart', icon: '🏛️' },
        { id: 'windsor', name: 'Windsor', icon: '🏰' },
        { id: 'wiley', name: 'Wiley', icon: '🏫' },
        { id: 'ford', name: 'Ford', icon: '🏢' },
    ];

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const foodsData = await apiCall('/api/foods').catch(() => []);
                setAllFoods(Array.isArray(foodsData) ? foodsData : []);
                setLoading(false);
            } catch (e) {
                console.error('Error loading data:', e);
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const foodsById = useMemo(() => new Map(allFoods.map(f => [f.id, f])), [allFoods]);

    const selectedDateStart = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate]);

    const selectedDayLogs = useMemo(() => 
        logs.filter(l => isSameDay(l.timestamp, selectedDateStart))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [logs, selectedDateStart]
    );

    const totals = useMemo(() => {
        return selectedDayLogs.reduce((acc, log) => {
            if (log.customMeal) {
                // Handle custom meals
                acc.calories += (log.customMeal.calories || 0) * log.servings;
                acc.protein += (log.customMeal.macros?.protein || 0) * log.servings;
                acc.carbs += (log.customMeal.macros?.carbs || 0) * log.servings;
                acc.fats += (log.customMeal.macros?.fats || 0) * log.servings;
            } else {
                // Handle regular foods
                const f = foodsById.get(log.foodId);
                if (!f) return acc;
                acc.calories += (f.calories || 0) * log.servings;
                acc.protein += (f.macros?.protein || 0) * log.servings;
                acc.carbs += (f.macros?.carbs || 0) * log.servings;
                acc.fats += (f.macros?.fats || 0) * log.servings;
            }
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [selectedDayLogs, foodsById]);

    const netCalories = totals.calories;

    // Check for goal completion and celebrate 🎉
    useEffect(() => {
        if (netCalories >= goals.calories * 0.95 && netCalories <= goals.calories * 1.05 && selectedDayLogs.length > 0) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [netCalories, goals.calories, selectedDayLogs.length]);

    function persistLogs(newLogs) {
        setLogs(newLogs);
        writeCookie(LOG_COOKIE_KEY, JSON.stringify(newLogs));
    }

    function handleQuickAddFood(foodId) {
        const food = foodsById.get(foodId);
        persistLogs([{ id: Date.now(), foodId, servings: 1, timestamp: new Date().toISOString() }, ...logs]);
        toast.success(`Added ${food?.name || 'item'}!`);
    }

    function handleDeleteFoodLog(logId) {
        persistLogs(logs.filter(l => l.id !== logId));
        toast.info('Meal removed');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <motion.div 
                        className="w-16 h-16 border-4 border-theme-accent/30 border-t-theme-accent rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-theme-text-secondary text-sm mt-4">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard · BoilerFuel</title>
                <meta name="description" content="Track your nutrition and fitness goals at Purdue" />
            </Head>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-theme-text-primary mb-2">
                            {formatDateDisplay(selectedDate)}
                        </h1>
                        <p className="text-theme-text-secondary">
                            {selectedDayLogs.length} meals logged
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)} 
                            className="px-4 py-2 bg-theme-card-bg border border-theme-card-border rounded-xl text-theme-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                        />
                    </div>
                </motion.div>

                {/* Bento Grid Layout - Simplified */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Large Card: Daily Summary */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-theme-card-bg border border-theme-card-border rounded-3xl p-8 shadow-soft hover:shadow-soft-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-theme-text-primary">Daily Summary</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                netCalories >= goals.calories * 0.95 && netCalories <= goals.calories * 1.05
                                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                    : netCalories > goals.calories * 1.05
                                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                            }`}>
                                {netCalories >= goals.calories * 0.95 && netCalories <= goals.calories * 1.05
                                    ? 'On Track 🎯'
                                    : netCalories > goals.calories * 1.05
                                    ? 'Over Goal'
                                    : 'Below Goal'
                                }
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Net Calories - Big Number */}
                            <div>
                                <p className="text-sm text-theme-text-secondary mb-2">Total Calories</p>
                                <motion.p 
                                    key={netCalories}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-6xl font-bold text-theme-text-primary"
                                >
                                    {Math.round(netCalories)}
                                </motion.p>
                                
                                {/* Progress bar */}
                                <div className="mt-4 h-3 bg-theme-bg-tertiary rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (netCalories / goals.calories) * 100)}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                    />
                                </div>
                                <p className="text-xs text-theme-text-tertiary mt-1">
                                    Goal: {goals.calories} cal
                                </p>
                            </div>

                            {/* Macros Summary Row */}
                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-theme-border-secondary">
                                <div>
                                    <p className="text-xs text-red-500 font-semibold mb-1">PROTEIN</p>
                                    <p className="text-xl font-bold text-theme-text-primary">{Math.round(totals.protein)}g</p>
                                    <p className="text-xs text-theme-text-tertiary">{goals.protein}g goal</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-500 font-semibold mb-1">CARBS</p>
                                    <p className="text-xl font-bold text-theme-text-primary">{Math.round(totals.carbs)}g</p>
                                    <p className="text-xs text-theme-text-tertiary">{goals.carbs}g goal</p>
                                </div>
                                <div>
                                    <p className="text-xs text-yellow-500 font-semibold mb-1">FATS</p>
                                    <p className="text-xl font-bold text-theme-text-primary">{Math.round(totals.fats)}g</p>
                                    <p className="text-xs text-theme-text-tertiary">{goals.fats}g goal</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Water Tracker */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-theme-card-bg border border-theme-card-border rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
                    >
                        <WaterTracker />
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 gap-4 mb-8"
                >
                    <button
                        onClick={() => setShowLogMealChoice(true)}
                        className="p-6 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🍔</div>
                        <p className="font-semibold">Log Meal</p>
                    </button>

                    <button
                        onClick={() => window.location.href = '/food-dashboard-glass'}
                        className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                    >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📖</div>
                        <p className="font-semibold">Browse Menu</p>
                    </button>
                </motion.div>

                {/* Recent Meals */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <h3 className="text-xl font-bold text-theme-text-primary mb-4">Recent Meals</h3>
                        {selectedDayLogs.length === 0 ? (
                            <EmptyState 
                                icon="🍽️"
                                title="No meals logged yet"
                                description="Start by logging your first meal to track your daily nutrition."
                                action="Log Meal"
                                onAction={() => setShowLogMealChoice(true)}
                            />
                        ) : (
                            <div className="space-y-3">
                                {selectedDayLogs.slice(0, 5).map(log => {
                                    const food = log.customMeal || foodsById.get(log.foodId);
                                    if (!food) return null;
                                    
                                    const calories = log.customMeal 
                                        ? log.customMeal.calories * log.servings 
                                        : food.calories * log.servings;
                                    const name = log.customMeal ? log.customMeal.name : food.name;
                                    
                                    return (
                                        <motion.div 
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-4 bg-theme-card-bg border border-theme-card-border rounded-xl hover:shadow-md transition-shadow group"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-theme-text-primary">{name}</p>
                                                <p className="text-xs text-theme-text-tertiary">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.servings}x serving
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-theme-text-primary tabular-nums">
                                                    {Math.round(calories)} cal
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteFoodLog(log.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                                    aria-label="Delete meal"
                                                >
                                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Log Meal Choice Modal */}
                {showLogMealChoice && (
                    <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
                        <div className="w-full bg-theme-card-bg border-t border-theme-card-border rounded-3xl rounded-b-none p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-theme-text-primary">Log a Meal</h2>
                                    <button
                                        onClick={() => {
                                            setShowLogMealChoice(false);
                                            setLogMealMode(null);
                                        }}
                                        className="p-2 hover:bg-theme-bg-hover rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-theme-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Purdue Dining Option */}
                                    <button
                                        onClick={() => setLogMealMode('purdue')}
                                        className="w-full p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30 rounded-2xl hover:border-primary-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-4xl">🏛️</div>
                                            <div className="text-left flex-1">
                                                <h3 className="font-bold text-theme-text-primary mb-1">Purdue Dining</h3>
                                                <p className="text-sm text-theme-text-secondary">Select from dining courts and menus</p>
                                            </div>
                                            <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                                        </div>
                                    </button>

                                    {/* Custom Meal Option */}
                                    <button
                                        onClick={() => setLogMealMode('custom')}
                                        className="w-full p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-4xl">📝</div>
                                            <div className="text-left flex-1">
                                                <h3 className="font-bold text-theme-text-primary mb-1">Custom Meal</h3>
                                                <p className="text-sm text-theme-text-secondary">Log any meal with custom calories</p>
                                            </div>
                                            <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dining Court Selection */}
                {logMealMode === 'purdue' && (
                    <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
                        <div className="w-full bg-theme-card-bg border-t border-theme-card-border rounded-3xl rounded-b-none p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-theme-text-primary">Select Dining Court</h2>
                                    <button
                                        onClick={() => setLogMealMode(null)}
                                        className="p-2 hover:bg-theme-bg-hover rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-theme-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {diningCourts.map(court => (
                                        <button
                                            key={court.id}
                                            onClick={() => window.location.href = `/food-dashboard-glass?court=${court.id}`}
                                            className="p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl hover:bg-theme-accent/10 hover:border-theme-accent transition-all group"
                                        >
                                            <div className="text-3xl mb-2">{court.icon}</div>
                                            <p className="font-semibold text-theme-text-primary group-hover:text-theme-accent transition-colors text-sm">{court.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Meal Entry */}
                {logMealMode === 'custom' && (
                    <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
                        <div className="w-full bg-theme-card-bg border-t border-theme-card-border rounded-3xl rounded-b-none p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-theme-text-primary">Quick Log Custom Meal</h2>
                                    <button
                                        onClick={() => setLogMealMode(null)}
                                        className="p-2 hover:bg-theme-bg-hover rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-theme-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <CustomMealForm
                                    onSuccess={() => {
                                        setLogMealMode(null);
                                        setShowLogMealChoice(false);
                                    }}
                                    onCancel={() => setLogMealMode(null)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Meal Log (Fallback) */}
                <BottomSheet isOpen={logMealSheet} onClose={() => setLogMealSheet(false)} title="Quick Log Meal">
                    <div className="space-y-4">
                        <p className="text-theme-text-secondary">Select from recent favorites or browse the full menu.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {allFoods.slice(0, 10).map(food => (
                                <button
                                    key={food.id}
                                    onClick={() => {
                                        handleQuickAddFood(food.id);
                                        setLogMealSheet(false);
                                    }}
                                    className="p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl hover:bg-theme-bg-hover text-left transition-colors"
                                >
                                    <p className="font-medium text-sm text-theme-text-primary mb-1">{food.name}</p>
                                    <p className="text-xs text-theme-text-tertiary">{food.calories} cal</p>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => window.location.href = '/food-dashboard-glass'}
                            className="w-full py-3 bg-theme-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Browse Full Menu
                        </button>
                    </div>
                </BottomSheet>
            </div>
        </>
    );
}
