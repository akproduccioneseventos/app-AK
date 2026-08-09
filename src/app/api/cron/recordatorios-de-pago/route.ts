import { NextResponse } from 'next/server';
import { ejecutarEscaneoDeRecordatorios } from '@/app/actions/invoices';

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
    const { searchParams } = new URL(request.url);
    const clave =
      searchParams.get('secret') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const claveEsperada = process.env.CRON_SECRET;

    if (!claveEsperada) {
      return NextResponse.json(
        { error: 'CRON_SECRET no esta configurado: la tarea no corre.' },
        { status: 503 },
      );
    }

    if (clave !== claveEsperada) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultado = await ejecutarEscaneoDeRecordatorios();

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
