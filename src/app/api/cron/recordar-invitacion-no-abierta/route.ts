import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { correrTareaRecordarInvitacionNoAbierta } from '@/lib/invitaciones/recordatorio-no-abiertas';

export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'recordar-invitacion-no-abierta');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await correrTareaRecordarInvitacionNoAbierta();

    return NextResponse.json({
      ok: true,
      ...resultado,
    });
  } catch (error: any) {
    console.error('[cron-recordar-invitacion-no-abierta] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar recordatorios de invitación no abierta' },
      { status: 500 }
    );
  }
}
