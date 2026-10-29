import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
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
import { readData, readDataConDetalle, writeData } from '@/lib/data-service';
import { armarContextoDelNegocio } from '@/lib/multiagent/contexto-negocio';
import { ID_MEMORIA_DUENO, loQueSe, olvidar, recordar } from '@/lib/asistente/memoria';
import { puede, PERMISOS, type Perfil } from '@/lib/auth/perfiles';
import { descargarMediaWhatsApp, transcribirAudioWhatsApp, clasificarImagenWhatsApp } from '@/lib/asistente/whatsapp-media';

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

export interface DatosPresupuestoProspecto {
  fecha?: string;
  invitados?: number;
  salon?: string;
  tipoEvento?: string;
}

export interface ResultadoPresupuestoProspecto {
  completo: boolean;
  faltantes: string[];
  respuestaTexto: string;
  presupuestoId?: string;
  token?: string;
  linkPresupuesto?: string;
  error?: string;
  borradorAtendido?: boolean;
}

/**
 * Extrae fecha, cantidad de invitados y salón del texto de un prospecto de anuncio.
 */
export function extraerDatosPresupuestoProspecto(texto: string): DatosPresupuestoProspecto {
  const t = (texto || '').trim();
  const res: DatosPresupuestoProspecto = {};

  // 1. Invitados: ej "120 personas", "150 invitados", "para 80", etc.
  const mInvitados = t.match(/(\d{1,4})\s*(?:personas|invitados|adultos|pax)/i) ||
                     t.match(/(?:para|seriamos|somos)\s*(\d{1,4})/i);
  if (mInvitados) {
    const cant = parseInt(mInvitados[1], 10);
    if (cant > 0) res.invitados = cant;
  }

  // 2. Fecha: ej "2027-08-08", "15/11/2026", "15 de noviembre de 2026", etc.
  const mFechaIso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const mFechaSlash = t.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  const mFechaTexto = t.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)(?:\s+de(?:l)?\s+(\d{4}))?\b/i);

  if (mFechaIso) {
    res.fecha = mFechaIso[1];
  } else if (mFechaSlash) {
    const d = mFechaSlash[1].padStart(2, '0');
    const m = mFechaSlash[2].padStart(2, '0');
    let y = mFechaSlash[3];
    if (y.length === 2) y = '20' + y;
    res.fecha = y + '-' + m + '-' + d;
  } else if (mFechaTexto && mFechaTexto[3]) {
    const meses: Record<string, string> = {
      enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
      julio: '07', agosto: '08', setiembre: '09', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
    };
    const d = mFechaTexto[1].padStart(2, '0');
    const m = meses[mFechaTexto[2].toLowerCase()] || '01';
    const y = mFechaTexto[3];
    res.fecha = y + '-' + m + '-' + d;
  }

  // 3. Salón: ej "salon Los Robles", "salón: Club Uruguay", "en Club Uruguay", etc.
  const mSalon = t.match(/(?:en el salon|en salon|en el sal[oó]n|en sal[oó]n|sal[oó]n:|salon:?)\s+([^,\.\n]+)/i) ||
                 t.match(/(?:en)\s+([A-ZÁÉÍÓÚ][a-záéíóúA-ZÁÉÍÓÚ0-9\s]{3,30})/);
  if (mSalon) {
    const s = mSalon[1].trim();
    if (s && !/^(cuanto|enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)/i.test(s)) {
      res.salon = s;
    }
  }

  const normalizado = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(?:boda|casamiento|nos casamos)\b/.test(normalizado)) res.tipoEvento = 'Boda';
  else if (/\b(?:xv|quince|15 anos)\b/.test(normalizado)) res.tipoEvento = 'XV años';
  else if (/\b(?:corporativo|empresarial)\b/.test(normalizado)) res.tipoEvento = 'Evento corporativo';
  else if (/\b(?:infantil|cumple de ninos)\b/.test(normalizado)) res.tipoEvento = 'Cumpleaños infantil';
  else if (/\bcumple(?:anos)?\b/.test(normalizado)) res.tipoEvento = 'Cumpleaños';
  return res;
}

/**
 * Atiende a un prospecto que llega desde un anuncio de WhatsApp.
 * Si faltan fecha, invitados o salón, le pregunta lo que falta sin llamar al simulador.
 * Con los tres datos, prepara el enlace al simulador
 * sin dar nada por cerrado ni prometer precios ni plazos.
 */
