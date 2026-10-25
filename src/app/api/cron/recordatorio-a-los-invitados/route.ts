import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea, respuestaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { correrTareaRecordatorioInvitados } from '@/lib/invitaciones/recordatorio-invitados';

/**
 * Tarea programada de recordatorios a los invitados.
 * La lógica central vive en `correrTareaRecordatorioInvitados`:
 * - Calcula fechas en Uruguay con `diasHastaEnUruguay`.
 * - Lee directamente `fiesta.invitados` para evitar getInvitados que exige sesión.
 * - Registra con `saveScheduledMessage` y `WHATSAPP_AUTOMATION_INTERNAL_TOKEN`,
 *   utilizando `idEstable` para deduplicación estricta por momento y fecha.
 */

export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'recordatorio-a-los-invitados');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await correrTareaRecordatorioInvitados();

    if (resultado.ok) {
      await marcarCorrida('recordatorio-a-los-invitados');
    }

    return NextResponse.json(
      respuestaDeLaTarea(puerta, resultado),
      { status: resultado.ok ? 200 : 500 }
    );
  } catch (error: any) {
    console.error('[cron-recordatorio-invitados] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar recordatorios a los invitados' },
      { status: 500 }
    );
  }
}
