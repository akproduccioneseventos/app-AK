import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

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
    const errores: string[] = [];

    for (const fiesta of fiestas) {
      const fechaStr = fiesta.configuracion?.fechaEvento;
      if (!fechaStr) continue;

      const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
      const fechaFiesta = new Date(y, m - 1, d);
      fechaFiesta.setHours(0, 0, 0, 0);

      const diffDias = Math.round((fechaFiesta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Recordarle al invitado: dos días antes y el mismo día
      if (diffDias === 2 || diffDias === 0) {
        // La fiesta cruda ya trae los invitados: no se pasa por la accion `getInvitados`,
        // que pide sesion del equipo y esta tarea no la tiene.
        const invitados = fiesta.invitados || [];
        const confirmados = invitados.filter(inv => inv.rsvp === 'Confirmado');

        for (const inv of confirmados) {
          const tel = inv.contacto;
          // Sin un número de verdad no hay a quién recordarle: se saltea, no es una falla.
          if (!String(tel ?? '').replace(/\D/g, '')) continue;

          const nombreFiesta = fiesta.configuracion?.nombreEvento || 'la fiesta';
          const momento = diffDias === 0 ? '¡Hoy es el gran día!' : 'Faltan solo 2 días para';
          const hora = fiesta.configuracion?.horaInicio || '21:00';
          const lugar = fiesta.configuracion?.nombreLugar || 'Salón de Eventos';
          const mesa = inv.tableNumber ? ` Mesa asignada: ${inv.tableNumber}.` : '';
          const link = `https://akproducciones.uy/portal-invitado/${fiesta.id}/${inv.id}`;

          const texto = `Hola ${inv.nombre}! ${momento} ${nombreFiesta}. Te esperamos a las ${hora} hs en ${lugar}.${mesa} Podés ver todos los detalles de tu invitación acá: ${link}`;

          const saveRes = await saveScheduledMessage({
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
          }, WHATSAPP_AUTOMATION_INTERNAL_TOKEN, {
            // Uno por invitado, por momento y por día: dos corridas el mismo día no lo repiten.
            idEstable: `recordatorio_invitado_${fiesta.id}_${inv.id}_${diffDias === 0 ? 'hoy' : 'dos-dias'}_${fechaStr.split('T')[0]}`,
          });

          // Sin la llave interna, guardar pedia sesion del equipo y fallaba siempre; la tarea
          // igual contestaba "ok" y se anotaba corrida (Codex, auditoria 81).
          if (saveRes.success) {
            if (!saveRes.yaExistia) mensajesPreparados++;
          } else {
            errores.push(`${inv.nombre}: ${saveRes.error || 'no se pudo guardar el recordatorio'}`);
          }
        }
      }
    }

    // Deja constancia de que corrió de verdad, sólo si no falló ningún recordatorio.
    const ok = errores.length === 0;
    if (ok) await marcarCorrida('recordatorio-a-los-invitados');

    return NextResponse.json({
      ok,
      mensajesPreparados,
      errores,
    }, { status: ok ? 200 : 500 });
  } catch (error: any) {
    console.error('[cron-recordatorio-invitados] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar recordatorios a los invitados' },
      { status: 500 }
    );
  }
}
