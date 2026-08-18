import { NextResponse } from 'next/server';
import { guardarMetricasDelDia } from '@/lib/presencia-digital/guardado-diario';
import { procesarPosteosProgramados } from '@/lib/presencia-digital/programador-posteos';
import { syncMetaPublicHistory } from '@/lib/social-media/meta-history-backfill';
import { syncYouTubePublicHistory } from '@/lib/social-media/youtube-history-backfill';
import { syncOtherPublicHistory } from '@/lib/social-media/other-public-history-backfill';

/**
 * Guarda los numeros de las redes, una vez por dia.
 *
 * Por que existe: las plataformas **no entregan los numeros viejos hacia atras**.
 * Lo que no se guarda hoy se pierde para siempre. Antes esto sólo pasaba cuando
 * alguien abria la pantalla de presencia digital: una semana sin entrar era una
 * semana de historia que no se recuperaba nunca.
 *
 * Ademas, la misma tarea reconstruye el historial publico de las cuentas de
 * Facebook, Instagram, YouTube, TikTok, Threads y X. Cada proveedor se pagina
 * hasta agotar lo disponible desde septiembre de 2019 y nunca se marca como
 * completo si la API impone un tope antes de llegar al inicio del historial.
 * Las redes sin autorización configurada se omiten sin bloquear las demás.
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
    const resultadoProgramados = await procesarPosteosProgramados().catch((error: unknown) => ({
      procesados: 0,
      publicados: 0,
      pasadosAListoParaCopiar: 0,
      fallidos: 0,
      omitidosPorTope: 0,
      error: error instanceof Error ? error.message : 'Error al procesar posteos programados',
      detalles: [],
    }));
    const historialMeta = await syncMetaPublicHistory().catch((error: unknown) => ({
      success: false,
      earliestDate: '2019-09-01T00:00:00.000Z',
      fetched: 0,
      imported: 0,
      updated: 0,
      platforms: [],
      error: error instanceof Error ? error.message : 'No se pudo completar el historial publico de Meta.',
    }));
    const historialYouTube = await syncYouTubePublicHistory().catch((error: unknown) => ({
      success: false,
      mode: 'rss' as const,
      channelId: 'UClq6YnypA9PFuBgunzk306A',
      fetched: 0,
      imported: 0,
      updated: 0,
      complete: false,
      error: error instanceof Error ? error.message : 'No se pudo completar el historial publico de YouTube.',
    }));
    const historialOtrasRedes = await syncOtherPublicHistory().catch((error: unknown) => ({
      success: false,
      earliestDate: '2019-09-01T00:00:00.000Z',
      platforms: [],
      error: error instanceof Error ? error.message : 'No se pudo completar el historial de TikTok, Threads y X.',
    }));

    return NextResponse.json({
      ok: true,
      guardado: resultado.guardado,
      fecha: resultado.fecha,
      posteosProgramados: resultadoProgramados,
      historialPublico: {
        meta: historialMeta,
        youtube: historialYouTube,
        otrasRedes: historialOtrasRedes,
      },
    });
  } catch (error: any) {
    console.error('[cron-metricas-redes] No se pudieron guardar los numeros del dia:', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudieron guardar los numeros de las redes.' },
      { status: 500 },
    );
  }
}
