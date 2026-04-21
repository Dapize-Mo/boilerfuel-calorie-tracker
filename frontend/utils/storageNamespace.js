const DEBUG_DEVICE_QUERY_PARAM = 'bf_device';
const DEBUG_DEVICE_SESSION_KEY = 'boilerfuel_debug_device';

const NAMESPACED_KEYS = new Set([
  'boilerfuel_meals',
  'boilerfuel_goals',
  'boilerfuel_favorites',
  'boilerfuel_water',
  'boilerfuel_weight',
  'boilerfuel_templates',
  'boilerfuel_dietary',
  'boilerfuel_sync_token',
  'boilerfuel_sync_secret',
  'boilerfuel_sync_last_pull',
  'boilerfuel_sync_last_revision',
  'boilerfuel_sync_last_success_at',
  'boilerfuel_sync_log',
  'boilerfuel_sync_devices',
  'boilerfuel_device_id',
  'boilerfuel_meals_backup',
  'boilerfuel_custom_foods',
]);

function normalizeDeviceNamespace(value) {
  if (!value) return '';
  const cleaned = String(value).trim();
  if (!cleaned) return '';
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(cleaned)) return '';
  return cleaned;
}

function resolveDeviceNamespace() {
  if (typeof window === 'undefined') return '';

  try {
    const params = new URLSearchParams(window.location.search || '');
    const fromQuery = normalizeDeviceNamespace(params.get(DEBUG_DEVICE_QUERY_PARAM));
    if (fromQuery) {
      window.sessionStorage.setItem(DEBUG_DEVICE_SESSION_KEY, fromQuery);
      return fromQuery;
    }

    return normalizeDeviceNamespace(window.sessionStorage.getItem(DEBUG_DEVICE_SESSION_KEY));
  } catch {
    return '';
  }
}

export function getDebugStorageNamespace() {
  return resolveDeviceNamespace();
}

export function getNamespacedStorageKey(baseKey) {
  const namespace = resolveDeviceNamespace();
  if (!namespace || !NAMESPACED_KEYS.has(baseKey)) return baseKey;
  return `${baseKey}__${namespace}`;
}
