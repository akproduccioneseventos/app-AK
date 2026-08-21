import { idDeMedicionGoogle } from '@/lib/medicion/identificadores';

/** A que cuenta se mandan las visitas. El porque, en `identificadores.ts`. */
export const GA_MEASUREMENT_ID = idDeMedicionGoogle();

declare global {
  interface Window {
    gtag?: (...args: [string, ...unknown[]]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Tracks custom marketing events in Google Analytics (GA4).
 * Only fires if GA_MEASUREMENT_ID is configured in .env.local.
 */
export function trackGaEvent(
  action: string,
  params: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: unknown;
  } = {}
) {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) return;

  const { category, label, value, ...rest } = params;
  window.gtag('event', action, {
    event_category: category || 'marketing',
    event_label: label,
    value,
    ...rest,
  });
}
