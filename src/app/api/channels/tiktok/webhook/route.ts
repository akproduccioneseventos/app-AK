import { NextRequest, NextResponse } from 'next/server';
import { getChannelsConfig, processIncomingChannelMessage } from '@/app/actions/channels';

// GET: TikTok webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('verify_token');
  const challenge = searchParams.get('challenge');

  const config = await getChannelsConfig();
  const channelConfig = config.channels.find(c => c.id === 'tiktok');

  if (!channelConfig?.enabled) {
    return NextResponse.json({ error: 'Canal TikTok no habilitado' }, { status: 403 });
  }

  if (token === channelConfig.webhookVerifyToken && challenge) {
    console.log('[TikTok Webhook] Verificación exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token de verificación inválido' }, { status: 403 });
}

// POST: Receive TikTok messages
export async function POST(request: NextRequest) {
  try {
    const config = await getChannelsConfig();
    const channelConfig = config.channels.find(c => c.id === 'tiktok');

    if (!channelConfig?.enabled) {
      return NextResponse.json({ status: 'canal_deshabilitado' }, { status: 200 });
    }

    const body = await request.json();
    console.log('[TikTok Webhook] Mensaje recibido:', JSON.stringify(body, null, 2));

    // Parse TikTok Business API format
    const events = body?.events ?? body?.data?.events ?? [];
    for (const event of events) {
      const senderId =
        event?.sender?.open_id ??
        event?.from?.open_id ??
        event?.user_id;
      const messageText =
        event?.message?.text ??
        event?.content ??
        event?.text;

      if (senderId && messageText) {
        await processIncomingChannelMessage('tiktok', String(senderId), String(messageText));
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[TikTok Webhook] Error:', error);
    return NextResponse.json({ status: 'error_interno' }, { status: 200 });
  }
}
