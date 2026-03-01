// Client-side sync utilities: encryption + push/pull logic
// Uses Web Crypto API — all encryption happens in the browser

const SYNC_TOKEN_KEY = 'boilerfuel_sync_token';
const SYNC_SECRET_KEY = 'boilerfuel_sync_secret';
const SYNC_LAST_PULL_KEY = 'boilerfuel_sync_last_pull';
const SYNC_LOG_KEY = 'boilerfuel_sync_log';
const MAX_LOG_ENTRIES = 30;

// ── Sync activity log ──

/**
 * Append an entry to the in-browser sync log (stored in localStorage).
 * entry: { direction: 'push'|'pull', status: 'ok'|'error', keys: string[], detail: string }
 */
function addSyncLogEntry(entry) {
  try {
    const raw = localStorage.getItem(SYNC_LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ ts: Date.now(), ...entry });
    if (log.length > MAX_LOG_ENTRIES) log.splice(MAX_LOG_ENTRIES);
    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(log));
  } catch {}
}

export function getSyncLog() {
  try {
    const raw = localStorage.getItem(SYNC_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearSyncLog() {
  try { localStorage.removeItem(SYNC_LOG_KEY); } catch {}
}

// All localStorage keys that should be synced
const SYNC_KEYS = [
  'boilerfuel_meals',
  'boilerfuel_goals',
  'boilerfuel_favorites',
  'boilerfuel_water',
  'boilerfuel_weight',
  'boilerfuel_templates',
  'boilerfuel_dietary',
];

// ── Crypto helpers (AES-GCM with PBKDF2 key derivation) ──

async function deriveKey(secret) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('boilerfuel-sync'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, secret) {
  const key = await deriveKey(secret);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  // Combine IV + ciphertext into a single base64 string
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(base64, secret) {
  const key = await deriveKey(secret);
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ── Token management ──

export function getSyncToken() {
  return localStorage.getItem(SYNC_TOKEN_KEY);
}

export function getSyncSecret() {
  return localStorage.getItem(SYNC_SECRET_KEY);
}

export function saveSyncCredentials(token, secret) {
  localStorage.setItem(SYNC_TOKEN_KEY, token);
  localStorage.setItem(SYNC_SECRET_KEY, secret);
}

export function clearSyncCredentials() {
  localStorage.removeItem(SYNC_TOKEN_KEY);
  localStorage.removeItem(SYNC_SECRET_KEY);
  localStorage.removeItem(SYNC_LAST_PULL_KEY);
}

export function isSynced() {
  return !!(getSyncToken() && getSyncSecret());
}

// ── Generate a random secret (used as encryption passphrase) ──

export function generateSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

// ── Create a new sync pair (Device A) ──

export async function createSyncPair() {
  const secret = generateSecret();
  const data = gatherLocalData();
  const encrypted = await encrypt(data, secret);

  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      encrypted_data: encrypted,
      updated_at: Date.now(),
    }),
  });

  if (!res.ok) throw new Error('Failed to create sync pair');
  const { token } = await res.json();
  saveSyncCredentials(token, secret);
  return { token, secret };
}

// ── Join an existing sync pair (Device B) ──

export async function joinSyncPair(token, secret) {
  // Verify the token exists and we can decrypt
  const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error('Sync code not found');
  const body = await res.json();

  if (body.changed && body.encrypted_data) {
    // Decrypt to verify the secret works
    const data = await decrypt(body.encrypted_data, secret);
    // Merge remote data into local
    mergeRemoteData(data);
  }

  saveSyncCredentials(token, secret);
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));

  // Push our local data back (merged)
  await pushData();
  return true;
}

// ── Push local data to server ──
// Always pulls and merges server data FIRST before pushing, so we never
// clobber changes made on another device between our last pull and this push.

