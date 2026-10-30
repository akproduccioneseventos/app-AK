import 'server-only';

import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';
import { sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import { reservarCupoDiarioVozGemini } from '@/lib/asistente/cuota-voz-gemini';
import { sendMetaWhatsAppAudioMessage } from '@/lib/whatsapp/meta-sender';

const MAX_AUDIO_BYTES = 16 * 1024 * 1024;

export interface EnviarVozWhatsAppParams {
  to: string;
  text: string;
  authorized: boolean;
  settings: {
    responderConVoz?: boolean;
    vozGeminiActiva?: boolean;
    vozSeleccionada?: string;
  };
  apiToken?: string;
  phoneNumberId?: string;
}

export interface ResultadoVozWhatsApp {
  audioEnviado: boolean;
  messageId?: string;
  fallbackReason?: string;
  /** Ante una respuesta ambigua de Meta no se debe mandar un segundo mensaje. */
  puedeEnviarTextoFallback: boolean;
}

export async function convertirWavGeminiAMp3(wav: Buffer): Promise<Buffer> {
  if (!Buffer.isBuffer(wav) || wav.length < 44 || wav.length > MAX_AUDIO_BYTES ||
      wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE' ||
      wav.readUInt32LE(4) > wav.length - 8) {
    throw new Error('Gemini no devolvió un WAV completo y válido.');
  }

  let canales: number | undefined;
  let frecuencia: number | undefined;
  let bitsPorMuestra: number | undefined;
  let formato: number | undefined;
  let datos: { inicio: number; longitud: number } | undefined;
  let offset = 12;
  const riffEnd = wav.readUInt32LE(4) + 8;
  if (riffEnd > wav.length) throw new Error('Gemini no devolvió un WAV completo y válido.');
  for (; offset + 8 <= riffEnd;) {
    const id = wav.toString('ascii', offset, offset + 4);
    const longitud = wav.readUInt32LE(offset + 4);
    const inicio = offset + 8;
    const fin = inicio + longitud;
    if (fin > riffEnd || fin < inicio) throw new Error('Gemini no devolvió un WAV completo y válido.');
    if (id === 'fmt ') {
      if (longitud < 16 || formato !== undefined) throw new Error('El WAV de Gemini tiene un bloque fmt inválido.');
      formato = wav.readUInt16LE(inicio);
      canales = wav.readUInt16LE(inicio + 2);
      frecuencia = wav.readUInt32LE(inicio + 4);
      const byteRate = wav.readUInt32LE(inicio + 8);
      const alineacion = wav.readUInt16LE(inicio + 12);
      bitsPorMuestra = wav.readUInt16LE(inicio + 14);
      if (canales !== 1 && canales !== 2) throw new Error('El WAV debe ser PCM mono o estéreo.');
      if (![8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000].includes(frecuencia) || formato !== 1 || bitsPorMuestra !== 16 ||
          alineacion !== canales * 2 || byteRate !== frecuencia * alineacion) {
        throw new Error('El WAV de Gemini debe ser PCM de 16 bits con frecuencia y alineación válidas.');
      }
    } else if (id === 'data') {
      if (datos) throw new Error('El WAV de Gemini contiene más de un bloque de audio.');
      datos = { inicio, longitud };
    }
    const siguiente = fin + (longitud % 2);
    if (siguiente > riffEnd) throw new Error('El WAV de Gemini termina antes del padding RIFF esperado.');
    offset = siguiente;
  }
  if (offset !== riffEnd || riffEnd !== wav.length) throw new Error('El WAV de Gemini contiene bytes finales incompletos o fuera del tamaño RIFF declarado.');
  if (canales === undefined || frecuencia === undefined || bitsPorMuestra === undefined || !datos ||
      datos.longitud === 0 || datos.longitud % (canales * 2) !== 0) {
    throw new Error('El WAV de Gemini no tiene formato de voz válido o está truncado.');
  }
  const muestras = datos.longitud / (canales * 2);
  if (muestras / frecuencia > 120) throw new Error('El WAV supera los 120 segundos permitidos.');
  const izquierda = new Int16Array(muestras);
  const derecha = canales === 2 ? new Int16Array(muestras) : undefined;
  for (let i = 0; i < muestras; i++) {
    izquierda[i] = wav.readInt16LE(datos.inicio + i * canales * 2);
    if (derecha) derecha[i] = wav.readInt16LE(datos.inicio + i * canales * 2 + 2);
  }

  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const encoder = new Mp3Encoder(canales, frecuencia, 64);
  const partes: Buffer[] = [];
  let total = 0;
  const agregar = (parte: Uint8Array) => {
    if (!parte.length) return;
    total += parte.length;
    if (total > MAX_AUDIO_BYTES) throw new Error('El MP3 generado supera el tamaño permitido.');
    partes.push(Buffer.from(parte));
  };
  for (let inicio = 0; inicio < muestras; inicio += 1152) {
    agregar(encoder.encodeBuffer(izquierda.subarray(inicio, inicio + 1152), derecha?.subarray(inicio, inicio + 1152)));
  }
  agregar(encoder.flush());
  if (!total) throw new Error('El encoder no generó un MP3 válido.');
  return Buffer.concat(partes, total);
}

export async function enviarRespuestaConVozWhatsApp(
  params: EnviarVozWhatsAppParams,
): Promise<ResultadoVozWhatsApp> {
  const fallback = (fallbackReason: string, puedeEnviarTextoFallback = true): ResultadoVozWhatsApp => ({
    audioEnviado: false,
    fallbackReason,
    puedeEnviarTextoFallback,
  });
  const recipient = (params.to || '').replace(/\D/g, '');
  const apiToken = (params.apiToken ?? process.env.META_WHATSAPP_TOKEN ?? process.env.WHATSAPP_API_TOKEN ?? '').trim();
  const phoneNumberId = (params.phoneNumberId ?? process.env.META_WHATSAPP_PHONE_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? '').replace(/\D/g, '');

  if (!params.authorized) return fallback('El destinatario no está autorizado.');
  if (!params.settings?.responderConVoz || !params.settings?.vozGeminiActiva) return fallback('La respuesta por voz está desactivada en Ajustes.');
  if (!params.text?.trim()) return fallback('No hay texto para convertir en voz.');
  if (recipient.length < 8 || recipient.length > 15) return fallback('El número de WhatsApp no es válido.');
  if (!apiToken || !phoneNumberId) return fallback('Falta configurar el envío de WhatsApp Meta.');

  const claveGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (claveGemini.trim().length < 10 || claveGemini === 'dummy') return fallback('Falta configurar la clave de Gemini para generar voz.');

  let consumo;
  try {
    consumo = await reservarConsumoIA('voz-cliente');
  } catch {
    return fallback('No se pudo reservar de forma segura el presupuesto mensual de IA.');
  }
  if (!consumo) return fallback('Se alcanzó el límite mensual de consumo de IA.');

  try {
    if (!(await reservarCupoDiarioVozGemini())) {
      await consumo.liberar().catch(() => undefined);
      return fallback('Se alcanzó el límite compartido de 100 voces de Gemini de hoy.');
    }
  } catch {
    await consumo.liberar().catch(() => undefined);
    return fallback('No se pudo reservar de forma segura el cupo diario de voz.');
  }

  let mp3: Buffer;
  try {
    const wav = await sintetizarVozGemini(params.text, { voz: params.settings.vozSeleccionada });
    mp3 = await convertirWavGeminiAMp3(wav);
  } catch (error) {
    return fallback(error instanceof Error ? error.message : 'Gemini no pudo generar la voz.');
  }

  let result;
  try {
    result = await sendMetaWhatsAppAudioMessage({
      to: recipient,
      audio: mp3,
      apiToken,
      phoneNumberId,
    });
  } catch {
    return fallback('No se pudo confirmar el resultado del envío; no reintentes para evitar duplicados.', false);
  }
  if (result.success && result.messageId) {
    return { audioEnviado: true, messageId: result.messageId, puedeEnviarTextoFallback: false };
  }
  return fallback(result.error || 'Meta no confirmó el envío del audio.', result.delivery !== 'uncertain');
}
