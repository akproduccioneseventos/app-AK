import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { ejecutarVigilanteFiestas } from '@/lib/agentes/motor-agentes';
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
    const puerta = await abrirPuertaDeLaTarea(request, 'fiesta-proxima-revision');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await ejecutarVigilanteFiestas(new Date());
    await marcarCorrida('fiesta-proxima-revision');
    return NextResponse.json({ ok: true, resultado });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al ejecutar revisión de fiestas próximas.' },
      { status: 500 }
    );
  }
}
