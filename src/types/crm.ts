
export interface CrmStage {
  id: string;
  name: string; // e.g., "Etapa 1", "Lead Calificado"
  order: number; // To determine sequence
  // Tailwind classes for styling
  bgColor: string; // e.g., 'bg-blue-100'
  borderColor: string; // e.g., 'border-blue-500'
  textColor: string; // e.g., 'text-blue-700'
  headerBgColor: string; // e.g., 'bg-blue-500'
  headerTextColor: string; // e.g., 'text-white'
}

export interface CrmLead {
  id: string;
  name: string;
  currentStageId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Optional: podrías añadir un customerId si el lead se convierte y se vincula a un Customer existente
  // customerId?: string;
}

export type NewCrmLeadData = Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>;
