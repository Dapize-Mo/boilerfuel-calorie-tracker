const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const ADMIN_TOKEN_KEY = 'boilerfuel_admin_token';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAdminToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function apiCall(endpoint, options = {}, { requireAdmin = false } = {}) {
  const url = `${API_URL}${endpoint}`;
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

export function logoutAdmin() {
  clearAdminToken();
}
