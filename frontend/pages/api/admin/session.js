import { requireAdmin } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message || 'Unauthorized' });
  }
}
