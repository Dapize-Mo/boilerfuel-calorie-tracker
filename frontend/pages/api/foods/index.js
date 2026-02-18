import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Short cache - allow quick updates
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    try {
      await ensureSchema();
      const { q, dining_court, meal_time, station, group, date } = req.query;
      const conditions = [];
      const params = [];

      // When a date is provided, query menu_snapshots (date-specific menus)
      // Otherwise fall back to the general foods catalog
      const useSnapshots = !!date;
      const table = useSnapshots ? 'menu_snapshots' : 'foods';

      if (useSnapshots) {
        params.push(date);
        conditions.push(`(menu_date = $${params.length} OR source = 'retail')`);
      }

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }
      if (dining_court) {
        // Support comma-separated list for category selection
        const courts = dining_court.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
        if (courts.length === 1) {
          params.push(courts[0]);
          conditions.push(`LOWER(dining_court) = $${params.length}`);
        } else if (courts.length > 1) {
          const placeholders = courts.map((c, i) => {
            params.push(c);
            return `$${params.length}`;
          });
          conditions.push(`LOWER(dining_court) IN (${placeholders.join(', ')})`);
        }
      }
      if (meal_time) {
        const mt = meal_time.toLowerCase();
        params.push(mt);
        const p = params.length;
        conditions.push(`(LOWER(meal_time) = $${p} OR LOWER(meal_time) LIKE $${p} || '/%' OR LOWER(meal_time) LIKE '%/' || $${p} OR LOWER(meal_time) LIKE '%/' || $${p} || '/%')`);
      }
      if (station) {
        params.push(station.toLowerCase());
        conditions.push(`LOWER(station) = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const selectCols = useSnapshots
        ? 'id, name, calories, macros, dining_court, station, meal_time'
        : 'id, name, calories, macros, dining_court, station, meal_time, next_available';

      const sql = `SELECT ${selectCols} FROM ${table} ${where} ORDER BY dining_court, meal_time, station, name`;
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
            macros: r.macros, ...(r.next_available != null && { next_available: r.next_available }),
          });
        }
        return res.status(200).json({ date: date || new Date().toISOString().slice(0, 10), grouped });
      }

      return res.status(200).json(rows.map(r => ({
        id: r.id, name: r.name, calories: r.calories, macros: r.macros,
        dining_court: r.dining_court, station: r.station,
        meal_time: r.meal_time, ...(r.next_available != null && { next_available: r.next_available }),
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
