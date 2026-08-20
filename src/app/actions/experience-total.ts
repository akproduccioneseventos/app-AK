'use server';

import type { FiestaEnPlanificacion, SocialGallerySettings, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import {
  defaultClientPortalSettings,
  defaultGuestExperienceSettings,
  defaultModulosContratados,
  defaultPrograma,
} from '@/lib/fiesta-defaults';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import { construirClavePorDefecto } from '@/lib/client-portal/clave-portal';
import { defaultZonaDigitalAdolescentesSettings } from '@/lib/zona-digital-adolescentes';
import { buildUltimateEventSystem } from '@/lib/experience-ak/ultimate-event-system';

import { requireAppSession } from '@/lib/auth/require-session';
function id(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function compactKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * La clave inicial del portal se arma con el nombre del cliente
 * (CLIENTEMARIAGONZALEZ), para que la recuerde sin anotarla. Es comoda pero
 * adivinable, asi que el portal lo obliga a cambiarla la primera vez que entra.
 *
 * Antes se armaba con el nombre del EVENTO, que es publico: quedaba adivinable
 * igual pero sin ningun momento en que el cliente eligiera la suya.
 */
function buildAccessKey(fiesta: FiestaEnPlanificacion) {
  const porNombre = construirClavePorDefecto(fiesta);
  if (porNombre) return porNombre;

  const base = compactKey(fiesta.configuracion?.nombreEvento || fiesta.id || 'fiesta-ak');
  return `${base || 'fiesta-ak'}-${String(fiesta.id).slice(-6)}`;
}

function mergeSocialSettings(fiesta: FiestaEnPlanificacion): SocialGallerySettings {
  const current: Partial<SocialGallerySettings> = fiesta.socialGallerySettings || {};
  return {
    enabled: true,
    title: current.title || `${fiesta.configuracion?.nombreEvento || 'Fiesta AK'} en vivo`,
    subtitle: current.subtitle || 'Subi fotos, mensajes, dedicatorias y participa desde el QR.',
    allowLikes: current.allowLikes ?? true,
    allowComments: current.allowComments ?? true,
    uploadsActive: current.uploadsActive ?? true,
    requireApproval: current.requireApproval ?? true,
    marketingTickerText: current.marketingTickerText || DEFAULT_MARKETING_TICKER_TEXT,
    marketingTickerEnabled: current.marketingTickerEnabled ?? true,
    ledMarqueeText: current.ledMarqueeText || 'Escanea el QR y participa en la experiencia AK',
    ledMarqueeEnabled: current.ledMarqueeEnabled ?? true,
    backgroundColor: current.backgroundColor || '#0f172a',
    accentColor: current.accentColor || '#dc2626',
    chatEnabled: current.chatEnabled ?? true,
    maxPhotos: current.maxPhotos ?? 400,
    maxPhotosPerPerson: current.maxPhotosPerPerson ?? 12,
    showAds: current.showAds ?? true,
    showSongRequests: current.showSongRequests ?? true,
    showPolls: current.showPolls ?? true,
    showDedications: current.showDedications ?? true,
    photoFrame: current.photoFrame ?? true,
    momentosActivos: current.momentosActivos || [],
    screenMode: current.screenMode || {
      enabled: true,
      loop: true,
      isPlaying: false,
      currentItemIndex: 0,
      playlist: [],
    },
    screenDarkMode: current.screenDarkMode ?? true,
    brand: {
      companyName: 'AK Producciones',
      instagramHandle: '@akproduccionesfiestasyeventos',
      facebookHandle: 'AK Producciones Eventos',
      landingUrl: 'https://akproducciones.uy',
      ctaText: 'Escanea, participa y comparti tu recuerdo.',
      ...(current.brand || {}),
    },
    audioRhythm: current.audioRhythm || {
      enabled: true,
      title: 'Modo pista AK',
      subtitle: 'Visuales audiorritmicas para baile, fotos y QR.',
      visualStyle: 'neon-bars',
      accentColor: '#ef4444',
      secondaryColor: '#ffffff',
      intensity: 72,
      showPhotos: true,
      showQr: true,
    },
    totemScreens: current.totemScreens || [],
    screenMediaLibrary: current.screenMediaLibrary || [],
    customMomentos: current.customMomentos || [],
    sorteoParticipantesRedes: current.sorteoParticipantesRedes || [],
    sorteoGanadores: current.sorteoGanadores || [],
  };
}

function mergeTasks(existing: Tarea[] | undefined): Tarea[] {
  const current = existing || [];
  const required: Array<Omit<Tarea, 'id' | 'completada'>> = [
    {
      texto: 'Probar QR unico inteligente',
      descripcion: 'Escanear el QR y validar entradas para invitado, cliente, staff, barra y pantalla.',
      asignadaA: 'Organizador',
      esPredeterminada: true,
    },
    {
      texto: 'Hacer prueba de fiesta completa',
      descripcion: 'Abrir portal cliente, portal invitado, muro social, barra, pantalla y paquete offline.',
      asignadaA: 'Organizador',
      esPredeterminada: true,
    },
    {
      texto: 'Preparar paquete offline',
      descripcion: 'Guardar o imprimir resumen, invitados, itinerario, personal, barra y links de pantalla.',
      asignadaA: 'Organizador',
      esPredeterminada: true,
    },
    {
      texto: 'Definir cierre post-fiesta',
      descripcion: 'Preparar galeria, testimonio, recuerdos, redes y aprendizaje para futuras fiestas.',
      asignadaA: 'Organizador',
      esPredeterminada: true,
    },
    {
      texto: 'Revisar briefing del agente de fiesta',
      descripcion: 'Usar datos reales de la fiesta para detectar faltantes antes del evento.',
      asignadaA: 'Organizador',
      esPredeterminada: true,
    },
  ];
  const normalized = new Set(current.map((task) => compactKey(task.texto)));
  const additions = required
    .filter((task) => !normalized.has(compactKey(task.texto)))
    .map((task) => ({ ...task, id: id('task_total'), completada: false }));
  return [...additions, ...current];
}

export async function getExperienceTotalReport(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
  return { success: true, report: buildUltimateEventSystem(fiesta), fiesta };
}

export async function activateUltimateEventSystem(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

  const accessKey = fiesta.clientPortalSettings?.accessKey || buildAccessKey(fiesta);
  const now = new Date().toISOString();
  const nextFiesta: FiestaEnPlanificacion = {
    ...fiesta,
    modulosContratados: {
      ...defaultModulosContratados,
      ...(fiesta.modulosContratados || {}),
      portalCliente: true,
      paginaWeb: true,
      invitados: true,
      checkin: true,
      muroSocial: true,
      enVivo: true,
      entretenimiento: true,
      barraTecnologica: true,
      pantallasTotem: true,
      zonaDigital: true,
      feedback: true,
      resumenImprimible: true,
    },
    clientPortalSettings: {
      ...defaultClientPortalSettings,
      ...(fiesta.clientPortalSettings || {}),
      enabled: true,
      accessKey,
      checklist: { visible: true, editable: true },
      itinerario: { visible: true },
      musica: { visible: true, editable: true },
      documentos: { visible: true },
      notasCliente: { visible: true, editable: true },
      invitados: { visible: true },
      paginaPublica: { visible: true },
      fotografiaYFilmacion: { visible: true },
      pagos: { visible: true },
      simuladorInvitados: { visible: true, minReductionPercent: 10, maxIncreasePercent: 30 },
      serviciosContratados: { visible: true },
      ubicacion: { visible: true },
      menu: { visible: true },
      faq: { visible: true },
      informarPago: { visible: true, editable: true },
    },
    guestExperienceSettings: {
      ...defaultGuestExperienceSettings,
      ...(fiesta.guestExperienceSettings || {}),
      enabled: true,
      showAkBranding: true,
      showLandingCta: true,
      showSocialCta: true,
      allowSongSuggestions: true,
      allowPhotoUpload: true,
      allowGuestPortal: true,
      showMenu: true,
    },
    guestPortalSettings: {
      showMural: true,
      showFotos: true,
      showInvitacionWeb: true,
      showMesaAsignada: true,
      showItinerario: true,
      showMusica: true,
      showRegalos: true,
      showCheckin: true,
      welcomeMessage: 'Bienvenido a la experiencia digital de la fiesta.',
      customBgColor: '#ffffff',
      customAccentColor: '#dc2626',
      ...(fiesta.guestPortalSettings || {}),
    },
    socialGallerySettings: mergeSocialSettings(fiesta),
    zonaDigitalAdolescentes: {
      ...defaultZonaDigitalAdolescentesSettings,
      ...(fiesta.zonaDigitalAdolescentes || {}),
      enabled: true,
      moderationRequired: true,
      showLeaderboard: true,
      showPoints: true,
      showEmojiBar: true,
      showSocialFollowGate: true,
      autoRotateOnScreens: true,
      syncWithMuroSocial: true,
      syncWithTotems: true,
      syncWithBarra: true,
      syncWithEntretenimiento: true,
      recapEnabled: true,
      updatedAt: now,
    },
    programa: fiesta.programa?.length ? fiesta.programa : defaultPrograma,
    tareas: mergeTasks(fiesta.tareas),
    others: {
      ...(fiesta.others || {}),
      experienciaTotalAk: {
        enabled: true,
        smartQrEnabled: true,
        testDriveEnabled: true,
        healthCenterEnabled: true,
        postEventAutoPlanEnabled: true,
        salesDemoEnabled: true,
        partyAgentEnabled: true,
        offlinePackEnabled: true,
        activatedAt: now,
      },
    },
  };

  const result = await saveFiesta(nextFiesta);
  if (!result.success) return { success: false, error: result.error || 'No se pudo guardar.' };

  return {
    success: true,
    fiesta: nextFiesta,
    report: buildUltimateEventSystem(nextFiesta),
  };
}
