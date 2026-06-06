import { createTheme, type Theme } from '@mui/material/styles';

/** Shared design tokens, then a light and dark theme built from them. */
const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
  },
} as const;

const KESTREL_AMBER = '#d98324';
const KESTREL_SLATE = '#2f6f8f';

/** Build the theme for a given mode. */
export function buildTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: KESTREL_SLATE },
      secondary: { main: KESTREL_AMBER },
      ...(mode === 'dark'
        ? { background: { default: '#0e1419', paper: '#161e26' } }
        : { background: { default: '#f4f6f8', paper: '#ffffff' } }),
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 16, transition: 'box-shadow 150ms, transform 150ms' },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}
