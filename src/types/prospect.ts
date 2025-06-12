
export type ProspectSalesFunnelStage =
  | 'Prospecto' // Anteriormente Lead
  | 'Contacto Iniciado'
  | 'Contactado' // Anteriormente Contactado y Calificando
  | 'Reunión Programada'
  | 'Presupuesto Presentado'
  // | 'En Negociación' // Eliminada
  | 'Contratado' // Nueva etapa de conversión (reemplaza Contrato Firmado)
  | 'No Contratado'; // Nueva etapa para perdidos (reemplaza Descartado)

export const ALL_PROSPECT_STAGES: ProspectSalesFunnelStage[] = [
  'Prospecto',
  'Contacto Iniciado',
  'Contactado',
  'Reunión Programada',
  'Presupuesto Presentado',
  'Contratado',
  'No Contratado',
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
