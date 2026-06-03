import type { AkAgentLearning, AkAgentMemoryProfile, AkAgentMemoryScope, AkAgentType } from '@/types/multiagent';
import { readData, writeData } from '@/lib/data-service';
import { AK_MANUAL_VERSION, getManualLearningSeed } from '@/lib/multiagent/manual-ak';

const MEMORY_FILE = 'multiagent/memory.json';
const MAX_LEARNINGS = 120; // Más memoria = mejor contexto

type MemoryState = {
  profiles: AkAgentMemoryProfile[];
};

const emptyState: MemoryState = { profiles: [] };

function nowIso() {
  return new Date().toISOString();
}

function buildProfileId(agentType: AkAgentType, scope: AkAgentMemoryScope, fiestaId?: string, module?: string) {
  if (scope === 'fiesta' && fiestaId) return `${agentType}:fiesta:${fiestaId}`;
  if (scope === 'modulo' && module) return `${agentType}:modulo:${module}`;
  return `${agentType}:global`;
}

function getDefaultProfile(agentType: AkAgentType, scope: AkAgentMemoryScope, fiestaId?: string, module?: string): AkAgentMemoryProfile {
  const id = buildProfileId(agentType, scope, fiestaId, module);
  const createdAt = nowIso();

  const names: Record<AkAgentType, string> = {
    secretaria: 'Secretaria AK',
    fiesta: 'Asistente de Fiesta',
    fiestas_general: 'Coordinador General de Fiestas',
    contable: 'Agente Contable AK',
    marketing: 'Agente de Marketing AK',
    comercial: 'Agente Comercial AK',
    central: 'Multiagente AK',
  };

  const descriptions: Record<AkAgentType, string> = {
    secretaria: 'Asistente personal del organizador: recordatorios, tareas, llamadas, pagos y seguimiento diario.',
    fiesta: 'Asistente especializado en una fiesta concreta: pendientes, puntos a revisar, decisiones y aprendizajes del evento.',
    fiestas_general: 'Agente que cruza todas las fiestas y aprende de los eventos terminados.',
    contable: 'Agente especializado en pagos, costos, saldos, rentabilidad y alertas financieras.',
    marketing: 'Agente especializado en redes, campañas, publicaciones, WhatsApp y estilo comercial de AK.',
    comercial: 'Agente especializado en leads, presupuestos, seguimientos y oportunidades de venta.',
    central: 'Router principal que decide qué agente debe responder según el contexto.',
  };

  const manualSeed = getManualLearningSeed(agentType);

  return {
    id,
    agentType,
    scope,
    fiestaId,
    module,
    displayName: names[agentType],
    description: descriptions[agentType],
    summary: `Memoria inicial basada en ${AK_MANUAL_VERSION}.\n${manualSeed.slice(0, 1200)}`,
    learnings: [],
    createdAt,
    updatedAt: createdAt,
  };
}

async function readMemoryState(): Promise<MemoryState> {
  const data = await readData<MemoryState>(MEMORY_FILE, emptyState);
  return {
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
  };
}

async function writeMemoryState(state: MemoryState) {
  await writeData(MEMORY_FILE, state);
}

export async function getAgentMemoryProfile(input: {
  agentType: AkAgentType;
  scope?: AkAgentMemoryScope;
  fiestaId?: string;
  module?: string;
}): Promise<AkAgentMemoryProfile> {
  const scope = input.scope ?? (input.fiestaId ? 'fiesta' : input.module ? 'modulo' : 'global');
  const id = buildProfileId(input.agentType, scope, input.fiestaId, input.module);
  const state = await readMemoryState();
  return state.profiles.find(profile => profile.id === id) ?? getDefaultProfile(input.agentType, scope, input.fiestaId, input.module);
}

export async function saveAgentLearning(input: {
  agentType: AkAgentType;
  scope?: AkAgentMemoryScope;
  fiestaId?: string;
  module?: string;
  title: string;
  content: string;
  tags?: string[];
  source?: AkAgentLearning['source'];
  confidence?: AkAgentLearning['confidence'];
}): Promise<AkAgentMemoryProfile> {
  const scope = input.scope ?? (input.fiestaId ? 'fiesta' : input.module ? 'modulo' : 'global');
  const state = await readMemoryState();
  const id = buildProfileId(input.agentType, scope, input.fiestaId, input.module);
  const index = state.profiles.findIndex(profile => profile.id === id);
  const profile = index >= 0
    ? state.profiles[index]
    : getDefaultProfile(input.agentType, scope, input.fiestaId, input.module);

  const timestamp = nowIso();
  const learning: AkAgentLearning = {
    id: `learning_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentType: input.agentType,
    scope,
    fiestaId: input.fiestaId,
    module: input.module,
    title: input.title.trim() || 'Aprendizaje sin título',
    content: input.content.trim(),
    source: input.source ?? 'manual',
    tags: input.tags ?? [],
    confidence: input.confidence ?? 'medium',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Deduplicar por título idéntico reciente (últimos 10) para evitar ruido
  const titleKey = learning.title.toLowerCase().trim();
  const isDuplicate = profile.learnings.slice(0, 10).some(
    l => l.title.toLowerCase().trim() === titleKey
  );

  // Ordenar por confianza: high > medium > low, luego por fecha
  const CONF_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const merged = isDuplicate
    ? profile.learnings
    : [learning, ...profile.learnings];
  const sorted = merged
    .sort((a, b) => {
      const cDiff = (CONF_ORDER[b.confidence] ?? 1) - (CONF_ORDER[a.confidence] ?? 1);
      if (cDiff !== 0) return cDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, MAX_LEARNINGS);

  // Resumen inteligente: priorizar high confidence, luego recientes
  const summaryItems = sorted
    .filter(l => l.confidence === 'high' || l.source === 'event_closeout' || l.source === 'system')
    .slice(0, 5);
  const recentItems = sorted
    .filter(l => !summaryItems.includes(l))
    .slice(0, 5);
  const summaryText = [...summaryItems, ...recentItems]
    .slice(0, 8)
    .map(l => `• [${l.confidence}] ${l.title}: ${l.content.slice(0, 200)}`)
    .join('\n') || profile.summary;

  const updated: AkAgentMemoryProfile = {
    ...profile,
    learnings: sorted,
    summary: summaryText,
    updatedAt: timestamp,
  };

  if (index >= 0) state.profiles[index] = updated;
  else state.profiles.push(updated);

  await writeMemoryState(state);
  return updated;
}

export async function listAgentMemoryProfiles(): Promise<AkAgentMemoryProfile[]> {
  const state = await readMemoryState();
  return state.profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
