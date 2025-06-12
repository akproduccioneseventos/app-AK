
export type CustomerStatus = 'Actual' | 'Antiguo';
export const ALL_CUSTOMER_STATES: CustomerStatus[] = ['Actual', 'Antiguo'];

// Eliminamos SalesFunnelStage de Customer, ya que ahora se maneja en Prospecto.
// Si un Cliente necesita referencia a su origen de prospecto, se podría añadir un `prospectId`.
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
  taxId?: string; 
  estadoCliente?: CustomerStatus; // 'Actual' o 'Antiguo'
  // salesFunnelStage?: SalesFunnelStage; // Eliminado
}
