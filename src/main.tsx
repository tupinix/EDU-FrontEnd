import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './styles/index.css';
import './i18n';

// EDU Cloud only: never load analytics on the Edge build (runs offline / on the
// customer's machine, must not phone home).
const isCloud = import.meta.env.VITE_EDU_EDITION !== 'edge';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    {isCloud && (
      <Analytics
        beforeSend={(event) => {
          // Redact sensitive parts of the URL before the event leaves the browser:
          // mask the share token in /view/:token and drop the query string.
          try {
            const u = new URL(event.url);
            u.pathname = u.pathname.replace(/\/view\/[^/]+/i, '/view/[token]');
            u.search = '';
            return { ...event, url: u.toString() };
          } catch {
            return event;
          }
        }}
      />
    )}
  </React.StrictMode>
);
