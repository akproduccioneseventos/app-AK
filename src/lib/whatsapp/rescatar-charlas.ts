import 'server-only';

import { createHash } from 'crypto';
import JSZip from 'jszip';
import { decidir } from '@/lib/ai/decisiones';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { extraerDatosPresupuestoProspecto } from '@/lib/asistente/por-whatsapp';
import { buildWhatsAppLink, normalizeUruguayPhone } from '@/lib/commercial/contact';
import { buildCrmMensaje } from '@/lib/crm/conversacion';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { createNotification } from '@/lib/notifications/create-notification';
import type { CrmMensaje } from '@/types/crm';

export interface MensajeCharlaExportada {
  fecha: string;
  autor: string;
  texto: string;
  esPropio: boolean;
}

export interface CharlaWhatsAppParseada {
  id: string;
  archivo: string;
  contactoNombre: string;
  contactoTelefono?: string;
  mensajes: MensajeCharlaExportada[];
}

export interface ProspectoRescatadoItem {
  leadId: string;
  nombre: string;
  telefono?: string;
  quedoSinRespuesta: boolean;
  quePedia: string;
  fechaEvento?: string;
  fechaDisponible?: boolean;
  fechasAlternativas?: string[];
  fechaEstado: 'libre' | 'ocupada' | 'sin_fecha' | 'por_confirmar';
  prioridad: number;
  mensajePreparado: string;
  waUrl: string;
  mensajesGuardados: number;
}

export interface ClienteConFiestaSinRespuestaItem {
  nombre: string;
  telefono?: string;
  quePedia: string;
  ultimoMensaje: string;
  notificado: boolean;
}

export interface ResultadoRescateCharlas {
  totalCharlasAnalizadas: number;
  prospectosRescatados: ProspectoRescatadoItem[];
  clientesSinRespuesta: ClienteConFiestaSinRespuestaItem[];
  descartadosPersonal: number;
  descartadosProveedor: number;
  descartadosSinClasificar: number;
  errores: string[];
}

const LINEA_ANDROID_RE = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)\s+-\s+([^:]+?):\s([\s\S]*)$/i;
const LINEA_IOS_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\]\s+([^:]+?):\s([\s\S]*)$/i;

const ETIQUETAS_QUE_PEDIA: Record<string, string> = {
  presupuesto: 'Presupuesto o precios',
  fecha_disponibilidad: 'Disponibilidad de fecha o salón',
  reunion_info: 'Información o reunión',
  seguimiento_fiesta: 'Seguimiento de fiesta',
  otro: 'Consulta general',
};

function parseFechaExportada(fechaStr: string, horaStr: string): string {
  const [dRaw, mRaw, yRaw] = fechaStr.split('/').map((n) => parseInt(n, 10));
  const year = yRaw < 100 ? 2000 + yRaw : yRaw;
  const month = Math.max(1, Math.min(12, mRaw || 1));
  const day = Math.max(1, Math.min(31, dRaw || 1));

  const horaLimpia = horaStr.toLowerCase().replace(/\./g, '').trim();
  const esPm = horaLimpia.includes('p m') || horaLimpia.includes('pm');
  const esAm = horaLimpia.includes('a m') || horaLimpia.includes('am');
  const [hRaw, minRaw] = horaLimpia.replace(/[^\d:]/g, '').split(':').map((n) => parseInt(n, 10));
  let hour = Number.isFinite(hRaw) ? hRaw : 12;
  const minute = Number.isFinite(minRaw) ? minRaw : 0;

  if (esPm && hour < 12) hour += 12;
  if (esAm && hour === 12) hour = 0;

  const iso = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return Number.isNaN(iso.getTime()) ? new Date().toISOString() : iso.toISOString();
}

function esAutorPropio(autor: string, nombreEmpresa = 'ak producciones'): boolean {
  const norm = autor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (!norm) return false;
  return (
    norm === 'yo' ||
    norm === 'me' ||
    norm.includes('ak producciones') ||
    norm.includes(nombreEmpresa) ||
    norm.includes('alexander knuth')
  );
}

