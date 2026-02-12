import React from 'react';

const StatCard = React.memo(function StatCard({ label, value, goal, icon }) {
    const percentage = goal ? Math.min(100, (value / goal) * 100) : null;

    return (
        <div className="p-8 rounded-theme-xl bg-theme-card-bg border border-theme-card-border shadow-theme hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-yellow-400/30 modern-card relative overflow-hidden group">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-theme-text-secondary font-semibold uppercase tracking-widest">{label}</p>
                    <span className="text-3xl opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300">{icon}</span>
                </div>
                <p className="text-6xl font-light text-theme-text-primary mb-2 tracking-tight">
                    {value}
                </p>
                {goal && (
                    <div className="mt-6">
                        <div className="h-2 w-full bg-theme-bg-tertiary rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                style={{ width: `${percentage}%` }}
                            >
                                <div className="absolute inset-0 shimmer" />
                            </div>
                        </div>
                        <p className="text-xs text-theme-text-tertiary mt-3 text-right font-medium">
                            {Math.round(percentage)}% of {goal}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default StatCard;
