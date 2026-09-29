import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { correrTareaAvisosAlCliente } from '@/lib/whatsapp/avisos-al-cliente';

export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'avisos-al-cliente');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await correrTareaAvisosAlCliente();

    return NextResponse.json({
      ok: true,
      ...resultado,
    });
  } catch (error: any) {
    console.error('[cron-avisos-al-cliente] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar avisos de recordatorio al cliente' },
      { status: 500 }
    );
  }
}
