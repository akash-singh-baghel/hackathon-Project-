import { useState } from 'react';
import styled from '@emotion/styled';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  border: 1px solid var(--pi-border);
  background: var(--pi-surface);
  color: var(--pi-text);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover {
    border-color: var(--pi-accent);
    background: var(--pi-accent-soft);
  }
`;

const InlineForm = styled.form`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const Input = styled.input`
  border: 1px solid var(--pi-border);
  background: var(--pi-surface);
  color: var(--pi-text);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.8rem;
  width: 150px;
`;

// "Compare with…" / "See alternatives" — the extra credit "follow-up actions
// without a new search" feature. These never hit the platform's query parser
// again; they just re-point this same component at a new intent.
export default function FollowUpBar({ onCompareWith, onSeeAlternatives }) {
  const [comparing, setComparing] = useState(false);
  const [value, setValue] = useState('');

  if (comparing) {
    return (
      <InlineForm
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onCompareWith(value.trim());
          setComparing(false);
          setValue('');
        }}
      >
        <Input
          autoFocus
          placeholder="package name…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => !value && setComparing(false)}
        />
        <ActionButton type="submit">Compare →</ActionButton>
      </InlineForm>
    );
  }

  return (
    <Row>
      {onCompareWith && <ActionButton onClick={() => setComparing(true)}>Compare with…</ActionButton>}
      {onSeeAlternatives && <ActionButton onClick={onSeeAlternatives}>See alternatives</ActionButton>}
    </Row>
  );
}
