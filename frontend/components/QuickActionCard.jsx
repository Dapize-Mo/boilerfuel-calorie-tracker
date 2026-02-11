import React from 'react';
import Link from 'next/link';

const QuickActionCard = React.memo(function QuickActionCard({ href, icon, title, description, stat }) {
    return (
        <Link href={href} className="group block p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-lg hover:shadow-2xl hover:border-yellow-400/40 transition-all duration-300 hover:scale-[1.02] modern-card relative overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-theme-text-primary mb-2 group-hover:text-yellow-400 transition-colors">{title}</h3>
                    <p className="text-theme-text-tertiary text-sm mb-4 leading-relaxed">{description}</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-bg-tertiary text-xs font-semibold text-theme-text-secondary group-hover:bg-yellow-400/10 group-hover:text-yellow-400 transition-colors">
                        {stat}
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-theme-card-border flex items-center justify-center text-theme-text-tertiary group-hover:border-yellow-400 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300">
                    →
                </div>
            </div>
        </Link>
    );
});

export default QuickActionCard;
