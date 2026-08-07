import type { BuzonConfig, FiestaEnPlanificacion } from '@/types/fiesta';

export type EntertainmentModuleId =
  | 'fotocabina'
  | 'plataforma360'
  | 'bogue'
  | 'espejoMagicoFoto'
  | 'espejoMagicoFirma'
  | 'espejoMagicoIA'
  | 'totems'
  | 'capsulaTiempo';

export interface EntertainmentStationRuntimeConfig {
  id: EntertainmentModuleId;
  enabled: boolean;
  title: string;
  operatorName: string;
  deviceName: string;
  location: string;
  brandText: string;
  footerText: string;
  overlayName: string;
  accentColor: string;
  logoUrl: string;
  activeTemplateId: string;
  shareMessage: string;
  qrCallout: string;
  countdownSeconds: number;
  recordingDurationSeconds: number;
  reviewSeconds: number;
  maxRetakes: number;
  allowGuestRetake: boolean;
  autoPublish: boolean;
  consentRequired: boolean;
  captureModes: string[];
  deliveryChannels: string[];
}

export interface PublicEntertainmentEvent {
  id: string;
  eventName: string;
  eventDate: string;
  coverImageUrl: string;
  showBuzon: boolean;
  socialWallEnabled: boolean;
  welcomeAudioUrl?: string;
  buzonConfig?: BuzonConfig;
  socialLinks: {
    instagram?: string;
    facebook?: string;
  };
  station: EntertainmentStationRuntimeConfig;
}

const TITLES: Record<EntertainmentModuleId, string> = {
  fotocabina: 'Fotocabina',
  plataforma360: 'Plataforma 360',
  bogue: 'Bogue',
  espejoMagicoFoto: 'Espejo Magico Foto',
  espejoMagicoFirma: 'Espejo Magico Firma',
  espejoMagicoIA: 'Espejo Magico IA',
  totems: 'Totem Interactivo',
  capsulaTiempo: 'Capsula del Tiempo',
};

