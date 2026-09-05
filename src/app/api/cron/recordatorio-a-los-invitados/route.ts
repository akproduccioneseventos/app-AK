import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { getInvitados } from '@/app/actions/fiesta/invitados.actions';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';

export async function GET(request: Request) {
  return correrTarea(request);
}

export async function POST(request: Request) {
  return correrTarea(request);
}

async function correrTarea(request: Request) {
  try {
    const puerta = await abrirPuertaDeLaTarea(request, 'recordatorio-a-los-invitados');
    if (!puerta.permitido) {
      return NextResponse.json({ error: puerta.mensaje }, { status: puerta.estado ?? 401 });
    }

    const fiestas = await leerFiestasCrudas();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let mensajesPreparados = 0;

    for (const fiesta of fiestas) {
      const fechaStr = fiesta.configuracion?.fechaEvento;
      if (!fechaStr) continue;

      const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
      const fechaFiesta = new Date(y, m - 1, d);
      fechaFiesta.setHours(0, 0, 0, 0);

      const diffDias = Math.round((fechaFiesta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Recordarle al invitado: dos días antes y el mismo día
      if (diffDias === 2 || diffDias === 0) {
        const invitados = await getInvitados(fiesta.id);
        const confirmados = invitados.filter(inv => inv.rsvp === 'Confirmado');

        for (const inv of confirmados) {
          const tel = inv.contacto;
          if (!tel) continue;

          const nombreFiesta = fiesta.configuracion?.nombreEvento || 'la fiesta';
          const momento = diffDias === 0 ? '¡Hoy es el gran día!' : 'Faltan solo 2 días para';
          const hora = fiesta.configuracion?.horaInicio || '21:00';
          const lugar = fiesta.configuracion?.nombreLugar || 'Salón de Eventos';
          const mesa = inv.tableNumber ? ` Mesa asignada: ${inv.tableNumber}.` : '';
          const link = `https://akproducciones.uy/portal-invitado/${fiesta.id}/${inv.id}`;

          const texto = `Hola ${inv.nombre}! ${momento} ${nombreFiesta}. Te esperamos a las ${hora} hs en ${lugar}.${mesa} Podés ver todos los detalles de tu invitación acá: ${link}`;

          await saveScheduledMessage({
            targetType: 'cliente',
            targetId: inv.id,
            targetName: inv.nombre,
            targetPhone: tel,
            templateType: 'personalizado',
            messageText: texto,
            scheduledAt: new Date().toISOString(),
            status: 'pendiente',
            sendingMode: 'manual_click',
            fiestaId: fiesta.id,
          });

          mensajesPreparados++;
        }
      }
    }

    // Deja constancia de que corrió de verdad
    await marcarCorrida('recordatorio-a-los-invitados');

    return NextResponse.json({
      ok: true,
      mensajesPreparados,
    });
  } catch (error: any) {
    console.error('[cron-recordatorio-invitados] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar recordatorios a los invitados' },
      { status: 500 }
    );
  }
}
