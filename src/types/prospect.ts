
export type ProspectSalesFunnelStage =
  | 'Prospecto'             // Initial stage
  | 'Contacto Iniciado'     // Attempted to contact
  | 'Contactado'            // Contact made
  | 'Reunión Programada'    // Meeting scheduled
  | 'Presupuesto Presentado'// Quote/proposal sent
  | 'Firmo Contrato'        // Deal WON - will convert to Customer
  | 'No Contrato';          // Deal LOST

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
  source?: string; // How was this prospect acquired? (e.g., 'Referral', 'Website', 'Event')
  salesFunnelStage: ProspectSalesFunnelStage;
  nextMeetingDate?: string; // ISO string for storage, relevant for 'Reunión Programada'
  estimatedValue?: number; // Potential value of the deal
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Fields related to the event they are interested in
  tipoFiesta?: string; // e.g., 'Boda', 'Cumpleaños de 15', 'Evento Corporativo'
  salonDeseado?: string; // Preferred venue or type of venue
  cantidadInvitados?: number;

  // Optional fields that might be filled if converting from a more detailed source or later
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// Data needed to create a new prospect, some fields are optional
export type NewProspectoData = Pick<Prospecto, 'name'> & Partial<Omit<Prospecto, 'id' | 'createdAt' | 'updatedAt' | 'salesFunnelStage'>>;
