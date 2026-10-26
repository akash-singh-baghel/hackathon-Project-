import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { normalizeSearchData } from './utils/searchData.js';
import { detectIntent } from './utils/intent.js';
import { usePackageExplorer } from './hooks/usePackageExplorer.js';
import { buildTakeaways } from './utils/takeaways.js';
import { formatDownloads, formatBytes } from './utils/format.js';
import { useColorScheme, tokensFor } from './theme.js';
import DetailsCard from './components/DetailsCard.jsx';
import CompareTable from './components/CompareTable.jsx';
import MetricBarChart from './components/MetricBarChart.jsx';
import ResultList from './components/ResultList.jsx';
import VersionCompareView from './components/VersionCompareView.jsx';
import FollowUpBar from './components/FollowUpBar.jsx';
import { LoadingState, NotFoundState, ErrorState, UnresolvedQueryState } from './components/StateViews.jsx';

// Some hosts (confirmed: the local hyperDart sandbox, when a typed query
// fails to resolve against its own known-package list) tear down and
// recreate the whole iframe rather than posting an update to the same one —
// destroying any in-memory React state, including refs. sessionStorage
// survives that because it's scoped to (origin, tab), not to the iframe
// element, so it's what actually lets "have we ever resolved real data"
// survive the reload. Falls back to in-memory-only if storage is blocked.
const RESOLVED_ONCE_KEY = 'pi:hasResolvedOnce';

