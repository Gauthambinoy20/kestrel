import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

interface Props {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  subtitle?: string;
}

/** Top app bar: brand, optional subtitle, and the colour-mode toggle. */
export function Header({ mode, onToggleMode, subtitle }: Props): JSX.Element {
  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 800 }}>
          🦅 Kestrel
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton onClick={onToggleMode} aria-label="toggle colour mode" color="inherit">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
