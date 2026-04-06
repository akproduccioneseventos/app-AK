export type WhatsAppProvider = 'twilio' | 'meta' | 'baileys';
export type WhatsAppMode = 'automatic' | 'semi-automatic' | 'manual';

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey: string;
  provider: WhatsAppProvider;
  mode: WhatsAppMode;
  messages: {
    welcome: string;
    offHours: string;
    followUp: string;
    farewell: string;
  };
  schedule: {
    days: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri']
    startTime: string; // '09:00'
    endTime: string; // '18:00'
  };
  integrations: {
    createCrmLead: boolean;
    sendMarketingFollowUp: boolean;
    logMessageHistory: boolean;
  };
}

export interface WhatsAppConversation {
  id: string;
  clientPhone: string;
  clientName: string;
  leadId?: string;
  status: 'active' | 'waiting_human' | 'closed';
  mode: 'bot' | 'human';
  messages: WhatsAppMessage[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    source: 'whatsapp';
    eventType?: string;
    interestedIn?: string[];
  };
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  from: 'client' | 'bot' | 'human';
  content: string;
  timestamp: string;
  read: boolean;
  mediaUrl?: string;
}

export interface WhatsAppStats {
  totalConversations: number;
  activeConversations: number;
  leadsGenerated: number;
  avgResponseTime: string;
  topQuestions: { question: string; count: number }[];
}
