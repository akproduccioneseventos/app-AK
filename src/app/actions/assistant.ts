'use server';

import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { getDashboardKpiData, type GlobalAlert } from './dashboard';
import { getCompanyInfo, getAiAssistantSettings } from './settings';
import { getPresupuestos, savePresupuesto, addPagoToPresupuesto } from './presupuestos';
import { getCustomers, saveCustomer } from './customers';
import { saveInvoice } from './invoices';
import { getServiciosEmpresa, saveServicioEmpresa } from './servicios-empresa';
import { saveEmpleado } from './empleados';
import { saveProveedor } from './proveedores';
import { createNewFiestaForCustomer, getAllFiestas, saveFiesta } from './fiesta/fiesta.actions';
import { addCrmLead } from './crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import type { Customer } from '@/types/customer';
import * as logger from '@/lib/logger';

const DEFAULT_SERVICE_NAME = 'Servicio';
const SHORT_CONFIRMATION_REGEX = /^(si|dale|crealo|crealo ahora|confirma|hacelo|listo|ok|okay|de acuerdo|bueno|ya)[\s!.]*$/i;
const KNOWLEDGE_DOC_CONTEXT_MAX_CHARS = 1400; // Per-document cap to keep prompt context concise and performant.
type AssistantKnowledgeDocument = Awaited<ReturnType<typeof getAiAssistantSettings>>['knowledgeDocuments'][number];

// ── Parser local determinista de presupuestos en texto libre ─────────────────

interface ParsedBudgetLocal {
  clienteNombre?: string;
  eventoTipo?: string;
  eventoFecha?: string;
  invitados?: number;
  servicios: Array<{ nombre: string; cantidad: number; precioUnitario: number }>;
  descuento?: number;
  total?: number;
  confidence: 'high' | 'medium' | 'low';
}

function parseBudgetFromText(text: string): ParsedBudgetLocal {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const full = text.toLowerCase();

  // --- clienteNombre ---
  let clienteNombre: string | undefined;
  const clientePatterns = [
    /cliente[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)/i,
    /para[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
    /se[ñn]or[a]?[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
    /nombre[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
  ];
  for (const pat of clientePatterns) {
    const m = text.match(pat);
    if (m) { clienteNombre = m[1].trim(); break; }
  }
  // Fallback: first line with two capitalized words (looks like a name)
  if (!clienteNombre) {
    for (const line of lines.slice(0, 5)) {
      const m = line.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)$/);
      if (m && !/(presupuesto|factura|cotizaci[oó]n|empresa|servicio)/i.test(m[1])) {
        clienteNombre = m[1]; break;
      }
    }
  }

  // --- eventoTipo ---
  let eventoTipo: string | undefined;
  const tipoMap: Array<[RegExp, string]> = [
    [/casamiento|boda/i, 'Casamiento'],
    [/cumplea[ñn]os/i, 'Cumpleaños'],
    [/quincea[ñn]os|15\s*a[ñn]os/i, 'Quinceaños'],
    [/egreso/i, 'Egreso'],
    [/corporativo|empresarial/i, 'Corporativo'],
    [/aniversario/i, 'Aniversario'],
    [/fiesta/i, 'Fiesta'],
  ];
  for (const [pat, label] of tipoMap) {
    if (pat.test(full)) { eventoTipo = label; break; }
  }

  // --- eventoFecha ---
  let eventoFecha: string | undefined;
  const fechaPatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/,
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i,
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  ];
  const meses: Record<string, string> = {
    enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',
    julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12',
  };
  for (const pat of fechaPatterns) {
    const m = text.match(pat);
    if (m) {
      if (pat.source.includes('enero')) {
        const mes = meses[m[2].toLowerCase()] ?? '01';
        const anio = m[3] ? m[3] : new Date().getFullYear().toString();
        eventoFecha = `${anio}-${mes}-${m[1].padStart(2,'0')}`;
      } else {
        const dd = m[1].padStart(2,'0');
        const mm = m[2].padStart(2,'0');
        const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
        eventoFecha = `${yy}-${mm}-${dd}`;
      }
      break;
    }
  }

  // --- invitados ---
  let invitados: number | undefined;
  const invPatterns = [
    /(\d+)\s*invitados/i,
    /(\d+)\s*personas/i,
    /(\d+)\s*pax/i,
    /invitados[:\s]+(\d+)/i,
  ];
  for (const pat of invPatterns) {
    const m = text.match(pat);
    if (m) { invitados = parseInt(m[1], 10); break; }
  }

  // --- servicios ---
  const servicios: Array<{ nombre: string; cantidad: number; precioUnitario: number }> = [];

  function cleanNum(s: string): number {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
  }

  for (const line of lines) {
    // Skip header/total/summary lines
    if (/^(total|subtotal|descuento|dto|saldo|se[ñn]a|iva|nota|observ|cliente|fecha|evento|para\s|presupuesto|cotizaci[oó]n)/i.test(line)) continue;

    // Table row: | nombre | precio | or | nombre | cantidad | precio |
    const tableMatch = line.match(/\|([^|]+)\|([^|]+)\|([^|]*)\|?/);
    if (tableMatch) {
      const col1 = tableMatch[1].trim();
      const col2 = tableMatch[2].trim();
      const col3 = tableMatch[3]?.trim();
      const price = col3 ? cleanNum(col3) : cleanNum(col2);
      const qty = col3 ? cleanNum(col2) || 1 : 1;
      if (col1 && price > 0 && !/^(servicio|descripci[oó]n|item|detalle|precio|cantidad|total)/i.test(col1)) {
        servicios.push({ nombre: col1, cantidad: qty, precioUnitario: price / qty });
        continue;
      }
    }

    // Bullet / dash: - Nombre  $12.000 or • Nombre 12.000
    const bulletMatch = line.match(/^[-•*]\s*(.+?)\s+\$?([\d.,]+)$/);
    if (bulletMatch) {
      const nombre = bulletMatch[1].trim();
      const price = cleanNum(bulletMatch[2]);
      if (price > 0 && nombre.length > 2) {
        servicios.push({ nombre, cantidad: 1, precioUnitario: price });
        continue;
      }
    }

    // "Nombre cantidad x precio" or "Nombre    precio"
    const priceInLine = line.match(/\$\s*([\d.,]+)/);
    if (priceInLine) {
      const price = cleanNum(priceInLine[1]);
      if (price > 0) {
        // nombre is everything before the first $ sign
        const nombre = line.split('$')[0].replace(/^\s*[-•*]\s*/, '').trim();
        // quantity pattern: "2 x" or "x2" or "2u"
        const qtyM = nombre.match(/(\d+)\s*[xu×]/i) || nombre.match(/[xu×]\s*(\d+)/i);
        const qty = qtyM ? parseInt(qtyM[1], 10) : 1;
        const nombreClean = nombre.replace(/\d+\s*[xu×]/i, '').replace(/[xu×]\s*\d+/i, '').trim();
        if (nombreClean.length > 2 && !/^(total|descuento|iva|sena|se[ñn]a|saldo)/i.test(nombreClean)) {
          servicios.push({ nombre: nombreClean || 'Servicio', cantidad: qty, precioUnitario: price / qty });
          continue;
        }
      }
    }

    // Line with no $ but ends with a number that looks like a price (≥100)
    const numAtEnd = line.match(/^(.+?)\s+([\d]{1,3}(?:[.,]\d{3})*)$/);
    if (numAtEnd) {
      const nombre = numAtEnd[1].replace(/^\s*[-•*]\s*/, '').trim();
      const price = cleanNum(numAtEnd[2]);
      if (price >= 100 && nombre.length > 2 && !/^(total|descuento|iva|sena|se[ñn]a|saldo|fecha|evento|cliente)/i.test(nombre)) {
        servicios.push({ nombre, cantidad: 1, precioUnitario: price });
      }
    }
  }

  // --- descuento ---
  let descuento: number | undefined;
  const dtoM = text.match(/descuento[:\s]+(\d+(?:[.,]\d+)?)\s*%/i)
    || text.match(/dto[:\s]+(\d+(?:[.,]\d+)?)\s*%/i)
    || text.match(/descuento[:\s]+\$\s*([\d.,]+)/i);
  if (dtoM) descuento = cleanNum(dtoM[1]);

  // --- total ---
  let total: number | undefined;
  const totalM = text.match(/total[:\s]+\$?\s*([\d.,]+)/i);
  if (totalM) total = cleanNum(totalM[1]);

  // --- confidence ---
  const hasCliente = Boolean(clienteNombre);
  const hasTipo = Boolean(eventoTipo);
  const hasServices = servicios.length > 0;

  let confidence: 'high' | 'medium' | 'low';
  if (hasCliente && hasTipo && hasServices) {
    confidence = 'high';
  } else if ((hasCliente || hasTipo) && hasServices) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { clienteNombre, eventoTipo, eventoFecha, invitados, servicios, descuento, total, confidence };
}

