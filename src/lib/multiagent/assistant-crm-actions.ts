import { getCrmLeads, addCrmLead } from '@/app/actions/crm';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { getPresupuestos, savePresupuesto } from '@/app/actions/presupuestos';
import type { CrmLead, NewCrmLeadData } from '@/types/crm';
import type { Presupuesto, ItemPresupuestado, TipoEvento } from '@/types/presupuesto';
import type { CommercialSource } from '@/lib/commercial/acquisition';
import { roundMoney } from '@/lib/budget/financial-guardrails';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { calculateSuggestedQuantity, getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';

export interface AssistantParsedLeadInput {
  name: string;
  phone?: string;
  email?: string;
  partyType?: string;
  eventDate?: string;
  guestCount?: number;
  acquisitionSource?: string;
  notes?: string;
  nextAction?: string;
}

export interface AssistantParsedBudgetInput {
  clientName: string;
  phone?: string;
  email?: string;
  partyType: string;
  eventDate?: string;
  guestCount?: number;
  adultCount?: number;
  adolescentCount?: number;
  childCount?: number;
  venueName?: string;
  requestedServices?: string[];
  notes?: string;
}

export interface AssistantDuplicateMatch {
  lead: CrmLead;
  matchReason: string;
}

/**
 * Busca si ya existe un prospecto con número de teléfono similar o nombre coincidente.
 */
export async function findDuplicateLeads(input: {
  name?: string;
  phone?: string;
  email?: string;
}): Promise<AssistantDuplicateMatch[]> {
  try {
    const leads = await getCrmLeads();
    const matches: AssistantDuplicateMatch[] = [];

    const normPhone = input.phone ? input.phone.replace(/\D/g, '').slice(-8) : '';
    const normName = input.name ? input.name.toLowerCase().trim() : '';

    for (const lead of leads) {
      if (normPhone && lead.phone) {
        const leadNormPhone = lead.phone.replace(/\D/g, '').slice(-8);
        if (leadNormPhone && (leadNormPhone === normPhone || leadNormPhone.endsWith(normPhone) || normPhone.endsWith(leadNormPhone))) {
          matches.push({ lead, matchReason: `Teléfono coincidente (${lead.phone})` });
          continue;
        }
      }

      if (normName && normName.length >= 3 && lead.name) {
        const leadNormName = lead.name.toLowerCase().trim();
        if (leadNormName === normName || leadNormName.includes(normName) || normName.includes(leadNormName)) {
          matches.push({ lead, matchReason: `Nombre similar (${lead.name})` });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error('[AssistantCRM] Error buscando duplicados:', error);
    return [];
  }
}

/**
 * Prepara la propuesta de prospecto para ser confirmada por el usuario.
 */
export async function prepareAssistantLeadProposal(input: AssistantParsedLeadInput): Promise<{
  data: NewCrmLeadData;
  duplicates: AssistantDuplicateMatch[];
  summary: string;
}> {
  const duplicates = await findDuplicateLeads({
    name: input.name,
    phone: input.phone,
    email: input.email,
  });

  const formattedPhone = input.phone ? normalizeUruguayPhone(input.phone) : undefined;

  let source: CommercialSource = 'direct';
  const lowerSource = (input.acquisitionSource || '').toLowerCase();
  if (lowerSource.includes('instagram')) source = 'instagram';
  else if (lowerSource.includes('facebook')) source = 'facebook';
  else if (lowerSource.includes('whatsapp')) source = 'whatsapp';
  else if (lowerSource.includes('youtube')) source = 'youtube';

  const leadData: NewCrmLeadData = {
    name: input.name.trim(),
    phone: formattedPhone || input.phone?.trim(),
    email: input.email?.trim(),
    partyType: input.partyType || 'Fiesta',
    followUpDate: input.eventDate || undefined,
    guestCount: input.guestCount ? Number(input.guestCount) : undefined,
    notes: input.notes || `Cargado por Asistente IA (${new Date().toLocaleDateString('es-UY')})`,
    nextAction: input.nextAction || 'Contactar por WhatsApp y coordinar reunión',
    acquisition: {
      source,
      campaign: 'crm_inbound',
      simulatorMode: 'assistant',
    },
  };

  const summary = [
    `👤 **${leadData.name}**`,
    leadData.phone ? `📱 ${leadData.phone}` : '📱 Sin teléfono',
    leadData.partyType ? `🎉 ${leadData.partyType}` : null,
    leadData.followUpDate ? `📅 Fecha estimada: ${leadData.followUpDate}` : null,
    leadData.guestCount ? `👥 Invitados: ${leadData.guestCount}` : null,
    input.acquisitionSource ? `📢 Origen: ${input.acquisitionSource}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    data: leadData,
    duplicates,
    summary,
  };
}

/**
 * Guarda el prospecto en CRM tras la confirmación explícita del usuario.
 */
export async function confirmAndSaveAssistantLead(data: NewCrmLeadData): Promise<{
  success: boolean;
  lead?: CrmLead;
  error?: string;
}> {
  try {
    const savedRes = await addCrmLead(data);
    if (!savedRes || !savedRes.success || !savedRes.lead) {
      return { success: false, error: savedRes?.error || 'No se pudo guardar el prospecto en la base de datos.' };
    }
    return { success: true, lead: savedRes.lead };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error guardando prospecto.' };
  }
}

/**
 * Prepara un borrador de presupuesto calculando los precios estrictamente
 * desde el catálogo oficial de servicios de la app.
 */
export async function prepareAssistantBudgetProposal(input: AssistantParsedBudgetInput): Promise<{
  presupuesto: Partial<Presupuesto>;
  desglose: Array<{ servicio: string; cantidad: number; precioUnitario: number; subtotal: number; fuente: string }>;
  totalCalculado: number;
  serviciosNoEncontrados: string[];
  summary: string;
}> {
  const serviciosCatalogo = await getServiciosEmpresaPublicos();
  const requested = input.requestedServices || [];
  const guestCount = input.guestCount ?? 100;

  const items: ItemPresupuestado[] = [];
  const desglose: Array<{ servicio: string; cantidad: number; precioUnitario: number; subtotal: number; fuente: string }> = [];
  const serviciosNoEncontrados: string[] = [];

  const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const incluidos = new Set<string>();
  const adultos = input.adultCount ?? guestCount;
  const adolescentes = input.adolescentCount ?? 0;
  const ninos = input.childCount ?? 0;
  const hasSplit = input.adultCount != null || input.adolescentCount != null || input.childCount != null;
  if (![guestCount, adultos, adolescentes, ninos].every(n => Number.isSafeInteger(n) && n >= 0)
      || guestCount <= 0 || (hasSplit && adultos + adolescentes + ninos !== guestCount)) {
    throw new Error('Indica cantidades de invitados validas; adultos, adolescentes y ninos deben sumar el total.');
  }

  for (const rawName of requested) {
    const search = normalizar(rawName);
    if (!search) continue;
    const exact = serviciosCatalogo.filter(s => normalizar(s.nombre) === search);
    const matches = exact.length ? exact : serviciosCatalogo.filter(s => {
      const nom = normalizar(s.nombre);
      return nom.includes(search) || search.includes(nom) || normalizar(s.categoria || '').includes(search);
    });
    if (matches.length !== 1) {
      serviciosNoEncontrados.push(matches.length ? `${rawName} (hay varias opciones; indica el nombre exacto)` : rawName);
      continue;
    }
    const matched = matches[0];
    if (incluidos.has(matched.id)) continue;
    incluidos.add(matched.id);
    const method = matched.calculationMethod || (matched.precioPorPersona ? 'porPersona' : 'fijo');
    if (method === 'fijo' && matched.cantidad != null && (!Number.isSafeInteger(matched.cantidad) || matched.cantidad <= 0)) {
      throw new Error(`Configura una cantidad valida de ${matched.nombre} antes de presupuestarlo.`);
    }
    if ((method === 'porPersona' || method === 'ratio' || method === 'tramos') && input.guestCount == null) {
      throw new Error('Indica la cantidad de invitados antes de calcular ese servicio.');
    }
    const prices = method === 'porPersona'
      ? [matched.precioPorPersona, matched.precioVenta, matched.precioBase]
      : [matched.precioVenta, matched.precioBase, matched.precioPorPersona];
    const price = prices.find(value => value != null && value !== 0) ?? prices.find(value => value != null);
    if (method !== 'tramos' && (price == null || !Number.isFinite(price) || price < 0)) {
      throw new Error(`El servicio ${matched.nombre} no tiene un precio valido en el catalogo.`);
    }
    if (method === 'ratio' && !(Number(matched.invitadosPorUnidad) > 0)) {
      throw new Error(`Configura los invitados por unidad de ${matched.nombre} antes de presupuestarlo.`);
    }
    const tiers = matched.tramosDePrecio?.filter(t => guestCount >= t.desde && guestCount <= t.hasta);
    if (method === 'tramos' && (tiers?.length !== 1 || !Number.isFinite(tiers[0].precio) || tiers[0].precio < 0)) {
      throw new Error(`El catalogo no tiene un unico tramo valido de ${matched.nombre} para ${guestCount} invitados.`);
    }
    const item: ItemPresupuestado = {
      idServicioCatalogo: matched.id, nombreServicio: matched.nombre, nombre: matched.nombre,
      descripcionServicio: matched.categoria || 'Servicio de catalogo',
      categoriaServicio: matched.categoria, subcategoria: matched.subcategoria,
      calculationMethod: method, invitadosPorUnidad: matched.invitadosPorUnidad,
      tramosDePrecio: matched.tramosDePrecio,
      precioBase: matched.precioBase, precioPorPersona: matched.precioPorPersona,
      cantidad: matched.cantidad ?? 1, unidad: matched.unidad || 'Servicio',
      precioUnitario: price ?? 0, precioUnitarioPresupuesto: price ?? 0, costoTotalItem: 0,
    };
    if (!hasSplit && getGuestCountForItem(item, guestCount, 0, 0) !== guestCount
        && (method === 'porPersona' || method === 'ratio')) {
      throw new Error('Indica cuantos adultos, adolescentes y ninos hay para calcular ese menu.');
    }
    item.cantidad = calculateSuggestedQuantity(item, adultos, adolescentes + ninos);
    item.costoTotalItem = recalcularCostoItem(item, adultos, adolescentes, ninos);
    if (method === 'tramos') item.precioUnitario = item.precioUnitarioPresupuesto = item.costoTotalItem;
    items.push(item);
    desglose.push({
      servicio: matched.nombre, cantidad: item.cantidad, precioUnitario: item.precioUnitario,
      subtotal: item.costoTotalItem, fuente: 'Catalogo oficial de servicios AK',
    });
  }

  const subtotal = roundMoney(items.reduce((acc, it) => acc + (it.costoTotalItem || 0), 0));
  const total = subtotal;

  const validTipoEvento: TipoEvento = (
    ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil'].includes(input.partyType)
      ? input.partyType
      : 'Otro'
  ) as TipoEvento;

  const now = new Date().toISOString();
  const presupuesto: Partial<Presupuesto> = {
    clienteNombre: input.clientName.trim(),
    clienteContacto: input.phone || input.email || '',
    eventoTipo: validTipoEvento,
    eventoFecha: input.eventDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invitadosCantidad: guestCount,
    ...(hasSplit ? { invitadosAdultos: adultos, invitadosAdolescentes: adolescentes, invitadosNinos: ninos } : {}),
    salonFiestas: input.venueName || 'Salto, Uruguay',
    itemsPresupuestados: items,
    costoTotalEstimado: total,
    totalConDescuento: total,
    estado: 'Borrador',
    source: 'simulator_assistant',
    timestamp: now,
  };

  const summary = `Borrador para **${presupuesto.clienteNombre}** (${presupuesto.eventoTipo}, ${guestCount} invitados) · **Total estimado: $ ${total.toLocaleString('es-UY')}** (${items.length} ítems del catálogo).`;

  return {
    presupuesto,
    desglose,
    totalCalculado: total,
    serviciosNoEncontrados,
    summary,
  };
}

/**
 * Guarda el borrador del presupuesto tras confirmación explícita.
 */
export async function confirmAndSaveAssistantBudget(presupuesto: Presupuesto, operationId?: string): Promise<{
  success: boolean;
  presupuestoId?: string;
  error?: string;
}> {
  try {
    const saved = await savePresupuesto({
      ...presupuesto,
      estado: 'Borrador',
    }, operationId ? { operationId } : undefined);
    if (!saved.success || !saved.id) {
      return { success: false, error: saved.error || 'El servidor no confirmo el presupuesto guardado.' };
    }

    return {
      success: true,
      presupuestoId: saved.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Error guardando presupuesto borrador.',
    };
  }
}

/**
 * Prepara un mensaje de WhatsApp personalizado y bien formateado para enviar desde el teléfono del usuario.
 */
export function prepareWhatsAppMessage(input: {
  recipientName: string;
  purpose: 'seguimiento' | 'cuota_vencida' | 'post_fiesta' | 'general';
  eventName?: string;
  amountDue?: number;
  eventDate?: string;
  customDetails?: string;
}): { message: string; waLink: string } {
  let text = '';
  const name = input.recipientName.split(' ')[0];

  switch (input.purpose) {
    case 'seguimiento':
      text = `¡Hola ${name}! 👋 Te escribo de *AK Producciones*. Quería saber cómo venís con los preparativos de ${input.eventName ? `tu *${input.eventName}*` : 'tu evento'} y si te quedó alguna duda con la propuesta que te preparamos. ¡Estamos a las órdenes para armar una reunión o ajustar lo que precises! ✨`;
      break;

    case 'cuota_vencida':
      text = `¡Hola ${name}! 👋 Te escribimos del equipo de *AK Producciones*. Te recordamos que tenés pendiente la cuota del evento${input.amountDue ? ` por un monto de *$ ${input.amountDue.toLocaleString('es-UY')}*` : ''}. Cualquier consulta sobre las formas de pago o transferencias avisanos y lo coordinamos. ¡Muchas gracias! 🙌`;
      break;

    case 'post_fiesta':
      text = `¡Hola ${name}! 🎉 ¡Esperamos que hayan disfrutado al máximo la fiesta! Para todo el equipo de *AK Producciones* fue un placer compartir esa noche con ustedes. Cuando tengas un minuto, nos ayudaría un montón si podés dejarnos tu reseña en Google. ¡Muchas gracias por confiar en nosotros! 🌟`;
      break;

    case 'general':
    default:
      text = `¡Hola ${name}! 👋 Te escribo de *AK Producciones* para coordinar detalles de tu evento. ¡Avisame cuando puedas hablar! ✨`;
      break;
  }

  if (input.customDetails) {
    text += `\n\n${input.customDetails}`;
  }

  return {
    message: text,
    waLink: `https://wa.me/?text=${encodeURIComponent(text)}`,
  };
}
