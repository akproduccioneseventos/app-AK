import { NextResponse } from 'next/server';
import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';
import { marcarToqueDespertador } from '@/lib/automatico/tareas-automaticas';

export const dynamic = 'force-dynamic';

function verificarClave(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.TAREAS_SECRET;
  if (!cronSecret) return true; // Sin clave configurada, opera con freno de concurrencia

  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')?.trim();
  const url = new URL(request.url);
  const authQuery = url.searchParams.get('key') || url.searchParams.get('secret');

  return authHeader === cronSecret || authQuery === cronSecret;
}

export async function GET(request: Request) {
  return handleDespacho(request);
}

export async function POST(request: Request) {
  return handleDespacho(request);
}

async function handleDespacho(request: Request) {
  if (!verificarClave(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

  const resultado = await ponerAlDiaAlEntrar(new Date(), origen);

  return NextResponse.json({
    ok: true,
    origen,
    ...resultado,
  });
}

