import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession, requireSession } from '@/lib/auth/require-session';
import { esPerfilValido, PERMISOS, puede } from '@/lib/auth/perfiles';
import { validarFiestaIdSeguro } from '@/lib/security/safe-fiesta-file';
import { sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { reservarCupoDiarioVozGemini } from '@/lib/asistente/cuota-voz-gemini';

const PERMISOS_ASISTENTE = [
  PERMISOS.ADMINISTRACION,
  PERMISOS.CONTABILIDAD,
  PERMISOS.CRM,
  PERMISOS.ORGANIZACION,
  PERMISOS.INSUMOS,
  PERMISOS.NOCHE,
] as const;

/**
 * La voz del asistente (decisión del dueño, 3/10/2026): la de Gemini y la del teléfono, cada una
 * con su interruptor en Ajustes. Esta ruta da la de Gemini. Si está apagada, se pasó el tope del
 * día o Gemini no contesta, devuelve 503 y dice si la del teléfono está prendida, para que el
 * reproductor sepa si hablar o quedarse callado.
 *
 * El tope del día es de la app, no de Google: aunque la cuenta tenga cobro activado, la voz no
 * pasa de TOPE_DIARIO pedidos y después sigue el teléfono.
 */
async function darVoz(
  texto: string | null | undefined,
  voz: string | undefined,
  cache: string,
  fiestaId?: unknown,
) {
  if (!(await hasAppSession())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const session = await requireSession();
  if (!session.ok) {
    return new NextResponse('Unauthorized', { status: 401 });
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
      { error: 'Tu perfil no tiene permiso para usar la voz del asistente.' },
      { status: 403 },
    );
  }
  if (fiestaId !== undefined && fiestaId !== null && fiestaId !== '') {
    const safeFiestaId = validarFiestaIdSeguro(fiestaId);
    if (!safeFiestaId) {
      return NextResponse.json({ error: 'Fiesta ID inválido.' }, { status: 400 });
    }
    try {
      const { requireEventPermission } = await import('@/lib/auth/event-access');
      await requireEventPermission(safeFiestaId, [
        PERMISOS.ORGANIZACION,
        PERMISOS.NOCHE,
        PERMISOS.ADMINISTRACION,
        PERMISOS.CONTABILIDAD,
        PERMISOS.CRM,
      ]);
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'No autorizado para usar el asistente en esa fiesta.' },
        { status: 403 },
      );
    }
  }
  if (!texto) {
    return NextResponse.json({ error: 'Falta el texto a decir' }, { status: 400 });
  }
  const ajustes = await getAsistenteSettings();
  const vozTelefonoActiva = ajustes.vozTelefonoActiva !== false;
  try {
    if (ajustes.vozGeminiActiva === false) throw new Error('La voz de Gemini está apagada en Ajustes.');
    if (!(await reservarCupoDiarioVozGemini())) throw new Error('Se llegó al tope de voz de Gemini del día.');
    const audio = await sintetizarVozGemini(texto, { voz: voz || ajustes.vozSeleccionada });
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audio.length.toString(),
        'Cache-Control': cache,
      },
    });
  } catch (error: any) {
    // NUNCA un pitido haciéndose pasar por voz (orden 110): error explícito y el reproductor decide.
    return NextResponse.json(
      { error: error?.message || 'La voz de Gemini no está disponible.', vozTelefonoActiva },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Sólo POST: por GET el texto quedaba en la dirección y en los registros (auditoría 66).
  const body = await request.json().catch(() => ({}));
  return darVoz(body?.texto, body?.voz, 'private, no-cache', body?.fiestaId);
}
