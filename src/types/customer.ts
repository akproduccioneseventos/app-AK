
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
  
  // Party-related fields, now potentially mandatory at customer creation/edit
  partyDate?: string; // ISO string
  partyTime?: string; // e.g., "19:00 - 02:00"
  partyType?: string; // e.g., "Boda", "Cumpleaños de 15"
  guestCount?: number;
  venueName?: string; // Nombre del salón o lugar
  
  contractFileName?: string; 
  budgetFileName?: string; 
}
