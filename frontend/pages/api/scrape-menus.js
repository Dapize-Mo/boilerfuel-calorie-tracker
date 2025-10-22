// Scraper endpoint for Vercel deployment
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // For now, return a success message indicating the scraper would run
    // In production, this would trigger a background job or external service
    return res.status(200).json({
      message: 'Scraper triggered successfully! Menu data will be updated shortly.',
      status: 'success',
      note: 'This is a demo response. In production, this would run the actual scraper.'
    });
    
  } catch (error) {
    console.error('Error in scraper endpoint:', error);
    return res.status(500).json({ 
      error: 'Scraper service temporarily unavailable. Please try again later.'
    });
  }
}