export async function atenderProspectoAnuncioWhatsApp(params: {
  phone: string;
  name?: string;
  text: string;
  datosPrevios?: DatosPresupuestoProspecto;
  messageId?: string;
}): Promise<ResultadoPresupuestoProspecto> {
  const nuevos = extraerDatosPresupuestoProspecto(params.text);
  const datos: DatosPresupuestoProspecto = {
    ...params.datosPrevios,
    ...Object.fromEntries(Object.entries(nuevos).filter(([_, v]) => v !== undefined)),
  };

  const faltantes: string[] = [];
  if (!datos.fecha) faltantes.push('la fecha aproximada');
  if (!datos.invitados) faltantes.push('la cantidad estimada de invitados');
  if (!datos.salon) faltantes.push('el salón o zona del evento');
  if (!datos.tipoEvento) faltantes.push('el tipo de fiesta');

  if (faltantes.length > 0) {
    const listaFaltantes = faltantes.join(', ');
    await agregarPropuestasDeduplicadas([{
      clave: `prospecto-datos:${params.messageId || params.phone}`,
      area: 'ventas', titulo: 'Completar datos del prospecto de anuncio',
      quePasa: `Faltan ${listaFaltantes} para preparar la propuesta.`,
      porQueImporta: 'No se calculan precios ni se contacta al prospecto con datos incompletos.',
      quePropone: `Revisar la consulta de ${params.name || params.phone} y pedir los datos faltantes manualmente.`,
      tipoPropuesta: 'prospecto_datos_pendientes', nivelRiesgo: 'pregunta',
    }]);
    return {
      completo: false,
      borradorAtendido: true,
      faltantes,
      respuestaTexto: '¡Hola! Para prepararte una propuesta a medida necesitamos saber: ' + listaFaltantes + '. ¿Nos podrías confirmar esos detalles? 😊',
    };
  }

  const { prepararBorradorProspectoAnuncio } = await import('@/lib/asistente/comercial-borrador');
  const borrador = await prepararBorradorProspectoAnuncio({
    phone: params.phone, name: params.name || 'Prospecto', fecha: datos.fecha!,
    invitados: datos.invitados!, salon: datos.salon!,
    tipoEvento: datos.tipoEvento as import('@/types/presupuesto').TipoEvento,
    requestId: params.messageId,
  });
  if (borrador.status !== 'draft_created' || borrador.photoIds.length < 3) {
    await agregarPropuestasDeduplicadas([{
      clave: `prospecto-presupuesto-revision:${params.messageId || params.phone}`,
      area: 'ventas',
      titulo: borrador.status === 'draft_created' ? 'Completar fotos autorizadas del borrador' : 'Revisar presupuesto de prospecto de anuncio',
      quePasa: `La propuesta de ${params.name || params.phone} requiere revisión: ${borrador.reason || 'No se pudo completar la preparación'}.`,
      porQueImporta: 'El equipo debe revisar datos y precios vigentes antes de responder al prospecto.',
      quePropone: `Revisar manualmente el presupuesto de ${params.name || 'Prospecto'} (${params.phone}). Fiesta: ${datos.tipoEvento}, ${datos.fecha}, ${datos.invitados} invitados, salón/zona ${datos.salon}.`,
      tipoPropuesta: 'presupuesto_revision_manual',
      nivelRiesgo: 'pregunta',
    }]);
  }
  return {
    completo: borrador.status === 'draft_created', borradorAtendido: true, faltantes: [],
    presupuestoId: borrador.presupuestoId,
    respuestaTexto: borrador.status === 'draft_created'
      ? 'El presupuesto y las fotos autorizadas quedaron en la bandeja para revisión. No se enviaron al prospecto.'
      : 'La propuesta necesita revisión manual. No se envió ningún mensaje al prospecto.',
    ...(borrador.reason ? { error: borrador.reason } : {}),
  };
}

const ECHO_LOG_FILE = 'asistente-echoes-log.json';

/**
 * Normaliza número a dígitos puros (ej: '59898355530')
 */
function normalizarNumero(numero: string): string {
  return (numero || '').replace(/\D/g, '');
}

function perfilDesdeRolWhatsApp(rol: string): Perfil {
  const normalizado = rol.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/dueno|owner|propietario/.test(normalizado)) return 'dueno';
  if (/secret|coordin|administr|ventas/.test(normalizado)) return 'secretaria';
  if (/operador/.test(normalizado)) return 'operador';
  return 'personal';
}

