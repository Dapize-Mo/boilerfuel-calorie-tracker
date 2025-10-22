import { ensureSchema, query } from '../../../utils/db';
import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  const { id } = req.query;

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
