import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface ActiveWindowInfo {
  isActive: boolean;
  daysDifference: number; // Positive if after event, negative if before
  phase: 'before' | 'during' | 'after';
}

/**
 * Checks if the current date is within the active window:
 * from 30 days before the event to 30 days after the event.
 */
export function isEventInActiveWindow(fechaEvento?: string): ActiveWindowInfo {
  if (!fechaEvento) {
    return { isActive: true, daysDifference: 0, phase: 'during' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(fechaEvento);
  eventDate.setHours(0, 0, 0, 0);

  // Difference in milliseconds
  const diffTime = today.getTime() - eventDate.getTime();
  // Difference in days
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const startWindow = new Date(eventDate.getTime() - thirtyDaysInMs);
  const endWindow = new Date(eventDate.getTime() + thirtyDaysInMs);

  const isActive = today >= startWindow && today <= endWindow;

  let phase: 'before' | 'during' | 'after' = 'during';
  if (today < startWindow) {
    phase = 'before';
  } else if (today > endWindow) {
    phase = 'after';
  }

  return {
    isActive,
    daysDifference: diffDays,
    phase,
  };
}

export interface ContractedDownloads {
  invitadoPhotos: boolean;
  videos: boolean;
  plataforma360: boolean;
  fotocabina: boolean;
  recuerdosAudio: boolean;
  recuerdosVideo: boolean;
}

/**
 * Determines which media types are contracted and available for download
 * based on the event's modules and digital zone settings.
 */
export function getContractedDownloads(
  fiesta: Pick<
    FiestaEnPlanificacion,
    'modulosContratados' | 'zonaDigitalAdolescentes' | 'socialGallerySettings' | 'buzonConfig'
  >,
): ContractedDownloads {
  const modulos = fiesta.modulosContratados;
  const zd = fiesta.zonaDigitalAdolescentes;

  const isFeatureEnabled = (featureId: string): boolean => {
    if (!zd || !zd.enabled) return false;
    const feat = zd.features?.find(f => f.id === featureId);
    return feat ? feat.enabled : false;
  };

  const hasMuroSocial = modulos?.muroSocial === true || isFeatureEnabled('muro_social');

  return {
    invitadoPhotos: hasMuroSocial,
    videos: hasMuroSocial || modulos?.videoVida === true || modulos?.fotografia === true,
    plataforma360: isFeatureEnabled('plataforma360'),
    fotocabina: isFeatureEnabled('fotocabina'),
    recuerdosAudio: fiesta.socialGallerySettings?.showDedications !== false || fiesta.buzonConfig?.enabled === true,
    recuerdosVideo: hasMuroSocial,
  };
}
