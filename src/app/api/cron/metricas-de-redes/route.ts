import { NextResponse } from 'next/server';
import { readData, mutarDocumento } from '@/lib/data-service';
import { guardarMetricasDelDia } from '@/lib/presencia-digital/guardado-diario';
import { syncMetaPublicHistory, DEFAULT_EARLIEST_DATE } from '@/lib/social-media/meta-history-backfill';
import { syncYouTubePublicHistory } from '@/lib/social-media/youtube-history-backfill';
import { syncOtherPublicHistory } from '@/lib/social-media/other-platforms-history-backfill';
import { syncCommentsFromNetworks } from '@/lib/social-media/comments-backfill';
import { syncDecorationCatalog } from '@/lib/decoracion-ia/catalogo-servicio';
import { processDecorationDraft } from '@/lib/decoracion-ia/generador-servicio';
import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { abrirPuertaDeLaTarea, respuestaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';

/**
 * Tarea programada diaria que guarda las metricas de todas las redes de AK.
 *
 * Corre todos los dias con el cron de Google Cloud Scheduler a las 03:00 de
 * Uruguay. La clave de las tareas la habilita a escribir; si no esta
 * configurada, solo corre si no se guardaron metricas todavia hoy.
 *
 * ## Por que esta protegida
 *
 * Escribe en `daily-social-metrics.json` y puede disparar el backfill historico
 * de Meta. Si cualquiera pudiera llamarla mil veces, llenaria el archivo de
 * entradas duplicadas o consumiria la cuota de la Graph API de Instagram.
 */
export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'metricas-de-redes');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await guardarMetricasDelDia();
    const historialMeta = await syncMetaPublicHistory().catch((error: unknown) => ({
      success: false,
      earliestDate: DEFAULT_EARLIEST_DATE,
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
    const comentariosSincronizados = await syncCommentsFromNetworks({ full: false }).catch((error: unknown) => ({
      success: false,
      totalFetched: 0,
      totalNew: 0,
      totalAutoHidden: 0,
      totalClasificados: 0,
      pendientesDeClasificar: 0,
      platforms: {} as any,
      syncedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'No se pudieron sincronizar los comentarios diarios.',
    }));

    // A public-safe cron can reconcile sources, but never initiate new paid decoration analyses.
    const decoracion = await syncDecorationCatalog().then(async summary => ({
      sources: summary.sources, added: summary.added,
      analysis: puerta.conClave ? await processDecorationDraft() : { processed: false },
    })).catch(() => ({ error: 'No se pudo actualizar la cola de decoracion.' }));

    // Generar revisión diaria con IA y 3 propuestas para hoy
    try {
      const [posts, connections] = await Promise.all([
        readData<any[]>('social-posts.json', []),
        readData<any[]>('social-connections.json', []),
      ]);
      const revision = await buildDigitalPresenceDailyReview({ posts, connections });
      if (revision) {
        await mutarDocumento('presencia-digital-revision.json', revision, () => revision);
      }
    } catch (err) {
      console.warn('[cron-metricas-redes] Error generando revisión diaria:', err);
    }

    const fallaron: string[] = [];
    if (comentariosSincronizados && comentariosSincronizados.success === false) {
      fallaron.push(`comentarios: ${comentariosSincronizados.error || 'falló'}`);
    }

    if (fallaron.length > 0) {
      return NextResponse.json(respuestaDeLaTarea(puerta, {
        ok: false,
        error: fallaron.join(', '),
        historialPublico: {
          meta: historialMeta,
          youtube: historialYouTube,
          otrasRedes: historialOtrasRedes,
        },
        comentarios: comentariosSincronizados,
      }), { status: 500 });
    }

    // Deja constancia de que corrio de verdad. Sin esto no hay forma de saber si
    // una tarea automatica esta funcionando o solo esta escrita.
    await marcarCorrida('metricas-de-redes');

    return NextResponse.json(respuestaDeLaTarea(puerta, {
      ok: true,
      guardado: resultado.guardado,
      fecha: resultado.fecha,
      historialPublico: {
        meta: historialMeta,
        youtube: historialYouTube,
        otrasRedes: historialOtrasRedes,
      },
      comentarios: comentariosSincronizados,
      decoracion,
    }));
  } catch (error: any) {
    console.error('[cron-metricas-redes] No se pudieron guardar los numeros del dia:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'No se pudieron guardar los numeros de las redes.' },
      { status: 500 },
    );
  }
}
