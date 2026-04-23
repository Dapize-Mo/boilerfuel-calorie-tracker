import { requireAdmin } from '../../../utils/jwt';
import { ensureSchema, query, getDatabaseCapacityStatus } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await requireAdmin(req);
    await ensureSchema();

    const [sizeResult, dbSizeResult, rowCountResult, capacity] = await Promise.all([
      query(`
        SELECT
          relname AS table_name,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          pg_total_relation_size(relid) AS size_bytes
        FROM pg_stat_user_tables
        ORDER BY size_bytes DESC
      `),
      query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size,
                    pg_database_size(current_database()) AS db_size_bytes`),
      query(`
        SELECT
          relname AS table_name,
          n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY relname
      `),
      getDatabaseCapacityStatus(),
    ]);

    const rowCountMap = {};
    for (const row of rowCountResult.rows) {
      rowCountMap[row.table_name] = Number(row.row_count);
    }

    return res.status(200).json({
      db_size: dbSizeResult.rows[0]?.db_size,
      db_size_bytes: Number(dbSizeResult.rows[0]?.db_size_bytes || 0),
      tables: sizeResult.rows.map(r => ({
        name: r.table_name,
        size: r.total_size,
        size_bytes: Number(r.size_bytes),
        rows: rowCountMap[r.table_name] ?? null,
      })),
      capacity,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to load DB stats' });
  }
}
