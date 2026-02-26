import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { signAdminToken } from '../../../utils/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'No active Google session' });
    }

    const token = await signAdminToken();
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to exchange session' });
  }
}