function getBudgetParserText(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  forceUseHistory = false
): string {
  const trimmedMessage = message.trim();
  const normalizedMessage = trimmedMessage.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isConfirmationMessage = SHORT_CONFIRMATION_REGEX.test(normalizedMessage);
  const fullConversationText = [...history.map(h => h.content), message].join('\n');

  return (forceUseHistory || (isConfirmationMessage && history.length > 0))
    ? fullConversationText
    : message;
}

function normalizeActionData(rawData: unknown): any {
  if (rawData == null) return rawData;
  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();
    if (!trimmed) return undefined;
    try {
      return JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }
  return rawData;
}

const MAX_SERVICE_NAME_LENGTH = 80;

function isDialogueText(value: string): boolean {
  if (!value) return false;
  // Reject entries that look like conversational text rather than a service name:
  // - too long (real service names are short; MAX_SERVICE_NAME_LENGTH chars is generous)
  if (value.length > MAX_SERVICE_NAME_LENGTH) return true;
  // - multiple sentence-ending punctuation marks (dialogue typically has full sentences)
  if ((value.match(/[.!?]/g) || []).length >= 2) return true;
  // - start with common dialogue openers in Spanish
  if (/^(aquí|acá|claro|por supuesto|entendido|perfecto|voy a|te |le |como|para que|a continuación)/i.test(value.trim())) return true;
  return false;
}

function normalizeServicesInput(rawServices: unknown): Array<{
  nombre?: string;
  name?: string;
  cantidad?: number;
  precioUnitario?: number;
  precio?: number;
  categoria?: string;
  category?: string;
}> {
  if (Array.isArray(rawServices)) {
    return rawServices.filter(
      (item): item is {
        nombre?: string;
        name?: string;
        cantidad?: number;
        precioUnitario?: number;
        precio?: number;
        categoria?: string;
        category?: string;
      } => {
        if (typeof item !== 'object' || item === null) return false;
        const nombre = (item as any).nombre || (item as any).name || '';
        // Reject items whose name looks like dialogue text
        if (isDialogueText(nombre)) return false;
        return true;
      }
    );
  }
  if (typeof rawServices === 'string') {
    const parsed = parseBudgetFromText(rawServices);
    return parsed.servicios.map(s => ({
      nombre: s.nombre,
      cantidad: s.cantidad,
      precioUnitario: s.precioUnitario,
      categoria: 'Servicios',
    }));
  }
  return [];
}

