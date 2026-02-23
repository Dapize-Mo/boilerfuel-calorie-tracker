import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me';
const DATA_SOURCE_ID = 'derived:com.google.nutrition:boilerfuel';

const MEAL_TYPE_MAP = {
  breakfast: 1,
  brunch: 1,
  lunch: 2,
  dinner: 3,
  snack: 4,
};

function mealTypeInt(mealTime) {
  const key = (mealTime || '').toLowerCase().split('/')[0].trim();
  return MEAL_TYPE_MAP[key] || 4; // default snack/other
}

// Nanoseconds for a meal: use noon local time of that date
function dateToNs(dateStr, mealTime) {
  const d = new Date(dateStr + 'T12:00:00');
  const hour = mealTypeInt(mealTime) === 1 ? 8 : mealTypeInt(mealTime) === 2 ? 12 : mealTypeInt(mealTime) === 3 ? 18 : 15;
  d.setHours(hour, 0, 0, 0);
  return (d.getTime() * 1_000_000).toString();
}

async function ensureDataSource(accessToken) {
  const body = {
    dataStreamName: 'BoilerFuelNutrition',
    type: 'derived',
    application: { name: 'BoilerFuel', version: '1' },
    dataType: { name: 'com.google.nutrition' },
  };

  const res = await fetch(`${FIT_BASE}/dataSources`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    // Already exists — fetch its ID
    const listRes = await fetch(`${FIT_BASE}/dataSources?dataTypeName=com.google.nutrition`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listData = await listRes.json();
    const existing = listData.dataSource?.find(s => s.dataStreamName === 'BoilerFuelNutrition');
    return existing?.dataStreamId;
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create data source');
  }

  const data = await res.json();
  return data.dataStreamId;
}

async function writeMealPoint(accessToken, dataSourceId, meal, dateStr) {
  const startNs = dateToNs(dateStr, meal.meal_time);
  const endNs = (BigInt(startNs) + BigInt(60 * 1_000_000_000)).toString(); // +1 min

  // com.google.nutrition value[0] = nutrients map, value[1] = meal_type int, value[2] = food_item string
  const nutrients = [
    { key: 'calories',       value: { fpVal: meal.calories || 0 } },
    { key: 'fat.total',      value: { fpVal: parseFloat(meal.macros?.fats || meal.macros?.fat) || 0 } },
    { key: 'fat.saturated',  value: { fpVal: parseFloat(meal.macros?.saturated_fat) || 0 } },
    { key: 'protein',        value: { fpVal: parseFloat(meal.macros?.protein) || 0 } },
    { key: 'carbs.total',    value: { fpVal: parseFloat(meal.macros?.carbs) || 0 } },
    { key: 'dietary_fiber',  value: { fpVal: parseFloat(meal.macros?.fiber) || 0 } },
    { key: 'sugar',          value: { fpVal: parseFloat(meal.macros?.sugar) || 0 } },
    { key: 'sodium',         value: { fpVal: parseFloat(meal.macros?.sodium) || 0 } },
    { key: 'cholesterol',    value: { fpVal: parseFloat(meal.macros?.cholesterol) || 0 } },
  ];

  const datasetId = `${startNs}-${endNs}`;
  const res = await fetch(`${FIT_BASE}/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${datasetId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataSourceId,
      minStartTimeNs: startNs,
      maxEndTimeNs: endNs,
      point: [{
        startTimeNanos: startNs,
        endTimeNanos: endNs,
        dataTypeName: 'com.google.nutrition',
        value: [
          { mapVal: nutrients },
          { intVal: mealTypeInt(meal.meal_time) },
          { stringVal: meal.name || 'Unknown' },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to write data point for ${meal.name}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) {
    return res.status(401).json({ error: 'Not signed in with Google. Please sign in to use Google Fit export.' });
  }

  const { mealsByDate, startDate, endDate } = req.body || {};

  if (!mealsByDate || typeof mealsByDate !== 'object') {
    return res.status(400).json({ error: 'Missing meal data' });
  }

  try {
    const dataSourceId = await ensureDataSource(session.accessToken);
    if (!dataSourceId) throw new Error('Could not get data source ID');

    // Filter to date range if provided
    const dates = Object.keys(mealsByDate).filter(d => {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    let exported = 0;
    for (const date of dates) {
      const meals = mealsByDate[date] || [];
      for (const meal of meals) {
        await writeMealPoint(session.accessToken, dataSourceId, meal, date);
        exported++;
      }
    }

    return res.status(200).json({ ok: true, exported });
  } catch (err) {
    const msg = err.message || 'Export failed';
    // If token lacks fitness scope, give a clear message
    if (msg.includes('403') || msg.includes('permission') || msg.includes('scope')) {
      return res.status(403).json({ error: 'Your Google account does not have fitness permission. Please sign out and sign in again to grant access.' });
    }
    return res.status(500).json({ error: msg });
  }
}
