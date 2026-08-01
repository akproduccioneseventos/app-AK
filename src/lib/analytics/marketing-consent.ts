export type MarketingConsent = 'accepted' | 'rejected' | 'unset';

export const MARKETING_CONSENT_STORAGE_KEY = 'ak_marketing_measurement_consent_v1';

const PUBLIC_MEASUREMENT_PREFIXES = [
  '/public',
  '/simulador-de-presupuesto',
  '/simulador-ia',
  '/presentacion-led/portafolio',
  '/blog',
  '/servicios',
  '/club-uruguay',
];

export function isMarketingMeasurementPath(pathname: string) {
  return pathname === '/' || PUBLIC_MEASUREMENT_PREFIXES.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

export function parseMarketingConsent(value: string | null): MarketingConsent {
  if (value === 'accepted' || value === 'rejected') return value;
  return 'unset';
}

export function sanitizeMeasurementId(value?: string) {
  const clean = value?.trim() || '';
  return /^[A-Za-z0-9_-]{3,40}$/.test(clean) ? clean : '';
}
