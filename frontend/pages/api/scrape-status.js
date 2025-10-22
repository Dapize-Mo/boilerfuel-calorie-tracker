// Scraper status endpoint for Vercel deployment
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Return a mock status indicating the scraper is working
    return res.status(200).json({
      status: 'complete',
      message: 'Menu data is up to date with the latest Purdue dining court information.',
      last_updated: new Date().toISOString(),
      note: 'This is a demo response. In production, this would show real scraper status.'
    });
    
  } catch (error) {
    console.error('Error in scraper status endpoint:', error);
    return res.status(500).json({ 
      error: 'Unable to check scraper status. Please try again later.'
    });
  }
}
