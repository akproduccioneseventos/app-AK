import { NextResponse } from 'next/server';
import { procesarPosteosProgramados } from '@/lib/presencia-digital/programador-posteos';

/**
 * Tarea programada que publica posteos cuya fecha ya haya llegado (Bloque 1).
 *
 * Se ejecuta automáticamente con CRON_SECRET.
 * Respeta tope por corrida (máximo 3), gestiona reintentos y marca 'Listo para copiar'
 * para redes no automatizables.
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
        { error: 'CRON_SECRET no está configurado: la tarea no corre.' },
        { status: 503 },
      );
    }

    if (clave !== claveEsperada) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultado = await procesarPosteosProgramados();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      resultado,
    });
  } catch (error: any) {
    console.error('[cron-publicaciones-programadas] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error procesando publicaciones programadas.' },
      { status: 500 },
    );
  }
}
