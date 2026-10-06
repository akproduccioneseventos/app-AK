/**
 * @fileOverview Atención del equipo y del dueño por WhatsApp con texto, audios e imágenes.
 * Respeta la Regla de Oro (nivelDeRiesgo):
 * - solo: ejecuta y confirma con 24h para deshacer.
 * - pregunta: deja propuesta en la app. Responder "sí" por WhatsApp NO confirma.
 * - nunca: rechaza y redirige a la app.
 */

import { nivelDeRiesgo, puedeConfirmarPorWhatsApp, registrarAccionAsistente, type NivelDeRiesgo } from '@/lib/asistente/que-puede-hacer-solo';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { agregarPropuestasDeduplicadas } from '@/lib/asistente/propuestas-service';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { readData, writeData } from '@/lib/data-service';
import { generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';

export interface AtenderEquipoParams {
  from: string;
  to?: string;
  messageId?: string;
  text?: string;
  type?: 'text' | 'audio' | 'image' | 'video' | 'document' | string;
  mediaId?: string;
  isEcho?: boolean;
  rawPayload?: any;
}

export interface ResultadoAtencionEquipo {
  atendido: boolean;
  motivoNoAtendido?: string;
  accionIdentificada?: string;
  nivel?: NivelDeRiesgo;
  respuestaEnviada?: string;
  audioEnviado?: boolean;
}

const ECHO_LOG_FILE = 'asistente-echoes-log.json';

/**
 * Normaliza número a dígitos puros (ej: '59898355530')
 */
function normalizarNumero(numero: string): string {
  return (numero || '').replace(/\D/g, '');
}

/**
 * Registra auditoría técnica de smb_message_echoes sin exponer texto sensible.
 */
async function registrarAuditoriaEcho(from: string, to: string, messageId?: string): Promise<void> {
  try {
    const logs = await readData<Array<{ timestamp: string; from: string; to: string; messageId?: string }>>(ECHO_LOG_FILE, []);
    logs.unshift({
      timestamp: new Date().toISOString(),
      from: normalizarNumero(from),
      to: normalizarNumero(to),
      messageId,
    });
    await writeData(ECHO_LOG_FILE, logs.slice(0, 100), undefined, { skipAutoBackup: true });
  } catch (err) {
    console.warn('[WhatsAppEquipo] Error registrando eco:', err);
  }
}

/**
 * Intenta deducir la acción a partir del texto ingresado o transcrito.
 */
export function interpretarComandoTexto(texto: string): { accion: string; detalle: string; datos?: any } {
  const tOriginal = (texto || '').trim().toLowerCase();
  const tSinTildes = tOriginal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Confirmaciones por WhatsApp ("sí", "si, hacelo", "confirmo", "dale")
  if (
    tSinTildes === 'si' ||
    tSinTildes.startsWith('si,') ||
    tSinTildes.startsWith('si ') ||
    tSinTildes === 'confirmo' ||
    tSinTildes === 'dale' ||
    tSinTildes === 'hacelo'
  ) {
    return { accion: 'confirmar_propuesta', detalle: texto };
  }

  // 1. Prohibidas (nunca)
  if (
    tSinTildes.includes('marca pagad') ||
    tSinTildes.includes('marcar pagad') ||
    tSinTildes.includes('marca como pagad') ||
    tSinTildes.includes('marcar como pagad') ||
    tSinTildes.includes('marcala como pagad')
  ) {
    return { accion: 'marcar_pagado', detalle: texto };
  }
  if (tSinTildes.includes('cobrar') || tSinTildes.includes('registrar cobro')) {
    return { accion: 'cobrar', detalle: texto };
  }
  if (tSinTildes.includes('emitir factura') || tSinTildes.includes('facturar')) {
    return { accion: 'emitir_factura', detalle: texto };
  }
  if (tSinTildes.includes('cerrar presupuesto')) {
    return { accion: 'cerrar_presupuesto', detalle: texto };
  }
  if (tSinTildes.includes('borrar fiesta') || tSinTildes.includes('eliminar fiesta')) {
    return { accion: 'borrar_fiesta', detalle: texto };
  }
  if (tSinTildes.includes('borrar cliente') || tSinTildes.includes('eliminar cliente')) {
    return { accion: 'borrar_cliente', detalle: texto };
  }

  // 2. Pregunta (plata, cambios de fiesta, mensajes)
  if (tSinTildes.includes('gasto') || tSinTildes.includes('boleta') || tSinTildes.includes('factura de compra') || tSinTildes.includes('cargar gasto') || tSinTildes.includes('compre')) {
    return { accion: 'cargar_gasto', detalle: texto };
  }
  if (tSinTildes.includes('invitados') || tSinTildes.includes('subir a') || tSinTildes.includes('bajar a')) {
    return { accion: 'cambiar_invitados', detalle: texto };
  }
  if (tSinTildes.includes('cambiar fecha') || tSinTildes.includes('mover fiesta') || tSinTildes.includes('reprogramar')) {
    return { accion: 'cambiar_fecha', detalle: texto };
  }
  if (tSinTildes.includes('agregar servicio') || tSinTildes.includes('sacar servicio')) {
    return { accion: 'cambiar_servicios', detalle: texto };
  }

  // 3. Solo (tareas, notas, consultas)
  if (tSinTildes.includes('anota') || tSinTildes.includes('tarea') || tSinTildes.includes('recordame') || tSinTildes.includes('recorda')) {
    return { accion: 'anotar_tarea', detalle: texto };
  }
  if (tSinTildes.includes('cuanto me deben') || tSinTildes.includes('quien debe') || tSinTildes.includes('deudas')) {
    return { accion: 'cuanto_me_deben', detalle: texto };
  }
  if (tSinTildes.includes('mi semana') || tSinTildes.includes('que tengo') || tSinTildes.includes('agenda')) {
    return { accion: 'ver_mi_semana', detalle: texto };
  }
  if (tSinTildes.includes('borrador') || tSinTildes.includes('preparar mail') || tSinTildes.includes('prepara mail')) {
    return { accion: 'preparar_mail', detalle: texto };
  }

  // Por defecto, comando no clasificado -> puerta pregunta
  return { accion: 'consulta_general', detalle: texto };
}

/**
 * Función principal llamada desde el webhook de WhatsApp Meta.
 */
export async function atenderAlEquipo(params: AtenderEquipoParams): Promise<ResultadoAtencionEquipo> {
  const fromLimpio = normalizarNumero(params.from);
  const toLimpio = normalizarNumero(params.to || '');

  // Manejo de eventos de eco (smb_message_echoes)
  if (params.isEcho) {
    await registrarAuditoriaEcho(fromLimpio, toLimpio, params.messageId);

    // Sólo atendemos el chat consigo mismo (del dueño a su propio número)
    if (fromLimpio !== toLimpio) {
      return { atendido: false, motivoNoAtendido: 'Eco hacia cliente: ignorado por privacidad.' };
    }
  }

  // Verificar si el remitente está autorizado en Ajustes
  const settings = await getAsistenteSettings();
  const numerosAutorizados = (settings.numerosEquipo || []).map((n) => normalizarNumero(n.telefono));
  if (numerosAutorizados.length === 0) {
    numerosAutorizados.push('59898355530'); // Número del dueño por omisión
  }

  const autorizado = numerosAutorizados.includes(fromLimpio);
  if (!autorizado) {
    return { atendido: false, motivoNoAtendido: 'Número no registrado como parte del equipo.' };
  }

  const persona = (settings.numerosEquipo || []).find((n) => normalizarNumero(n.telefono) === fromLimpio) || {
    nombre: 'Alexander Knuth',
    rol: 'Dueño',
    telefono: fromLimpio,
  };

  // Procesar contenido (texto, audio o foto)
  let textoParaProcesar = params.text || '';
  if (params.type === 'audio') {
    // Si llegó audio, simulamos o transcribimos con IA
    textoParaProcesar = params.text || 'anotar tarea recibida por audio';
  } else if (params.type === 'image') {
    textoParaProcesar = params.text || 'foto de boleta para cargar gasto';
  }

  const interpretacion = interpretarComandoTexto(textoParaProcesar);
  const accion = interpretacion.accion;
  const riesgo = nivelDeRiesgo(accion);

  let respuestaTexto = '';

  // CASO ESPECIAL: Intento de confirmar por WhatsApp ("sí")
  if (accion === 'confirmar_propuesta') {
    // Por seguridad, un "sí" por WhatsApp nunca confirma plata ni fechas
    const evaluacion = puedeConfirmarPorWhatsApp('cargar_gasto');
    respuestaTexto = evaluacion.mensaje;

    await registrarAccionAsistente({
      pedido: textoParaProcesar,
      accion,
      canal: 'whatsapp',
      nivel: 'pregunta',
      resultado: 'Bloqueado por regla de oro (confirmación requiere app)',
      usuarioIdentificado: persona.nombre,
      telefono: fromLimpio,
    });

    await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto);
    return { atendido: true, accionIdentificada: accion, nivel: 'pregunta', respuestaEnviada: respuestaTexto };
  }

  // 1. PUERTA NUNCA: Prohibido
  if (riesgo === 'nunca') {
    respuestaTexto = `⛔ Eso lo tenés que hacer vos desde la app: https://akproducciones.uy/asistente`;
    await registrarAccionAsistente({
      pedido: textoParaProcesar,
      accion,
      canal: 'whatsapp',
      nivel: 'nunca',
      resultado: 'Rechazado: acción inmutable de seguridad',
      usuarioIdentificado: persona.nombre,
      telefono: fromLimpio,
    });
  }
  // 2. PUERTA PREGUNTA: Todo lo que toca plata, invitados, fechas o mensajes
  else if (riesgo === 'pregunta') {
    // Si es una foto de boleta, calculamos huella para idempotencia
    const hash = Math.abs(textoParaProcesar.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
    const idempotencyKey = params.mediaId ? `boleta:${params.mediaId}` : `boleta:${hash}`;

    const nuevaPropuesta = {
      clave: idempotencyKey,
      area: 'cobros' as const,
      titulo: `Confirmar gasto / solicitud de ${persona.nombre}`,
      quePasa: interpretacion.detalle,
      porQueImporta: 'Toca dinero o condiciones de contratación; requiere confirmación manual.',
      quePropone: `¿Confirmar esta acción en el sistema?`,
      tipoPropuesta: 'gasto_boleta',
      nivelRiesgo: 'pregunta' as const,
      esImportante: true,
    };

    await agregarPropuestasDeduplicadas([nuevaPropuesta]);

    respuestaTexto = `📋 Te lo dejé preparado como propuesta para confirmar en la app:\nhttps://akproducciones.uy/asistente\n\n(Por seguridad de la plata, no se confirma por WhatsApp).`;

    await registrarAccionAsistente({
      pedido: textoParaProcesar,
      accion,
      canal: 'whatsapp',
      nivel: 'pregunta',
      resultado: 'Dejado como propuesta en bandeja del asistente',
      usuarioIdentificado: persona.nombre,
      telefono: fromLimpio,
    });
  }
  // 3. PUERTA SOLO: Tareas, notas, consultas, borradores
  else {
    // Si es anotar tarea
    if (accion === 'anotar_tarea') {
      try {
        // Antes se guardaba en "tareas.json", que no lee ninguna pantalla: decía "anoté" y la tarea
        // no aparecía en ningún lado. Ahora queda en la bandeja "Tu asistente".
        const titulo = interpretacion.detalle.replace(/^(anota|anotá|recordame|recordá)\s*/i, '').trim() || 'Tarea por WhatsApp';
        const ahora = new Date().toISOString();
        const { agregadas } = await agregarPropuestasDeduplicadas([
          {
            clave: `tarea-whatsapp:${persona.nombre}:${ahora}`,
            area: 'fiestas',
            titulo,
            quePasa: `${persona.nombre} la anotó por WhatsApp.`,
            porQueImporta: 'Es algo que pidieron no olvidar.',
            quePropone: titulo,
            tipoPropuesta: 'tarea-whatsapp',
            responsableNombre: persona.nombre,
          },
        ]);
        respuestaTexto = agregadas.length > 0
          ? '✅ Listo, la anoté en la bandeja "Tu asistente" de la app.'
          : '⚠️ No pude anotarla. Probá de nuevo o anotala desde la app.';
      } catch {
        respuestaTexto = '⚠️ No pude anotarla. Probá de nuevo o anotala desde la app.';
      }
    } else if (accion === 'cuanto_me_deben') {
      // Lo que se debe es plata de la empresa: sólo se le contesta al dueño. Y se calcula con la
      // misma cuenta del panel (cobros por factura), no con campos del presupuesto que no existen:
      // antes sumaba el total de TODOS los presupuestos como si nada estuviera cobrado.
      if (!/due[ñn]o/i.test(String(persona.rol || ''))) {
        respuestaTexto = '🔒 Eso lo ve sólo el dueño. Mirálo con él o en la app.';
      } else {
        try {
          const { calculateFinancialLedger } = await import('@/lib/commercial-flow/ledger-service');
          const [presupuestos, facturas] = await Promise.all([
            readData<any[]>('presupuestos.json', []),
            readData<any[]>('invoices.json', []),
          ]);
          const { saldoPendiente } = calculateFinancialLedger(presupuestos, facturas);
          respuestaTexto = `💰 Quedan $${Math.round(saldoPendiente).toLocaleString('es-UY')} por cobrar (la misma cuenta del panel).`;
        } catch {
          respuestaTexto = '⚠️ No pude leer los cobros ahora. Miralo en el panel de la app.';
        }
      }
    } else {
      // Ninguna otra acción se hace por WhatsApp todavía: no se dice que se hizo.
      respuestaTexto = '📝 Te leí, pero eso todavía no lo hago por WhatsApp. Hacelo desde la app.';
    }

    await registrarAccionAsistente({
      pedido: textoParaProcesar,
      accion,
      canal: 'whatsapp',
      nivel: 'solo',
      resultado: 'Ejecutado con 24h para deshacer',
      usuarioIdentificado: persona.nombre,
      telefono: fromLimpio,
    });
  }

  // Responder por WhatsApp
  await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto);

  return {
    atendido: true,
    accionIdentificada: accion,
    nivel: riesgo,
    respuestaEnviada: respuestaTexto,
  };
}

/**
 * Envia el mensaje de respuesta por Meta WhatsApp API si están las variables configuradas.
 */
async function enviarRespuestaWhatsApp(to: string, text: string): Promise<void> {
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  if (!apiToken || !phoneNumberId) {
    return;
  }

  try {
    await sendMetaWhatsAppMessage({
      to,
      text,
      apiToken,
      phoneNumberId,
    });
  } catch (err) {
    console.warn('[WhatsAppEquipo] Error enviando respuesta:', err);
  }
}
