import 'server-only';

import type { ItemPresupuestado, Presupuesto, PresupuestoSource } from '@/types/presupuesto';
import type { LeadFromQuickBudget } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import { normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { sanitizeCommercialAttribution } from '@/lib/commercial/acquisition';
import {
  buildSimulatorConversionPlan,
  type SimulatorCommercialSource,
} from '@/lib/commercial/simulator-conversion-engine';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';

const PRESUPUESTOS_FILE = 'presupuestos.json';
const RECENT_SUBMISSION_WINDOW_MS = 30 * 60 * 1000;

export interface PublicSimulatorPersistenceOptions {
  source: Extract<PresupuestoSource, 'simulator' | 'simulator_common' | 'simulator_assistant'>;
  eventoTipo: string;
  salonFiestas?: string;
  acquisition?: CommercialAttribution;
}

function normalizePhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '').slice(-9);
}

function clampMoney(value: unknown): number {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(100_000_000, Math.max(0, Math.round(numberValue)));
}

function clampCount(value: unknown, max = 1000): number {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(max, Math.max(0, Math.round(numberValue)));
}

function sanitizeItems(
  items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[]
): ItemPresupuestado[] {
  return items.slice(0, 150).map((item, index) => ({
    ...item,
    id: `sim_item_${index}_${Math.random().toString(36).slice(2, 7)}`,
    idServicioCatalogo: String(item.idServicioCatalogo || '').slice(0, 120),
    nombre: String(item.nombre || item.descripcionServicio || 'Servicio AK').slice(0, 160),
    descripcionServicio: String(item.descripcionServicio || item.nombre || 'Servicio AK').slice(0, 240),
    cantidad: clampCount(item.cantidad, 5000),
    precioUnitario: clampMoney(item.precioUnitario),
    precioUnitarioPresupuesto: clampMoney(item.precioUnitarioPresupuesto ?? item.precioUnitario),
    costoTotalItem: 0,
    precioBase: item.precioBase == null ? undefined : clampMoney(item.precioBase),
    precioPorPersona: item.precioPorPersona == null ? undefined : clampMoney(item.precioPorPersona),
    invitadosPorUnidad: item.invitadosPorUnidad == null ? undefined : clampCount(item.invitadosPorUnidad, 1000),
    tramosDePrecio: item.tramosDePrecio?.slice(0, 30).map((tier) => ({
      id: String(tier.id || '').slice(0, 80),
      desde: clampCount(tier.desde, 5000),
      hasta: clampCount(tier.hasta, 5000),
      precio: clampMoney(tier.precio),
    })),
  }));
}

function validateSubmission(
  data: LeadFromQuickBudget & { items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] }
): string | null {
  const name = data.clienteNombre?.trim();
  const phone = normalizePhone(data.clienteContacto);
  const totalGuests = clampCount(data.adultos) + clampCount(data.adolescentes) + clampCount(data.ninos);
  if (!name || name.length < 3 || name.length > 120) return 'Ingresa un nombre valido.';
  if (!/^\d{9}$/.test(phone)) return 'Ingresa un celular uruguayo de 9 digitos.';
  if (totalGuests < 1 || totalGuests > 1000) return 'La cantidad de invitados no es valida.';
  if (!Array.isArray(data.items) || data.items.length === 0) return 'El presupuesto no tiene servicios seleccionados.';
  if (data.items.length > 150) return 'El presupuesto supera el limite de servicios.';
  return null;
}

function mapCommercialSource(
  attribution: CommercialAttribution,
  source: PublicSimulatorPersistenceOptions['source']
): SimulatorCommercialSource {
  if (attribution.source === 'guest_portal') return 'guest_portal';
  if (attribution.source === 'campaign') return 'campaign';
  if (attribution.source === 'youtube') return 'youtube';
  if (attribution.source === 'instagram') return 'instagram';
  if (attribution.source === 'facebook') return 'facebook';
  if (attribution.source === 'whatsapp') return 'whatsapp';
  if (attribution.source.startsWith('landing_')) {
    if (attribution.source === 'landing_bodas') return 'landing_boda';
    if (attribution.source === 'landing_xv') return 'landing_quince';
    if (attribution.source === 'landing_eventos') return 'landing_cumpleanos';
  }
  return source === 'simulator_assistant' ? 'simulador_asistente' : 'simulador_comun';
}

