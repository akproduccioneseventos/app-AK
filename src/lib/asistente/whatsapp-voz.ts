import 'server-only';

import { decode, encode } from 'audiobox';
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
  if (!Buffer.isBuffer(wav) || wav.length < 46 || wav.length > MAX_AUDIO_BYTES ||
      wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE' ||
      wav.readUInt32LE(4) !== wav.length - 8) {
    throw new Error('Gemini no devolvió un WAV completo y válido.');
  }

  const decoded = await decode(wav, { limits: { maxDurationSeconds: 120, maxDecodedBytes: MAX_AUDIO_BYTES } });
  if (decoded.sampleRate !== 24000 || decoded.channels !== 1 || decoded.frames < 1) {
    throw new Error('El WAV de Gemini no tiene el formato de voz esperado.');
  }

  const mp3 = Buffer.from(await encode(decoded.resample(32000).toMono(), 'mp3', { bitrate: 64 }));
  if (!mp3.length || mp3.length > MAX_AUDIO_BYTES) throw new Error('El MP3 generado supera el tamaño permitido.');
  const comprobacion = await decode(mp3, { limits: { maxDurationSeconds: 120, maxDecodedBytes: MAX_AUDIO_BYTES } });
  if (comprobacion.sampleRate !== 32000 || comprobacion.channels !== 1 || comprobacion.frames < 1 ||
      !comprobacion.channelData(0).some((muestra) => Number.isFinite(muestra) && Math.abs(muestra) > 0)) {
    throw new Error('El MP3 generado no se pudo decodificar correctamente.');
  }
  return mp3;
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
