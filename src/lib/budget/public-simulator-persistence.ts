import 'server-only';

import { createHash } from 'crypto';
import type { ItemPresupuestado, Presupuesto, PresupuestoSource } from '@/types/presupuesto';
import type { ArmadoRapidoConfig, LeadFromQuickBudget } from '@/types/armado-rapido';
import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';
import type { BudgetDisplaySettings } from '@/types/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';
import { normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { sanitizeCommercialAttribution } from '@/lib/commercial/acquisition';
import {
  buildSimulatorConversionPlan,
  type SimulatorCommercialSource,
} from '@/lib/commercial/simulator-conversion-engine';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import {
  calculateSimulatorPricing,
  simulatorDetailsToBudgetItems,
} from '@/lib/simulator/pricing';
import { buildAuthoritativeSimulatorServices } from '@/lib/simulator/catalog';
import { getRemovablePackageServices } from '@/lib/simulator/package-customization';

const PRESUPUESTOS_FILE = 'presupuestos.json';
const CONFIG_FILE = 'armado-rapido-config.json';
const SERVICES_FILE = 'servicios-empresa.json';
const MENUS_FILE = 'menus-catering.json';
const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const SIMULATOR_DISCOUNT_PERCENTAGE = 15;

const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
  paquetes: [],
  menus: [],
  platosVisibles: [],
  serviceDependencies: [],
  mostrarPrecios: true,
  clubUruguayConfig: defaultClubUruguayConfig,
};

export interface PublicSimulatorPersistenceOptions {
  source: Extract<PresupuestoSource, 'simulator' | 'simulator_common' | 'simulator_assistant'>;
  eventoTipo: string;
  salonFiestas?: string;
  acquisition?: CommercialAttribution;
}

function clampCount(value: unknown, max = 1000): number {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(max, Math.max(0, Math.round(numberValue)));
}