export async function persistPublicSimulatorBudget(
  data: LeadFromQuickBudget & { items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] },
  options: PublicSimulatorPersistenceOptions
): Promise<{ presupuesto: Presupuesto; leadId: string; reused: boolean }> {
  const validationError = validateSubmission(data);
  if (validationError) throw new Error(validationError);

  const now = new Date();
  const timestamp = now.toISOString();
  const phone = normalizePhone(data.clienteContacto);
  const adultos = clampCount(data.adultos);
  const adolescentes = clampCount(data.adolescentes);
  const ninos = clampCount(data.ninos);
  const totalGuests = adultos + adolescentes + ninos;
  const attribution = sanitizeCommercialAttribution({
    ...options.acquisition,
    simulatorMode: options.source === 'simulator_assistant' ? 'assistant' : 'visual',
  }, 'landing');
  const items = sanitizeItems(data.items);
  const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  const recentIndex = presupuestos.findIndex((budget) => {
    const createdAt = new Date(budget.timestamp).getTime();
    return normalizePhone(budget.clienteContacto) === phone
      && budget.source === options.source
      && budget.estado === 'Pendiente Verificación'
      && Number.isFinite(createdAt)
      && now.getTime() - createdAt <= RECENT_SUBMISSION_WINDOW_MS;
  });
  const existing = recentIndex >= 0 ? presupuestos[recentIndex] : undefined;
  const maxNumero = presupuestos.reduce((max, budget) => Math.max(max, budget.numero || 0), 0);
  const presupuestoId = existing?.id || `pres_public_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const discountPercentage = Math.min(100, Math.max(0, Number(data.descuentoGeneral ?? 15)));

  let presupuesto = normalizePresupuestoFinancials({
    id: presupuestoId,
    numero: existing?.numero || maxNumero + 1,
    clienteNombre: data.clienteNombre.trim().replace(/\s+/g, ' '),
    clienteContacto: phone,
    eventoTipo: options.eventoTipo || 'Evento',
    eventoFecha: data.eventoFecha || timestamp,
    eventoHoraInicio: data.eventoHoraInicio,
    invitadosCantidad: totalGuests,
    invitadosAdultos: adultos,
    invitadosAdolescentes: adolescentes,
    invitadosNinos: ninos,
    salonFiestas: options.salonFiestas || 'A definir',
    itemsPresupuestados: items,
    timestamp,
    notas: `Referencia generada desde el simulador. Paquete: ${String(data.paqueteNombre || 'A medida').slice(0, 120)}.`,
    costoTotalEstimado: clampMoney(data.subtotal),
    descuentoTipo: 'porcentaje',
    descuentoValor: discountPercentage,
    ajusteAnualActivo: Boolean(data.ajusteAnualActivo),
    ajusteAnualPorcentaje: clampCount(data.ajusteAnualPorcentaje, 100),
    totalConDescuento: clampMoney(data.costoEstimado),
    estado: 'Pendiente Verificación',
    source: options.source,
    acquisition: attribution,
  } as Presupuesto, { preserveStoredTotal: true });

  const conversionPlan = buildSimulatorConversionPlan({
    source: mapCommercialSource(attribution, options.source),
    clientName: presupuesto.clienteNombre,
    phone,
    eventType: presupuesto.eventoTipo,
    eventDate: presupuesto.eventoFecha,
    guests: presupuesto.invitadosCantidad,
    wantsClubUruguay: presupuesto.salonFiestas.toLowerCase().includes('club uruguay'),
    hasVenue: presupuesto.salonFiestas === 'A definir' ? null : !presupuesto.salonFiestas.toLowerCase().includes('club uruguay'),
    estimatedTotal: presupuesto.totalConDescuento,
    completedSalesPresentation: attribution.entryPath === '/landing',
    createdBudget: true,
    viewedTechnologyValue: attribution.entryPath === '/landing' || attribution.source === 'guest_portal',
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
  if (recentIndex >= 0) presupuestos[recentIndex] = presupuesto;
  else presupuestos.push(presupuesto);
  await writeData(PRESUPUESTOS_FILE, presupuestos);

  return { presupuesto, leadId: lead.id, reused: recentIndex >= 0 };
}
