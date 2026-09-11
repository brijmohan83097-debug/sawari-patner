import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import 'leaflet/dist/leaflet.css';
import './index.css';

try {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary fallbackTitle="Sawari Partner Application" fallbackMessage="Application recovered safely from an unexpected state.">
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  }
} catch (error) {
  console.error('Fatal initialization error:', error);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="min-height: 100vh; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, sans-serif;">
        <div style="max-width: 400px; text-align: center; background: #18181b; border: 1px solid #27272a; padding: 24px; border-radius: 16px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Sawari Partner</h2>
          <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 16px;">Application encountered a startup issue and recovered.</p>
          <button onclick="window.location.reload()" style="background: #fbbf24; color: #09090b; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Reload Partner App</button>
        </div>
      </div>
    `;
  }
}
