
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

export type CustomerStatus = 'Actual' | 'Antiguo';
export const ALL_CUSTOMER_STATES: CustomerStatus[] = ['Actual', 'Antiguo'];

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
  estadoCliente?: CustomerStatus;
}

