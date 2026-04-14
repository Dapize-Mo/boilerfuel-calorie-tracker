// Client-side sync utilities: encryption + push/pull logic
// Uses Web Crypto API — all encryption happens in the browser

/**
 * Free up localStorage space by removing stale per-day notification keys
 * and pruning meal history older than 6 months.
 * Safe to call on every app startup.
 */
export function pruneLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    // Remove old per-day notification sentinel keys (boilerfuel_notif_*_YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    const notifKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('boilerfuel_notif_') && !k.endsWith('_hour') && !k.endsWith('_on') && k !== 'boilerfuel_notif_meal') {
        if (!k.endsWith(`_${today}`)) notifKeysToRemove.push(k);
      }
    }
    notifKeysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}

  try {
    // Prune meals older than 6 months — removeItem first to free space, then rewrite
    const raw = localStorage.getItem('boilerfuel_meals');
    if (!raw) return;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const meals = JSON.parse(raw);
    const pruned = Object.fromEntries(Object.entries(meals).filter(([d]) => d >= cutoffStr));
    if (Object.keys(pruned).length < Object.keys(meals).length) {
      localStorage.removeItem('boilerfuel_meals'); // free space first
      try { localStorage.setItem('boilerfuel_meals', JSON.stringify(pruned)); } catch {}
    }
    // Also clear the sync log to free more space
    localStorage.removeItem(SYNC_LOG_KEY);
    // Clear sync devices registry (non-critical, will rebuild on next sync)
    localStorage.removeItem('boilerfuel_sync_devices');
  } catch {}
}

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

export async function deriveKey(secret) {
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

export async function encrypt(data, secret) {
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

export async function decrypt(base64, secret) {
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
  localStorage.setItem(SYNC_TOKEN_KEY, normalizeToken(token));
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
  const createdAt = Date.now();

  const res = await robustFetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      encrypted_data: encrypted,
      updated_at: createdAt,
    }),
  });

  if (!res.ok) throw new Error('Failed to create sync pair');
  const { token, updated_at: serverTs } = await res.json();
  saveSyncCredentials(token, secret);
  // Mark this timestamp so the first auto-push doesn't pull our own blob back
  // Use the server's authoritative timestamp to prevent clock skew issues
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(serverTs || createdAt));
  return { token, secret };
}

// ── Join an existing sync pair (Device B) ──

export async function joinSyncPair(token, secret) {
  const normalizedToken = normalizeToken(token);
  // Verify the token exists and we can decrypt
  const res = await robustFetch(`/api/sync?token=${encodeURIComponent(normalizedToken)}`);
  if (!res.ok) throw new Error('Sync code not found');
  const body = await res.json();

  if (body.changed && body.encrypted_data) {
    // Decrypt to verify the secret works
    const data = await decrypt(body.encrypted_data, secret);
    // Merge remote data into local
    mergeRemoteData(data);
  }

  saveSyncCredentials(normalizedToken, secret);
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));

  // Push our local data back (merged)
  await pushData();
  return true;
}

// ── Push local data to server ──
// Always pulls and merges server data FIRST before pushing, so we never
// clobber changes made on another device between our last pull and this push.

