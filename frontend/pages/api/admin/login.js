import { signAdminToken } from '../../../utils/jwt';
import { csrfCheck } from '../../../utils/csrf';

const MAX_ATTEMPTS = 5;
const BASE_BLOCK_MS = 60 * 1000; // 1 minute base
const MAX_BLOCK_MS = 60 * 60 * 1000; // 1 hour max

// Module-level store: ip -> { count, blockedUntil }
const attempts = new Map();

// Prune stale entries every 10 minutes to prevent memory leak
let lastPrune = 0;
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 10 * 60 * 1000) return;
  lastPrune = now;
  for (const [ip, rec] of attempts.entries()) {
    if (now > rec.blockedUntil && rec.count === 0) attempts.delete(ip);
  }
}

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
}

function getRecord(ip) {
  const now = Date.now();
  let rec = attempts.get(ip);
  if (!rec) {
    rec = { count: 0, blockedUntil: 0 };
    attempts.set(ip, rec);
  }
  // Reset count if block period has fully expired
  if (now > rec.blockedUntil && rec.blockedUntil > 0) {
    rec.count = 0;
    rec.blockedUntil = 0;
  }
  return rec;
}

export default async function handler(req, res) {
  if (!csrfCheck(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  maybePrune();

  const ip = getIp(req);
  const rec = getRecord(ip);
  const now = Date.now();

  // Check if currently blocked
  if (rec.count >= MAX_ATTEMPTS && now < rec.blockedUntil) {
    const retryAfter = Math.ceil((rec.blockedUntil - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` });
  }

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin authentication is not configured' });
  }

  // Constant-time comparison to prevent timing attacks
  const input = `${password || ''}`.trim();
  const expected = adminPassword;
  let match = input.length === expected.length;
  const len = Math.max(input.length, expected.length);
  for (let i = 0; i < len; i++) {
    if ((input.charCodeAt(i) || 0) !== (expected.charCodeAt(i) || 0)) {
      match = false;
    }
  }

  if (!match) {
    rec.count += 1;
    // Exponential backoff: 1min, 2min, 4min, 8min... capped at 1 hour
    const blockMs = Math.min(BASE_BLOCK_MS * Math.pow(2, rec.count - MAX_ATTEMPTS), MAX_BLOCK_MS);
    if (rec.count >= MAX_ATTEMPTS) {
      rec.blockedUntil = now + blockMs;
    }
    const remaining = Math.max(0, MAX_ATTEMPTS - rec.count);
    res.setHeader('X-RateLimit-Remaining', remaining);
    return res.status(401).json({
      error: 'Invalid password',
      attemptsRemaining: remaining,
    });
  }

  // Success — clear the record
  attempts.delete(ip);

  let token;
  try {
    token = await signAdminToken();
  } catch (err) {
    console.error('[admin/login] JWT signing error:', err.message);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
  // Set httpOnly cookie — immune to XSS; also return token for API clients
  const isProd = process.env.NODE_ENV === 'production';
  const cookieFlags = [
    `adminToken=${token}`,
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=604800',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookieFlags);
  return res.status(200).json({ token });
}
