import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';
import { publishPostInternal } from '@/app/actions/presencia-digital';

const POSTS_FILE = 'social-posts.json';
const MAX_POR_CORRIDA_DEFAULT = 3;

export interface CronPublicarResult {
  ok: boolean;
  totalPendientes: number;
  procesados: number;
  publicados: string[];
  listosParaCopiar: string[];
  fallados: Array<{ id: string; error: string }>;
  omitidosPorTope: number;
}

/**
 * Función principal que procesa la cola de posteos programados.
 * Es exportada para permitir pruebas unitarias directas sin depender de HTTP.
 *
 * Reglas de negocio:
 * 1. Solo procesa posteos con status 'Programado' cuya publishDate ya haya pasado (<= ahora).
 * 2. Tope de 3 por corrida: si el servidor estuvo caído, no vacía la cola de golpe para no saturar las redes.
 * 3. Máximo 3 intentos por posteo; si falla 3 veces queda marcado como 'Falló'.
 * 4. Las redes manuales (TikTok, Threads, X, WhatsApp) se marcan como 'Listo para copiar'.
 */
export async function procesarPosteosProgramados(
  maxPorCorrida = MAX_POR_CORRIDA_DEFAULT,
  ahora = new Date()
): Promise<CronPublicarResult> {
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const ahoraTime = ahora.getTime();

  // Filtrar posteos programados cuya fecha ya venció
  const programadosVencidos = posts.filter((p) => {
    if (p.status !== 'Programado') return false;
    if (!p.publishDate) return false;
    const pubTime = new Date(p.publishDate).getTime();
    return !Number.isNaN(pubTime) && pubTime <= ahoraTime;
  });

  // Ordenar los más viejos primero para respetar el orden cronológico
  programadosVencidos.sort(
    (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  const aProcesar = programadosVencidos.slice(0, maxPorCorrida);
  const omitidosPorTope = Math.max(0, programadosVencidos.length - maxPorCorrida);

  const publicados: string[] = [];
  const listosParaCopiar: string[] = [];
  const fallados: Array<{ id: string; error: string }> = [];

  for (const post of aProcesar) {
    const res = await publishPostInternal(post.id);

    if (res.success) {
      if (res.readyForManualCopy) {
        listosParaCopiar.push(post.id);
      } else {
        publicados.push(post.id);
      }
    } else {
      fallados.push({
        id: post.id,
        error: res.error || 'Error al procesar la publicación programada',
      });
    }
  }

  return {
    ok: true,
    totalPendientes: programadosVencidos.length,
    procesados: aProcesar.length,
    publicados,
    listosParaCopiar,
    fallados,
    omitidosPorTope,
  };
}

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
        { error: 'CRON_SECRET no está configurado: la tarea de publicación programada no corre.' },
        { status: 503 }
      );
    }

    if (clave !== claveEsperada) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultado = await procesarPosteosProgramados();
    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('[cron-publicar-programados] Error ejecutando tarea:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar publicaciones programadas' },
      { status: 500 }
    );
  }
}
