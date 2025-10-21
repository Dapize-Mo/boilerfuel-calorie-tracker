// Always report idle/complete since scraping is externalized to GitHub Actions.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ status: 'complete', message: 'Latest data is loaded by scheduled tasks.' });
}
