import { NextResponse } from 'next/server';
import { guardarMetricasDelDia } from '@/lib/presencia-digital/guardado-diario';
import { syncMetaPublicHistory } from '@/lib/social-media/meta-history-backfill';

/**
 * Guarda los numeros de las redes, una vez por dia.
 *
 * Por que existe: las plataformas **no entregan los numeros viejos hacia atras**.
 * Lo que no se guarda hoy se pierde para siempre. Antes esto sólo pasaba cuando
 * alguien abria la pantalla de presencia digital: una semana sin entrar era una
 * semana de historia que no se recuperaba nunca.
 *
 * Ademas, la misma tarea reconstruye el historial publico de las cuentas de
 * Facebook e Instagram conectadas. La primera ejecucion recorre todas las
 * paginas disponibles desde septiembre de 2019; despues revisa las paginas
 * recientes para incorporar posteos hechos fuera de la app sin repetir datos.
 *
 * Se protege con la misma clave que el resto de las tareas programadas.
 */
export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const clave = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
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

    const resultado = await guardarMetricasDelDia();
    const historialPublico = await syncMetaPublicHistory().catch((error: unknown) => ({
      success: false,
      earliestDate: '2019-09-01T00:00:00.000Z',
      fetched: 0,
      imported: 0,
      updated: 0,
      platforms: [],
      error: error instanceof Error ? error.message : 'No se pudo completar el historial publico.',
    }));

    return NextResponse.json({
      ok: true,
      guardado: resultado.guardado,
      fecha: resultado.fecha,
      historialPublico,
    });
  } catch (error: any) {
    console.error('[cron-metricas-redes] No se pudieron guardar los numeros del dia:', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudieron guardar los numeros de las redes.' },
      { status: 500 },
    );
  }
}
