import { diasHastaEnUruguay } from '@/lib/utils';
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

  // Dias de calendario de Uruguay (positivo si el evento ya paso).
  const diffDays = 0 - diasHastaEnUruguay(fechaEvento);
  if (Number.isNaN(diffDays)) {
    return { isActive: true, daysDifference: 0, phase: 'during' };
  }

  const isActive = diffDays >= -30 && diffDays <= 30;

  let phase: 'before' | 'during' | 'after' = 'during';
  if (diffDays < -30) {
    phase = 'before';
  } else if (diffDays > 30) {
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
