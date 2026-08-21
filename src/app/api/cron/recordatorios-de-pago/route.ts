import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { ejecutarEscaneoDeRecordatorios } from '@/app/actions/invoices';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';

/**
 * Dispara los recordatorios de pago vencido y por vencer.
 *
 * Existía la lógica para armarlos y **nadie la llamaba nunca**: ningún cliente
 * con la cuota vencida recibía el aviso, y la plata quedaba sin reclamar sin que
 * nadie se enterara.
 *
 * Se protege con la misma clave que el resto de las tareas programadas. Sin esa
 * clave configurada no corre: es preferible que no salga a que cualquiera pueda
 * disparar mensajes a los clientes desde afuera.
 */
export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'recordatorios-de-pago');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await ejecutarEscaneoDeRecordatorios(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);

    // Deja constancia de que corrio de verdad. Sin esto no hay forma de saber si
    // una tarea automatica esta funcionando o solo esta escrita.
    await marcarCorrida('recordatorios-de-pago');

    return NextResponse.json({
      ok: resultado.success,
      recordatoriosProgramados: resultado.triggeredCount,
      errores: resultado.errors,
    });
  } catch (error: any) {
    console.error('[cron-recordatorios] Error al escanear recordatorios de pago:', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudieron generar los recordatorios de pago.' },
      { status: 500 },
    );
  }
}