function normalizeSubmissionId(
  submissionId: string | undefined,
  phone: string,
  eventDate: string | undefined,
  source: string,
): string {
  const clean = submissionId?.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
  if (clean && clean.length >= 12) return clean;
  return createHash('sha256')
    .update(`${phone}|${eventDate || 'sin-fecha'}|${source}`)
    .digest('hex');
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sanitizeDate(value?: string): string {
  if (!value) throw new Error('La fecha del evento es obligatoria.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('La fecha del evento no es valida.');
  return date.toISOString();
}

function validateSubmission(data: LeadFromQuickBudget): string | null {
  const name = data.clienteNombre?.trim();
  const phone = normalizeUruguayPhone(data.clienteContacto);
  const totalGuests = clampCount(data.adultos) + clampCount(data.adolescentes) + clampCount(data.ninos);
  const selectedIds = data.selectedServiceIds || data.serviciosIncluidos || [];
  if (!name || name.length < 3 || name.length > 120) return 'Ingresa un nombre valido.';
  if (!/^09\d{7}$/.test(phone)) return 'Ingresa un celular uruguayo valido.';
  if (totalGuests < 1 || totalGuests > 1000) return 'La cantidad de invitados no es valida.';
  if (!data.paqueteId && selectedIds.length === 0 && !data.includeClubUruguay) {
    return 'El presupuesto no tiene servicios seleccionados.';
  }
  if (selectedIds.length > 150) return 'El presupuesto supera el limite de servicios.';
  return null;
}

function mapCommercialSource(
  attribution: CommercialAttribution,
  source: PublicSimulatorPersistenceOptions['source'],
): SimulatorCommercialSource {
  if (attribution.source === 'guest_portal') return 'guest_portal';
  if (attribution.source === 'campaign') return 'campaign';
  if (attribution.source === 'youtube') return 'youtube';
  if (attribution.source === 'instagram') return 'instagram';
  if (attribution.source === 'facebook') return 'facebook';
  if (attribution.source === 'whatsapp') return 'whatsapp';
  if (attribution.source === 'portal_led') return 'portal_led';
  if (attribution.source.startsWith('landing_')) {
    if (attribution.source === 'landing_bodas') return 'landing_boda';
    if (attribution.source === 'landing_xv') return 'landing_quince';
    if (attribution.source === 'landing_eventos') return 'landing_cumpleanos';
  }
  return source === 'simulator_assistant' ? 'simulador_asistente' : 'simulador_comun';
}

async function loadAuthoritativePricingData(): Promise<{
  config: ArmadoRapidoConfig;
  services: ServicioEmpresa[];
  budgetSettings: BudgetDisplaySettings;
}> {
  const [storedConfig, catalogServices, menus, budgetSettings] = await Promise.all([
    readData<ArmadoRapidoConfig>(CONFIG_FILE, defaultConfig),
    readData<ServicioEmpresa[]>(SERVICES_FILE, []),
    readData<FullMenu[]>(MENUS_FILE, []),
    readData<BudgetDisplaySettings>(BUDGET_SETTINGS_FILE, defaultBudgetDisplaySettings),
  ]);
  const config: ArmadoRapidoConfig = {
    ...defaultConfig,
    ...storedConfig,
    descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
    clubUruguayConfig: {
      ...defaultClubUruguayConfig,
      ...(storedConfig.clubUruguayConfig || {}),
    },
  };
  return {
    config,
    services: buildAuthoritativeSimulatorServices(catalogServices, menus),
    budgetSettings: { ...defaultBudgetDisplaySettings, ...budgetSettings },
  };
}

function addItemIds(
  items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[],
): ItemPresupuestado[] {
  return items.map((item, index) => ({
    ...item,
    id: `sim_item_${index}_${Math.random().toString(36).slice(2, 7)}`,
    costoTotalItem: 0,
  }));
}

async function persistBudgetAtomically(
  presupuesto: Presupuesto,
  maxExistingNumber: number,
): Promise<{ presupuesto: Presupuesto; reused: boolean }> {
  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const budgetRef = dbAdmin.collection('presupuestos').doc(presupuesto.id);
      const counterRef = dbAdmin.collection('commercial_counters').doc('presupuestos');
      return await dbAdmin.runTransaction(async (transaction) => {
        const [budgetSnapshot, counterSnapshot] = await Promise.all([
          transaction.get(budgetRef),
          transaction.get(counterRef),
        ]);
        const stored = budgetSnapshot.exists ? budgetSnapshot.data() as Presupuesto : undefined;
        if (stored && stored.estado !== 'Pendiente Verificación') {
          throw new Error('Este presupuesto ya fue revisado. Genera una nueva propuesta.');
        }
        const currentCounter = Number(counterSnapshot.data()?.lastNumber || maxExistingNumber);
        const numero = stored?.numero || Math.max(maxExistingNumber, currentCounter) + 1;
        const next = stripUndefined({ ...presupuesto, numero });
        transaction.set(budgetRef, { ...next, _syncedAt: new Date().toISOString() }, { merge: false });
        if (!stored) {
          transaction.set(counterRef, {
            lastNumber: numero,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        return { presupuesto: next, reused: Boolean(stored) };
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ya fue revisado')) throw error;
    console.warn('[public-budget] Firestore transaction unavailable, using data-service fallback.', error);
  }

  const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  const existingIndex = presupuestos.findIndex((item) => item.id === presupuesto.id);
  const stored = existingIndex >= 0 ? presupuestos[existingIndex] : undefined;
  if (stored && stored.estado !== 'Pendiente Verificación') {
    throw new Error('Este presupuesto ya fue revisado. Genera una nueva propuesta.');
  }
  const next = { ...presupuesto, numero: stored?.numero || maxExistingNumber + 1 };
  if (existingIndex >= 0) presupuestos[existingIndex] = next;
  else presupuestos.push(next);
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { presupuesto: next, reused: existingIndex >= 0 };
}

export async function persistPublicSimulatorBudget(
  data: LeadFromQuickBudget & { items?: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] },
  options: PublicSimulatorPersistenceOptions,
): Promise<{ presupuesto: Presupuesto; leadId: string; reused: boolean }> {
  const validationError = validateSubmission(data);
  if (validationError) throw new Error(validationError);

  const now = new Date();
  const timestamp = now.toISOString();
  const phone = normalizeUruguayPhone(data.clienteContacto);
  await enforcePublicRateLimit({
    scope: 'public-simulator-budget',
    identity: phone,
    limit: 30,
    windowMs: 30 * 60 * 1000,
  });

  const adultos = clampCount(data.adultos);
  const adolescentes = clampCount(data.adolescentes);
  const ninos = clampCount(data.ninos);
  const totalGuests = adultos + adolescentes + ninos;
  const eventDate = sanitizeDate(data.eventoFecha);
  const attribution = sanitizeCommercialAttribution({
    ...options.acquisition,
    simulatorMode: options.source === 'simulator_assistant' ? 'assistant' : 'visual',
  }, 'landing');
  const { config, services, budgetSettings } = await loadAuthoritativePricingData();
  const serviceIds = Array.from(new Set(
    (data.selectedServiceIds || data.serviciosIncluidos || [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  ));
  const validServiceIds = new Set(services.map((service) => service.id));
  const selectedServices = serviceIds
    .filter((id) => validServiceIds.has(id))
    .map((id) => ({ id }));
  if (serviceIds.length !== selectedServices.length) {
    throw new Error('Uno o mas servicios ya no estan disponibles. Actualiza el simulador.');
  }
  const selectedPackage = data.paqueteId
    ? config.paquetes.find((item) => item.id === data.paqueteId)
    : undefined;
  if (data.paqueteId && !selectedPackage) {
    throw new Error('El paquete seleccionado ya no esta disponible.');
  }
  const removableServices = getRemovablePackageServices(selectedPackage, services, config);
  const removableIds = new Set(removableServices.map(service => service.id));
  const excludedPackageServiceIds = Array.from(new Set(data.excludedPackageServiceIds || []))
    .filter(id => removableIds.has(id));
  const clubConfig = config.clubUruguayConfig || defaultClubUruguayConfig;
  const syntheticServices = data.includeClubUruguay && clubConfig.activo
    ? [{
        servicio: {
          id: 'serv_salon_club_uruguay',
          nombre: 'Salon Club Uruguay',
          tipoItem: 'Servicio' as const,
          categoria: 'Otros servicios' as const,
          precioVenta: clubConfig.precio,
          precioBase: clubConfig.precio,
          calculationMethod: 'fijo' as const,
        },
      }]
    : [];
  const pricing = calculateSimulatorPricing({
    config,
    services,
    adultos,
    ninosYAdolescentes: adolescentes + ninos,
    selectedPaqueteId: selectedPackage?.id,
    selectedServices,
    excludedPackageServiceIds,
    syntheticServices,
    eventoFecha: eventDate,
    annualAdjustmentPercentage: budgetSettings.annualAdjustmentPercentage || 0,
    currentYear: now.getFullYear(),
  });
  if (pricing.detallados.length === 0) {
    throw new Error('No fue posible reconstruir los servicios seleccionados.');
  }

  const submissionId = normalizeSubmissionId(data.submissionId, phone, eventDate, options.source);
  const presupuestoId = `pres_public_${createHash('sha256').update(submissionId).digest('hex').slice(0, 24)}`;
  const existingBudgets = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  const maxNumero = existingBudgets.reduce((max, budget) => Math.max(max, budget.numero || 0), 0);
  const items = addItemIds(simulatorDetailsToBudgetItems(pricing.detallados));
  const packageLabel = selectedPackage?.nombre || 'A medida';

  let presupuesto = normalizePresupuestoFinancials({
    id: presupuestoId,
    numero: 0,
    clienteNombre: data.clienteNombre.trim().replace(/\s+/g, ' '),
    clienteContacto: phone,
    eventoTipo: options.eventoTipo || 'Evento',
    eventoFecha: eventDate,
    eventoHoraInicio: data.eventoHoraInicio,
    invitadosCantidad: totalGuests,
    invitadosAdultos: adultos,
    invitadosAdolescentes: adolescentes,
    invitadosNinos: ninos,
    salonFiestas: data.includeClubUruguay ? 'Club Uruguay' : (options.salonFiestas || 'A definir'),
    itemsPresupuestados: items,
    timestamp,
    notas: [
      `Referencia calculada por el servidor desde el simulador. Paquete: ${packageLabel}.`,
      excludedPackageServiceIds.length > 0
        ? `Servicios retirados por el cliente: ${removableServices.filter(service => excludedPackageServiceIds.includes(service.id)).map(service => service.nombre).join(', ')}.`
        : '',
    ].filter(Boolean).join(' '),
    costoTotalEstimado: pricing.subtotalVenta,
    descuentoTipo: 'porcentaje',
    descuentoValor: pricing.discountPercentage,
    ajusteAnualActivo: pricing.annualProjection.applies,
    ajusteAnualPorcentaje: pricing.annualProjection.adjustmentPct,
    totalConDescuento: pricing.totalFinal,
    estado: 'Pendiente Verificación',
    source: options.source,
    acquisition: attribution,
  } as Presupuesto);

  const conversionPlan = buildSimulatorConversionPlan({
    source: mapCommercialSource(attribution, options.source),
    clientName: presupuesto.clienteNombre,
    phone,
    eventType: presupuesto.eventoTipo,
    eventDate: presupuesto.eventoFecha,
    guests: presupuesto.invitadosCantidad,
    wantsClubUruguay: presupuesto.salonFiestas.toLowerCase().includes('club uruguay'),
    hasVenue: presupuesto.salonFiestas === 'A definir'
      ? null
      : !presupuesto.salonFiestas.toLowerCase().includes('club uruguay'),
    estimatedTotal: presupuesto.totalConDescuento,
    completedSalesPresentation: attribution.entryPath === '/landing'
      || attribution.source === 'portal_led',
    createdBudget: true,
    viewedTechnologyValue: attribution.entryPath === '/landing'
      || attribution.source === 'guest_portal'
      || attribution.source === 'portal_led',
  });

  const { lead } = await upsertPublicCommercialLead({
    name: presupuesto.clienteNombre,
    phone,
    partyType: presupuesto.eventoTipo,
    eventDate: presupuesto.eventoFecha,
    guestCount: presupuesto.invitadosCantidad,
    venueName: presupuesto.salonFiestas,
    presupuestoId: presupuesto.id,
    presupuestoEstado: presupuesto.estado,
    budgetSource: presupuesto.source,
    acquisition: attribution,
    conversionPlan,
  });

  presupuesto = { ...presupuesto, leadId: lead.id };
  const persisted = await persistBudgetAtomically(presupuesto, maxNumero);
  return { presupuesto: persisted.presupuesto, leadId: lead.id, reused: persisted.reused };
}
