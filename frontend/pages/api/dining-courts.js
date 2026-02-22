import { ensureSchema, query } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // Cache for 1 minute
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  
  try {
    await ensureSchema();
    const mealTime = (req.query.meal_time || '').trim();
    const date = (req.query.date || '').trim();

    let sql, params = [];

    if (date) {
      // Date-specific: query menu_snapshots only
      sql = `SELECT DISTINCT dining_court FROM menu_snapshots WHERE dining_court IS NOT NULL AND menu_date = $1`;
      params = [date];
      if (mealTime) {
        params.push(mealTime.toLowerCase());
        sql += ` AND LOWER(meal_time) = $${params.length}`;
      }
    } else {
      // No date: union foods + menu_snapshots so locations show even if one table is sparse
      if (mealTime) {
        params = [mealTime.toLowerCase()];
        sql = `
          SELECT DISTINCT dining_court FROM (
            SELECT dining_court FROM foods WHERE dining_court IS NOT NULL AND LOWER(meal_time) = $1
            UNION ALL
            SELECT dining_court FROM menu_snapshots WHERE dining_court IS NOT NULL AND LOWER(meal_time) = $1
          ) combined
        `;
      } else {
        sql = `
          SELECT DISTINCT dining_court FROM (
            SELECT dining_court FROM foods WHERE dining_court IS NOT NULL
            UNION ALL
            SELECT dining_court FROM menu_snapshots WHERE dining_court IS NOT NULL
          ) combined
        `;
      }
    }
    sql += ' ORDER BY dining_court';

    const { rows } = await query(sql, params);
    const courts = rows.map(r => r.dining_court).filter(Boolean);
    return res.status(200).json(courts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dining courts' });
  }
}
