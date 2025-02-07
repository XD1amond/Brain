import { createGlobalStyle, keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :root {
    color-scheme: light dark;
    
    /* Custom Properties for Theme */
    --shadow-color: 0deg 0% 0%;
    --shadow-elevation-low:
      0px 0.5px 0.6px hsl(var(--shadow-color) / 0.07),
      0px 0.8px 1px -1.2px hsl(var(--shadow-color) / 0.07),
      0px 2px 2.5px -2.5px hsl(var(--shadow-color) / 0.07);
    --shadow-elevation-medium:
      0px 0.5px 0.6px hsl(var(--shadow-color) / 0.08),
      0px 1.6px 2px -0.8px hsl(var(--shadow-color) / 0.08),
      0px 4.1px 5.1px -1.7px hsl(var(--shadow-color) / 0.08),
      0px 10px 12.5px -2.5px hsl(var(--shadow-color) / 0.08);
    --shadow-elevation-high:
      0px 0.5px 0.6px hsl(var(--shadow-color) / 0.08),
      0px 2.8px 3.5px -0.4px hsl(var(--shadow-color) / 0.08),
      0px 5.3px 6.6px -0.7px hsl(var(--shadow-color) / 0.08),
      0px 8.9px 11.1px -1.1px hsl(var(--shadow-color) / 0.08),
      0px 14.7px 18.4px -1.4px hsl(var(--shadow-color) / 0.08),
      0px 23.9px 29.9px -1.8px hsl(var(--shadow-color) / 0.08),
      0px 37.5px 46.9px -2.1px hsl(var(--shadow-color) / 0.08),
      0px 57px 71.3px -2.5px hsl(var(--shadow-color) / 0.08);
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
    height: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily};
    background-color: ${props => props.theme.colors.background.default};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.5;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;

    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle at top right,
        ${props => props.theme.colors.primary.light}15,
        transparent 70%
      );
      pointer-events: none;
      z-index: -1;
    }
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    isolation: isolate;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    color: ${props => props.theme.colors.text.primary};
  }

  h1 { ${props => props.theme.typography.h1} }
  h2 { ${props => props.theme.typography.h2} }
  h3 { ${props => props.theme.typography.h3} }
  h4 { ${props => props.theme.typography.h4} }

  p {
    ${props => props.theme.typography.body1}
    margin-bottom: 1rem;
  }

  /* Links */
  a {
    color: ${props => props.theme.colors.primary.main};
    text-decoration: none;
    transition: ${props => props.theme.transitions.default};
    position: relative;

    &:hover {
      color: ${props => props.theme.colors.primary.dark};
    }

    &:focus-visible {
      outline: 2px solid ${props => props.theme.colors.primary.main};
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  /* Buttons */
  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
    ${props => props.theme.typography.button}
    transition: ${props => props.theme.transitions.default};

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &:focus-visible {
      outline: 2px solid ${props => props.theme.colors.primary.main};
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  /* Form Elements */
  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${props => props.theme.colors.primary.main};
    }
  }

  /* Glass Effect */
  .glass {
    background: ${props => props.theme.glass.background};
    backdrop-filter: ${props => props.theme.glass.blur};
    -webkit-backdrop-filter: ${props => props.theme.glass.blur};
    border: ${props => props.theme.glass.border};
    box-shadow: ${props => props.theme.glass.shadow};
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background.default};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.grey[400]};
    border-radius: ${props => props.theme.borderRadius.full};
    
    &:hover {
      background: ${props => props.theme.colors.grey[500]};
    }
  }

  /* Utility Classes */
  .fade-in {
    animation: ${fadeIn} 0.3s ease-out;
  }

  .shimmer {
    background: linear-gradient(90deg, 
      ${props => props.theme.colors.grey[200]} 25%,
      ${props => props.theme.colors.grey[300]} 37%, 
      ${props => props.theme.colors.grey[200]} 63%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
  }

  .pulse {
    animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Accessibility */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: ${props => props.theme.colors.primary.main};
    color: white;
    padding: 8px;
    z-index: 100;
    transition: ${props => props.theme.transitions.default};

    &:focus {
      top: 0;
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Dark Mode Adjustments */
  @media (prefers-color-scheme: dark) {
    body::before {
      background: radial-gradient(
        circle at top right,
        ${props => props.theme.colors.primary.dark}15,
        transparent 70%
      );
    }
  }

  /* Print Styles */
  @media print {
    body {
      background: none;
    }

    body::before {
      display: none;
    }

    .no-print {
      display: none;
    }
  }
`;