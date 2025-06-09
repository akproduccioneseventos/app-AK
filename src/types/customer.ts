
export type SalesFunnelStage = 
  | 'Lead' 
  | 'Contactado' 
  | 'Calificado' 
  | 'Propuesta Presentada' 
  | 'Negociación' 
  | 'Ganado' 
  | 'Perdido' 
  | 'En Espera';

export const ALL_SALES_FUNNEL_STAGES: SalesFunnelStage[] = [
  'Lead', 
  'Contactado', 
  'Calificado', 
  'Propuesta Presentada', 
  'Negociación', 
  'Ganado', 
  'Perdido', 
  'En Espera'
];

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  companyName?: string;
  taxId?: string; // e.g., VAT ID, CIF
  salesFunnelStage?: SalesFunnelStage;
}

