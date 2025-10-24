import { ensureSchema, query } from '../../utils/db';
import { requireAdmin } from '../../utils/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req);
    await ensureSchema();

    // Delete all foods from the database
    const result = await query('DELETE FROM foods');
    
    return res.status(200).json({ 
      message: `Database cleared successfully! Removed ${result.rowCount} food items.`,
      count: result.rowCount
    });
  } catch (err) {
    console.error('Error clearing database:', err);
    const status = err.status || 500;
    return res.status(status).json({ 
      error: err.message || 'Failed to clear database' 
    });
  }
}
