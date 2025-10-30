import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureSchema();
      const { q } = req.query;
      const params = [];
      const where = q ? (params.push(`%${q}%`), 'WHERE name ILIKE $1') : '';
      const { rows } = await query(
        `SELECT id, name, calories_per_hour, category, intensity, muscle_groups, equipment, description
         FROM activities ${where} ORDER BY name ASC`,
        params
      );
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch activities' });
    }
  }

  if (req.method === 'POST') {
    try {
      await requireAdmin(req);
      await ensureSchema();
      const body = req.body || {};
      const {
        name,
        calories_per_hour,
        category = 'other',
        intensity = 'moderate',
        muscle_groups = [],
        equipment = null,
        description = null,
      } = body;

      if (!name || calories_per_hour == null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await query(
        `INSERT INTO activities (name, calories_per_hour, category, intensity, muscle_groups, equipment, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, calories_per_hour, category, intensity, muscle_groups, equipment, description`,
        [
          String(name).trim(),
          Number(calories_per_hour),
          category,
          intensity,
          JSON.stringify(muscle_groups),
          equipment,
          description,
        ]
      );

      return res.status(201).json({ message: 'Activity added successfully!', activity: result.rows[0] });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to add activity' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
