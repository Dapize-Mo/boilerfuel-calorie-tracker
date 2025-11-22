import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dummy data for demonstration
const data = [
    { date: 'Mon', weight: 185 },
    { date: 'Tue', weight: 184.5 },
    { date: 'Wed', weight: 184.2 },
    { date: 'Thu', weight: 183.8 },
    { date: 'Fri', weight: 183.5 },
    { date: 'Sat', weight: 183.2 },
    { date: 'Sun', weight: 183.0 },
];

export default function WeightChart() {
    return (
        <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-theme-text-primary">Weight Progress</h3>
                <span className="text-2xl">⚖️</span>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--color-text-tertiary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--color-text-tertiary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card-bg)',
                                borderColor: 'var(--color-border-primary)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="var(--color-accent-primary)"
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-accent-primary)', strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-theme-text-tertiary">Start: <span className="text-theme-text-primary font-medium">185 lbs</span></span>
                <span className="text-theme-success font-medium">-2.0 lbs</span>
                <span className="text-theme-text-tertiary">Current: <span className="text-theme-text-primary font-medium">183 lbs</span></span>
            </div>
        </div>
    );
}
