import { signAdminToken } from '../../../utils/jwt';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Module-level store: ip -> { count, resetAt }
const attempts = new Map();

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
}

function getRecord(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now >= rec.resetAt) {
    const fresh = { count: 0, resetAt: now + BLOCK_DURATION_MS };
    attempts.set(ip, fresh);
    return fresh;
  }
  return rec;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getIp(req);
  const rec = getRecord(ip);

  if (rec.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((rec.resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Remaining', 0);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` });
  }

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin authentication is not configured' });
  }

  if (!password || `${password}`.trim() !== adminPassword) {
    rec.count += 1;
    const remaining = MAX_ATTEMPTS - rec.count;
    res.setHeader('X-RateLimit-Remaining', remaining);
    return res.status(401).json({
      error: 'Invalid password',
      attemptsRemaining: remaining,
    });
  }

  // Success — clear the record
  attempts.delete(ip);
  const token = await signAdminToken();
  return res.status(200).json({ token });
}
