import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ScanResult } from '../types.js';

function Stat({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 84 }}>
      <Typography variant="h5" fontWeight={700}>
        {value.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** A compact observability strip summarising the run's pipeline counts. */
export function RunReport({ result }: { result: ScanResult }): JSX.Element {
  const sources = result.debug.length;
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack
        direction="row"
        spacing={3}
        justifyContent="space-around"
        flexWrap="wrap"
        useFlexGap
      >
        <Stat label="ranked" value={result.ranked.length} />
        <Stat label="matched" value={result.matchedCount} />
        <Stat label="candidates" value={result.candidateCount} />
        <Stat label="quarantined" value={result.quarantinedCount} />
        <Stat label="sources" value={sources} />
      </Stack>
    </Paper>
  );
}
