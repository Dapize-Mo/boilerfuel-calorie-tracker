import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { writeCookie, readCookie } from '../utils/cookies';
import confetti from 'canvas-confetti';

const ONBOARDING_COOKIE_KEY = 'boilerfuel_onboarding_complete';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';

const GOAL_PRESETS = {
  lose: {
    label: 'Lose Weight',
    icon: '📉',
    description: 'Create a calorie deficit',
    calorieMultiplier: 0.85,
  },
  maintain: {
    label: 'Maintain Weight',
    icon: '⚖️',
    description: 'Stay at current weight',
    calorieMultiplier: 1.0,
  },
  gain: {
    label: 'Gain Weight',
    icon: '📈',
    description: 'Build muscle and strength',
    calorieMultiplier: 1.15,
  },
};

const MACRO_SPLITS = {
  balanced: {
    label: 'Balanced',
    icon: '⚖️',
    description: '30% protein, 40% carbs, 30% fats',
    protein: 0.3,
    carbs: 0.4,
    fats: 0.3,
  },
  highProtein: {
    label: 'High Protein',
    icon: '💪',
    description: '40% protein, 35% carbs, 25% fats',
    protein: 0.4,
    carbs: 0.35,
    fats: 0.25,
  },
  lowCarb: {
    label: 'Low Carb',
    icon: '🥑',
    description: '35% protein, 20% carbs, 45% fats',
    protein: 0.35,
    carbs: 0.2,
    fats: 0.45,
  },
};

const DINING_HALLS = [
  { id: 'earhart', name: 'Earhart' },
  { id: 'ford', name: 'Ford' },
  { id: 'hillenbrand', name: 'Hillenbrand' },
  { id: 'wiley', name: 'Wiley' },
  { id: 'windsor', name: 'Windsor' },
];

