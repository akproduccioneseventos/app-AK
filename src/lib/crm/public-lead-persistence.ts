import 'server-only';

import type { CrmLead, CrmStage, CrmTimelineItem } from '@/types/crm';
import type { PresupuestoSource } from '@/types/presupuesto';
import { readData, writeData } from '@/lib/data-service';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { describeCommercialSource, sanitizeCommercialAttribution } from '@/lib/commercial/acquisition';
import type { SimulatorConversionPlan } from '@/lib/commercial/simulator-conversion-engine';

const LEADS_FILE = 'crm-leads.json';
const STAGES_FILE = 'crm-stages.json';

export interface PublicLeadPersistenceInput {
  name: string;
  phone: string;
  email?: string;
  partyType?: string;
  eventDate?: string;
  guestCount?: number;
  venueName?: string;
  notes?: string;
  presupuestoId?: string;
  presupuestoEstado?: CrmLead['presupuestoEstado'];
  budgetSource?: PresupuestoSource;
  acquisition?: CommercialAttribution;
  conversionPlan?: SimulatorConversionPlan;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-9);
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function mergeNotes(existing?: string, incoming?: string): string | undefined {
  const values = [existing?.trim(), incoming?.trim()].filter(Boolean) as string[];
  return values.length > 0 ? Array.from(new Set(values)).join('\n') : undefined;
}

function buildAttributionNotes(attribution: CommercialAttribution): string[] {
  return [
    `Origen: ${describeCommercialSource(attribution)}`,
    attribution.campaign ? `Campana: ${attribution.campaign}` : '',
    attribution.refFiestaId ? `Fiesta referidora: ${attribution.refFiestaId}` : '',
    attribution.refGuestId ? `Invitado referidor: ${attribution.refGuestId}` : '',
    attribution.simulatorMode ? `Modo simulador: ${attribution.simulatorMode}` : '',
  ].filter(Boolean);
}

export async function upsertPublicCommercialLead(
  input: PublicLeadPersistenceInput
): Promise<{ lead: CrmLead; isNew: boolean }> {
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const stages = await readData<CrmStage[]>(STAGES_FILE, []);
  const now = new Date().toISOString();
  const phone = normalizePhone(input.phone);
  const name = normalizeName(input.name);
  const acquisition = sanitizeCommercialAttribution(input.acquisition, 'landing');
  const existingIndex = leads.findIndex((lead) => normalizePhone(lead.phone || '') === phone);
  const budgetStage = stages.find((stage) => stage.name.toLowerCase().includes('presupuesto'));
  const initialStageId = budgetStage?.id || stages[0]?.id || 's1';
  const timelineType: CrmTimelineItem['type'] = input.presupuestoId ? 'presupuesto_created' : 'lead_created';
  const timelineDescription = input.presupuestoId
    ? `Presupuesto ${input.presupuestoId} generado desde ${describeCommercialSource(acquisition)}.`
    : `Consulta recibida desde ${describeCommercialSource(acquisition)}.`;

  if (existingIndex >= 0) {
    const existing = leads[existingIndex];
    const alreadyRecorded = existing.timeline?.some((item) =>
      input.presupuestoId
        ? item.type === 'presupuesto_created' && item.description.includes(input.presupuestoId)
        : item.type === 'lead_created' && item.description === timelineDescription
    );
    const timeline = alreadyRecorded
      ? existing.timeline
      : [
          ...(existing.timeline || []),
          {
            id: `tl_public_${Date.now()}`,
            type: timelineType,
            timestamp: now,
            description: timelineDescription,
            meta: { source: acquisition.source },
          },
        ];

    const updated: CrmLead = {
      ...existing,
      name: name || existing.name,
      phone,
      email: input.email || existing.email,
      partyType: input.partyType || existing.partyType,
      followUpDate: input.eventDate || existing.followUpDate,
      guestCount: input.guestCount || existing.guestCount,
      venueName: input.venueName || existing.venueName,
      presupuestoId: input.presupuestoId || existing.presupuestoId,
      presupuestoEstado: input.presupuestoEstado || existing.presupuestoEstado,
      budgetSource: input.budgetSource || existing.budgetSource,
      lastBudgetAt: input.presupuestoId ? now : existing.lastBudgetAt,
      acquisition,
      crmTags: Array.from(new Set([...(existing.crmTags || []), ...(input.conversionPlan?.crmTags || [])])),
      leadTemperature: input.conversionPlan?.leadTemperature || existing.leadTemperature,
      nextAction: input.conversionPlan?.nextAction || existing.nextAction,
      notes: mergeNotes(
        existing.notes,
        [...buildAttributionNotes(acquisition), input.notes, input.conversionPlan?.internalNote]
          .filter(Boolean)
          .join('\n')
      ),
      timeline,
      updatedAt: now,
      currentStageId: input.presupuestoId ? initialStageId : existing.currentStageId,
    };
    leads[existingIndex] = updated;
    await writeData(LEADS_FILE, leads);
    return { lead: updated, isNew: false };
  }

  const lead: CrmLead = {
    id: `lead_public_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    phone,
    email: input.email,
    partyType: input.partyType,
    followUpDate: input.eventDate,
    guestCount: input.guestCount,
    venueName: input.venueName,
    presupuestoId: input.presupuestoId,
    presupuestoEstado: input.presupuestoEstado,
    budgetSource: input.budgetSource,
    lastBudgetAt: input.presupuestoId ? now : undefined,
    acquisition,
    crmTags: input.conversionPlan?.crmTags || [],
    leadTemperature: input.conversionPlan?.leadTemperature,
    nextAction: input.conversionPlan?.nextAction,
    notes: [
      ...buildAttributionNotes(acquisition),
      input.notes,
      input.conversionPlan?.internalNote,
    ].filter(Boolean).join('\n'),
    currentStageId: initialStageId,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: `tl_public_${Date.now()}`,
        type: timelineType,
        timestamp: now,
        description: timelineDescription,
        meta: { source: acquisition.source },
      },
    ],
  };

  leads.push(lead);
  await writeData(LEADS_FILE, leads);
  return { lead, isNew: true };
}
