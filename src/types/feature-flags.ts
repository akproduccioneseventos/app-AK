
export type ServiceTier = 'Básico' | 'Premium' | 'Elite';

export type FeatureModule =
  | 'guest_portal'
  | 'mission_control'
  | 'provider_portal'
  | 'digital_invitation'
  | 'live_wall'
  | 'payment_plans'
  | 'ai_assistant'
  | 'analytics_dashboard'
  | 'incident_management'
  | 'playbooks'
  | 'approvals';

export interface ModuleDefinition {
  id: FeatureModule;
  label: string;
  description: string;
  availableFrom: ServiceTier;
}

export const ALL_MODULES: ModuleDefinition[] = [
  {
    id: 'guest_portal',
    label: 'Portal del Invitado',
    description: 'Portal personalizado para que los invitados gestionen su asistencia y datos.',
    availableFrom: 'Premium',
  },
  {
    id: 'mission_control',
    label: 'Mission Control',
    description: 'Panel táctico de control del evento en tiempo real.',
    availableFrom: 'Premium',
  },
  {
    id: 'provider_portal',
    label: 'Portal de Proveedores',
    description: 'Acceso dedicado para que proveedores vean su parte del evento.',
    availableFrom: 'Elite',
  },
  {
    id: 'digital_invitation',
    label: 'Invitación Digital',
    description: 'Invitaciones digitales personalizadas con RSVP online.',
    availableFrom: 'Básico',
  },
  {
    id: 'live_wall',
    label: 'Muro en Vivo',
    description: 'Muro de fotos y mensajes en tiempo real durante el evento.',
    availableFrom: 'Premium',
  },
  {
    id: 'payment_plans',
    label: 'Plan de Pagos',
    description: 'Gestión de cuotas y recordatorios de pago al cliente.',
    availableFrom: 'Básico',
  },
  {
    id: 'ai_assistant',
    label: 'Asistente IA',
    description: 'Asistente de inteligencia artificial integrado.',
    availableFrom: 'Elite',
  },
  {
    id: 'analytics_dashboard',
    label: 'Dashboard Analítico',
    description: 'Panel ejecutivo con métricas de rentabilidad y conversión.',
    availableFrom: 'Premium',
  },
  {
    id: 'incident_management',
    label: 'Gestión de Incidentes',
    description: 'Registro y seguimiento de incidentes durante el evento.',
    availableFrom: 'Premium',
  },
  {
    id: 'playbooks',
    label: 'Playbooks',
    description: 'Automatizaciones y flujos de trabajo predefinidos.',
    availableFrom: 'Elite',
  },
  {
    id: 'approvals',
    label: 'Centro de Aprobaciones',
    description: 'Flujo de aprobación para cambios de presupuesto y menú.',
    availableFrom: 'Premium',
  },
];

export interface TierDefinition {
  tier: ServiceTier;
  label: string;
  description: string;
  color: string;
  modules: FeatureModule[];
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 'Básico',
    label: 'Básico',
    description: 'Funcionalidades esenciales para la gestión del evento.',
    color: 'slate',
    modules: ALL_MODULES.filter(m => m.availableFrom === 'Básico').map(m => m.id),
  },
  {
    tier: 'Premium',
    label: 'Premium',
    description: 'Funcionalidades avanzadas para una experiencia completa.',
    color: 'indigo',
    modules: ALL_MODULES.filter(m => m.availableFrom === 'Básico' || m.availableFrom === 'Premium').map(m => m.id),
  },
  {
    tier: 'Elite',
    label: 'Elite',
    description: 'Acceso total a todas las funcionalidades de la plataforma.',
    color: 'violet',
    modules: ALL_MODULES.map(m => m.id),
  },
];

export interface EventFeatureConfig {
  fiestaId: string;
  tier: ServiceTier;
  overrides: Partial<Record<FeatureModule, boolean>>;
  updatedAt: string;
}

export interface GlobalFeatureFlags {
  defaultTier: ServiceTier;
  tierOverrides: Record<string, EventFeatureConfig>;
  globalOverrides: Partial<Record<FeatureModule, boolean>>;
  updatedAt: string;
}
