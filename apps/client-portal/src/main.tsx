import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createI18n } from '@esg/i18n';
import { App } from './App';
import './index.css';

const i18n = createI18n('en');
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {/* basename matches vite.config.ts's base: '/client/' — nginx
            serves this app's build output from under that path (plan §10). */}
        <BrowserRouter basename="/client">
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
