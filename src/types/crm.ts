

export interface CrmLeadHistoryItem {
  stageId: string;
  stageName: string;
  timestamp: string;
}

export type CrmTimelineEventType =
  | 'stage_change'
  | 'meeting_scheduled'
  | 'note_added'
  | 'presupuesto_created'
  | 'contract_uploaded'
  | 'whatsapp_sent'
  | 'whatsapp_scheduled'
  | 'payment_reminder_sent'
  | 'lead_created';

export interface CrmTimelineItem {
  id: string;
  type: CrmTimelineEventType;
  timestamp: string;
  description: string;
  meta?: Record<string, string | number | boolean>;
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
  timeline?: CrmTimelineItem[];
  // Optional party details
  partyType?: string;
  venueName?: string;
  guestCount?: number;
  followUpDate?: string; // ISO Date string for follow-up or event estimate
  presupuestoId?: string; // ID of the linked budget
  presupuestoEstado?: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado'; // Denormalized status
  invoiceId?: string; // If the budget was invoiced
  budgetSource?: 'manual' | 'simulator';
  // Contact tracking
  lastContactedAt?: string; // ISO date string
  lastContactMethod?: 'whatsapp' | 'phone' | 'email' | 'in_person';
  // Ownership
  assignedTo?: string; // Empleado id or name
}

export type NewCrmLeadData = Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'presupuestoEstado' | 'invoiceId' >;
