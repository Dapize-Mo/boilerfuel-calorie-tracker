import React, { useState } from 'react';

export default function BMICalculator() {
    const [feet, setFeet] = useState('');
    const [inches, setInches] = useState('');
    const [weight, setWeight] = useState('');
    const [bmi, setBmi] = useState(null);

    const calculateBMI = () => {
        if (!feet || !weight) return;

        const heightInInches = (parseInt(feet) * 12) + (parseInt(inches) || 0);
        const weightInLbs = parseFloat(weight);

        if (heightInInches > 0 && weightInLbs > 0) {
            const bmiValue = (weightInLbs / (heightInInches * heightInInches)) * 703;
            setBmi(bmiValue.toFixed(1));
        }
    };

    const getCategory = (bmi) => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
        if (bmi < 25) return { label: 'Healthy Weight', color: 'text-green-500' };
        if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
        return { label: 'Obese', color: 'text-red-500' };
    };

    const category = bmi ? getCategory(parseFloat(bmi)) : null;

    return (
        <div className="p-8 rounded-3xl bg-theme-card-bg border border-theme-card-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-theme-text-primary">BMI Calculator</h3>
                <span className="text-2xl">📏</span>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs text-theme-text-tertiary mb-1 uppercase tracking-wider">Height</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="ft"
                                value={feet}
                                onChange={(e) => setFeet(e.target.value)}
                                className="w-full p-3 rounded-xl bg-theme-bg-tertiary border border-theme-border-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            />
                            <input
                                type="number"
                                placeholder="in"
                                value={inches}
                                onChange={(e) => setInches(e.target.value)}
                                className="w-full p-3 rounded-xl bg-theme-bg-tertiary border border-theme-border-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-theme-text-tertiary mb-1 uppercase tracking-wider">Weight (lbs)</label>
                        <input
                            type="number"
                            placeholder="lbs"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full p-3 rounded-xl bg-theme-bg-tertiary border border-theme-border-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
                        />
                    </div>
                </div>

                <button
                    onClick={calculateBMI}
                    className="w-full py-3 rounded-xl bg-theme-text-primary text-theme-bg-primary font-medium hover:opacity-90 transition-opacity"
                >
                    Calculate
                </button>

                {bmi && (
                    <div className="mt-6 text-center animate-fade-in-up">
                        <p className="text-sm text-theme-text-tertiary">Your BMI</p>
                        <p className="text-4xl font-light text-theme-text-primary my-1">{bmi}</p>
                        <p className={`text-sm font-medium ${category.color}`}>{category.label}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
