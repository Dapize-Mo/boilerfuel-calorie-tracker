import { query } from '../../utils/db';
import { csrfCheck } from '../../utils/csrf';

const MAX_SYNC_PAYLOAD_BYTES = 4 * 1024 * 1024;
const TOKEN_LENGTH = 6;
const useInMemoryFallback = true;
const DEFAULT_SYNC_RETENTION_DAYS = 30;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

function getGlobalMemoryStore() {
  const g = globalThis;
  if (!g.__boilerfuelSyncMemoryStore) {
    g.__boilerfuelSyncMemoryStore = new Map();
  }
  return g.__boilerfuelSyncMemoryStore;
}

let memoryMode = false;
const memorySyncData = getGlobalMemoryStore();
let lastPruneAt = 0;

function getSyncRetentionDays() {
  const raw = Number.parseInt(process.env.SYNC_RETENTION_DAYS || '', 10);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_SYNC_RETENTION_DAYS;
}

async function maybePruneSyncData() {
  const now = Date.now();
  if ((now - lastPruneAt) < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;

  const retentionMs = getSyncRetentionDays() * 24 * 60 * 60 * 1000;
  const cutoff = now - retentionMs;

  if (memoryMode) {
    for (const [token, row] of memorySyncData.entries()) {
      const ts = Number.parseInt(String(row?.updated_at || 0), 10) || 0;
      if (ts > 0 && ts < cutoff) memorySyncData.delete(token);
    }
    return;
  }

  await query(`DELETE FROM sync_data WHERE updated_at < $1`, [cutoff]);
}

function setMemoryRow(token, encryptedData) {
  const now = Date.now();
  const existing = memorySyncData.get(token);
  const revision = existing ? existing.revision + 1 : 1;
  memorySyncData.set(token, {
    token,
    encrypted_data: encryptedData,
    revision,
    updated_at: now,
  });
  return memorySyncData.get(token);
}

// Ensure sync table exists
let syncSchemaReady = false;
async function ensureSyncSchema() {
  if (syncSchemaReady) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS sync_data (
        token VARCHAR(12) PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        revision BIGINT NOT NULL DEFAULT 1,
        updated_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await query(`
      ALTER TABLE sync_data
        ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_sync_data_updated_at ON sync_data(updated_at);`);
  } catch (err) {
    if (true) {
      memoryMode = true;
      syncSchemaReady = true;
      console.warn('[sync] Falling back to in-memory store for local/dev mode:', err.message);
      return;
    }
    throw err;
  }
  syncSchemaReady = true;
}

export default async function handler(req, res) {
  if (!csrfCheck(req, res)) return;
  try {
    await ensureSyncSchema();
    await maybePruneSyncData();

    // POST /api/sync — create new sync token or push data
    if (req.method === 'POST') {
      const { action, token, encrypted_data, updated_at, expected_revision } = req.body;

      if (action === 'create') {
        if (encrypted_data != null && typeof encrypted_data !== 'string') {
          return res.status(400).json({ error: 'encrypted_data must be a string' });
        }
        const payload = encrypted_data || '';
        if (Buffer.byteLength(payload, 'utf8') > MAX_SYNC_PAYLOAD_BYTES) {
          return res.status(413).json({ error: 'Sync payload too large' });
        }
        const initialTs = Date.now();
        const initialRevision = 1;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = generateCode();
          if (memoryMode) {
            if (memorySyncData.has(code)) continue;
            memorySyncData.set(code, {
              token: code,
              encrypted_data: payload,
              revision: initialRevision,
              updated_at: initialTs,
            });
            return res.json({ ok: true, token: code, revision: initialRevision, updated_at: initialTs });
          }

          const result = await query(
            `INSERT INTO sync_data (token, encrypted_data, revision, updated_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (token) DO NOTHING
             RETURNING token, revision, updated_at`,
            [code, payload, initialRevision, initialTs]
          );
          if (result.rows?.length) {
            const row = result.rows[0];
            return res.json({
              ok: true,
              token: code,
              revision: Number.parseInt(String(row.revision), 10) || initialRevision,
              updated_at: Number.parseInt(String(row.updated_at), 10) || initialTs,
            });
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

        const expectedRev = Number.isFinite(Number(expected_revision)) ? Math.floor(Number(expected_revision)) : null;
        const serverTs = Date.now();

        // ── OCC path: client sends expected_revision to guard against overwrites ──
        if (expectedRev !== null) {
          if (memoryMode) {
            const existing = memorySyncData.get(normalizedToken);
            if (existing && existing.revision !== expectedRev) {
              return res.status(409).json({
                error: 'Revision conflict',
                encrypted_data: existing.encrypted_data,
                revision: existing.revision,
                updated_at: existing.updated_at,
              });
            }
            const row = setMemoryRow(normalizedToken, encrypted_data);
            return res.json({
              ok: true,
              revision: row.revision,
              updated_at: row.updated_at,
            });
          }

          // Try conditional update: only succeed if revision matches
          const { rows } = await query(
            `UPDATE sync_data
             SET encrypted_data = $2, revision = revision + 1, updated_at = $3
             WHERE token = $1 AND revision = $4
             RETURNING revision, updated_at`,
            [normalizedToken, encrypted_data, serverTs, expectedRev]
          );
          if (rows.length > 0) {
            const row = rows[0];
            return res.json({
              ok: true,
              revision: Number.parseInt(String(row.revision), 10),
              updated_at: Number.parseInt(String(row.updated_at), 10),
            });
          }
          // Revision mismatch — return 409 with current server data for client merge
          const { rows: currentRows } = await query(
            `SELECT encrypted_data, revision, updated_at FROM sync_data WHERE token = $1`,
            [normalizedToken]
          );
          if (currentRows.length > 0) {
            const current = currentRows[0];
            return res.status(409).json({
              error: 'Revision conflict',
              encrypted_data: current.encrypted_data,
              revision: Number.parseInt(String(current.revision), 10),
              updated_at: Number.parseInt(String(current.updated_at), 10),
            });
          }
          // Token doesn't exist yet — fall through to unconditional insert below
        }

        // ── Legacy path: no expected_revision (backward compat) ──
        let row = {};
        if (memoryMode) {
          row = setMemoryRow(normalizedToken, encrypted_data);
        } else {
          const { rows } = await query(
            `INSERT INTO sync_data (token, encrypted_data, revision, updated_at)
             VALUES ($1, $2, 1, $3)
             ON CONFLICT (token)
             DO UPDATE SET encrypted_data = EXCLUDED.encrypted_data,
                           revision = COALESCE(sync_data.revision, 0) + 1,
                           updated_at = EXCLUDED.updated_at
             RETURNING revision, updated_at`,
            [normalizedToken, encrypted_data, serverTs]
          );
          row = rows[0] || {};
        }
        return res.json({
          ok: true,
          revision: Number.parseInt(String(row.revision), 10) || 0,
          updated_at: Number.parseInt(String(row.updated_at), 10) || Date.now(),
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // GET /api/sync?token=XXX&since=timestamp — pull data
    if (req.method === 'GET') {
      const { token, since, since_revision, revision } = req.query;
      const normalizedToken = normalizeToken(token);
      if (!normalizedToken) return res.status(400).json({ error: 'Missing token' });

      let row;
      if (memoryMode) {
        row = memorySyncData.get(normalizedToken);
      } else {
        const { rows } = await query(
          `SELECT encrypted_data, updated_at, revision FROM sync_data WHERE token = $1`,
          [normalizedToken]
        );
        row = rows[0];
      }

      if (!row) {
        return res.status(404).json({ error: 'Sync token not found' });
      }

      const serverTs = Number.parseInt(String(row.updated_at), 10);
      const serverRevision = Number.parseInt(String(row.revision), 10) || 1;

      const sinceRevisionRaw = Array.isArray(since_revision) ? since_revision[0] : since_revision;
      const revisionRaw = Array.isArray(revision) ? revision[0] : revision;
      const cursorRevision = Number.parseInt(String(sinceRevisionRaw ?? revisionRaw), 10);
      const sinceNum = Number.parseInt(String(Array.isArray(since) ? since[0] : since), 10);

      // Preferred path: compare server-owned revision numbers.
      if (Number.isFinite(cursorRevision) && cursorRevision >= serverRevision) {
        return res.json({ ok: true, changed: false, revision: serverRevision, updated_at: serverTs });
      }

      // Backward-compatible fallback for older clients that still send timestamps.
      if (Number.isFinite(sinceNum) && Number.isFinite(serverTs) && sinceNum >= serverTs) {
        return res.json({ ok: true, changed: false, revision: serverRevision, updated_at: serverTs });
      }

      return res.json({
        ok: true,
        changed: true,
        encrypted_data: row.encrypted_data,
        revision: serverRevision,
        updated_at: serverTs,
      });
    }

    // DELETE /api/sync — unpair
    if (req.method === 'DELETE') {
      const { token } = req.body;
      const normalizedToken = normalizeToken(token);
      if (normalizedToken) {
        if (memoryMode) {
          memorySyncData.delete(normalizedToken);
        } else {
          await query(`DELETE FROM sync_data WHERE token = $1`, [normalizedToken]);
        }
      }
      return res.json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).end();
  } catch (err) {
    console.error('[sync] Error:', err.message, err.stack);
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
