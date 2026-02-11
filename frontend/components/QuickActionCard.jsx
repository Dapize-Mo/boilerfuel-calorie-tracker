import React from 'react';
import Link from 'next/link';

const QuickActionCard = React.memo(function QuickActionCard({ href, icon, title, description, stat }) {
    return (
        <Link href={href} className="group block p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm hover:shadow-md hover:border-theme-border-secondary transition-all duration-300">
            <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-theme-bg-tertiary flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-medium text-theme-text-primary mb-1 group-hover:text-theme-text-primary transition-colors">{title}</h3>
                    <p className="text-theme-text-tertiary text-sm mb-4">{description}</p>
                    <div className="inline-block px-3 py-1 rounded-lg bg-theme-bg-tertiary text-xs font-medium text-theme-text-secondary">
                        {stat}
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-theme-card-border flex items-center justify-center text-theme-text-tertiary group-hover:border-theme-text-primary group-hover:text-theme-text-primary transition-all">
                    →
                </div>
            </div>
        </Link>
    );
});

export default QuickActionCard;
