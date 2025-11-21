import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { apiCall } from '../utils/auth';

import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

// --- Constants & Helpers ---
const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const WATER_COOKIE_KEY = 'boilerfuel_water_v1';

const MOCK_FOODS = [
    { id: 101, name: 'Scrambled Eggs', calories: 140, macros: { protein: 12, carbs: 2, fats: 9 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Breakfast' },
    { id: 102, name: 'Bacon Strips', calories: 90, macros: { protein: 6, carbs: 0, fats: 7 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Breakfast' },
    { id: 103, name: 'Pancakes', calories: 220, macros: { protein: 4, carbs: 30, fats: 8 }, dining_court: 'Earhart', station: 'Comfort', meal_time: 'Breakfast' },
    { id: 104, name: 'Grilled Chicken Breast', calories: 180, macros: { protein: 35, carbs: 0, fats: 4 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Lunch' },
    { id: 105, name: 'Steamed Broccoli', calories: 40, macros: { protein: 3, carbs: 6, fats: 0 }, dining_court: 'Earhart', station: 'Healthy', meal_time: 'Lunch' },
    { id: 106, name: 'Cheeseburger', calories: 450, macros: { protein: 25, carbs: 35, fats: 22 }, dining_court: 'Ford', station: 'Grill', meal_time: 'Lunch' },
    { id: 107, name: 'Pepperoni Pizza', calories: 280, macros: { protein: 12, carbs: 30, fats: 14 }, dining_court: 'Ford', station: 'Pizza', meal_time: 'Lunch' },
    { id: 108, name: 'Caesar Salad', calories: 120, macros: { protein: 5, carbs: 8, fats: 9 }, dining_court: 'Ford', station: 'Salad Bar', meal_time: 'Lunch' },
    { id: 109, name: 'Roast Beef', calories: 250, macros: { protein: 28, carbs: 2, fats: 15 }, dining_court: 'Earhart', station: 'Carving', meal_time: 'Dinner' },
    { id: 110, name: 'Mashed Potatoes', calories: 180, macros: { protein: 3, carbs: 25, fats: 7 }, dining_court: 'Earhart', station: 'Comfort', meal_time: 'Dinner' },
    { id: 111, name: 'Late Lunch Burger', calories: 500, macros: { protein: 30, carbs: 40, fats: 20 }, dining_court: 'Ford', station: 'Grill', meal_time: 'Late Lunch' },
    { id: 112, name: 'Late Lunch Tacos', calories: 300, macros: { protein: 15, carbs: 25, fats: 12 }, dining_court: 'Windsor', station: 'Mexican', meal_time: 'Late Lunch' },
];

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
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function formatDateForInput(d) { const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - (offset * 60 * 1000)); return local.toISOString().split('T')[0]; }
function isSameDay(ts, d) { if (!ts) return false; const date = new Date(ts); return date.toDateString() === d.toDateString(); }
function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function FoodDashboardGlass() {
    // --- State ---
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);

    // View State
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'menu'
    const [isAddMealOpen, setIsAddMealOpen] = useState(false);
    const [addMealStep, setAddMealStep] = useState('meal'); // 'meal' | 'court'

    // Selection State
    const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
    const [selectedMealTime, setSelectedMealTime] = useState('');

    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredFood, setHoveredFood] = useState(null);
    const dateInputRef = useRef(null);

    // --- Load Data ---
    useEffect(() => {
        async function load() {
            try {
                const [courts, f] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => []),
                    apiCall('/api/foods').catch(() => [])
                ]);
                setDiningCourts(Array.isArray(courts) ? courts : []);
                setAllFoods(Array.isArray(f) ? f : []);
                setLoading(false);
            } catch (e) { }
        }
        load();
        const w = readCookie(WATER_COOKIE_KEY);
        if (w) { try { const p = JSON.parse(w); if (p.date === formatDateForInput(new Date())) setWaterIntake(p.count); } catch { } }
    }, []);

    useEffect(() => {
        async function fetchFoods() {
            if (loading || viewMode !== 'menu' || !selectedDiningCourt || !selectedMealTime) return;
            try {
                let url = '/api/foods';
                const params = new URLSearchParams();
                if (selectedDiningCourt) params.append('dining_court', selectedDiningCourt);
                if (selectedMealTime) params.append('meal_time', selectedMealTime);

                if (params.toString()) url += `?${params.toString()}`;

                let f = await apiCall(url).catch(() => []);

                // Fallback Mock Data for Verification
                if ((!f || f.length === 0)) {
                    f = MOCK_FOODS.filter(item =>
                        (!selectedDiningCourt || item.dining_court === selectedDiningCourt) &&
                        (!selectedMealTime || item.meal_time === selectedMealTime)
                    );
                }

                setFoods(Array.isArray(f) ? f : []);
            } catch (e) { }
        }
        fetchFoods();
    }, [selectedDiningCourt, selectedMealTime, loading, viewMode]);

    // Mock Dining Courts if empty
    // Update Dining Courts based on Meal Time
    useEffect(() => {
        if (selectedMealTime) {
            // Filter courts that have items for this meal time
            const availableCourts = [...new Set(MOCK_FOODS
                .filter(f => f.meal_time === selectedMealTime)
                .map(f => f.dining_court)
            )];
            setDiningCourts(availableCourts.length > 0 ? availableCourts : ['Earhart', 'Ford', 'Wiley', 'Windsor', 'Hillenbrand']);
        } else {
            // Show all courts if no meal selected
            setDiningCourts(['Earhart', 'Ford', 'Wiley', 'Windsor', 'Hillenbrand']);
        }
    }, [selectedMealTime]);

    // --- Logic ---
    const foodsById = useMemo(() => { const m = new Map(); allFoods.forEach(f => m.set(f.id, f)); return m; }, [allFoods]);

    const foodsByStation = useMemo(() => {
        const grouped = {};
        foods.forEach(f => {
            const station = f.station || 'Other';
            if (!grouped[station]) grouped[station] = [];
            grouped[station].push(f);
        });
        return grouped;
    }, [foods]);

    const selectedDateStart = useMemo(() => { const d = new Date(selectedDate + 'T00:00:00'); return d; }, [selectedDate]);
    const selectedDayLogs = useMemo(() => logs.filter(l => isSameDay(l.timestamp, selectedDateStart)), [logs, selectedDateStart]);

    const totals = useMemo(() => {
        return selectedDayLogs.reduce((acc, log) => {
            const f = foodsById.get(log.foodId);
            if (!f) return acc;
            acc.calories += (f.calories || 0) * log.servings;
            acc.protein += (f.macros?.protein || 0) * log.servings;
            acc.carbs += (f.macros?.carbs || 0) * log.servings;
            acc.fats += (f.macros?.fats || 0) * log.servings;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [selectedDayLogs, foodsById]);

    function persistLogs(n) { setLogs(n); writeCookie(LOG_COOKIE_KEY, JSON.stringify(n)); }
    function handleQuickAdd(id) {
        const newLog = { id: Date.now(), foodId: id, servings: 1, timestamp: new Date(selectedDate + 'T12:00:00').toISOString() };
        persistLogs([newLog, ...logs]);
    }
    function updateWater(n) {
        const v = Math.max(0, waterIntake + n);
        setWaterIntake(v);
        writeCookie(WATER_COOKIE_KEY, JSON.stringify({ date: formatDateForInput(new Date()), count: v }));
    }

    // --- Handlers ---
    const openAddMeal = () => {
        setIsAddMealOpen(true);
        setAddMealStep('meal');
        setSelectedMealTime('');
        setSelectedDiningCourt('');
    };

    const handleMealSelect = (meal) => {
        setSelectedMealTime(meal);
        setAddMealStep('court');
    };

    const handleCourtSelect = (court) => {
        setSelectedDiningCourt(court);
        setIsAddMealOpen(false);
        setViewMode('menu');
    };

    const handleBackToDashboard = () => {
        setViewMode('dashboard');
        setFoods([]);
        setSearchQuery('');
    };

    // Global Search Handler
    const handleGlobalSearchSelect = (food) => {
        handleQuickAdd(food.id);
        setSearchQuery(''); // Clear search after adding
    };

    if (loading) return <div className="min-h-screen bg-theme-bg-primary flex items-center justify-center text-theme-text-muted font-light">Loading...</div>;

    return (
        <>
            <Head><title>Glass Tracker</title></Head>
            <div className="min-h-screen bg-theme-bg-primary font-sans text-theme-text-primary relative overflow-hidden selection:bg-theme-accent/30 selection:text-theme-accent flex transition-colors duration-300">
                {/* Background Gradients */}
                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-theme-purple/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-theme-info/20 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Sidebar - Always Visible (Global Search & Nav) */}
                <div className="w-24 bg-theme-sidebar-bg backdrop-blur-xl border-r border-theme-sidebar-border flex flex-col items-center py-8 gap-6 z-20">
                    <div className="w-12 h-12 rounded-xl bg-theme-text-primary text-theme-bg-primary flex items-center justify-center font-bold text-xl mb-4">B</div>
                    {/* Global Search Trigger (could be a button that opens a search modal, or just a visual placeholder for now if we put search in header) */}
                    <button onClick={() => setViewMode('dashboard')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'dashboard' ? 'bg-theme-info text-white' : 'bg-theme-bg-secondary/40 text-theme-text-muted hover:bg-theme-bg-secondary'}`}>
                        🏠
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

                    {/* Header */}
                    <div className="px-8 py-6 flex justify-between items-center bg-theme-bg-secondary/30 backdrop-blur-md border-b border-theme-border-light">
                        <div>
                            <h1 className="text-2xl font-bold text-theme-text-primary">
                                {viewMode === 'dashboard' ? 'Food Dashboard' : `${selectedMealTime} at ${selectedDiningCourt}`}
                            </h1>
                            <p className="text-sm text-theme-text-secondary">
                                {viewMode === 'dashboard' ? 'Track your daily nutrition.' : 'Explore stations and add food.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Global Search Bar */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Quick add food..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-theme-bg-secondary/60 border-none rounded-xl px-4 py-2 w-64 focus:w-80 focus:bg-theme-bg-secondary transition-all shadow-sm placeholder:text-theme-text-muted text-theme-text-primary"
                                />
                                {searchQuery && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-theme-card-bg rounded-xl shadow-xl border border-theme-border-light max-h-96 overflow-y-auto z-50 p-2">
                                        {allFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10).map(food => (
                                            <button
                                                key={food.id}
                                                onClick={() => handleGlobalSearchSelect(food)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-theme-bg-hover flex justify-between items-center group/item"
                                            >
                                                <span className="font-medium text-theme-text-primary">{food.name}</span>
                                                <span className="text-xs text-theme-text-muted group-hover/item:text-theme-info">+ Add</span>
                                            </button>
                                        ))}
                                        {allFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                            <div className="p-3 text-center text-theme-text-muted text-sm">No foods found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {viewMode === 'menu' && (
                                <button onClick={handleBackToDashboard} className="text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                                    ← Dashboard
                                </button>
                            )}
                            <div
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="flex items-center gap-2 bg-theme-bg-secondary/60 px-4 py-2 rounded-xl cursor-pointer hover:bg-theme-bg-secondary transition-colors"
                            >
                                <span className="text-sm font-semibold text-theme-text-secondary">{formatDateDisplay(selectedDate)}</span>
                                <input ref={dateInputRef} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-0 h-0 opacity-0" />
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                        {/* View: Dashboard Overview */}
                        {viewMode === 'dashboard' && (
                            <div className="max-w-6xl mx-auto space-y-8">
                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {/* Calories Ring */}
                                    <div className="md:col-span-2 bg-theme-card-bg/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-theme-border-light flex items-center justify-between relative overflow-hidden">
                                        <div className="z-10">
                                            <h3 className="text-lg font-bold text-theme-text-secondary mb-1">Calories</h3>
                                            <div className="text-5xl font-bold text-theme-text-primary mb-2">{Math.round(totals.calories)}</div>
                                            <p className="text-sm text-theme-text-muted">of {goals.calories} kcal goal</p>
                                        </div>
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-theme-border-secondary/50" />
                                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(1, totals.calories / goals.calories))} className="text-theme-info" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-theme-info">
                                                {Math.round((totals.calories / goals.calories) * 100)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Macros */}
                                    <div className="md:col-span-2 bg-theme-card-bg/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-theme-border-light flex flex-col justify-center gap-6">
                                        <GlassMacro label="Protein" value={totals.protein} max={goals.protein} color="bg-theme-info" />
                                        <GlassMacro label="Carbs" value={totals.carbs} max={goals.carbs} color="bg-theme-purple" />
                                        <GlassMacro label="Fats" value={totals.fats} max={goals.fats} color="bg-theme-accent" />
                                    </div>
                                </div>

                                {/* Add Meal Button */}
                                <button
                                    onClick={openAddMeal}
                                    className="w-full py-6 rounded-[2rem] bg-gradient-to-r from-theme-info to-theme-purple text-white text-xl font-bold shadow-lg shadow-theme-info/30 hover:shadow-theme-info/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                                >
                                    <span className="text-3xl">+</span> Add Meal
                                </button>

                                {/* Recent Logs */}
                                <div className="bg-theme-card-bg/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-theme-border-light">
                                    <h3 className="text-xl font-bold text-theme-text-primary mb-6">Today's Meals</h3>
                                    {selectedDayLogs.length === 0 ? (
                                        <div className="text-center py-10 text-theme-text-muted">No meals logged today.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedDayLogs.map(log => {
                                                const f = foodsById.get(log.foodId);
                                                if (!f) return null;
                                                return (
                                                    <div key={log.id} className="flex items-center justify-between p-4 bg-theme-card-bg/60 rounded-2xl hover:bg-theme-card-bg transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-theme-info/10 text-theme-info flex items-center justify-center font-bold">
                                                                {f.name[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-theme-text-primary">{f.name}</h4>
                                                                <div className="flex gap-2 text-xs text-theme-text-secondary mt-1">
                                                                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    <span className="text-theme-text-muted">•</span>
                                                                    <span className="text-theme-info font-medium">{f.macros?.protein || 0}g P</span>
                                                                    <span className="text-theme-purple font-medium">{f.macros?.carbs || 0}g C</span>
                                                                    <span className="text-theme-accent font-medium">{f.macros?.fats || 0}g F</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-theme-text-primary">{Math.round(f.calories * log.servings)} kcal</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View: Menu (Expanded) */}
                        {viewMode === 'menu' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Menu Column */}
                                <div className="lg:col-span-12 space-y-8">
                                    {/* Stations */}
                                    <div className="space-y-8">
                                        {Object.keys(foodsByStation).length === 0 ? (
                                            <div className="text-center py-20 text-theme-text-muted">
                                                <p className="text-xl">No menu available.</p>
                                            </div>
                                        ) : (
                                            Object.entries(foodsByStation).map(([station, stationFoods]) => (
                                                <div key={station} className="bg-theme-card-bg/40 backdrop-blur-md rounded-[2rem] p-6 border border-theme-border-light">
                                                    <h4 className="text-lg font-bold text-theme-text-primary mb-4 px-2">{station}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {stationFoods.map(food => (
                                                            <div
                                                                key={food.id}
                                                                onClick={() => handleQuickAdd(food.id)}
                                                                onMouseEnter={() => setHoveredFood(food)}
                                                                onMouseLeave={() => setHoveredFood(null)}
                                                                className="group p-4 rounded-2xl bg-theme-card-bg/60 hover:bg-theme-card-bg border border-transparent hover:border-theme-info/20 hover:shadow-lg hover:shadow-theme-info/5 transition-all cursor-pointer flex justify-between items-center relative"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="font-bold text-theme-text-primary text-sm truncate">{food.name}</h5>
                                                                    <div className="flex gap-2 text-xs text-theme-text-secondary font-medium mt-1">
                                                                        <span>{food.calories} kcal</span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-theme-info/10 text-theme-info flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    +
                                                                </div>

                                                                {/* Hover Tooltip */}
                                                                {hoveredFood?.id === food.id && (
                                                                    <div className="absolute left-full top-0 ml-4 w-64 bg-theme-card-bg/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-theme-border-light z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 hidden lg:block">
                                                                        <h4 className="font-bold text-theme-text-primary mb-2">{food.name}</h4>
                                                                        <div className="space-y-2">
                                                                            <GlassMacro label="Protein" value={food.macros?.protein || 0} max={30} color="bg-theme-info" />
                                                                            <GlassMacro label="Carbs" value={food.macros?.carbs || 0} max={50} color="bg-theme-purple" />
                                                                            <GlassMacro label="Fats" value={food.macros?.fats || 0} max={20} color="bg-theme-accent" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Meal Modal */}
                {isAddMealOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-theme-card-bg/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-theme-border-light">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-theme-text-primary">
                                        {addMealStep === 'meal' ? 'Select Meal Time' : 'Select Dining Court'}
                                    </h2>
                                    <button onClick={() => setIsAddMealOpen(false)} className="w-10 h-10 rounded-full bg-theme-bg-hover hover:bg-theme-bg-tertiary flex items-center justify-center text-theme-text-secondary">
                                        ✕
                                    </button>
                                </div>

                                {addMealStep === 'meal' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Breakfast', 'Lunch', 'Late Lunch', 'Dinner'].map(meal => (
                                            <button
                                                key={meal}
                                                onClick={() => handleMealSelect(meal)}
                                                className="h-32 rounded-3xl bg-theme-card-bg border border-theme-border-light hover:border-theme-info hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 group"
                                            >
                                                <span className="text-3xl group-hover:scale-110 transition-transform">
                                                    {meal === 'Breakfast' ? '🍳' : meal === 'Lunch' ? '🥗' : meal === 'Dinner' ? '🍝' : '🥪'}
                                                </span>
                                                <span className="font-bold text-theme-text-primary">{meal}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {addMealStep === 'court' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {diningCourts.map(court => (
                                            <button
                                                key={court}
                                                onClick={() => handleCourtSelect(court)}
                                                className="h-24 rounded-3xl bg-theme-card-bg border border-theme-border-light hover:border-theme-info hover:shadow-lg transition-all flex items-center justify-center font-bold text-theme-text-primary"
                                            >
                                                {court}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {addMealStep === 'court' && (
                                <div className="bg-theme-bg-secondary p-4 flex justify-start">
                                    <button onClick={() => setAddMealStep('meal')} className="text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary px-4">
                                        ← Back to Meal Time
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// --- Components ---

function GlassMacro({ label, value, max, color }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div>
            <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-theme-text-secondary">{label}</span>
                <span className="text-theme-text-primary">{Math.round(value)} / {max}g</span>
            </div>
            <div className="h-2 bg-theme-border-primary/50 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}
