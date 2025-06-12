
export type ProspectSalesFunnelStage =
  | 'Lead'
  | 'Contacto Iniciado'
  | 'Contactado y Calificando'
  | 'Reunión Programada'
  | 'Presupuesto Presentado'
  | 'En Negociación'
  | 'Contrato Firmado' // Etapa de conversión
  | 'Descartado';

export const ALL_PROSPECT_STAGES: ProspectSalesFunnelStage[] = [
  'Lead',
  'Contacto Iniciado',
  'Contactado y Calificando',
  'Reunión Programada',
  'Presupuesto Presentado',
  'En Negociación',
  'Contrato Firmado',
  'Descartado',
];

export interface Prospecto {
  id: string;
  name: string; // Nombre del prospecto o contacto principal
  companyName?: string; // Nombre de la empresa si aplica
  email?: string;
  phone?: string;
  source?: string; // Origen del prospecto (ej: "Referido", "Web", "Evento")
  salesFunnelStage: ProspectSalesFunnelStage;
  nextMeetingDate?: string; // ISO date string, para "Reunión Programada"
  estimatedValue?: number; // Valor estimado del contrato/proyecto
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Campos que podrían ser útiles para la conversión a Customer
  taxId?: string; 
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  // Nuevos campos opcionales
  tipoFiesta?: string;
  salonDeseado?: string;
  cantidadInvitados?: number;
}

export type NewProspectoData = Omit<Prospecto, 'id' | 'createdAt' | 'updatedAt'>;

