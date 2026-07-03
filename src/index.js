import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/forms.css';
import App from './App';

// Global behavior: disable native number input increment via mouse wheel and arrow keys
if (typeof window !== 'undefined' && !window.__numberInputListenersInstalled) {
  // Prevent wheel from changing number inputs when focused
  document.addEventListener('wheel', function (e) {
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && active.type === 'number') {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent ArrowUp / ArrowDown from incrementing number inputs
  document.addEventListener('keydown', function (e) {
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && active.type === 'number') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    }
  });

  // Mark as installed so React StrictMode won't attach duplicates in dev
  window.__numberInputListenersInstalled = true;
}

// Cleanup routine for bloated localStorage keys (fixes QuotaExceededError on Vercel)
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('calibration_instruments_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} bloated calibration draft(s) from localStorage.`);
    }
  }
} catch (e) {
  console.warn('Failed to cleanup localStorage', e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
