export const theme = {
  colors: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      hover: '#4f46e5',
      active: '#4338ca'
    },
    secondary: {
      main: '#14b8a6',
      light: '#2dd4bf',
      dark: '#0d9488',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      hover: '#0d9488',
      active: '#0f766e'
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      hover: '#dc2626',
      active: '#b91c1c'
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      hover: '#d97706',
      active: '#b45309'
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      hover: '#059669',
      active: '#047857'
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    background: {
      default: '#f3f4f6',
      paper: '#ffffff',
      dark: '#111827',
      gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      glass: 'rgba(255, 255, 255, 0.8)'
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      disabled: '#9ca3af',
      inverse: '#ffffff'
    }
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0'
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02em',
      textTransform: 'none'
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.03em'
    }
  },
  spacing: (factor) => `${0.25 * factor}rem`,
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  zIndex: {
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  },
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    blur: 'blur(16px)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
  }
};

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: {
      default: '#111827',
      paper: '#1f2937',
      dark: '#030712',
      gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      glass: 'rgba(31, 41, 55, 0.8)'
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      disabled: '#6b7280',
      inverse: '#111827'
    }
  },
  glass: {
    ...theme.glass,
    background: 'rgba(31, 41, 55, 0.8)',
    border: '1px solid rgba(31, 41, 55, 0.18)',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
  }
};