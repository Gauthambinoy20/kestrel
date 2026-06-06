import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { buildTheme } from './theme.js';
import { loadScan } from './data.js';
import type { ScanResult } from './types.js';
import { Header } from './components/Header.js';
import { RunReport } from './components/RunReport.js';
import { Filters } from './components/Filters.js';
import { applyFilters, EMPTY_FILTERS, type FilterState } from './filters.js';
import { JobCard } from './components/JobCard.js';
import { LoadingView, ErrorView, EmptyView } from './components/StateView.js';

function initialMode(): 'light' | 'dark' {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('kestrel-mode') : null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** The Kestrel dashboard root. */
export function App(): JSX.Element {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    let active = true;
    loadScan()
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load scan data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleMode = (): void => {
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') localStorage.setItem('kestrel-mode', next);
      return next;
    });
  };

  const filtered = useMemo(
    () => (result ? applyFilters(result.ranked, filters) : []),
    [result, filters],
  );

  const subtitle = result ? result.selectedDomains.join(', ') : undefined;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header mode={mode} onToggleMode={toggleMode} {...(subtitle ? { subtitle } : {})} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading && <LoadingView />}
        {!loading && error && <ErrorView message={error} />}
        {!loading && !error && result && (
          <Box>
            <RunReport result={result} />
            <Filters value={filters} onChange={setFilters} />
            {filtered.length === 0 ? (
              <EmptyView message="No jobs match these filters." />
            ) : (
              <Stack spacing={2}>
                {filtered.map((job) => (
                  <JobCard key={`${job.rank}-${job.url}`} job={job} />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}
