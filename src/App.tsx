import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, AppBar, Toolbar } from '@mui/material';
import PenguIcon from '@mui/icons-material/Pets';
import MainLayout from '@/components/MainLayout';
import { logger } from '@/utils/logger';

// MUI 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  useEffect(() => {
    logger.info('PenguExec 앱 시작', {
      version: '0.1.0',
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    }, 'App');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <PenguIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              PenguExec
            </Typography>
            <Typography variant="body2">
              AI-Powered Jira Assistant
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <MainLayout />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;