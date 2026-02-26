// Client-side sync utilities: encryption + push/pull logic
// Uses Web Crypto API — all encryption happens in the browser

const SYNC_TOKEN_KEY = 'boilerfuel_sync_token';
const SYNC_SECRET_KEY = 'boilerfuel_sync_secret';
const SYNC_LAST_PULL_KEY = 'boilerfuel_sync_last_pull';

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

export async function pushData() {
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) return;

  const data = gatherLocalData();
  const encrypted = await encrypt(data, secret);

  await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'push',
      token,
      encrypted_data: encrypted,
      updated_at: Date.now(),
    }),
  });
}

// ── Pull remote data from server ──

export async function pullData() {
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) return false;

  const since = localStorage.getItem(SYNC_LAST_PULL_KEY) || '0';
  const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}&since=${since}`);
  if (!res.ok) return false;

  const body = await res.json();
  if (!body.changed) return false;

  const data = await decrypt(body.encrypted_data, secret);
  mergeRemoteData(data);
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
  return true; // data was updated
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
  return data;
}

function mergeRemoteData(remote) {
  if (!remote) return;
  for (const key of SYNC_KEYS) {
    if (!(key in remote)) continue;
    const remoteVal = remote[key];
    const localRaw = localStorage.getItem(key);

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
      localStorage.setItem(key, JSON.stringify(merged));
    } else if (key === 'boilerfuel_water' || key === 'boilerfuel_weight') {
      // Merge by date key — take the higher value (latest entry)
      const local = localRaw ? JSON.parse(localRaw) : {};
      const merged = { ...local };
      for (const [date, val] of Object.entries(remoteVal || {})) {
        if (merged[date] === undefined || merged[date] === null) {
          merged[date] = val;
        }
        // If both have a value for the same date, keep whichever is newer
        // Since we can't tell which is newer per-key, keep the remote if syncing
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
}
