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
  /** Cantidad de fotos por tanda (1 a 4, default 3). */
  fotosPorTanda?: number;
  /** Segundos de cuenta regresiva para la primera foto (default 10). */
  segundosCuentaRegresiva?: number;
  /** Marcos habilitados para la fiesta (subconjunto de 'none', 'golden', 'neon', 'flowers', 'ak_brand'). */
  marcosHabilitados?: string[];
  /**
   * Estilos de IA habilitados para esta fiesta, por id.
   *
   * Vacio significa "todos", que es como venia funcionando. Sirve para curar la
   * lista segun el evento: en un cumpleanos de nenes conviene ofrecer el
   * superheroe animado y la aventura jurasica, y no el agente secreto de
   * esmoquin. Ofrecer treinta y pico de estilos a un chico de siete tampoco
   * ayuda: elige mejor entre seis.
   */
  allowedTemplateIds: string[];
  enableBeautyFilter?: boolean;
  enableChromaKey?: boolean;
  fondoDePantalla?: string;
  virtualBackgroundUrl?: string;
  orientation?: 'vertical' | 'horizontal' | 'cuadrada';
}

export interface PublicEntertainmentEvent {
  id: string;
  eventName: string;
  eventDate: string;
  nombreAgasajado?: string;
  tipoCelebracion?: string;
  primaryColor?: string;
  coverImageUrl: string;
  imagenFondoUrl?: string;
  colorFondo?: string;
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
    /**
     * El consentimiento lo decide la fiesta, no el tipo de estacion.
     *
     * Antes estaba forzado: **para todas las estaciones que no fueran el Espejo
     * con IA se devolvia siempre `false`**, sin mirar lo guardado. O sea que el
     * ajuste existia en la pantalla del equipo, se podia marcar, se guardaba, y
     * **se tiraba a la basura antes de llegar a la estacion**. El operador creia
     * que le estaba pidiendo permiso al invitado y no se le pedia nada.
     *
     * Ahora: si la fiesta lo marco, se pide. Y el Espejo con IA lo sigue pidiendo
     * siempre, porque ahi la foto sale de la app para transformarse.
     */
    consentRequired: stored.consentRequired === true || moduleId === 'espejoMagicoIA',
    captureModes: Array.isArray(stored.captureModes) ? stored.captureModes : [],
    deliveryChannels: Array.isArray(stored.deliveryChannels)
      ? stored.deliveryChannels
      : ['qr', 'galeria'],
    allowedTemplateIds: Array.isArray(stored.allowedTemplateIds)
      ? stored.allowedTemplateIds.filter((id: unknown) => typeof id === 'string' && id.length > 0)
      : [],
    fotosPorTanda: clampNumber(stored.fotosPorTanda || stored.photosPerSession, 3, 1, 4),
    segundosCuentaRegresiva: clampNumber(stored.segundosCuentaRegresiva || stored.countdownSeconds, 10, 2, 30),
    marcosHabilitados: Array.isArray(stored.marcosHabilitados) && stored.marcosHabilitados.length > 0
      ? stored.marcosHabilitados
      : ['none', 'golden', 'neon', 'flowers', 'ak_brand'],
  };
}

export function getPublicEntertainmentEvent(
  fiesta: FiestaEnPlanificacion,
  moduleId: EntertainmentModuleId
): PublicEntertainmentEvent {
  const invDig = fiesta.invitacionDigital;
  const imagenFondoUrl =
    invDig?.cabecera?.imagenFondoUrl ||
    invDig?.cabecera?.videoFondoUrl ||
    fiesta.invitacionConfig?.fotoPortada ||
    fiesta.guestPortalSettings?.coverImageUrl ||
    '';

  const colorFondo =
    invDig?.cabecera?.paletaColores?.primary ||
    fiesta.invitacionConfig?.colorPrincipal ||
    fiesta.configuracion?.primaryColor ||
    '';

  return {
    id: fiesta.id,
    eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
    eventDate: fiesta.configuracion?.fechaEvento || '',
    nombreAgasajado: fiesta.configuracion?.nombreAgasajado || '',
    tipoCelebracion: fiesta.configuracion?.tipoCelebracion || '',
    primaryColor: fiesta.configuracion?.primaryColor || '',
    coverImageUrl:
      fiesta.invitacionConfig?.fotoPortada ||
      fiesta.guestPortalSettings?.coverImageUrl ||
      '',
    imagenFondoUrl,
    colorFondo,
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

/**
 * Estaciones donde la foto se imprime.
 *
 * El dueno lo confirmo el 19 de agosto de 2026: se imprime en la fotocabina, en la
 * plataforma 360 y en el 360 con inteligencia artificial. La barra NO imprime: ahi
 * la foto va a la pantalla grande y el invitado se la lleva en el celular.
 */
const ESTACIONES_QUE_IMPRIMEN: EntertainmentModuleId[] = [
  'fotocabina',
  'plataforma360',
  'espejoMagicoIA',
];

export function estacionImprime(moduleId: EntertainmentModuleId): boolean {
  return ESTACIONES_QUE_IMPRIMEN.includes(moduleId);
}

/**
 * La cola de impresion: la pantalla donde el que maneja la impresora ve las fotos
 * aprobadas y va marcando cual salio.
 *
 * Estaba hecha y no se llegaba desde ningun lado: habia que escribir la direccion a
 * mano.
 */
export function getEntertainmentPrintPath(
  fiestaId: string,
  moduleId: EntertainmentModuleId,
  accessToken?: string
): string | null {
  if (!estacionImprime(moduleId)) return null;
  return withQuery(`/evento/impresion/${fiestaId}`, { access: accessToken });
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
