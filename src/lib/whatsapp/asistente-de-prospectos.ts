import { createHash } from 'crypto';
import { AsyncMutex } from '@/lib/mutex';
import { mutateDataItem, readData, writeData } from '@/lib/data-service';
import { buildWhatsAppLink, normalizeUruguayPhone } from '@/lib/commercial/contact';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import type { AsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import {
  enlaceAlSimuladorDelProspecto,
  extraerDatosPresupuestoProspecto,
  type DatosPresupuestoProspecto,
} from '@/lib/whatsapp/datos-prospecto';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { getSalonesPublicos } from '@/app/actions/salones';
import { PREGUNTAS_FRECUENTES_DEL_CONTRATO } from '@/data/preguntas-frecuentes-contrato';
import {
  geminiCommercialModel,
  generateWithGeminiFallback,
  isRecoverableGeminiModelError,
} from '@/ai/genkit';
import type { CrmLead } from '@/types/crm';

import {
  MENSAJE_BIENVENIDA_PROSPECTO,
  OPCIONES_BIENVENIDA_PROSPECTO,
} from '@/lib/whatsapp/textos-prospecto';

export { MENSAJE_BIENVENIDA_PROSPECTO, OPCIONES_BIENVENIDA_PROSPECTO };

export type CanalProspecto = 'whatsapp' | 'web' | 'instagram_dm' | 'messenger';

export interface EstadoConversacionProspecto {
  key: string;
  canal: CanalProspecto;
  remitenteId: string;
  yaSaludo: boolean;
  atiende: 'asistente' | 'persona';
  refCode: string;
  datos: DatosPresupuestoProspecto;
  fechaYaConsultada?: string;
  presupuestoEnviado?: boolean;
  historial: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>;
  updatedAt: string;
}

export interface ResultadoAtencionProspecto {
  silenciado: boolean;
  motivo?: string;
  respuesta?: string;
  opciones?: string[];
  atiende: 'asistente' | 'persona';
  pasoAPersona?: boolean;
  budgetUrl?: string;
  whatsappUrl?: string;
  datos: DatosPresupuestoProspecto;
  refCode: string;
  leadId?: string;
}

const ESTADO_FILE = 'asistente-prospectos-estados.json';
const estadoMutex = new AsyncMutex();
const crmSyncMutex = new AsyncMutex();

function normalizarTexto(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizarIdRemitente(canal: CanalProspecto, remitenteId: string): string {
  if (canal === 'whatsapp') {
    const uy = normalizeUruguayPhone(remitenteId);
    if (uy) return uy;
    const digits = String(remitenteId || '').replace(/\D/g, '');
    return digits || String(remitenteId || '').trim();
  }
  return String(remitenteId || '').trim();
}

export function generarCodigoReferencia(seed: string): string {
  const hash = createHash('sha256').update(seed || 'ak').digest('hex').slice(0, 6).toUpperCase();
  return `AK-${hash}`;
}

export function armarEnlaceWhatsAppProspecto(
  datos: DatosPresupuestoProspecto,
  refCode: string,
  phone: string = AK_WHATSAPP_NUMBER,
): string {
  const partes: string[] = ['¡Hola AK! Quiero seguir mi consulta con una persona del equipo.'];
  if (datos.tipoEvento) partes.push(`Fiesta: ${datos.tipoEvento}`);
  if (datos.fecha) partes.push(`Fecha: ${datos.fecha}`);
  if (datos.invitados) partes.push(`Invitados: ${datos.invitados}`);
  if (datos.salon) partes.push(`Salón: ${datos.salon}`);
  partes.push(`(ref ${refCode})`);
  return buildWhatsAppLink(phone, partes.join(' | '));
}

export function pidePersona(texto: string): boolean {
  const raw = String(texto || '').trim();
  const norm = normalizarTexto(raw);
  if (!norm) return false;

  if (norm === 'quiero una persona' || norm === 'persona' || norm === 'humano' || norm === 'alguien') {
    return true;
  }

  // Evitar falso positivo con "120 personas"
  const sinCantidadPersonas = norm.replace(/\b\d+\s*personas\b/g, ' ');

  if (
    /\b(?:quiero\s+(?:hablar\s+con\s+)?(?:una?\s+)?persona|quiero\s+human[oa]|hablar\s+con\s+(?:alguien|una?\s+persona|human[oa]|el\s+equipo|ustedes|el\s+dueno|alexander)|prefiero\s+(?:una\s+persona|hablar\s+con)|pasa(?:me)?\s+con\s+(?:alguien|una\s+persona)|atencion\s+humana)\b/.test(
      sinCantidadPersonas,
    )
  ) {
    return true;
  }

  if (/\b(?:humano|humana|alguien)\b/.test(sinCantidadPersonas)) {
    return true;
  }

  if (/\bpersona\b/.test(sinCantidadPersonas) && !/\bpor\s+persona\b/.test(sinCantidadPersonas)) {
    return true;
  }

  if (/\bhablar\s+con\b/.test(sinCantidadPersonas)) {
    return true;
  }

  return false;
}

export function quiereSeguirConAsistente(texto: string): boolean {
  const norm = normalizarTexto(texto);
  return (
    norm === 'segui vos' ||
    norm === 'seguí vos' ||
    norm === 'segui' ||
    norm === 'asistente' ||
    /\bsegui\s+vos\b/.test(norm)
  );
}

export function esQuejaOEnfado(texto: string): boolean {
  const norm = normalizarTexto(texto);
  return /\b(quej|mal\s+serv|pesim|horrible|desastre|estaf|reclam|decepcion|enojad|bronca|harto|harta|verguenza|indignad|incompetente|porqueria|basura)\b/.test(
    norm,
  );
}

export function pideAccionDePersona(texto: string): boolean {
  const norm = normalizarTexto(texto);
  return /\b(reserv(?:ar|ame|o|a|en)|apartar|bloquear\s+(?:la\s+)?fecha|senar|pagar\s+(?:la\s+)?sena|hacer\s+(?:la\s+)?sena|dar\s+(?:la\s+)?sena|transferir|transferencia|abonar|cobrar|link\s+de\s+pago|mercadopago|acept(?:o|ar)\s+(?:el\s+)?presupuesto|cerrar\s+(?:el\s+)?presupuesto|aprobar\s+(?:el\s+)?presupuesto|descuento|rebaja|bajar\s+(?:el\s+)?precio|cambiar\s+(?:el\s+)?precio|precio\s+especial|haceme\s+precio)\b/.test(
    norm,
  );
}

const MESES_MAP: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', setiembre: '09', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

export function extraerDatosDeTextoProspecto(texto: string, ahora: Date = new Date()): DatosPresupuestoProspecto {
  const base = extraerDatosPresupuestoProspecto(texto);
  if (!base.fecha) {
    const mSinAnio = String(texto || '').match(
      /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\b/i,
    );
    if (mSinAnio) {
      const d = mSinAnio[1].padStart(2, '0');
      const m = MESES_MAP[mSinAnio[2].toLowerCase()] || '01';
      const currentYear = ahora.getUTCFullYear();
      let candidate = `${currentYear}-${m}-${d}`;
      if (candidate < ahora.toISOString().slice(0, 10)) {
        candidate = `${currentYear + 1}-${m}-${d}`;
      }
      base.fecha = candidate;
    }
  }
  return base;
}

function esPreguntaPresupuesto(texto: string): boolean {
  const norm = normalizarTexto(texto);
  return /\b(presupuesto|cotiz|cuanto\s+(?:sale|cuesta|vale|es)|precio|precios|costo|costos|simulador|armar\s+(?:un\s+)?presupuesto)\b/.test(
    norm,
  );
}

function esPreguntaFecha(texto: string): boolean {
  const norm = normalizarTexto(texto);
  return /\b(fecha|disponib|libre|ocupad|agenda|tienen\s+lugar|esta\s+libre)\b/.test(norm);
}

export function sanitizarRespuestaProspecto(texto: string): string {
  return String(texto || '')
    .replace(/\bgarant[ií]a(s)?\b/gi, 'compromiso')
    .replace(/\bgarantiz\w*\b/gi, 'asegurar')
    .replace(/\b24\/7\b/gi, 'todos los días')
    .replace(/\bcongel(ar|amos|ado|ada|ás)?\b/gi, 'mantener')
    // Eliminar rangos de precios inventados
    .replace(
      /(?:entre|desde|de|aprox(?:imadamente)?|alrededor\s+de)?\s*(?:\$|uyu|usd)?\s*\d[\d.,]{2,}\s*(?:y|a|hasta|-|–)\s*(?:\$|uyu|usd)?\s*\d[\d.,]{2,}\s*(?:pesos|uyu|usd|dólares|dolares)?/gi,
      'un presupuesto armado en el simulador',
    )
    .trim();
}

function formatearFechaCorta(fechaISO: string): string {
  const m = fechaISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return fechaISO;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function getHoraUy(fecha: Date = new Date()): number {
  const uruguayDateStr = fecha.toLocaleString('en-US', { timeZone: 'America/Montevideo' });
  return new Date(uruguayDateStr).getHours();
}

function esDeNocheEnUruguay(ahora: Date, inicio = 22, fin = 8): boolean {
  const hora = getHoraUy(ahora);
  if (inicio > fin) return hora >= inicio || hora < fin;
  return hora >= inicio && hora < fin;
}

async function notificarEquipoHandoff(params: {
  clave: string;
  titulo: string;
  quePasa: string;
  porQueImporta: string;
  ahora: Date;
}): Promise<void> {
  try {
    const { avisarAlDuenio } = await import('@/lib/asistente/avisar-al-duenio');
    await avisarAlDuenio(
      [
        {
          clave: params.clave,
          area: 'ventas',
          titulo: params.titulo,
          quePasa: params.quePasa,
          porQueImporta: params.porQueImporta,
          esImportante: true,
        },
      ],
      params.ahora,
    ).catch((e) => console.warn('[asistente-de-prospectos] Paso secundario sin completar:', e));
  } catch {
    // no bloquea la atención al prospecto
  }

  try {
    const { createNotification } = await import('@/lib/notifications/create-notification');
    const notifRes = await createNotification({
      titulo: params.titulo,
      mensaje: params.quePasa,
      tipo: 'alerta',
      href: '/contabilidad/crm',
      icono: 'MessageCircle',
      rolDestino: 'admin',
    }).catch(() => ({ success: false, error: 'Error creando notificación' }));
    if (!notifRes.success) {
      console.warn('[AsistenteProspectos] No se pudo crear notificación:', notifRes.error);
    }
  } catch {
    // no bloquea la atención al prospecto
  }
}

function mismosTelefonos(a?: string | null, b?: string | null): boolean {
  const normA = normalizeUruguayPhone(a);
  const normB = normalizeUruguayPhone(b);
  if (normA && normB && normA === normB) return true;
  const digitsA = String(a || '').replace(/\D/g, '');
  const digitsB = String(b || '').replace(/\D/g, '');
  return digitsA.length >= 7 && digitsB.length >= 7 && digitsA === digitsB;
}

function coincideLeadConCanal(l: CrmLead, canal: CanalProspecto, remitenteId: string): boolean {
  if (canal === 'whatsapp') {
    return Boolean(l.phone && mismosTelefonos(l.phone, remitenteId));
  }
  const clave = `${canal}:${remitenteId}`;
  const expectedKey = createHash('sha256')
    .update(`sin-telefono|${clave}|${clave}`)
    .digest('hex');
  if (l.publicIdentityKey === expectedKey || l.id === `lead_public_${expectedKey.slice(0, 24)}`) {
    return true;
  }
  if (Array.isArray(l.conversacion)) {
    return l.conversacion.some(
      (m) => m.canal === canal && String(m.meta?.senderId || '') === remitenteId,
    );
  }
  return false;
}

async function sincronizarEstadoEnCrmLead(
  canal: CanalProspecto,
  remitenteId: string,
  patch: Partial<Pick<CrmLead, 'atiende' | 'referenciaCodigo'>>,
): Promise<string | undefined> {
  try {
    const leadsIniciales = await readData<CrmLead[]>('crm-leads.json', []);
    if (!Array.isArray(leadsIniciales) || leadsIniciales.length === 0) return undefined;

    const matchLead = (l: CrmLead) => {
      if (coincideLeadConCanal(l, canal, remitenteId)) return true;
      if (l.referenciaCodigo && patch.referenciaCodigo && l.referenciaCodigo === patch.referenciaCodigo) return true;
      return false;
    };

    const objetivo = leadsIniciales.find(matchLead);
    if (!objetivo?.id) return undefined;

    if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true' && typeof mutateDataItem === 'function') {
      const actualizado = await mutateDataItem<CrmLead>('crm-leads.json', 'crm_leads', objetivo.id, (actual) => ({
        ...actual,
        ...patch,
        updatedAt: new Date().toISOString(),
      }));
      return actualizado?.id || objetivo.id;
    }

    return await crmSyncMutex.runExclusive(async () => {
      const leads = await readData<CrmLead[]>('crm-leads.json', []);
      if (!Array.isArray(leads) || leads.length === 0) return undefined;
      const idx = leads.findIndex((l) => l.id === objetivo.id || matchLead(l));
      if (idx === -1) return undefined;
      leads[idx] = {
        ...leads[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await writeData('crm-leads.json', leads).catch((e) => console.warn('[asistente-de-prospectos] Paso secundario sin completar:', e));
      return leads[idx].id;
    });
  } catch {
    return undefined;
  }
}

export async function verificarLeadPidePersona(canal: CanalProspecto, remitenteId: string): Promise<boolean> {
  try {
    const leads = await readData<CrmLead[]>('crm-leads.json', []);
    if (!Array.isArray(leads)) return false;
    const lead = leads.find((l) => coincideLeadConCanal(l, canal, remitenteId));
    return lead?.atiende === 'persona';
  } catch {
    return false;
  }
}

async function armarContextoRealParaPregunta(): Promise<{ texto: string; fallback: string }> {
  try {
    const [config, servicios, salones] = await Promise.all([
      getArmadoRapidoConfig().catch(() => ({ paquetes: [], menus: [], clubUruguayConfig: null as any })),
      getServiciosEmpresaPublicos().catch(() => []),
      getSalonesPublicos().catch(() => []),
    ]);

    const paquetes = (config.paquetes || []).map((p) => `- Paquete ${p.nombre}${p.descripcion ? `: ${p.descripcion}` : ''}`).join('\n');
    const menus = (config.menus || []).map((m) => `- Menú ${m.nombre}${m.descripcion ? `: ${m.descripcion}` : ''}`).join('\n');
    const clubInfo = config.clubUruguayConfig?.activo
      ? `- Club Uruguay: ${config.clubUruguayConfig.prestaciones?.join(', ') || 'Salón céntrico en Salto'}${config.clubUruguayConfig.precio ? ` (precio de lista salón: $${Number(config.clubUruguayConfig.precio).toLocaleString('es-UY')} UYU)` : ''}`
      : '';
    const salonesTxt = (Array.isArray(salones) ? salones : [])
      .slice(0, 10)
      .map((s) => `- Salón ${s.nombre}${s.capacidad ? ` (capacidad ${s.capacidad} personas)` : ''}${s.direccion ? ` — ${s.direccion}` : ''}`)
      .join('\n');
    const serviciosTxt = (Array.isArray(servicios) ? servicios : [])
      .filter((s) => s.tipoItem === 'Servicio')
      .slice(0, 20)
      .map((s) => {
        const precio = Number(s.precioVenta || s.precioBase || s.precioPorPersona || 0);
        const precioInfo = precio > 0 ? ` — Precio de lista: $${precio.toLocaleString('es-UY')} UYU${s.calculationMethod === 'porPersona' ? ' por persona' : ''}` : '';
        return `- ${s.nombre} (${s.categoria})${precioInfo}`;
      })
      .join('\n');
    const faqTxt = PREGUNTAS_FRECUENTES_DEL_CONTRATO.map((f) => `P: ${f.pregunta}\nR: ${f.respuesta}`).join('\n\n');

    const contexto = [
      paquetes ? `PAQUETES:\n${paquetes}` : '',
      menus ? `MENÚS:\n${menus}` : '',
      clubInfo ? `SALÓN PROPIO / CONVENIO:\n${clubInfo}` : '',
      salonesTxt ? `SALONES DISPONIBLES:\n${salonesTxt}` : '',
      serviciosTxt ? `SERVICIOS DEL CATÁLOGO:\n${serviciosTxt}` : '',
      faqTxt ? `PREGUNTAS FRECUENTES DEL CONTRATO:\n${faqTxt}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const nombresServicios = (Array.isArray(servicios) ? servicios : []).slice(0, 6).map((s) => s.nombre).join(', ');
    const nombresSalones = (Array.isArray(salones) ? salones : []).slice(0, 4).map((s) => s.nombre).join(', ');
    const fallback = `En AK Producciones organizamos fiestas integrales en Salto${nombresServicios ? ` (incluyendo ${nombresServicios})` : ''}${nombresSalones ? ` y trabajamos con salones como ${nombresSalones}` : ''}. Contame fecha, tipo de fiesta e invitados para pasarte el simulador con el presupuesto al instante.`;

    return { texto: contexto, fallback };
  } catch {
    return {
      texto: PREGUNTAS_FRECUENTES_DEL_CONTRATO.map((f) => `P: ${f.pregunta}\nR: ${f.respuesta}`).join('\n\n'),
      fallback: 'En AK Producciones organizamos bodas, 15 años, cumpleaños y eventos en Salto con servicios integrales. Contame qué fecha y cuántos invitados pensás para armarte el presupuesto en el simulador.',
    };
  }
}

async function responderPreguntaConCatalogo(params: {
  texto: string;
  historial: Array<{ role: 'user' | 'assistant'; text: string }>;
  datos: DatosPresupuestoProspecto;
}): Promise<{ respuesta: string; noSabe?: boolean }> {
  const { texto: contexto, fallback } = await armarContextoRealParaPregunta();
  const enlaceSimulador = enlaceAlSimuladorDelProspecto(params.datos);

  let reserva: { liberar(): Promise<void> } | null = null;
  try {
    const consumo = await import('@/lib/ai/consumo-servidor');
    reserva = await consumo.reservarConsumoIA('vendedor-virtual');
  } catch {
    reserva = null;
  }

  if (!reserva) {
    return { respuesta: fallback };
  }

  const systemPrompt = `Sos el asistente virtual de AK Producciones (Salto, Uruguay). Hablás en español rioplatense ("vos", amable, directo y corto).

CATÁLOGO Y PREGUNTAS REALES DEL NEGOCIO (ÚNICA FUENTE DE VERDAD):
${contexto}

DATOS QUE YA CONTÓ EL PROSPECTO:
- Fecha: ${params.datos.fecha || 'sin definir'}
- Invitados: ${params.datos.invitados ?? 'sin definir'}
- Tipo de fiesta: ${params.datos.tipoEvento || 'sin definir'}
- Salón: ${params.datos.salon || 'sin definir'}
- Enlace al simulador: ${enlaceSimulador}

REGLAS INQUEBRANTABLES:
1. Respondé SOLO usando los datos reales de arriba. Si no está en el catálogo o requiere evaluación humana, respondé exactamente "[PASAR_A_PERSONA]".
2. NUNCA inventes rangos de precios (como "entre $X y $Y"), NUNCA hagas descuentos ni prometas precios especiales. Si preguntan por presupuesto total, dales el enlace al simulador (${enlaceSimulador}) o citá únicamente un precio de lista exacto del catálogo si preguntaron por ese ítem puntual.
3. NUNCA reserves fechas, tomes señas, aceptes presupuestos, cobres ni cambies precios.
4. NUNCA prometas plazos ni uses la palabra "garantía", "garantizar", "24/7" ni "congelar".
5. No inventes fechas libres (la disponibilidad la verifica el sistema por separado).`;

  const messages = [
    ...params.historial.slice(-8).map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      content: [{ text: m.text }],
    })),
    { role: 'user' as const, content: [{ text: params.texto }] },
  ];

  try {
    const res = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      system: systemPrompt,
      messages,
    });
    const raw = (res?.text || '').trim();
    if (!raw) return { respuesta: fallback };
    if (raw.includes('[PASAR_A_PERSONA]')) {
      return { respuesta: '', noSabe: true };
    }
    return { respuesta: sanitizarRespuestaProspecto(raw) };
  } catch (err) {
    if (isRecoverableGeminiModelError(err)) {
      await reserva.liberar().catch((e) => console.warn('[asistente-de-prospectos] Paso secundario sin completar:', e));
    }
    return { respuesta: fallback };
  }
}

export async function devolverCharlaAlAsistentePorClave(
  canal: CanalProspecto,
  remitenteId: string,
): Promise<void> {
  const idLimpio = normalizarIdRemitente(canal, remitenteId);
  const key = `${canal}:${idLimpio}`;
  await estadoMutex.runExclusive(async () => {
    const estados = await readData<Record<string, EstadoConversacionProspecto>>(ESTADO_FILE, {});
    if (estados && estados[key]) {
      estados[key] = {
        ...estados[key],
        atiende: 'asistente',
        updatedAt: new Date().toISOString(),
      };
      await writeData(ESTADO_FILE, estados);
    }
  });
}

/**
 * Verifica si un número de WhatsApp pertenece a personal, números personales configurados
 * o tiene clasificación con nota <= 2 (no es prospecto de evento).
 * En cualquiera de esos casos, el asistente NUNCA responde.
 */
export async function verificarEsContactoPersonalONotaBaja(
  phone: string,
  clasificacion?: { tipo?: string; nota?: number; esPersonal?: boolean } | null,
  settingsPrevia?: AsistenteSettings | null,
): Promise<{ bloquear: boolean; motivo?: string; nota?: number; esPersonal?: boolean }> {
  if (clasificacion?.esPersonal || clasificacion?.tipo === 'personal') {
    return { bloquear: true, motivo: 'Contacto marcado como personal: nunca recibe respuesta automática.', esPersonal: true, nota: clasificacion.nota };
  }
  if (clasificacion?.nota !== undefined && clasificacion.nota <= 2) {
    return { bloquear: true, motivo: 'Nota <= 2: no se contesta automáticamente.', nota: clasificacion.nota };
  }

  try {
    const [settings, waConfig, leads, empleados, numerosPersonales] = await Promise.all([
      settingsPrevia !== undefined
        ? Promise.resolve(settingsPrevia)
        : import('@/lib/asistente/avisar-al-duenio').then((m) => m.getAsistenteSettings()).catch(() => null),
      readData<{ numerosPersonales?: string[] }>('whatsapp-config.json', {}).catch(() => null),
      readData<CrmLead[]>('crm-leads.json', []).catch(() => []),
      readData<Array<{ phone?: string; telefono?: string }>>('empleados.json', []).catch(() => []),
      readData<Array<string | { telefono?: string; phone?: string }>>('whatsapp-numeros-personales.json', []).catch(() => []),
    ]);

    const matchPhone = (val?: string | null) => Boolean(val) && mismosTelefonos(val, phone);

    const listaPersonalSettings = ((settings as any)?.numerosPersonales || []) as Array<string | { telefono?: string; phone?: string }>;
    const listaPersonalWaConfig = Array.isArray(waConfig?.numerosPersonales) ? waConfig.numerosPersonales : [];
    const todosPersonales = [
      ...(Array.isArray(numerosPersonales) ? numerosPersonales : []),
      ...listaPersonalSettings,
      ...listaPersonalWaConfig,
    ];
    if (todosPersonales.some((item) => matchPhone(typeof item === 'string' ? item : (item?.telefono || item?.phone)))) {
      return { bloquear: true, motivo: 'Número personal: nunca recibe respuesta automática.', esPersonal: true };
    }

    if (Array.isArray(empleados) && empleados.some((e) => matchPhone(e?.telefono || e?.phone))) {
      return { bloquear: true, motivo: 'Personal de la empresa: nunca recibe respuesta automática.', esPersonal: true };
    }

    if (Array.isArray(leads)) {
      const lead = leads.find((l) => matchPhone(l.phone));
      if (lead?.clasificacionProspecto?.esPersonal || lead?.clasificacionProspecto?.tipo === 'personal') {
        return { bloquear: true, motivo: 'Contacto clasificado como personal.', esPersonal: true, nota: lead.clasificacionProspecto.nota };
      }
      if (lead?.clasificacionProspecto?.nota !== undefined && lead.clasificacionProspecto.nota <= 2) {
        return { bloquear: true, motivo: 'Clasificación con nota <= 2: no se contesta solo.', nota: lead.clasificacionProspecto.nota };
      }
    }
  } catch {
    // Ante fallo leyendo listas auxiliares, no rompe el flujo principal
  }

  return { bloquear: false, nota: clasificacion?.nota, esPersonal: false };
}

/**
 * Cerebro único del asistente de prospectos para WhatsApp, Web, Instagram DM y Messenger.
 */
export async function atenderProspectoUnificado(params: {
  canal: CanalProspecto;
  remitenteId: string;
  texto: string;
  nombre?: string;
  messageId?: string;
  historialPrevio?: Array<{ role: 'user' | 'assistant'; text: string }>;
  bienvenidaYaMostrada?: boolean;
  esPersonal?: boolean;
  esNumeroPersonal?: boolean;
  nota?: number;
  esCliente?: boolean;
  ahora?: Date;
}): Promise<ResultadoAtencionProspecto> {
  const ahora = params.ahora ?? new Date();
  const canal = params.canal;
  const idLimpio = normalizarIdRemitente(canal, params.remitenteId || 'anon');
  const key = `${canal}:${idLimpio}`;
  const texto = String(params.texto || '').trim();
  const refCode = generarCodigoReferencia(key);

  // Regla de seguridad WhatsApp: personal / Números personales / nota <= 2 nunca reciben respuesta.
  if (
    params.esPersonal ||
    params.esNumeroPersonal ||
    (params.nota !== undefined && params.nota <= 2)
  ) {
    return {
      silenciado: true,
      motivo: 'contacto_personal_o_nota_baja',
      atiende: 'persona',
      datos: {},
      refCode,
    };
  }

  // En IG DM / Messenger a clientes contratados tampoco les contesta el bot solo.
  if (params.esCliente && (canal === 'instagram_dm' || canal === 'messenger')) {
    return {
      silenciado: true,
      motivo: 'cliente_contratado_atencion_personalizada',
      atiende: 'persona',
      datos: {},
      refCode,
    };
  }

  return estadoMutex.runExclusive(async () => {
    const estados = await readData<Record<string, EstadoConversacionProspecto>>(ESTADO_FILE, {});
    const estadoPrevio: EstadoConversacionProspecto = estados[key] || {
      key,
      canal,
      remitenteId: idLimpio,
      yaSaludo: Boolean(params.bienvenidaYaMostrada),
      atiende: 'asistente',
      refCode,
      datos: {},
      historial: [],
      updatedAt: ahora.toISOString(),
    };

    if (params.bienvenidaYaMostrada) {
      estadoPrevio.yaSaludo = true;
    }

    // Verificar también si en el CRM fue marcado como atiende: 'persona'
    const crmPidePersona = await verificarLeadPidePersona(canal, idLimpio);
    if (estadoPrevio.atiende === 'persona' || crmPidePersona) {
      estadoPrevio.atiende = 'persona';
      estados[key] = { ...estadoPrevio, updatedAt: ahora.toISOString() };
      await writeData(ESTADO_FILE, estados).catch((e) => console.warn('[asistente-de-prospectos] Paso secundario sin completar:', e));
      return {
        silenciado: true,
        motivo: 'atiende_persona',
        atiende: 'persona',
        datos: estadoPrevio.datos,
        refCode: estadoPrevio.refCode,
      };
    }

    // Extraer datos que el prospecto vaya contando en el chat
    const nuevosDatos = extraerDatosDeTextoProspecto(texto, ahora);
    const datos: DatosPresupuestoProspecto = {
      ...estadoPrevio.datos,
      ...Object.fromEntries(Object.entries(nuevosDatos).filter(([, v]) => v !== undefined)),
    };

    const historialBase: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }> =
      params.historialPrevio?.length
        ? params.historialPrevio.map((m) => ({
            role: m.role,
            text: m.text,
            timestamp: ahora.toISOString(),
          }))
        : estadoPrevio.historial;

    const historial: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }> = [
      ...historialBase,
      ...(texto ? [{ role: 'user' as const, text: texto, timestamp: ahora.toISOString() }] : []),
    ].slice(-20);

    const guardarEstado = async (parche: Partial<EstadoConversacionProspecto>) => {
      const siguiente: EstadoConversacionProspecto = {
        ...estadoPrevio,
        ...parche,
        datos,
        historial: parche.historial ?? historial,
        updatedAt: ahora.toISOString(),
      };
      estados[key] = siguiente;
      await writeData(ESTADO_FILE, estados).catch((e) => console.warn('[asistente-de-prospectos] Paso secundario sin completar:', e));
    };

    const pasarAPersona = async (motivoAviso: string): Promise<ResultadoAtencionProspecto> => {
      await guardarEstado({ yaSaludo: true, atiende: 'persona' });
      const leadId = await sincronizarEstadoEnCrmLead(canal, idLimpio, {
        atiende: 'persona',
        referenciaCodigo: estadoPrevio.refCode,
      });

      await notificarEquipoHandoff({
        clave: `prospecto-persona:${key}:${Math.floor(ahora.getTime() / 600_000)}`,
        titulo: `Prospecto pide atención humana (${canal})`,
        quePasa: `${params.nombre || idLimpio} (${canal}): "${texto.slice(0, 120)}" — Motivo: ${motivoAviso}`,
        porQueImporta: 'El asistente se calló en esta charla para que conteste una persona del equipo.',
        ahora,
      });

      if (canal === 'whatsapp') {
        const settings = await import('@/lib/asistente/avisar-al-duenio')
          .then((m) => m.getAsistenteSettings())
          .catch(() => null);
        const deNoche = esDeNocheEnUruguay(
          ahora,
          settings?.horarioNoMolestarInicio ?? 22,
          settings?.horarioNoMolestarFin ?? 8,
        );
        const respuesta = deNoche
          ? '¡Listo! Le aviso al equipo y te escriben por acá. Como es de noche, te escriben mañana por la mañana.'
          : '¡Listo! Le aviso al equipo y te escriben por acá.';

        await guardarEstado({
          yaSaludo: true,
          atiende: 'persona',
          historial: [...historial, { role: 'assistant' as const, text: respuesta, timestamp: ahora.toISOString() }].slice(-20),
        });

        return {
          silenciado: false,
          respuesta,
          atiende: 'persona',
          pasoAPersona: true,
          datos,
          refCode: estadoPrevio.refCode,
          leadId,
        };
      }

      const whatsappUrl = armarEnlaceWhatsAppProspecto(datos, estadoPrevio.refCode);
      const respuesta = `¡Dale! Te escribe una persona del equipo por WhatsApp: tocá acá ${whatsappUrl}`;

      await guardarEstado({
        yaSaludo: true,
        atiende: 'persona',
        historial: [...historial, { role: 'assistant' as const, text: respuesta, timestamp: ahora.toISOString() }].slice(-20),
      });

      return {
        silenciado: false,
        respuesta,
        whatsappUrl,
        atiende: 'persona',
        pasoAPersona: true,
        datos,
        refCode: estadoPrevio.refCode,
        leadId,
      };
    };

    // 1. Si pide hablar con una persona, es queja/enojo, o pide acciones prohibidas -> pasa a persona.
    if (pidePersona(texto)) {
      return pasarAPersona('Pidió hablar con una persona');
    }
    if (esQuejaOEnfado(texto)) {
      return pasarAPersona('Queja o disconformidad');
    }
    if (pideAccionDePersona(texto)) {
      return pasarAPersona('Pidió reservar, señar, cobrar o cambiar precios');
    }

    // 2. Primer mensaje exacto si todavía no saludó
    if (!estadoPrevio.yaSaludo) {
      await guardarEstado({
        yaSaludo: true,
        atiende: 'asistente',
        historial: [
          ...historial,
          { role: 'assistant' as const, text: MENSAJE_BIENVENIDA_PROSPECTO, timestamp: ahora.toISOString() },
        ].slice(-20),
      });
      return {
        silenciado: false,
        respuesta: MENSAJE_BIENVENIDA_PROSPECTO,
        opciones: [...OPCIONES_BIENVENIDA_PROSPECTO],
        atiende: 'asistente',
        datos,
        refCode: estadoPrevio.refCode,
      };
    }

    // 3. Modo "Seguí vos" / conversación activa
    const soloEligioSeguir = quiereSeguirConAsistente(texto);
    const fechaAConsultar =
      nuevosDatos.fecha ||
      (soloEligioSeguir && datos.fecha && estadoPrevio.fechaYaConsultada !== datos.fecha ? datos.fecha : undefined) ||
      (esPreguntaFecha(texto) && datos.fecha ? datos.fecha : undefined);

    let budgetUrl: string | undefined;
    let whatsappUrl: string | undefined;
    const bloquesRespuesta: string[] = [];
    let yaConsultoFecha = Boolean(estadoPrevio.fechaYaConsultada);
    let yaEnvioPresupuesto = Boolean(estadoPrevio.presupuestoEnviado);

    // 3a. Consulta real de disponibilidad de fecha
    if (fechaAConsultar) {
      try {
        const disponibilidad = await checkDateAvailability(fechaAConsultar);
        const fechaLindo = formatearFechaCorta(fechaAConsultar);
        yaConsultoFecha = true;
        if (disponibilidad.isOccupied) {
          const sugerenciasTxt = (disponibilidad.suggestions || [])
            .map((f) => formatearFechaCorta(f))
            .join(', ');
          bloquesRespuesta.push(
            sugerenciasTxt
              ? `El ${fechaLindo} ya está ocupado en nuestro calendario. Las próximas fechas libres cercanas son: ${sugerenciasTxt}.`
              : `El ${fechaLindo} ya está ocupado en nuestro calendario. ¿Querés que revisemos otra fecha cercana?`,
          );
        } else {
          bloquesRespuesta.push(
            `¡Buenas noticias! El ${fechaLindo} está libre en nuestro calendario (la reserva formal se coordina luego con el equipo).`,
          );
        }
      } catch {
        // Si no se puede leer el calendario, NUNCA dice "libre": confirma una persona y avisa al equipo.
        await notificarEquipoHandoff({
          clave: `calendario-caido:${key}:${fechaAConsultar}`,
          titulo: `Confirmar disponibilidad manual (${formatearFechaCorta(fechaAConsultar)})`,
          quePasa: `${params.nombre || idLimpio} preguntó por el ${formatearFechaCorta(fechaAConsultar)} y no se pudo leer el calendario.`,
          porQueImporta: 'El asistente no dijo "libre" por seguridad; una persona debe confirmarle la fecha.',
          ahora,
        });

        const msgNoPudo =
          'No pude leer el calendario en este momento, así que no te la puedo confirmar como libre por acá. Le aviso a una persona del equipo para que la confirme enseguida.';
        if (canal !== 'whatsapp') {
          whatsappUrl = armarEnlaceWhatsAppProspecto(datos, estadoPrevio.refCode);
        }
        const textoFinal = whatsappUrl
          ? `${msgNoPudo} Si querés, seguí por WhatsApp acá: ${whatsappUrl}`
          : msgNoPudo;

        await guardarEstado({
          atiende: 'asistente',
          historial: [...historial, { role: 'assistant' as const, text: textoFinal, timestamp: ahora.toISOString() }].slice(-20),
        });
        return {
          silenciado: false,
          respuesta: textoFinal,
          whatsappUrl,
          atiende: 'asistente',
          datos,
          refCode: estadoPrevio.refCode,
        };
      }
    }

    // 3b. Presupuesto con el simulador precargado
    const pidioPresupuesto = esPreguntaPresupuesto(texto);
    const tieneDatosParaSimulador = Boolean(datos.invitados || datos.tipoEvento || datos.fecha || datos.salon);
    if (pidioPresupuesto || (soloEligioSeguir && tieneDatosParaSimulador) || (fechaAConsultar && tieneDatosParaSimulador)) {
      budgetUrl = enlaceAlSimuladorDelProspecto({
        fecha: datos.fecha,
        invitados: datos.invitados,
        salon: datos.salon,
        tipoEvento: datos.tipoEvento,
        entry: canal === 'whatsapp' ? 'whatsapp_anuncio' : canal,
      });
      yaEnvioPresupuesto = true;
      bloquesRespuesta.push(
        `Acá podés armar y ver tu presupuesto en el momento con lo que me contaste: ${budgetUrl}`,
      );
    }

    // 3c. Si eligió "Seguí vos" sin haber pasado datos ni fecha aún
    if (soloEligioSeguir && bloquesRespuesta.length === 0) {
      bloquesRespuesta.push(
        '¡Genial, seguimos! Decime qué fecha tenés pensada, qué tipo de fiesta es (15 años, boda, cumple) y cuántos invitados calculás así te confirmo disponibilidad y te armo el enlace del presupuesto.',
      );
    }

    // 3d. Pregunta sobre catálogo, servicios, salones o contrato
    if (bloquesRespuesta.length === 0) {
      const ia = await responderPreguntaConCatalogo({ texto, historial, datos });
      if (ia.noSabe) {
        return pasarAPersona('El asistente no tiene certeza para responder esa consulta');
      }
      bloquesRespuesta.push(ia.respuesta);
    }

    // 4. Si ya tiene presupuesto o fecha en Web / IG / Messenger, invita a seguir por WhatsApp
    if (canal !== 'whatsapp' && (yaConsultoFecha || yaEnvioPresupuesto || datos.fecha)) {
      whatsappUrl = armarEnlaceWhatsAppProspecto(datos, estadoPrevio.refCode);
      bloquesRespuesta.push(
        `Cuando quieras coordinar una entrevista o seguir con el equipo por WhatsApp, tocá acá: ${whatsappUrl}`,
      );
    }

    const respuestaFinal = sanitizarRespuestaProspecto(bloquesRespuesta.join('\n\n'));

    await guardarEstado({
      yaSaludo: true,
      atiende: 'asistente',
      fechaYaConsultada: fechaAConsultar || estadoPrevio.fechaYaConsultada,
      presupuestoEnviado: yaEnvioPresupuesto,
      historial: [...historial, { role: 'assistant' as const, text: respuestaFinal, timestamp: ahora.toISOString() }].slice(-20),
    });

    return {
      silenciado: false,
      respuesta: respuestaFinal,
      ...(budgetUrl ? { budgetUrl } : {}),
      ...(whatsappUrl ? { whatsappUrl } : {}),
      atiende: 'asistente',
      datos,
      refCode: estadoPrevio.refCode,
    };
  });
}
