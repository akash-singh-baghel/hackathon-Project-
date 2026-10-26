// The platform resolves *which* packages a query names (via searchData.entities)
// but never *what kind* of question it is — that's ours to work out from the
// raw query text, same spirit as the PDF's "it doesn't tell you the intent" note.

const VERSION_PATTERN = /([A-Za-z0-9][\w.-]*)\s+v?(\d+(?:\.\d+)?)\s*(?:vs\.?|versus|to|->|→)\s*v?(\d+(?:\.\d+)?)/i;
const ALTERNATIVES_PATTERN = /\balternatives?\s+(to|for)\b|\bsimilar\s+to\b|\bpackages?\s+like\b/i;
const LATEST_PATTERN = /\b(latest|current)\s+version\b/i;
const NOISE_WORDS = /\b(best|good|great|top|npm|packages?|librar(?:y|ies)|for|to|that|which|can|i|use|a|an)\b/gi;

export function detectIntent({ query = '', entities = [] }) {
  const packages = entities.map((e) => e.sourceID || e.word).filter(Boolean);

  const versionMatch = query.match(VERSION_PATTERN);
  if (versionMatch && packages.length >= 1) {
    return {
      type: 'version-compare',
      packageName: packages[0],
      versionA: versionMatch[2],
      versionB: versionMatch[3],
    };
  }

  if (packages.length >= 2) {
    return { type: 'compare', packages };
  }

  if (packages.length === 1 && ALTERNATIVES_PATTERN.test(query)) {
    return { type: 'alternatives', packageName: packages[0] };
  }

  if (packages.length === 1) {
    return { type: 'details', packageName: packages[0], emphasizeVersion: LATEST_PATTERN.test(query) };
  }

  // No package named at all — treat the whole query as a need, e.g.
  // "best npm package for date formatting" -> "date formatting".
  const need = query.replace(NOISE_WORDS, ' ').replace(/\s+/g, ' ').trim();
  return { type: 'use-case', need: need || query };
}
