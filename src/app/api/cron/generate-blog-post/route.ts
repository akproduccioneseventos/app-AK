import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea, respuestaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { runMarketingAutomation } from '@/lib/marketing-automation';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puerta = await abrirPuertaDeLaTarea(request, 'generate-blog-post');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const result = await runMarketingAutomation({
      source: 'cron',
      force: searchParams.get('force') === '1',
    });

    const fallo = !result.success || Boolean(result.seoError) || result.seoSucceeded === false || Boolean(result.error);
    if (fallo) {
      return NextResponse.json(
        respuestaDeLaTarea(puerta, {
          ok: false,
          error: result.seoError || result.error || 'No se pudo publicar la nota del blog.',
          result,
        }),
        { status: 500 }
      );
    }

    // Deja constancia de que corrio de verdad. Sin esto no hay forma de saber si
    // una tarea automatica esta funcionando o solo esta escrita.
    await marcarCorrida('generate-blog-post');

    return NextResponse.json(respuestaDeLaTarea(puerta, { ok: true, ...result }));
  } catch (error: any) {
    console.error('[cron-blog] Error running blog generation cron:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Ocurrio un error inesperado al correr el cron de IA.' },
      { status: 500 }
    );
  }
}
