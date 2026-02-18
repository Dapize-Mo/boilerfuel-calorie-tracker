// Polls GitHub Actions for the latest scrape workflow run status
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ghToken = process.env.GH_ACTIONS_TOKEN || process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY || 'Dapize-Mo/boilerfuel-calorie-tracker';
  const workflowFile = process.env.GH_WORKFLOW_FILE || 'scrape.yml';

  if (!ghToken || !ghRepo) {
    return res.status(200).json({ status: 'unknown', message: 'GitHub credentials not configured' });
  }

  try {
    const [owner, repo] = ghRepo.split('/');

    // Get recent workflow runs for the scrape workflow
    const runsResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${ghToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!runsResp.ok) {
      return res.status(200).json({ status: 'unknown', message: 'Failed to fetch workflow runs' });
    }

    const runsData = await runsResp.json();
    const run = runsData.workflow_runs?.[0];

    if (!run) {
      return res.status(200).json({ status: 'unknown', message: 'No workflow runs found' });
    }

    const result = {
      status: run.status, // queued, in_progress, completed
      conclusion: run.conclusion, // success, failure, cancelled, null (while running)
      started_at: run.run_started_at || run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
      run_id: run.id,
    };

    // If the run is in progress, try to get job-level details for step progress
    if (run.status === 'in_progress' || run.status === 'queued') {
      const jobsResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${ghToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (jobsResp.ok) {
        const jobsData = await jobsResp.json();
        const job = jobsData.jobs?.[0];
        if (job) {
          const steps = (job.steps || []).map(s => ({
            name: s.name,
            status: s.status, // queued, in_progress, completed
            conclusion: s.conclusion, // success, failure, null
            started_at: s.started_at,
            completed_at: s.completed_at,
          }));
          result.current_step = steps.find(s => s.status === 'in_progress')?.name || null;
          result.completed_steps = steps.filter(s => s.status === 'completed').length;
          result.total_steps = steps.length;
          result.steps = steps;
        }
      }
    }

    // Calculate elapsed time
    if (result.started_at) {
      const elapsed = Math.round((Date.now() - new Date(result.started_at).getTime()) / 1000);
      result.elapsed_seconds = elapsed;
    }

    return res.status(200).json(result);

  } catch (err) {
    return res.status(200).json({ status: 'unknown', message: err.message });
  }
}
