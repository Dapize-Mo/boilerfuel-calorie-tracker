import { requireAdmin } from '../../../utils/jwt';
import { ensureSchema, query } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await requireAdmin(req);
    await ensureSchema();
    const result = await query('DELETE FROM foods RETURNING id');
    return res.status(200).json({ ok: true, deleted: result.rowCount });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to clear foods' });
  }
}
