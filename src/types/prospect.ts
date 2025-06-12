
export type ProspectSalesFunnelStage =
  | 'Prospecto'          // Renombrado desde Lead
  | 'Contacto Iniciado'
  | 'Contactado'         // Renombrado desde Contactado y Calificando
  | 'Reunión Programada'
  | 'Presupuesto Presentado'
  | 'Firmo Contrato'     // Nueva etapa final (reemplaza Contratado/Contrato Firmado)
  | 'No Contrato';       // Nueva etapa final (reemplaza Descartado)

export const ALL_PROSPECT_STAGES: ProspectSalesFunnelStage[] = [
  'Prospecto',
  'Contacto Iniciado',
  'Contactado',
  'Reunión Programada',
  'Presupuesto Presentado',
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
  nextMeetingDate?: string; // ISO string for storage
  estimatedValue?: number;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tipoFiesta?: string;
  salonDeseado?: string;
  cantidadInvitados?: number;
}

export type NewProspectoData = Omit<Prospecto, 'id' | 'createdAt' | 'updatedAt'>;
