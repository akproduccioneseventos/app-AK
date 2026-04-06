export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok';

export type ChannelProvider =
  // WhatsApp
  | 'twilio' | 'meta-whatsapp' | 'baileys'
  // Instagram
  | 'meta-instagram'
  // Facebook
  | 'meta-messenger'
  // TikTok
  | 'tiktok-business';

export interface ChannelConfig {
  id: ChannelType;
  enabled: boolean;
  name: string;
  icon: string;
  provider: ChannelProvider;
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  pageId?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  webhookVerifyToken?: string;
  mode: 'automatic' | 'semi-automatic' | 'manual';
  messages: {
    welcome: string;
    offHours: string;
    followUp: string;
    farewell: string;
  };
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  integrations: {
    createCrmLead: boolean;
    sendMarketingFollowUp: boolean;
    logMessageHistory: boolean;
  };
  status: 'not_configured' | 'configured' | 'active' | 'error';
  lastError?: string;
}

export interface MultiChannelConfig {
  channels: ChannelConfig[];
  globalMode: 'automatic' | 'semi-automatic' | 'manual';
  sharedSchedule: boolean;
  globalIntegrations: {
    createCrmLead: boolean;
    sendMarketingFollowUp: boolean;
    logMessageHistory: boolean;
  };
  globalSchedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

export interface ChannelConversation {
  id: string;
  channel: ChannelType;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  leadId?: string;
  status: 'active' | 'waiting_human' | 'closed';
  mode: 'bot' | 'human';
  messages: ChannelMessage[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    source: ChannelType;
    eventType?: string;
    interestedIn?: string[];
  };
}

export interface ChannelMessage {
  id: string;
  conversationId: string;
  from: 'client' | 'bot' | 'human';
  content: string;
  timestamp: string;
  read: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

export interface ChannelStats {
  channel: ChannelType;
  totalConversations: number;
  activeConversations: number;
  leadsGenerated: number;
  avgResponseTime: string;
  messagesThisMonth: number;
}
