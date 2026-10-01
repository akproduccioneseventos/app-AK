import type { AkAgentChatMessage, AkAgentChatSession, AkAgentType } from '@/types/multiagent';
import { readData } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

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

export function agregarTurno(
  state: ChatState,
  input: {
    sessionId?: string;
    agentType: AkAgentType;
    agentName: string;
    pathname?: string;
    fiestaId?: string;
    userMessage: string;
    assistantMessage: string;
  },
  timestamp = nowIso(),
): { state: ChatState; session: AkAgentChatSession } {
  const sessions = Array.isArray(state?.sessions) ? [...state.sessions] : [];

  const requestedIndex = input.sessionId
    ? sessions.findIndex((s) => s.id === input.sessionId)
    : -1;
  const index = requestedIndex >= 0 && isMultiAgentSessionScopeCompatible(
    sessions[requestedIndex],
    { agentType: input.agentType, fiestaId: input.fiestaId },
  )
    ? requestedIndex
    : -1;

  const baseSession: AkAgentChatSession = index >= 0
    ? sessions[index]
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

  const userMsg: AkAgentChatMessage = {
    id: createId('user'),
    role: 'user',
    content: input.userMessage,
    agentType: input.agentType,
    createdAt: timestamp,
  };

  const assistantMsg: AkAgentChatMessage = {
    id: createId('assistant'),
    role: 'assistant',
    content: input.assistantMessage,
    agentType: input.agentType,
    agentName: input.agentName,
    createdAt: timestamp,
  };

  const messages: AkAgentChatMessage[] = [
    ...baseSession.messages,
    userMsg,
    assistantMsg,
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

  if (index >= 0) sessions[index] = updated;
  else sessions.push(updated);

  const sessionsSorted = sessions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_SESSIONS);

  return {
    state: { sessions: sessionsSorted },
    session: updated,
  };
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
  let sessionResult: AkAgentChatSession | undefined;

  const resultado = await mutarDocumentoConTransaccion<ChatState>(
    CHAT_FILE,
    emptyState,
    (actual) => {
      const { state: nuevoState, session } = agregarTurno(actual ?? emptyState, input);
      sessionResult = session;
      return nuevoState;
    },
  );

  if (!resultado || !sessionResult) {
    throw new Error('[chat-store] No se pudo guardar el turno del chat.');
  }

  // Devolver la sesión actualizada desde el estado final persistido
  return resultado.sessions.find((s) => s.id === sessionResult!.id) ?? sessionResult;
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
