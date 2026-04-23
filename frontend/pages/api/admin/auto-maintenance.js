import { ensureSchema, query, getDatabaseCapacityStatus } from '../../../utils/db';

function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.authorization || '';
  const expected = `Bearer ${secret}`;
  return authHeader === expected;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await ensureSchema();

    const retentionDaysRaw = Number.parseInt(process.env.SYNC_RETENTION_DAYS || '30', 10);
    const retentionDays = Number.isFinite(retentionDaysRaw) && retentionDaysRaw > 0 ? retentionDaysRaw : 30;
    const cutoffMs = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const snapshotsResult = await query(
      `DELETE FROM menu_snapshots WHERE menu_date < CURRENT_DATE - INTERVAL '7 days'`
    );

    const syncResult = await query(
      `DELETE FROM sync_data WHERE updated_at < $1`,
      [cutoffMs]
    );

    const dbGuard = await getDatabaseCapacityStatus();

    return res.status(200).json({
      ok: true,
      snapshots_deleted: snapshotsResult.rowCount || 0,
      stale_sync_rows_deleted: syncResult.rowCount || 0,
      sync_retention_days: retentionDays,
      db_guard: dbGuard,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Maintenance failed' });
  }
}
