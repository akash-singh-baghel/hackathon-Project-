import styled from '@emotion/styled';
import { formatDate } from '../utils/format.js';
import DeprecatedBanner from './DeprecatedBanner.jsx';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--pi-space-3);
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--pi-space-3);
  border-radius: var(--pi-radius-lg);
  background: var(--pi-surface);
  border: 1px solid var(--pi-border);
  box-shadow: var(--pi-shadow-sm);
`;

const VersionTag = styled.span`
  font-family: var(--pi-mono);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--pi-accent);
`;

const Fact = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--pi-text-muted);

  strong {
    color: var(--pi-text);
    font-weight: 650;
  }
`;

const Missing = styled.div`
  font-size: 0.82rem;
  color: var(--pi-text-faint);
  font-style: italic;
`;

export default function VersionCompareView({ name, requested, resolved }) {
  return (
    <Grid>
      {resolved.map((v, i) =>
        v ? (
          <Col key={v.version}>
            <VersionTag>
              {name}@{v.version}
            </VersionTag>
            <DeprecatedBanner message={v.deprecated} />
            <Fact>
              <span>Published</span>
              <strong>{formatDate(v.publishedAt) || 'Unknown'}</strong>
            </Fact>
            <Fact>
              <span>Module format</span>
              <strong>{v.esm}</strong>
            </Fact>
            <Fact>
              <span>Types</span>
              <strong>{v.types}</strong>
            </Fact>
            <Fact>
              <span>Node engine</span>
              <strong>{v.engines || 'Not specified'}</strong>
            </Fact>
          </Col>
        ) : (
          <Col key={requested[i]}>
            <VersionTag>
              {name}@{requested[i]}.x
            </VersionTag>
            <Missing>No published release matches "{requested[i]}".</Missing>
          </Col>
        )
      )}
    </Grid>
  );
}
