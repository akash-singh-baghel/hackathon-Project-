// GitHub's REST API, unauthenticated — fine for a demo, but capped at 60
// requests/hour per IP, so this must stay best-effort like Bundlephobia:
// a failure or rate-limit here degrades one stat, never the rest of the card.
const API_URL = 'https://api.github.com/repos';

export function parseGithubRepo(repositoryUrl) {
  if (!repositoryUrl) return null;
  const match = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/.#]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export async function fetchGithubRepoStats(repositoryUrl, { timeoutMs = 5000 } = {}) {
  const parsed = parseGithubRepo(repositoryUrl);
  if (!parsed) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/${parsed.owner}/${parsed.repo}`, { signal: controller.signal });
    if (!res.ok) return null; // 404 (renamed/private repo) or rate-limited — stay silent, not an error state
    const data = await res.json();
    return {
      stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : null,
      // GitHub's API bundles pull requests into this count; that's its own
      // convention, not a bug here — labelled plainly as "open issues" in the UI.
      openIssues: typeof data.open_issues_count === 'number' ? data.open_issues_count : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
