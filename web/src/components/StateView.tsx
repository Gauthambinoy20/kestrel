import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SearchOffIcon from '@mui/icons-material/SearchOff';

/** Skeleton placeholders shown while a scan loads. */
export function LoadingView(): JSX.Element {
  return (
    <Stack spacing={2} aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={96} />
      ))}
    </Stack>
  );
}

/** Honest error state (e.g. no scan data present). */
export function ErrorView({ message }: { message: string }): JSX.Element {
  return (
    <Alert severity="warning" variant="outlined">
      <AlertTitle>No scan data</AlertTitle>
      {message} Run <code>kestrel scan --json &gt; web/public/scan.json</code> to populate the
      dashboard with real results.
    </Alert>
  );
}

/** Empty state when filters or a scan return nothing. */
export function EmptyView({ message }: { message: string }): JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <SearchOffIcon sx={{ fontSize: 48, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
}
