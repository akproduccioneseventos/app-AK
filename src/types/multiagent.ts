export type AkAgentType =
  | 'secretaria'
  | 'fiesta'
  | 'fiestas_general'
  | 'contable'
  | 'marketing'
  | 'comercial'
  | 'central';

export type AkAgentMemoryScope = 'global' | 'fiesta' | 'modulo';

export interface AkAgentLearning {
  id: string;
  agentType: AkAgentType;
  scope: AkAgentMemoryScope;
  fiestaId?: string;
  module?: string;
  title: string;
  content: string;
  source: 'manual' | 'conversation' | 'event_closeout' | 'system';
  tags: string[];
  confidence: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface AkAgentMemoryProfile {
  id: string;
  agentType: AkAgentType;
  scope: AkAgentMemoryScope;
  fiestaId?: string;
  module?: string;
  displayName: string;
  description: string;
  summary: string;
  learnings: AkAgentLearning[];
  createdAt: string;
  updatedAt: string;
}

export interface AkMultiAgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AkAgentChatMessage extends AkMultiAgentMessage {
  id: string;
  agentType: AkAgentType;
  agentName?: string;
  createdAt: string;
}

export interface AkAgentChatSession {
  id: string;
  agentType: AkAgentType;
  agentName: string;
  title: string;
  pathname?: string;
  fiestaId?: string;
  messages: AkAgentChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AkMultiAgentInput {
  message: string;
  history: AkMultiAgentMessage[];
  pathname?: string;
  fiestaId?: string;
  agentType?: AkAgentType;
  imageDataUri?: string;
}

export interface AkMultiAgentOutput {
  success: boolean;
  response: string;
  fuente?: string;
  agentType: AkAgentType;
  agentName: string;
  action?: {
    type: 'none' | 'save_learning' | 'create_task' | 'create_reminder' | 'navigate' | 'create_lead' | 'draft_budget' | 'prepare_whatsapp';
    data?: any;
  };
  error?: string;
}

export interface AkPersistentMultiAgentOutput extends AkMultiAgentOutput {
  sessionId?: string;
  savedChat?: boolean;
}
