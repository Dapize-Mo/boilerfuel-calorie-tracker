import { ensureSchema, query } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // Cache for 1 minute
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  
  try {
    await ensureSchema();
    const mealTime = (req.query.meal_time || '').trim();

    let sql = 'SELECT DISTINCT dining_court FROM foods WHERE dining_court IS NOT NULL';
    const params = [];
    if (mealTime) {
      sql += ' AND LOWER(meal_time) = $1';
      params.push(mealTime.toLowerCase());
    }
    sql += ' ORDER BY dining_court';

    const { rows } = await query(sql, params);
    const courts = rows.map(r => r.dining_court).filter(Boolean);
    return res.status(200).json(courts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dining courts' });
  }
}
