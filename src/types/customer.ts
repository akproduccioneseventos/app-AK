
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
  taxId?: string; 
  estadoCliente?: CustomerStatus; // 'Actual' o 'Antiguo'
  contractFileName?: string; // Nuevo campo para el nombre del archivo del contrato
}
