// Stub endpoint for serverless environment. Use GitHub Actions to run the scraper on a schedule.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(202).json({
    message: 'Scraping is handled by a scheduled GitHub Action in this free setup. Data will refresh periodically.'
  });
}
