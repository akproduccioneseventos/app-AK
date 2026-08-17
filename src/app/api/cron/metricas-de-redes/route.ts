import { NextResponse } from 'next/server';
import { guardarMetricasDelDia } from '@/lib/presencia-digital/guardado-diario';

/**
 * Guarda los numeros de las redes, una vez por dia.
 *
 * Por que existe: las plataformas **no entregan los numeros viejos hacia atras**.
 * Lo que no se guarda hoy se pierde para siempre. Antes esto sólo pasaba cuando
 * alguien abria la pantalla de presencia digital: una semana sin entrar era una
 * semana de historia que no se recuperaba nunca.
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

    return NextResponse.json({
      ok: true,
      guardado: resultado.guardado,
      fecha: resultado.fecha,
    });
  } catch (error: any) {
    console.error('[cron-metricas-redes] No se pudieron guardar los numeros del dia:', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudieron guardar los numeros de las redes.' },
      { status: 500 },
    );
  }
}
