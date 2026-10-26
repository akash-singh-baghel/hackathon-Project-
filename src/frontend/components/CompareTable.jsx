import styled from '@emotion/styled';
import { formatBytes, formatDate, formatRelativeTime, formatCompactNumber } from '../utils/format.js';

// A real <table> in mainline, but below ~440px of container width (the
// sidebar case) it collapses into one stacked mini-card per package — the
// classic responsive-table pattern, driven by a container query rather than
// props.format, so it reacts to the actual rendered width.
const TableWrap = styled.div`
  container-type: inline-size;
  border: 1px solid var(--pi-border);
  border-radius: var(--pi-radius-lg);
  box-shadow: var(--pi-shadow-sm);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: 9px 12px;
    text-align: left;
    border-bottom: 1px solid var(--pi-border);
  }

  thead th {
    background: var(--pi-surface-sunken);
    font-family: var(--pi-mono);
    font-size: 0.82rem;
    color: var(--pi-text);
  }

  tbody th {
    color: var(--pi-text-faint);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    white-space: nowrap;
    background: var(--pi-surface);
  }

  tbody td {
    color: var(--pi-text);
    font-weight: 600;
    background: var(--pi-surface);
  }

  tr:last-of-type th,
  tr:last-of-type td {
    border-bottom: none;
  }

  @container (max-width: 440px) {
    thead {
      display: none;
    }
    tbody,
    tr,
    th,
    td {
      display: block;
      width: 100%;
    }
    tr {
      padding: 10px 12px;
      border-bottom: 1px solid var(--pi-border);
    }
    tr:last-of-type {
      border-bottom: none;
    }
    tbody th {
      padding: 6px 0 0;
    }
    tbody td {
      padding: 0 0 6px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    tbody td::before {
      content: attr(data-label);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pi-text-faint);
    }
  }
`;

function typesLabel(types) {
  if (!types) return '—';
  if (types.status === 'bundled') return 'Bundled';
  if (types.status === 'definitely-typed') return `via ${types.source}`;
  return 'None';
}

const RelativeSpan = styled.span`
  color: var(--pi-text-faint);
  font-weight: 500;
  margin-left: 6px;
`;

const ROWS = [
  { key: 'version', label: 'Latest version', render: (p) => (p.latestVersion ? `v${p.latestVersion}` : '—') },
  {
    key: 'published',
    label: 'Last published',
    render: (p) => {
      const relative = formatRelativeTime(p.publishedAt);
      return (
        <>
          {formatDate(p.publishedAt) || '—'}
          {relative && <RelativeSpan>({relative})</RelativeSpan>}
        </>
      );
    },
  },
  { key: 'license', label: 'License', render: (p) => p.license || '—' },
  { key: 'esm', label: 'Module format', render: (p) => p.esm },
  { key: 'types', label: 'TypeScript', render: (p) => typesLabel(p.types) },
  { key: 'engine', label: 'Node engine', render: (p) => p.engines || 'Not specified' },
  { key: 'size', label: 'Size (gzipped)', render: (p) => (p.size?.gzip != null ? formatBytes(p.size.gzip) : '—') },
  { key: 'stars', label: 'GitHub stars', render: (p) => (p.github?.stars != null ? `★ ${formatCompactNumber(p.github.stars)}` : '—') },
  { key: 'issues', label: 'Open issues', render: (p) => (p.github?.openIssues != null ? p.github.openIssues : '—') },
];

export default function CompareTable({ packages }) {
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <th scope="col" aria-hidden="true" />
            {packages.map((p) => (
              <th scope="col" key={p.name}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {packages.map((p) => (
                <td key={p.name} data-label={p.name}>
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
