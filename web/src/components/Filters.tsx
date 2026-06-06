import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { WorkMode } from '../types.js';
import type { FilterState } from '../filters.js';

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
}

/** The filter bar: free-text search, work mode, sponsorship and live toggles. */
export function Filters({ value, onChange }: Props): JSX.Element {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ md: 'center' }}
      sx={{ mb: 3 }}
    >
      <TextField
        label="Search role or company"
        size="small"
        value={value.query}
        onChange={(e) => {
          onChange({ ...value, query: e.target.value });
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 260 }}
      />
      <ToggleButtonGroup
        size="small"
        exclusive
        value={value.workMode}
        onChange={(_e, mode: WorkMode | 'all' | null) => {
          if (mode) onChange({ ...value, workMode: mode });
        }}
        aria-label="work mode filter"
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="remote">Remote</ToggleButton>
        <ToggleButton value="hybrid">Hybrid</ToggleButton>
        <ToggleButton value="onsite">On-site</ToggleButton>
      </ToggleButtonGroup>
      <FormControlLabel
        control={
          <Switch
            checked={value.sponsorshipOnly}
            onChange={(e) => {
              onChange({ ...value, sponsorshipOnly: e.target.checked });
            }}
          />
        }
        label="Sponsorship"
      />
      <FormControlLabel
        control={
          <Switch
            checked={value.liveOnly}
            onChange={(e) => {
              onChange({ ...value, liveOnly: e.target.checked });
            }}
          />
        }
        label="Live links"
      />
    </Stack>
  );
}
