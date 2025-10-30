import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      await requireAdmin(req);
      await ensureSchema();

      const body = JSON.parse(req.body || '{}');
      const {
        name,
        calories_per_hour,
        category = 'other',
        intensity = 'moderate',
        muscle_groups = [],
        equipment = null,
        description = null,
      } = body;

      if (!name || !calories_per_hour) {
        return res.status(400).json({ error: 'Name and calories_per_hour are required' });
      }

      const sql = `
        UPDATE activities
        SET name = $1,
            calories_per_hour = $2,
            category = $3,
            intensity = $4,
            muscle_groups = $5,
            equipment = $6,
            description = $7
        WHERE id = $8
        RETURNING *
      `;

      const result = await query(sql, [
        name,
        Number(calories_per_hour),
        category,
        intensity,
        JSON.stringify(muscle_groups),
        equipment,
        description,
        Number(id),
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to update activity' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await requireAdmin(req);
      await ensureSchema();
      await query('DELETE FROM activities WHERE id = $1', [Number(id)]);
      return res.status(200).json({ message: 'Activity deleted' });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to delete activity' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
