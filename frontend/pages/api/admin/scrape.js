// Admin scraper trigger endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

    const ghToken = process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN;
    const ghRepo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || 'Dapize-Mo/boilerfuel-calorie-tracker';
    const workflowFile = process.env.GH_WORKFLOW_FILE || 'scrape.yml';
    const ref = process.env.GH_REF || 'master';

    // Always collect debug info to return in response
    const debugInfo = {
      isVercel: Boolean(process.env.VERCEL),
      hasGhToken: Boolean(ghToken),
      ghTokenPrefix: ghToken ? ghToken.slice(0, 8) + '...' : null,
      ghRepo,
      workflowFile,
      ref,
      hasBackendUrl: Boolean(backendUrl),
    };

    // Prefer GitHub Actions whenever credentials are available (no backend required).
    if (process.env.VERCEL && ghToken && ghRepo) {
      const [owner, repo] = ghRepo.split('/');
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
      debugInfo.dispatchUrl = url;

      const ghResp = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${ghToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref })
      });

      debugInfo.githubStatus = ghResp.status;

      if (ghResp.status === 204) {
        return res.status(202).json({
          status: 'scrape started',
          via: 'github-actions',
          message: 'Workflow dispatched. Status will update when the run starts.',
          debug: debugInfo,
        });
      }

      const errBody = await ghResp.text();
      debugInfo.githubError = errBody;

      return res.status(500).json({
        error: 'Failed to dispatch GitHub Actions workflow',
        details: errBody,
        debug: debugInfo,
      });
    }

    // If we didn't enter the GitHub Actions path, explain why
    if (process.env.VERCEL) {
      debugInfo.reason = !ghToken
        ? 'Missing GH_ACTIONS_TOKEN (or GITHUB_TOKEN) env var'
        : !ghRepo
        ? 'Missing GH_REPO env var'
        : 'Unknown';
    }

    // Guard: in production we must have a real backend URL (not localhost)
    if (process.env.VERCEL && (!backendUrl || /localhost|127\.0\.0\.1/.test(backendUrl))) {
      return res.status(500).json({
        error: 'No backend configured',
        details: 'Set BACKEND_URL for a live API, or configure GH_ACTIONS_TOKEN + GH_REPO to trigger GitHub Actions.',
        debug: debugInfo,
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

    if (!response.ok) {
      return res.status(response.status).json(
        data || {
          error: 'Backend returned a non-JSON response',
          details: rawBody || 'No response body',
          debug: debugInfo,
        }
      );
    }

    return res.status(response.status).json({ ...(data || { status: 'ok' }), debug: debugInfo });

  } catch (error) {
    console.error('Error triggering scraper:', error);
    return res.status(500).json({
      error: 'Failed to trigger scraper. Please check if the backend is running.',
      details: error.message
    });
  }
}
