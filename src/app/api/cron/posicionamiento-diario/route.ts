import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { ejecutarRevisionPosicionamiento } from '@/lib/automatico/posicionamiento-diario';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'posicionamiento-diario');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await ejecutarRevisionPosicionamiento(new Date(), 'despertador');
    await marcarCorrida('posicionamiento-diario');
    return NextResponse.json({ ok: true, resultado });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al ejecutar tarea de posicionamiento.' },
      { status: 500 }
    );
  }
}