export async function sendAssistantMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  imageDataUri?: string
): Promise<{
  success: boolean;
  response?: string;
  action?: { type: string; data?: any; result?: any };
  error?: string;
}> {
  try {
    logger.info('[Asistente AK] Inicio sendAssistantMessage:', { msgLength: message?.length ?? 0, hasImage: !!imageDataUri });
    // 1. Armar contexto rico con datos reales del negocio
    const [kpiResult, companyInfo, presupuestos, customers, servicios, aiSettings] = await Promise.all([
      getDashboardKpiData(),
      getCompanyInfo(),
      getPresupuestos(),
      getCustomers(),
      getServiciosEmpresa(),
      getAiAssistantSettings(),
    ]);

    const kpi = kpiResult.success ? kpiResult.data : null;

    const context = `
FECHA Y HORA ACTUAL: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}

EMPRESA:
- Nombre: ${companyInfo.companyName || 'AK Producciones'}
- Dirección: ${companyInfo.companyAddress || 'Salto, Uruguay'}
- Contacto: ${companyInfo.companyContact || 'akproduccionessalto@gmail.com'}
- RUT: ${companyInfo.companyTaxId || 'No configurado'}

KPIs:
- Próximo evento: ${kpi?.proximoEvento ? `${kpi.proximoEvento.nombre} (${kpi.proximoEvento.fecha})` : 'Sin eventos próximos'}
- Presupuestos pendientes: ${kpi?.presupuestosPendientes ?? 0}
- Facturas por vencer: ${kpi?.facturasPorVencer ?? 0}
- Alertas activas: ${kpi?.alerts?.length ?? 0}
${kpi?.alerts?.map((a: GlobalAlert) => `  · [${a.severity}] ${a.title}: ${a.description}`).join('\n') || ''}

PRESUPUESTOS RECIENTES (últimos 10):
${presupuestos.slice(-10).map(p => `- ID:${p.id} #${p.numero} ${p.clienteNombre} | ${p.eventoTipo} | $${p.totalConDescuento ?? p.costoTotalEstimado} | ${p.estado} | Fecha: ${p.eventoFecha || 'Sin fecha'}`).join('\n') || 'Sin presupuestos'}

CLIENTES (últimos 10):
${customers.slice(-10).map(c => `- ID:${c.id} ${c.name} | ${c.partyType ?? 'Sin tipo'} | ${c.partyDate ?? 'Sin fecha'} | Tel: ${c.phone || 'Sin tel'}`).join('\n') || 'Sin clientes'}

SERVICIOS DE EMPRESA (primeros 15):
${servicios.slice(0, 15).map(s => `- ID:${s.id} ${s.nombre} | ${s.categoria} | Precio venta: $${s.precioVenta ?? s.valorUnitarioEstimado}`).join('\n') || 'Sin servicios configurados'}
${aiSettings.customInstructions ? `\nINSTRUCCIONES PERSONALIZADAS DEL OPERADOR:\n${aiSettings.customInstructions}` : ''}
${Array.isArray(aiSettings.knowledgeDocuments) && aiSettings.knowledgeDocuments.length > 0
  ? `\nBASE DE CONOCIMIENTO EMPRESARIAL (documentos cargados):\n${aiSettings.knowledgeDocuments
      .slice(0, 8)
      .map((doc: AssistantKnowledgeDocument) => `- ${doc.name || 'Documento'}:\n${(doc.content || '').slice(0, KNOWLEDGE_DOC_CONTEXT_MAX_CHARS)}`)
      .join('\n\n')}`
  : ''}
`;

    // 2. Llamar al flow
    const result = await chatWithAssistant({
      message,
      history,
      context,
      imageDataUri,
    });
    if (result.action) {
      result.action.data = normalizeActionData(result.action.data);
    }

    logger.info('[Asistente AK] AI action received:', JSON.stringify(result.action));

    // 3. Ejecutar acciones si la IA las pidió
    let actionResult: any = null;
    // finalResponse starts as the AI response; budget/import actions will replace it with verified data
    let finalResponse = result.response;

    // Helper: build a verified response message from a saved presupuesto result
    function buildBudgetResponseMessage(
      pres: { numero?: number; clienteNombre: string; id: string; itemsPresupuestados?: any[]; totalConDescuento?: number; costoTotalEstimado?: number },
      verb: string,
      editPath: string,
      extra?: string
    ): string {
      const itemCount = pres.itemsPresupuestados?.length ?? 0;
      const total = pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0;
      const href = `/presupuestos/${pres.id}/ver`;
      if (itemCount > 0) {
        return `✅ ${verb} el presupuesto **#${pres.numero}** para **${pres.clienteNombre}** con **${itemCount} ${itemCount === 1 ? 'servicio' : 'servicios'}** y total **$${total.toLocaleString('es-UY')}**. Podés verlo acá: ${href}${extra ?? ''}`;
      }
      return `⚠️ ${verb.charAt(0).toUpperCase() + verb.slice(1)} el presupuesto **#${pres.numero}** para **${pres.clienteNombre}**, pero quedó **sin servicios**. Podés editarlo manualmente para completarlo: ${editPath}${extra ?? ''}`;
    }

    if (result.action?.type === 'create_customer' && result.action.data) {
      const d = result.action.data;
      try {
        if (!d.name) {
          actionResult = { success: false, error: 'Falta el nombre del cliente.' };
          finalResponse = `❌ No se pudo guardar el cliente: falta el nombre. Intentá de nuevo.`;
        } else {
          const customerResult = await saveCustomer(d);
          actionResult = customerResult;
          if (customerResult.success) {
            const name = d.name;
            const id = customerResult.id;
            finalResponse = `✅ Cliente **${name}** guardado correctamente${id ? ` (ID: ${id})` : ''}. Podés verlo en [/customers${id ? `/${id}` : ''}](/customers${id ? `/${id}` : ''}).`;
          } else {
            finalResponse = `❌ No se pudo guardar el cliente: ${customerResult.error || 'Error desconocido'}. Intentá de nuevo o ingresalo manualmente desde /customers/new.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_customer:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo guardar el cliente. Intentá de nuevo o ingresalo manualmente desde [/customers/new](/customers/new).`;
      }
    } else if (result.action?.type === 'create_customer') {
      actionResult = { success: false, error: 'Falta información del cliente.' };
      finalResponse = `⚠️ Falta información del cliente. Proporcioná al menos el nombre, o ingresalo manualmente desde [/customers/new](/customers/new).`;
    } else if (result.action?.type === 'create_budget' && result.action.data) {
      const d = result.action.data;
      try {
        if (!d.clienteNombre) {
          actionResult = { success: false, error: 'Falta el nombre del cliente.' };
          finalResponse = `❌ No se pudo crear el presupuesto: falta el nombre del cliente. Intentá de nuevo.`;
        } else {
          let serviciosInput: Array<{
            id?: string; nombre?: string; name?: string; descripcion?: string;
            cantidad?: number; precioUnitario?: number; precio?: number; categoria?: string; category?: string;
          }> = normalizeServicesInput(d.servicios);

          // Fallback: if Gemini returned no services but the message has structured text, use local parser
          if (serviciosInput.length === 0) {
            const textToParse = getBudgetParserText(message, history, true);
            const localParsed = parseBudgetFromText(textToParse);
            if (localParsed.servicios.length > 0) {
              logger.info('[Asistente AK] Usando parser local como fallback para servicios');
              serviciosInput = localParsed.servicios.map(s => ({
                nombre: s.nombre,
                cantidad: s.cantidad,
                precioUnitario: s.precioUnitario,
              }));
            }
          }

          // Only keep items with a valid price — discard zero-price or dialogue-contaminated entries
          const items = serviciosInput
            .map((s, i) => {
              const qty = Number(s.cantidad) || 1;
              const price = Number(s.precioUnitario) || Number(s.precio) || 0;
              // Truncate to MAX_SERVICE_NAME_LENGTH — consistent with isDialogueText() limit above
              const nombreServicio = (s.nombre || s.name || DEFAULT_SERVICE_NAME).substring(0, MAX_SERVICE_NAME_LENGTH);
              return {
                idServicioCatalogo: s.id || `asistente_${i}_${Date.now()}`,
                nombreServicio,
                descripcionServicio: s.descripcion,
                cantidad: qty,
                precioUnitario: price,
                precioUnitarioPresupuesto: price,
                costoTotalItem: qty * price,
                categoriaServicio: s.categoria || s.category || 'Servicios',
              };
            })
            .filter(item => item.precioUnitario > 0);
          logger.info('[Asistente AK] Guardando presupuesto:', { clienteNombre: d.clienteNombre, itemCount: items.length });
          const budgetResult = await savePresupuesto({
            clienteNombre: d.clienteNombre,
            eventoTipo: d.eventoTipo || '',
            eventoFecha: d.eventoFecha || '',
            invitadosCantidad: Number(d.invitados) || 0,
            invitadosAdultos: Number(d.invitados) || 0,
            invitadosNinos: 0,
            invitadosAdolescentes: 0,
            itemsPresupuestados: items,
            notas: d.notas || 'Creado desde el Asistente AK',
            estado: 'Borrador',
            senia: d.senia != null ? Number(d.senia) : undefined,
            saldo: d.saldo != null ? Number(d.saldo) : undefined,
            ajusteAnualPorcentaje: d.ajusteAnualPorcentaje != null ? Number(d.ajusteAnualPorcentaje) : undefined,
            fechaFirmaContrato: d.fechaFirmaContrato,
          } as unknown as Omit<Presupuesto, 'id'>);

          if (budgetResult.success && budgetResult.presupuesto) {
            const pres = budgetResult.presupuesto;
            logger.info('[Asistente AK] Presupuesto guardado exitosamente:', pres.id);
            const itemCount = pres.itemsPresupuestados?.length ?? 0;
            const total = pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0;
            const href = `/presupuestos/${pres.id}/ver`;
            actionResult = { ...budgetResult, itemCount, total, href };
            finalResponse = buildBudgetResponseMessage(pres, 'Se creó', `/presupuestos/${pres.id}/editar`);
          } else {
            logger.error('[Asistente AK] Error guardando presupuesto:', budgetResult.error);
            actionResult = budgetResult;
            finalResponse = `❌ No se pudo crear el presupuesto: ${budgetResult.error || 'Error desconocido'}. Intentá de nuevo o crealo manualmente desde /presupuestos/nuevo.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_budget:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo crear el presupuesto. Intentá de nuevo o crealo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
      }
    } else if (result.action?.type === 'create_budget') {
      // Gemini triggered create_budget but returned no action.data — try local parser
      try {
        const textToParse = getBudgetParserText(message, history, true);
        const localParsed = parseBudgetFromText(textToParse);
        const { clienteNombre: lCliente, eventoTipo: lTipo, eventoFecha: lFecha, invitados: lInv, servicios: lServicios, confidence } = localParsed;

        if (confidence === 'low' && lServicios.length === 0) {
          // Nothing useful detected
          actionResult = { success: false, error: 'No se pudo leer la estructura del texto.' };
          finalResponse = `⚠️ Pegaste algo pero no pude leer la estructura. Asegurate de incluir: nombre del cliente, tipo de evento y al menos un servicio con precio. O crealo desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
        } else if (confidence === 'high' || confidence === 'medium') {
          // Enough data to create a draft budget
          const items = lServicios.map((s, i) => ({
            idServicioCatalogo: `parser_${i}_${Date.now()}`,
            nombreServicio: s.nombre,
            cantidad: s.cantidad,
            precioUnitario: s.precioUnitario,
            precioUnitarioPresupuesto: s.precioUnitario,
            costoTotalItem: s.cantidad * s.precioUnitario,
            categoriaServicio: 'Servicios',
          }));
          const budgetResult = await savePresupuesto({
            clienteNombre: lCliente || 'Cliente (revisar)',
            eventoTipo: lTipo || '',
            eventoFecha: lFecha || '',
            invitadosCantidad: lInv || 0,
            invitadosAdultos: lInv || 0,
            invitadosNinos: 0,
            invitadosAdolescentes: 0,
            itemsPresupuestados: items,
            notas: 'Creado desde texto pegado — revisar y completar',
            estado: 'Borrador',
          } as unknown as Omit<Presupuesto, 'id'>);

          if (budgetResult.success && budgetResult.presupuesto) {
            const pres = budgetResult.presupuesto;
            actionResult = { success: true, id: pres.id };
            finalResponse = buildBudgetResponseMessage(pres, 'Se creó un borrador de', `/presupuestos/${pres.id}/editar`, ' — revisá y completá los datos antes de enviarlo.');
          } else {
            actionResult = { success: false, error: budgetResult.error };
            finalResponse = `❌ No se pudo crear el presupuesto: ${budgetResult.error || 'Error desconocido'}. Intentá de nuevo o crealo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
          }
        } else {
          // Low confidence but some fields detected — show what was found and what's missing
          const detectados: string[] = [];
          const faltantes: string[] = [];
          if (lCliente) detectados.push(`Cliente: ${lCliente}`); else faltantes.push('nombre del cliente');
          if (lTipo) detectados.push(`Tipo de evento: ${lTipo}`); else faltantes.push('tipo de evento');
          if (lFecha) detectados.push(`Fecha: ${lFecha}`); else faltantes.push('fecha del evento');
          if (lServicios.length > 0) detectados.push(`${lServicios.length} servicio(s) con precio`); else faltantes.push('servicios con precio');

          actionResult = { success: false, error: 'Datos insuficientes para crear presupuesto.' };
          finalResponse = [
            `⚠️ Pude leer parte del presupuesto, pero me faltó información para crearlo automáticamente.`,
            detectados.length > 0 ? `\n✅ Detecté: ${detectados.join(', ')}` : '',
            faltantes.length > 0 ? `❌ Faltó: ${faltantes.join(', ')}` : '',
            `\nPodés completarlo manualmente en [/presupuestos/nuevo](/presupuestos/nuevo) o volver a pegarlo con esos datos incluidos.`,
          ].filter(Boolean).join('\n');
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en parser local create_budget:', e.message);
        actionResult = { success: false, error: 'No se pudieron extraer los datos del presupuesto.' };
        finalResponse = `⚠️ No se pudieron extraer los datos del presupuesto. Proporcioná nombre del cliente, tipo de evento y servicios, o crealo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
      }
    } else if (result.action?.type === 'import_budget_from_image' && result.action.data) {
      const d = result.action.data;
      try {
        // Paso 1: Validar datos mínimos antes de crear
        const importedServices: Array<{
          id?: string; nombre?: string; name?: string; descripcion?: string;
          cantidad?: number; precioUnitario?: number; precio?: number; categoria?: string; category?: string;
        }> = Array.isArray(d.servicios) ? d.servicios : [];
        const validServices = importedServices.filter(s => {
          const name = s.nombre || s.name;
          const price = Number(s.precioUnitario) || Number(s.precio) || 0;
          return name && name !== DEFAULT_SERVICE_NAME && price > 0;
        });

        if (validServices.length === 0) {
          // NO crear presupuesto, NO crear cliente, NO crear fiesta
          logger.warn('[Asistente AK] Import rejected — no valid services extracted. raw_count:', importedServices.length);
          actionResult = { success: false, error: 'Sin servicios válidos para importar' };
          const extractedInfo: string[] = [];
          if (d.clienteNombre) extractedInfo.push(`Cliente: ${d.clienteNombre}`);
          if (d.eventoTipo) extractedInfo.push(`Tipo: ${d.eventoTipo}`);
          if (d.eventoFecha) extractedInfo.push(`Fecha: ${d.eventoFecha}`);
          const extractedSummary = extractedInfo.length > 0 ? `\n\nDatos parciales detectados: ${extractedInfo.join(', ')}.` : '';
          finalResponse = `⚠️ No se detectaron servicios con precio válido en el archivo. Probá con una imagen más clara o cargá el presupuesto manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).${extractedSummary}`;
        } else {
          // Determine if this is a draft (missing or generic client data)
          const clienteNombreTrimmed = (d.clienteNombre || '').trim();
          const isGenericName = !clienteNombreTrimmed || clienteNombreTrimmed.toLowerCase().startsWith('cliente importado');
          const hasClienteData = !isGenericName;
          const isDraft = !hasClienteData;
          const clienteNombreFinal = hasClienteData ? d.clienteNombre : 'Cliente importado (revisar)';

          // Paso 2: Crear cliente solo si hay datos suficientes
          let clienteId: string | undefined;
          if (hasClienteData) {
            const existingCustomer = customers.find(
              c => c.name.toLowerCase().includes(d.clienteNombre.toLowerCase())
            );
            if (existingCustomer) {
              clienteId = existingCustomer.id;
            } else {
              const newCustomer = await saveCustomer({
                name: d.clienteNombre,
                partyType: d.eventoTipo || '',
                partyDate: d.eventoFecha || '',
                guestCount: d.invitados || 0,
              });
              clienteId = newCustomer.id;
            }
          }
          // Paso 3: Crear presupuesto solo con servicios válidos
          const importedItems = validServices.map((s, i) => {
            const qty = Number(s.cantidad) || 1;
            const price = Number(s.precioUnitario) || Number(s.precio) || 0;
            return {
              idServicioCatalogo: s.id || `importado_${i}_${Date.now()}`,
              nombreServicio: s.nombre || s.name || DEFAULT_SERVICE_NAME,
              descripcionServicio: s.descripcion,
              cantidad: qty,
              precioUnitario: price,
              precioUnitarioPresupuesto: price,
              costoTotalItem: qty * price,
              categoriaServicio: s.categoria || s.category || 'Servicios',
            };
          });
          const budgetResult = await savePresupuesto({
            clienteNombre: clienteNombreFinal,
            eventoTipo: d.eventoTipo || '',
            eventoFecha: d.eventoFecha || '',
            invitadosCantidad: d.invitados || 0,
            invitadosAdultos: d.invitados || 0,
            invitadosNinos: 0,
            invitadosAdolescentes: 0,
            itemsPresupuestados: importedItems,
            notas: isDraft
              ? 'Importado automáticamente — revisar datos'
              : (d.notas || 'Importado desde imagen/PDF vía Asistente AK'),
            estado: 'Borrador',
          } as unknown as Omit<Presupuesto, 'id'>);

          // Paso 4: Crear fiesta SOLO si NO es borrador incompleto y tenemos clienteId
          let fiestaResult: any = null;
          if (clienteId && !isDraft) {
            const customerForFiesta = customers.find(c => c.id === clienteId) || {
              id: clienteId,
              name: d.clienteNombre,
              partyDate: d.eventoFecha,
              partyType: d.eventoTipo,
              guestCount: d.invitados,
            };
            fiestaResult = await createNewFiestaForCustomer({
              id: clienteId,
              name: customerForFiesta.name || d.clienteNombre,
              partyDate: d.eventoFecha,
              partyType: d.eventoTipo,
              guestCount: d.invitados,
            });
          }

          if (budgetResult.success && budgetResult.presupuesto) {
            const pres = budgetResult.presupuesto;
            const itemCount = pres.itemsPresupuestados?.length ?? 0;
            const total = pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0;
            const href = `/presupuestos/${pres.id}/ver`;
            const eventoExtra = fiestaResult?.fiestaId ? ` | [Ver evento](/fiestas/nueva?fiestaId=${fiestaResult.fiestaId})` : '';
            actionResult = { success: true, id: pres.id, fiestaId: fiestaResult?.fiestaId, itemCount, total, href };

            if (isDraft) {
              // Draft with missing client data — never say "importación exitosa"
              logger.info(`[Asistente AK] Import: ${itemCount} valid services, borrador incompleto — missing client name`);
              finalResponse = `📋 Se creó un borrador con ${itemCount} ${itemCount === 1 ? 'servicio' : 'servicios'}, pero faltan datos del cliente. Revisalo en [/presupuestos/${pres.id}/editar](/presupuestos/${pres.id}/editar) antes de compartirlo.`;
            } else if (itemCount < importedServices.length) {
              finalResponse = buildBudgetResponseMessage(pres, 'Se creó un borrador de', `/presupuestos/${pres.id}/editar`, eventoExtra) + ' Algunos servicios no pudieron importarse — revisalo y completá los faltantes.';
            } else {
              finalResponse = buildBudgetResponseMessage(pres, 'Se importó', `/presupuestos/${pres.id}/editar`, eventoExtra);
            }
          } else {
            actionResult = { success: false, error: budgetResult.error };
            finalResponse = `❌ No se pudo importar el presupuesto. Intentá de nuevo o cargalo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en import_budget_from_image:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo importar el presupuesto. Intentá de nuevo o cargalo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
      }
    } else if (result.action?.type === 'import_budget_from_image') {
      actionResult = { success: false, error: 'No se pudieron extraer datos del archivo.' };
      finalResponse = `⚠️ No pude leer el archivo automáticamente. Probá con una imagen más clara o cargalo manualmente desde [/presupuestos/nuevo](/presupuestos/nuevo).`;
    } else if (result.action?.type === 'register_payment' && result.action.data) {
      const d = result.action.data;
      try {
        let presupuestoId = d.presupuestoId;
        if (!presupuestoId && d.clienteNombre) {
          const found = presupuestos
            .filter(p => ['Aceptado', 'Facturado'].includes(p.estado) && p.clienteNombre.toLowerCase().includes(d.clienteNombre.toLowerCase()))
            .sort((a, b) => new Date(b.eventoFecha || 0).getTime() - new Date(a.eventoFecha || 0).getTime());
          presupuestoId = found[0]?.id;
        }
        if (!presupuestoId) {
          actionResult = { success: false, error: 'No se encontró el presupuesto para ese cliente.' };
          finalResponse = `❌ No se pudo registrar el pago: No se encontró el presupuesto para ese cliente. Buscalo manualmente en /presupuestos.`;
        } else {
          const pagoResult = await addPagoToPresupuesto(presupuestoId, {
            fecha: new Date().toISOString(),
            monto: Number(d.monto) || 0,
            metodoPago: d.metodoPago || 'Efectivo',
            referencia: d.referencia,
          });
          actionResult = { success: pagoResult.success, presupuestoId, error: pagoResult.error };
          if (pagoResult.success) {
            const monto = Number(d.monto) || 0;
            finalResponse = `✅ Pago de **$${monto.toLocaleString('es-UY')}** registrado correctamente (${d.metodoPago || 'Efectivo'}). Podés ver el presupuesto en [/presupuestos/${presupuestoId}/ver](/presupuestos/${presupuestoId}/ver).`;
          } else {
            finalResponse = `❌ No se pudo registrar el pago: ${pagoResult.error || 'Error desconocido'}. Intentá de nuevo o registralo manualmente.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en register_payment:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo registrar el pago. Intentá de nuevo o registralo manualmente desde [/presupuestos](/presupuestos).`;
      }
    } else if (result.action?.type === 'register_payment') {
      actionResult = { success: false, error: 'Falta información del pago.' };
      finalResponse = `⚠️ Falta información del pago. Indicá el monto y el cliente, o registralo manualmente desde [/presupuestos](/presupuestos).`;
    } else if (result.action?.type === 'create_invoice' && result.action.data) {
      const d = result.action.data;
      try {
        const customer: Customer = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase())
        ) || {
          id: `tmp_${Date.now()}`,
          name: d.clienteNombre || 'Cliente',
          phone: '',
          partyDate: '',
          partyType: '',
          guestCount: 0,
          venueName: '',
        };
        const rawItems: Array<{ description?: string; quantity?: number; unitPrice?: number }> = Array.isArray(d.items) ? d.items : [];
        const invoiceItems: InvoiceItem[] = rawItems.map((item, i) => ({
          id: `item_${i}_${Date.now()}`,
          description: item.description || DEFAULT_SERVICE_NAME,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        }));
        const subtotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
        const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> = {
          customer,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: invoiceItems,
          subtotal,
          totalAmount: subtotal,
          status: 'Draft',
          notes: d.notas || 'Creada desde el Asistente AK',
          currency: d.currency || 'UYU',
          vendorName: companyInfo.companyName || 'AK Producciones',
          vendorAddress: companyInfo.companyAddress,
          vendorTaxId: companyInfo.companyTaxId,
        };
        const invoiceResult = await saveInvoice(invoiceData as any);
        actionResult = invoiceResult;
        if (invoiceResult.success) {
          const id = (invoiceResult as any).id;
          finalResponse = `✅ Factura creada para **${d.clienteNombre || 'el cliente'}**${id ? ` (ID: ${id})` : ''}. Podés verla en [/invoices${id ? `/${id}` : ''}](/invoices${id ? `/${id}` : ''}).`;
        } else {
          finalResponse = `❌ No se pudo crear la factura: ${(invoiceResult as any).error || 'Error desconocido'}. Intentá de nuevo o creala manualmente desde /invoices/new.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_invoice:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo crear la factura. Intentá de nuevo o creala manualmente desde [/invoices/new](/invoices/new).`;
      }
    } else if (result.action?.type === 'create_invoice') {
      actionResult = { success: false, error: 'Falta información de la factura.' };
      finalResponse = `⚠️ Falta información de la factura. Proporcioná el cliente y los items, o creala manualmente desde [/invoices/new](/invoices/new).`;
    } else if (result.action?.type === 'update_service_price' && result.action.data) {
      const d = result.action.data;
      try {
        let servicio = d.servicioId
          ? servicios.find(s => s.id === d.servicioId)
          : servicios.find(s => s.nombre.toLowerCase().includes((d.servicioNombre || '').toLowerCase()));
        if (!servicio) {
          actionResult = { success: false, error: `No se encontró el servicio "${d.servicioNombre}".` };
          finalResponse = `❌ No se pudo actualizar el precio: No se encontró el servicio "${d.servicioNombre}". Verificá el nombre en /empresa/servicios.`;
        } else {
          const updated = await saveServicioEmpresa({ ...servicio, precioVenta: Number(d.nuevoPrecio) });
          actionResult = { success: updated.success, id: updated.id, error: updated.error };
          if (updated.success) {
            finalResponse = `✅ Precio del servicio **"${servicio.nombre}"** actualizado a **$${Number(d.nuevoPrecio).toLocaleString('es-UY')}**. Podés verlo en [/empresa/servicios](/empresa/servicios).`;
          } else {
            finalResponse = `❌ No se pudo actualizar el precio: ${updated.error || 'Error desconocido'}. Intentá de nuevo.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en update_service_price:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo actualizar el precio. Intentá de nuevo o hacelo manualmente desde [/empresa/servicios](/empresa/servicios).`;
      }
    } else if (result.action?.type === 'update_service_price') {
      actionResult = { success: false, error: 'Falta información para actualizar el precio.' };
      finalResponse = `⚠️ Falta información para actualizar el precio. Indicá el servicio y el nuevo precio, o actualizalo manualmente desde [/empresa/servicios](/empresa/servicios).`;
    } else if (result.action?.type === 'create_employee' && result.action.data) {
      const d = result.action.data;
      try {
        const empResult = await saveEmpleado({
          nombre: d.nombre || '',
          cedula: d.cedula,
          fechaNacimiento: d.fechaNacimiento,
        });
        actionResult = empResult;
        if (empResult.success) {
          finalResponse = `✅ Empleado **${d.nombre || 'nuevo'}** registrado correctamente. Podés verlo en [/empresa/empleados](/empresa/empleados).`;
        } else {
          finalResponse = `❌ No se pudo registrar el empleado: ${(empResult as any).error || 'Error desconocido'}. Intentá de nuevo o ingresalo manualmente desde /empresa/empleados.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_employee:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo registrar el empleado. Intentá de nuevo o ingresalo manualmente desde [/empresa/empleados](/empresa/empleados).`;
      }
    } else if (result.action?.type === 'create_employee') {
      actionResult = { success: false, error: 'Falta información del empleado.' };
      finalResponse = `⚠️ Falta información del empleado. Proporcioná al menos el nombre, o ingresalo manualmente desde [/empresa/empleados](/empresa/empleados).`;
    } else if (result.action?.type === 'create_supplier' && result.action.data) {
      const d = result.action.data;
      try {
        const provResult = await saveProveedor({
          tipo: d.tipo || 'Proveedor',
          nombre: d.nombre || '',
          nombreEmpresa: d.nombreEmpresa || d.nombre || '',
          servicioPrincipal: d.servicioPrincipal || '',
          telefono: d.telefono,
          email: d.email,
          notas: d.notas,
        });
        actionResult = provResult;
        if (provResult.success) {
          const nombre = d.nombreEmpresa || d.nombre || 'nuevo';
          finalResponse = `✅ Proveedor **${nombre}** registrado correctamente. Podés verlo en [/proveedores](/proveedores).`;
        } else {
          finalResponse = `❌ No se pudo registrar el proveedor: ${(provResult as any).error || 'Error desconocido'}. Intentá de nuevo o ingresalo manualmente desde /proveedores.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_supplier:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo registrar el proveedor. Intentá de nuevo o ingresalo manualmente desde [/proveedores](/proveedores).`;
      }
    } else if (result.action?.type === 'create_supplier') {
      actionResult = { success: false, error: 'Falta información del proveedor.' };
      finalResponse = `⚠️ Falta información del proveedor. Proporcioná al menos el nombre, o ingresalo manualmente desde [/proveedores](/proveedores).`;
    } else if (result.action?.type === 'create_lead' && result.action.data) {
      const d = result.action.data;
      try {
        if (!d.name) {
          actionResult = { success: false, error: 'Falta el nombre del prospecto.' };
          finalResponse = `❌ No se pudo registrar el prospecto: falta el nombre. Intentá de nuevo.`;
        } else {
          const leadResult = await addCrmLead({
            name: d.name,
            phone: d.phone,
            email: d.email,
            partyType: d.partyType,
            followUpDate: d.followUpDate,
            guestCount: d.guestCount != null ? (Number(d.guestCount) || undefined) : undefined,
            notes: d.notes,
            budgetSource: 'manual',
          });
          actionResult = leadResult;
          if (leadResult.success && leadResult.lead) {
            const nombre = d.name;
            const id = leadResult.lead.id;
            finalResponse = `✅ Prospecto **${nombre}** registrado en el CRM${id ? ` (ID: ${id})` : ''}. Podés verlo en [/contabilidad/crm](/contabilidad/crm).`;
          } else if (leadResult.duplicate) {
            finalResponse = `⚠️ Ya existe un prospecto con ese teléfono: **${leadResult.duplicate.name}**. Podés verlo en [/contabilidad/crm](/contabilidad/crm).`;
          } else {
            finalResponse = `❌ No se pudo registrar el prospecto: ${leadResult.error || 'Error desconocido'}. Intentá de nuevo o ingresalo manualmente desde /contabilidad/crm.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_lead:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo registrar el prospecto. Intentá de nuevo o ingresalo manualmente desde [/contabilidad/crm](/contabilidad/crm).`;
      }
    } else if (result.action?.type === 'create_lead') {
      actionResult = { success: false, error: 'Falta información del prospecto.' };
      finalResponse = `⚠️ Falta información del prospecto. Proporcioná al menos el nombre, o ingresalo manualmente desde [/contabilidad/crm](/contabilidad/crm).`;
    } else if (result.action?.type === 'create_event' && result.action.data) {
      const d = result.action.data;
      try {
        let clienteId: string;
        const existing = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase())
        );
        if (existing) {
          clienteId = existing.id;
        } else {
          const newCustomer = await saveCustomer({
            name: d.clienteNombre || 'Cliente nuevo',
            phone: d.clientePhone || '',
            partyDate: d.eventoFecha || '',
            partyType: d.eventoTipo || '',
            guestCount: Number(d.invitados) || 0,
            venueName: d.venueName || '',
          });
          clienteId = newCustomer.id || `tmp_${Date.now()}`;
        }
        const fiestaResult = await createNewFiestaForCustomer({
          id: clienteId,
          name: d.clienteNombre || 'Cliente nuevo',
          partyDate: d.eventoFecha,
          partyType: d.eventoTipo,
          venueName: d.venueName,
          guestCount: Number(d.invitados) || 0,
        });
        actionResult = { success: fiestaResult.success, fiestaId: fiestaResult.fiestaId, clienteId, error: fiestaResult.error };
        if (fiestaResult.success) {
          const fiestaId = fiestaResult.fiestaId;
          finalResponse = `✅ Evento creado para **${d.clienteNombre || 'el cliente'}**${d.eventoFecha ? ` el ${d.eventoFecha}` : ''}${fiestaId ? `. Podés verlo en [/fiestas/nueva?fiestaId=${fiestaId}](/fiestas/nueva?fiestaId=${fiestaId})` : ''}.`;
        } else {
          finalResponse = `❌ No se pudo crear el evento: ${fiestaResult.error || 'Error desconocido'}. Intentá de nuevo o crealo manualmente.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en create_event:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo crear el evento. Intentá de nuevo o crealo manualmente desde [/fiestas/nueva](/fiestas/nueva).`;
      }
    } else if (result.action?.type === 'create_event') {
      actionResult = { success: false, error: 'Falta información del evento.' };
      finalResponse = `⚠️ Falta información del evento. Proporcioná el cliente y tipo de evento, o crealo manualmente desde [/fiestas/nueva](/fiestas/nueva).`;
    } else if (result.action?.type === 'update_event' && result.action.data) {
      const d = result.action.data;
      try {
        const allFiestas = await getAllFiestas();
        let fiesta = d.fiestaId
          ? allFiestas.find(f => f.id === d.fiestaId)
          : allFiestas.find(f =>
              (f.configuracion?.nombreEvento || '').toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
              (f.configuracion?.clienteNombre || '').toLowerCase().includes((d.clienteNombre || '').toLowerCase())
            );
        if (!fiesta) {
          actionResult = { success: false, error: 'No se encontró el evento.' };
          finalResponse = `❌ No se pudo actualizar el evento: No se encontró el evento para "${d.clienteNombre || d.fiestaId}". Verificalo en /fiestas/nueva.`;
        } else {
          const updates = d.camposAActualizar || {};
          const updatedFiesta = {
            ...fiesta,
            configuracion: {
              ...fiesta.configuracion,
              ...(updates.fechaEvento ? { fechaEvento: updates.fechaEvento } : {}),
              ...(updates.nombreEvento ? { nombreEvento: updates.nombreEvento } : {}),
              ...(updates.venueName ? { lugarDelEvento: updates.venueName } : {}),
              ...(updates.cantidadInvitados ? { cantidadInvitados: Number(updates.cantidadInvitados) } : {}),
            },
          };
          const saveResult = await saveFiesta(updatedFiesta);
          actionResult = { success: saveResult.success, fiestaId: fiesta.id, error: saveResult.error };
          if (saveResult.success) {
            finalResponse = `✅ Evento actualizado correctamente. Podés verlo en [/fiestas/nueva?fiestaId=${fiesta.id}](/fiestas/nueva?fiestaId=${fiesta.id}).`;
          } else {
            finalResponse = `❌ No se pudo actualizar el evento: ${saveResult.error || 'Error desconocido'}. Intentá de nuevo.`;
          }
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en update_event:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo actualizar el evento. Intentá de nuevo o hacelo manualmente desde [/fiestas](/fiestas).`;
      }
    } else if (result.action?.type === 'update_event') {
      actionResult = { success: false, error: 'Falta información para actualizar el evento.' };
      finalResponse = `⚠️ Falta información para actualizar el evento. Indicá qué cambios querés hacer, o buscá el evento en [/fiestas](/fiestas).`;
    } else if (result.action?.type === 'generate_contract' && result.action.data) {
      const d = result.action.data;
      try {
        const allFiestas = await getAllFiestas();
        let fiesta = d.fiestaId
          ? allFiestas.find(f => f.id === d.fiestaId)
          : d.clienteNombre
          ? allFiestas.find(f =>
              (f.configuracion?.clienteNombre || '').toLowerCase().includes(d.clienteNombre.toLowerCase())
            )
          : undefined;

        // Save contract data to fiesta when found
        if (fiesta) {
          const contratoDatos = {
            senia: d.senia != null ? Number(d.senia) : fiesta.contratoDatos?.senia,
            saldo: d.saldo != null ? Number(d.saldo) : fiesta.contratoDatos?.saldo,
            ajusteAnualPorcentaje: (d.ajusteAnualPorcentaje ?? d.ajusteAnual) != null ? Number(d.ajusteAnualPorcentaje ?? d.ajusteAnual) : fiesta.contratoDatos?.ajusteAnualPorcentaje,
            fechaFirmaContrato: d.fechaFirmaContrato || fiesta.contratoDatos?.fechaFirmaContrato,
            clausulas: d.clausulas || fiesta.contratoDatos?.clausulas,
          };
          const updatedFiesta = { ...fiesta, contratoDatos };
          await saveFiesta(updatedFiesta);
          actionResult = { success: true, href: `/fiestas/nueva/gestion-documental/contrato-digital?fiestaId=${fiesta.id}` };
          finalResponse = `✅ Datos del contrato guardados para el evento de **${fiesta.configuracion?.clienteNombre || d.clienteNombre || 'el cliente'}**. Podés ver y firmar el contrato en [contrato-digital](/fiestas/nueva/gestion-documental/contrato-digital?fiestaId=${fiesta.id}).`;
        } else if (d.fiestaId) {
          actionResult = { success: false, error: 'No se encontró el evento.' };
          finalResponse = `❌ No se pudo generar el contrato: No se encontró el evento. Verificalo en /fiestas/nueva.`;
        } else {
          actionResult = { success: true, href: '/fiestas/nueva/gestion-documental/contrato-digital' };
          finalResponse = `✅ Podés generar el contrato en [contrato-digital](/fiestas/nueva/gestion-documental/contrato-digital). Seleccioná el evento desde ahí.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en generate_contract:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo generar el contrato. Intentá de nuevo o hacelo manualmente desde [/fiestas/nueva/gestion-documental/contrato-digital](/fiestas/nueva/gestion-documental/contrato-digital).`;
      }
    } else if (result.action?.type === 'generate_contract') {
      actionResult = { success: false, error: 'Falta información para generar el contrato.' };
      finalResponse = `⚠️ Falta información para generar el contrato. Proporcioná el cliente o evento, o generalo manualmente desde [/fiestas/nueva/gestion-documental/contrato-digital](/fiestas/nueva/gestion-documental/contrato-digital).`;
    } else if (result.action?.type === 'check_availability' && result.action.data) {
      const d = result.action.data;
      try {
        const allFiestas = await getAllFiestas();
        const fecha = d.fecha || '';
        const eventosEnFecha = allFiestas.filter(f => {
          const fe = f.configuracion?.fechaEvento || '';
          return fe && fe.startsWith(fecha.substring(0, Math.min(10, fecha.length)));
        });
        actionResult = {
          success: true,
          fecha,
          disponible: eventosEnFecha.length === 0,
          eventosEnFecha: eventosEnFecha.map(f => ({
            nombre: f.configuracion?.nombreEvento || f.configuracion?.clienteNombre || 'Evento sin nombre',
            tipo: f.configuracion?.tipoCelebracion || '',
          })),
        };
        if (eventosEnFecha.length === 0) {
          finalResponse = `✅ La fecha **${fecha}** está **libre** — no tenés eventos agendados para ese día.`;
        } else {
          const nombres = eventosEnFecha.map(f => f.configuracion?.nombreEvento || f.configuracion?.clienteNombre || 'Evento').join(', ');
          finalResponse = `⚠️ La fecha **${fecha}** ya tiene **${eventosEnFecha.length} evento(s)** agendado(s): ${nombres}. Verificá antes de comprometerte.`;
        }
      } catch (e: any) {
        logger.error('[Asistente AK] Error en check_availability:', e.message);
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ No se pudo verificar la disponibilidad. Intentá de nuevo o revisá el calendario en [/fiestas/nueva](/fiestas/nueva).`;
      }
    } else if (result.action?.type === 'check_availability') {
      actionResult = { success: false, error: 'Falta la fecha para consultar disponibilidad.' };
      finalResponse = `⚠️ Falta la fecha para consultar disponibilidad. Indicá la fecha que querés consultar, o revisá el calendario en [/fiestas/nueva](/fiestas/nueva).`;
    } else if (result.action?.type === 'generate_social_post' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    } else if (result.action?.type === 'generate_social_post') {
      actionResult = { success: false, error: 'No se pudo generar el post.' };
      finalResponse = `⚠️ No se pudo generar el post. Indicá la plataforma y el contenido que querés, o crealo manualmente desde [/marketing](/marketing).`;
    } else if (result.action?.type === 'generate_whatsapp_message' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    } else if (result.action?.type === 'generate_whatsapp_message') {
      actionResult = { success: false, error: 'No se pudo generar el mensaje de WhatsApp.' };
      finalResponse = `⚠️ No se pudo generar el mensaje de WhatsApp. Indicá el tipo de mensaje y el cliente, o redactalo manualmente.`;
    } else if (result.action?.type === 'generate_promo' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    } else if (result.action?.type === 'generate_promo') {
      actionResult = { success: false, error: 'No se pudo generar la promoción.' };
      finalResponse = `⚠️ No se pudo generar la promoción. Indicá los detalles del descuento o vigencia, o creala manualmente desde [/marketing](/marketing).`;
    } else if (result.action?.type === 'update_marketing_content') {
      actionResult = { success: true, href: '/marketing' };
    } else if (result.action?.type && result.action.type !== 'none' && result.action.type !== 'navigate' && result.action.type !== 'show_manual' && result.action.type !== 'query_data') {
      // CATCH-ALL: acción de backend no reconocida — evitar respuesta falsa.
      logger.warn('[Asistente AK] Unrecognized action type:', result.action.type, 'data:', JSON.stringify(result.action.data));
      actionResult = { success: false, error: 'Acción no reconocida o no ejecutable.' };
      finalResponse = `⚠️ No pude ejecutar esa acción automáticamente. Podés hacerlo manualmente desde la sección correspondiente.`;
    }

    return {
      success: true,
      response: finalResponse,
      action: result.action ? { ...result.action, result: actionResult } as any : undefined,
    };
  } catch (error: any) {
    const errorMessage: string = error?.message || String(error);
    logger.error('[Asistente AK] Error en sendAssistantMessage:', errorMessage);

    // Error 403 de Gemini / API key issues
    if (
      (errorMessage.includes('FAILED_PRECONDITION') && errorMessage.includes('API key')) ||
      errorMessage.includes('GEMINI_API_KEY') ||
      errorMessage.includes('GOOGLE_API_KEY') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('denied access') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('not configured') ||
      errorMessage.includes('permission')
    ) {
      logger.error('[Asistente AK] Gemini 403/permission error:', errorMessage);
      return {
        success: false,
        response: 'No pude procesar tu mensaje en este momento. Intentá de nuevo en unos minutos.',
        error: 'Servicio temporalmente no disponible',
      };
    }

    // For quota exceeded errors
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota')
    ) {
      return {
        success: false,
        response: 'El asistente está temporalmente saturado. Intentá de nuevo en unos minutos.',
        error: 'El asistente está temporalmente saturado. Intentá de nuevo en unos minutos.',
      };
    }

    // For model not found / unavailable
    if (
      errorMessage.includes('404') ||
      errorMessage.includes('NOT_FOUND') ||
      errorMessage.includes('model') ||
      errorMessage.includes('not found')
    ) {
      return {
        success: false,
        response: 'El modelo de IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
        error: 'El modelo de IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
      };
    }

    // Error de red/timeout
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network')
    ) {
      logger.error('[Asistente AK] Network error:', errorMessage);
      return {
        success: false,
        response: 'No se pudo conectar al servicio. Verificá tu conexión e intentá de nuevo.',
        error: 'Error de conexión',
      };
    }

    // Error genérico — NUNCA exponer detalles técnicos
    logger.error('[Asistente AK] Unexpected error:', errorMessage);
    return {
      success: false,
      response: 'Ocurrió un error inesperado. Intentá de nuevo o hacelo manualmente.',
      error: 'Error interno',
    };
  }
}
