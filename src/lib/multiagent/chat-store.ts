import type { AkAgentChatMessage, AkAgentChatSession, AkAgentType } from '@/types/multiagent';
import { readData, writeData } from '@/lib/data-service';

const CHAT_FILE = 'multiagent/chats.json';
const MAX_SESSIONS = 160;
const MAX_MESSAGES_PER_SESSION = 80;

type ChatState = {
  sessions: AkAgentChatSession[];
};

const emptyState: ChatState = { sessions: [] };

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTitle(message: string, agentName: string) {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (!clean) return `Chat con ${agentName}`;
  return clean.length > 70 ? `${clean.slice(0, 67)}...` : clean;
}

export function isMultiAgentSessionScopeCompatible(
  session: Pick<AkAgentChatSession, 'agentType' | 'fiestaId'>,
  input: Pick<AkAgentChatSession, 'agentType' | 'fiestaId'>,
) {
  return session.agentType === input.agentType
    && (session.fiestaId || undefined) === (input.fiestaId || undefined);
}

async function readChatState(): Promise<ChatState> {
  const data = await readData<ChatState>(CHAT_FILE, emptyState);
  return {
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
  };
}

async function writeChatState(state: ChatState) {
  const sessions = [...state.sessions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_SESSIONS);

  await writeData(CHAT_FILE, { sessions });
}

export async function appendMultiAgentChatTurn(input: {
  sessionId?: string;
  agentType: AkAgentType;
  agentName: string;
  pathname?: string;
  fiestaId?: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<AkAgentChatSession> {
  const state = await readChatState();
  const timestamp = nowIso();
  const requestedIndex = input.sessionId
    ? state.sessions.findIndex(session => session.id === input.sessionId)
    : -1;
  const index = requestedIndex >= 0 && isMultiAgentSessionScopeCompatible(
    state.sessions[requestedIndex],
    { agentType: input.agentType, fiestaId: input.fiestaId },
  )
    ? requestedIndex
    : -1;

  const baseSession: AkAgentChatSession = index >= 0
    ? state.sessions[index]
    : {
        id: createId('chat'),
        agentType: input.agentType,
        agentName: input.agentName,
        title: normalizeTitle(input.userMessage, input.agentName),
        pathname: input.pathname,
        fiestaId: input.fiestaId,
        messages: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  const userMessage: AkAgentChatMessage = {
    id: createId('user'),
    role: 'user',
    content: input.userMessage,
    agentType: input.agentType,
    createdAt: timestamp,
  };

  const assistantMessage: AkAgentChatMessage = {
    id: createId('assistant'),
    role: 'assistant',
    content: input.assistantMessage,
    agentType: input.agentType,
    agentName: input.agentName,
    createdAt: timestamp,
  };

  const messages: AkAgentChatMessage[] = [
    ...baseSession.messages,
    userMessage,
    assistantMessage,
  ].slice(-MAX_MESSAGES_PER_SESSION);

  const updated: AkAgentChatSession = {
    ...baseSession,
    agentType: input.agentType,
    agentName: input.agentName,
    pathname: input.pathname ?? baseSession.pathname,
    fiestaId: input.fiestaId ?? baseSession.fiestaId,
    messages,
    updatedAt: timestamp,
  };

  if (index >= 0) state.sessions[index] = updated;
  else state.sessions.push(updated);

  await writeChatState(state);
  return updated;
}

export async function listMultiAgentChatSessions(input?: {
  agentType?: AkAgentType;
  fiestaId?: string;
  limit?: number;
}): Promise<AkAgentChatSession[]> {
  const state = await readChatState();
  const filtered = state.sessions.filter(session => {
    if (input?.agentType && session.agentType !== input.agentType) return false;
    if (input?.fiestaId && session.fiestaId !== input.fiestaId) return false;
    return true;
  });

  return filtered
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, input?.limit ?? 40);
}
