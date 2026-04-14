import { query } from '../../utils/db';

const MAX_SYNC_PAYLOAD_BYTES = 4 * 1024 * 1024;
const TOKEN_LENGTH = 6;

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
        if (encrypted_data != null && typeof encrypted_data !== 'string') {
          return res.status(400).json({ error: 'encrypted_data must be a string' });
        }
        const payload = encrypted_data || '';
        if (Buffer.byteLength(payload, 'utf8') > MAX_SYNC_PAYLOAD_BYTES) {
          return res.status(413).json({ error: 'Sync payload too large' });
        }
        // Always use server time for sync row creation so all clients share
        // one authoritative timeline. Client clocks can be skewed.
        const initialTs = Date.now();

        // Generate a unique sync code with collision retry.
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = generateCode();
          const result = await query(
            `INSERT INTO sync_data (token, encrypted_data, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (token) DO NOTHING
             RETURNING token`,
            [code, payload, initialTs]
          );
          if (result.rows?.length) {
            return res.json({ ok: true, token: code, updated_at: initialTs });
          }
        }
        return res.status(503).json({ error: 'Could not allocate sync token. Please retry.' });
      }

      if (action === 'push') {
        const normalizedToken = normalizeToken(token);
        if (!normalizedToken || typeof encrypted_data !== 'string' || encrypted_data.length === 0) {
          return res.status(400).json({ error: 'Missing token or data' });
        }
        if (Buffer.byteLength(encrypted_data, 'utf8') > MAX_SYNC_PAYLOAD_BYTES) {
          return res.status(413).json({ error: 'Sync payload too large' });
        }
        // Use the server's clock so all devices share the same timestamp
        // reference — prevents clock skew between phone/PC causing one device
        // to permanently miss the other's pushes.
        const serverTs = Date.now();
        await query(
          `INSERT INTO sync_data (token, encrypted_data, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (token)
           DO UPDATE SET encrypted_data = EXCLUDED.encrypted_data, updated_at = EXCLUDED.updated_at`,
          [normalizedToken, encrypted_data, serverTs]
        );
        // Return the authoritative server timestamp so clients use it for
        // SYNC_LAST_PULL_KEY instead of their own Date.now().
        return res.json({ ok: true, updated_at: serverTs });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // GET /api/sync?token=XXX&since=timestamp — pull data
    if (req.method === 'GET') {
      const { token, since } = req.query;
      const normalizedToken = normalizeToken(token);
      if (!normalizedToken) return res.status(400).json({ error: 'Missing token' });

      const { rows } = await query(
        `SELECT encrypted_data, updated_at FROM sync_data WHERE token = $1`,
        [normalizedToken]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Sync token not found' });
      }

      const row = rows[0];
      // If client already has latest, return 304-like response
      const sinceNum = Number.parseInt(Array.isArray(since) ? since[0] : since, 10);
      const serverTs = Number.parseInt(String(row.updated_at), 10);
      if (Number.isFinite(sinceNum) && Number.isFinite(serverTs) && sinceNum >= serverTs) {
        return res.json({ ok: true, changed: false, updated_at: serverTs });
      }

      return res.json({
        ok: true,
        changed: true,
        encrypted_data: row.encrypted_data,
        updated_at: serverTs,
      });
    }

    // DELETE /api/sync — unpair
    if (req.method === 'DELETE') {
      const { token } = req.body;
      const normalizedToken = normalizeToken(token);
      if (normalizedToken) {
        await query(`DELETE FROM sync_data WHERE token = $1`, [normalizedToken]);
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
  const arr = new Uint8Array(TOKEN_LENGTH);
  require('crypto').randomFillSync(arr);
  for (let i = 0; i < TOKEN_LENGTH; i++) code += chars[arr[i] % chars.length];
  return code;
}

function normalizeToken(token) {
  if (!token) return '';
  const normalized = String(Array.isArray(token) ? token[0] : token).trim().toUpperCase();
  if (!/^[A-Z2-9]{4,16}$/.test(normalized)) return '';
  return normalized;
}

// Increase body size limit for sync data
export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};
