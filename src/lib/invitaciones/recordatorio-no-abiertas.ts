import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { hoyEnUruguay, diasHastaEnUruguay } from '@/lib/utils';
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


export function tocaRecordarHoy(
  fechaEvento: string | Date | undefined | null,
  ahora: Date = new Date(),
): boolean {
  if (!fechaEvento) return false;
  let dias: number;
  if (typeof diasHastaEnUruguay === 'function') {
    dias = diasHastaEnUruguay(fechaEvento, ahora);
  } else {
    const fEvento = typeof fechaEvento === 'string' ? fechaEvento.split('T')[0] : fechaEvento.toISOString().split('T')[0];
    const fAhora = ahora.toISOString().split('T')[0];
    const dEvento = new Date(fEvento + 'T12:00:00Z').getTime();
    const dAhora = new Date(fAhora + 'T12:00:00Z').getTime();
    dias = Math.round((dEvento - dAhora) / (1000 * 60 * 60 * 24));
  }
  return dias === 21 || dias === 10;
}

export async function liberarReservaDelDia(
  fiestaId: string,
  invitadoId: string,
  hoyFechaStr: string,
  opciones?: { revisarEnvio?: boolean },
): Promise<boolean> {
  const res = await actualizarFiesta(
    fiestaId,
    async (fiesta) => {
      const inv = (fiesta.invitados || []).find((i) => i.id === invitadoId);
      if (!inv) return fiesta;
      if (opciones?.revisarEnvio) {
        (inv as any).revisarEnvio = true;
      } else {
        inv.recordatoriosApertura = (inv.recordatoriosApertura || []).filter((d) => d !== hoyFechaStr);
      }
      return fiesta;
    },
    { publicRsvp: true },
  );
  return Boolean(res?.success);
}

function esRechazoConocido(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.statusCode || error.response?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return true;
  }
  const msg = String(error.message || error);
  if (/HTTP\s*4\d\d|403|400|401|404|422|REJECTED|rejected/i.test(msg)) {
    return true;
  }
  return false;
}

export interface ResultadoRecordatorioInvitacion {
  corrio: boolean;
  motivo?: string;
  totalFiestas: number;
  totalInvitadosEvaluados: number;
  enviados: number;
  fallados: number;
  omitidos: number;
  reservasFallidas?: number;
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
  let reservasFallidas = 0;

  const companyGmailAccount = await getCompanyGmailAccount();
  const apiToken = process.env.META_WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || '';

  for (const fiesta of fiestas) {
    const fechaEvento = fiesta.configuracion?.fechaEvento;
    if (!fechaEvento) continue;

    if (!tocaRecordarHoy(fechaEvento, ahora)) continue;

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

    // Fase 1 (adentro de la transaccion, que la base puede repetir): sólo se ELIGE a quién
    // y se RESERVA el día. Nada sale hacia afuera acá: un reintento de la transacción
    // mandaría el mismo correo o WhatsApp otra vez. La lista se reinicia en cada pasada.
    let elegidos: Array<{ inv: Invitado; nombreEventoFresco: string }> = [];
    const fiestaId = fiesta.id;

    const reserva = await actualizarFiesta(fiesta.id, async (fiestaFresca) => {
      elegidos = [];
      if (!tocaRecordarHoy(fiestaFresca.configuracion?.fechaEvento, ahora)) {
        return fiestaFresca;
      }
      const invitadosFrescos = fiestaFresca.invitados || [];
      const nombreEventoFresco = fiestaFresca.configuracion.nombreEvento || 'la fiesta';

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

        // Reserva: queda anotado hoy, así nadie más lo elige.
        inv.recordatoriosApertura = [...recordatorios, hoyFechaStr];
        elegidos.push({ inv: { ...inv }, nombreEventoFresco });
      }

      return fiestaFresca;
    }, { publicRsvp: true });

    // Si la reserva no se guardó, no se manda nada: no hay constancia de que quedó anotado.
    if (reserva && reserva.success === false) {
      reservasFallidas++;
      continue;
    }

    // Fase 2 (afuera de la transaccion): el envío real.
    for (const { inv, nombreEventoFresco } of elegidos) {
      // Preparar enlace y mensaje
      const enlace = `https://akproducciones.uy/invitacion/${fiestaId}/invitado/${inv.id}?token=${inv.guestAccessToken || ''}`;
      const nombreEvento = nombreEventoFresco;
      const mensajeTexto = `¡Hola ${inv.nombre}! Te recordamos acceder a tu invitación digital para ${nombreEvento}. Podés ver los detalles del evento y confirmar tu asistencia acá: ${enlace}`;

      const contactoLimpio = (inv.contacto || '').trim();
      let envioExitoso = false;
      let proveedorError: any = null;

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
          } catch (err) {
            proveedorError = err;
            envioExitoso = false;
          }
        } else {
          envioExitoso = false;
          proveedorError = new Error('No hay cuenta de correo conectada');
        }

        if (!envioExitoso) {
          const resAgendar = await saveScheduledMessage(
            {
              targetType: 'cliente',
              targetId: fiestaId,
              targetName: inv.nombre,
              targetPhone: contactoLimpio,
              templateType: 'personalizado',
              messageText: mensajeTexto,
              scheduledAt: ahora.toISOString(),
              status: 'pendiente',
              sendingMode: 'manual_click',
              fiestaId: fiestaId,
            },
            WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
          );
          if (!resAgendar?.success) {
            console.warn(`[recordatorio] No se pudo agendar contingencia: ${resAgendar?.error}`);
            if (esRechazoConocido(proveedorError)) {
              await liberarReservaDelDia(fiestaId, inv.id, hoyFechaStr);
            } else {
              await liberarReservaDelDia(fiestaId, inv.id, hoyFechaStr, { revisarEnvio: true });
            }
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
              proveedorError = new Error(resWa?.error || 'HTTP 400 rejection WhatsApp');
            }
          } catch (err) {
            proveedorError = err;
            envioExitoso = false;
          }
        } else {
          proveedorError = new Error('No hay credenciales de WhatsApp');
        }

        if (!envioExitoso) {
          const resAgendarWa = await saveScheduledMessage(
            {
              targetType: 'cliente',
              targetId: fiestaId,
              targetName: inv.nombre,
              targetPhone: contactoLimpio,
              templateType: 'personalizado',
              messageText: mensajeTexto,
              scheduledAt: ahora.toISOString(),
              status: 'pendiente',
              sendingMode: 'manual_click',
              fiestaId: fiestaId,
            },
            WHATSAPP_AUTOMATION_INTERNAL_TOKEN,
          );
          if (!resAgendarWa?.success) {
            console.warn(`[recordatorio] No se pudo agendar contingencia WhatsApp: ${resAgendarWa?.error}`);
            if (esRechazoConocido(proveedorError)) {
              await liberarReservaDelDia(fiestaId, inv.id, hoyFechaStr);
            } else {
              await liberarReservaDelDia(fiestaId, inv.id, hoyFechaStr, { revisarEnvio: true });
            }
          }
          fallados++;
        }
      }

      if (envioExitoso) {
        enviados++;
      }
    }
  }

  return {
    corrio: reservasFallidas === 0,
    totalFiestas: fiestas.length,
    totalInvitadosEvaluados: totalInvitados,
    enviados,
    fallados,
    omitidos,
    ...(reservasFallidas > 0 ? { reservasFallidas, motivo: 'fallaron reservas' } : {}),
  };
}
