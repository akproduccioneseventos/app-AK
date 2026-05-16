import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';
import { buildFiestaListaReport } from '@/lib/experience-ak/fiesta-lista';
import { getVisibleZonaDigitalFeatures, withZonaDigitalDefaults } from '@/lib/zona-digital-adolescentes';
import { buildAppHealthReport, buildEventExperienceAnalytics, type AppHealthReport, type EventExperienceAnalytics } from '@/lib/experience-ak/app-health';

export type UltimateFeatureId =
  | 'test-drive'
  | 'health'
  | 'smart-qr'
  | 'post-event'
  | 'sales-demo'
  | 'party-agent'
  | 'offline';

export type UltimateStatus = 'ready' | 'partial' | 'missing';

export type UltimateFeature = {
  id: UltimateFeatureId;
  title: string;
  promise: string;
  status: UltimateStatus;
  score: number;
  ready: string[];
  missing: string[];
  href: string;
  publicHref?: string;
};

export type SmartQrTarget = {
  id: string;
  label: string;
  description: string;
  href: string;
  audience: 'invitado' | 'cliente' | 'staff' | 'pantalla' | 'barra';
  priority: number;
};

export type TestDriveStep = {
  id: string;
  label: string;
  goal: string;
  href: string;
  expectedResult: string;
  required: boolean;
};

export type OfflinePackItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  critical: boolean;
};

export type AgentBriefItem = {
  id: string;
  title: string;
  message: string;
  severity: 'alta' | 'media' | 'baja';
  href: string;
};

