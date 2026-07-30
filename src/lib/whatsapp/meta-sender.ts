/**
 * Meta WhatsApp Business API — Envío de mensajes salientes
 * Llama a graph.facebook.com para enviar mensajes reales al teléfono del cliente.
 *
 * Requiere en WhatsAppConfig:
 *   - apiKey:       Permanent access token de Meta
 *   - phoneNumberId: ID del número de teléfono en Meta (≠ phoneNumber)
 */

const META_API_VERSION = 'v20.0';

export interface MetaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un mensaje de texto simple via Meta WhatsApp Business API.
 */
export async function sendMetaWhatsAppMessage(params: {
  to: string;
  text: string;
  apiToken: string;
  phoneNumberId: string;
}): Promise<MetaSendResult> {
  const { to, text, apiToken, phoneNumberId } = params;

  if (!apiToken || !phoneNumberId) {
    return {
      success: false,
      error: 'Faltan credenciales de Meta: apiKey y phoneNumberId son requeridos.',
    };
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

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
        text: { body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data?.error?.message ||
        data?.error?.error_data?.details ||
        `HTTP ${response.status}`;
      return { success: false, error: `Meta API error: ${errMsg}` };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    return {
      success: false,
      error: `Error de red al contactar Meta: ${err?.message ?? err}`,
    };
  }
}
