import { query } from '../../utils/db';

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
  try {
    await ensureFeedbackSchema();

    if (req.method === 'POST') {
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
      const { rows } = await query(`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100`);
      return res.json({ ok: true, feedback: rows });
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).end();
  } catch (err) {
    console.error('[feedback] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