export type UltimateEventSystemReport = {
  fiestaId: string;
  eventName: string;
  score: number;
  headline: string;
  features: UltimateFeature[];
  blockers: UltimateFeature[];
  smartQrTargets: SmartQrTarget[];
  testDriveSteps: TestDriveStep[];
  offlinePack: OfflinePackItem[];
  agentBrief: AgentBriefItem[];
  appHealth: AppHealthReport;
  experienceAnalytics: EventExperienceAnalytics;
  salesDemoScript: string[];
  postEventPlan: string[];
  generatedAt: string;
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function count(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  return 0;
}

function enabled(value: unknown): boolean {
  return value === true;
}

function withFiestaId(path: string, fiestaId: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function publicEventPath(path: string, fiestaId: string): string {
  return path.replace('[fiestaId]', encodeURIComponent(fiestaId));
}

function statusFromScore(score: number): UltimateStatus {
  if (score >= 85) return 'ready';
  if (score >= 45) return 'partial';
  return 'missing';
}

function feature(input: Omit<UltimateFeature, 'status'>): UltimateFeature {
  return {
    ...input,
    score: Math.max(0, Math.min(100, Math.round(input.score))),
    status: statusFromScore(input.score),
  };
}

export function buildSmartQrTargets(fiesta: FiestaEnPlanificacion): SmartQrTarget[] {
  const fiestaId = fiesta.id;
  const portalKey = fiesta.clientPortalSettings?.accessKey;

  return [
    {
      id: 'invitado',
      label: 'Invitado',
      description: 'Confirmar asistencia, ver datos, mesa, musica, fotos, retos y muro social.',
      href: publicEventPath('/evento/social/[fiestaId]', fiestaId),
      audience: 'invitado',
      priority: 1,
    },
    {
      id: 'cliente',
      label: 'Cliente',
      description: 'Abrir portal del cliente con pagos, documentos, invitados, tareas y datos de la fiesta.',
      href: portalKey ? `/portal/c/${encodeURIComponent(portalKey)}` : withFiestaId('/fiestas/nueva/portal-cliente', fiestaId),
      audience: 'cliente',
      priority: 2,
    },
    {
      id: 'staff',
      label: 'Equipo AK',
      description: 'Entrar al tablero operativo con tareas, responsables, logistica y checklist del evento.',
      href: withFiestaId('/fiestas/nueva/mission-control', fiestaId),
      audience: 'staff',
      priority: 3,
    },
    {
      id: 'pantalla',
      label: 'Pantalla gigante',
      description: 'Abrir muro en vivo, audiorritmico, fotos, mensajes y QR visible para la pista.',
      href: publicEventPath('/evento/muro-en-vivo/[fiestaId]', fiestaId),
      audience: 'pantalla',
      priority: 4,
    },
    {
      id: 'barra',
      label: 'Barra de tragos',
      description: 'Pantalla tactil de tragos y experiencia social de barra.',
      href: publicEventPath('/evento/barra/[fiestaId]', fiestaId),
      audience: 'barra',
      priority: 5,
    },
  ];
}

export function buildTestDriveSteps(fiesta: FiestaEnPlanificacion): TestDriveStep[] {
  const fiestaId = fiesta.id;
  return [
    {
      id: 'qr',
      label: 'Escanear QR unico',
      goal: 'Comprobar que una persona sin conocimientos entra y entiende que hacer.',
      href: publicEventPath('/q/[fiestaId]', fiestaId),
      expectedResult: 'Muestra entradas claras para invitado, cliente, staff, barra y pantalla.',
      required: true,
    },
    {
      id: 'cliente',
      label: 'Abrir experiencia cliente',
      goal: 'Validar que el cliente ve informacion, pagos, documentos y proximos pasos.',
      href: withFiestaId('/fiestas/nueva/portal-cliente', fiestaId),
      expectedResult: 'El cliente no necesita computadora ni explicacion tecnica.',
      required: true,
    },
    {
      id: 'invitado',
      label: 'Probar invitado',
      goal: 'Confirmar RSVP, mesa, musica, fotos y acciones principales desde celular.',
      href: withFiestaId('/fiestas/nueva/modulo-invitado', fiestaId),
      expectedResult: 'El invitado entiende la fiesta y participa sin ayuda.',
      required: true,
    },
    {
      id: 'social',
      label: 'Probar muro social',
      goal: 'Ver la pantalla que miran los invitados durante la fiesta.',
      href: withFiestaId('/fiestas/nueva/muro-social', fiestaId),
      expectedResult: 'Hay QR, fotos, moderacion, juegos, mensajes y modo pantalla.',
      required: true,
    },
    {
      id: 'barra',
      label: 'Probar barra tecnologica',
      goal: 'Ver carta interactiva, pedido de trago y pantalla de barman.',
      href: withFiestaId('/fiestas/nueva/barra-tecnologica', fiestaId),
      expectedResult: 'Invitado pide, barman recibe y queda una experiencia para compartir.',
      required: false,
    },
    {
      id: 'offline',
      label: 'Probar plan sin internet',
      goal: 'Tener un paquete operativo si internet falla.',
      href: withFiestaId('/fiestas/nueva/centro-total', fiestaId),
      expectedResult: 'Quedan links, lista critica y datos para operar con respaldo.',
      required: true,
    },
  ];
}

export function buildOfflinePack(fiesta: FiestaEnPlanificacion): OfflinePackItem[] {
  const fiestaId = fiesta.id;
  return [
    {
      id: 'resumen',
      label: 'Resumen imprimible',
      description: 'Datos clave para llevar impreso o guardado en el celular del responsable.',
      href: withFiestaId('/fiestas/nueva/resumen-imprimible', fiestaId),
      critical: true,
    },
    {
      id: 'invitados',
      label: 'Lista de invitados y check-in',
      description: 'Respaldo para ingreso si falla internet o el scanner.',
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
      critical: true,
    },
    {
      id: 'itinerario',
      label: 'Itinerario operativo',
      description: 'Orden de la noche con horarios, momentos y responsables.',
      href: withFiestaId('/fiestas/nueva/itinerario', fiestaId),
      critical: true,
    },
    {
      id: 'personal',
      label: 'Personal y roles',
      description: 'Quien hace que, a quien llamar y que rol cumple cada persona.',
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
      critical: true,
    },
    {
      id: 'barra',
      label: 'Carta y barra',
      description: 'Carta de tragos, pantalla tactil y respaldo para barman.',
      href: withFiestaId('/fiestas/nueva/barra-tecnologica', fiestaId),
      critical: false,
    },
    {
      id: 'pantalla',
      label: 'Pantallas y muro',
      description: 'Links para abrir pantalla LED, muro social, totems y zona digital.',
      href: withFiestaId('/fiestas/nueva/muro-social', fiestaId),
      critical: false,
    },
  ];
}

export function buildAgentBrief(fiesta: FiestaEnPlanificacion): AgentBriefItem[] {
  const fiestaId = fiesta.id;
  const prep = calculateFiestaPreparationScore(fiesta);
  const lista = buildFiestaListaReport(fiesta);
  const tasks = fiesta.tareas ?? [];
  const pendingTasks = tasks.filter((task) => !task.completada);
  const guests = fiesta.invitados ?? [];
  const confirmed = guests.filter((guest) => String(guest.rsvp || '').toLowerCase().includes('confirm')).length;
  const brief: AgentBriefItem[] = [];

  for (const check of prep.importantPending.slice(0, 4)) {
    brief.push({
      id: `prep-${check.id}`,
      title: check.label,
      message: check.detail,
      severity: 'alta',
      href: check.href || withFiestaId('/fiestas/nueva', fiestaId),
    });
  }

  for (const blocker of lista.blockers.slice(0, 4)) {
    if (brief.some((item) => item.href === blocker.href || item.title === blocker.title)) continue;
    brief.push({
      id: `lista-${blocker.id}`,
      title: blocker.title,
      message: blocker.detail,
      severity: blocker.priority === 'critica' ? 'alta' : blocker.priority === 'alta' ? 'media' : 'baja',
      href: blocker.href,
    });
  }

  if (pendingTasks.length > 0) {
    brief.push({
      id: 'tasks-pending',
      title: `${pendingTasks.length} tarea(s) pendiente(s)`,
      message: 'El agente debe revisar responsables, fechas y lo que puede destrabar antes de la fiesta.',
      severity: pendingTasks.length > 5 ? 'alta' : 'media',
      href: withFiestaId('/fiestas/nueva/tareas', fiestaId),
    });
  }

  if (guests.length > 0 && confirmed === 0) {
    brief.push({
      id: 'rsvp-empty',
      title: 'Invitados sin confirmaciones',
      message: 'Hay lista cargada, pero todavia no hay confirmados. Revisar RSVP, QR y mensajes.',
      severity: 'alta',
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
    });
  }

  return brief.slice(0, 10);
}

export function buildUltimateEventSystem(fiesta: FiestaEnPlanificacion): UltimateEventSystemReport {
  const fiestaId = fiesta.id;
  const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta AK';
  const prep = calculateFiestaPreparationScore(fiesta);
  const lista = buildFiestaListaReport(fiesta);
  const zonaDigital = withZonaDigitalDefaults(fiesta.zonaDigitalAdolescentes);
  const visibleZonaFeatures = getVisibleZonaDigitalFeatures(zonaDigital, fiesta.modulosContratados);
  const smartQrTargets = buildSmartQrTargets(fiesta);
  const testDriveSteps = buildTestDriveSteps(fiesta);
  const offlinePack = buildOfflinePack(fiesta);
  const agentBrief = buildAgentBrief(fiesta);
  const appHealth = buildAppHealthReport(fiesta);
  const experienceAnalytics = buildEventExperienceAnalytics(fiesta);
  const socialReady = enabled(fiesta.socialGallerySettings?.enabled) || enabled(fiesta.socialGallerySettings?.uploadsActive);
  const portalReady = enabled(fiesta.clientPortalSettings?.enabled) && (hasText(fiesta.clientPortalSettings?.accessKey) || count(fiesta.clientPortalSettings) > 0);
  const guestReady = count(fiesta.invitados) > 0 || enabled(fiesta.guestExperienceSettings?.allowGuestPortal);
  const screenReady = enabled(fiesta.socialGallerySettings?.screenMode?.enabled) || count(fiesta.screenPlaylist?.items) > 0;
  const postReady = enabled(fiesta.postEventoCompletado) || enabled(fiesta.galeriaEntregada) || hasText(fiesta.galeriaUrl);
  const offlineReady = count(fiesta.tareas) > 0 && count(fiesta.personalAsignado) > 0 && count(fiesta.programa) > 0;

  const features: UltimateFeature[] = [
    feature({
      id: 'test-drive',
      title: 'Modo Prueba de Fiesta',
      promise: 'Simular antes del evento lo que toca cliente, invitado, staff, barra, pantalla y offline.',
      score: Math.round((lista.score + prep.score) / 2),
      ready: ['Checklist de fiesta lista', 'Readiness operativo', 'Pasos de prueba generados'],
      missing: lista.blockers.slice(0, 4).map((item) => item.title),
      href: withFiestaId('/fiestas/nueva/centro-total', fiestaId),
    }),
    feature({
      id: 'health',
      title: 'Centro de Salud de la App',
      promise: 'Semaforo unico para revisar app, datos, backup, rutas publicas, PWA y sincronizaciones.',
      score: Math.round((prep.score + lista.score + appHealth.score) / 3),
      ready: [`Readiness ${prep.score}%`, `Fiesta lista ${lista.score}%`, `Salud app ${appHealth.score}%`],
      missing: [
        ...appHealth.checks.filter((check) => check.status !== 'ok').map((item) => item.label),
        ...prep.importantPending.map((item) => item.label),
        ...lista.blockers.map((item) => item.title),
      ].slice(0, 6),
      href: withFiestaId('/fiestas/nueva/readiness', fiestaId),
    }),
    feature({
      id: 'smart-qr',
      title: 'QR Unico Inteligente',
      promise: 'Un QR abre la entrada correcta para invitado, cliente, staff, pantalla o barra.',
      score: smartQrTargets.length >= 5 ? 100 : 60,
      ready: smartQrTargets.map((target) => target.label),
      missing: [],
      href: publicEventPath('/q/[fiestaId]', fiestaId),
      publicHref: publicEventPath('/q/[fiestaId]', fiestaId),
    }),
    feature({
      id: 'post-event',
      title: 'Post-fiesta Automatico',
      promise: 'Cerrar con recuerdos, galeria, testimonio, referidos y material para redes.',
      score: postReady ? 90 : socialReady ? 65 : 35,
      ready: [
        ...((hasText(fiesta.galeriaUrl) || enabled(fiesta.galeriaEntregada)) ? ['Galeria o entrega detectada'] : []),
        ...(socialReady ? ['Muro social preparado para recuerdos'] : []),
      ],
      missing: [
        ...(!postReady ? ['Falta marcar entrega/post-fiesta o galeria'] : []),
        ...(!socialReady ? ['Falta activar muro social para juntar recuerdos'] : []),
      ],
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
      publicHref: publicEventPath('/post-fiesta/[fiestaId]', fiestaId),
    }),
    feature({
      id: 'sales-demo',
      title: 'Modo Vendedor',
      promise: 'Mostrar en pantalla grande como se vive la tecnologia AK antes de contratar.',
      score: Math.round((([portalReady, guestReady, socialReady, screenReady, visibleZonaFeatures.length >= 4].filter(Boolean).length / 5) * 75) + Math.min(25, experienceAnalytics.estimatedExperienceScore * 0.25)),
      ready: [
        ...(portalReady ? ['Portal cliente demostrable'] : []),
        ...(guestReady ? ['Experiencia invitado demostrable'] : []),
        ...(socialReady ? ['Muro social demostrable'] : []),
        ...(screenReady ? ['Pantalla grande preparada'] : []),
        ...(visibleZonaFeatures.length >= 4 ? ['Zona digital vendible'] : []),
      ],
      missing: [
        ...(!portalReady ? ['Falta portal cliente activo'] : []),
        ...(!guestReady ? ['Falta experiencia invitado'] : []),
        ...(!socialReady ? ['Falta muro social activo'] : []),
        ...(!screenReady ? ['Falta pantalla grande'] : []),
        ...(visibleZonaFeatures.length < 4 ? ['Faltan experiencias digitales visibles'] : []),
      ],
      href: '/experiencia-ak',
    }),
    feature({
      id: 'party-agent',
      title: 'Agente de Fiesta Real',
      promise: 'El agente no inventa: mira la fiesta, detecta faltantes y propone proximas acciones.',
      score: agentBrief.length === 0 ? 95 : Math.max(35, 100 - agentBrief.length * 9),
      ready: agentBrief.length === 0 ? ['No hay alertas principales'] : ['Brief operativo generado desde datos reales'],
      missing: agentBrief.map((item) => item.title).slice(0, 5),
      href: withFiestaId('/fiestas/nueva/asistente', fiestaId),
    }),
    feature({
      id: 'offline',
      title: 'Modo Offline para Evento',
      promise: 'Preparar respaldo operativo por si internet, pantalla o scanner fallan.',
      score: offlineReady ? 85 : Math.round(([count(fiesta.tareas) > 0, count(fiesta.personalAsignado) > 0, count(fiesta.programa) > 0].filter(Boolean).length / 3) * 80),
      ready: offlinePack.filter((item) => item.critical).map((item) => item.label),
      missing: [
        ...(count(fiesta.tareas) === 0 ? ['Faltan tareas internas'] : []),
        ...(count(fiesta.personalAsignado) === 0 ? ['Falta personal asignado'] : []),
        ...(count(fiesta.programa) === 0 ? ['Falta itinerario/programa'] : []),
      ],
      href: withFiestaId('/fiestas/nueva/resumen-imprimible', fiestaId),
    }),
  ];

  const score = Math.round(features.reduce((sum, item) => sum + item.score, 0) / features.length);
  const blockers = features.filter((item) => item.status !== 'ready').sort((a, b) => a.score - b.score);

  return {
    fiestaId,
    eventName,
    score,
    headline: score >= 90
      ? 'La experiencia esta lista para venderse y operarse como sistema completo.'
      : score >= 70
        ? 'La experiencia esta muy cerca; conviene cerrar los puntos amarillos antes de mostrarla.'
        : 'Todavia hay piezas importantes para conectar antes de prometer una fiesta 100% tecnologica.',
    features,
    blockers,
    smartQrTargets,
    testDriveSteps,
    offlinePack,
    agentBrief,
    appHealth,
    experienceAnalytics,
    salesDemoScript: [
      'Abrir el modo vendedor y mostrar primero el resultado: una fiesta con tecnologia visible.',
      'Escanear el QR unico como invitado y mostrar que no necesita saber de informatica.',
      'Abrir portal cliente y remarcar pagos, documentos, invitados, musica y reuniones en un solo lugar.',
      'Mostrar muro social, totems, barra tecnologica y zona digital adolescente como parte de la noche.',
      'Cerrar con post-fiesta: recuerdos, galeria, testimonio y referidos.',
    ],
    postEventPlan: [
      'Recolectar mejores fotos y mensajes del muro social.',
      'Generar pagina de recuerdos con nombre de la fiesta y agradecimiento.',
      'Pedir testimonio al cliente con texto sugerido por el agente.',
      'Crear piezas para redes con hashtag, etiqueta AK y llamada a consulta.',
      'Guardar aprendizajes: preguntas repetidas, faltantes y mejoras para futuras fiestas.',
    ],
    generatedAt: new Date().toISOString(),
  };
}
