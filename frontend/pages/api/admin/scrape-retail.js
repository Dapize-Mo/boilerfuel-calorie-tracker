// Trigger the retail menu scraper workflow
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ghToken = process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN;
    const ghRepo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || 'Dapize-Mo/boilerfuel-calorie-tracker';
    const workflowFile = 'scrape-retail-menus.yml';
    const ref = process.env.GH_REF || 'master';

    if (!ghToken || !ghRepo) {
      return res.status(500).json({
        error: 'Missing GitHub credentials',
        details: 'Set GH_ACTIONS_TOKEN and GH_REPO env vars',
      });
    }

    const [owner, repo] = ghRepo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

    const ghResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${ghToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref }),
    });

    if (ghResp.status === 204) {
      return res.status(202).json({
        status: 'scrape started',
        via: 'github-actions',
        message: 'Retail menu workflow dispatched. Beverages will appear once the run completes (~2 min).',
      });
    }

    const errBody = await ghResp.text();
    return res.status(500).json({
      error: 'Failed to dispatch workflow',
      details: errBody,
      githubStatus: ghResp.status,
    });
  } catch (error) {
    console.error('Error triggering retail scraper:', error);
    return res.status(500).json({ error: 'Failed to trigger retail scraper', details: error.message });
  }
}
