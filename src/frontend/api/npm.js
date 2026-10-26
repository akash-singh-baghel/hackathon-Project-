// All calls here are free, keyless, and CORS-enabled — this component has no
// backend because it doesn't need one. See README for the endpoint list.

const REGISTRY = 'https://registry.npmjs.org';
const DOWNLOADS = 'https://api.npmjs.org/downloads';
const BUNDLEPHOBIA = 'https://bundlephobia.com/api/size';

export class NotFoundError extends Error {}

function encodeName(name) {
  return name.startsWith('@') ? name.replace('/', '%2F') : name;
}

async function getJson(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) throw new NotFoundError(url);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Full registry record: all versions, dist-tags, time, repository, etc. */
export async function fetchPackageRecord(name) {
  return getJson(`${REGISTRY}/${encodeName(name)}`);
}

/** Weekly download count. Scoped packages aren't tracked by this API — returns null, not an error. */
export async function fetchWeeklyDownloads(name) {
  if (name.startsWith('@')) return null;
  try {
    const data = await getJson(`${DOWNLOADS}/point/last-week/${encodeName(name)}`);
    return data.downloads ?? null;
  } catch {
    return null;
  }
}

/** Daily download counts for the last month, for the comparison chart. */
export async function fetchDailyDownloads(name) {
  if (name.startsWith('@')) return [];
  try {
    const data = await getJson(`${DOWNLOADS}/range/last-month/${encodeName(name)}`);
    return Array.isArray(data.downloads) ? data.downloads : [];
  } catch {
    return [];
  }
}

/** npm's own ranked search — used for "alternatives to X" and use-case recommendations. */
export async function searchPackages(text, size = 10) {
  const url = `${REGISTRY}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`;
  const data = await getJson(url);
  return Array.isArray(data.objects) ? data.objects : [];
}

/** Best-effort install size via Bundlephobia — an unofficial, sometimes-slow API, so this must never block the rest of the card. */
export async function fetchBundleSize(name, version) {
  try {
    const data = await getJson(`${BUNDLEPHOBIA}?package=${encodeName(name)}@${version}`, { timeoutMs: 6000 });
    return { gzip: data.gzip ?? null, size: data.size ?? null, dependencyCount: data.dependencyCount ?? null };
  } catch {
    return null;
  }
}

/** DefinitelyTyped existence check, for packages that don't bundle their own types. */
export async function definitelyTypedPackageExists(name) {
  const dtName = name.startsWith('@') ? `@types/${name.slice(1).replace('/', '__')}` : `@types/${name}`;
  try {
    await getJson(`${REGISTRY}/${encodeName(dtName)}/latest`, { timeoutMs: 5000 });
    return dtName;
  } catch {
    return null;
  }
}
