import { query } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Cache for 5 minutes — retail locations don't change often
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    // Try fetching from DB table if it exists
    const { rows } = await query(
      `SELECT id, name, address, city_state_zip, hours, is_open, is_food_court, child_locations
       FROM retail_locations
       ORDER BY name`
    );
    return res.status(200).json(rows);
  } catch (err) {
    // Table may not exist yet — return empty array (frontend uses static fallback)
    return res.status(200).json([]);
  }
}
