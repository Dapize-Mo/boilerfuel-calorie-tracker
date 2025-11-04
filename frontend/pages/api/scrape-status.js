// Scraper status endpoint - proxies to backend
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
    const ghToken = process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN;
    const ghRepo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || 'Dapize-Mo/boilerfuel-calorie-tracker';
    const workflowFile = process.env.GH_WORKFLOW_FILE || 'scrape.yml';
    const ref = process.env.GH_REF || 'master';

    if (process.env.VERCEL && (!backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl))) {
      // If backend is not set, try reading status from GitHub Actions workflow
      if (ghToken && ghRepo) {
        const [owner, repo] = ghRepo.split('/');
        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1&branch=${encodeURIComponent(ref)}&event=workflow_dispatch`;
        const ghResp = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${ghToken}`,
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        if (!ghResp.ok) {
          const err = await ghResp.text();
          return res.status(200).json({ status: 'idle', message: 'Awaiting workflow start', details: err });
        }

        const data = await ghResp.json();
        const run = data.workflow_runs?.[0];
        if (!run) {
          return res.status(200).json({ status: 'idle', message: 'No recent workflow run found' });
        }

        if (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requested' ) {
          return res.status(200).json({ status: 'in_progress', message: 'Scraping via GitHub Actions...' });
        }

        if (run.status === 'completed') {
          if (run.conclusion === 'success') {
            return res.status(200).json({ status: 'complete', message: 'Scraping completed successfully via GitHub Actions.' });
          } else {
            return res.status(200).json({ status: 'error', error: `Workflow ${run.conclusion}` });
          }
        }

        return res.status(200).json({ status: 'idle', message: `Workflow status: ${run.status}` });
      }

      return res.status(200).json({
        status: 'idle',
        message: 'Backend URL not configured. Set BACKEND_URL or GH_ACTIONS_TOKEN + GH_REPO in Vercel.'
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
