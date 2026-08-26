import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { ejecutarPerseguidorPresupuestos } from '@/lib/agentes/motor-agentes';
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
    const puerta = await abrirPuertaDeLaTarea(request, 'prospectos-seguimiento');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await ejecutarPerseguidorPresupuestos(new Date());
    await marcarCorrida('prospectos-seguimiento');
    return NextResponse.json({ ok: true, resultado });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al ejecutar seguimiento de prospectos.' },
      { status: 500 }
    );
  }
}
