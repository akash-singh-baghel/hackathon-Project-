// Derives install-cost/compatibility facts straight from a version manifest —
// no guessing, no "winner" opinions, just what the manifest actually says.

export function latestManifest(record) {
  const latestTag = record?.['dist-tags']?.latest;
  return latestTag ? record?.versions?.[latestTag] : null;
}

export function esmSupport(manifest) {
  if (!manifest) return 'Unknown';
  if (manifest.type === 'module') return 'ESM only';
  if (manifest.exports && typeof manifest.exports === 'object') {
    const serialized = JSON.stringify(manifest.exports);
    if (serialized.includes('"import"')) {
      return serialized.includes('"require"') ? 'ESM + CJS (dual)' : 'ESM only';
    }
  }
  return 'CommonJS';
}

export function bundledTypes(manifest) {
  if (!manifest) return null;
  return manifest.types || manifest.typings || null;
}

export function nodeEngine(manifest) {
  return manifest?.engines?.node || null;
}

export function deprecationNotice(manifest) {
  return typeof manifest?.deprecated === 'string' ? manifest.deprecated : null;
}

export function publishDate(record, version) {
  return record?.time?.[version] || null;
}
