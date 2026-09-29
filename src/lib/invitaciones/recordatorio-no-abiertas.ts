import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { hoyEnUruguay } from '@/lib/utils';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import {
  sendGoogleGmailMessage,
  ensureFreshGoogleAccount,
  hasServiceAccountKey,
  getServiceAccountAccessToken,
  GOOGLE_WORKSPACE_SCOPES,
} from '@/lib/google-workspace';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
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

async function getCompanyGmailAccount(): Promise<GoogleWorkspaceAccount | null> {
  const accounts = await readData<GoogleWorkspaceAccount[]>('_google-workspace-accounts.json', []);
  let companyAccount = accounts.find((a) => a.kind === 'company');
  if (!companyAccount && hasServiceAccountKey()) {
    const saToken = await getServiceAccountAccessToken();
    if (saToken) {
      companyAccount = {
        id: 'company',
        kind: 'company',
        email: 'akproduccionessalto@gmail.com',
        calendarId: process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
        accessToken: saToken,
        scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'connected',
      };
    }
  }

  const freshCompany = companyAccount ? await ensureFreshGoogleAccount(companyAccount).catch(() => null) : null;
  if (!freshCompany || freshCompany.status !== 'connected' || !freshCompany.accessToken) {
    return null;
  }
  return freshCompany;
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

  const companyGmailAccount = await getCompanyGmailAccount();
  const apiToken = process.env.META_WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || '';

  for (const fiesta of fiestas) {
    const fechaEvento = fiesta.configuracion?.fechaEvento;
    if (!fechaEvento) continue;

    const fechaEventoStr = fechaEvento.slice(0, 10);
    const [yH, mH, dH] = hoyFechaStr.split('-').map(Number);
    const [yE, mE, dE] = fechaEventoStr.split('-').map(Number);
    if (!yE || !mE || !dE) continue;

    const fechaHoyUru = Date.UTC(yH, mH - 1, dH);
    const fechaEvUru = Date.UTC(yE, mE - 1, dE);
    const diasHastaEvento = Math.round((fechaEvUru - fechaHoyUru) / (1000 * 60 * 60 * 24));

    // Sólo actúa si faltan exactamente 21 o 10 días
    if (diasHastaEvento !== 21 && diasHastaEvento !== 10) continue;

    const invitados = fiesta.invitados || [];
    let hayParaEnviar = false;

    for (const inv of invitados) {
      totalInvitados++;

      // 1. Quien ya abrió su invitación no recibe recordatorio
      if (inv.invitacionAbiertaAt || inv.abrioInvitacion || inv.fechaPrimeraApertura) {
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

      hayParaEnviar = true;
    }

    if (!hayParaEnviar) continue;

    await actualizarFiesta(fiesta.id, async (fiestaFresca) => {
      const invitadosFrescos = fiestaFresca.invitados || [];
      let fiestaCambio = false;

      for (const inv of invitadosFrescos) {
        // 1. Ya abrió la invitación -> no molestar
        if (inv.invitacionAbiertaAt || inv.abrioInvitacion || inv.fechaPrimeraApertura) {
          continue;
        }

        // 2. Ya contestó el RSVP -> no molestar
        if (inv.rsvp === 'Confirmado' || inv.rsvp === 'Rechazado') {
          continue;
        }

        // 3. Sin contacto -> no se puede enviar
        if (!inv.contacto || !inv.contacto.trim()) {
          continue;
        }

        // 4. No repetir el mismo día
        const recordatorios = inv.recordatoriosApertura || [];
        if (recordatorios.includes(hoyFechaStr)) {
          continue;
        }

        // Preparar enlace y mensaje
        const enlace = `https://akproducciones.uy/invitacion/${fiestaFresca.id}/invitado/${inv.id}?token=${inv.guestAccessToken || ''}`;
        const nombreEvento = fiestaFresca.configuracion.nombreEvento || 'la fiesta';
        const mensajeTexto = `¡Hola ${inv.nombre}! Te recordamos acceder a tu invitación digital para ${nombreEvento}. Podés ver los detalles del evento y confirmar tu asistencia acá: ${enlace}`;

        const contactoLimpio = inv.contacto.trim();
        let envioExitoso = false;

        if (contactoLimpio.includes('@')) {
          // Enviar por Gmail
          if (companyGmailAccount) {
            try {
              const resGmail = await sendGoogleGmailMessage(
                companyGmailAccount,
                contactoLimpio,
                `Invitación para ${nombreEvento} - AK Producciones`,
                `<p>${mensajeTexto}</p><p><a href="${enlace}">Abrir Invitación</a></p>`,
              );
              envioExitoso = Boolean(resGmail?.id || (resGmail as any)?.enviado);
            } catch {
              envioExitoso = false;
            }
          } else {
            envioExitoso = false;
          }

          if (!envioExitoso) {
            const resAgendar = await saveScheduledMessage(
              {
                targetType: 'cliente',
                targetId: fiestaFresca.id,
                targetName: inv.nombre,
                targetPhone: contactoLimpio,
                templateType: 'personalizado',
                messageText: mensajeTexto,
                scheduledAt: ahora.toISOString(),
                status: 'pendiente',
                sendingMode: 'manual_click',
                fiestaId: fiestaFresca.id,
              },
              WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
            );
            if (!resAgendar?.success) {
              console.warn(`[recordatorio] No se pudo agendar contingencia: ${resAgendar?.error}`);
            }
            fallados++;
          }
        } else {
          // Enviar por WhatsApp
          if (apiToken && phoneNumberId) {
            try {
              const resWa = await sendMetaWhatsAppMessage({
                to: contactoLimpio,
                text: mensajeTexto,
                apiToken,
                phoneNumberId,
              });
              if (resWa?.success) {
                envioExitoso = true;
              } else {
                const resAgendarWa = await saveScheduledMessage(
                  {
                    targetType: 'cliente',
                    targetId: fiestaFresca.id,
                    targetName: inv.nombre,
                    targetPhone: contactoLimpio,
                    templateType: 'personalizado',
                    messageText: mensajeTexto,
                    scheduledAt: ahora.toISOString(),
                    status: 'pendiente',
                    sendingMode: 'manual_click',
                    fiestaId: fiestaFresca.id,
                  },
                  WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
                );
                if (!resAgendarWa?.success) {
                  console.warn(`[recordatorio] No se pudo agendar contingencia WhatsApp: ${resAgendarWa?.error}`);
                }
                fallados++;
              }
            } catch {
              const resAgendarCatch = await saveScheduledMessage(
                {
                  targetType: 'cliente',
                  targetId: fiestaFresca.id,
                  targetName: inv.nombre,
                  targetPhone: contactoLimpio,
                  templateType: 'personalizado',
                  messageText: mensajeTexto,
                  scheduledAt: ahora.toISOString(),
                  status: 'pendiente',
                  sendingMode: 'manual_click',
                  fiestaId: fiestaFresca.id,
                },
                WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
              );
              if (!resAgendarCatch?.success) {
                console.warn(`[recordatorio] No se pudo agendar contingencia catch: ${resAgendarCatch?.error}`);
              }
              fallados++;
            }
          } else {
            const resAgendarSinApi = await saveScheduledMessage(
              {
                targetType: 'cliente',
                targetId: fiestaFresca.id,
                targetName: inv.nombre,
                targetPhone: contactoLimpio,
                templateType: 'personalizado',
                messageText: mensajeTexto,
                scheduledAt: ahora.toISOString(),
                status: 'pendiente',
                sendingMode: 'manual_click',
                fiestaId: fiestaFresca.id,
              },
              WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
            );
            if (!resAgendarSinApi?.success) {
              console.warn(`[recordatorio] No se pudo agendar contingencia sin API: ${resAgendarSinApi?.error}`);
            }
            fallados++;
          }
        }

        if (envioExitoso) {
          inv.recordatoriosApertura = [...recordatorios, hoyFechaStr];
          enviados++;
          fiestaCambio = true;
        }
      }

      return fiestaCambio ? fiestaFresca : fiestaFresca;
    }, { publicRsvp: true });
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
