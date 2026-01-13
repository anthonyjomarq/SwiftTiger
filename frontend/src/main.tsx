import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { App } from './App';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, requestPersistentStorage } from '@/shared/utils/pwa';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Initialize PWA features (disabled for demo)
if (process.env.NODE_ENV === 'production' && import.meta.env.VITE_ENABLE_PWA === 'true' && 'serviceWorker' in navigator) {
  registerServiceWorker();
  setupInstallPrompt();
  requestPersistentStorage();
}