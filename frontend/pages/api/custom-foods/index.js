import { getBackendUrl } from '../../../utils/auth';

export default async function handler(req, res) {
  const { method } = req;
  const backendUrl = getBackendUrl();
  
  // Get authorization token from request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    if (method === 'GET') {
      // Get all custom foods for user
      const response = await fetch(`${backendUrl}/api/custom-foods${req.url.includes('?') ? req.url.split('?')[1] : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } 
    else if (method === 'POST') {
      // Create new custom food
      const response = await fetch(`${backendUrl}/api/custom-foods`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Custom foods API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
