
export type ProspectSalesFunnelStage =
  | 'Prospecto'          // Etapa inicial (reemplaza a 'Lead')
  | 'Contacto Iniciado'  // Se ha intentado contactar
  | 'Contactado'         // Contacto realizado (reemplaza a 'Contactado y Calificando')
  | 'Reunión Programada' // Reunión agendada
  | 'Presupuesto Presentado' // Se envió presupuesto
  | 'Firmo Contrato'     // Etapa final: GANADO (reemplaza a 'Contratado' y 'Contrato Firmado')
  | 'No Contrato';       // Etapa final: PERDIDO (reemplaza a 'Descartado')

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