const COLORS: Record<EntertainmentModuleId, string> = {
  fotocabina: '#d97706',
  plataforma360: '#7c3aed',
  bogue: '#db2777',
  espejoMagicoFoto: '#059669',
  espejoMagicoFirma: '#db2777',
  espejoMagicoIA: '#c026d3',
  totems: '#0891b2',
  capsulaTiempo: '#e11d48',
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function safeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function isEntertainmentModuleId(value: string): value is EntertainmentModuleId {
  return value in TITLES;
}

export function getEntertainmentStationConfig(
  fiesta: FiestaEnPlanificacion,
  moduleId: EntertainmentModuleId
): EntertainmentStationRuntimeConfig {
  const stored = fiesta.others?.entretenimiento?.modules?.[moduleId] || {};
  const eventName = fiesta.configuracion?.nombreEvento || 'Evento AK';

  return {
    id: moduleId,
    enabled: stored.enabled !== false,
    title: stored.title || TITLES[moduleId],
    operatorName: stored.operatorName || '',
    deviceName: stored.deviceName || 'Dispositivo sin asignar',
    location: stored.location || 'Salon principal',
    brandText: stored.brandText || eventName,
    footerText: stored.footerText || 'AK Producciones',
    overlayName: stored.overlayName || `${eventName} - AK`,
    accentColor: safeColor(stored.accentColor, COLORS[moduleId]),
    logoUrl: stored.logoUrl || '',
    activeTemplateId: stored.activeTemplateId || '',
    shareMessage: stored.shareMessage || `Tu recuerdo de ${eventName} esta listo.`,
    qrCallout: stored.qrCallout || 'Escanea el QR para descargar tu recuerdo',
    countdownSeconds: clampNumber(stored.countdownSeconds, moduleId === 'plataforma360' ? 5 : 4, 2, 10),
    recordingDurationSeconds: clampNumber(
      stored.recordingDurationSeconds || stored.estimatedDurationSeconds,
      moduleId === 'plataforma360' ? 15 : 4,
      2,
      60
    ),
    reviewSeconds: clampNumber(stored.reviewSeconds, 20, 5, 120),
    maxRetakes: clampNumber(stored.maxRetakes, 2, 0, 10),
    allowGuestRetake: stored.allowGuestRetake !== false,
    autoPublish: stored.autoPublish === true,
    consentRequired: moduleId === 'espejoMagicoIA' ? stored.consentRequired !== false : false,
    captureModes: Array.isArray(stored.captureModes) ? stored.captureModes : [],
    deliveryChannels: Array.isArray(stored.deliveryChannels)
      ? stored.deliveryChannels
      : ['qr', 'galeria'],
  };
}

export function getPublicEntertainmentEvent(
  fiesta: FiestaEnPlanificacion,
  moduleId: EntertainmentModuleId
): PublicEntertainmentEvent {
  return {
    id: fiesta.id,
    eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
    eventDate: fiesta.configuracion?.fechaEvento || '',
    coverImageUrl:
      fiesta.invitacionConfig?.fotoPortada ||
      fiesta.guestPortalSettings?.coverImageUrl ||
      '',
    showBuzon: fiesta.guestPortalSettings?.showBuzon !== false,
    socialWallEnabled: fiesta.socialGallerySettings?.enabled !== false,
    welcomeAudioUrl: fiesta.buzonConfig?.welcomeAudioUrl || '',
    buzonConfig: fiesta.buzonConfig,
    socialLinks: {
      instagram: fiesta.guestExperienceSettings?.instagramUrl,
      facebook: fiesta.guestExperienceSettings?.facebookUrl,
    },
    station: getEntertainmentStationConfig(fiesta, moduleId),
  };
}

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function getEntertainmentGuestPath(
  fiestaId: string,
  moduleId: EntertainmentModuleId,
  accessToken?: string
) {
  switch (moduleId) {
    case 'fotocabina':
      return withQuery(`/evento/fotocabina/${fiestaId}`, { access: accessToken });
    case 'plataforma360':
      return withQuery(`/evento/plataforma-360/${fiestaId}`, { access: accessToken });
    case 'bogue':
      return withQuery(`/evento/bogue/${fiestaId}`, { access: accessToken });
    case 'espejoMagicoFoto':
      return withQuery(`/evento/espejo-magico/${fiestaId}`, { mode: 'foto', access: accessToken });
    case 'espejoMagicoFirma':
      return withQuery(`/evento/espejo-magico/${fiestaId}`, { mode: 'firma', access: accessToken });
    case 'espejoMagicoIA':
      return withQuery(`/evento/touchpix/${fiestaId}`, { access: accessToken });
    case 'totems':
      return withQuery(`/evento/totem/${fiestaId}/totem-1`, { access: accessToken });
    case 'capsulaTiempo':
      return withQuery(`/evento/buzon/${fiestaId}`, { access: accessToken });
  }
}

export function getEntertainmentOperatorPath(
  fiestaId: string,
  moduleId: EntertainmentModuleId,
  accessToken?: string
) {
  switch (moduleId) {
    case 'fotocabina':
      return withQuery(`/evento/fotocabina/${fiestaId}`, { role: 'operator', access: accessToken });
    case 'plataforma360':
      return withQuery(`/evento/plataforma-360/${fiestaId}`, { role: 'operator', access: accessToken });
    case 'bogue':
      return withQuery(`/evento/bogue/${fiestaId}`, { role: 'operator', access: accessToken });
    case 'espejoMagicoFoto':
      return withQuery(`/evento/espejo-magico/${fiestaId}`, {
        mode: 'foto',
        role: 'operator',
        access: accessToken,
      });
    case 'espejoMagicoFirma':
      return withQuery(`/evento/espejo-magico/${fiestaId}`, {
        mode: 'firma',
        role: 'operator',
        access: accessToken,
      });
    case 'espejoMagicoIA':
      return withQuery(`/evento/touchpix/${fiestaId}`, { role: 'operator', access: accessToken });
    default:
      return null;
  }
}
