const DEFAULT_META_API_VERSION = 'v23.0';
const META_REQUEST_TIMEOUT_MS = 10_000;

export interface MetaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  delivery?: 'sent' | 'not_sent' | 'uncertain';
}

function getMetaApiVersion(): string {
  const configured = process.env.META_GRAPH_API_VERSION?.trim();
  return configured && /^v\d+\.\d+$/.test(configured)
    ? configured
    : DEFAULT_META_API_VERSION;
}

function normalizeRecipient(value: string): string {
  return value.replace(/\D/g, '');
}

export async function sendMetaWhatsAppMessage(params: {
  to: string;
  text: string;
  apiToken: string;
  phoneNumberId: string;
}): Promise<MetaSendResult> {
  const apiToken = params.apiToken.trim();
  const phoneNumberId = params.phoneNumberId.replace(/\D/g, '');
  const to = normalizeRecipient(params.to);
  const text = params.text.trim();

  if (!apiToken || !phoneNumberId) {
    return { success: false, error: 'Faltan el token de Meta o el Phone Number ID.' };
  }
  if (to.length < 8 || to.length > 15) {
    return { success: false, error: 'El número de destino no es válido para WhatsApp.' };
  }
  if (!text || text.length > 4096) {
    return { success: false, error: 'El mensaje debe tener entre 1 y 4096 caracteres.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_REQUEST_TIMEOUT_MS);
  const url = `https://graph.facebook.com/${getMetaApiVersion()}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload?.error?.error_data?.details || payload?.error?.message;
      return {
        success: false,
        error: detail ? `Meta rechazó el mensaje: ${detail}` : `Meta rechazó el mensaje (HTTP ${response.status}).`,
      };
    }

    const messageId = payload?.messages?.[0]?.id;
    if (typeof messageId !== 'string' || !messageId) {
      return { success: false, error: 'Meta no devolvió un identificador de entrega.' };
    }
    return { success: true, messageId };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Meta no respondió dentro de 10 segundos.' };
    }
    return {
      success: false,
      error: `No se pudo contactar a Meta: ${error instanceof Error ? error.message : 'error desconocido'}.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendMetaWhatsAppAudioMessage(params: {
  to: string;
  audio: Buffer;
  apiToken: string;
  phoneNumberId: string;
}): Promise<MetaSendResult> {
  const apiToken = params.apiToken.trim();
  const phoneNumberId = params.phoneNumberId.replace(/\D/g, '');
  const to = normalizeRecipient(params.to);
  if (!apiToken || !phoneNumberId || to.length < 8 || to.length > 15 || !Buffer.isBuffer(params.audio) || !params.audio.length) {
    return { success: false, delivery: 'not_sent', error: 'Faltan datos para enviar el audio por WhatsApp.' };
  }
  if (params.audio.length > 16 * 1024 * 1024) {
    return { success: false, delivery: 'not_sent', error: 'El audio supera el tamaño permitido por WhatsApp.' };
  }
  if (!esMp3Valido(params.audio)) {
    return { success: false, delivery: 'not_sent', error: 'El audio no es un MP3 válido para WhatsApp.' };
  }

  const version = getMetaApiVersion();
  const baseUrl = `https://graph.facebook.com/${version}/${phoneNumberId}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_REQUEST_TIMEOUT_MS);
  let mediaId: string;
  try {
    const form = new FormData();
    form.set('messaging_product', 'whatsapp');
    form.set('type', 'audio/mpeg');
    form.set('file', new Blob([new Uint8Array(params.audio)], { type: 'audio/mpeg' }), 'respuesta.mp3');
    const upload = await fetch(`${baseUrl}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
      signal: controller.signal,
    });
    const payload = await upload.json().catch(() => null);
    if (!upload.ok) {
      const detail = payload?.error?.error_data?.details || payload?.error?.message;
      return { success: false, delivery: 'not_sent', error: detail ? `Meta rechazó el audio: ${detail}` : `Meta rechazó el audio (HTTP ${upload.status}).` };
    }
    mediaId = payload?.id;
    if (typeof mediaId !== 'string' || !mediaId) {
      return { success: false, delivery: 'not_sent', error: 'Meta no devolvió el identificador del audio subido.' };
    }
  } catch (error) {
    return {
      success: false,
      delivery: 'not_sent',
      error: error instanceof Error && error.name === 'AbortError'
        ? 'Meta no respondió al subir el audio; no se envió el mensaje.'
        : `No se pudo subir el audio a Meta: ${error instanceof Error ? error.message : 'error desconocido'}.`,
    };
  } finally {
    clearTimeout(timeout);
  }

  const sendController = new AbortController();
  const sendTimeout = setTimeout(() => sendController.abort(), META_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'audio',
        audio: { id: mediaId },
      }),
      signal: sendController.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload?.error?.error_data?.details || payload?.error?.message;
      return { success: false, delivery: 'not_sent', error: detail ? `Meta rechazó el envío de audio: ${detail}` : `Meta rechazó el envío de audio (HTTP ${response.status}).` };
    }
    const messageId = payload?.messages?.[0]?.id;
    if (typeof messageId !== 'string' || !messageId) {
      return { success: false, delivery: 'uncertain', error: 'Meta aceptó la solicitud pero no confirmó un identificador; no reintentes para evitar duplicados.' };
    }
    return { success: true, delivery: 'sent', messageId };
  } catch (error) {
    return {
      success: false,
      delivery: 'uncertain',
      error: error instanceof Error && error.name === 'AbortError'
        ? 'Meta no confirmó el envío dentro de 10 segundos; no reintentes para evitar duplicados.'
        : `Se perdió la confirmación de Meta; no reintentes para evitar duplicados (${error instanceof Error ? error.message : 'error desconocido'}).`,
    };
  } finally {
    clearTimeout(sendTimeout);
  }
}

function esMp3Valido(audio: Buffer): boolean {
  let offset = audio.toString('ascii', 0, 3) === 'ID3' && audio.length >= 10
    ? 10 + ((audio[6] & 0x7f) << 21) + ((audio[7] & 0x7f) << 14) + ((audio[8] & 0x7f) << 7) + (audio[9] & 0x7f)
    : 0;
  while (offset + 4 <= audio.length) {
    const header = audio.readUInt32BE(offset);
    const sync = ((header & 0xffe00000) >>> 0) === 0xffe00000;
    const layer = (header >> 17) & 0x3;
    const bitrate = (header >> 12) & 0xf;
    const sampleRate = (header >> 10) & 0x3;
    if (sync && layer === 1 && bitrate > 0 && bitrate < 15 && sampleRate < 3) return audio.length - offset >= 24;
    offset += 1;
  }
  return false;
}
