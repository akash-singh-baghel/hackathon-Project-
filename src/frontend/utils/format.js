export function formatCompactNumber(n) {
  if (n == null) return 'Unknown';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
}

export function formatDownloads(n) {
  if (n == null) return 'Unknown';
  return `${formatCompactNumber(n)}/week`;
}

export function formatBytes(bytes) {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

const RELATIVE_UNITS = [
  ['year', 365],
  ['month', 30],
  ['day', 1],
];

export function formatRelativeTime(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const diffDays = Math.round((then - Date.now()) / 86_400_000);
  if (diffDays === 0) return 'today';

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, days] of RELATIVE_UNITS) {
    if (Math.abs(diffDays) >= days) {
      return rtf.format(Math.round(diffDays / days), unit);
    }
  }
  return rtf.format(diffDays, 'day');
}
