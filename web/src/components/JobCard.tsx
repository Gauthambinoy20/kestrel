import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaidIcon from '@mui/icons-material/Paid';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import SchoolIcon from '@mui/icons-material/School';
import type { RankedJob } from '../types.js';
import { formatSalary, workModeLabel, ageLabel } from '../format.js';

function scoreColor(score: number): 'success' | 'warning' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'default';
}

/** A single ranked job, with score, provenance and feature annotations. */
export function JobCard({ job }: { job: RankedJob }): JSX.Element {
  const salary = formatSalary(job.annotations.salary);
  const age = ageLabel(job.annotations.ageDays);
  const applyUrl = job.final_url || job.url;

  return (
    <Card variant="outlined" sx={{ '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Tooltip title={`Score ${String(job.score)} / 100 · ${job.reason}`}>
            <Chip
              label={job.score}
              color={scoreColor(job.score)}
              aria-label={`score ${String(job.score)} out of 100`}
              sx={{ fontSize: '1rem', height: 40, minWidth: 48 }}
            />
          </Tooltip>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" noWrap title={job.title}>
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {job.company} · {job.location || '—'}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <Chip size="small" label={job.domain_label} variant="outlined" />
              <Chip size="small" label={workModeLabel(job.annotations.workMode)} />
              {job.link_ok && (
                <Chip size="small" color="success" icon={<VerifiedIcon />} label="Live" />
              )}
              {salary && <Chip size="small" color="secondary" icon={<PaidIcon />} label={salary} />}
              {job.annotations.visa.sponsorshipOffered && (
                <Chip size="small" color="info" icon={<FlightTakeoffIcon />} label="Sponsorship" />
              )}
              {job.annotations.visa.graduateFriendly && (
                <Chip size="small" color="info" icon={<SchoolIcon />} label="Graduate" />
              )}
              {age && <Chip size="small" variant="outlined" label={age} />}
            </Stack>
          </Box>
          <Button
            variant="contained"
            size="small"
            endIcon={<OpenInNewIcon />}
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
