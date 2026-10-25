import { diasHastaEnUruguay } from '@/lib/utils';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

export async function correrTareaRecordatorioInvitados(): Promise<{
  ok: boolean;
  mensajesPreparados: number;
  errores: string[];
}> {
  const fiestas = await leerFiestasCrudas();

  let mensajesPreparados = 0;
  const errores: string[] = [];

  for (const fiesta of fiestas) {
    const fechaStr = fiesta.configuracion?.fechaEvento;
    if (!fechaStr) continue;

    // Dias de calendario de Uruguay: el servidor corre en hora de Greenwich y desde las 21:00
    // de Uruguay ya era "mañana", asi que el recordatorio salia un dia antes o despues.
    const diffDias = diasHastaEnUruguay(fechaStr.split('T')[0]);

    // Recordarle al invitado: dos días antes y el mismo día
    if (diffDias === 2 || diffDias === 0) {
      const invitados = fiesta.invitados || [];
      const confirmados = invitados.filter((inv) => inv.rsvp === 'Confirmado');

      for (const inv of confirmados) {
        const tel = inv.contacto;
        if (!String(tel ?? '').replace(/\D/g, '')) continue;

        const nombreFiesta = fiesta.configuracion?.nombreEvento || 'la fiesta';
        const momento = diffDias === 0 ? '¡Hoy es el gran día!' : 'Faltan solo 2 días para';
        const hora = fiesta.configuracion?.horaInicio || '21:00';
        const lugar = fiesta.configuracion?.nombreLugar || 'Salón de Eventos';
        const mesa = inv.tableNumber ? ` Mesa asignada: ${inv.tableNumber}.` : '';
        const link = `https://akproducciones.uy/portal-invitado/${fiesta.id}/${inv.id}`;

        const texto = `Hola ${inv.nombre}! ${momento} ${nombreFiesta}. Te esperamos a las ${hora} hs en ${lugar}.${mesa} Podés ver todos los detalles de tu invitación acá: ${link}`;

        const saveRes = await saveScheduledMessage(
          {
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
          },
          WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
          {
            idEstable: `recordatorio_invitado_${fiesta.id}_${inv.id}_${diffDias === 0 ? 'hoy' : 'dos-dias'}_${fechaStr.split('T')[0]}`,
          }
        );

        if (saveRes.success) {
          if (!saveRes.yaExistia) mensajesPreparados++;
        } else {
          errores.push(`${inv.nombre}: ${saveRes.error || 'no se pudo guardar el recordatorio'}`);
        }
      }
    }
  }

  const ok = errores.length === 0;
  if (ok) await marcarCorrida('recordatorio-a-los-invitados');

  return { ok, mensajesPreparados, errores };
}
