import type { AkPremiumSurface, AkPremiumTone } from './ak-premium-design-system';
import { buildAkPremiumStyleVars, buildAkPremiumTheme } from './ak-premium-design-system';

export type AkOperatorExperienceId =
  | 'liveWallStage'
  | 'moderationControl'
  | 'internalMissionControl'
  | 'crmPipeline'
  | 'eventPlanner'
  | 'financeDocuments';

export type AkOperatorVisualZone = {
  id: string;
  title: string;
  description: string;
  priority: number;
  density: 'compact' | 'balanced' | 'immersive';
  visualRule: string;
};

export type AkOperatorExperiencePreset = {
  id: AkOperatorExperienceId;
  surface: AkPremiumSurface;
  tone: AkPremiumTone;
  name: string;
  headline: string;
  mainGoal: string;
  layout: 'stage' | 'command-center' | 'pipeline' | 'workspace' | 'document-center';
  zones: AkOperatorVisualZone[];
  mustKeepSimple: string[];
};

export const AK_OPERATOR_EXPERIENCE_PRESETS: Record<AkOperatorExperienceId, AkOperatorExperiencePreset> = {
  liveWallStage: {
    id: 'liveWallStage',
    surface: 'liveWall',
    tone: 'neon',
    name: 'Muro Social Escenario',
    headline: 'La pantalla tiene que sentirse como show, no como una galería',
    mainGoal: 'Impactar en pantalla gigante y vender la experiencia AK sin vender directamente.',
    layout: 'stage',
    zones: [
      { id: 'heroMedia', title: 'Foto o video destacado', description: 'Contenido grande, limpio y con animación suave.', priority: 1, density: 'immersive', visualRule: 'Una imagen protagonista por vez cuando el modo sea destacado.' },
      { id: 'qr', title: 'QR visible', description: 'QR con CTA simple para subir fotos y participar.', priority: 2, density: 'balanced', visualRule: 'Siempre visible pero sin tapar contenido.' },
      { id: 'ranking', title: 'Ranking y sorteos', description: 'Resultados grandes, fáciles de leer desde lejos.', priority: 3, density: 'balanced', visualRule: 'Números grandes, pocos datos, alto contraste.' },
      { id: 'branding', title: 'Marca AK sutil', description: 'Frases cortas de valor AK entre slides.', priority: 4, density: 'compact', visualRule: 'Marca visible pero no invasiva.' },
    ],
    mustKeepSimple: ['No mostrar textos largos en pantalla gigante.', 'No usar tarjetas chicas con mucha información.', 'No mostrar contenido sin aprobación.'],
  },
  moderationControl: {
    id: 'moderationControl',
    surface: 'operator',
    tone: 'warning',
    name: 'Panel de Revisión del Operador',
    headline: 'Aprobar, ocultar y destacar en segundos',
    mainGoal: 'Que el operador controle la pantalla sin perder tiempo ni equivocarse.',
    layout: 'command-center',
    zones: [
      { id: 'pending', title: 'Pendientes primero', description: 'La cola pendiente debe ser lo primero que se ve.', priority: 1, density: 'balanced', visualRule: 'Estados por color y acciones rápidas.' },
      { id: 'preview', title: 'Vista previa grande', description: 'El operador tiene que ver cómo quedará en pantalla.', priority: 2, density: 'immersive', visualRule: 'Previsualización grande antes de aprobar pantalla.' },
      { id: 'actions', title: 'Acciones rápidas', description: 'Aprobar, ocultar, destacar y quitar de pantalla.', priority: 3, density: 'compact', visualRule: 'Botones claros con colores de riesgo.' },
    ],
    mustKeepSimple: ['No esconder acciones críticas.', 'No mezclar aprobados con pendientes sin filtro.', 'No permitir pantalla sin estado aprobado.'],
  },
  internalMissionControl: {
    id: 'internalMissionControl',
    surface: 'internal',
    tone: 'celebration',
    name: 'Mission Control AK',
    headline: 'La app interna tiene que ordenar el día de trabajo',
    mainGoal: 'Que secretaria y organizador sepan qué hacer hoy sin buscar en veinte módulos.',
    layout: 'command-center',
    zones: [
      { id: 'today', title: 'Hoy', description: 'Tareas, llamadas, pagos, reuniones y riesgos del día.', priority: 1, density: 'balanced', visualRule: 'Vista diaria con prioridades por color.' },
      { id: 'events', title: 'Fiestas activas', description: 'Estado visual de cada evento activo.', priority: 2, density: 'balanced', visualRule: 'Tarjetas con próximo paso y alerta principal.' },
      { id: 'alerts', title: 'Alertas', description: 'Pagos atrasados, contratos, tareas vencidas y módulos incompletos.', priority: 3, density: 'compact', visualRule: 'Alertas cortas, no párrafos largos.' },
    ],
    mustKeepSimple: ['No cargar el dashboard con todo.', 'No repetir métricas que no generan acción.', 'Todo bloque debe tener próximo paso.'],
  },
  crmPipeline: {
    id: 'crmPipeline',
    surface: 'internal',
    tone: 'neutral',
    name: 'CRM Visual Premium',
    headline: 'El embudo tiene que ser claro como tablero de ventas',
    mainGoal: 'Entender rápido quién está frío, caliente, por firmar o en riesgo.',
    layout: 'pipeline',
    zones: [
      { id: 'columns', title: 'Columnas limpias', description: 'Etapas bien separadas con colores suaves.', priority: 1, density: 'balanced', visualRule: 'Cada card muestra nombre, fecha, monto y próximo paso.' },
      { id: 'urgency', title: 'Urgencia visual', description: 'Fecha cercana, sin respuesta o pago pendiente.', priority: 2, density: 'compact', visualRule: 'Badges claros, no textos largos.' },
      { id: 'actions', title: 'Acciones de venta', description: 'WhatsApp, llamada, presupuesto y contrato.', priority: 3, density: 'compact', visualRule: 'Acciones rápidas por lead.' },
    ],
    mustKeepSimple: ['No mostrar todo el historial en la tarjeta.', 'No usar colores fuertes para todas las etapas.', 'Diferenciar riesgo real de información normal.'],
  },
  eventPlanner: {
    id: 'eventPlanner',
    surface: 'internal',
    tone: 'romantic',
    name: 'Planificador Visual de Fiesta',
    headline: 'Cada fiesta debe sentirse organizada y personalizada',
    mainGoal: 'Unir gastronomía, decoración, música, tareas, personal y cliente en una vista clara.',
    layout: 'workspace',
    zones: [
      { id: 'identity', title: 'Identidad del evento', description: 'Foto, color, homenajeado, fecha y estilo.', priority: 1, density: 'immersive', visualRule: 'Portada visual antes de módulos técnicos.' },
      { id: 'modules', title: 'Módulos por categoría', description: 'Gastronomía, decoración, música, personal y logística.', priority: 2, density: 'balanced', visualRule: 'Tarjetas por estado: listo, falta, riesgo.' },
      { id: 'clientTasks', title: 'Tareas del cliente', description: 'Separar lo interno de lo que debe hacer el cliente.', priority: 3, density: 'balanced', visualRule: 'Lenguaje simple, accionable y visible en portal.' },
    ],
    mustKeepSimple: ['No mezclar tareas internas con tareas del cliente.', 'No usar formularios largos como primera vista.', 'Mostrar avance por módulo.'],
  },
  financeDocuments: {
    id: 'financeDocuments',
    surface: 'internal',
    tone: 'success',
    name: 'Finanzas y Documentos Premium',
    headline: 'Dinero, contrato y documentos tienen que verse claros',
    mainGoal: 'Evitar dudas sobre pagos, saldo, contrato, presupuesto y vencimientos.',
    layout: 'document-center',
    zones: [
      { id: 'balance', title: 'Estado financiero', description: 'Total, pagado, saldo y próximo vencimiento.', priority: 1, density: 'balanced', visualRule: 'Números grandes y colores por estado.' },
      { id: 'documents', title: 'Documentos', description: 'Contrato, presupuesto, facturas y comprobantes.', priority: 2, density: 'balanced', visualRule: 'Botones de descargar, ver y subir.' },
      { id: 'risk', title: 'Riesgo de incumplimiento', description: 'Alertas de pagos atrasados o documentación faltante.', priority: 3, density: 'compact', visualRule: 'Rojo solo para riesgo real.' },
    ],
    mustKeepSimple: ['No ocultar saldo ni vencimientos.', 'No mezclar documentos con tareas generales.', 'Todo pago debe tener estado claro.'],
  },
};

