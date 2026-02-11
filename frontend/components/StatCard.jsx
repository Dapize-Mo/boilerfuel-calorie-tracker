import React from 'react';

const StatCard = React.memo(function StatCard({ label, value, goal, icon }) {
    const percentage = goal ? Math.min(100, (value / goal) * 100) : null;

    return (
        <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-theme-text-secondary font-medium uppercase tracking-wider">{label}</p>
                <span className="text-2xl opacity-50 grayscale">{icon}</span>
            </div>
            <p className="text-5xl font-light text-theme-text-primary mb-2">
                {value}
            </p>
            {goal && (
                <div className="mt-4">
                    <div className="h-1.5 w-full bg-theme-bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-theme-text-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-theme-text-tertiary mt-2 text-right">{Math.round(percentage)}% of goal</p>
                </div>
            )}
        </div>
    );
});

export default StatCard;
