/**
 * Calculate a 0–100 nutrition score for a day's intake vs. goals.
 *
 * Scoring categories (each out of 100, weighted average):
 *  - Calorie accuracy  (30%): how close total calories are to goal (within ±10% = full points)
 *  - Protein           (25%): percentage of protein goal met (capped at 100%)
 *  - Fiber             (15%): percentage of fiber goal met (capped at 100%)
 *  - Sodium            (15%): penalty if sodium exceeds goal (0 = no penalty, 100+ = heavy penalty)
 *  - Sugar             (15%): penalty if added sugar exceeds goal
 *
 * Returns { score: number, grade: 'A'|'B'|'C'|'D'|'F', breakdown: [...] }
 */
export function calcNutritionScore(totals, goals) {
  const cal = totals.calories || 0;
  const calGoal = goals.calories || 2000;

  const protein = totals.protein || 0;
  const proteinGoal = goals.protein || 150;

  const fiber = totals.fiber || 0;
  const fiberGoal = goals.fiber || 28;

  const sodium = totals.sodium || 0;
  const sodiumGoal = goals.sodium || 2300;

  const addedSugar = totals.added_sugar || totals.sugar || 0;
  const sugarGoal = goals.added_sugar || goals.sugar || 50;

  // Calorie accuracy: full score within ±10%, linearly drops outside
  const calRatio = calGoal > 0 ? cal / calGoal : 0;
  let calScore;
  if (calRatio === 0) {
    calScore = 0;
  } else if (calRatio >= 0.9 && calRatio <= 1.1) {
    calScore = 100;
  } else if (calRatio < 0.9) {
    // Under-eating: score scales from 0 at 0% to 100 at 90%
    calScore = Math.round((calRatio / 0.9) * 100);
  } else {
    // Over-eating: score drops from 100 at 110% to 0 at 200%
    calScore = Math.max(0, Math.round(100 - ((calRatio - 1.1) / 0.9) * 100));
  }

  // Protein: pct of goal met (0–100%)
  const proteinScore = proteinGoal > 0 ? Math.min(100, Math.round((protein / proteinGoal) * 100)) : 100;

  // Fiber: pct of goal met (0–100%)
  const fiberScore = fiberGoal > 0 ? Math.min(100, Math.round((fiber / fiberGoal) * 100)) : 100;

  // Sodium: starts at 100, loses points proportional to overage
  let sodiumScore;
  if (sodiumGoal > 0 && sodium > sodiumGoal) {
    const over = (sodium - sodiumGoal) / sodiumGoal; // 0.5 = 50% over
    sodiumScore = Math.max(0, Math.round(100 - over * 100));
  } else {
    sodiumScore = 100;
  }

  // Added sugar: same penalty approach
  let sugarScore;
  if (sugarGoal > 0 && addedSugar > sugarGoal) {
    const over = (addedSugar - sugarGoal) / sugarGoal;
    sugarScore = Math.max(0, Math.round(100 - over * 100));
  } else {
    sugarScore = 100;
  }

  const score = Math.round(
    calScore * 0.30 +
    proteinScore * 0.25 +
    fiberScore * 0.15 +
    sodiumScore * 0.15 +
    sugarScore * 0.15
  );

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  const breakdown = [
    { label: 'Calories',    score: calScore,     weight: 30, detail: `${cal} / ${calGoal} kcal` },
    { label: 'Protein',     score: proteinScore, weight: 25, detail: `${Math.round(protein)}g / ${proteinGoal}g` },
    { label: 'Fiber',       score: fiberScore,   weight: 15, detail: `${Math.round(fiber)}g / ${fiberGoal}g` },
    { label: 'Sodium',      score: sodiumScore,  weight: 15, detail: `${Math.round(sodium)}mg / ${sodiumGoal}mg` },
    { label: 'Added Sugar', score: sugarScore,   weight: 15, detail: `${Math.round(addedSugar)}g / ${sugarGoal}g` },
  ];

  return { score, grade, breakdown };
}

export function gradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-green-600 dark:text-green-400';
    case 'B': return 'text-blue-600 dark:text-blue-400';
    case 'C': return 'text-yellow-600 dark:text-yellow-400';
    case 'D': return 'text-orange-600 dark:text-orange-400';
    default:  return 'text-red-600 dark:text-red-400';
  }
}
