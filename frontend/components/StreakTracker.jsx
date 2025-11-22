import React, { useState, useEffect } from 'react';
import { readCookie, createCookie } from '../utils/cookies';

const STREAK_COOKIE_KEY = 'boilerfuel_streak_v1';

export default function StreakTracker() {
    const [streak, setStreak] = useState(0);
    const [lastLogin, setLastLogin] = useState(null);

    useEffect(() => {
        const saved = readCookie(STREAK_COOKIE_KEY);
        const today = new Date().toDateString();

        if (saved) {
            const { count, lastDate } = JSON.parse(saved);

            if (lastDate === today) {
                // Already logged in today, keep streak
                setStreak(count);
                setLastLogin(lastDate);
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastDate === yesterday.toDateString()) {
                    // Logged in yesterday, increment streak
                    const newStreak = count + 1;
                    setStreak(newStreak);
                    updateCookie(newStreak, today);
                } else {
                    // Missed a day, reset streak (but count today as 1)
                    setStreak(1);
                    updateCookie(1, today);
                }
            }
        } else {
            // First time login
            setStreak(1);
            updateCookie(1, today);
        }
    }, []);

    const updateCookie = (count, date) => {
        const data = JSON.stringify({ count, lastDate: date });
        createCookie(STREAK_COOKIE_KEY, data, 365); // Keep for a year
    };

    return (
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-theme-card-bg/80 backdrop-blur-md border border-theme-card-border px-4 py-2 rounded-full shadow-sm animate-fade-in-up delay-300">
            <span className="text-2xl animate-pulse">🔥</span>
            <div>
                <p className="text-sm font-bold text-theme-text-primary leading-none">{streak}</p>
                <p className="text-[10px] font-medium text-theme-text-tertiary uppercase tracking-wider leading-none">Day Streak</p>
            </div>
        </div>
    );
}
