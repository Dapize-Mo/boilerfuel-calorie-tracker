import { ensureSchema, query } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await ensureSchema();
    const { rows } = await query('SELECT DISTINCT dining_court FROM foods WHERE dining_court IS NOT NULL ORDER BY dining_court');
    const courts = rows.map(r => r.dining_court).filter(Boolean);
    return res.status(200).json(courts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dining courts' });
  }
}
