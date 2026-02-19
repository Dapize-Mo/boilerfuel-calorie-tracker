import { query } from '../../utils/db';

// Ensure sync table exists
let syncSchemaReady = false;
async function ensureSyncSchema() {
  if (syncSchemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS sync_data (
      token VARCHAR(12) PRIMARY KEY,
      encrypted_data TEXT NOT NULL,
      updated_at BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  syncSchemaReady = true;
}

export default async function handler(req, res) {
  try {
    await ensureSyncSchema();

    // POST /api/sync — create new sync token or push data
    if (req.method === 'POST') {
      const { action, token, encrypted_data, updated_at } = req.body;

      if (action === 'create') {
        // Generate a unique 6-char sync code
        const code = generateCode();
        await query(
          `INSERT INTO sync_data (token, encrypted_data, updated_at) VALUES ($1, $2, $3)`,
          [code, encrypted_data || '', updated_at || Date.now()]
        );
        return res.json({ ok: true, token: code });
      }

      if (action === 'push') {
        if (!token || !encrypted_data) {
          return res.status(400).json({ error: 'Missing token or data' });
        }
        // Update the encrypted blob
        const result = await query(
          `UPDATE sync_data SET encrypted_data = $1, updated_at = $2 WHERE token = $3`,
          [encrypted_data, updated_at || Date.now(), token]
        );
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Sync token not found' });
        }
        return res.json({ ok: true });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // GET /api/sync?token=XXX&since=timestamp — pull data
    if (req.method === 'GET') {
      const { token, since } = req.query;
      if (!token) return res.status(400).json({ error: 'Missing token' });

      const { rows } = await query(
        `SELECT encrypted_data, updated_at FROM sync_data WHERE token = $1`,
        [token]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Sync token not found' });
      }

      const row = rows[0];
      // If client already has latest, return 304-like response
      if (since && parseInt(since) >= parseInt(row.updated_at)) {
        return res.json({ ok: true, changed: false });
      }

      return res.json({
        ok: true,
        changed: true,
        encrypted_data: row.encrypted_data,
        updated_at: row.updated_at,
      });
    }

    // DELETE /api/sync — unpair
    if (req.method === 'DELETE') {
      const { token } = req.body;
      if (token) {
        await query(`DELETE FROM sync_data WHERE token = $1`, [token]);
      }
      return res.json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).end();
  } catch (err) {
    console.error('[sync] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  const arr = new Uint8Array(6);
  require('crypto').randomFillSync(arr);
  for (let i = 0; i < 6; i++) code += chars[arr[i] % chars.length];
  return code;
}

// Increase body size limit for sync data
export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};
