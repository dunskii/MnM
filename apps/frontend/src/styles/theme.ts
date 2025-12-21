import { createTheme } from '@mui/material/styles';

// Music 'n Me Brand Colors
// From Brand Guidelines
const brandColors = {
  primary: {
    main: '#4580E4',      // Blue - Primary brand color (R69 G128 B228)
    light: '#a3d9f6',     // Light blue
    dark: '#3899ec',      // Dark blue
  },
  secondary: {
    main: '#FFCE00',      // Yellow (R255 G206 B0) - Pantone 116 C
    light: '#FFE066',
    dark: '#E6B800',
  },
  accent: {
    mint: '#96DAC9',      // Mint/Teal (R150 G218 B201) - Pantone 571 C
    coral: '#FFAE9E',     // Pink/Coral (R255 G174 B158) - Pantone 169 C
    cream: '#FCF6E6',     // Cream/Beige (R252 G246 B230) - Pantone 7604 C
  },
  characters: {
    alice: '#FFB6C1',     // Pink - Preschool (Alice)
    steve: '#FFCE00',     // Yellow - Kids (Steve)
    liam: '#4580E4',      // Blue - Teens (Liam)
    floyd: '#96DAC9',     // Mint - Adult/Senior (Floyd)
  },
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary.main,
      light: brandColors.primary.light,
      dark: brandColors.primary.dark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary.main,
      light: brandColors.secondary.light,
      dark: brandColors.secondary.dark,
      contrastText: '#000000',
    },
    error: {
      main: '#ff4040',
    },
    warning: {
      main: '#FFAE9E', // Coral
    },
    info: {
      main: '#4580E4',
    },
    success: {
      main: '#96DAC9', // Mint
    },
    background: {
      default: '#ffffff',
      paper: '#FCF6E6', // Cream background for cards/panels
    },
    text: {
      primary: '#080808',
      secondary: '#9DA5AF',
    },
  },
  typography: {
    // Primary Font: Monkey Mayhem (playful, for headings)
    // Secondary Font: Avenir (clean, for body) - using Inter as fallback
    fontFamily: '"Inter", "Avenir", "Roboto", "SF Pro", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
      fontWeight: 700,
      fontSize: '3rem',
    },
    h2: {
      fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h3: {
      fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
      fontWeight: 600,
      fontSize: '2rem',
    },
    h4: {
      fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Soft, rounded edges (brand guideline)
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          // NO gradients or drop shadows (brand guideline)
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          // NO drop shadows (brand guideline) - use subtle border instead
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          // NO drop shadows (brand guideline)
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Export brand colors for use in components
export { brandColors };