async function contextoWhatsAppParaPerfil(usuario: { perfil: Perfil }): Promise<string> {
  const puedeVerAgenda = usuario.perfil === 'dueno' || usuario.perfil === 'secretaria';
  const [fiestas, presupuestos, prospectos] = await Promise.all([
    puedeVerAgenda ? readDataConDetalle<any[]>('fiestas.json', []) : Promise.resolve({ valor: [], huboFalla: false }),
    puede(usuario, PERMISOS.CONTABILIDAD) ? readDataConDetalle<any[]>('presupuestos.json', []) : Promise.resolve(undefined),
    puede(usuario, PERMISOS.CRM) ? readDataConDetalle<any[]>('crm-leads.json', []) : Promise.resolve(undefined),
  ]);
  return armarContextoDelNegocio(usuario, {
    fiestas: fiestas.huboFalla ? null : fiestas.valor,
    presupuestos: presupuestos ? (presupuestos.huboFalla ? null : presupuestos.valor) : undefined,
    prospectos: prospectos ? (prospectos.huboFalla ? null : prospectos.valor) : undefined,
  });
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
    numerosAutorizados.push(AK_WHATSAPP_NUMBER); // Número del dueño por omisión
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
  const usuario = { perfil: perfilDesdeRolWhatsApp(persona.rol) };
  const memoriaId = usuario.perfil === 'dueno' ? ID_MEMORIA_DUENO : fromLimpio;
  const accesoMemoria = {
    esDueno: usuario.perfil === 'dueno',
    puedeVerMemoriaDelDueno: usuario.perfil === 'dueno' && puede(usuario, PERMISOS.ADMINISTRACION),
  };

  // Sólo los números autorizados del equipo llegan hasta acá; nunca damos voz IA a invitados.
  let textoParaProcesar = params.text || '';
  const audioEntrante = params.type === 'audio';
  if (params.type === 'audio') {
    try {
      if (!params.mediaId) throw new Error('Falta el identificador del audio.');
      const media = await descargarMediaWhatsApp(params.mediaId, 'audio');
      textoParaProcesar = await transcribirAudioWhatsApp(media);
    } catch {
      const respuesta = 'No pude escuchar el audio, ¿me lo escribís?';
      const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuesta, { conVoz: true, settings });
      return { atendido: true, accionIdentificada: 'audio_no_disponible', nivel: 'solo', respuestaEnviada: respuesta, audioEnviado };
    }
  } else if (params.type === 'image') {
    try {
      if (!params.mediaId) throw new Error('Falta el identificador de la imagen.');
      const media = await descargarMediaWhatsApp(params.mediaId, 'image');
      const imagen = await clasificarImagenWhatsApp(media);
      if (imagen.tipo !== 'comprobante') {
        const respuesta = `Veo esto en la foto: ${imagen.descripcion}. ¿Qué querés que haga con ella?`;
        await enviarRespuestaWhatsApp(fromLimpio, respuesta);
        return { atendido: true, accionIdentificada: 'describir_foto', nivel: 'pregunta', respuestaEnviada: respuesta };
      }

      const proveedor = imagen.proveedor?.trim() || 'No identificado';
      const montoValido = imagen.monto;
      const descripcion = [
        `Proveedor: ${proveedor}`,
        `Fecha leída: ${imagen.fecha || 'No identificada'}`,
        montoValido ? `Monto leído: $${montoValido.toLocaleString('es-UY')}` : 'No se pudo leer un monto confiable.',
        `Categoría sugerida: ${imagen.categoria || 'Sin sugerir'}`,
        `Confianza de lectura: ${imagen.confianza || 'baja'}`,
        `Detalle: ${imagen.detalle || imagen.descripcion}`,
      ].join('\n');
      await agregarPropuestasDeduplicadas([{
        clave: `boleta:meta:${params.mediaId}`,
        area: 'cobros',
        titulo: `Revisar comprobante de ${proveedor}`,
        quePasa: descripcion,
        porQueImporta: 'La lectura automática puede equivocarse; el dueño debe revisar el comprobante antes de registrar un gasto.',
        quePropone: 'Revisar la imagen y confirmar o corregir proveedor, fecha, categoría y monto desde la app.',
        tipoPropuesta: 'gasto_boleta',
        nivelRiesgo: 'pregunta',
        esImportante: true,
        ...(montoValido ? { monto: montoValido } : {}),
      }]);
      const respuesta = 'Leí el comprobante y lo dejé como propuesta para revisar en la app. No registré ningún gasto ni pago.';
      await enviarRespuestaWhatsApp(fromLimpio, respuesta);
      return { atendido: true, accionIdentificada: 'proponer_gasto', nivel: 'pregunta', respuestaEnviada: respuesta };
    } catch (error) {
      const respuesta = error instanceof Error && error.message.includes('tope mensual')
        ? 'No pude leer la foto porque se alcanzó el tope mensual de IA. No registré ningún gasto.'
        : 'No pude descargar o leer la foto con seguridad. No registré ningún gasto; probá enviarla de nuevo o revisala en la app.';
      await enviarRespuestaWhatsApp(fromLimpio, respuesta);
      return { atendido: true, accionIdentificada: 'foto_no_procesada', nivel: 'pregunta', respuestaEnviada: respuesta };
    }
  }

  let respuestaTexto = '';
  const recordarCoincide = textoParaProcesar.match(/^\s*(?:(?:acordate|ac[uú]erdate|record[aá]|anot[aá]|ten[eé]\s+en\s+cuenta)\s+que)\s+(.+)$/i);
  if (recordarCoincide) {
    const resultado = await recordar(memoriaId, recordarCoincide[1], undefined, accesoMemoria);
    respuestaTexto = resultado.guardado
      ? 'Listo, lo guardé en tu memoria personal para tenerlo presente en próximos pedidos.'
      : resultado.motivo === 'sensible'
        ? 'No guardé ese dato porque parece ser una contraseña, información de tarjeta o un dato de salud.'
        : 'No pude guardar un recuerdo vacío. Decime qué querés que tenga presente.';
    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: 'recordar', nivel: 'solo', respuestaEnviada: respuestaTexto, audioEnviado };
  }

  const olvidarCoincide = textoParaProcesar.match(/^\s*olvid[aá]te(?:\s+de)?\s+(.+)$/i);
  if (olvidarCoincide || /^\s*olvid[aá]lo\s*$/i.test(textoParaProcesar)) {
    const tema = olvidarCoincide?.[1] || 'eso';
    const cantidad = await olvidar(memoriaId, tema, accesoMemoria);
    respuestaTexto = cantidad
      ? `Listo, eliminé ${cantidad === 1 ? 'ese recuerdo' : ` ${cantidad} recuerdos`} de tu memoria.`
      : 'No encontré un recuerdo tuyo sobre ese tema para borrar.';
    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: 'olvidar', nivel: 'solo', respuestaEnviada: respuestaTexto, audioEnviado };
  }

  const consultaMemoria = textoParaProcesar.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(?:que sabes de(?:l)?|que te acordas de(?:l)?|que recordas de(?:l)?|que tenemos anotado sobre)\b/.test(consultaMemoria)) {
    const recuerdos = await loQueSe(memoriaId, textoParaProcesar, accesoMemoria);
    respuestaTexto = recuerdos.length
      ? recuerdos.map((recuerdo) => `• ${recuerdo.sobre ? `${recuerdo.sobre}: ` : ''}${recuerdo.texto}`).join('\n')
      : 'No tengo recuerdos guardados sobre ese tema. Si querés, decime “acordate que…” y lo anoto.';
    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: 'consultar_memoria', nivel: 'solo', respuestaEnviada: respuestaTexto, audioEnviado };
  }

  const textoPlanNormalizado = textoParaProcesar.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const planReunionSolicitado = /\b(?:organiza|arma|prepara|planifica|coordina)\b[\s\S]{0,100}\b(?:reunion|encuentro)\b[\s\S]{0,100}\bnovios\b[\s\S]{0,60}\bsabado\b/.test(textoPlanNormalizado);
  if (planReunionSolicitado) {
    const hash = Math.abs(textoParaProcesar.toLowerCase().split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
    const claveSolicitud = params.messageId || `${hash}:${Math.floor(Date.now() / 900_000)}`;
    const pasos = [
      'Confirmar con la pareja el horario y modalidad; dejar cualquier mensaje como borrador, sin enviarlo.',
      'Preparar la agenda con los temas y decisiones pendientes de la fiesta.',
      'Asignar a una persona del equipo y reunir la información necesaria para la reunión.',
    ];
    const { agregadas } = await agregarPropuestasDeduplicadas([{
      clave: `plan-reunion-whatsapp:${fromLimpio}:${claveSolicitud}`,
      area: 'fiestas',
      titulo: 'Organizar la reunión con los novios del sábado',
      quePasa: `${persona.nombre} pidió organizar una reunión con los novios del sábado por WhatsApp.`,
      porQueImporta: 'La reunión requiere preparación coordinada, pero no se debe contactar a la pareja sin aprobación.',
      quePropone: pasos.map((paso, indice) => `${indice + 1}. ${paso}`).join('\n'),
      tipoPropuesta: 'plan_multi_paso',
      nivelRiesgo: 'pregunta',
      esImportante: false,
      responsableNombre: persona.nombre,
    }]);
    respuestaTexto = agregadas.length
      ? 'Dejé un plan de tres pasos en “Tu asistente” para que lo revises. No contacté a los novios.'
      : 'Ese plan ya está en “Tu asistente”. No contacté a los novios.';
    await registrarAccionAsistente({
      pedido: textoParaProcesar,
      accion: 'plan_multi_paso',
      canal: 'whatsapp',
      nivel: 'pregunta',
      resultado: 'Plan de tres pasos preparado para revisión; no se contactó al cliente.',
      usuarioIdentificado: persona.nombre,
      telefono: fromLimpio,
    });
    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: 'plan_multi_paso', nivel: 'pregunta', respuestaEnviada: respuestaTexto, audioEnviado };
  }

  const interpretacion = interpretarComandoTexto(textoParaProcesar);
  const accion = interpretacion.accion;
  const riesgo = nivelDeRiesgo(accion);

  if (accion === 'consulta_general' || accion === 'ver_mi_semana') {
    try {
      const contexto = await contextoWhatsAppParaPerfil(usuario);
      respuestaTexto = contexto || 'No encontré datos disponibles para este perfil.';
    } catch {
      respuestaTexto = 'No pude leer los datos del negocio ahora. Probá de nuevo en un rato.';
    }
    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: accion, nivel: 'solo', respuestaEnviada: respuestaTexto, audioEnviado };
  }

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

    const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });
    return { atendido: true, accionIdentificada: accion, nivel: 'pregunta', respuestaEnviada: respuestaTexto, audioEnviado };
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
      if (usuario.perfil !== 'dueno') {
        respuestaTexto = '🔒 Eso lo ve sólo el dueño. Mirálo con él o en la app.';
      } else {
        try {
          const { calculateFinancialLedger } = await import('@/lib/commercial-flow/ledger-service');
          const { getBudgetPaymentSummary } = await import('@/lib/budget/financial-guardrails');
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
  const audioEnviado = await enviarRespuestaWhatsApp(fromLimpio, respuestaTexto, { conVoz: audioEntrante, settings });

  return {
    atendido: true,
    accionIdentificada: accion,
    nivel: riesgo,
    respuestaEnviada: respuestaTexto,
    audioEnviado,
  };
}

/**
 * Envia el mensaje de respuesta por Meta WhatsApp API si están las variables configuradas.
 */
async function enviarRespuestaWhatsApp(
  to: string,
  text: string,
  opciones: { conVoz?: boolean; settings?: Awaited<ReturnType<typeof getAsistenteSettings>> } = {},
): Promise<boolean> {
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  if (!apiToken || !phoneNumberId) {
    return false;
  }

  const vozSolicitada = opciones.conVoz && opciones.settings?.responderConVoz === true &&
    opciones.settings?.vozGeminiActiva === true;
  let textoEnviado = text;
  if (vozSolicitada) {
    const { enviarRespuestaConVozWhatsApp } = await import('@/lib/asistente/whatsapp-voz');
    const voz = await enviarRespuestaConVozWhatsApp({
      to, text, authorized: true, settings: opciones.settings!, apiToken, phoneNumberId,
    });
    if (voz.audioEnviado) return true;
    if (!voz.puedeEnviarTextoFallback) return false;
    textoEnviado = `${text}\n\nNo pude responder con voz: ${voz.fallbackReason || 'servicio no disponible'}. Te respondo por texto.`;
  }
  try {
    await sendMetaWhatsAppMessage({
      to,
      text: textoEnviado,
      apiToken,
      phoneNumberId,
    });
  } catch (err) {
    console.warn('[WhatsAppEquipo] Error enviando respuesta:', err);
  }
  return false;
}
