import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { readCookie } from '../utils/cookies';
import ProgressRing from '../components/ProgressRing';

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

export default function MacrosPage() {
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [allFoods, setAllFoods] = useState([]);

    useEffect(() => {
        try {
            const stored = readCookie('boilerfuel_logs_v1');
            if (stored) setLogs(JSON.parse(stored));
        } catch (e) {
            console.error('Error loading logs:', e);
        }

        try {
            const stored = readCookie('boilerfuel_goals_v1');
            if (stored) setGoals(JSON.parse(stored));
        } catch (e) {
            console.error('Error loading goals:', e);
        }
    }, []);

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
            }
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [selectedDayLogs]);

    const macroPercentages = {
        protein: Math.min(100, (totals.protein / goals.protein) * 100),
        carbs: Math.min(100, (totals.carbs / goals.carbs) * 100),
        fats: Math.min(100, (totals.fats / goals.fats) * 100),
    };

    const macroBreakdown = selectedDayLogs.map((log, idx) => {
        let name = 'Unknown';
        let protein = 0, carbs = 0, fats = 0, calories = 0;

        if (log.customMeal) {
            name = log.customMeal.name;
            protein = (log.customMeal.macros?.protein || 0) * log.servings;
            carbs = (log.customMeal.macros?.carbs || 0) * log.servings;
            fats = (log.customMeal.macros?.fats || 0) * log.servings;
            calories = (log.customMeal.calories || 0) * log.servings;
        }

        return { id: idx, name, protein, carbs, fats, calories };
    });

    return (
        <>
            <Head>
                <title>Macros · BoilerFuel</title>
                <meta name="description" content="Track your macronutrients at Purdue" />
            </Head>

            <div className="min-h-screen pb-24 md:pb-8 pt-4 px-4 md:pt-8 md:px-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-theme-text-primary mb-2">Macro Tracker</h1>
                        <p className="text-theme-text-secondary text-sm">Monitor your protein, carbs, and fats</p>
                    </motion.div>

                    {/* Date Navigation */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        classname="flex items-center justify-between mb-6 px-2"
                    >
                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(formatDateForInput(d));
                            }}
                            className="px-3 py-2 rounded-lg bg-theme-card-bg hover:bg-theme-bg-secondary border border-theme-card-border text-theme-text-secondary text-sm transition-colors"
                        >
                            ← Prev
                        </button>
                        
                        <div className="text-center flex-1 mx-4">
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)} 
                                className="w-full md:w-auto px-3 py-1 bg-transparent border border-theme-card-border rounded-lg text-theme-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-theme-accent text-center"
                            />
                        </div>

                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(formatDateForInput(d));
                            }}
                            className="px-3 py-2 rounded-lg bg-theme-card-bg hover:bg-theme-bg-secondary border border-theme-card-border text-theme-text-secondary text-sm transition-colors"
                        >
                            Next →
                        </button>
                    </motion.div>

                    {/* Macro Cards with Progress Rings */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                    >
                        {/* Protein */}
                        <div className="bg-theme-card-bg border border-theme-card-border rounded-2xl p-6 flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-4">
                                <ProgressRing 
                                    percentage={macroPercentages.protein}
                                    size={128}
                                    strokeWidth={6}
                                    color="#ff6b6b"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-red-500">{Math.round(totals.protein)}</p>
                                    <p className="text-xs text-theme-text-secondary">g</p>
                                </div>
                            </div>
                            <p className="font-semibold text-theme-text-primary text-center mb-1">Protein</p>
                            <p className="text-xs text-theme-text-secondary text-center">Goal: {goals.protein}g</p>
                            <div className="w-full bg-theme-bg-secondary rounded-full h-1 mt-3">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${macroPercentages.protein}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full bg-red-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-theme-text-tertiary mt-2">
                                {Math.round(macroPercentages.protein)}% of goal
                            </p>
                        </div>

                        {/* Carbs */}
                        <div className="bg-theme-card-bg border border-theme-card-border rounded-2xl p-6 flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-4">
                                <ProgressRing 
                                    percentage={macroPercentages.carbs}
                                    size={128}
                                    strokeWidth={6}
                                    color="#4dabf7"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-blue-500">{Math.round(totals.carbs)}</p>
                                    <p className="text-xs text-theme-text-secondary">g</p>
                                </div>
                            </div>
                            <p className="font-semibold text-theme-text-primary text-center mb-1">Carbs</p>
                            <p className="text-xs text-theme-text-secondary text-center">Goal: {goals.carbs}g</p>
                            <div className="w-full bg-theme-bg-secondary rounded-full h-1 mt-3">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${macroPercentages.carbs}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-theme-text-tertiary mt-2">
                                {Math.round(macroPercentages.carbs)}% of goal
                            </p>
                        </div>

                        {/* Fats */}
                        <div className="bg-theme-card-bg border border-theme-card-border rounded-2xl p-6 flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-4">
                                <ProgressRing 
                                    percentage={macroPercentages.fats}
                                    size={128}
                                    strokeWidth={6}
                                    color="#ffd43b"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-yellow-500">{Math.round(totals.fats)}</p>
                                    <p className="text-xs text-theme-text-secondary">g</p>
                                </div>
                            </div>
                            <p className="font-semibold text-theme-text-primary text-center mb-1">Fats</p>
                            <p className="text-xs text-theme-text-secondary text-center">Goal: {goals.fats}g</p>
                            <div className="w-full bg-theme-bg-secondary rounded-full h-1 mt-3">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${macroPercentages.fats}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full bg-yellow-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-theme-text-tertiary mt-2">
                                {Math.round(macroPercentages.fats)}% of goal
                            </p>
                        </div>
                    </motion.div>

                    {/* Breakdown Table */}
                    {macroBreakdown.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-theme-card-bg border border-theme-card-border rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-bold text-theme-text-primary mb-4">Meal Breakdown</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {macroBreakdown.map((meal) => (
                                    <div key={meal.id} className="bg-theme-bg-secondary rounded-lg p-3 text-sm">
                                        <p className="font-medium text-theme-text-primary">{meal.name}</p>
                                        <div className="grid grid-cols-4 gap-2 text-xs text-theme-text-secondary mt-2">
                                            <div>P: {Math.round(meal.protein)}g</div>
                                            <div>C: {Math.round(meal.carbs)}g</div>
                                            <div>F: {Math.round(meal.fats)}g</div>
                                            <div>{Math.round(meal.calories)} cal</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {macroBreakdown.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-theme-text-tertiary"
                        >
                            <p className="text-sm">No meals logged for this date</p>
                            <p className="text-xs mt-2">Log a meal from the home page to see your macro breakdown</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
