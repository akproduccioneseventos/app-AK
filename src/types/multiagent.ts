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
  agentType: AkAgentType;
  agentName: string;
  action?: {
    type: 'none' | 'save_learning' | 'create_task' | 'create_reminder' | 'navigate';
    data?: unknown;
  };
  error?: string;
}
