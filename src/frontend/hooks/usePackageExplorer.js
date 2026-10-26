import { useEffect, useRef, useState } from 'react';
import {
  fetchPackageRecord,
  fetchWeeklyDownloads,
  fetchDailyDownloads,
  fetchBundleSize,
  definitelyTypedPackageExists,
  searchPackages,
  NotFoundError,
} from '../api/npm.js';
import { fetchGithubRepoStats } from '../api/github.js';
import { latestManifest, esmSupport, bundledTypes, nodeEngine, deprecationNotice, publishDate } from '../utils/compat.js';
import { CURATED_ALTERNATIVES } from '../data/curatedAlternatives.js';

// One package's full fact sheet — shared by the details view, every column of
// the comparison table, and each card in an alternatives/use-case list.
async function loadPackageFacts(name) {
  const record = await fetchPackageRecord(name);
  const manifest = latestManifest(record);
  const latestVersion = record?.['dist-tags']?.latest || null;
  const repository = typeof record?.repository === 'string' ? record.repository : record?.repository?.url || null;

  const [weeklyDownloads, size, bundled, dailyDownloads, github] = await Promise.all([
    fetchWeeklyDownloads(name),
    latestVersion ? fetchBundleSize(name, latestVersion) : null,
    Promise.resolve(bundledTypes(manifest)),
    fetchDailyDownloads(name),
    fetchGithubRepoStats(repository),
  ]);

  let types = bundled ? { status: 'bundled', source: bundled } : { status: 'none', source: null };
  if (types.status === 'none') {
    const dtPackage = await definitelyTypedPackageExists(name);
    if (dtPackage) types = { status: 'definitely-typed', source: dtPackage };
  }

  return {
    name: record?.name || name,
    description: record?.description || null,
    latestVersion,
    publishedAt: publishDate(record, latestVersion),
    license: manifest?.license || record?.license || null,
    homepage: record?.homepage || null,
    repository,
    keywords: Array.isArray(record?.keywords) ? record.keywords : [],
    weeklyDownloads,
    deprecated: deprecationNotice(manifest),
    esm: esmSupport(manifest),
    types,
    engines: nodeEngine(manifest),
    size,
    downloadTrend: dailyDownloads.length ? dailyDownloads.map((d) => d.downloads) : null,
    github,
  };
}

function sharedKeywords(a = [], b = []) {
  const setB = new Set(b.map((k) => k.toLowerCase()));
  // De-duplicated by lowercase form — some published packages (superagent,
  // for one) list the same keyword twice in their own registry metadata,
  // which otherwise breaks React's key uniqueness downstream in ResultList.
  const seen = new Set();
  return a.filter((k) => {
    const lower = k.toLowerCase();
    if (!setB.has(lower) || seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

async function enrichWithDownloads(candidates, seedKeywords) {
  return Promise.all(
    candidates.map(async (p) => ({
      name: p.name,
      description: p.description || null,
      keywords: p.keywords || [],
      sharedKeywords: sharedKeywords(p.keywords || [], seedKeywords),
      weeklyDownloads: await fetchWeeklyDownloads(p.name),
    }))
  );
}

async function loadCuratedAlternatives(names, seedKeywords) {
  const settled = await Promise.allSettled(names.map((n) => fetchPackageRecord(n)));
  const basics = [];
  settled.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      basics.push({
        name: result.value.name,
        description: result.value.description || null,
        keywords: Array.isArray(result.value.keywords) ? result.value.keywords : [],
      });
    }
  });
  return enrichWithDownloads(basics, seedKeywords);
}

// "Alternatives to X" needs real alternatives, not just text-relevance
// matches — a single keyword-list query either over-constrains npm's search
// (joining every keyword can drop real competitors like fastify/koa for
// express entirely) or under-constrains it (two words pulls in anything
// that happens to share one loose tag, like a React Router devtools package
// for "router"). Querying two different keyword slices and merging the
// candidate pools gets better recall; re-ranking by actual keyword overlap
// with the seed (computed before anyone's downloads are even fetched), with
// an adaptive minimum so a handful of strong matches isn't diluted by weak
// ones, gets precision back.
async function loadDynamicAlternatives(seedKeywords, excludeName, limit = 6) {
  const nonSelf = seedKeywords.filter((k) => k.toLowerCase() !== excludeName?.toLowerCase());
  const queries = [...new Set([nonSelf.slice(0, 2).join(' '), nonSelf.slice(0, 4).join(' ')])].filter(Boolean);
  if (queries.length === 0) queries.push(excludeName);

  const resultSets = await Promise.all(queries.map((q) => searchPackages(q, 25)));
  const byName = new Map();
  resultSets.flat().forEach((r) => byName.set(r.package.name, r.package));
  byName.delete(excludeName);

  const scored = [...byName.values()]
    .map((p) => ({ pkg: p, overlap: sharedKeywords(p.keywords || [], seedKeywords).length }))
    .filter((c) => c.overlap > 0);

  const minOverlap = [3, 2, 1].find((tier) => scored.filter((c) => c.overlap >= tier).length >= limit) || 1;
  const candidates = scored
    .filter((c) => c.overlap >= minOverlap)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, Math.max(limit, 10))
    .map((c) => c.pkg);

  const enriched = await enrichWithDownloads(candidates, seedKeywords);
  return enriched
    .sort((a, b) => b.sharedKeywords.length - a.sharedKeywords.length || (b.weeklyDownloads || 0) - (a.weeklyDownloads || 0))
    .slice(0, limit);
}