function readHasResolvedOnce() {
  try {
    return sessionStorage.getItem(RESOLVED_ONCE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHasResolvedOnce() {
  try {
    sessionStorage.setItem(RESOLVED_ONCE_KEY, '1');
  } catch {
    // Storage unavailable (private browsing, sandboxed iframe) — the ref
    // still works for the lifetime of this mount, just not across a reload.
  }
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--pi-space-4);
  padding: var(--pi-space-4);
  background: var(--pi-bg);
  color: var(--pi-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  border-radius: var(--pi-radius-lg);
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;

  * {
    box-sizing: border-box;
  }

  ::selection {
    background: var(--pi-accent-soft);
    color: var(--pi-text);
  }

  button,
  a,
  input {
    font-family: inherit;
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--pi-focus-ring);
    outline-offset: 2px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--pi-text);
`;

// One coordinated cascade per view change — each direct child fades/rises in
// with a small stagger, rather than the whole block popping in as one flat
// unit or (worse) every individual element animating independently.
const Reveal = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--pi-space-4);

  > * {
    animation: pi-reveal 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  ${Array.from({ length: 8 })
    .map((_, i) => `> *:nth-of-type(${i + 1}) { animation-delay: ${i * 55}ms; }`)
    .join('\n')}

  @keyframes pi-reveal {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    > * {
      animation: none;
    }
  }
`;

const Takeaways = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TakeawayItem = styled.li`
  font-size: 0.82rem;
  color: var(--pi-text-muted);
  padding-left: 16px;
  position: relative;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--pi-accent);
  }
`;

const NotFoundList = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: var(--pi-text-faint);
`;

function titleFor(intent, data) {
  if (!data) return 'Package Info';
  switch (data.type) {
    case 'details':
      return data.pkg.name;
    case 'compare':
      return data.packages.map((p) => p.name).join(' vs ');
    case 'alternatives':
      return `Alternatives to ${data.seed.name}`;
    case 'use-case':
      return `Best for: ${data.need}`;
    case 'version-compare':
      return `${data.name} ${data.requested.join(' vs ')}`;
    default:
      return 'Package Info';
  }
}

function PackageExplorer(props) {
  const { query, entities } = useMemo(() => normalizeSearchData(props.searchData), [props.searchData]);
  const [intent, setIntent] = useState(() => detectIntent({ query, entities }));
  const hasResolvedOnce = useRef(readHasResolvedOnce());

  // The sandbox (and, per AGENTS.md, the platform itself) can deliver
  // searchData asynchronously after first mount — re-derive the intent
  // whenever the platform's own query/entities change, but leave it alone
  // when the change was a local follow-up action (Compare with…, etc.).
  //
  // Empty query+entities is ambiguous on its own: it's the expected shape of
  // the very first frame before any real data has arrived (show the loading
  // skeleton and wait), but it's *also* what the local sandbox sends back
  // when it fails to resolve a typed query against its own known-package
  // list — which would otherwise hang in that same loading skeleton forever.
  // Tracking whether we've ever resolved real data tells those two apart.
  useEffect(() => {
    const isEmpty = !query && entities.length === 0;
    if (isEmpty) {
      if (hasResolvedOnce.current) setIntent({ type: 'unresolved' });
      return;
    }
    hasResolvedOnce.current = true;
    writeHasResolvedOnce();
    setIntent(detectIntent({ query, entities }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(entities)]);

  const { status, data, error } = usePackageExplorer(intent);
  const mode = useColorScheme(props.theme);
  const tokens = tokensFor(mode);

  useEffect(() => {
    if (status === 'ready' || status === 'error' || status === 'not-found' || status === 'unresolved') {
      props?.messageHandlers?.componentLoaded();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToDetails = (name) => setIntent({ type: 'details', packageName: name });
  const compareWith = (name) => {
    if (intent.type === 'compare') {
      if (intent.packages.includes(name) || intent.packages.length >= 4) return;
      setIntent({ type: 'compare', packages: [...intent.packages, name] });
    } else if (intent.type === 'details') {
      setIntent({ type: 'compare', packages: [data.pkg.name, name] });
    }
  };
  const seeAlternatives = () => {
    if (intent.type === 'details') setIntent({ type: 'alternatives', packageName: data.pkg.name });
  };

  const takeaways = data?.type === 'compare' ? buildTakeaways(data.packages) : [];

  return (
    <Root style={tokens}>
      <Title>{titleFor(intent, data)}</Title>

      {status === 'loading' && <LoadingState />}
      {status === 'unresolved' && <UnresolvedQueryState />}
      {status === 'not-found' && <NotFoundState name={intent.packageName || intent.packages?.[0] || query} />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'ready' && data?.type === 'details' && (
        <Reveal key={data.pkg.name}>
          <DetailsCard
            pkg={data.pkg}
            emphasizeVersion={data.emphasizeVersion}
            onCompareWith={(name) => compareWith(name)}
            onSeeAlternatives={seeAlternatives}
          />
        </Reveal>
      )}

      {status === 'ready' && data?.type === 'compare' && (
        <Reveal key={data.packages.map((p) => p.name).join(',')}>
          {data.notFound.length > 0 && (
            <NotFoundList>Couldn't find on npm: {data.notFound.join(', ')}.</NotFoundList>
          )}
          <MetricBarChart
            title="Weekly downloads"
            packages={data.packages}
            getValue={(p) => p.weeklyDownloads}
            formatValue={formatDownloads}
            getSeries={(p) => p.downloadTrend}
          />
          <MetricBarChart
            title="Install size (gzipped)"
            packages={data.packages}
            getValue={(p) => p.size?.gzip ?? null}
            formatValue={formatBytes}
          />
          <CompareTable packages={data.packages} />
          {takeaways.length > 0 && (
            <Takeaways>
              {takeaways.map((line) => (
                <TakeawayItem key={line}>{line}</TakeawayItem>
              ))}
            </Takeaways>
          )}
          <FollowUpBar onCompareWith={compareWith} />
        </Reveal>
      )}

      {status === 'ready' && (data?.type === 'alternatives' || data?.type === 'use-case') && (
        <Reveal key={data.type === 'alternatives' ? data.seed.name : data.need}>
          {data.results.length === 0 ? (
            <NotFoundList>No close matches found. Try a more specific search.</NotFoundList>
          ) : (
            <ResultList results={data.results} onSelect={goToDetails} />
          )}
        </Reveal>
      )}

      {status === 'ready' && data?.type === 'version-compare' && (
        <Reveal key={data.name}>
          <VersionCompareView name={data.name} requested={data.requested} resolved={data.resolved} />
        </Reveal>
      )}
    </Root>
  );
}

export default PackageExplorer;
