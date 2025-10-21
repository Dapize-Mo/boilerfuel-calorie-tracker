import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureSchema();
      const { q, dining_court, meal_time } = req.query;
      const conditions = [];
      const params = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }
      if (dining_court) {
        params.push(dining_court);
        conditions.push(`dining_court = $${params.length}`);
      }
      if (meal_time) {
        params.push(meal_time);
        conditions.push(`meal_time = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await query(`SELECT id, name, calories, macros, dining_court, station, meal_time FROM foods ${where} ORDER BY name ASC`, params);
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch foods' });
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
