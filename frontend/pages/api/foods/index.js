import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Short cache - allow quick updates
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    try {
      await ensureSchema();
      const { q, dining_court, meal_time, station, group } = req.query;
      const conditions = [];
      const params = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }
      if (dining_court) {
        params.push(dining_court.toLowerCase());
        conditions.push(`LOWER(dining_court) = $${params.length}`);
      }
      if (meal_time) {
        params.push(meal_time.toLowerCase());
        conditions.push(`LOWER(meal_time) = $${params.length}`);
      }
      if (station) {
        params.push(station.toLowerCase());
        conditions.push(`LOWER(station) = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT id, name, calories, macros, dining_court, station, meal_time, next_available FROM foods ${where} ORDER BY dining_court, meal_time, station, name`;
      const { rows } = await query(sql, params);

      if (group) {
        const grouped = {};
        for (const r of rows) {
          const court = r.dining_court || 'Unknown';
          const meal = r.meal_time || 'Unknown';
          const st = r.station || 'Unknown';
          grouped[court] ||= {};
          grouped[court][meal] ||= {};
          grouped[court][meal][st] ||= [];
          grouped[court][meal][st].push({
            id: r.id, name: r.name, calories: r.calories,
            macros: r.macros, next_available: r.next_available,
          });
        }
        return res.status(200).json({ date: new Date().toISOString().slice(0, 10), grouped });
      }

      return res.status(200).json(rows.map(r => ({
        id: r.id, name: r.name, calories: r.calories, macros: r.macros,
        dining_court: r.dining_court, station: r.station,
        meal_time: r.meal_time, next_available: r.next_available,
      })));
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch foods', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      await requireAdmin(req);
      await ensureSchema();
      const body = req.body || {};
      const { name, calories, macros, dining_court, station, meal_time } = body;
      if (!name || calories == null || !macros) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const result = await query(
        `INSERT INTO foods (name, calories, macros, dining_court, station, meal_time) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, calories, macros, dining_court, station, meal_time`,
        [String(name).trim(), Number(calories), macros, dining_court || null, station || null, meal_time || null]
      );
      return res.status(201).json({ message: 'Food added successfully!', food: result.rows[0] });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to add food' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
