// Proxy scraper status requests to the backend API
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Get the backend URL from environment or default to localhost for development
    const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_STATIC_URL || 'http://127.0.0.1:5000';
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/scrape-status`, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    
    const data = await response.json();
    
    // Return the response from the backend
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error proxying scraper status request:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to scraper service. Please try again later.' 
    });
  }
}
