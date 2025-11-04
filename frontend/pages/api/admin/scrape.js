// Admin scraper trigger endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

    // Guard: in production we must have a real backend URL (not localhost)
    if (process.env.VERCEL && (!backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl))) {
      return res.status(500).json({
        error: 'Backend URL not configured',
        details: 'Set BACKEND_URL in Vercel project settings to your Flask API base (e.g., https://your-backend.example.com).',
      });
    }

    const base = backendUrl || 'http://localhost:5000';
    
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

    const response = await fetch(`${base}/api/admin/scrape`, {
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
