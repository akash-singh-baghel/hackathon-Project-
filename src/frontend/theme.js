import { useEffect, useState } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';

// Scoped CSS custom properties — never written to :root, since this renders
// inside a host page's Dart Frame and must not leak styles either direction.
export const LIGHT_TOKENS = {
  '--pi-bg': '#f6f5f1',
  '--pi-surface': '#ffffff',
  '--pi-surface-sunken': '#edeae2',
  '--pi-border': '#e2ded2',
  '--pi-border-strong': '#cfc9b8',
  '--pi-text': '#1c1b16',
  '--pi-text-muted': '#59564a',
  '--pi-text-faint': '#8d897a',
  '--pi-accent': '#1d6b52',
  '--pi-accent-strong': '#154f3d',
  '--pi-accent-soft': '#e3efe8',
  '--pi-accent-on': '#ffffff',
  '--pi-danger': '#a83a3a',
  '--pi-danger-soft': '#f6e5e2',
  '--pi-focus-ring': 'rgba(29, 107, 82, 0.38)',
  '--pi-shadow-sm': '0 1px 2px rgba(30, 27, 18, 0.05)',
  '--pi-shadow-md': '0 1px 2px rgba(30, 27, 18, 0.04), 0 6px 16px -4px rgba(30, 27, 18, 0.1)',
  '--pi-radius-lg': '14px',
  '--pi-radius-md': '10px',
  '--pi-space-3': '14px',
  '--pi-space-4': '22px',
  '--pi-mono': "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
};

export const DARK_TOKENS = {
  '--pi-bg': '#14140f',
  '--pi-surface': '#1d1c16',
  '--pi-surface-sunken': '#121210',
  '--pi-border': '#312f24',
  '--pi-border-strong': '#433f2f',
  '--pi-text': '#f0eee4',
  '--pi-text-muted': '#bab6a3',
  '--pi-text-faint': '#827e6c',
  '--pi-accent': '#4cc998',
  '--pi-accent-strong': '#6fdbae',
  '--pi-accent-soft': '#1d3129',
  '--pi-accent-on': '#0c1f17',
  '--pi-danger': '#e08b84',
  '--pi-danger-soft': '#2f201d',
  '--pi-focus-ring': 'rgba(76, 201, 152, 0.4)',
  '--pi-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  '--pi-shadow-md': '0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 20px -6px rgba(0, 0, 0, 0.5)',
  '--pi-radius-lg': '14px',
  '--pi-radius-md': '10px',
  '--pi-space-3': '14px',
  '--pi-space-4': '22px',
  '--pi-mono': "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
};

function resolveMode(themeProp) {
  if (typeof themeProp === 'string') return themeProp === 'dark' ? 'dark' : 'light';
  if (themeProp?.mode) return themeProp.mode === 'dark' ? 'dark' : 'light';
  if (themeProp?.palette?.mode) return themeProp.palette.mode === 'dark' ? 'dark' : 'light';
  return null;
}

// hyperDart's own theme (light/dark/lightsOut, switched via the platform's
// UIOptions.themeName) is provided to every component as MUI theme context,
// not as a `theme` prop — `withHD` wraps children in an MUI `ThemeProvider`
// whose palette always carries this brand accent (#F05F40) regardless of
// mode, which is how we tell "a real hyperDart theme is active" apart from
// MUI's own unwrapped default (which also reports palette.mode: 'light',
// but never this accent). Trust it first; props.theme and the OS-level
// preference are fallbacks for contexts where that wrapper isn't present.
const HYPERDART_BRAND_ACCENT = '#F05F40';

function resolveHyperDartMode(muiTheme) {
  if (muiTheme?.palette?.primary?.main === HYPERDART_BRAND_ACCENT) {
    return muiTheme.palette.mode === 'dark' ? 'dark' : 'light';
  }
  return null;
}

export function useColorScheme(themeProp) {
  const muiTheme = useMuiTheme();
  const fromHyperDart = resolveHyperDartMode(muiTheme);
  const fromProp = resolveMode(themeProp);
  const [systemMode, setSystemMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    if (fromHyperDart || fromProp || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemMode(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [fromHyperDart, fromProp]);

  return fromHyperDart || fromProp || systemMode;
}

export function tokensFor(mode) {
  return mode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;
}
