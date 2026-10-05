import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession } from '@/lib/auth/require-session';
import { sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
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
const USO_FILE = 'asistente/voz-uso.json';

/**
 * Toma un lugar del tope del día en UNA operación de la base (auditoría 66): con lectura y escritura
 * separadas, varios pedidos a la vez leían el mismo número y pasaban todos.
 */
async function hayCupoHoy(): Promise<boolean> {
  const hoy = hoyEnUruguay();
  let tomado = false;
  await mutarDocumentoConTransaccion<{ fecha?: string; cantidad?: number }>(USO_FILE, {}, (uso) => {
    const cantidad = uso.fecha === hoy ? uso.cantidad || 0 : 0;
    tomado = cantidad < TOPE_DIARIO;
    return tomado ? { fecha: hoy, cantidad: cantidad + 1 } : null;
  });
  return tomado;
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

export async function POST(request: NextRequest) {
  // Sólo POST: por GET el texto quedaba en la dirección y en los registros (auditoría 66).
  const body = await request.json().catch(() => ({}));
  return darVoz(body?.texto, body?.voz, 'private, no-cache');
}
