import { NextResponse } from 'next/server';
import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';
import { marcarToqueDespertador } from '@/lib/automatico/tareas-automaticas';
import { clavesIguales } from '@/lib/security/claves-iguales';

export const dynamic = 'force-dynamic';

/**
 * Tareas automáticas incluidas y despachadas periódicamente:
 * - 'generate-blog-post' (publicación de notas de blog y SEO)
 * - 'metricas-de-redes'
 * - 'publicar-programados'
 * - 'recordatorios-de-pago'
 * - 'posicionamiento-diario'
 */
const TAREAS_CRON_DESPACHADAS = [
  'generate-blog-post',
  'metricas-de-redes',
  'publicar-programados',
  'recordatorios-de-pago',
  'posicionamiento-diario',
] as const;

function verificarClave(request: Request): { autorizado: boolean; conClave: boolean; status?: number; error?: string } {
  const cronSecret = process.env.CRON_SECRET || process.env.TAREAS_SECRET;
  if (!cronSecret) {
    // Orden 278, bloque 1, pendiente: sin clave sólo corren las tareas que no mandan ni borran (Orden 365).
    return { autorizado: true, conClave: false };
  }

  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')?.trim();
  const url = new URL(request.url);
  const authQuery = url.searchParams.get('key') || url.searchParams.get('secret') || url.searchParams.get('clave');

  if (clavesIguales(authHeader, cronSecret) || clavesIguales(authQuery, cronSecret)) {
    return { autorizado: true, conClave: true };
  }

  return { autorizado: false, conClave: false, status: 401, error: 'No autorizado' };
}

export async function GET(request: Request) {
  return handleDespacho(request);
}

export async function POST(request: Request) {
  return handleDespacho(request);
}

async function handleDespacho(request: Request) {
  const auth = verificarClave(request);
  if (!auth.autorizado) {
    return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: auth.status || 401 });
  }

  let origen: OrigenDisparo = 'despertador';
  try {
    const url = new URL(request.url);
    const paramOrigen = url.searchParams.get('origen');
    if (paramOrigen === 'visita' || paramOrigen === 'app' || paramOrigen === 'manual') {
      origen = paramOrigen;
    } else if (request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (body?.origen && ['despertador', 'visita', 'app', 'manual'].includes(body.origen)) {
        origen = body.origen;
      }
    }
  } catch {
    // Si no viene cuerpo o falla la lectura, origen queda en 'despertador'
  }

  if (origen === 'despertador') {
    await marcarToqueDespertador(new Date());
  }

  const resultado = await ponerAlDiaAlEntrar(new Date(), origen, {
    soloLasQueNoMandan: !auth.conClave,
  });

  return NextResponse.json({
    ok: true,
    origen,
    despachadas: TAREAS_CRON_DESPACHADAS,
    ...resultado,
  });
}
