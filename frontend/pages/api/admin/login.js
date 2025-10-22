import { signAdminToken } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin authentication is not configured' });
  }

  if (!password || `${password}`.trim() !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = await signAdminToken();
  return res.status(200).json({ token });
}
