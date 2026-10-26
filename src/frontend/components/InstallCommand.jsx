import { useState } from 'react';
import styled from '@emotion/styled';

const MANAGERS = [
  { id: 'npm', label: 'npm', command: (name) => `npm install ${name}` },
  { id: 'yarn', label: 'yarn', command: (name) => `yarn add ${name}` },
  { id: 'pnpm', label: 'pnpm', command: (name) => `pnpm add ${name}` },
  { id: 'bun', label: 'bun', command: (name) => `bun add ${name}` },
];

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 2px;
`;

const Tab = styled.button`
  border: none;
  background: none;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--pi-mono);
  letter-spacing: 0.02em;
  color: ${(p) => (p.active ? 'var(--pi-accent)' : 'var(--pi-text-faint)')};
  border-bottom: 2px solid ${(p) => (p.active ? 'var(--pi-accent)' : 'transparent')};
  cursor: pointer;
`;

const CommandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--pi-radius-md);
  background: var(--pi-surface-sunken);
  border: 1px solid var(--pi-border);
`;

const Command = styled.code`
  font-family: var(--pi-mono);
  font-size: 0.82rem;
  color: var(--pi-text);
  overflow-x: auto;
  white-space: nowrap;
`;

const CopyButton = styled.button`
  flex-shrink: 0;
  border: 1px solid var(--pi-border);
  background: var(--pi-surface);
  color: ${(p) => (p.copied ? 'var(--pi-accent)' : 'var(--pi-text-muted)')};
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 650;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;

  &:hover {
    border-color: var(--pi-accent);
  }
`;

export default function InstallCommand({ name }) {
  const [managerId, setManagerId] = useState('npm');
  const [copied, setCopied] = useState(false);
  const manager = MANAGERS.find((m) => m.id === managerId);
  const command = manager.command(name);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context) —
      // the command is still fully visible and selectable, so this is a
      // silent degrade, not a broken feature.
    }
  };

  return (
    <Wrap>
      <Tabs role="tablist" aria-label="Package manager">
        {MANAGERS.map((m) => (
          <Tab key={m.id} active={m.id === managerId} onClick={() => setManagerId(m.id)} role="tab" aria-selected={m.id === managerId}>
            {m.label}
          </Tab>
        ))}
      </Tabs>
      <CommandRow>
        <Command>{command}</Command>
        <CopyButton onClick={copy} copied={copied}>
          {copied ? 'Copied' : 'Copy'}
        </CopyButton>
      </CommandRow>
    </Wrap>
  );
}