export async function pushData() {
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) return;

  // Step 1: Pull any server-side changes and merge into local storage.
  const since = localStorage.getItem(SYNC_LAST_PULL_KEY) || '0';
  let pulledKeys = [];
  try {
    const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}&since=${since}`);
    if (res.ok) {
      const body = await res.json();
      if (body.changed && body.encrypted_data) {
        const serverData = await decrypt(body.encrypted_data, secret);
        pulledKeys = Object.keys(serverData).filter(k => SYNC_KEYS.includes(k));
        mergeRemoteData(serverData);
        localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
      }
    }
  } catch {
    // Non-fatal: if we can't reach the server, push local data as-is.
    // This is safer than not pushing at all.
  }

  // Step 2: Gather the now-merged local data and push to server.
  const data = gatherLocalData();
  const pushedKeys = Object.keys(data).filter(k => SYNC_KEYS.includes(k));
  const encrypted = await encrypt(data, secret);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'push',
        token,
        encrypted_data: encrypted,
        updated_at: Date.now(),
      }),
    });
    addSyncLogEntry({
      direction: 'push',
      status: res.ok ? 'ok' : 'error',
      keys: pushedKeys,
      detail: pulledKeys.length > 0
        ? `Merged remote changes for: ${pulledKeys.map(k => k.replace('boilerfuel_', '')).join(', ')}`
        : 'No remote changes to merge',
    });
  } catch (err) {
    addSyncLogEntry({ direction: 'push', status: 'error', keys: pushedKeys, detail: String(err) });
    throw err;
  }
}

// ── Pull remote data from server ──

export async function pullData() {
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) return false;

  const since = localStorage.getItem(SYNC_LAST_PULL_KEY) || '0';
  let res;
  try {
    res = await fetch(`/api/sync?token=${encodeURIComponent(token)}&since=${since}`);
  } catch (err) {
    addSyncLogEntry({ direction: 'pull', status: 'error', keys: [], detail: String(err) });
    throw err;
  }
  if (!res.ok) {
    addSyncLogEntry({ direction: 'pull', status: 'error', keys: [], detail: `HTTP ${res.status}` });
    return false;
  }

  const body = await res.json();
  if (!body.changed) {
    addSyncLogEntry({ direction: 'pull', status: 'ok', keys: [], detail: 'Up to date — no new changes' });
    return false;
  }

  const data = await decrypt(body.encrypted_data, secret);
  const pulledKeys = Object.keys(data).filter(k => SYNC_KEYS.includes(k));
  mergeRemoteData(data);
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
  addSyncLogEntry({
    direction: 'pull',
    status: 'ok',
    keys: pulledKeys,
    detail: `Received: ${pulledKeys.map(k => k.replace('boilerfuel_', '')).join(', ')}`,
  });
  return true; // data was updated
}

// ── Meal backup / recovery ──

/** Returns the backup meals object saved before the last merge, or null. */
export function getMealsBackup() {
  const raw = localStorage.getItem('boilerfuel_meals_backup');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Restore meals from the pre-merge backup, merging into current data.
 * Safe to call even if no backup exists (no-op).
 */
export function restoreMealsFromBackup() {
  const backup = getMealsBackup();
  if (!backup) return false;
  const currentRaw = localStorage.getItem('boilerfuel_meals');
  const current = currentRaw ? JSON.parse(currentRaw) : {};
  const restored = { ...backup };
  // Also keep any NEW meals logged since the backup
  for (const [date, meals] of Object.entries(current)) {
    if (!restored[date]) {
      restored[date] = meals;
    } else {
      const ts = new Set(restored[date].map(m => m.addedAt));
      for (const m of meals) {
        if (!ts.has(m.addedAt)) restored[date].push(m);
      }
    }
  }
  localStorage.setItem('boilerfuel_meals', JSON.stringify(restored));
  localStorage.removeItem('boilerfuel_meals_backup');
  return true;
}

// ── Unpair ──

export async function unpair() {
  const token = getSyncToken();
  if (token) {
    await fetch('/api/sync', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }
  clearSyncCredentials();
}

// ── Device identity ──

function getOrCreateDeviceId() {
  let id = localStorage.getItem('boilerfuel_device_id');
  if (!id) {
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    id = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('boilerfuel_device_id', id);
  }
  return id;
}

function getDeviceName() {
  const ua = navigator.userAgent;
  let os = 'Desktop';
  if (/iPhone|iPod/.test(ua)) os = 'iPhone';
  else if (/iPad/.test(ua)) os = 'iPad';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Mac/.test(ua)) os = 'Mac';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';
  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/CriOS/.test(ua) || (/Chrome/.test(ua) && !/Chromium/.test(ua))) browser = 'Chrome';
  else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Safari/.test(ua)) browser = 'Safari';
  return `${browser} on ${os}`;
}

export function getSyncDevices() {
  const raw = localStorage.getItem('boilerfuel_sync_devices');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── Helpers ──

function gatherLocalData() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch { data[key] = val; }
    }
  }
  data._timestamp = Date.now();

  // Register this device's last-seen timestamp
  const deviceId = getOrCreateDeviceId();
  const existing = localStorage.getItem('boilerfuel_sync_devices');
  const devices = existing ? JSON.parse(existing) : {};
  devices[deviceId] = { name: getDeviceName(), lastSeen: Date.now() };
  localStorage.setItem('boilerfuel_sync_devices', JSON.stringify(devices));
  data._devices = devices;

  return data;
}

function mergeRemoteData(remote) {
  if (!remote) return;

  // ── Safety: snapshot meals before any merge so we can recover if data shrinks ──
  const mealsBefore = localStorage.getItem('boilerfuel_meals');

  for (const key of SYNC_KEYS) {
    if (!(key in remote)) continue;
    const remoteVal = remote[key];
    // Always read from localStorage at merge time AND also fall back to the
    // pre-merge snapshot for meals (guards against a race where the
    // persistence effect hasn't flushed state→localStorage yet).
    const localRaw = key === 'boilerfuel_meals'
      ? (localStorage.getItem(key) || mealsBefore)
      : localStorage.getItem(key);

    if (key === 'boilerfuel_meals') {
      // Merge meals by date key — union of meals from both sides
      const local = localRaw ? JSON.parse(localRaw) : {};
      const merged = { ...local };
      for (const [date, remoteMeals] of Object.entries(remoteVal || {})) {
        if (!merged[date]) {
          merged[date] = remoteMeals;
        } else {
          // Merge: add remote meals not already present (by addedAt timestamp)
          const localTimestamps = new Set(merged[date].map(m => m.addedAt));
          for (const rm of remoteMeals) {
            if (!localTimestamps.has(rm.addedAt)) {
              merged[date].push(rm);
            }
          }
        }
      }

      // Post-merge loss guard: if we somehow ended up with fewer date-keys than
      // before (should never happen, but defensive), merge the backup back in.
      if (mealsBefore) {
        const before = JSON.parse(mealsBefore);
        for (const [date, meals] of Object.entries(before)) {
          if (!merged[date] || merged[date].length === 0) {
            merged[date] = meals;
          } else {
            const ts = new Set(merged[date].map(m => m.addedAt));
            for (const m of meals) {
              if (!ts.has(m.addedAt)) merged[date].push(m);
            }
          }
        }
      }

      // Save a rolling backup BEFORE overwriting, so the UI can offer restore
      if (mealsBefore) {
        localStorage.setItem('boilerfuel_meals_backup', mealsBefore);
      }
      localStorage.setItem(key, JSON.stringify(merged));
    } else if (key === 'boilerfuel_water') {
      // Water: take the max per date — can't "undrink" water, remote data should
      // never reset a higher local value to 0, and vice versa.
      const local = localRaw ? JSON.parse(localRaw) : {};
      const merged = { ...local };
      for (const [date, val] of Object.entries(remoteVal || {})) {
        const localVal = merged[date];
        if (localVal === undefined || localVal === null) {
          merged[date] = val;
        } else {
          merged[date] = Math.max(Number(localVal) || 0, Number(val) || 0);
        }
      }
      localStorage.setItem(key, JSON.stringify(merged));
    } else if (key === 'boilerfuel_weight') {
      // Weight: take remote if local has no entry for that date.
      // If both have an entry, keep local (user intentionally set it on this device).
      // Never overwrite a real value with 0 from remote.
      const local = localRaw ? JSON.parse(localRaw) : {};
      const merged = { ...local };
      for (const [date, val] of Object.entries(remoteVal || {})) {
        const localVal = merged[date];
        if (localVal === undefined || localVal === null) {
          merged[date] = val;
        } else if ((Number(localVal) || 0) === 0 && (Number(val) || 0) > 0) {
          // Local has a 0/empty placeholder — prefer the real remote value
          merged[date] = val;
        }
        // Otherwise keep local (last logged on this device)
      }
      localStorage.setItem(key, JSON.stringify(merged));
    } else if (key === 'boilerfuel_favorites') {
      // Union of favorites
      const local = localRaw ? JSON.parse(localRaw) : [];
      const merged = [...new Set([...local, ...(remoteVal || [])])];
      localStorage.setItem(key, JSON.stringify(merged));
    } else {
      // For goals, templates, dietary — remote wins (last push wins)
      localStorage.setItem(key, JSON.stringify(remoteVal));
    }
  }

  // Merge device registry: union by device_id, keep newest lastSeen per device
  if (remote._devices && typeof remote._devices === 'object') {
    const existing = localStorage.getItem('boilerfuel_sync_devices');
    const localDevices = existing ? JSON.parse(existing) : {};
    const merged = { ...localDevices };
    for (const [id, dev] of Object.entries(remote._devices)) {
      if (!merged[id] || (dev.lastSeen || 0) > (merged[id].lastSeen || 0)) {
        merged[id] = dev;
      }
    }
    localStorage.setItem('boilerfuel_sync_devices', JSON.stringify(merged));
  }
}
