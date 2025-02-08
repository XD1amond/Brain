import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import App from './App';
import './styles/globals.css';

// Remove service workers if they exist
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      if (registrations.length) {
        for (let registration of registrations) {
          registration.unregister();
        }
      }
    });
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Layout>
              <App />
            </Layout>
          </ThemeProvider>
        </QueryClientProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Add error tracking for unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You could add error reporting service here
});

// Add performance monitoring
if ('performance' in window && 'measure' in window.performance) {
  window.addEventListener('load', () => {
    // Core Web Vitals
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      console.log('First Contentful Paint:', Math.round(fcp.startTime));
    }

    // Custom measurements
    performance.mark('app-loaded');
    performance.measure('app-load-time', 'navigationStart', 'app-loaded');
  });
}

// Add keyboard navigation helper
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('user-is-tabbing');
});