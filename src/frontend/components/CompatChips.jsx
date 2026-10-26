import styled from '@emotion/styled';
import { formatBytes } from '../utils/format.js';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  background: var(--pi-surface-sunken);
  color: var(--pi-text-muted);
  border: 1px solid var(--pi-border);
  white-space: nowrap;
`;

function typesLabel(types) {
  if (!types) return 'Types unknown';
  if (types.status === 'bundled') return 'Types bundled';
  if (types.status === 'definitely-typed') return `Types via ${types.source}`;
  return 'No type definitions';
}

export default function CompatChips({ pkg }) {
  const sizeLabel = pkg.size?.gzip != null ? `${formatBytes(pkg.size.gzip)} gzipped` : null;

  return (
    <Row>
      <Chip>{pkg.esm}</Chip>
      <Chip>{typesLabel(pkg.types)}</Chip>
      {pkg.engines && <Chip>Node {pkg.engines}</Chip>}
      {sizeLabel && <Chip>{sizeLabel}</Chip>}
      {pkg.license && <Chip>{pkg.license}</Chip>}
    </Row>
  );
}