export async function pushData(options = {}) {
  const { strict = false, includeReport = false } = options;
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) {
    if (strict) throw new Error('Device is not paired for sync.');
    return includeReport ? { pushed: false, pulled: false, skipped: true, transferred: [] } : undefined;
  }

  let pulled = false;
  let pulledTransfer = [];
  let pullUpdatedAt = null;
  let tokenRecovered = false;

  // Step 1: Pull any server-side changes and merge into local storage.
  const since = localStorage.getItem(SYNC_LAST_PULL_KEY) || '0';
  const sinceNum = parseInt(since, 10) || 0;
  let pulledKeys = [];
  try {
    const res = await robustFetch(`/api/sync?token=${encodeURIComponent(token)}&since=${since}`);
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to fetch remote sync data');
      throw new Error(msg);
    }
    if (res.ok) {
      const body = await res.json();
      if (body.changed && body.encrypted_data) {
        const serverData = await decrypt(body.encrypted_data, secret);
        console.log('[sync/pushData] Server had changes - decrypted keys:', Object.keys(serverData).filter(k => !k.startsWith('_')));
        if (serverData.boilerfuel_meals) {
          const remoteDays = Object.keys(serverData.boilerfuel_meals).length;
          const remoteMeals = Object.values(serverData.boilerfuel_meals).reduce((sum, meals) => sum + (Array.isArray(meals) ? meals.length : 0), 0);
          console.log('[sync/pushData] Remote meals:', { days: remoteDays, totalMeals: remoteMeals });
        }
        pulledTransfer = summarizeTransferredData(serverData);
        pulledKeys = Object.keys(serverData).filter(k => SYNC_KEYS.includes(k));
        mergeRemoteData(serverData);
        localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
        pulled = true;
        pullUpdatedAt = body.updated_at || Date.now();
      } else {
        // Recovery path: local "since" can be ahead of server (legacy clock skew
        // or stale local state), which causes endless "no changes" responses.
        // In that case force a full pull before we push, so we never clobber
        // newer server data with an incomplete local blob.
        const serverUpdatedAt = parseInt(body.updated_at, 10) || 0;
        if (sinceNum > serverUpdatedAt && serverUpdatedAt > 0) {
          const fullRes = await robustFetch(`/api/sync?token=${encodeURIComponent(token)}&since=0`);
          if (fullRes.ok) {
            const fullBody = await fullRes.json();
            if (fullBody.changed && fullBody.encrypted_data) {
              const serverData = await decrypt(fullBody.encrypted_data, secret);
              pulledTransfer = summarizeTransferredData(serverData);
              pulledKeys = Object.keys(serverData).filter(k => SYNC_KEYS.includes(k));
              mergeRemoteData(serverData);
              localStorage.setItem(SYNC_LAST_PULL_KEY, String(fullBody.updated_at || serverUpdatedAt));
              pulled = true;
              pullUpdatedAt = fullBody.updated_at || serverUpdatedAt;
            }
          }
        }
      }
    }
  } catch (err) {
    // If the server no longer has this token, continue to push so we can
    // recover the sync row from local encrypted data.
    if (isMissingTokenError(err)) tokenRecovered = true;
    if (strict && !isMissingTokenError(err)) throw err;
    // Non-fatal: if we can't reach the server, push local data as-is.
    // This is safer than not pushing at all.
  }

  // Step 2: Gather the now-merged local data and push to server.
  const data = gatherLocalData();
  const pushedKeys = Object.keys(data).filter(k => SYNC_KEYS.includes(k));

  // Safety guard: if local meals are empty AND the server had no new data to
  // offer (pulled=false), skip the push. Otherwise this device would silently
  // overwrite the server's meal history with nothing — the exact failure mode
  // where one device loses its data and then clobbers the other device's meals.
  // If pulled=true the server DID have new data; we merged it and should push
  // the merged result (even if meals are still empty, server had the same state).
  const localMealDays = (data.boilerfuel_meals && typeof data.boilerfuel_meals === 'object')
    ? Object.keys(data.boilerfuel_meals).length : 0;
  if (localMealDays === 0 && !pulled) {
    addSyncLogEntry({
      direction: 'push',
      status: 'ok',
      keys: [],
      detail: 'Skipped push: local meals empty and server is already up to date — waiting for data from paired device',
    });
    if (!includeReport) return;
    return { pushed: false, pulled, skipped: true, transferred: [], pulledTransferred: pulledTransfer };
  }

  const encrypted = await encrypt(data, secret);
  const pushTimestamp = Date.now();

  try {
    const pushRes = await robustFetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'push',
        token,
        encrypted_data: encrypted,
        updated_at: pushTimestamp,
      }),
    });
    
    if (!pushRes.ok) {
      const msg = await parseErrorMessage(pushRes, 'Failed to push local sync data');
      addSyncLogEntry({ direction: 'push', status: 'error', keys: pushedKeys, detail: msg });
      throw new Error(msg);
    }

    // Use the server's authoritative timestamp (not our local Date.now()) so
    // all devices share the same time reference.  Clock skew between phone and
    // PC would otherwise cause one device to permanently miss the other's pushes.
    const pushBody = await pushRes.json().catch(() => ({}));
    const confirmedTs = pushBody.updated_at || pushTimestamp;
    localStorage.setItem(SYNC_LAST_PULL_KEY, String(confirmedTs));
    
    addSyncLogEntry({
      direction: 'push',
      status: 'ok',
      keys: pushedKeys,
      detail: tokenRecovered
        ? 'Recovered sync token on server and pushed latest encrypted data'
        : (pulledKeys.length > 0
          ? `Merged remote changes for: ${pulledKeys.map(k => k.replace('boilerfuel_', '')).join(', ')}`
          : 'No remote changes to merge'),
    });
    
    if (!includeReport) return;
    
    return {
      pushed: true,
      pulled,
      tokenRecovered,
      pullUpdatedAt,
      transferred: summarizeTransferredData(data),
      pulledTransferred: pulledTransfer,
    };
  } catch (err) {
    if (!includeReport) throw err;
    addSyncLogEntry({ direction: 'push', status: 'error', keys: pushedKeys, detail: String(err) });
    throw err;
  }
}

