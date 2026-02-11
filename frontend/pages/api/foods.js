import { ensureSchema, query } from '../../utils/db';

// GET /api/foods?dining_court=FORD&meal_time=lunch&station=Grill&group=1
// Returns flat list or grouped hierarchy if group=1
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // Enable caching for GET requests (5 minutes, revalidate in background)
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  
  try {
    await ensureSchema();
    const { dining_court, meal_time, station, group } = req.query;

    const filters = [];
    const params = [];
    if (dining_court) { params.push(dining_court); filters.push(`dining_court = $${params.length}`); }
    if (meal_time)    { params.push(meal_time);    filters.push(`meal_time = $${params.length}`); }
    if (station)      { params.push(station);      filters.push(`station = $${params.length}`); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT id, name, calories, macros, dining_court, station, meal_time, next_available
                 FROM foods ${where} ORDER BY dining_court, meal_time, station, name`;
    const { rows } = await query(sql, params);

    if (group) {
      // Build hierarchy: dining_court -> meal_time -> station -> items
      const grouped = {};
      for (const r of rows) {
        const court = r.dining_court || 'Unknown';
        const meal = r.meal_time || 'Unknown';
        const st = r.station || 'Unknown';
        grouped[court] ||= {};
        grouped[court][meal] ||= {};
        grouped[court][meal][st] ||= [];
        grouped[court][meal][st].push({
          id: r.id,
            name: r.name,
            calories: r.calories,
            macros: r.macros,
            next_available: r.next_available,
        });
      }
      return res.status(200).json({ date: new Date().toISOString().slice(0,10), grouped });
    }

    return res.status(200).json(rows.map(r => ({
      id: r.id,
      name: r.name,
      calories: r.calories,
      macros: r.macros,
      dining_court: r.dining_court,
      station: r.station,
      meal_time: r.meal_time,
      next_available: r.next_available,
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch foods', detail: err.message });
  }
}
