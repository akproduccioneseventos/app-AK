import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig, processIncomingMessage } from '@/app/actions/whatsapp';

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint required by Meta/Twilio.
 * Responds to hub.challenge with the expected token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Meta webhook verification
  if (mode === 'subscribe' && challenge) {
    const config = await getWhatsAppConfig();
    // Use a dedicated verifyToken if set, otherwise fall back to a default
    const verifyToken = config.verifyToken || 'ak_whatsapp_verify';

    if (token === verifyToken) {
      return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ status: 'ok', message: 'WhatsApp webhook endpoint active' });
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming messages from WhatsApp providers.
 * Supports Meta and Twilio payload formats.
 */
export async function POST(request: NextRequest) {
  try {
    const config = await getWhatsAppConfig();

    if (!config.enabled) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let phone: string | null = null;
    let messageText: string | null = null;
    let clientName: string | undefined;

    // Parse Meta (WhatsApp Business API) format
    if (body.object === 'whatsapp_business_account' || body.entry) {
      try {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const messageData = value?.messages?.[0];

        if (messageData) {
          phone = messageData.from;
          messageText = messageData.text?.body ?? messageData.type ?? '';
          const contact = value?.contacts?.[0];
          clientName = contact?.profile?.name;
        }
      } catch {
        // Ignore parse errors — may be a different event type (status update, etc.)
      }
    }

    // Parse Twilio format
    if (!phone && body.From) {
      phone = (body.From as string).replace('whatsapp:', '');
      messageText = body.Body ?? '';
      clientName = body.ProfileName;
    }

    // Fallback: generic format { phone, message, name }
    if (!phone && body.phone) {
      phone = body.phone;
      messageText = body.message ?? body.text ?? '';
      clientName = body.name;
    }

    if (!phone || !messageText) {
      // Not an incoming message event — acknowledge silently
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const result = await processIncomingMessage(phone, messageText, clientName);

    if (!result.success) {
      console.error('[WhatsApp Webhook] Error processing message:', result.error);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Build response payload for providers that expect a reply in the HTTP response
    if (result.botResponse) {
      // Twilio expects TwiML or JSON response
      if (body.From) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${result.botResponse}</Message></Response>`;
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Unexpected error:', error);
    // Always return 200 to prevent provider retries
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}