// ── Pull remote data from server ──

export async function pullData(options = {}) {
  const { includeReport = false, strict = false, forceFull = false } = options;
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (!token || !secret) {
    if (strict) throw new Error('Device is not paired for sync.');
    return includeReport ? { changed: false, skipped: true, transferred: [] } : false;
  }

  const since = forceFull ? '0' : (localStorage.getItem(SYNC_LAST_PULL_KEY) || '0');
  const sinceNum = parseInt(since, 10) || 0;
  let res;
  try {
    res = await robustFetch(`/api/sync?token=${encodeURIComponent(token)}&since=${since}`);
  } catch (err) {
    addSyncLogEntry({ direction: 'pull', status: 'error', keys: [], detail: String(err) });
    if (strict) throw err;
    return includeReport ? { changed: false, error: String(err), transferred: [] } : false;
  }
  
  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Failed to pull sync data');
    // Don't log token-not-found as an error — the caller will recover via push
    if (!isMissingTokenError(new Error(msg))) {
      addSyncLogEntry({ direction: 'pull', status: 'error', keys: [], detail: msg });
    }
    if (strict) throw new Error(msg);
    return includeReport ? { changed: false, error: msg, transferred: [] } : false;
  }

  const body = await res.json();
  if (!body.changed) {
    const serverUpdatedAt = parseInt(body.updated_at, 10) || 0;
    if (sinceNum > serverUpdatedAt && serverUpdatedAt > 0) {
      // Stale local timestamp ahead of server; reset and do a full pull.
      try {
        const fullRes = await robustFetch(`/api/sync?token=${encodeURIComponent(token)}&since=0`);
        if (fullRes.ok) {
          const fullBody = await fullRes.json();
          if (fullBody.changed && fullBody.encrypted_data) {
            const data = await decrypt(fullBody.encrypted_data, secret);
            const pulledKeys = Object.keys(data).filter(k => SYNC_KEYS.includes(k));
            const transferred = summarizeTransferredData(data);
            mergeRemoteData(data);
            localStorage.setItem(SYNC_LAST_PULL_KEY, String(fullBody.updated_at || serverUpdatedAt));
            addSyncLogEntry({
              direction: 'pull',
              status: 'ok',
              keys: pulledKeys,
              detail: 'Recovered from stale pull timestamp and refreshed full sync state',
            });
            if (!includeReport) return true;
            return { changed: true, updatedAt: fullBody.updated_at || serverUpdatedAt, transferred };
          }
        }
      } catch {}
    }
    addSyncLogEntry({ direction: 'pull', status: 'ok', keys: [], detail: 'Up to date — no new changes' });
    return includeReport ? { changed: false, transferred: [] } : false;
  }

  const data = await decrypt(body.encrypted_data, secret);
  const pulledKeys = Object.keys(data).filter(k => SYNC_KEYS.includes(k));
  const transferred = summarizeTransferredData(data);
  mergeRemoteData(data);
  localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
  
  addSyncLogEntry({
    direction: 'pull',
    status: 'ok',
    keys: pulledKeys,
    detail: `Received: ${pulledKeys.map(k => k.replace('boilerfuel_', '')).join(', ')}`,
  });
  
  if (!includeReport) return true; // data was updated
  return { changed: true, updatedAt: body.updated_at || Date.now(), transferred };
}

/** Clears the last-pull timestamp then does a full push+pull.
 *  Use this to recover from a stuck state where SYNC_LAST_PULL_KEY
 *  is newer than the server's data, causing every pull to return "no changes". */
