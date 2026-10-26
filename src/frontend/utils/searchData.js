// Normalizes props.searchData (array or single object, per AGENTS.md §5.2)
// into { query, entities }.
export function normalizeSearchData(raw) {
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data) return { query: '', entities: [] };
  return {
    query: data.query || '',
    entities: Array.isArray(data.entities) ? data.entities : [],
  };
}
