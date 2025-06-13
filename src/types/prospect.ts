// DEBUG-EMBUDO-V7 - Types (ahora Ventas)

export type ProspectSalesFunnelStage =
  | 'Consulto'
  | 'Agendo Entrevista'
  | 'Con Presupuesto'
  | 'Firmo Contrato'
  | 'No Contrato';

// Todas las etapas posibles para menús desplegables, validaciones, etc.
export const ALL_PROSPECT_STAGES: ProspectSalesFunnelStage[] = [
  'Consulto',
  'Agendo Entrevista',
  'Con Presupuesto',
  'Firmo Contrato',
  'No Contrato',
];

// Etapas que se mostrarán como COLUMNAS en el tablero de "Ventas"
export const ACTIVE_VENTAS_STAGES: ProspectSalesFunnelStage[] = [
  'Consulto',
  'Agendo Entrevista',
  'Con Presupuesto',
  'Firmo Contrato',
  'No Contrato',
];

export interface Prospecto {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  salesFunnelStage: ProspectSalesFunnelStage;
  nextMeetingDate?: string; // ISO string - Relevante para "Agendo Entrevista"
  estimatedValue?: number; // Relevante para "Con Presupuesto"
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Campos opcionales relacionados con el evento de interés
  tipoFiesta?: string;
  salonDeseado?: string;
  cantidadInvitados?: number;

  // Campos para posible conversión a Cliente
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contractNotes?: string;
}

export type NewProspectoData = Pick<Prospecto, 'name'> & Partial<Omit<Prospecto, 'id' | 'createdAt' | 'updatedAt' | 'salesFunnelStage'>>;
