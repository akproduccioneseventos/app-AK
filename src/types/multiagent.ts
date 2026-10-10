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
    type: 'none' | 'save_learning' | 'create_task' | 'complete_task' | 'create_reminder' | 'navigate' | 'create_lead' | 'draft_budget' | 'prepare_whatsapp' | 'add_guest' | 'create_incident' | 'agendar_reunion' | 'ver_mi_semana' | 'preparar_mail' | 'buscar_en_la_web' | 'cuanto_me_deben';
    data?: any;
  };
  error?: string;
  /** true cuando la IA no respondió y el texto es un resumen automático de los datos. */
  modoRespaldo?: boolean;
}

export interface AkPersistentMultiAgentOutput extends AkMultiAgentOutput {
  sessionId?: string;
  savedChat?: boolean;
}
