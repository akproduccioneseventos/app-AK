import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { hoyEnUruguay } from '@/lib/utils';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { sendGoogleGmailMessage } from '@/lib/google-workspace';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

const FIESTAS_FILE = 'fiestas.json';
const AJUSTES_FILE = 'ajustes-recordatorio-invitacion.json';

export interface AjustesRecordatorioInvitacion {
  activo: boolean;
  actualizadoAt?: string;
}

const AJUSTES_DEFAULT: AjustesRecordatorioInvitacion = {
  activo: true, // Prendido de fábrica por pedido expreso del dueño
};

export async function getAjustesRecordatorioInvitacion(): Promise<AjustesRecordatorioInvitacion> {
  const guardados = await readData<AjustesRecordatorioInvitacion>(AJUSTES_FILE, AJUSTES_DEFAULT);
  return { ...guardados, activo: guardados?.activo !== false };
}

export async function setAjustesRecordatorioInvitacion(
  activo: boolean,
): Promise<AjustesRecordatorioInvitacion> {
  const ajustes: AjustesRecordatorioInvitacion = {
    activo,
    actualizadoAt: new Date().toISOString(),
  };
  await writeData(AJUSTES_FILE, ajustes);
  return ajustes;
}

export interface ResultadoRecordatorioInvitacion {
  corrio: boolean;
  motivo?: string;
  totalFiestas: number;
  totalInvitadosEvaluados: number;
  enviados: number;
  fallados: number;
  omitidos: number;
}

/**
 * Tarea diaria automática: recordar invitación a quienes no la abrieron ni contestaron RSVP
 * a los 21 y 10 días antes de la fiesta.
 */
export async function correrTareaRecordarInvitacionNoAbierta(
  ahora: Date = new Date(),
): Promise<ResultadoRecordatorioInvitacion> {
  const vacio: ResultadoRecordatorioInvitacion = {
    corrio: false,
    totalFiestas: 0,
    totalInvitadosEvaluados: 0,
    enviados: 0,
    fallados: 0,
    omitidos: 0,
  };

  const ajustes = await getAjustesRecordatorioInvitacion();
  if (!ajustes.activo) {
    return { ...vacio, motivo: 'tarea apagada en ajustes' };
  }

  const fiestas = await readData<FiestaEnPlanificacion[]>(FIESTAS_FILE, []);
  if (!fiestas || fiestas.length === 0) {
    return { ...vacio, corrio: true, motivo: 'no hay fiestas' };
  }

  const hoyFechaStr = hoyEnUruguay(ahora);
  const ahoraMs = ahora.getTime();
  let totalInvitados = 0;
  let enviados = 0;
  let fallados = 0;
  let omitidos = 0;
  let fiestasModificadas = false;

  for (const fiesta of fiestas) {
    if (!fiesta.configuracion?.fechaEvento) continue;

    const fechaEvento = new Date(fiesta.configuracion.fechaEvento);
    if (isNaN(fechaEvento.getTime())) continue;

    // Calcular días faltantes redondeando a días completos
    const diffDias = Math.round(
      (fechaEvento.getTime() - ahoraMs) / (24 * 60 * 60 * 1000),
    );

    // Solo se dispara a 21 y 10 días
    if (diffDias !== 21 && diffDias !== 10) {
      continue;
    }

    const invitados = fiesta.invitados || [];
    let fiestaCambio = false;

    for (const inv of invitados) {
      totalInvitados++;

      // 1. Quien ya abrió su invitación no recibe recordatorio
      if (inv.invitacionAbiertaAt) {
        omitidos++;
        continue;
      }

      // 2. Quien ya respondió RSVP (Confirmado o Rechazado) no recibe recordatorio
      if (inv.rsvp === 'Confirmado' || inv.rsvp === 'Rechazado') {
        omitidos++;
        continue;
      }

      // 3. Sin contacto no se puede enviar
      if (!inv.contacto || !inv.contacto.trim()) {
        omitidos++;
        continue;
      }

      // 4. No repetir el mismo día
      const recordatorios = inv.recordatoriosApertura || [];
      if (recordatorios.includes(hoyFechaStr)) {
        omitidos++;
        continue;
      }

      // Preparar enlace y mensaje
      const enlace = `https://akproducciones.uy/invitacion/${fiesta.id}/invitado/${inv.id}?token=${inv.guestAccessToken || ''}`;
      const nombreEvento = fiesta.configuracion.nombreEvento || 'la fiesta';
      const mensajeTexto = `¡Hola ${inv.nombre}! Te recordamos acceder a tu invitación digital para ${nombreEvento}. Podés ver los detalles del evento y confirmar tu asistencia acá: ${enlace}`;

      const contactoLimpio = inv.contacto.trim();
      let envioExitoso = false;

      if (contactoLimpio.includes('@')) {
        // Enviar por Gmail
        try {
          const resGmail: any = await (sendGoogleGmailMessage as any)({
            to: contactoLimpio,
            subject: `Invitación para ${nombreEvento} - AK Producciones`,
            text: mensajeTexto,
            html: `<p>${mensajeTexto}</p><p><a href="${enlace}">Abrir Invitación</a></p>`,
          });
          envioExitoso = Boolean(resGmail?.enviado);
        } catch {
          envioExitoso = false;
        }
      } else {
        // Enviar por WhatsApp
        try {
          const resWa: any = await (sendMetaWhatsAppMessage as any)({
            phone: contactoLimpio,
            to: contactoLimpio,
            text: mensajeTexto,
            message: mensajeTexto,
            apiToken: process.env.META_WHATSAPP_TOKEN || '',
            phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
          });
          if (resWa?.success) {
            envioExitoso = true;
          } else {
            // Dejar preparado en la bandeja con manual_click
            await saveScheduledMessage(
              {
                targetType: 'cliente',
                targetId: fiesta.id,
                targetName: inv.nombre,
                targetPhone: contactoLimpio,
                templateType: 'personalizado',
                messageText: mensajeTexto,
                scheduledAt: ahora.toISOString(),
                status: 'pendiente',
                sendingMode: 'manual_click',
                fiestaId: fiesta.id,
              },
              WHATSAPP_AUTOMATION_INTERNAL_TOKEN
            );
            fallados++;
          }
        } catch {
          await saveScheduledMessage(
            {
              targetType: 'cliente',
              targetId: fiesta.id,
              targetName: inv.nombre,
              targetPhone: contactoLimpio,
              templateType: 'personalizado',
              messageText: mensajeTexto,
              scheduledAt: ahora.toISOString(),
              status: 'pendiente',
              sendingMode: 'manual_click',
              fiestaId: fiesta.id,
            },
            WHATSAPP_AUTOMATION_INTERNAL_TOKEN
          );
          fallados++;
        }
      }

      if (envioExitoso) {
        inv.recordatoriosApertura = [...recordatorios, hoyFechaStr];
        enviados++;
        fiestaCambio = true;
      }
    }

    if (fiestaCambio) {
      fiestasModificadas = true;
    }
  }

  if (fiestasModificadas) {
    await writeData(FIESTAS_FILE, fiestas);
  }

  return {
    corrio: true,
    totalFiestas: fiestas.length,
    totalInvitadosEvaluados: totalInvitados,
    enviados,
    fallados,
    omitidos,
  };
}