export function getAkOperatorExperiencePreset(id: AkOperatorExperienceId): AkOperatorExperiencePreset {
  return AK_OPERATOR_EXPERIENCE_PRESETS[id];
}

export function getAkOperatorExperienceStyle(id: AkOperatorExperienceId) {
  const preset = getAkOperatorExperiencePreset(id);
  const theme = buildAkPremiumTheme({ surface: preset.surface, tone: preset.tone });
  return { theme, style: buildAkPremiumStyleVars(theme), className: theme.className };
}

export function getAkOperatorVisualZones(id: AkOperatorExperienceId): AkOperatorVisualZone[] {
  return [...getAkOperatorExperiencePreset(id).zones].sort((a, b) => a.priority - b.priority);
}

export function buildAkOperatorImplementationChecklist(id: AkOperatorExperienceId): string[] {
  const preset = getAkOperatorExperiencePreset(id);
  return [
    `${preset.name}: usar layout ${preset.layout}`,
    ...getAkOperatorVisualZones(id).map(zone => `${zone.priority}. ${zone.title}: ${zone.visualRule}`),
    ...preset.mustKeepSimple.map(rule => `Regla: ${rule}`),
  ];
}

export function getAkOperatorPriorityMap(): Record<AkOperatorExperienceId, string> {
  return Object.fromEntries(
    (Object.keys(AK_OPERATOR_EXPERIENCE_PRESETS) as AkOperatorExperienceId[]).map(id => [id, getAkOperatorVisualZones(id)[0]?.title ?? 'Sin prioridad'])
  ) as Record<AkOperatorExperienceId, string>;
}
