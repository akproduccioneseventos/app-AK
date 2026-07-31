'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'ak-marketing-automation-check';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function MarketingAutomationTrigger() {
  useEffect(() => {
    // Browser automation validates navigation; it must not launch a real AI job.
    if (navigator.webdriver) return;

    const runWhenIdle = () => {
      const now = Date.now();
      try {
        const lastCheck = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
        if (Number.isFinite(lastCheck) && now - lastCheck < CHECK_INTERVAL_MS) return;
        window.localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Storage can be disabled by the browser; the server still applies its own due-date guard.
      }

      void fetch('/api/marketing/automation', { method: 'POST' })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        })
        .catch(error => {
          console.warn('[marketing-automation] No se pudo completar la revision en segundo plano.', error);
        });
    };

    const timeoutId = window.setTimeout(runWhenIdle, 8_000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
