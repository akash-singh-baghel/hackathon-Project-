import styled from '@emotion/styled';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: var(--pi-space-4);
  border-radius: var(--pi-radius-lg);
  background: var(--pi-surface);
  border: 1px solid var(--pi-border);
  box-shadow: var(--pi-shadow-sm);
`;

const Title = styled.p`
  margin: 0;
  font-weight: 650;
  color: var(--pi-text);
`;

const Sub = styled.p`
  margin: 0;
  font-size: 0.86rem;
  color: var(--pi-text-muted);
`;

const pulse = `
  background: linear-gradient(90deg, var(--pi-surface-sunken) 25%, var(--pi-border) 37%, var(--pi-surface-sunken) 63%);
  background-size: 400% 100%;
  animation: pi-shimmer 1.4s ease infinite;
  @keyframes pi-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
`;

export const SkeletonBlock = styled.div`
  border-radius: var(--pi-radius-md);
  ${pulse}
`;

export function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="Loading package data">
      <SkeletonBlock style={{ height: 120 }} />
      <SkeletonBlock style={{ height: 36, width: '60%' }} />
      <SkeletonBlock style={{ height: 36, width: '40%' }} />
    </div>
  );
}

export function NotFoundState({ name }) {
  return (
    <Wrap role="status">
      <Title>We couldn't find "{name}" on npm.</Title>
      <Sub>Check the spelling, or it may be a private / unpublished package.</Sub>
    </Wrap>
  );
}

export function UnresolvedQueryState() {
  return (
    <Wrap role="status">
      <Title>We couldn't tell which package you meant.</Title>
      <Sub>Try naming one directly — e.g. "npm react" or "compare express and fastify".</Sub>
    </Wrap>
  );
}

export function ErrorState({ message }) {
  return (
    <Wrap role="alert">
      <Title>Something went wrong reaching the npm registry.</Title>
      <Sub>{message || 'Please try again in a moment.'}</Sub>
    </Wrap>
  );
}
