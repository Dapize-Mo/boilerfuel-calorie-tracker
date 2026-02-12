import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function GoalsModal({ isOpen, onClose, currentGoals, onSave }) {
    const [formData, setFormData] = useState({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 65
    });

    useEffect(() => {
        if (currentGoals) {
            setFormData(currentGoals);
        }
    }, [currentGoals, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 bg-theme-card-bg border border-theme-card-border rounded-2xl max-w-md w-full shadow-xl z-50"
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-theme-text-primary mb-4">Edit Daily Goals</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Calories */}
                        <div>
                            <label className="block text-sm font-semibold text-theme-text-secondary mb-2">
                                Calorie Goal
                            </label>
                            <input
                                type="number"
                                name="calories"
                                value={formData.calories}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            />
                        </div>

                        {/* Macros */}
                        <div className="bg-theme-bg-secondary rounded-lg p-3 space-y-3">
                            <p className="text-xs font-semibold text-theme-text-secondary uppercase">Daily Macro Goals</p>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Protein (g)
                                </label>
                                <input
                                    type="number"
                                    name="protein"
                                    value={formData.protein}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-theme-card-bg border border-theme-card-border rounded text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Carbs (g)
                                </label>
                                <input
                                    type="number"
                                    name="carbs"
                                    value={formData.carbs}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-theme-card-bg border border-theme-card-border rounded text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Fats (g)
                                </label>
                                <input
                                    type="number"
                                    name="fats"
                                    value={formData.fats}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-theme-card-bg border border-theme-card-border rounded text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent text-sm"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-theme-bg-secondary border border-theme-card-border rounded-lg text-theme-text-primary font-medium transition-colors hover:bg-theme-bg-tertiary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Save Goals
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
