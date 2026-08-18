import { NextResponse } from 'next/server';
import { procesarPosteosProgramados } from '@/lib/presencia-digital/publicador';

/**
 * Saca los posteos que el dueno dejo programados y ya les llego la hora.
 *
 * La logica vive en `src/lib/presencia-digital/publicador.ts`: una tarea
 * programada no tiene sesion, asi que no puede colgar de una accion.
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
        { error: 'CRON_SECRET no esta configurado: la tarea de publicacion programada no corre.' },
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