// A handful of common packages (axios, moment, lodash...) have npm keywords
// too generic or legacy-skewed for the ranking above to find their real
// modern competitors — see data/curatedAlternatives.js. Those, when present,
// lead the list; the dynamic ranker fills whatever's left, so anything not
// on the curated list still works exactly as before.
async function loadAlternatives(seedKeywords, excludeName, limit = 6) {
  const curatedNames = (CURATED_ALTERNATIVES[excludeName?.toLowerCase()] || []).filter(
    (n) => n.toLowerCase() !== excludeName?.toLowerCase()
  );
  const curated = curatedNames.length
    ? await loadCuratedAlternatives(curatedNames.slice(0, limit), seedKeywords)
    : [];

  if (curated.length >= limit) return curated.slice(0, limit);

  const dynamic = await loadDynamicAlternatives(seedKeywords, excludeName, limit);
  const seen = new Set(curated.map((c) => c.name.toLowerCase()));
  return [...curated, ...dynamic.filter((d) => !seen.has(d.name.toLowerCase()))].slice(0, limit);
}

// Use-case queries ("best package for date formatting") have no seed
// keywords to overlap with — the query text itself *is* the signal, so npm's
// own relevance+popularity blend is the right ranking here.
async function loadUseCase(need, limit = 6) {
  const raw = await searchPackages(need, limit);
  return enrichWithDownloads(raw.map((r) => r.package), []);
}

async function runIntent(intent) {
  switch (intent.type) {
    case 'details': {
      const pkg = await loadPackageFacts(intent.packageName);
      return { type: 'details', pkg, emphasizeVersion: intent.emphasizeVersion };
    }

    case 'compare': {
      const settled = await Promise.allSettled(intent.packages.map(loadPackageFacts));
      const packages = [];
      const notFound = [];
      settled.forEach((result, i) => {
        if (result.status === 'fulfilled') packages.push(result.value);
        else notFound.push(intent.packages[i]);
      });
      return { type: 'compare', packages, notFound };
    }

    case 'alternatives': {
      const seed = await loadPackageFacts(intent.packageName);
      const results = await loadAlternatives(seed.keywords, seed.name);
      return { type: 'alternatives', seed, results };
    }

    case 'use-case': {
      const results = await loadUseCase(intent.need);
      return { type: 'use-case', need: intent.need, results };
    }

    case 'version-compare': {
      const record = await fetchPackageRecord(intent.packageName);
      const allVersions = Object.keys(record?.versions || {});
      const resolve = (short) => allVersions.filter((v) => v.startsWith(`${short}.`) || v === short).sort().pop();

      const versionA = resolve(intent.versionA);
      const versionB = resolve(intent.versionB);
      const build = (version) => {
        if (!version) return null;
        const manifest = record.versions[version];
        return {
          version,
          publishedAt: publishDate(record, version),
          esm: esmSupport(manifest),
          types: bundledTypes(manifest) ? 'Bundled' : 'Not bundled',
          engines: nodeEngine(manifest),
          deprecated: deprecationNotice(manifest),
        };
      };

      return {
        type: 'version-compare',
        name: record?.name || intent.packageName,
        requested: [intent.versionA, intent.versionB],
        resolved: [build(versionA), build(versionB)],
      };
    }

    default:
      throw new Error(`Unknown intent: ${intent.type}`);
  }
}

function isEmptyIntent(intent) {
  return intent?.type === 'use-case' && !intent.need?.trim();
}

export function usePackageExplorer(intent) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const requestId = useRef(0);

  useEffect(() => {
    if (!intent) return;
    const id = ++requestId.current;

    // The platform/sandbox resolved nothing at all for this query (as
    // opposed to resolving a specific package that doesn't exist on npm,
    // which is the different, already-handled "not-found" case below).
    if (intent.type === 'unresolved') {
      setState({ status: 'unresolved', data: null, error: null });
      return;
    }

    // Nothing to search yet (e.g. the sandbox's blank first frame, before the
    // real searchData arrives) — don't fire a request for an empty need.
    if (isEmptyIntent(intent)) {
      setState({ status: 'loading', data: null, error: null });
      return;
    }

    setState({ status: 'loading', data: null, error: null });

    runIntent(intent)
      .then((data) => {
        if (requestId.current !== id) return;
        setState({ status: 'ready', data, error: null });
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        if (err instanceof NotFoundError) {
          setState({ status: 'not-found', data: null, error: null });
        } else {
          setState({ status: 'error', data: null, error: err.message || 'Something went wrong.' });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(intent)]);

  return state;
}
