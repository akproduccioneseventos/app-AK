import { NextRequest, NextResponse } from 'next/server';
import { getChannelsConfig, processIncomingChannelMessage } from '@/app/actions/channels';

// GET: Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const config = await getChannelsConfig();
  const channelConfig = config.channels.find(c => c.id === 'facebook');

  if (!channelConfig?.enabled) {
    return NextResponse.json({ error: 'Canal Facebook no habilitado' }, { status: 403 });
  }

  if (mode === 'subscribe' && token === channelConfig.webhookVerifyToken) {
    console.log('[Facebook Webhook] Verificación exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token de verificación inválido' }, { status: 403 });
}

// POST: Receive Facebook Messenger messages
export async function POST(request: NextRequest) {
  try {
    const config = await getChannelsConfig();
    const channelConfig = config.channels.find(c => c.id === 'facebook');

    if (!channelConfig?.enabled) {
      return NextResponse.json({ status: 'canal_deshabilitado' }, { status: 200 });
    }

    const body = await request.json();
    console.log('[Facebook Webhook] Mensaje recibido:', JSON.stringify(body, null, 2));

    // Parse Meta Messenger format
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const messaging = entry?.messaging ?? [];
      for (const event of messaging) {
        const senderId = event?.sender?.id;
        const messageText = event?.message?.text;
        const mediaUrl = event?.message?.attachments?.[0]?.payload?.url;

        if (senderId && messageText) {
          await processIncomingChannelMessage('facebook', senderId, messageText, mediaUrl);
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Facebook Webhook] Error:', error);
    // Always return 200 to Meta to avoid retries
    return NextResponse.json({ status: 'error_interno' }, { status: 200 });
  }
}
