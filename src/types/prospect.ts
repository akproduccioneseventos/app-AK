
export type ProspectSalesFunnelStage =
  | 'Prospecto'
  | 'Contacto Iniciado'
  | 'Contactado'
  | 'Reunión Programada'
  | 'Presupuesto Presentado'
  | 'Firmo Contrato' // Anteriormente Contratado
  | 'No Contrato';    // Anteriormente No Contratado

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
  nextMeetingDate?: string;
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
