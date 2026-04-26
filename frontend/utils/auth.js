// In production, force same-origin calls so the deployed Next.js API routes are used.
// Only allow overriding the API base in development via NEXT_PUBLIC_API_URL.
const ADMIN_TOKEN_KEY = 'boilerfuel_admin_token';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getApiBase() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return '';
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// In-memory token — cleared on page refresh, but the httpOnly cookie keeps the session alive.
// Prefer memory over localStorage so the token isn't sitting in JS-accessible storage longer than needed.
let _memoryToken = null;

export function getAdminToken() {
  if (!isBrowser()) return null;
  // Try memory first, then localStorage as fallback for existing sessions
  return _memoryToken || window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  _memoryToken = token;
  // Keep localStorage for the current session tab so page refreshes don't require re-login.
  // The httpOnly cookie is the authoritative long-lived credential.
  if (isBrowser()) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  _memoryToken = null;
  if (isBrowser()) window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function apiCall(endpoint, options = {}, { requireAdmin = false } = {}) {
  const url = `${getApiBase()}${endpoint}`;
  const token = getAdminToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (requireAdmin) {
    if (!token) {
      throw new Error('Admin authentication required');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send httpOnly cookie on every request
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401 && requireAdmin) {
      clearAdminToken();
    }
    throw new Error((data && data.error) || 'Request failed');
  }

  return data;
}

export async function adminLogin(password) {
  const data = await apiCall(
    '/api/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    },
    { requireAdmin: false }
  );

  if (data?.token) {
    setAdminToken(data.token);
  }

  return data;
}

export async function verifyAdminSession() {
  try {
    await apiCall('/api/admin/session', { method: 'GET' }, { requireAdmin: true });
    return true;
  } catch (error) {
    clearAdminToken();
    return false;
  }
}

export async function createFood(food) {
  return apiCall(
    '/api/foods',
    {
      method: 'POST',
      body: JSON.stringify(food),
    },
    { requireAdmin: true }
  );
}

export async function deleteFood(foodId) {
  return apiCall(`/api/foods/${foodId}`, { method: 'DELETE' }, { requireAdmin: true });
}

export async function createActivity(activity) {
  return apiCall(
    '/api/activities',
    {
      method: 'POST',
      body: JSON.stringify(activity),
    },
    { requireAdmin: true }
  );
}

export async function deleteActivity(activityId) {
  return apiCall(`/api/activities/${activityId}`, { method: 'DELETE' }, { requireAdmin: true });
}

export async function logoutAdmin() {
  clearAdminToken();
  // Clear the httpOnly cookie server-side
  try {
    await fetch(`${getApiBase()}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Best-effort — cookie will expire naturally after 7 days
  }
}
