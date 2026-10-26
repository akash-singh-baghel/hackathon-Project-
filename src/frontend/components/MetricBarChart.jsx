import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useCountUp } from '../hooks/useCountUp.js';
import Sparkline from './Sparkline.jsx';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pi-text-faint);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(70px, 22%) 1fr auto;
  align-items: center;
  gap: 10px;
`;

const Label = styled.span`
  font-family: var(--pi-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--pi-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TrackCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Track = styled.div`
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: var(--pi-surface-sunken);
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: var(--pi-accent);
  width: ${(p) => p.pct}%;
  transition: width 650ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: ${(p) => p.delayMs}ms;
`;

const Value = styled.span`
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--pi-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/**
 * A labelled horizontal bar comparison, reused for both the downloads chart
 * and the size chart. Bars grow in from 0 (staggered per row) instead of
 * appearing at full width, and values count up rather than popping in —
 * one coordinated reveal per chart, not animation scattered per element.
 */
export default function MetricBarChart({ title, packages, getValue, formatValue, getSeries }) {
  const withData = packages.filter((p) => typeof getValue(p) === 'number');
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, [packages]);

  if (!withData.length) return null;

  const max = Math.max(...withData.map((p) => getValue(p)), 1);

  return (
    <Wrap>
      <Title>{title}</Title>
      {packages.map((p, i) => {
        const raw = getValue(p);
        return (
          <BarRow
            key={p.name}
            name={p.name}
            target={typeof raw === 'number' ? raw : 0}
            known={typeof raw === 'number'}
            pct={grown && typeof raw === 'number' ? Math.max((raw / max) * 100, 2) : 0}
            delayMs={i * 70}
            formatValue={formatValue}
            series={getSeries ? getSeries(p) : null}
          />
        );
      })}
    </Wrap>
  );
}

function BarRow({ name, target, known, pct, delayMs, formatValue, series }) {
  const animated = useCountUp(target, 700);

  return (
    <Row>
      <Label>{name}</Label>
      <TrackCell>
        <Track>
          <Fill pct={pct} delayMs={delayMs} />
        </Track>
        {series && <Sparkline values={series} delayMs={delayMs} />}
      </TrackCell>
      <Value>{known ? formatValue(animated) : 'Unknown'}</Value>
    </Row>
  );
}
