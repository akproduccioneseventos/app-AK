'use client';

import { useEffect } from 'react';
import { runMarketingAutomationFromAdmin } from '@/app/actions/marketing-automation';

const STORAGE_KEY = 'ak-marketing-automation-check';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function MarketingAutomationTrigger() {
  useEffect(() => {
    const now = Date.now();
    try {
      const lastCheck = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
      if (Number.isFinite(lastCheck) && now - lastCheck < CHECK_INTERVAL_MS) return;
      window.localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // Storage can be disabled by the browser; the server still applies its own due-date guard.
    }

    void runMarketingAutomationFromAdmin({ force: false }).catch(error => {
      console.warn('[marketing-automation] No se pudo completar la revision en segundo plano.', error);
    });
  }, []);

  return null;
}
