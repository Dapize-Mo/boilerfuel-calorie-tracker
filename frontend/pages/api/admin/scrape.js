// Admin scraper trigger endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Forward the request to the backend with authentication headers
    const headers = {};
    
    // Forward Authorization header if present
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward X-ADMIN-PASSWORD header if present
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword) {
      headers['X-ADMIN-PASSWORD'] = adminPassword;
    }

    const response = await fetch(`${backendUrl}/api/admin/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error triggering scraper:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger scraper. Please check if the backend is running.',
      details: error.message 
    });
  }
}
