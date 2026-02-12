import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { apiCall } from '../utils/auth';
import { readCookie, writeCookie } from '../utils/cookies';
import Toast from '../components/Toast';
import { useToast } from '../components/ToastContainer';
import MealAdditionModal from '../components/MealAdditionModal';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';

function parseGoalsCookie() {
    const raw = readCookie(GOALS_COOKIE_KEY);
    if (!raw) return { calories: 2000, protein: 150, carbs: 250, fats: 65 };
    try { return JSON.parse(raw); } catch { return { calories: 2000, protein: 150, carbs: 250, fats: 65 }; }
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
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HomeSimple() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()));
    
    const [allFoods, setAllFoods] = useState([]);
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    
    const [showAddMealModal, setShowAddMealModal] = useState(false);

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
                acc.calories += (log.customMeal.calories || 0) * log.servings;
                acc.protein += (log.customMeal.macros?.protein || 0) * log.servings;
                acc.carbs += (log.customMeal.macros?.carbs || 0) * log.servings;
                acc.fats += (log.customMeal.macros?.fats || 0) * log.servings;
            } else {
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
    const caloriePercentage = Math.min(100, (netCalories / goals.calories) * 100);

    function persistLogs(newLogs) {
        setLogs(newLogs);
        writeCookie(LOG_COOKIE_KEY, JSON.stringify(newLogs));
    }

    function handleAddMeal(mealData) {
        const newLog = {
            id: Date.now(),
            ...mealData,
            timestamp: new Date().toISOString()
        };
        persistLogs([newLog, ...logs]);
        toast.success('Meal added!');
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
                    <p className="text-theme-text-secondary text-sm mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Home · BoilerFuel</title>
                <meta name="description" content="Track your nutrition at Purdue" />
            </Head>

            <div className="min-h-screen pb-24 md:pb-8 pt-4 px-4 md:pt-8 md:px-8">
                <div className="max-w-2xl mx-auto">
                    {/* Date Navigation */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(formatDateForInput(d));
                            }}
                            className="px-3 py-2 rounded-lg bg-theme-card-bg hover:bg-theme-card-bg border border-theme-card-border text-theme-text-secondary text-sm transition-colors"
                        >
                            ← Prev
                        </button>
                        
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-theme-text-primary">
                                {formatDateDisplay(selectedDate)}
                            </h1>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)} 
                                className="mt-2 px-3 py-1 bg-transparent border border-theme-card-border rounded-lg text-theme-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            />
                        </div>

                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(formatDateForInput(d));
                            }}
                            className="px-3 py-2 rounded-lg bg-theme-card-bg hover:bg-theme-card-bg border border-theme-card-border text-theme-text-secondary text-sm transition-colors"
                        >
                            Next →
                        </button>
                    </motion.div>

                    {/* Main Calorie Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-md bg-theme-card-bg border border-theme-card-border rounded-2xl p-6">
                                <div className="text-center">
                                    <p className="text-sm text-theme-text-secondary">Calories</p>
                                    <motion.p 
                                        key={netCalories}
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        className="text-5xl md:text-6xl font-bold text-theme-text-primary"
                                    >
                                        {Math.round(netCalories)}
                                    </motion.p>
                                    <p className="text-xs text-theme-text-tertiary mt-1">
                                        Goal: {goals.calories}
                                    </p>
                                </div>
                                <div className="w-full bg-theme-bg-secondary rounded-full h-2 mt-4">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${caloriePercentage}%` }}
                                        transition={{ duration: 0.6 }}
                                        className="h-full bg-theme-accent rounded-full"
                                    />
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-theme-text-tertiary">Daily calorie progress</p>
                        </div>
                    </motion.div>

                    {/* Add Meal Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => setShowAddMealModal(true)}
                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all mb-8 shadow-lg"
                    >
                        + Add Meal
                    </motion.button>

                    {/* Meal List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                    >
                        <h2 className="text-sm font-semibold text-theme-text-secondary px-2 uppercase tracking-wide">Meals Today</h2>
                        
                        {selectedDayLogs.length === 0 ? (
                            <div className="text-center py-12 text-theme-text-tertiary">
                                <p className="text-sm">No meals logged yet</p>
                                <p className="text-xs mt-2">Click Add Meal to get started</p>
                            </div>
                        ) : (
                            selectedDayLogs.map((log) => {
                                let foodName = 'Unknown meal';
                                let foodCalories = 0;
                                if (log.customMeal) {
                                    foodName = log.customMeal.name;
                                    foodCalories = log.customMeal.calories || 0;
                                } else {
                                    const food = foodsById.get(log.foodId);
                                    if (food) {
                                        foodName = food.name;
                                        foodCalories = food.calories || 0;
                                    }
                                }
                                const totalCalories = Math.round(foodCalories * log.servings);
                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-theme-card-bg border border-theme-card-border rounded-lg p-3 flex items-center justify-between group"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-theme-text-primary text-sm">{foodName}</p>
                                            <p className="text-xs text-theme-text-secondary">
                                                {log.servings}x • {totalCalories} cal
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteFoodLog(log.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs text-red-500 hover:text-red-600"
                                        >
                                            ✕
                                        </button>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <MealAdditionModal 
                isOpen={showAddMealModal}
                onClose={() => setShowAddMealModal(false)}
                onAddMeal={handleAddMeal}
                allFoods={allFoods}
            />
        </>
    );
}
