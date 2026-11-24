import { NextRequest, NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session-token';
import { esPerfilValido, PERMISOS, puede } from '@/lib/auth/perfiles';
import { validarFiestaIdSeguro } from '@/lib/security/safe-fiesta-file';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import type { AkAgentType, AkMultiAgentMessage } from '@/types/multiagent';

export const runtime = 'nodejs';

const PERMISOS_ASISTENTE = [
  PERMISOS.ADMINISTRACION,
  PERMISOS.CONTABILIDAD,
  PERMISOS.CRM,
  PERMISOS.ORGANIZACION,
  PERMISOS.INSUMOS,
  PERMISOS.NOCHE,
] as const;

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
  if (!session.success || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { user } = session;
  if (
    (user.perfil !== undefined &&
      user.perfil !== null &&
      String(user.perfil) !== '' &&
      !esPerfilValido(user.perfil)) ||
    !PERMISOS_ASISTENTE.some((p) => puede(user, p))
  ) {
    return NextResponse.json(
      { error: 'Tu perfil no tiene permiso para usar el asistente.' },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 7_000_000) {
    return NextResponse.json(
      { error: 'La imagen es demasiado grande. Probá con una foto más chica.' },
      { status: 413 },
    );
  }

  try {
    await enforcePublicRateLimit({
      scope: 'multiagente',
      identity: user.userId,
      limit: 60,
      windowMs: 3_600_000,
      ignoreClientAddress: true,
    });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('Demasiados intentos')
      ? 'Hiciste muchas consultas seguidas. Esperá unos minutos y probá de nuevo.'
      : (error instanceof Error ? error.message : 'Hiciste muchas consultas seguidas. Esperá unos minutos y probá de nuevo.');
    return NextResponse.json({ error: message }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as {
    message?: unknown;
    requestId?: unknown;
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

  const requestId = body?.requestId;
  if (requestId !== undefined && (typeof requestId !== 'string'
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))) {
    return NextResponse.json({ error: 'Identificador de intento invalido' }, { status: 400 });
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

  if (agentType === 'contable' && !puede(user, PERMISOS.CONTABILIDAD)) {
    return NextResponse.json({ error: 'Tu perfil no tiene acceso al módulo contable.' }, { status: 403 });
  }
  if (agentType === 'comercial' && !puede(user, PERMISOS.CRM)) {
    return NextResponse.json({ error: 'Tu perfil no tiene acceso al módulo comercial.' }, { status: 403 });
  }

  let safeFiestaId: string | undefined;
  if (typeof body?.fiestaId === 'string' && body.fiestaId.trim() !== '') {
    const validated = validarFiestaIdSeguro(body.fiestaId.trim());
    if (!validated) {
      return NextResponse.json({ error: 'Identificador de fiesta invalido' }, { status: 400 });
    }
    try {
      const { requireEventPermission } = await import('@/lib/auth/event-access');
      await requireEventPermission(validated, [
        PERMISOS.ORGANIZACION,
        PERMISOS.NOCHE,
        PERMISOS.ADMINISTRACION,
        PERMISOS.CONTABILIDAD,
        PERMISOS.CRM,
      ]);
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'No autorizado para operar sobre esa fiesta.' },
        { status: 403 },
      );
    }
    safeFiestaId = validated;
  }

  if (!(await hayPresupuestoParaIA())) {
    return NextResponse.json({
      success: false,
      response: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
      message: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
      error: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
    });
  }

  const { sendPersistentMultiAgentMessage } = await import('@/app/actions/multiagent');
  const result = await sendPersistentMultiAgentMessage({
    message,
    requestId: requestId as string | undefined,
    history,
    pathname: typeof body?.pathname === 'string' ? body.pathname : undefined,
    fiestaId: safeFiestaId,
    agentType,
    imageDataUri,
    sessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
  });

  if (result.success) {
    await registrarConsumoIA('multiagente');
  }

  return NextResponse.json(result);
}
