export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Get authorization token from request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    if (method === 'GET') {
      // Get specific custom food
      const response = await fetch(`${backendUrl}/api/custom-foods/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } 
    else if (method === 'PUT') {
      // Update custom food
      const response = await fetch(`${backendUrl}/api/custom-foods/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }
    else if (method === 'DELETE') {
      // Delete custom food
      const response = await fetch(`${backendUrl}/api/custom-foods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }
    else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Custom food API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
