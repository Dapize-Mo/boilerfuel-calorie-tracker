/**
 * Apple Health XML Export Utility
 *
 * Generates Apple Health CDA XML export files from BoilerFuel meal data.
 * Since this is a web app (not a native iOS app), we cannot use HealthKit
 * directly. Instead we produce an XML file matching Apple Health's export
 * schema that users can transfer to their iPhone and import.
 *
 * Supported quantity types:
 *   - HKQuantityTypeIdentifierDietaryEnergyConsumed  (kcal)
 *   - HKQuantityTypeIdentifierDietaryProtein          (g)
 *   - HKQuantityTypeIdentifierDietaryCarbohydrates    (g)
 *   - HKQuantityTypeIdentifierDietaryFatTotal         (g)
 */

const SOURCE_NAME = 'BoilerFuel';
const SOURCE_VERSION = '1.0';

// Map meal_time strings to representative hours of the day
const MEAL_TIME_HOURS = {
  breakfast: 8,
  brunch: 10,
  lunch: 12,
  dinner: 18,
  snack: 15,
};

/**
 * Resolve a meal_time string (e.g. "Breakfast", "Lunch/Dinner", "Late Lunch")
 * to an integer hour.
 */
function mealTimeToHour(mealTime) {
  if (!mealTime) return MEAL_TIME_HOURS.snack;
  const key = mealTime.toLowerCase().split('/')[0].trim();
  return MEAL_TIME_HOURS[key] ?? MEAL_TIME_HOURS.snack;
}

/**
 * Escape special XML characters in a string.
 */
function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a Date object as an Apple Health date string.
 * Example: "2025-01-15 08:00:00 -0500"
 */
function formatHealthDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  // Timezone offset
  const tzOffset = -date.getTimezoneOffset();
  const tzSign = tzOffset >= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec} ${tzSign}${tzHours}${tzMins}`;
}

/**
 * Build a single <Record> XML element for Apple Health.
 */
function buildRecord({ type, unit, value, sourceName, sourceVersion, startDate, endDate, creationDate, metadata }) {
  const metaXml = metadata
    ? metadata
        .map(
          (m) =>
            `\n    <MetadataEntry key="${escapeXml(m.key)}" value="${escapeXml(m.value)}"/>`
        )
        .join('')
    : '';

  return `  <Record type="${escapeXml(type)}" sourceName="${escapeXml(sourceName)}" sourceVersion="${escapeXml(sourceVersion)}" unit="${escapeXml(unit)}" creationDate="${escapeXml(creationDate)}" startDate="${escapeXml(startDate)}" endDate="${escapeXml(endDate)}" value="${value}"${metaXml ? '>' + metaXml + '\n  </Record>' : '/>'}`;
}

/**
 * Generate Apple Health XML from meal data.
 *
 * @param {Object} mealsByDate - Map of date strings to arrays of meal objects.
 *   e.g. { "2025-01-15": [{ id, name, calories, macros: { protein, carbs, fats/fat, ... }, meal_time, servings, addedAt }] }
 * @param {Object} [options]
 * @param {string} [options.startDate] - Start date filter (YYYY-MM-DD). If omitted, includes all dates.
 * @param {string} [options.endDate]   - End date filter (YYYY-MM-DD). If omitted, includes all dates.
 * @param {boolean} [options.includeProtein=true]
 * @param {boolean} [options.includeCarbs=true]
 * @param {boolean} [options.includeFat=true]
 * @returns {string} Apple Health XML string
 */
export function generateAppleHealthXML(mealsByDate, options = {}) {
  const {
    startDate,
    endDate,
    includeProtein = true,
    includeCarbs = true,
    includeFat = true,
  } = options;

  // Filter and sort date keys
  const dateKeys = Object.keys(mealsByDate)
    .filter((dateKey) => {
      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;
      return true;
    })
    .sort();

  const exportDate = formatHealthDate(new Date());
  const records = [];

  for (const dateKey of dateKeys) {
    const meals = mealsByDate[dateKey] || [];
    // Track per-meal-time index so items within the same meal period get offset minutes
    const mealTimeCounters = {};

    for (const meal of meals) {
      const hour = mealTimeToHour(meal.meal_time);
      const counterKey = `${dateKey}-${hour}`;
      mealTimeCounters[counterKey] = (mealTimeCounters[counterKey] || 0);
      const minuteOffset = mealTimeCounters[counterKey];
      mealTimeCounters[counterKey]++;

      // Build start/end dates for this record
      const start = new Date(`${dateKey}T00:00:00`);
      start.setHours(hour, minuteOffset, 0, 0);
      const end = new Date(start.getTime() + 60 * 1000); // 1 minute duration

      const startStr = formatHealthDate(start);
      const endStr = formatHealthDate(end);

      const foodMetadata = [
        { key: 'HKFoodMeal', value: meal.meal_time || 'Snack' },
        { key: 'HKFoodType', value: meal.name || 'Unknown' },
      ];

      // Dietary Energy Consumed (calories)
      const calories = meal.calories || 0;
      if (calories > 0) {
        records.push(
          buildRecord({
            type: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
            unit: 'kcal',
            value: calories,
            sourceName: SOURCE_NAME,
            sourceVersion: SOURCE_VERSION,
            startDate: startStr,
            endDate: endStr,
            creationDate: exportDate,
            metadata: foodMetadata,
          })
        );
      }

      const macros = meal.macros || {};

      // Dietary Protein
      if (includeProtein) {
        const protein = parseFloat(macros.protein) || 0;
        if (protein > 0) {
          records.push(
            buildRecord({
              type: 'HKQuantityTypeIdentifierDietaryProtein',
              unit: 'g',
              value: protein,
              sourceName: SOURCE_NAME,
              sourceVersion: SOURCE_VERSION,
              startDate: startStr,
              endDate: endStr,
              creationDate: exportDate,
              metadata: foodMetadata,
            })
          );
        }
      }

      // Dietary Carbohydrates
      if (includeCarbs) {
        const carbs = parseFloat(macros.carbs) || 0;
        if (carbs > 0) {
          records.push(
            buildRecord({
              type: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
              unit: 'g',
              value: carbs,
              sourceName: SOURCE_NAME,
              sourceVersion: SOURCE_VERSION,
              startDate: startStr,
              endDate: endStr,
              creationDate: exportDate,
              metadata: foodMetadata,
            })
          );
        }
      }

      // Dietary Fat Total
      if (includeFat) {
        const fat = parseFloat(macros.fats || macros.fat) || 0;
        if (fat > 0) {
          records.push(
            buildRecord({
              type: 'HKQuantityTypeIdentifierDietaryFatTotal',
              unit: 'g',
              value: fat,
              sourceName: SOURCE_NAME,
              sourceVersion: SOURCE_VERSION,
              startDate: startStr,
              endDate: endStr,
              creationDate: exportDate,
              metadata: foodMetadata,
            })
          );
        }
      }
    }
  }

  // Compose the full XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
  <!ATTLIST Record type CDATA #REQUIRED>
  <!ATTLIST Record sourceName CDATA #REQUIRED>
  <!ATTLIST Record sourceVersion CDATA #IMPLIED>
  <!ATTLIST Record unit CDATA #REQUIRED>
  <!ATTLIST Record creationDate CDATA #REQUIRED>
  <!ATTLIST Record startDate CDATA #REQUIRED>
  <!ATTLIST Record endDate CDATA #REQUIRED>
  <!ATTLIST Record value CDATA #REQUIRED>
  <!ATTLIST MetadataEntry key CDATA #REQUIRED>
  <!ATTLIST MetadataEntry value CDATA #REQUIRED>
]>
<HealthData locale="en_US">
  <ExportDate value="${escapeXml(exportDate)}"/>
  <Me HKCharacteristicTypeIdentifierDateOfBirth="" HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexNotSet" HKCharacteristicTypeIdentifierBloodType="HKBloodTypeNotSet" HKCharacteristicTypeIdentifierFitzpatrickSkinType="HKFitzpatrickSkinTypeNotSet"/>
${records.join('\n')}
</HealthData>`;

  return xml;
}

/**
 * Trigger a browser file download of the Apple Health XML export.
 *
 * @param {Object} mealsByDate - Meal data keyed by date string.
 * @param {Object} [options] - Same options as generateAppleHealthXML.
 * @returns {{ success: boolean, recordCount: number, filename: string }}
 */
export function downloadAppleHealthExport(mealsByDate, options = {}) {
  try {
    const xml = generateAppleHealthXML(mealsByDate, options);

    // Count records for feedback
    const recordCount = (xml.match(/<Record /g) || []).length;

    // Build filename with date range
    const start = options.startDate || 'all';
    const end = options.endDate || 'all';
    const filename = `boilerfuel-apple-health-${start}-to-${end}.xml`;

    // Create blob and trigger download
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true, recordCount, filename };
  } catch (err) {
    console.error('[AppleHealth] Export failed:', err);
    return { success: false, recordCount: 0, filename: '', error: err.message };
  }
}
