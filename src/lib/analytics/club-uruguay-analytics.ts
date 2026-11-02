import { trackGaEvent } from '@/lib/analytics-ga';
import { MARKETING_CONSENT_STORAGE_KEY, parseMarketingConsent } from '@/lib/analytics/marketing-consent';

export type ClubGaAction =
  | 'interesClub'
  | 'espacioConsultado'
  | 'clickWhatsApp'
  | 'clickSimulador';

export interface ClubGaParams {
  espacio?: 'principal' | 'intimo';
  ubicacion?: string;
  salon?: string;
  cta?: string;
  [key: string]: unknown;
}

/**
 * Registra eventos de interacción en Club Uruguay en Google Analytics 4
 * ÚNICAMENTE si el usuario otorgó su consentimiento de marketing.
 * Parámetros estrictamente libres de PII (sin nombre, teléfono, email ni fecha).
 * Un clic NO es una cita ni reserva confirmada.
 */
export function trackClubEvent(action: ClubGaAction, params: ClubGaParams = {}): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawConsent = window.localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY);
    const consent = parseMarketingConsent(rawConsent);
    if (consent !== 'accepted') return false;

    // Filtro de seguridad: asegurar que nunca viajen datos personales
    const cleanParams: Record<string, unknown> = {
      category: 'ClubUruguay',
      salon: 'club-uruguay',
    };

    if (params.espacio) cleanParams.espacio = params.espacio;
    if (params.ubicacion) cleanParams.ubicacion = params.ubicacion;
    if (params.cta) cleanParams.cta = params.cta;

    trackGaEvent(action, cleanParams);
    return true;
  } catch {
    return false;
  }
}
