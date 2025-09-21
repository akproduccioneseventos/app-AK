
export interface CrmLeadHistoryItem {
  stageId: string;
  stageName: string;
  timestamp: string;
}

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
  email?: string;
  phone?: string;
  notes?: string;
  history?: CrmLeadHistoryItem[];
  // Optional party details
  partyType?: string;
  venueName?: string;
  guestCount?: number;
  followUpDate?: string; // ISO Date string for follow-up or event estimate
}

export type NewCrmLeadData = Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'history'>;
