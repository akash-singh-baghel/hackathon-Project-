import styled from '@emotion/styled';
import { formatDownloads, formatDate, formatRelativeTime, formatCompactNumber } from '../utils/format.js';
import { useCountUp } from '../hooks/useCountUp.js';
import CompatChips from './CompatChips.jsx';
import DeprecatedBanner from './DeprecatedBanner.jsx';
import FollowUpBar from './FollowUpBar.jsx';
import Sparkline from './Sparkline.jsx';
import InstallCommand from './InstallCommand.jsx';

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: var(--pi-space-4);
  border-radius: var(--pi-radius-lg);
  background: var(--pi-surface);
  border: 1px solid var(--pi-border);
  box-shadow: var(--pi-shadow-sm);
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
`;

const Name = styled.h2`
  margin: 0;
  font-family: var(--pi-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--pi-text);
`;

const Version = styled.span`
  font-family: var(--pi-mono);
  font-size: 0.9rem;
  color: var(--pi-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--pi-text-muted);
`;

const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pi-text-faint);
  font-weight: 700;
`;

const StatValue = styled.span`
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--pi-text);
  font-variant-numeric: tabular-nums;
`;

const StatValueRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RelativeTime = styled.span`
  font-size: 0.76rem;
  color: var(--pi-text-faint);
  font-weight: 500;
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const PlainLink = styled.a`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--pi-accent);
  text-decoration: none;
  &:hover {
    color: var(--pi-accent-strong);
    text-decoration: underline;
  }
`;

function cleanRepoUrl(url) {
  if (!url) return null;
  return url.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
}

export default function DetailsCard({ pkg, emphasizeVersion, onCompareWith, onSeeAlternatives }) {
  const repoUrl = cleanRepoUrl(pkg.repository);
  const animatedDownloads = useCountUp(pkg.weeklyDownloads ?? 0, 800);
  const animatedStars = useCountUp(pkg.github?.stars ?? 0, 800);
  const publishedRelative = formatRelativeTime(pkg.publishedAt);

  return (
    <Card>
      <Group>
        <TitleRow>
          <Name>{pkg.name}</Name>
          <Version>v{pkg.latestVersion || '?'}</Version>
        </TitleRow>
        {pkg.description && <Description>{pkg.description}</Description>}
        <DeprecatedBanner message={pkg.deprecated} />
      </Group>

      <InstallCommand name={pkg.name} />

      <StatRow>
        {emphasizeVersion && pkg.publishedAt && (
          <Stat>
            <StatLabel>Released</StatLabel>
            <StatValueRow>
              <StatValue>{formatDate(pkg.publishedAt)}</StatValue>
              {publishedRelative && <RelativeTime>{publishedRelative}</RelativeTime>}
            </StatValueRow>
          </Stat>
        )}
        <Stat>
          <StatLabel>Weekly downloads</StatLabel>
          <StatValueRow>
            <StatValue>{pkg.weeklyDownloads != null ? formatDownloads(animatedDownloads) : 'Unknown'}</StatValue>
            {pkg.downloadTrend && <Sparkline values={pkg.downloadTrend} />}
          </StatValueRow>
        </Stat>
        {!emphasizeVersion && pkg.publishedAt && (
          <Stat>
            <StatLabel>Last published</StatLabel>
            <StatValueRow>
              <StatValue>{formatDate(pkg.publishedAt)}</StatValue>
              {publishedRelative && <RelativeTime>{publishedRelative}</RelativeTime>}
            </StatValueRow>
          </Stat>
        )}
        {pkg.github?.stars != null && (
          <Stat>
            <StatLabel>GitHub stars</StatLabel>
            <StatValueRow>
              <StatValue>★ {formatCompactNumber(animatedStars)}</StatValue>
              {pkg.github.openIssues != null && <RelativeTime>{pkg.github.openIssues} open issues</RelativeTime>}
            </StatValueRow>
          </Stat>
        )}
      </StatRow>

      <Group>
        <CompatChips pkg={pkg} />
      </Group>

      <Group>
        <LinkRow>
          {pkg.homepage && (
            <PlainLink href={pkg.homepage} target="_blank" rel="noopener noreferrer">
              Homepage ↗
            </PlainLink>
          )}
          {repoUrl && (
            <PlainLink href={repoUrl} target="_blank" rel="noopener noreferrer">
              Repository ↗
            </PlainLink>
          )}
          <PlainLink href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noopener noreferrer">
            npmjs.com ↗
          </PlainLink>
        </LinkRow>
        <FollowUpBar onCompareWith={onCompareWith} onSeeAlternatives={onSeeAlternatives} />
      </Group>
    </Card>
  );
}
