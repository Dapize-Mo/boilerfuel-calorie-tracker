/**
 * PDF Export Utility for BoilerFuel
 *
 * Generates a printable nutrition report in a new window.
 * The user can then use the browser's "Save as PDF" / "Print to PDF" option.
 * This avoids adding a heavy PDF library dependency.
 */

/**
 * Compute daily totals from a mealsByDate map.
 * @param {Object} mealsByDate
 * @returns {Array<{ date: string, calories: number, protein: number, carbs: number, fat: number, mealCount: number }>}
 */
function computeDailyTotals(mealsByDate) {
  return Object.entries(mealsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, meals]) => {
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (parseFloat(m.macros?.protein) || 0),
          carbs: acc.carbs + (parseFloat(m.macros?.carbs) || 0),
          fat: acc.fat + (parseFloat(m.macros?.fats || m.macros?.fat) || 0),
          mealCount: acc.mealCount + 1,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
      );
      return { date, ...totals };
    });
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format.
 */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generate a printable PDF report of nutrition data.
 * Opens a new window with a styled report and triggers the print dialog.
 *
 * @param {Object} mealsByDate - Meal data keyed by date string.
 * @param {Object} goals - User's nutrition goals { calories, protein, carbs, fat }.
 * @param {Object} [weightByDate] - Weight data keyed by date string.
 */
export function generatePDFReport(mealsByDate, goals, weightByDate = {}) {
  const dailyTotals = computeDailyTotals(mealsByDate);

  if (dailyTotals.length === 0) {
    alert('No meal data to export.');
    return;
  }

  const startDate = dailyTotals[0].date;
  const endDate = dailyTotals[dailyTotals.length - 1].date;

  // Compute averages
  const avgCalories = Math.round(
    dailyTotals.reduce((s, d) => s + d.calories, 0) / dailyTotals.length
  );
  const avgProtein = Math.round(
    dailyTotals.reduce((s, d) => s + d.protein, 0) / dailyTotals.length
  );
  const avgCarbs = Math.round(
    dailyTotals.reduce((s, d) => s + d.carbs, 0) / dailyTotals.length
  );
  const avgFat = Math.round(
    dailyTotals.reduce((s, d) => s + d.fat, 0) / dailyTotals.length
  );
  const totalMeals = dailyTotals.reduce((s, d) => s + d.mealCount, 0);

  // Build weight section
  const weightEntries = Object.entries(weightByDate)
    .filter(([d]) => d >= startDate && d <= endDate)
    .sort(([a], [b]) => a.localeCompare(b));

  // Build daily rows (limit to last 30 days for readability)
  const recentDays = dailyTotals.slice(-30);

  // Build meal detail rows (limit to last 7 days)
  const recentMealDays = dailyTotals.slice(-7);
  const mealDetailRows = recentMealDays
    .map(({ date }) => {
      const meals = mealsByDate[date] || [];
      return meals.map(
        (m) =>
          `<tr>
            <td>${escapeHtml(date)}</td>
            <td>${escapeHtml(m.meal_time || '-')}</td>
            <td>${escapeHtml(m.name || 'Unknown')}</td>
            <td class="num">${m.calories || 0}</td>
            <td class="num">${parseFloat(m.macros?.protein) || 0}g</td>
            <td class="num">${parseFloat(m.macros?.carbs) || 0}g</td>
            <td class="num">${parseFloat(m.macros?.fats || m.macros?.fat) || 0}g</td>
          </tr>`
      ).join('');
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BoilerFuel Nutrition Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; font-size: 12px; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #eab308; }
    .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .summary-card { border: 1px solid #e5e5e5; padding: 12px; text-align: center; }
    .summary-card .value { font-size: 24px; font-weight: 700; }
    .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-top: 4px; }
    .goal-note { font-size: 10px; color: #888; text-align: center; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
    th { background: #f5f5f5; text-align: left; padding: 6px 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px; border-bottom: 2px solid #ddd; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    td.num, th.num { text-align: right; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } h2 { break-after: avoid; } table { break-inside: auto; } tr { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>BoilerFuel Nutrition Report</h1>
  <p class="subtitle">${formatDate(startDate)} &mdash; ${formatDate(endDate)} &middot; ${dailyTotals.length} days &middot; ${totalMeals} meals logged</p>

  <h2>Daily Averages</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="value">${avgCalories}</div>
      <div class="label">Calories${goals.calories ? ` / ${goals.calories}` : ''}</div>
    </div>
    <div class="summary-card">
      <div class="value">${avgProtein}g</div>
      <div class="label">Protein${goals.protein ? ` / ${goals.protein}g` : ''}</div>
    </div>
    <div class="summary-card">
      <div class="value">${avgCarbs}g</div>
      <div class="label">Carbs${goals.carbs ? ` / ${goals.carbs}g` : ''}</div>
    </div>
    <div class="summary-card">
      <div class="value">${avgFat}g</div>
      <div class="label">Fat${goals.fat ? ` / ${goals.fat}g` : ''}</div>
    </div>
  </div>
  ${goals.calories ? '<p class="goal-note">Goal values shown after slash</p>' : ''}

  <h2>Daily Summary (Last ${recentDays.length} Days)</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="num">Calories</th>
        <th class="num">Protein</th>
        <th class="num">Carbs</th>
        <th class="num">Fat</th>
        <th class="num">Meals</th>
      </tr>
    </thead>
    <tbody>
      ${recentDays
        .map(
          (d) => `<tr>
            <td>${formatDate(d.date)}</td>
            <td class="num">${Math.round(d.calories)}</td>
            <td class="num">${Math.round(d.protein)}g</td>
            <td class="num">${Math.round(d.carbs)}g</td>
            <td class="num">${Math.round(d.fat)}g</td>
            <td class="num">${d.mealCount}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Meal Detail (Last 7 Days)</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Meal</th>
        <th>Food</th>
        <th class="num">Cal</th>
        <th class="num">Protein</th>
        <th class="num">Carbs</th>
        <th class="num">Fat</th>
      </tr>
    </thead>
    <tbody>
      ${mealDetailRows || '<tr><td colspan="7">No meals in the last 7 days</td></tr>'}
    </tbody>
  </table>

  ${
    weightEntries.length > 0
      ? `<h2>Weight Log</h2>
    <table>
      <thead><tr><th>Date</th><th class="num">Weight (lbs)</th></tr></thead>
      <tbody>
        ${weightEntries
          .map(
            ([d, w]) =>
              `<tr><td>${formatDate(d)}</td><td class="num">${w}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>`
      : ''
  }

  <div class="footer">
    Generated by BoilerFuel &middot; ${new Date().toLocaleString()} &middot; All data stored locally in your browser
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert(
      'Pop-up blocked. Please allow pop-ups for this site to generate PDF reports.'
    );
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
