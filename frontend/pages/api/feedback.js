import { query } from '../../utils/db';
import { requireAdmin } from '../../utils/jwt';
import { csrfCheck } from '../../utils/csrf';

// Rate limit feedback submissions: 5 per hour per IP
const feedbackRateMap = new Map();
function checkFeedbackRate(ip) {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  const max = 5;
  let rec = feedbackRateMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + window };
    feedbackRateMap.set(ip, rec);
  }
  if (rec.count >= max) return false;
  rec.count += 1;
  return true;
}
function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (fwd ? fwd.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
}

let feedbackSchemaReady = false;
async function ensureFeedbackSchema() {
  if (feedbackSchemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL DEFAULT 'idea',
      message TEXT NOT NULL,
      contact VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  feedbackSchemaReady = true;
}

export default async function handler(req, res) {
  if (!csrfCheck(req, res)) return;
  try {
    await ensureFeedbackSchema();

    if (req.method === 'POST') {
      if (!checkFeedbackRate(getIp(req))) {
        return res.status(429).json({ error: 'Too many submissions. Please wait before sending again.' });
      }
      const { type, message, contact } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      await query(
        `INSERT INTO feedback (type, message, contact) VALUES ($1, $2, $3)`,
        [type || 'idea', message.trim().slice(0, 2000), (contact || '').trim().slice(0, 255)]
      );
      return res.json({ ok: true });
    }

    // GET — admin only (list feedback)
    if (req.method === 'GET') {
      await requireAdmin(req);
      const { rows } = await query(`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100`);
      return res.json({ ok: true, feedback: rows });
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).end();
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('[feedback] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
