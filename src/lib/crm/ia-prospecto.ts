import {
  geminiCommercialModel,
  generateWithGeminiFallback,
  isRecoverableGeminiModelError,
} from '@/ai/genkit';
import { reservarConsumoIA, anotarFalloIA } from '@/lib/ai/consumo-servidor';
import {
  enlaceAlSimuladorDelProspecto,
  extraerDatosPresupuestoProspecto,
} from '@/lib/whatsapp/datos-prospecto';
import { readData, writeData, mutateDataItem } from '@/lib/data-service';
import { crmMutex } from '@/lib/crm/turno-crm';
import { buildCrmMensaje, mergeConversacionMessages } from '@/lib/crm/conversacion';
import type { CrmLead, CrmMensaje } from '@/types/crm';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

export type TemperaturaComercialCRM = 'frio' | 'tibio' | 'caliente';

export interface ResultadoAnalisisCRM {
  resumenIA: string;
  leadTemperature: TemperaturaComercialCRM;
  nextAction: string;
  eventDate?: string;
  guestCount?: number;
  partyType?: string;
  venueName?: string;
  borradorRespuesta: string;
  usandoIA: boolean;
}

const LEADS_FILE = 'crm-leads.json';
const CRM_LEADS_COLLECTION = 'prospectos';
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

