import { useMemo } from 'react';
import styled from '@emotion/styled';

const Svg = styled.svg`
  display: block;
  overflow: visible;
  flex-shrink: 0;
`;

// pathLength="100" asks the browser to normalize the path's length to 100
// units regardless of its real geometry, so the draw-in animation below is a
// fixed, simple dasharray/offset — no manual arc-length math needed.
const Line = styled.path`
  fill: none;
  stroke: var(--pi-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: pi-draw 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes pi-draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    stroke-dashoffset: 0;
  }
`;

const Area = styled.path`
  fill: var(--pi-accent);
  opacity: 0.1;
`;

export default function Sparkline({ values, width = 64, height = 22, delayMs = 0 }) {
  const { linePath, areaPath } = useMemo(() => {
    if (!values || values.length < 2) return { linePath: '', areaPath: '' };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (values.length - 1);
    const points = values.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1]);
    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    return { linePath: line, areaPath: `${line} L${width},${height} L0,${height} Z` };
  }, [values, width, height]);

  if (!linePath) return null;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Weekly downloads trend over the last 30 days"
    >
      <Area d={areaPath} />
      <Line d={linePath} pathLength="100" style={{ animationDelay: `${delayMs}ms` }} />
    </Svg>
  );
}
