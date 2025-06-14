
export interface CrmStage {
  id: string;
  name: string; 
  order: number; 
  // Tailwind classes for styling
  bgColor: string; 
  borderColor: string; 
  textColor: string; 
  headerBgColor: string; 
  headerTextColor: string; 
  isConversionStage?: boolean; // Optional flag for special stages
}

export interface CrmLead {
  id: string;
  name: string;
  currentStageId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  email?: string; // Added for potential future use or capture during conversion
  phone?: string; // Added
  notes?: string; // Added
}

export type NewCrmLeadData = Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'phone' | 'notes'> & Partial<Pick<CrmLead, 'email' | 'phone' | 'notes'>>;
