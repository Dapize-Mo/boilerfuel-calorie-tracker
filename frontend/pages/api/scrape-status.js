// Scraper status endpoint - proxies to backend
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

    if (process.env.VERCEL && (!backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl))) {
      return res.status(200).json({
        status: 'idle',
        message: 'Backend URL not configured. Set BACKEND_URL in Vercel to enable status checks.',
      });
    }

    const base = backendUrl || 'http://localhost:5000';
    
    // Forward authentication headers
    const headers = {};
    
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword) {
      headers['X-ADMIN-PASSWORD'] = adminPassword;
    }

    const response = await fetch(`${base}/api/scrape-status`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error checking scraper status:', error);
    
    // Fallback response when backend is unavailable
    return res.status(200).json({
      status: 'idle',
      message: 'Backend unavailable. Scraper status unknown.',
      note: 'This is a fallback response. The backend may not be running.'
    });
  }
}