function extraerTelefonoDeTexto(texto?: string): string | undefined {
  if (!texto) return undefined;
  const match = texto.match(/(?:\+?598\s*|0)?9\d[\s\-]?\d{3}[\s\-]?\d{3}|\+\d{8,15}/);
  if (!match) return undefined;
  const norm = normalizeUruguayPhone(match[0]);
  return norm || match[0].replace(/\D/g, '') || undefined;
}

function nombreDesdeArchivo(fileName: string): string | undefined {
  const base = fileName.replace(/^.*\//, '').replace(/\.txt$/i, '');
  const matchEs = base.match(/^Chat de WhatsApp con\s+(.+)$/i);
  if (matchEs) return matchEs[1].trim();
  const matchEn = base.match(/^WhatsApp Chat with\s+(.+)$/i);
  if (matchEn) return matchEn[1].trim();
  if (base && base !== '_chat') return base.trim();
  return undefined;
}

/**
 * Parsea el texto de un archivo `.txt` exportado desde WhatsApp.
 */
export function parsearTxtWhatsAppExportado(
  contenido: string,
  archivo = 'chat.txt',
): CharlaWhatsAppParseada | null {
  const texto = String(contenido || '').replace(/^\uFEFF/, '');
  const lineas = texto.split(/\r?\n/);
  const mensajes: MensajeCharlaExportada[] = [];

  for (const linea of lineas) {
    const trimmed = linea.trim();
    if (!trimmed) continue;

    const match = trimmed.match(LINEA_ANDROID_RE) || trimmed.match(LINEA_IOS_RE);
    if (match) {
      const [, fechaStr, horaStr, autorRaw, cuerpo] = match;
      const autor = autorRaw.trim();
      const cuerpoLimpio = cuerpo.trim();
      if (!cuerpoLimpio || /mensajes y las llamadas est[aá]n cifrados/i.test(cuerpoLimpio)) {
        continue;
      }
      mensajes.push({
        fecha: parseFechaExportada(fechaStr, horaStr),
        autor,
        texto: cuerpoLimpio,
        esPropio: esAutorPropio(autor),
      });
    } else if (mensajes.length > 0 && !/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed) && !/^\[/.test(trimmed)) {
      mensajes[mensajes.length - 1].texto += `\n${trimmed}`;
    }
  }

  if (mensajes.length === 0) return null;

  const primerAjeno = mensajes.find((m) => !m.esPropio);
  const nombreArchivo = nombreDesdeArchivo(archivo);
  const contactoNombre =
    primerAjeno?.autor ||
    nombreArchivo ||
    `Contacto ${archivo.replace(/\.txt$/i, '')}`;

  const contactoTelefono =
    extraerTelefonoDeTexto(primerAjeno?.autor) ||
    extraerTelefonoDeTexto(nombreArchivo) ||
    extraerTelefonoDeTexto(mensajes.filter((m) => !m.esPropio).map((m) => m.texto).join(' '));

  const idHash = createHash('sha256')
    .update(`${archivo}|${contactoNombre}|${mensajes[0]?.fecha || ''}|${mensajes.length}`)
    .digest('hex')
    .slice(0, 16);

  return {
    id: `chat_${idHash}`,
    archivo,
    contactoNombre,
    contactoTelefono,
    mensajes,
  };
}

/**
 * Extrae y parsea charlas desde archivos `.txt` o `.zip` de "Exportar chat" de WhatsApp.
 */
export async function extraerCharlasDesdeArchivos(
  archivos: Array<{ name: string; buffer: Buffer }>,
): Promise<{ charlas: CharlaWhatsAppParseada[]; errores: string[] }> {
  const charlas: CharlaWhatsAppParseada[] = [];
  const errores: string[] = [];

  for (const archivo of archivos) {
    const lower = archivo.name.toLowerCase();
    try {
      if (lower.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(archivo.buffer);
        const txtEntries = Object.values(zip.files).filter(
          (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.txt'),
        );
        if (txtEntries.length === 0) {
          errores.push(`El archivo ${archivo.name} no contiene ningún .txt de chat.`);
          continue;
        }
        for (const entry of txtEntries) {
          const text = await entry.async('string');
          const parsed = parsearTxtWhatsAppExportado(text, `${archivo.name}/${entry.name}`);
          if (parsed) charlas.push(parsed);
        }
      } else if (lower.endsWith('.txt')) {
        const parsed = parsearTxtWhatsAppExportado(archivo.buffer.toString('utf8'), archivo.name);
        if (parsed) charlas.push(parsed);
        else errores.push(`No se encontraron mensajes válidos en ${archivo.name}.`);
      } else {
        errores.push(`Formato no compatible (${archivo.name}): subí archivos .txt o .zip de Exportar chat.`);
      }
    } catch (err: any) {
      errores.push(`Error leyendo ${archivo.name}: ${err?.message || 'archivo inválido'}`);
    }
  }

  return { charlas, errores };
}

function construirResumenParaDecision(charla: CharlaWhatsAppParseada): string {
  const ultimos = charla.mensajes.slice(-25);
  const lineas = ultimos.map(
    (m) => `[${m.fecha.slice(0, 10)}] ${m.esPropio ? 'AK Producciones' : m.autor}: ${m.texto}`,
  );
  return `Contacto: ${charla.contactoNombre}${charla.contactoTelefono ? ` (${charla.contactoTelefono})` : ''}\n${lineas.join('\n')}`;
}

function armarMensajeRescate(params: {
  nombre: string;
  quePedia: string;
  fechaEvento?: string;
  fechaDisponible?: boolean;
  fechasAlternativas?: string[];
}): string {
  const primerNombre = params.nombre.trim().split(/\s+/)[0] || 'hola';
  const saludo = `¡Hola ${primerNombre}!`;
  const detallePedido =
    params.quePedia === 'presupuesto'
      ? 'por tu consulta de presupuesto'
      : params.quePedia === 'fecha_disponibilidad'
        ? 'por la consulta de fecha'
        : 'por tu consulta para tu evento';

  let detalleFecha = '';
  if (params.fechaEvento) {
    if (params.fechaDisponible === true) {
      detalleFecha = ` (estuvimos revisando y el ${params.fechaEvento} figura disponible)`;
    } else if (params.fechaDisponible === false) {
      const alts = params.fechasAlternativas?.length
        ? ` — como alternativas cercanas tenemos ${params.fechasAlternativas.slice(0, 2).join(' o ')}`
        : '';
      detalleFecha = ` (el ${params.fechaEvento} ya está reservado${alts})`;
    }
  }

  return `${saludo} Te escribimos de AK Producciones retomando ${detallePedido}${detalleFecha}. ¿Seguís organizando la fiesta? Si querés, lo vemos sin compromiso.`;
}

function calcularPrioridadProspecto(quedoSinRespuesta: boolean, fechaEvento?: string): number {
  if (quedoSinRespuesta && fechaEvento) return 1;
  if (quedoSinRespuesta) return 2;
  if (fechaEvento) return 3;
  return 4;
}

/**
 * Procesa charlas viejas de WhatsApp usando `decidir`:
 * - `personal` y `proveedor`: se descartan sin guardar nada.
 * - `cliente_con_fiesta`: avisa al dueño si quedó sin respuesta, sin meterlo al CRM.
 * - `prospecto`: entra al CRM con origen `'rescatado'`, chequea disponibilidad de fecha,
 *   prioriza sin respuesta con fecha primero y prepara mensaje "Abrir en WhatsApp" (nunca manda solo).
 */
export async function procesarCharlasViejasWhatsApp(
  charlas: CharlaWhatsAppParseada[],
): Promise<ResultadoRescateCharlas> {
  const resultado: ResultadoRescateCharlas = {
    totalCharlasAnalizadas: charlas.length,
    prospectosRescatados: [],
    clientesSinRespuesta: [],
    descartadosPersonal: 0,
    descartadosProveedor: 0,
    descartadosSinClasificar: 0,
    errores: [],
  };

  for (const charla of charlas) {
    if (!charla.mensajes.length) continue;

    const decision = await decidir({
      entradas: [construirResumenParaDecision(charla)],
      preguntas: {
        tipo: {
          tipo: 'opcion',
          instruccion:
            '¿Qué tipo de contacto es esta persona en la conversación con AK Producciones (empresa de fiestas y eventos)?',
          opciones: {
            prospecto: 'Potencial cliente que consultó por una fiesta, presupuesto o fecha sin haber contratado',
            cliente_con_fiesta: 'Cliente que ya tiene o tuvo una fiesta contratada con AK Producciones',
            proveedor: 'Proveedor, salón, DJ, catering o colaborador comercial',
            personal: 'Familia, amigo o conversación personal ajena al negocio',
          },
        },
        quedo_sin_respuesta: {
          tipo: 'si_no',
          instruccion:
            '¿La conversación quedó sin respuesta de AK Producciones ante una pregunta o pedido de la otra persona?',
        },
        que_pedia: {
          tipo: 'opcion',
          instruccion: '¿Qué estaba pidiendo principalmente la persona en la charla?',
          opciones: {
            presupuesto: 'Pide presupuesto, precios o cotización de fiesta',
            fecha_disponibilidad: 'Consulta disponibilidad de una fecha o salón',
            reunion_info: 'Pide información de servicios o coordinar reunión',
            seguimiento_fiesta: 'Consulta detalles, pagos o cambios de una fiesta ya contratada',
            otro: 'Otro motivo o conversación cerrada',
          },
        },
      },
      funcion: 'decisiones',
    }).catch(() => null);

    if (!decision || !decision.tipo?.opcion) {
      resultado.descartadosSinClasificar++;
      continue;
    }

    const tipoRaw = decision.tipo.opcion.toLowerCase().trim();
    const quedoSinRespuesta = decision.quedo_sin_respuesta?.siNo === true;
    const quePediaKey = decision.que_pedia?.opcion || 'otro';
    const quePediaLabel = ETIQUETAS_QUE_PEDIA[quePediaKey] || quePediaKey;

    if (tipoRaw === 'personal') {
      resultado.descartadosPersonal++;
      continue;
    }

    if (tipoRaw === 'proveedor') {
      resultado.descartadosProveedor++;
      continue;
    }

    if (tipoRaw === 'cliente_con_fiesta' || tipoRaw === 'cliente con fiesta') {
      const ultimoMsg = charla.mensajes[charla.mensajes.length - 1]?.texto || '';
      let notificado = false;
      if (quedoSinRespuesta) {
        const resNotif = await createNotification({
          titulo: 'Cliente con fiesta quedó sin respuesta',
          mensaje: `${charla.contactoNombre} (${quePediaLabel}) quedó sin respuesta en una charla rescatada: "${ultimoMsg.slice(0, 80)}"`,
          href: '/customers',
          tipo: 'aviso',
          icono: 'AlertTriangle',
          rolDestino: 'admin',
        }).catch(() => ({ success: false }));
        notificado = Boolean(resNotif?.success);
      }
      resultado.clientesSinRespuesta.push({
        nombre: charla.contactoNombre,
        telefono: charla.contactoTelefono,
        quePedia: quePediaLabel,
        ultimoMensaje: ultimoMsg,
        notificado,
      });
      continue;
    }

    if (tipoRaw === 'prospecto') {
      const textoCompleto = charla.mensajes.map((m) => m.texto).join('\n');
      const datosExtraidos = extraerDatosPresupuestoProspecto(textoCompleto);
      const fechaEvento = datosExtraidos.fecha;

      let fechaDisponible: boolean | undefined;
      let fechasAlternativas: string[] | undefined;
      let fechaEstado: ProspectoRescatadoItem['fechaEstado'] = 'sin_fecha';

      if (fechaEvento) {
        try {
          const check = await checkDateAvailability(fechaEvento);
          fechaDisponible = !check.isOccupied;
          fechasAlternativas = check.suggestions;
          fechaEstado = check.isOccupied ? 'ocupada' : 'libre';
        } catch {
          fechaEstado = 'por_confirmar';
        }
      }

      const phoneNorm = normalizeUruguayPhone(charla.contactoTelefono);
      const esCelularUy = /^09\d{7}$/.test(phoneNorm);
      const nombreLimpio =
        charla.contactoNombre.trim().length >= 3
          ? charla.contactoNombre.trim()
          : `WhatsApp ${phoneNorm.slice(-4) || 'Rescatado'}`;

      const mensajesCrm: CrmMensaje[] = charla.mensajes.map((m) => {
        const extHash = createHash('sha256')
          .update(`${charla.id}|${m.fecha}|${m.autor}|${m.texto}`)
          .digest('hex')
          .slice(0, 16);
        return buildCrmMensaje({
          idExterno: `rescatado_${extHash}`,
          canal: 'rescatado',
          direccion: m.esPropio ? 'saliente' : 'entrante',
          texto: m.texto,
          fecha: m.fecha,
          autor: m.autor,
          ...(m.esPropio ? { respondidoPor: 'persona' as const } : {}),
        });
      });

      const notasRescate = [
        `Charla rescatada (${charla.archivo}).`,
        `Pedido detectado: ${quePediaLabel}.`,
        quedoSinRespuesta ? 'Estado: quedó sin respuesta.' : 'Estado: respondida anteriormente.',
        fechaEvento
          ? `Fecha consultada: ${fechaEvento} (${fechaEstado === 'libre' ? 'disponible' : fechaEstado === 'ocupada' ? 'ocupada' : 'a confirmar'}).`
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      const { lead } = await upsertPublicCommercialLead({
        name: nombreLimpio,
        phone: esCelularUy ? phoneNorm : (charla.contactoTelefono || ''),
        permitirSinTelefono: !esCelularUy,
        claveSinTelefono: !esCelularUy
          ? `rescatado:${nombreLimpio.toLowerCase().replace(/\s+/g, '_')}`
          : undefined,
        coincidirSoloPorTelefono: Boolean(phoneNorm),
        partyType: datosExtraidos.tipoEvento,
        eventDate: fechaEvento,
        guestCount: datosExtraidos.invitados,
        venueName: datosExtraidos.salon,
        notes: notasRescate,
        acquisition: { source: 'whatsapp', entryPath: '/contabilidad/crm/rescatar' },
        origenWhatsApp: 'rescatado',
        atiende: 'persona',
        mensajesConversacion: mensajesCrm,
      });

      const mensajePreparado = armarMensajeRescate({
        nombre: lead.name,
        quePedia: quePediaKey,
        fechaEvento,
        fechaDisponible,
        fechasAlternativas,
      });

      const waUrl = buildWhatsAppLink(charla.contactoTelefono || '', mensajePreparado, {
        leadId: lead.id,
      });

      resultado.prospectosRescatados.push({
        leadId: lead.id,
        nombre: lead.name,
        telefono: lead.phone || charla.contactoTelefono,
        quedoSinRespuesta,
        quePedia: quePediaLabel,
        fechaEvento,
        fechaDisponible,
        fechasAlternativas,
        fechaEstado,
        prioridad: calcularPrioridadProspecto(quedoSinRespuesta, fechaEvento),
        mensajePreparado,
        waUrl,
        mensajesGuardados: mensajesCrm.length,
      });
    }
  }

  resultado.prospectosRescatados.sort((a, b) => a.prioridad - b.prioridad);
  return resultado;
}
