import { NextRequest, NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session-token';
import type { AkAgentType, AkMultiAgentMessage } from '@/types/multiagent';

export const runtime = 'nodejs';

const AGENT_TYPES: AkAgentType[] = [
  'secretaria',
  'fiesta',
  'fiestas_general',
  'contable',
  'marketing',
  'comercial',
  'central',
];

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session.success) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    message?: unknown;
    history?: unknown;
    pathname?: unknown;
    fiestaId?: unknown;
    agentType?: unknown;
    imageDataUri?: unknown;
    sessionId?: unknown;
  } | null;
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4_000) {
    return NextResponse.json({ error: 'Mensaje invalido' }, { status: 400 });
  }

  const history: AkMultiAgentMessage[] = Array.isArray(body?.history)
    ? body.history.slice(-12).filter((item): item is AkMultiAgentMessage =>
        Boolean(
          item
          && typeof item === 'object'
          && ['user', 'assistant'].includes((item as AkMultiAgentMessage).role)
          && typeof (item as AkMultiAgentMessage).content === 'string',
        ))
    : [];
  const imageDataUri = typeof body?.imageDataUri === 'string' && body.imageDataUri.length <= 6_000_000
    ? body.imageDataUri
    : undefined;
  const agentType = typeof body?.agentType === 'string'
    && AGENT_TYPES.includes(body.agentType as AkAgentType)
    ? body.agentType as AkAgentType
    : undefined;

  const { sendPersistentMultiAgentMessage } = await import('@/app/actions/multiagent');
  const result = await sendPersistentMultiAgentMessage({
    message,
    history,
    pathname: typeof body?.pathname === 'string' ? body.pathname : undefined,
    fiestaId: typeof body?.fiestaId === 'string' ? body.fiestaId : undefined,
    agentType,
    imageDataUri,
    sessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
  });

  return NextResponse.json(result);
}
