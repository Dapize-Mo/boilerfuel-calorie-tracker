import React, { useState, useEffect } from 'react';
import { readCookie, createCookie } from '../utils/cookies';

const WATER_COOKIE_KEY = 'boilerfuel_water_v1';

export default function WaterTracker() {
    const [glasses, setGlasses] = useState(0);
    const [goal] = useState(8); // Daily goal of 8 glasses

    useEffect(() => {
        const saved = readCookie(WATER_COOKIE_KEY);
        if (saved) {
            const { date, count } = JSON.parse(saved);
            const today = new Date().toDateString();
            if (date === today) {
                setGlasses(count);
            } else {
                // Reset if it's a new day
                setGlasses(0);
            }
        }
    }, []);

    const updateGlasses = (newCount) => {
        const count = Math.max(0, newCount);
        setGlasses(count);
        const data = JSON.stringify({
            date: new Date().toDateString(),
            count: count
        });
        createCookie(WATER_COOKIE_KEY, data, 1); // Expires in 1 day
    };

    const percentage = Math.min(100, (glasses / goal) * 100);

    return (
        <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-theme-text-primary">Water Intake</h3>
                <span className="text-2xl">💧</span>
            </div>

            <div className="flex items-end justify-between mb-4">
                <div>
                    <span className="text-4xl font-light text-theme-text-primary">{glasses}</span>
                    <span className="text-theme-text-tertiary ml-2">/ {goal} glasses</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => updateGlasses(glasses - 1)}
                        className="w-10 h-10 rounded-xl border border-theme-border-primary flex items-center justify-center text-theme-text-secondary hover:bg-theme-bg-hover transition-colors"
                    >
                        -
                    </button>
                    <button
                        onClick={() => updateGlasses(glasses + 1)}
                        className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-4 w-full bg-theme-bg-tertiary rounded-full overflow-hidden relative">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${percentage}%` }}
                >
                    {/* Wave effect overlay */}
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
            </div>

            {percentage >= 100 && (
                <p className="text-xs text-blue-500 mt-3 font-medium text-center animate-bounce">
                    🎉 Goal reached! Stay hydrated!
                </p>
            )}
        </div>
    );
}
