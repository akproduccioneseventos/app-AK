export type AssistantPersonaId =
  | 'secretaria'
  | 'contador'
  | 'marketing'
  | 'organizador'
  | 'cliente'
  | 'invitados'
  | 'salones'
  | 'cto';

export interface AssistantPersona {
  id: AssistantPersonaId;
  name: string;
  shortName: string;
  role: string;
  color: string;
  avatarUrl?: string;
  routeMatchers: string[];
  focus: string[];
}

export interface AssistantPersonaOverrides {
  color?: string;
  avatarUrl?: string;
}

export type AssistantPersonaOverrideMap = Partial<Record<AssistantPersonaId, AssistantPersonaOverrides>>;

export const ASSISTANT_PERSONAS: AssistantPersona[] = [
  {
    id: 'secretaria',
    name: 'Sofia Secretaria',
    shortName: 'Sofia',
    role: 'Secretaria, agenda y recordatorios',
    color: '#2563eb',
    routeMatchers: ['/customers', '/contabilidad/crm', '/calendario', '/contabilidad/crm/agenda', '/fiestas/nueva/reuniones', '/settings/google-workspace'],
    focus: ['clientes', 'reuniones', 'Google Calendar', 'Gmail', 'seguimiento', 'mensajes'],
  },
  {
    id: 'contador',
    name: 'Martin Contable',
    shortName: 'Martin',
    role: 'Contabilidad, pagos y contratos',
    color: '#059669',
    routeMatchers: ['/invoices', '/empresa/contabilidad', '/contabilidad/comercial-360', '/pagos-rapidos', '/presupuestos', '/fiestas/nueva/gestion-documental'],
    focus: ['facturas', 'pagos', 'senas', 'presupuestos', 'contratos', 'aumento anual', 'saldo'],
  },
  {
    id: 'marketing',
    name: 'Mia Marketing',
    shortName: 'Mia',
    role: 'Marketing, ventas y pantallas LED',
    color: '#db2777',
    routeMatchers: ['/marketing', '/empresa/redes-sociales', '/club-uruguay', '/landing', '/simulador', '/simulador-ak', '/presentacion-led', '/galeria-led'],
    focus: ['campanas', 'redes', 'leads', 'Club Uruguay', 'presentacion LED', 'conversion', 'galeria'],
  },
  {
    id: 'organizador',
    name: 'Bruno Organizador',
    shortName: 'Bruno',
    role: 'Responsable general de fiesta',
    color: '#d97706',
    routeMatchers: ['/fiestas/nueva', '/evento/actual', '/evento/en-vivo', '/evento/logistica'],
    focus: ['tareas', 'cronograma', 'personal', 'proveedores', 'faltantes', 'riesgos'],
  },
  {
    id: 'cliente',
    name: 'Clara Cliente',
    shortName: 'Clara',
    role: 'Experiencia del cliente',
    color: '#7c3aed',
    routeMatchers: ['/portal', '/portal-cliente', '/fiestas/nueva/portal-cliente', '/settings/sincronizaciones'],
    focus: ['portal cliente', 'documentos', 'pagos', 'reuniones', 'tareas del cliente', 'uso desde celular'],
  },
  {
    id: 'invitados',
    name: 'Uma Invitados',
    shortName: 'Uma',
    role: 'Invitados, invitacion y muro social',
    color: '#0f766e',
    routeMatchers: ['/invitacion', '/invitado', '/evento/social', '/evento/muro-en-vivo', '/fiestas/nueva/muro-social', '/fiestas/nueva/modulo-invitado'],
    focus: ['invitacion web', 'RSVP', 'muro social', 'QR', 'canciones', 'fotos', 'mesa', 'experiencia de invitados'],
  },
  {
    id: 'salones',
    name: 'Luna Salon y decoracion',
    shortName: 'Luna',
    role: 'Salones, 2D/3D y decoracion',
    color: '#be123c',
    routeMatchers: ['/empresa/salones', '/fiestas/nueva/decoracion', '/fiestas/nueva/invitados/layout'],
    focus: ['salones', 'diseno 2D/3D', 'decoracion', 'mesas', 'recorridos visuales', 'Club Uruguay'],
  },
  {
    id: 'cto',
    name: 'Alex CTO',
    shortName: 'CTO',
    role: 'Sistema, backup y sincronizaciones',
    color: '#334155',
    routeMatchers: ['/settings', '/admin', '/auditoria', '/incidentes', '/playbooks'],
    focus: ['backup', 'sincronizaciones', 'errores', 'configuracion', 'lanzamiento'],
  },
];

export function getAssistantPersonaByPath(pathname: string): AssistantPersona {
  const normalized = pathname || '/';
  const directMatch = ASSISTANT_PERSONAS.find((persona) =>
    persona.routeMatchers.some((route) => normalized === route || normalized.startsWith(`${route}/`))
  );
  return directMatch || ASSISTANT_PERSONAS.find((persona) => persona.id === 'organizador') || ASSISTANT_PERSONAS[0];
}

export function applyAssistantPersonaOverrides(
  persona: AssistantPersona,
  overrides?: AssistantPersonaOverrideMap,
): AssistantPersona {
  const override = overrides?.[persona.id];
  return {
    ...persona,
    color: override?.color || persona.color,
    avatarUrl: override?.avatarUrl || persona.avatarUrl,
  };
}

export const ASSISTANT_PERSONA_STORAGE_KEY = 'ak-assistant-persona-overrides';
