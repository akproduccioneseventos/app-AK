// DEBUG-EMBUDO-V7 - Types

export type ProspectSalesFunnelStage =
  | 'Prospecto'             // Initial stage
  | 'Contacto Iniciado'     // Attempted to contact
  | 'Contactado'            // Contact made
  | 'Reunión Programada'    // Meeting scheduled
  | 'Presupuesto Presentado'// Quote/proposal sent
  | 'Firmo Contrato'        // Deal WON - will convert to Customer
  | 'No Contrato';          // Deal LOST

// All possible stages, including terminal ones
export const ALL_PROSPECT_STAGES: ProspectSalesFunnelStage[] = [
  'Prospecto',
  'Contacto Iniciado',
  'Contactado',
  'Reunión Programada',
  'Presupuesto Presentado',
  'Firmo Contrato',
  'No Contrato',
];

// Active stages to be shown as columns in the sales funnel view
export const ACTIVE_FUNNEL_STAGES: Exclude<ProspectSalesFunnelStage, 'Firmo Contrato' | 'No Contrato'>[] = [
  'Prospecto',
  'Contacto Iniciado',
  'Contactado',
  'Reunión Programada',
  'Presupuesto Presentado',
];

export interface Prospecto {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string; 
  salesFunnelStage: ProspectSalesFunnelStage;
  nextMeetingDate?: string; // ISO string
  estimatedValue?: number; 
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Optional fields related to the event they are interested in
  tipoFiesta?: string; 
  salonDeseado?: string; 
  cantidadInvitados?: number;

  // Fields for potential conversion to Customer
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// Data type for creating a new prospect. Name is required, others are optional.
// salesFunnelStage will be set to 'Prospecto' by default in the server action.
export type NewProspectoData = Pick<Prospecto, 'name'> & Partial<Omit<Prospecto, 'id' | 'createdAt' | 'updatedAt' | 'salesFunnelStage'>>;
