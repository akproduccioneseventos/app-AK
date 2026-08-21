import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { procesarPosteosProgramados } from '@/lib/presencia-digital/publicador';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';

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
    const puerta = await abrirPuertaDeLaTarea(request, 'publicar-programados');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const resultado = await procesarPosteosProgramados();
    // Deja constancia de que corrio de verdad. Sin esto no hay forma de saber si
    // una tarea automatica esta funcionando o solo esta escrita.
    await marcarCorrida('publicar-programados');

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('[cron-publicar-programados] Error ejecutando tarea:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar publicaciones programadas' },
      { status: 500 }
    );
  }
}