function calculateTDEE(weight, height, age, gender, activityLevel) {
  // Mifflin-St Jeor Equation
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  // Step 1: Goal Setting
  const [selectedGoal, setSelectedGoal] = useState('maintain');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(20);
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [selectedMacroSplit, setSelectedMacroSplit] = useState('balanced');

  // Step 2: Personalization
  const [theme, setTheme] = useState('auto');
  const [favoriteDiningHall, setFavoriteDiningHall] = useState('');

  // Check if user has already completed onboarding
  useEffect(() => {
    const completed = readCookie(ONBOARDING_COOKIE_KEY);
    if (completed === 'true') {
      // Skip onboarding if already completed (unless explicitly visiting this page)
      if (!router.query.force) {
        router.push('/');
      }
    }
  }, [router]);

  const tdee = calculateTDEE(weight, height, age, gender, activityLevel);
  const targetCalories = Math.round(tdee * GOAL_PRESETS[selectedGoal].calorieMultiplier);
  const macroSplit = MACRO_SPLITS[selectedMacroSplit];
  const proteinGrams = Math.round((targetCalories * macroSplit.protein) / 4);
  const carbsGrams = Math.round((targetCalories * macroSplit.carbs) / 4);
  const fatsGrams = Math.round((targetCalories * macroSplit.fats) / 9);

  const handleNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save goals
    const goals = {
      calories: targetCalories,
      protein: proteinGrams,
      carbs: carbsGrams,
      fats: fatsGrams,
      activityMinutes: 30,
    };
    writeCookie(GOALS_COOKIE_KEY, JSON.stringify(goals), 365);

    // Save favorite dining hall and theme preference
    if (favoriteDiningHall) {
      writeCookie('boilerfuel_favorite_dining_hall', favoriteDiningHall, 365);
    }
    if (theme !== 'auto') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      writeCookie('boilerfuel_theme', theme, 365);
    }

    // Mark onboarding as complete
    writeCookie(ONBOARDING_COOKIE_KEY, 'true', 365);

    // Celebrate!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Redirect to dashboard
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <>
      <Head>
        <title>Get Started - BoilerFuel</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
        <div className="w-full max-w-2xl bg-theme-card-bg border border-theme-card-border rounded-3xl shadow-2xl p-8">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : s < step
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-theme-border-primary'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-theme-text-primary mb-2">
                    🎯 Set Your Goals
                  </h1>
                  <p className="text-theme-text-tertiary">
                    Let&apos;s calculate your personalized nutrition targets
                  </p>
                </div>

                {/* Goal Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                    What&apos;s your goal?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(GOAL_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedGoal(key)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedGoal === key
                            ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                            : 'border-theme-border-primary hover:border-theme-border-secondary'
                        }`}
                      >
                        <div className="text-2xl mb-1">{preset.icon}</div>
                        <div className="text-sm font-semibold text-theme-text-primary">
                          {preset.label}
                        </div>
                        <div className="text-xs text-theme-text-tertiary mt-1">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Activity Level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full px-4 py-2 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="light">Light (exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                    <option value="active">Active (exercise 6-7 days/week)</option>
                    <option value="veryActive">Very Active (physical job + exercise)</option>
                  </select>
                </div>

                {/* Macro Split */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                    Macro Distribution
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(MACRO_SPLITS).map(([key, split]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedMacroSplit(key)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedMacroSplit === key
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : 'border-theme-border-primary hover:border-theme-border-secondary'
                        }`}
                      >
                        <div className="text-xl mb-1">{split.icon}</div>
                        <div className="text-xs font-semibold text-theme-text-primary">
                          {split.label}
                        </div>
                        <div className="text-[10px] text-theme-text-tertiary mt-1">
                          {split.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculated Targets */}
                <div className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 p-6 rounded-xl border border-yellow-400/30">
                  <div className="text-sm font-medium text-theme-text-secondary mb-3">
                    Your Daily Targets
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-theme-text-primary">
                        {targetCalories}
                      </div>
                      <div className="text-xs text-theme-text-tertiary">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{proteinGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{carbsGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{fatsGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Fats</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-theme-text-primary mb-2">
                    🎨 Personalize Your Experience
                  </h1>
                  <p className="text-theme-text-tertiary">
                    One more step to get you started
                  </p>
                </div>

                {/* Theme Preference */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                    Theme Preference
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: '☀️' },
                      { id: 'dark', label: 'Dark', icon: '🌙' },
                      { id: 'auto', label: 'Auto', icon: '🔄' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === t.id
                            ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                            : 'border-theme-border-primary hover:border-theme-border-secondary'
                        }`}
                      >
                        <div className="text-2xl mb-1">{t.icon}</div>
                        <div className="text-sm font-semibold text-theme-text-primary">
                          {t.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Favorite Dining Hall */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                    Favorite Dining Hall
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DINING_HALLS.map((hall) => (
                      <button
                        key={hall.id}
                        onClick={() => setFavoriteDiningHall(hall.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          favoriteDiningHall === hall.id
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : 'border-theme-border-primary hover:border-theme-border-secondary'
                        }`}
                      >
                        <div className="text-sm font-semibold text-theme-text-primary">
                          {hall.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="bg-theme-bg-tertiary p-6 rounded-xl">
                  <div className="text-sm font-medium text-theme-text-secondary mb-4">
                    What you can do with BoilerFuel:
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: '🍽️', text: 'Browse dining hall menus and track meals' },
                      { icon: '💪', text: 'Log workouts and monitor fitness progress' },
                      { icon: '📊', text: 'View insights and weekly nutrition trends' },
                      { icon: '🎯', text: 'Set and track your health goals' },
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-xl">{feature.icon}</span>
                        <span className="text-sm text-theme-text-secondary">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h1 className="text-3xl font-bold text-theme-text-primary mb-2">
                    You&apos;re All Set!
                  </h1>
                  <p className="text-theme-text-tertiary">
                    Ready to start your health journey
                  </p>
                </div>

                {/* Quick Tips */}
                <div className="space-y-4">
                  <div className="bg-theme-bg-tertiary p-6 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <div className="font-semibold text-theme-text-primary mb-1">
                          Pro Tip: Use Cmd/Ctrl + K
                        </div>
                        <div className="text-sm text-theme-text-secondary">
                          Press Cmd+K (Mac) or Ctrl+K (Windows) anywhere to open the command palette
                          for quick navigation.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-theme-bg-tertiary p-6 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📱</span>
                      <div>
                        <div className="font-semibold text-theme-text-primary mb-1">
                          Mobile Friendly
                        </div>
                        <div className="text-sm text-theme-text-secondary">
                          Access BoilerFuel on your phone! Look for the bottom navigation bar on
                          mobile devices.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-theme-bg-tertiary p-6 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎤</span>
                      <div>
                        <div className="font-semibold text-theme-text-primary mb-1">
                          Voice Logging
                        </div>
                        <div className="text-sm text-theme-text-secondary">
                          Try voice input to quickly log meals hands-free from the dashboard.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goals Summary */}
                <div className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 p-6 rounded-xl border border-yellow-400/30">
                  <div className="text-sm font-medium text-theme-text-secondary mb-3">
                    Your Goals
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-theme-text-primary">
                        {targetCalories}
                      </div>
                      <div className="text-xs text-theme-text-tertiary">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{proteinGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{carbsGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{fatsGrams}g</div>
                      <div className="text-xs text-theme-text-tertiary">Fats</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 text-theme-text-tertiary hover:text-theme-text-secondary transition-colors text-sm"
              >
                Skip
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-xl hover:scale-105 transition-transform"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
              >
                Start Tracking! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
