import styled from '@emotion/styled';
import { formatDownloads } from '../utils/format.js';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.button`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  padding: 12px 14px;
  border-radius: var(--pi-radius-md);
  background: var(--pi-surface);
  border: 1px solid var(--pi-border);
  box-shadow: var(--pi-shadow-sm);
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;

  &:hover {
    border-color: var(--pi-accent);
    box-shadow: var(--pi-shadow-md);
    transform: translateY(-1px);
  }
`;

const TopLine = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
`;

const Rank = styled.span`
  font-family: var(--pi-mono);
  font-size: 0.7rem;
  color: var(--pi-text-faint);
  margin-right: 6px;
`;

const Name = styled.span`
  font-family: var(--pi-mono);
  font-weight: 700;
  color: var(--pi-text);
  font-size: 0.9rem;
`;

const Downloads = styled.span`
  font-size: 0.76rem;
  font-weight: 650;
  color: var(--pi-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: var(--pi-text-muted);
  line-height: 1.4;
`;

const KeywordRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Keyword = styled.span`
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--pi-accent-soft);
  color: var(--pi-accent);
  font-weight: 650;
`;

export default function ResultList({ results, onSelect }) {
  return (
    <List>
      {results.map((pkg, i) => (
        <Row key={pkg.name} onClick={() => onSelect?.(pkg.name)}>
          <TopLine>
            <Name>
              <Rank>{i + 1}</Rank>
              {pkg.name}
            </Name>
            <Downloads>{formatDownloads(pkg.weeklyDownloads)}</Downloads>
          </TopLine>
          {pkg.description && <Description>{pkg.description}</Description>}
          {pkg.sharedKeywords?.length > 0 && (
            <KeywordRow>
              {pkg.sharedKeywords.slice(0, 4).map((k) => (
                <Keyword key={k}>{k}</Keyword>
              ))}
            </KeywordRow>
          )}
        </Row>
      ))}
    </List>
  );
}
