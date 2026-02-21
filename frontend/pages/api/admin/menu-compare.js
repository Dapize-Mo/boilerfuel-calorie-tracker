import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';
import { DINING_LOCATIONS } from '../../../utils/diningLocations';

function normalizeText(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMeal(name) {
  const key = normalizeText(name);
  if (key === 'late lunch' || key === 'latelunch') return 'late lunch';
  if (key === 'breakfast') return 'breakfast';
  if (key === 'brunch') return 'brunch';
  if (key === 'lunch') return 'lunch';
  if (key === 'dinner') return 'dinner';
  return name || 'Unknown';
}

function buildKey(item) {
  return [
    normalizeText(item.name),
    normalizeText(item.meal_time),
    normalizeText(item.station)
  ].join('|');
}

function parseYmd(value) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateInRange(dateStr, startStr, endStr) {
  return dateStr >= startStr && dateStr <= endStr;
}

function menuIsClosed(menuJson) {
  if (!menuJson) return { closed: false, reason: '' };
  if (menuJson.IsOpen === false) return { closed: true, reason: 'API reports IsOpen = false' };
  if (menuJson.IsPublished === false) return { closed: true, reason: 'API reports IsPublished = false' };
  const meals = menuJson.Meals || [];
  if (!meals.length) return { closed: true, reason: 'API returned no Meals entries' };
  let totalItems = 0;
  for (const meal of meals) {
    for (const station of meal.Stations || []) {
      totalItems += (station.Items || []).length;
    }
  }
  if (totalItems === 0) return { closed: true, reason: 'API published meals but no items' };
  return { closed: false, reason: '' };
}

async function fetchMenu(location, dateStr) {
  const url = `https://api.hfs.purdue.edu/menus/v2/locations/${encodeURIComponent(location)}/${dateStr}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'BoilerFuelVerifier/1.0', 'Accept': 'application/json' }
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`API ${resp.status}: ${detail}`);
  }
  return resp.json();
}

function extractApiItems(menuJson) {
  const items = [];
  for (const meal of menuJson.Meals || []) {
    const mealName = normalizeMeal(meal.Name);
    for (const station of meal.Stations || []) {
      const stationName = (station.Name || 'Unknown').trim() || 'Unknown';
      for (const item of station.Items || []) {
        const name = (item.Name || '').trim();
        if (!name) continue;
        items.push({
          name,
          meal_time: mealName,
          station: stationName
        });
      }
    }
  }
  return items;
}

function toMacroValue(value) {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function macrosMismatch(foodItem, snapshotItem) {
  const eps = 0.1;
  const foodMacros = foodItem?.macros || {};
  const snapMacros = snapshotItem?.macros || {};
  const pairs = [
    ['calories', foodItem?.calories, snapshotItem?.calories],
    ['protein', foodMacros?.protein, snapMacros?.protein],
    ['carbs', foodMacros?.carbs, snapMacros?.carbs],
    ['fats', foodMacros?.fats, snapMacros?.fats]
  ];

  for (const [, left, right] of pairs) {
    const a = toMacroValue(left);
    const b = toMacroValue(right);
    if (a == null || b == null) continue;
    if (Math.abs(a - b) > eps) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await requireAdmin(req);
    await ensureSchema();

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const defaultStart = addDays(todayUtc, -7);
    const defaultEnd = addDays(todayUtc, 2);

    const startDate = parseYmd(req.query.start) || defaultStart;
    const endDate = parseYmd(req.query.end) || defaultEnd;
    const maxRangeDays = 14;

    const rangeDays = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
    if (rangeDays < 1 || rangeDays > maxRangeDays) {
      return res.status(400).json({ error: `Date range must be between 1 and ${maxRangeDays} days` });
    }

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    const limit = Math.max(5, Math.min(50, Number(req.query.limit) || 20));

    const { rows: snapshotRows } = await query(
      `SELECT menu_date, name, calories, macros, dining_court, dining_court_code, station, meal_time
       FROM menu_snapshots WHERE menu_date BETWEEN $1 AND $2`,
      [startStr, endStr]
    );

    const { rows: foodRows } = await query(
      `SELECT name, calories, macros, dining_court, station, meal_time, next_available
       FROM foods WHERE next_available IS NOT NULL`
    );

    const locationMap = new Map();
    for (const loc of DINING_LOCATIONS) {
      locationMap.set(loc.code.toLowerCase(), loc.display_name);
      locationMap.set(loc.display_name.toLowerCase(), loc.display_name);
    }

    const snapshotsByDate = {};
    for (const row of snapshotRows) {
      const dateStr = row.menu_date instanceof Date ? formatDate(row.menu_date) : String(row.menu_date);
      const courtValue = row.dining_court || row.dining_court_code || 'Unknown';
      const court = locationMap.get(String(courtValue).toLowerCase()) || courtValue;
      const item = {
        name: row.name,
        calories: row.calories,
        macros: row.macros || {},
        station: row.station || 'Unknown',
        meal_time: row.meal_time || 'Unknown',
        dining_court: court
      };
      const key = buildKey(item);
      snapshotsByDate[dateStr] ||= {};
      snapshotsByDate[dateStr][court] ||= new Map();
      snapshotsByDate[dateStr][court].set(key, item);
    }

    const foodsByDate = {};
    for (const row of foodRows) {
      const schedule = Array.isArray(row.next_available)
        ? row.next_available
        : (typeof row.next_available === 'string' ? JSON.parse(row.next_available || '[]') : []);

      for (const slot of schedule) {
        if (!slot?.date || !dateInRange(slot.date, startStr, endStr)) continue;
        const courtValue = row.dining_court || 'Unknown';
        const court = locationMap.get(String(courtValue).toLowerCase()) || courtValue;
        const item = {
          name: row.name,
          calories: row.calories,
          macros: row.macros || {},
          station: row.station || 'Unknown',
          meal_time: slot.meal_time || row.meal_time || 'Unknown',
          dining_court: court
        };
        const key = buildKey(item);
        foodsByDate[slot.date] ||= {};
        foodsByDate[slot.date][court] ||= new Map();
        foodsByDate[slot.date][court].set(key, item);
      }
    }

    const results = [];
    let totalApiItems = 0;
    let totalDbItems = 0;
    let totalMissing = 0;
    let totalExtra = 0;
    let totalNutritionMismatches = 0;

    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      const dateStr = formatDate(d);
      const isFutureOrToday = d.getTime() >= todayUtc.getTime();

      for (const loc of DINING_LOCATIONS) {
        let menuJson;
        try {
          menuJson = await fetchMenu(loc.api_name, dateStr);
        } catch (err) {
          results.push({
            date: dateStr,
            court_code: loc.code,
            display_name: loc.display_name,
            status: 'error',
            error: err.message,
            source: isFutureOrToday ? 'foods' : 'snapshots'
          });
          continue;
        }

        const closedInfo = menuIsClosed(menuJson);
        if (closedInfo.closed) {
          results.push({
            date: dateStr,
            court_code: loc.code,
            display_name: loc.display_name,
            status: 'closed',
            reason: closedInfo.reason,
            source: isFutureOrToday ? 'foods' : 'snapshots'
          });
          continue;
        }

        const apiItems = extractApiItems(menuJson);
        const apiMap = new Map();
        for (const item of apiItems) {
          const key = buildKey(item);
          apiMap.set(key, item);
        }

        const snapshotMap = snapshotsByDate[dateStr]?.[loc.display_name] || new Map();
        const foodMap = foodsByDate[dateStr]?.[loc.display_name] || new Map();
        const dbMap = isFutureOrToday ? foodMap : snapshotMap;

        const missing = [];
        const extra = [];
        let nutritionMismatches = 0;
        let matched = 0;
        let extraCount = 0;
        let missingCount = 0;

        for (const [key, apiItem] of apiMap.entries()) {
          if (dbMap.has(key)) {
            matched += 1;
          } else {
            missingCount += 1;
            if (missing.length < limit) {
              missing.push(`${apiItem.name} (${apiItem.meal_time} / ${apiItem.station})`);
            }
          }
        }

        for (const [key, dbItem] of dbMap.entries()) {
          if (!apiMap.has(key)) {
            extraCount += 1;
            if (extra.length < limit) {
              extra.push(`${dbItem.name} (${dbItem.meal_time} / ${dbItem.station})`);
            }
            continue;
          }

          if (isFutureOrToday && snapshotMap.has(key)) {
            if (macrosMismatch(dbItem, snapshotMap.get(key))) {
              nutritionMismatches += 1;
            }
          }
        }

        totalApiItems += apiMap.size;
        totalDbItems += dbMap.size;
        totalMissing += missingCount;
        totalExtra += extraCount;
        totalNutritionMismatches += nutritionMismatches;

        results.push({
          date: dateStr,
          court_code: loc.code,
          display_name: loc.display_name,
          status: 'open',
          source: isFutureOrToday ? 'foods' : 'snapshots',
          api_count: apiMap.size,
          db_count: dbMap.size,
          matched_count: matched,
          coverage_percent: apiMap.size ? Number(((matched / apiMap.size) * 100).toFixed(1)) : 0,
          missing_count: missingCount,
          extra_count: extraCount,
          nutrition_mismatch_count: nutritionMismatches,
          missing,
          extra
        });
      }
    }

    return res.status(200).json({
      range: { start: startStr, end: endStr, days: rangeDays },
      generated_at: new Date().toISOString(),
      summary: {
        total_api_items: totalApiItems,
        total_db_items: totalDbItems,
        total_missing: totalMissing,
        total_extra: totalExtra,
        total_nutrition_mismatches: totalNutritionMismatches
      },
      results
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Failed to compare menus' });
  }
}
