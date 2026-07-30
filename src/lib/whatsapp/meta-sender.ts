const DEFAULT_META_API_VERSION = 'v23.0';
const META_REQUEST_TIMEOUT_MS = 10_000;

export interface MetaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