export async function forceFullSync() {
  if (typeof window === 'undefined') return syncNowDetailed();

  // Step 1: Raw download — fetch and decrypt the server blob, then write each
  // key directly to localStorage without going through mergeRemoteData.
  // This bypasses any silent write failures in the merge pipeline and guarantees
  // the remote data lands on disk before the push loop runs.
  const token = getSyncToken();
  const secret = getSyncSecret();
  if (token && secret) {
    try {
      const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}&since=0`);
      if (res.ok) {
        const body = await res.json();
        if (body.changed && body.encrypted_data) {
          const data = await decrypt(body.encrypted_data, secret);
          // Write each key directly — meals get a union-merge with anything local
          for (const key of SYNC_KEYS) {
            if (!(key in data)) continue;
            if (key === 'boilerfuel_meals') {
              // Merge with local so we don't lose meals logged on this device
              let local = {};
              try { local = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
              const remote = data[key] || {};
              const merged = { ...local };
              for (const [date, remoteMeals] of Object.entries(remote)) {
                if (!merged[date]) {
                  merged[date] = remoteMeals;
                } else {
                  const ts = new Set(merged[date].map(m => m.addedAt));
                  for (const m of remoteMeals) {
                    if (!ts.has(m.addedAt)) merged[date].push(m);
                  }
                }
              }
              try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
            } else {
              try { localStorage.setItem(key, JSON.stringify(data[key])); } catch {}
            }
          }
          localStorage.setItem(SYNC_LAST_PULL_KEY, String(body.updated_at || Date.now()));
        }
      }
    } catch {}
  }

  // Step 2: Normal sync — pushes the now-written local data to server.
  return syncNowDetailed();
}

export async function syncNowDetailed() {
  const pushReport = await pushData({ strict: true, includeReport: true });
  // Wait briefly so any other paired device that pushed concurrently has
  // time to land on the server before we pull — prevents a race where
  // both devices push at the same millisecond and one misses the other's data.
  await new Promise(r => setTimeout(r, 800));
  const pullReport = await pullData({ strict: true, includeReport: true });
  const devices = getSyncDevices();
  return {
    pushed: !!pushReport?.pushed,
    pulledOnPush: !!pushReport?.pulled,
    tokenRecovered: !!pushReport?.tokenRecovered,
    pulledAfterPush: !!pullReport?.changed,
    transferred: pushReport?.transferred || [],
    pulledTransferred: [
      ...(pushReport?.pulledTransferred || []),
      ...(pullReport?.transferred || []),
    ],
    deviceCount: Object.keys(devices).length,
    devices,
    syncedAt: Date.now(),
  };
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
  // Only clear local credentials — do NOT delete the server row.
  // Other paired devices still need the server row to sync.
  // The row will be cleaned up server-side if unused for an extended period.
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

function summarizeTransferredData(data) {
  const summary = [];
  if (!data || typeof data !== 'object') return summary;

  if (data.boilerfuel_meals && typeof data.boilerfuel_meals === 'object') {
    const days = Object.keys(data.boilerfuel_meals).length;
    const entries = Object.values(data.boilerfuel_meals).reduce((sum, dayMeals) => {
      if (!Array.isArray(dayMeals)) return sum;
      return sum + dayMeals.length;
    }, 0);
    summary.push({ key: 'meals', label: 'Meals', detail: `${entries} meal entries across ${days} days` });
  }

  if (data.boilerfuel_goals) {
    summary.push({ key: 'goals', label: 'Goals', detail: 'Nutrition goals + targets' });
  }

  if (Array.isArray(data.boilerfuel_favorites)) {
    summary.push({ key: 'favorites', label: 'Favorites', detail: `${data.boilerfuel_favorites.length} saved foods` });
  }

  if (data.boilerfuel_water && typeof data.boilerfuel_water === 'object') {
    summary.push({ key: 'water', label: 'Water log', detail: `${Object.keys(data.boilerfuel_water).length} day entries` });
  }

  if (data.boilerfuel_weight && typeof data.boilerfuel_weight === 'object') {
    summary.push({ key: 'weight', label: 'Weight log', detail: `${Object.keys(data.boilerfuel_weight).length} day entries` });
  }

  if (Array.isArray(data.boilerfuel_templates)) {
    summary.push({ key: 'templates', label: 'Meal templates', detail: `${data.boilerfuel_templates.length} templates` });
  }

  if (data.boilerfuel_dietary) {
    summary.push({ key: 'dietary', label: 'Dietary filters', detail: 'Preference + allergen filters' });
  }

  return summary;
}

async function parseErrorMessage(res, fallback = 'Sync request failed') {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {}
  return fallback;
}

function isMissingTokenError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('sync token not found');
}

export function normalizeToken(token) {
  if (!token) return '';
  return String(token).trim().toUpperCase();
}

// ── Robust fetch for mobile networks (with retry) ──
// Mobile networks can be flaky (especially 4G/5G transitions) — implement simple retry with exponential backoff

async function robustFetch(url, options = {}, maxRetries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      // 15 second timeout per attempt (mobile can be slower)
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        // Mobile handoffs can stall briefly; a slightly longer staggered backoff
        // reduces false negatives without making sync feel unresponsive.
        const delaySchedule = [250, 750, 1500, 2500];
        const delay = delaySchedule[attempt] || 2500;
        console.log(`[sync] Fetch retry attempt ${attempt + 1}/${maxRetries + 1}, backing off ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr || new Error('Network request failed after retries');
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
  try { localStorage.setItem('boilerfuel_sync_devices', JSON.stringify(devices)); } catch {}
  data._devices = devices;

  // Diagnostic logging for meals
  if (data.boilerfuel_meals) {
    const mealDays = Object.keys(data.boilerfuel_meals).length;
    const totalMeals = Object.values(data.boilerfuel_meals).reduce((sum, dayMeals) => {
      return sum + (Array.isArray(dayMeals) ? dayMeals.length : 0);
    }, 0);
    console.log('[sync] Gathering local data for push:', { mealDays, totalMeals, latestDates: Object.keys(data.boilerfuel_meals).sort().slice(-3) });
  }

  return data;
}

function buildMealIdentity(meal) {
  const ts = meal?.addedAt;
  if (ts !== undefined && ts !== null) {
    return `ts:${ts}:${meal?.name || ''}:${meal?.calories || ''}`;
  }
  return `fallback:${meal?.name || ''}:${meal?.calories || ''}:${meal?.servings || ''}:${meal?.dining_court || ''}:${meal?.meal_time || ''}`;
}

export function mergeRemoteData(remote) {
  if (!remote) return;

  console.log('[sync] mergeRemoteData called with remote data keys:', Object.keys(remote).filter(k => !k.startsWith('_')));

  // ── Safety: snapshot meals before any merge so we can recover if data shrinks ──
  // Also get a fresh snapshot right before each key's merge to ensure we have the
  // latest React state that may have just been persisted to localStorage
  const mealsBefore = localStorage.getItem('boilerfuel_meals');

  // Merge helper: dedupe by addedAt when present, keep all entries that do
  // not have a timestamp so we never accidentally drop meals.
  function appendMeals(targetMeals, incomingMeals) {
    const seen = new Set((targetMeals || []).map(buildMealIdentity));
    for (const meal of (incomingMeals || [])) {
      const mealIdentity = buildMealIdentity(meal);
      if (!seen.has(mealIdentity)) {
        seen.add(mealIdentity);
        targetMeals.push(meal);
      }
    }
  }

  for (const key of SYNC_KEYS) {
    if (!(key in remote)) continue;
    const remoteVal = remote[key];
    
    // Read fresh from localStorage for each key to catch any React state updates
    // that may have landed between the start of this function and now
    const localRaw = localStorage.getItem(key);

    if (key === 'boilerfuel_meals') {
      // Merge meals by date key — union of meals from both sides
      // Use both the snapshot AND the fresh read to ensure we don't lose data
      const local = localRaw ? JSON.parse(localRaw) : {};
      const snapshot = mealsBefore ? JSON.parse(mealsBefore) : {};
      const beforeMealCount = Object.values(snapshot).reduce((sum, dayMeals) => {
        return sum + (Array.isArray(dayMeals) ? dayMeals.length : 0);
      }, 0);
      
      console.log('[sync] Merging meals - local days:', Object.keys(local).length, 'remote days:', Object.keys(remoteVal || {}).length);
      
      // Start with the snapshot (older), then merge in current localStorage (fresher),
      // then merge in remote data. This ensures we keep all meals from all sources.
      const merged = { ...snapshot };
      
      // Merge current local data
      for (const [date, localMeals] of Object.entries(local)) {
        if (!merged[date]) {
          merged[date] = localMeals;
        } else {
          appendMeals(merged[date], localMeals);
        }
      }
      
      // Now merge remote data
      for (const [date, remoteMeals] of Object.entries(remoteVal || {})) {
        if (!merged[date]) {
          merged[date] = remoteMeals;
        } else {
          appendMeals(merged[date], remoteMeals);
        }
      }

      console.log('[sync] Merged meals result - days:', Object.keys(merged).length, 'total meals:', Object.values(merged).reduce((sum, meals) => sum + (Array.isArray(meals) ? meals.length : 0), 0));

      const mergedMealCount = Object.values(merged).reduce((sum, dayMeals) => {
        return sum + (Array.isArray(dayMeals) ? dayMeals.length : 0);
      }, 0);
      const shouldKeepBackup = mergedMealCount < beforeMealCount;

      // Post-merge loss guard: if we somehow ended up with fewer date-keys than
      // before (should never happen, but defensive), merge the backup back in.
      if (mealsBefore) {
        const before = JSON.parse(mealsBefore);
        for (const [date, meals] of Object.entries(before)) {
          if (!merged[date] || merged[date].length === 0) {
            merged[date] = meals;
          } else {
            appendMeals(merged[date], meals);
          }
        }
      }

      // Save a rolling backup only when merge appears to shrink data.
      // Otherwise we clear stale backup to avoid false recovery warnings.
      if (mealsBefore && shouldKeepBackup) {
        try {
          localStorage.setItem('boilerfuel_meals_backup', mealsBefore);
        } catch {
          // localStorage quota exceeded — skip backup silently
        }
      } else {
        localStorage.removeItem('boilerfuel_meals_backup');
      }
      // Remove the old key first so writing never fails due to "overwrite while full"
      localStorage.removeItem(key);
      let mealsSaved = false;
      // Try full merged data first
      try { localStorage.setItem(key, JSON.stringify(merged)); mealsSaved = true; } catch {}
      if (!mealsSaved) {
        // Progressively prune until it fits: 6mo → 3mo → 1mo → 14d
        for (const months of [6, 3, 1]) {
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - months);
          const cutoffStr = cutoff.toISOString().slice(0, 10);
          const pruned = Object.fromEntries(Object.entries(merged).filter(([d]) => d >= cutoffStr));
          try { localStorage.setItem(key, JSON.stringify(pruned)); mealsSaved = true; break; } catch {}
        }
      }
      if (!mealsSaved) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        const pruned = Object.fromEntries(Object.entries(merged).filter(([d]) => d >= cutoffStr));
        try { localStorage.setItem(key, JSON.stringify(pruned)); mealsSaved = true; } catch {}
      }

      // Last-resort safety: never leave meals key empty after removing it.
      if (!mealsSaved && mealsBefore) {
        try {
          localStorage.setItem(key, mealsBefore);
          mealsSaved = true;
          console.warn('[sync] Restored previous meals after save fallback failed');
        } catch {}
      }
      if (!mealsSaved) {
        addSyncLogEntry({
          direction: 'pull',
          status: 'error',
          keys: ['boilerfuel_meals'],
          detail: 'Unable to save merged meals after quota fallback attempts',
        });
      }
      const savedMealsRaw = localStorage.getItem(key);
      const savedMeals = savedMealsRaw ? JSON.parse(savedMealsRaw) : {};
      console.log('[sync] Meals saved to localStorage, mealsSaved:', mealsSaved, 'savedDays:', Object.keys(savedMeals).length);
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
      try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
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
      try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
    } else if (key === 'boilerfuel_favorites') {
      // Union of favorites
      const local = localRaw ? JSON.parse(localRaw) : [];
      const merged = [...new Set([...local, ...(remoteVal || [])])];
      try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
    } else {
      // For goals, templates, dietary — remote wins (last push wins)
      try { localStorage.setItem(key, JSON.stringify(remoteVal)); } catch {}
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
    try { localStorage.setItem('boilerfuel_sync_devices', JSON.stringify(merged)); } catch {}
  }
}

export const __testables = {
  buildMealIdentity,
  mergeRemoteData,
  summarizeTransferredData,
  normalizeToken,
  isMissingTokenError,
};
