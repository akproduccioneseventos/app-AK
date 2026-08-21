import { NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session-token';

export const runtime = 'nodejs';

export async function POST() {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { runMarketingAutomationFromAdmin } = await import('@/app/actions/marketing-automation');
  const result = await runMarketingAutomationFromAdmin({ force: false });

  /**
   * De paso, se ponen al dia las otras tareas que estaban vencidas: guardar los
   * numeros de las redes y sacar los posteos programados.
   *
   * Mientras el despertador de afuera no este prendido, esas dos no corren nunca.
   * Asi corren cada vez que el equipo trabaja, que no es lo mismo que un reloj
   * pero es infinitamente mejor que nunca.
   *
   * **Los recordatorios de cuota quedan afuera a proposito:** le escriben al
   * cliente, y eso no sale de rebote porque alguien abrio una pantalla.
   *
   * Si falla, no se toca la respuesta: poner al dia una metrica no puede romperle
   * la pantalla a nadie.
   */
  let alDia: unknown;
  try {
    const { ponerAlDiaAlEntrar } = await import('@/lib/automatico/al-entrar-a-la-app');
    alDia = await ponerAlDiaAlEntrar();
  } catch (error) {
    console.warn('[automatico] No se pudieron poner al dia las tareas vencidas.', error);
  }

  return NextResponse.json(
    { ...result, alDia },
    { status: result.success || result.skipped ? 200 : 500 },
  );
}
