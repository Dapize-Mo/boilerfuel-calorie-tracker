import { requireAdmin } from '../../../utils/jwt';
import { ensureSchema, query } from '../../../utils/db';
import { csrfCheck } from '../../../utils/csrf';

export default async function handler(req, res) {
  if (!csrfCheck(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await requireAdmin(req);
    await ensureSchema();

    // Delete menu snapshots older than 7 days
    const snapshotResult = await query(
      `DELETE FROM menu_snapshots WHERE menu_date < CURRENT_DATE - INTERVAL '7 days'`
    );

    // Get current table sizes
    const sizeResult = await query(`
      SELECT
        relname AS table_name,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
        pg_total_relation_size(relid) AS size_bytes
      FROM pg_stat_user_tables
      ORDER BY size_bytes DESC
    `);

    const dbSizeResult = await query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
    );

    return res.status(200).json({
      ok: true,
      snapshots_deleted: snapshotResult.rowCount,
      db_size: dbSizeResult.rows[0]?.db_size,
      tables: sizeResult.rows.map(r => ({ name: r.table_name, size: r.total_size })),
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Cleanup failed' });
  }
}
