// Admin scraper trigger endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const debug = process.env.SCRAPE_DEBUG === 'true';
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

    if (debug) {
      console.log('[admin/scrape] env', {
        hasBackendUrl: Boolean(backendUrl),
        backendUrl,
        isVercel: Boolean(process.env.VERCEL),
        hasGhToken: Boolean(process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN),
        ghRepo: process.env.GH_REPO || process.env.GITHUB_REPOSITORY || null,
      });
    }

    // Guard: in production we must have a real backend URL (not localhost)
    if (process.env.VERCEL && (!backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl))) {
      // If no backend, try falling back to GitHub Actions dispatch (serverless-friendly)
      const ghToken = process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN;
      const ghRepo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || 'Dapize-Mo/boilerfuel-calorie-tracker';
      const workflowFile = process.env.GH_WORKFLOW_FILE || 'scrape.yml';
      const ref = process.env.GH_REF || 'master';

      if (ghToken && ghRepo) {
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
          body: JSON.stringify({ ref, inputs: { trigger: 'admin' } })
        });

        if (debug) {
          console.log('[admin/scrape] GitHub dispatch status', ghResp.status);
        }

        if (ghResp.status === 204) {
          return res.status(202).json({
            status: 'scrape started',
            via: 'github-actions',
            message: 'Workflow dispatched. Status will update when the run starts.'
          });
        }

        const err = await ghResp.text();
        return res.status(500).json({ error: 'Failed to dispatch GitHub Actions workflow', details: err });
      }

      return res.status(500).json({
        error: 'No backend configured',
        details: 'Set BACKEND_URL for a live API, or configure GH_ACTIONS_TOKEN + GH_REPO to trigger GitHub Actions.'
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

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const rawBody = isJson ? null : await response.text();
    const data = isJson ? await response.json() : null;

    if (debug) {
      console.log('[admin/scrape] backend response', {
        status: response.status,
        contentType,
        bodyPreview: rawBody ? rawBody.slice(0, 500) : null,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(
        data || {
          error: 'Backend returned a non-JSON response',
          details: rawBody || 'No response body',
        }
      );
    }

    return res.status(response.status).json(data || { status: 'ok' });
    
  } catch (error) {
    console.error('Error triggering scraper:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger scraper. Please check if the backend is running.',
      details: error.message 
    });
  }
}
