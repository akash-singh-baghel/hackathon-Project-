import styled from '@emotion/styled';

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--pi-radius-md);
  background: var(--pi-danger-soft);
  border: 1px solid var(--pi-danger);
  color: var(--pi-danger);
  font-size: 0.82rem;
`;

export default function DeprecatedBanner({ message }) {
  if (!message) return null;
  return (
    <Banner role="alert">
      <strong style={{ flexShrink: 0 }}>Deprecated —</strong>
      <span>{message}</span>
    </Banner>
  );
}
