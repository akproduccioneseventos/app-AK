import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession } from '@/lib/auth/require-session';
import { sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { readData, writeData } from '@/lib/data-service';
import { hoyEnUruguay } from '@/lib/utils';

/**
 * La voz del asistente (decisión del dueño, 3/10/2026): la de Gemini y la del teléfono, cada una
 * con su interruptor en Ajustes. Esta ruta da la de Gemini. Si está apagada, se pasó el tope del
 * día o Gemini no contesta, devuelve 503 y dice si la del teléfono está prendida, para que el
 * reproductor sepa si hablar o quedarse callado.
 *
 * El tope del día es de la app, no de Google: aunque la cuenta tenga cobro activado, la voz no
 * pasa de TOPE_DIARIO pedidos y después sigue el teléfono.
 */
const TOPE_DIARIO = 100;
const USO_FILE = 'asistente-voz-uso.json';

async function hayCupoHoy(): Promise<boolean> {
  const hoy = hoyEnUruguay();
  const uso = await readData<{ fecha?: string; cantidad?: number }>(USO_FILE, {});
  const cantidad = uso.fecha === hoy ? uso.cantidad || 0 : 0;
  if (cantidad >= TOPE_DIARIO) return false;
  await writeData(USO_FILE, { fecha: hoy, cantidad: cantidad + 1 });
  return true;
}

async function darVoz(texto: string | null | undefined, voz: string | undefined, cache: string) {
  if (!(await hasAppSession())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (!texto) {
    return NextResponse.json({ error: 'Falta el texto a decir' }, { status: 400 });
  }
  const ajustes = await getAsistenteSettings();
  const vozTelefonoActiva = ajustes.vozTelefonoActiva !== false;
  try {
    if (ajustes.vozGeminiActiva === false) throw new Error('La voz de Gemini está apagada en Ajustes.');
    if (!(await hayCupoHoy())) throw new Error('Se llegó al tope de voz de Gemini del día.');
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

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  return darVoz(p.get('texto'), p.get('voz') || undefined, 'private, max-age=86400');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return darVoz(body?.texto, body?.voz, 'private, no-cache');
}
