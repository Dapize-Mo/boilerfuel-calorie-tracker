const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function isBrowser() {
  return typeof document !== 'undefined';
}

export function readCookie(name) {
  if (!isBrowser()) return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const match = cookies.find((pair) => pair.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.substring(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return null;
  }
}

export function writeCookie(name, value, { maxAge = DEFAULT_MAX_AGE } = {}) {
  if (!isBrowser()) return;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function deleteCookie(name) {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
