import { NextRequest, NextResponse } from 'next/server';
import { getChannelsConfig, processIncomingChannelMessage } from '@/app/actions/channels';

// GET: Webhook verification (Twilio or Meta)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const config = await getChannelsConfig();
  const channelConfig = config.channels.find(c => c.id === 'whatsapp');

  if (!channelConfig?.enabled) {
    return NextResponse.json({ error: 'Canal WhatsApp no habilitado' }, { status: 403 });
  }

  // Meta verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === channelConfig.webhookVerifyToken && challenge) {
    console.log('[WhatsApp Webhook] Verificación Meta exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// POST: Receive WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const config = await getChannelsConfig();
    const channelConfig = config.channels.find(c => c.id === 'whatsapp');

    if (!channelConfig?.enabled) {
      return NextResponse.json({ status: 'canal_deshabilitado' }, { status: 200 });
    }

    const body = await request.json();
    console.log('[WhatsApp Webhook] Mensaje recibido:', JSON.stringify(body, null, 2));

    // Parse Meta WhatsApp Cloud API format
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const messages = change?.value?.messages ?? [];
        for (const msg of messages) {
          const senderId = msg?.from;
          const messageText = msg?.text?.body;
          const mediaUrl = msg?.image?.link ?? msg?.audio?.link ?? msg?.video?.link;

          if (senderId && messageText) {
            await processIncomingChannelMessage('whatsapp', senderId, messageText, mediaUrl);
          }
        }
      }
    }

    // Also handle Twilio format
    const body2 = body as Record<string, string>;
    if (body2.From && body2.Body) {
      await processIncomingChannelMessage('whatsapp', body2.From, body2.Body);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json({ status: 'error_interno' }, { status: 200 });
  }
}
