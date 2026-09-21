import { NextResponse } from 'next/server';
import { marcarToqueDespertador } from '@/lib/automatico/tareas-automaticas';

/**
 * LA PUERTA QUE SOLO DESPIERTA, Y CONTESTA EN EL ACTO.
 *
 * **Por que existe (15 de septiembre de 2026):** el dueno tenia un despertador de afuera
 * -un servicio gratuito- golpeando `/api/cron-despachador` cada tanto. **Ese servicio lo
 * dio de baja por errores.** Y el motivo esta a la vista en el codigo: el despachador
 * **no contesta hasta terminar TODAS las tareas** -metricas, publicaciones programadas,
 * una nota de blog con inteligencia artificial, los recordatorios de cuota-. Si ademas el
 * servidor estaba dormido, sumaba la despertada. Un servicio de afuera corta a los treinta
 * segundos y lo anota como fallo; a los pocos fallos, da de baja el aviso.
 *
 * Esta puerta hace **una sola cosa y rapido**: deja constancia de que tocaron y contesta.
 * No corre ninguna tarea, asi que no puede tardar por culpa del trabajo.
 *
 * **Y por que no corre las tareas aca:** en este hosting el servidor deja de tener maquina
 * apenas contesta. Si se contestara primero y se trabajara despues, las tareas quedarian
 * cortadas por la mitad **sin que nadie se entere**, que es peor que no correrlas. El
 * trabajo sigue donde tiene paciencia: el despertador de Google (dos minutos de espera) y
 * las visitas a la web.
 */

export const dynamic = 'force-dynamic';

function clavePermitida(request: Request): boolean {
  const clave = process.env.CRON_SECRET || process.env.TAREAS_SECRET;
  if (!clave) return true;
  const enCabecera = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')?.trim();
  const url = new URL(request.url);
  const enDireccion = url.searchParams.get('key') || url.searchParams.get('secret');
  return enCabecera === clave || enDireccion === clave;
}

async function despertar(request: Request) {
  if (!clavePermitida(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Si esto llegara a fallar, igual se contesta que si: el que toca la puerta solo
  // necesita saber que el servidor esta despierto, y un error aca lo daria de baja.
  const quedoAnotado = await marcarToqueDespertador(new Date())
    .then(() => true)
    .catch(() => false);

  return NextResponse.json({ ok: true, despierto: true, quedoAnotado });
}

export async function GET(request: Request) {
  return despertar(request);
}

export async function POST(request: Request) {
  return despertar(request);
}