function unaLinea(texto: string, maxLen = 160): string {
  return String(texto || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function normalizarTemperaturaCRM(valor: unknown, textoFallback = ''): TemperaturaComercialCRM {
  const raw = String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (raw === 'caliente' || raw === 'urgente' || raw === 'hot' || raw === 'alta') {
    return 'caliente';
  }
  if (raw === 'tibio' || raw === 'tibia' || raw === 'warm' || raw === 'media') {
    return 'tibio';
  }
  if (raw === 'frio' || raw === 'fria' || raw === 'cold' || raw === 'baja') {
    return 'frio';
  }

  const t = textoFallback.toLowerCase();
  if (/presupuesto|reservar|disponib|fecha|salon|salón|invitados|cuanto sale|cuánto sale|entrevista|contratar/i.test(t)) {
    return /fecha|invitados|salon|salón|entrevista|presupuesto/i.test(t) ? 'caliente' : 'tibio';
  }
  return 'frio';
}

export function sanitizarBorradorSinRangosInventados(texto: string, enlaceSimulador: string): string {
  let limpio = String(texto || '')
    .replace(/\bgarant[ií]a(s)?\b/gi, 'compromiso')
    .replace(/\bgarantiz\w*\b/gi, 'asegurar')
    .replace(/\b24\/7\b/gi, 'todos los días')
    .replace(/\bcongel(ar|amos|ado|ada|ás)?\b/gi, 'mantener')
    .trim();

  // Nunca permitir rangos de precios inventados (ej: "entre $50.000 y $80.000", "de 40000 a 60000").
  limpio = limpio.replace(
    /(?:entre|desde|de|aprox(?:imadamente)?|alrededor\s+de)?\s*(?:\$|uyu|usd)?\s*\d[\d.,]{2,}\s*(?:y|a|hasta|-|–)\s*(?:\$|uyu|usd)?\s*\d[\d.,]{2,}\s*(?:pesos|uyu|usd|dólares|dolares)?/gi,
    `el valor exacto en el simulador (${enlaceSimulador})`,
  );

  if (!limpio) {
    return `¡Hola! Gracias por escribirnos. Podés armar y ver tu presupuesto en el momento acá: ${enlaceSimulador}. Si querés, coordinamos una entrevista sin compromiso para repasar todo.`;
  }

  return limpio;
}

async function leerPreciosDeListaPublicos(): Promise<string> {
  try {
    const [config, servicios] = await Promise.all([
      readData<Partial<ArmadoRapidoConfig>>('armado-rapido-config.json', {}),
      readData<ServicioEmpresa[]>('servicios-empresa.json', []),
    ]);
    const lineas: string[] = [];
    if (config?.clubUruguayConfig?.activo && Number(config.clubUruguayConfig.precio) > 0) {
      lineas.push(`- Salón Club Uruguay (precio de lista): $${Number(config.clubUruguayConfig.precio).toLocaleString('es-UY')} UYU`);
    }
    const serviciosConPrecio = (Array.isArray(servicios) ? servicios : [])
      .filter((s) => s.tipoItem === 'Servicio' && Number(s.precioVenta || s.precioBase || s.precioPorPersona) > 0)
      .slice(0, 10);
    for (const s of serviciosConPrecio) {
      const precio = Number(s.precioVenta || s.precioBase || s.precioPorPersona);
      const unidad = s.calculationMethod === 'porPersona' ? 'por persona' : 'fijo';
      lineas.push(`- ${s.nombre}: $${precio.toLocaleString('es-UY')} UYU (${unidad})`);
    }
    return lineas.join('\n');
  } catch {
    return '';
  }
}

/**
 * Analiza un mensaje entrante de un prospecto para el CRM.
 * Usa `geminiCommercialModel` + `reservarConsumoIA`.
 * Si no hay presupuesto de IA o falla el modelo, arma un análisis seguro sin inventar precios.
 */
export async function analizarMensajeEntranteParaCRM(params: {
  lead?: Partial<CrmLead> | null;
  mensaje: string;
  canal?: string;
  historial?: CrmMensaje[];
}): Promise<ResultadoAnalisisCRM> {
  const lead = params.lead || {};
  const mensaje = String(params.mensaje || '').trim();
  const extraidoLocal = extraerDatosPresupuestoProspecto(mensaje);

  const eventDateCandidate = lead.eventDate || extraidoLocal.fecha;
  const guestCountCandidate = lead.guestCount ?? extraidoLocal.invitados;
  const partyTypeCandidate = lead.partyType || extraidoLocal.tipoEvento;
  const venueNameCandidate = lead.venueName || extraidoLocal.salon;

  const enlaceSimulador = enlaceAlSimuladorDelProspecto({
    fecha: eventDateCandidate,
    invitados: guestCountCandidate,
    tipoEvento: partyTypeCandidate,
    salon: venueNameCandidate,
  });

  const nombre = (lead.name || 'Hola').split(' ')[0];
  const fallbackTemp = normalizarTemperaturaCRM(undefined, mensaje);
  const fallbackResumen = unaLinea(
    `${partyTypeCandidate ? `${partyTypeCandidate}: ` : ''}${mensaje || 'Consulta recibida por mensaje.'}`,
  );
  const faltantes: string[] = [];
  if (!eventDateCandidate) faltantes.push('fecha');
  if (!guestCountCandidate) faltantes.push('cantidad de invitados');
  if (!partyTypeCandidate) faltantes.push('tipo de fiesta');
  if (!venueNameCandidate) faltantes.push('salón o zona');

  const fallbackNextAction = faltantes.length > 0
    ? `Pedirle ${faltantes.join(', ')} y pasarle el simulador.`
    : 'Revisar el borrador, verificar disponibilidad y mandárselo por WhatsApp.';

  const fallbackBorrador = faltantes.length > 0
    ? `¡Hola ${nombre}! Gracias por escribirnos a AK Producciones. Para pasarte tu presupuesto en el momento, ¿me contás ${faltantes.join(' y ')}? También podés ir simulando tu fiesta acá: ${enlaceSimulador}`
    : `¡Hola ${nombre}! Con lo que nos contaste ya podés armar y ver tu presupuesto en el momento acá: ${enlaceSimulador}. Si querés, coordinamos una entrevista gratis para ver todos los detalles.`;

  const fallbackResultado: ResultadoAnalisisCRM = {
    resumenIA: fallbackResumen,
    leadTemperature: fallbackTemp,
    nextAction: fallbackNextAction,
    ...(extraidoLocal.fecha ? { eventDate: extraidoLocal.fecha } : {}),
    ...(extraidoLocal.invitados ? { guestCount: extraidoLocal.invitados } : {}),
    ...(extraidoLocal.tipoEvento ? { partyType: extraidoLocal.tipoEvento } : {}),
    ...(extraidoLocal.salon ? { venueName: extraidoLocal.salon } : {}),
    borradorRespuesta: sanitizarBorradorSinRangosInventados(fallbackBorrador, enlaceSimulador),
    usandoIA: false,
  };

  if (!mensaje) {
    return fallbackResultado;
  }

  let reserva: Awaited<ReturnType<typeof reservarConsumoIA>> = null;
  try {
    reserva = await reservarConsumoIA('extraccion-prospecto-whatsapp');
  } catch {
    reserva = null;
  }

  if (!reserva) {
    return fallbackResultado;
  }

  const historialTexto = (params.historial || [])
    .slice(-6)
    .map((m) => `${m.direccion === 'entrante' ? 'Prospecto' : 'Equipo'}: ${m.texto}`)
    .join('\n');

  const preciosLista = await leerPreciosDeListaPublicos();

  const prompt = `Sos el asistente comercial de AK Producciones (Salto, Uruguay). Hablás siempre en español rioplatense ("vos", "podés", criollo claro).
Analizá este mensaje entrante de un prospecto para actualizar su ficha del CRM y preparar un borrador de respuesta (que un humano revisará antes de abrir en WhatsApp).

DATOS YA CARGADOS EN LA FICHA (no inventes ni los cambies si ya están):
- Nombre: ${lead.name || 'Sin nombre'}
- Canal: ${params.canal || lead.canalOrigen || 'whatsapp'}
- Fecha ya cargada: ${lead.eventDate || 'vacío'}
- Invitados ya cargados: ${lead.guestCount ?? 'vacío'}
- Tipo de fiesta ya cargado: ${lead.partyType || 'vacío'}
- Salón ya cargado: ${lead.venueName || 'vacío'}

${historialTexto ? `HISTORIAL RECIENTE:\n${historialTexto}\n` : ''}
MENSAJE NUEVO DEL PROSPECTO:
"${mensaje.replace(/"/g, '\\"')}"

ENLACE AL SIMULADOR DEL PROSPECTO:
${enlaceSimulador}

${preciosLista ? `PRECIOS DE LISTA OFICIALES (únicos precios reales permitidos):\n${preciosLista}\n` : ''}

REGLAS OBLIGATORIAS:
1. "resumenIA": resumen de UNA sola línea (máximo 15 palabras) en criollo.
2. "leadTemperature": SOLO uno de "frio", "tibio" o "caliente".
3. "nextAction": próximo paso concreto en criollo (ej: "Pasarle el simulador y confirmar fecha del 15/11").
4. "eventDate" (YYYY-MM-DD o null), "guestCount" (número entero o null), "partyType" (string o null), "venueName" (string o null): extraelos SOLO si aparecen en el mensaje.
5. "borradorRespuesta": respuesta lista para que una persona abra en WhatsApp. NUNCA inventes rangos de precios ("entre $X y $Y"). Si pregunta precio, llevalo al simulador (${enlaceSimulador}) o usá ÚNICAMENTE un precio de lista exacto de arriba si corresponde. Nunca uses "garantía", "24/7" ni "congelar".

Devolvé ÚNICAMENTE JSON válido con esas 8 claves.`;

  try {
    const aiRes = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      prompt,
      output: { format: 'json' },
    });

    const parsed = (aiRes?.output && typeof aiRes.output === 'object')
      ? (aiRes.output as Record<string, unknown>)
      : (() => {
          const raw = (aiRes?.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
          const match = raw.match(/\{[\s\S]*\}/);
          return match ? (JSON.parse(match[0]) as Record<string, unknown>) : null;
        })();

    if (!parsed) {
      return fallbackResultado;
    }

    const resumenIA = unaLinea(String(parsed.resumenIA || fallbackResumen)) || fallbackResumen;
    const leadTemperature = normalizarTemperaturaCRM(parsed.leadTemperature, mensaje);
    const nextAction = unaLinea(String(parsed.nextAction || fallbackNextAction), 200) || fallbackNextAction;

    const eventDate = typeof parsed.eventDate === 'string' && parsed.eventDate.trim() && parsed.eventDate !== 'null'
      ? parsed.eventDate.trim()
      : extraidoLocal.fecha;
    const guestCountRaw = Number(parsed.guestCount);
    const guestCount = Number.isFinite(guestCountRaw) && guestCountRaw > 0
      ? Math.round(guestCountRaw)
      : extraidoLocal.invitados;
    const partyType = typeof parsed.partyType === 'string' && parsed.partyType.trim() && parsed.partyType !== 'null'
      ? parsed.partyType.trim()
      : extraidoLocal.tipoEvento;
    const venueName = typeof parsed.venueName === 'string' && parsed.venueName.trim() && parsed.venueName !== 'null'
      ? parsed.venueName.trim()
      : extraidoLocal.salon;

    const enlaceFinal = enlaceAlSimuladorDelProspecto({
      fecha: lead.eventDate || eventDate,
      invitados: lead.guestCount ?? guestCount,
      tipoEvento: lead.partyType || partyType,
      salon: lead.venueName || venueName,
    });

    const borradorRespuesta = sanitizarBorradorSinRangosInventados(
      String(parsed.borradorRespuesta || fallbackBorrador),
      enlaceFinal,
    );

    return {
      resumenIA,
      leadTemperature,
      nextAction,
      ...(eventDate ? { eventDate } : {}),
      ...(guestCount ? { guestCount } : {}),
      ...(partyType ? { partyType } : {}),
      ...(venueName ? { venueName } : {}),
      borradorRespuesta,
      usandoIA: true,
    };
  } catch (err) {
    if (isRecoverableGeminiModelError(err)) {
      await reserva.liberar().catch(() => {});
    }
    await anotarFalloIA('ia-crm-prospecto', err instanceof Error ? err.message : String(err)).catch(() => {});
    return fallbackResultado;
  }
}

/**
 * Aplica el análisis de IA sobre un prospecto del CRM **sin pisar nunca** los datos
 * que el equipo o el simulador ya cargaron (fecha, invitados, tipo de fiesta, salón).
 */
export function aplicarAnalisisSinPisar(
  lead: CrmLead,
  analisis: ResultadoAnalisisCRM,
  ahoraIso: string = new Date().toISOString(),
): CrmLead {
  const tieneEventDate = Boolean(lead.eventDate && String(lead.eventDate).trim());
  const tieneGuestCount = typeof lead.guestCount === 'number' && lead.guestCount > 0;
  const tienePartyType = Boolean(lead.partyType && String(lead.partyType).trim());
  const tieneVenueName = Boolean(lead.venueName && String(lead.venueName).trim());

  return {
    ...lead,
    eventDate: tieneEventDate ? lead.eventDate : (analisis.eventDate || lead.eventDate),
    guestCount: tieneGuestCount ? lead.guestCount : (analisis.guestCount ?? lead.guestCount),
    partyType: tienePartyType ? lead.partyType : (analisis.partyType || lead.partyType),
    venueName: tieneVenueName ? lead.venueName : (analisis.venueName || lead.venueName),
    resumenIA: analisis.resumenIA,
    leadTemperature: analisis.leadTemperature,
    nextAction: analisis.nextAction,
    borradorRespuesta: analisis.borradorRespuesta,
    borradorRespuestaAt: ahoraIso,
    updatedAt: ahoraIso,
  };
}

/**
 * Registra un mensaje en la conversación de un prospecto del CRM y ejecuta el análisis IA
 * sin pisar datos cargados previamente.
 */
export async function registrarMensajeYAnalizarProspecto(params: {
  leadId: string;
  mensaje: CrmMensaje;
  analizar?: boolean;
}): Promise<CrmLead | null> {
  const { leadId, mensaje } = params;
  const ahoraIso = mensaje.fecha || new Date().toISOString();

  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const target = leads.find((l) => l.id === leadId);
  if (!target) return null;

  const conversacionActualizada = mergeConversacionMessages(target.conversacion, [mensaje]) || [];

  let analisis: ResultadoAnalisisCRM | null = null;
  if (params.analizar !== false && mensaje.direccion === 'entrante') {
    analisis = await analizarMensajeEntranteParaCRM({
      lead: target,
      mensaje: mensaje.texto,
      canal: mensaje.canal,
      historial: conversacionActualizada,
    });
  }

  const aplicarSobre = (actual: CrmLead): CrmLead => {
    const conv = mergeConversacionMessages(actual.conversacion, [mensaje]) || [];

    const conConv: CrmLead = {
      ...actual,
      conversacion: conv,
      ...(mensaje.direccion === 'entrante' ? { lastInboundAt: ahoraIso } : {}),
      ...(actual.canalOrigen ? {} : { canalOrigen: mensaje.canal }),
      updatedAt: ahoraIso,
    };

    return analisis ? aplicarAnalisisSinPisar(conConv, analisis, ahoraIso) : conConv;
  };

  if (!SIN_BASE()) {
    try {
      return await mutateDataItem<CrmLead>(LEADS_FILE, CRM_LEADS_COLLECTION, leadId, (actual) =>
        JSON.parse(JSON.stringify(aplicarSobre(actual))) as CrmLead,
      );
    } catch {
      // fallback a mutex local
    }
  }

  return crmMutex.runExclusive(async () => {
    const freshLeads = await readData<CrmLead[]>(LEADS_FILE, []);
    const idx = freshLeads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;
    freshLeads[idx] = aplicarSobre(freshLeads[idx]);
    await writeData(LEADS_FILE, freshLeads);
    return freshLeads[idx];
  });
}

/**
 * Analiza un mensaje ya guardado en la ficha de un prospecto sin duplicar mensajes.
 */
export async function enriquecerLeadExistenteConIA(params: {
  leadId: string;
  mensaje: string;
  canal?: string;
}): Promise<CrmLead | null> {
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const target = leads.find((l) => l.id === params.leadId);
  if (!target) return null;

  const analisis = await analizarMensajeEntranteParaCRM({
    lead: target,
    mensaje: params.mensaje,
    canal: params.canal,
    historial: target.conversacion,
  });

  const ahoraIso = new Date().toISOString();
  const aplicar = (actual: CrmLead): CrmLead => aplicarAnalisisSinPisar(actual, analisis, ahoraIso);

  if (!SIN_BASE()) {
    try {
      return await mutateDataItem<CrmLead>(LEADS_FILE, CRM_LEADS_COLLECTION, params.leadId, (actual) =>
        JSON.parse(JSON.stringify(aplicar(actual))) as CrmLead,
      );
    } catch {
      // fallback a mutex local
    }
  }

  return crmMutex.runExclusive(async () => {
    const freshLeads = await readData<CrmLead[]>(LEADS_FILE, []);
    const idx = freshLeads.findIndex((l) => l.id === params.leadId);
    if (idx === -1) return null;
    freshLeads[idx] = aplicar(freshLeads[idx]);
    await writeData(LEADS_FILE, freshLeads);
    return freshLeads[idx];
  });
}

export { buildCrmMensaje };
