import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { buildBackupReadinessReport } from '@/lib/backup/backup-health';

export type AppHealthStatus = 'ok' | 'warning' | 'critical';

export type AppHealthCheck = {
  id: string;
  label: string;
  status: AppHealthStatus;
  detail: string;
  href?: string;
};

export type EventExperienceAnalytics = {
  invitedGuests: number;
  confirmedGuests: number;
  rsvpRate: number;
  socialPosts: number;
  songRequests: number;
  liveMessages: number;
  activeDigitalFeatures: number;
  visibleClientPortalModules: number;
  estimatedExperienceScore: number;
};

export type AppHealthReport = {
  score: number;
  status: AppHealthStatus;
  checks: AppHealthCheck[];
};

function statusRank(status: AppHealthStatus) {
  return status === 'ok' ? 1 : status === 'warning' ? 0.55 : 0;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

function visiblePortalModuleCount(fiesta: FiestaEnPlanificacion): number {
  const settings = fiesta.clientPortalSettings;
  if (!settings) return 0;
  return Object.values(settings).filter((value) => value && typeof value === 'object' && (value as { visible?: boolean }).visible === true).length;
}

function activeDigitalFeatures(fiesta: FiestaEnPlanificacion): number {
  const zona = fiesta.zonaDigitalAdolescentes;
  return [
    bool(fiesta.socialGallerySettings?.enabled),
    bool(fiesta.socialGallerySettings?.uploadsActive),
    bool(fiesta.socialGallerySettings?.screenMode?.enabled),
    bool(fiesta.socialGallerySettings?.audioRhythm?.enabled),
    bool(fiesta.clientPortalSettings?.enabled),
    bool(fiesta.guestExperienceSettings?.allowGuestPortal),
    bool(fiesta.guestExperienceSettings?.allowPhotoUpload),
    bool(zona?.enabled),
    bool(zona?.syncWithMuroSocial),
    bool(zona?.syncWithTotems),
    bool(zona?.syncWithBarra),
    bool(zona?.syncWithEntretenimiento),
  ].filter(Boolean).length;
}

export function buildEventExperienceAnalytics(fiesta: FiestaEnPlanificacion): EventExperienceAnalytics {
  const guests = fiesta.invitados || [];
  const confirmedGuests = guests.filter((guest) => String(guest.rsvp || '').toLowerCase().includes('confirm')).length;
  const socialPosts = (fiesta.eventoEnVivo?.fotos || []).length;
  const songRequests = (fiesta.eventoEnVivo?.solicitudesCanciones || []).length;
  const liveMessages = (fiesta.eventoEnVivo?.mensajes || []).length;
  const activeFeatures = activeDigitalFeatures(fiesta);
  const portalModules = visiblePortalModuleCount(fiesta);
  const rsvpRate = guests.length ? Math.round((confirmedGuests / guests.length) * 100) : 0;

  const estimatedExperienceScore = Math.min(100, Math.round(
    (rsvpRate * 0.25)
    + Math.min(25, activeFeatures * 2.2)
    + Math.min(20, portalModules * 2)
    + Math.min(15, socialPosts * 6)
    + Math.min(10, songRequests * 4)
    + Math.min(5, liveMessages * 2)
  ));

  return {
    invitedGuests: guests.length,
    confirmedGuests,
    rsvpRate,
    socialPosts,
    songRequests,
    liveMessages,
    activeDigitalFeatures: activeFeatures,
    visibleClientPortalModules: portalModules,
    estimatedExperienceScore,
  };
}

export function buildAppHealthReport(fiesta: FiestaEnPlanificacion): AppHealthReport {
  const backup = buildBackupReadinessReport();
  const analytics = buildEventExperienceAnalytics(fiesta);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const googleWorkspaceReady = hasText(process.env.GOOGLE_CLIENT_ID) && hasText(process.env.GOOGLE_CLIENT_SECRET);
  const mailReady = hasText(process.env.GMAIL_CLIENT_ID) || hasText(process.env.GOOGLE_CLIENT_ID) || hasText(process.env.SMTP_HOST);
  const instagramReady =
    hasText(process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN) &&
    hasText(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID);
  const publicBaseReady = hasText(process.env.NEXT_PUBLIC_APP_URL) || hasText(process.env.NEXT_PUBLIC_BASE_URL) || process.env.NODE_ENV !== 'production';

  const checks: AppHealthCheck[] = [
    {
      id: 'firebase',
      label: 'Firebase configurado',
      status: hasText(projectId) ? 'ok' : 'warning',
      detail: hasText(projectId)
        ? `Proyecto detectado: ${projectId}.`
        : 'No se detecto proyecto Firebase en variables locales. En Firebase Hosting puede estar configurado por entorno.',
      href: '/settings/datos',
    },
    {
      id: 'backup',
      label: 'Backup cubre modulos criticos',
      status: backup.ready ? 'ok' : 'warning',
      detail: backup.ready
        ? `${backup.totalFiles} archivos registrados para backup.`
        : `${backup.areas.filter((area) => !area.ready).length} area(s) con archivos no registrados.`,
      href: '/settings/backup',
    },
    {
      id: 'google-workspace',
      label: 'Google Calendar / Gmail',
      status: googleWorkspaceReady ? 'ok' : 'warning',
      detail: googleWorkspaceReady
        ? 'Variables OAuth detectadas para Calendar/Gmail.'
        : 'La app tiene pantallas y acciones preparadas, pero faltan credenciales OAuth para sincronizacion real.',
      href: '/settings/google-workspace',
    },
    {
      id: 'mail',
      label: 'Recordatorios por mail',
      status: mailReady ? 'ok' : 'warning',
      detail: mailReady ? 'Configuracion de correo detectada.' : 'Falta configurar proveedor de correo para envios reales.',
      href: '/settings/google-workspace',
    },
    {
      id: 'instagram',
      label: 'Instagram Graph API',
      status: instagramReady ? 'ok' : 'warning',
      detail: instagramReady
        ? 'Token y cuenta comercial detectados para sincronizacion real.'
        : 'Falta conectar el token y la cuenta comercial; la app no usara publicaciones simuladas en produccion.',
      href: '/settings/contenido-publico',
    },
    {
      id: 'public-routes',
      label: 'Rutas publicas de experiencia',
      status: publicBaseReady ? 'ok' : 'warning',
      detail: 'QR unico, social, barra, portal y post-fiesta estan modelados como rutas publicas.',
      href: `/q/${encodeURIComponent(fiesta.id)}`,
    },
    {
      id: 'pwa',
      label: 'Instalable en PC y Android',
      status: 'ok',
      detail: 'Manifest y service worker quedan en el build; la app se puede instalar como PWA.',
      href: '/settings/instalar-app',
    },
    {
      id: 'experience-analytics',
      label: 'Analitica de experiencia',
      status: analytics.estimatedExperienceScore >= 70 ? 'ok' : analytics.estimatedExperienceScore >= 35 ? 'warning' : 'critical',
      detail: `Score de experiencia estimado: ${analytics.estimatedExperienceScore}%. RSVP ${analytics.rsvpRate}%, ${analytics.activeDigitalFeatures} funciones activas.`,
      href: `/fiestas/nueva/centro-total?fiestaId=${encodeURIComponent(fiesta.id)}`,
    },
  ];

  const score = Math.round((checks.reduce((sum, check) => sum + statusRank(check.status), 0) / checks.length) * 100);
  return {
    score,
    status: score >= 80 ? 'ok' : score >= 50 ? 'warning' : 'critical',
    checks,
  };
}
