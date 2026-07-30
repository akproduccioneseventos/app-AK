import 'server-only';

import { createHash } from 'crypto';
import type { CrmLead, CrmStage, CrmTimelineItem } from '@/types/crm';
import type { PresupuestoSource } from '@/types/presupuesto';
import { readData, writeData } from '@/lib/data-service';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { describeCommercialSource, sanitizeCommercialAttribution } from '@/lib/commercial/acquisition';
import type { SimulatorConversionPlan } from '@/lib/commercial/simulator-conversion-engine';
import { normalizeBirthdayMonthDay } from '@/lib/commercial/birthday';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { resolvePublicLeadStage } from '@/lib/crm/lead-stage';

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
  birthdayMonthDay?: string;
  marketingConsent?: boolean;
  marketingConsentSource?: string;
  referrerEventName?: string;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function comparableName(name: string): string {
  return normalizeName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildPublicIdentityKey(phone: string, name: string): string {
  return createHash('sha256')
    .update(`${phone}|${comparableName(name)}`)
    .digest('hex');
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function appendAcquisitionHistory(
  existing: CrmLead['acquisitionHistory'],
  acquisition: CommercialAttribution,
  capturedAt: string,
): NonNullable<CrmLead['acquisitionHistory']> {
  const next = [...(existing || [])];
  const last = next[next.length - 1];
  const isDuplicate = last
    && last.source === acquisition.source
    && last.campaign === acquisition.campaign
    && last.refFiestaId === acquisition.refFiestaId
    && last.refGuestId === acquisition.refGuestId
    && last.simulatorMode === acquisition.simulatorMode;
  if (!isDuplicate) next.push({ ...acquisition, capturedAt });
  return next.slice(-30);
}

function buildLead(
  existing: CrmLead | undefined,
  input: PublicLeadPersistenceInput,
  stages: CrmStage[],
  now: string,
  identityKey: string,
): CrmLead {
  const phone = normalizeUruguayPhone(input.phone);
  const name = normalizeName(input.name);
  const acquisition = sanitizeCommercialAttribution(input.acquisition, 'landing');
  const budgetStage = stages.find((stage) => stage.name.toLowerCase().includes('presupuesto'));
  const initialStageId = stages[0]?.id || 's1';
  const samePublicIdentity = !existing
    || existing.publicIdentityKey === identityKey
    || (
      existing.id.startsWith('lead_public_')
      && !existing.publicIdentityKey
      && normalizeUruguayPhone(existing.phone) === phone
      && comparableName(existing.name) === comparableName(name)
    );
  const canUpdateOpportunity = !existing || samePublicIdentity;
  const timelineType: CrmTimelineItem['type'] = input.presupuestoId ? 'presupuesto_created' : 'lead_created';
  const timelineDescription = input.presupuestoId
    ? `Presupuesto ${input.presupuestoId} generado desde ${describeCommercialSource(acquisition)}.`
    : `Consulta recibida desde ${describeCommercialSource(acquisition)}.`;
  const alreadyRecorded = existing?.timeline?.some((item) =>
    input.presupuestoId
      ? item.type === 'presupuesto_created' && item.description.includes(input.presupuestoId)
      : item.type === 'lead_created' && item.description === timelineDescription
  );
  const timeline = alreadyRecorded
    ? existing?.timeline
    : [
        ...(existing?.timeline || []),
        {
          id: `tl_public_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: timelineType,
          timestamp: now,
          description: timelineDescription,
          meta: { source: acquisition.source },
        },
      ];
  const consentGranted = Boolean(existing?.marketingConsent || input.marketingConsent);
  const birthdayMonthDay = normalizeBirthdayMonthDay(input.birthdayMonthDay);
  const shouldAdvanceToBudget = Boolean(
    input.presupuestoId
    && canUpdateOpportunity
    && (!existing?.currentStageId || existing.currentStageId === initialStageId),
  );

  return stripUndefined({
    ...(existing || {}),
    id: existing?.id || `lead_public_${identityKey.slice(0, 24)}`,
    name: existing?.name || name,
    phone: existing?.phone || phone,
    email: existing?.email || input.email,
    partyType: canUpdateOpportunity ? (input.partyType || existing?.partyType) : existing?.partyType,
    followUpDate: existing?.followUpDate || input.eventDate,
    guestCount: canUpdateOpportunity ? (input.guestCount ?? existing?.guestCount) : existing?.guestCount,
    venueName: canUpdateOpportunity ? (input.venueName || existing?.venueName) : existing?.venueName,
    presupuestoId: canUpdateOpportunity ? (input.presupuestoId || existing?.presupuestoId) : existing?.presupuestoId,
    presupuestoEstado: canUpdateOpportunity
      ? (input.presupuestoEstado || existing?.presupuestoEstado)
      : existing?.presupuestoEstado,
    budgetSource: canUpdateOpportunity ? (input.budgetSource || existing?.budgetSource) : existing?.budgetSource,
    lastBudgetAt: input.presupuestoId && canUpdateOpportunity ? now : existing?.lastBudgetAt,
    acquisition,
    acquisitionHistory: appendAcquisitionHistory(existing?.acquisitionHistory, acquisition, now),
    crmTags: Array.from(new Set([
      ...(existing?.crmTags || []),
      ...(input.conversionPlan?.crmTags || []),
      ...(acquisition.source === 'guest_portal' ? ['invitado-interesado'] : []),
    ])),
    leadTemperature: input.conversionPlan?.leadTemperature || existing?.leadTemperature,
    nextAction: input.conversionPlan?.nextAction || existing?.nextAction,
    notes: mergeNotes(
      existing?.notes,
      [...buildAttributionNotes(acquisition), input.notes, input.conversionPlan?.internalNote]
        .filter(Boolean)
        .join('\n'),
    ),
    timeline,
    publicIdentityKey: existing?.publicIdentityKey
      || (!existing || existing.id.startsWith('lead_public_') ? identityKey : undefined),
    birthdayMonthDay: existing?.birthdayMonthDay || birthdayMonthDay,
    marketingConsent: consentGranted,
    marketingConsentAt: existing?.marketingConsentAt || (input.marketingConsent ? now : undefined),
    marketingConsentSource: existing?.marketingConsentSource
      || (input.marketingConsent ? input.marketingConsentSource || acquisition.source : undefined),
    referrerEventName: existing?.referrerEventName || input.referrerEventName,
    lastInboundAt: now,
    currentStageId: resolvePublicLeadStage({
      existingStageId: existing?.currentStageId,
      initialStageId,
      budgetStageId: budgetStage?.id,
      isSimulatorLead: Boolean(input.budgetSource?.includes('simulator') || input.presupuestoId),
      shouldAdvanceToBudget,
    }),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  } as CrmLead);
}

export async function upsertPublicCommercialLead(
  input: PublicLeadPersistenceInput
): Promise<{ lead: CrmLead; isNew: boolean }> {
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const stages = await readData<CrmStage[]>(STAGES_FILE, []);
  const now = new Date().toISOString();
  const phone = normalizeUruguayPhone(input.phone);
  const name = normalizeName(input.name);
  if (!/^09\d{7}$/.test(phone)) throw new Error('Ingresa un celular uruguayo valido.');
  if (name.length < 3 || name.length > 120) throw new Error('Ingresa un nombre valido.');

  const identityKey = buildPublicIdentityKey(phone, name);
  const existingIndex = leads.findIndex((lead) =>
    lead.publicIdentityKey === identityKey
    || (
      normalizeUruguayPhone(lead.phone) === phone
      && comparableName(lead.name) === comparableName(name)
    )
  );
  const existing = existingIndex >= 0 ? leads[existingIndex] : undefined;
  const leadId = existing?.id || `lead_public_${identityKey.slice(0, 24)}`;

  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const ref = dbAdmin.collection('prospectos').doc(leadId);
      const lead = await dbAdmin.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const stored = snapshot.exists ? snapshot.data() as CrmLead : existing;
        const next = buildLead(stored, input, stages, now, identityKey);
        transaction.set(ref, { ...next, _syncedAt: now }, { merge: false });
        return next;
      });
      return { lead, isNew: !existing };
    }
  } catch (error) {
    console.warn('[public-lead] Firestore transaction unavailable, using data-service fallback.', error);
  }

  const lead = buildLead(existing, input, stages, now, identityKey);
  if (existingIndex >= 0) leads[existingIndex] = lead;
  else leads.push(lead);
  await writeData(LEADS_FILE, leads);
  return { lead, isNew: !existing };
}
