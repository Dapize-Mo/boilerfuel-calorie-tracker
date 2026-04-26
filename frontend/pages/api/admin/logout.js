import { csrfCheck } from '../../../utils/csrf';

export default function handler(req, res) {
  if (!csrfCheck(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Clear the httpOnly admin cookie
  res.setHeader('Set-Cookie', 'adminToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}
