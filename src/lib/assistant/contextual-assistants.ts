export type AssistantPersonaId =
  | 'secretaria'
  | 'contador'
  | 'marketing'
  | 'organizador'
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
    role: 'Secretaria y agenda',
    color: '#2563eb',
    routeMatchers: ['/customers', '/contabilidad/crm', '/calendario', '/fiestas/nueva/reuniones', '/portal-cliente'],
    focus: ['clientes', 'reuniones', 'agenda', 'seguimiento', 'mensajes'],
  },
  {
    id: 'contador',
    name: 'Martin Contable',
    shortName: 'Martin',
    role: 'Contabilidad y pagos',
    color: '#059669',
    routeMatchers: ['/invoices', '/empresa/contabilidad', '/contabilidad/comercial-360', '/pagos-rapidos', '/presupuestos'],
    focus: ['facturas', 'pagos', 'senas', 'presupuestos', 'rentabilidad'],
  },
  {
    id: 'marketing',
    name: 'Mia Marketing',
    shortName: 'Mia',
    role: 'Marketing y ventas',
    color: '#7c3aed',
    routeMatchers: ['/marketing', '/empresa/redes-sociales', '/club-uruguay', '/landing', '/simulador'],
    focus: ['campanas', 'redes', 'leads', 'Club Uruguay', 'conversion'],
  },
  {
    id: 'organizador',
    name: 'Bruno Organizador',
    shortName: 'Bruno',
    role: 'Organizacion de fiesta',
    color: '#d97706',
    routeMatchers: ['/fiestas/nueva', '/evento/actual', '/evento/social'],
    focus: ['tareas', 'cronograma', 'personal', 'proveedores', 'faltantes'],
  },
  {
    id: 'salones',
    name: 'Luna Salon y decoracion',
    shortName: 'Luna',
    role: 'Salones, 2D/3D y decoracion',
    color: '#be123c',
    routeMatchers: ['/empresa/salones', '/fiestas/nueva/decoracion', '/fiestas/nueva/invitados/layout'],
    focus: ['salones', 'diseno 2D/3D', 'decoracion', 'mesas', 'recorridos visuales'],
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
