'use server';

import { getFiestas, getHistorialFiestas, saveFiesta } from './fiesta/fiesta.actions';
import { diaCalendario } from '@/lib/reportes/rango-de-dias';
import { syncFiestaToGoogleWorkspace } from './google-workspace';
import { requireAppSession } from '@/lib/auth/require-session';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface CalendarEvent {
  id: string;
  fiestaId: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  dateTime: string; // Full ISO datetime
  type: string;
  status: 'confirmed' | 'pending' | 'completed';
  guestCount: number;
  venue: string;
  personalCount: number;
  presupuestoId?: string;
  presupuestoEstimado: number;
}

function getFiestaStatus(fiesta: FiestaEnPlanificacion, isArchived: boolean): CalendarEvent['status'] {
  if (isArchived) return 'completed';
  if (fiesta.estado === 'confirmado' || fiesta.presupuestoId) return 'confirmed';
  return 'pending';
}

/**
 * El dia del calendario en Uruguay, no en Greenwich.
 *
 * **Por que.** Antes el dia se sacaba de la fecha en formato universal, que es el dia en hora
 * de Greenwich. Una fiesta a las 23:00 de Uruguay son las 02:00 del dia siguiente alla, asi
 * que el calendario la mostraba **un dia despues**: justo las fiestas de noche, que son casi
 * todas.
 *
 * **Y la segunda mitad, que se me escapo en el primer arreglo (lo marco Codex el 22 de
 * setiembre de 2026):** una fecha escrita como dia suelto —`2026-10-10`, sin hora— **no es
 * un instante**, es un dia. Convertirla como si fuera un instante la manda a la medianoche
 * de Greenwich, que en Uruguay son las nueve de la noche del dia ANTERIOR, y el 10 se
 * dibujaba el 9. Por eso esto usa `diaCalendario`, que ya distingue los dos casos y es el
 * unico lugar donde vive esa regla.
 *
 * Devuelve `null` si la fecha guardada no se entiende, para que el que llama decida —y no
 * reviente toda la lista, que es lo que pasaba—.
 */
function diaCivilEnUruguay(valor: string): string | null {
  return diaCalendario(valor);
}

/**
 * Comprueba que una fecha escrita como ano-mes-dia exista de verdad.
 *
 * **Por que.** `setFullYear(2026, 1, 31)` no falla con el 31 de febrero: lo corre solo al
 * 3 de marzo. O sea que una fecha imposible se guardaba **como otra fecha**, y encima
 * salia el aviso al cliente con el dia cambiado.
 */
function esUnDiaQueExiste(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [, a, m, d] = partes;
  const prueba = new Date(Date.UTC(Number(a), Number(m) - 1, Number(d)));
  return prueba.getUTCFullYear() === Number(a)
    && prueba.getUTCMonth() === Number(m) - 1
    && prueba.getUTCDate() === Number(d);
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  // Devuelve el calendario entero: todas las fiestas con su fecha y su cliente.
  // Estaba abierta, y la usa solo la pantalla del calendario, que ya pide cuenta.
  await requireAppSession();
  try {
    const [activeFiestas, archivedFiestas] = await Promise.all([
      getFiestas(false),
      getHistorialFiestas(),
    ]);

    const toCalendarEvent = (fiesta: FiestaEnPlanificacion, isArchived: boolean): CalendarEvent | null => {
      if (!fiesta.configuracion.fechaEvento) return null;
      const dateTime = fiesta.configuracion.fechaEvento;
      // Una sola fiesta con la fecha rota dejaba el calendario ENTERO vacio: la conversion
      // tiraba error y el catch de afuera devolvia una lista vacia. Ahora se saltea esa y
      // las demas se ven. Las reuniones ya estaban protegidas una por una; las fiestas no.
      const date = diaCivilEnUruguay(dateTime);
      if (!date) {
        console.error(`[agenda] La fiesta ${fiesta.id} tiene una fecha que no se entiende:`, dateTime);
        return null;
      }
      return {
        id: `cal_${fiesta.id}`,
        fiestaId: fiesta.id,
        title: fiesta.configuracion.nombreEvento || `${fiesta.configuracion.tipoCelebracion} - ${fiesta.configuracion.protagonista1Nombre || ''}`.trim(),
        date,
        dateTime,
        type: fiesta.configuracion.tipoCelebracion || 'Evento',
        status: getFiestaStatus(fiesta, isArchived),
        guestCount: fiesta.configuracion.invitadosEstimados || 0,
        venue: fiesta.configuracion.nombreLugar || '',
        personalCount: fiesta.personalAsignado?.length || 0,
        presupuestoId: fiesta.presupuestoId,
        presupuestoEstimado: fiesta.configuracion.presupuestoEstimado || 0,
      };
    };

    const activeEvents = activeFiestas.map(f => toCalendarEvent(f, false)).filter((e): e is CalendarEvent => e !== null);
    const archivedEvents = archivedFiestas.map(f => toCalendarEvent(f, true)).filter((e): e is CalendarEvent => e !== null);

    const reunionEvents: CalendarEvent[] = [];
    for (const fiesta of [...activeFiestas, ...archivedFiestas]) {
      if (fiesta.reuniones && Array.isArray(fiesta.reuniones)) {
        for (const r of fiesta.reuniones) {
          if (r.fecha) {
            try {
              const dateTime = r.fecha;
              const date = diaCivilEnUruguay(dateTime);
              if (!date) continue;
              const lugar = (r as any).lugar || fiesta.configuracion.nombreLugar || '';
              const contacto = (r as any).conQuien || (fiesta.configuracion as any).nombreCliente || fiesta.configuracion.protagonista1Nombre || '';
              reunionEvents.push({
                id: `reunion_${fiesta.id}_${r.id || Math.random().toString(36).substring(2, 7)}`,
                fiestaId: fiesta.id,
                title: `🤝 Reunión: ${r.titulo}${contacto ? ` con ${contacto}` : ''} (${fiesta.configuracion.nombreEvento || 'Fiesta'})`,
                date,
                dateTime,
                type: 'Reunión',
                status: 'confirmed',
                guestCount: 0,
                venue: lugar,
                personalCount: 0,
                presupuestoEstimado: 0,
              });
            } catch {
              // Si la fecha de la reunión es inválida, se omite
            }
          }
        }
      }
    }

    return [...activeEvents, ...archivedEvents, ...reunionEvents];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
}

export async function updateFiestaDate(
  fiestaId: string,
  newDate: string // ISO date string YYYY-MM-DD
): Promise<{ success: boolean; error?: string }> {
  try {
    // Cambia la fecha de una fiesta. Estaba abierta a internet: cualquiera que
    // supiera el numero de una fiesta podia moverle la fecha, sin cuenta. La usa
    // solo el calendario del equipo, al arrastrar el evento a otro dia.
    await requireAppSession();
    // Una fecha imposible —un 31 de febrero— no falla al guardarse: se corre sola al 3 de
    // marzo, se guarda como otra fecha y **le sale el aviso al cliente con el dia cambiado**.
    // Se rechaza antes de tocar nada.
    if (!esUnDiaQueExiste(newDate)) {
      return { success: false, error: 'Esa fecha no existe. Revisala y proba de nuevo.' };
    }

    const fiestas = await getFiestas(false);
    const fiesta = fiestas.find(f => f.id === fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    // **Se cambia el dia y se conserva la hora DE URUGUAY.**
    //
    // `setFullYear` trabaja con la hora del servidor, no con la de aca. Si el servidor corre
    // en hora de Greenwich —que es lo normal—, una fiesta de las 23:00 de Uruguay es para el
    // servidor las 02:00 del dia siguiente: al pedir el 12 de octubre terminaba guardando el
    // 11 en hora de Uruguay. Lo marco Codex el 22 de setiembre de 2026.
    //
    // Por eso se arma la fecha nueva a mano, con la hora de Uruguay que ya tenia y el dia que
    // se pidio, y se le suman las tres horas de diferencia para guardarla como instante.
    const HORAS_MENOS_QUE_GREENWICH = 3;
    const original = fiesta.configuracion.fechaEvento
      ? new Date(fiesta.configuracion.fechaEvento)
      : new Date();
    // La hora tal como se ve en Uruguay, sin importar donde corra el servidor.
    const enUruguay = new Date(original.getTime() - HORAS_MENOS_QUE_GREENWICH * 60 * 60 * 1000);
    const [year, month, day] = newDate.split('-').map(Number);
    const originalDate = new Date(Date.UTC(
      year,
      month - 1,
      day,
      enUruguay.getUTCHours() + HORAS_MENOS_QUE_GREENWICH,
      enUruguay.getUTCMinutes(),
      enUruguay.getUTCSeconds(),
      enUruguay.getUTCMilliseconds(),
    ));

    const updatedFiesta: FiestaEnPlanificacion = {
      ...fiesta,
      configuracion: {
        ...fiesta.configuracion,
        fechaEvento: originalDate.toISOString(),
      },
    };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) return { success: false, error: result.error };

    syncFiestaToGoogleWorkspace(fiestaId, {
      reason: 'date-change',
      sendEmails: true,
      forceEmail: true,
    }).catch((syncError) => {
      console.warn('[agenda] Google Workspace sync failed:', syncError);
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getOcupiedDates(): Promise<string[]> {
  // Que dias ya estan tomados. La usa solo la pantalla de crear presupuesto.
  await requireAppSession();
  try {
    const fiestas = await getFiestas();
    const occupiedDates: string[] = [];

    fiestas.forEach(fiesta => {
      if (fiesta.configuracion.fechaEvento) {
        // El mismo dia civil que usa el calendario. Con el dia de Greenwich, una fiesta de
        // las 23:00 marcaba ocupado **el dia siguiente**: el dia que de verdad estaba tomado
        // quedaba libre para vender, y el de al lado bloqueado sin motivo.
        const dia = diaCivilEnUruguay(fiesta.configuracion.fechaEvento);
        if (dia) occupiedDates.push(dia);
      }
    });

    // Return unique dates
    return [...new Set(occupiedDates)];
  } catch (error) {
    console.error("Error fetching occupied dates:", error);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// CITAS Y REUNIONES COMERCIALES (CRM & AGENDA)
// ──────────────────────────────────────────────────────────────────────────────

import { readData, writeData } from '@/lib/data-service';
import type { CrmAppointment } from '@/types/crm';

const APPOINTMENTS_FILE = 'crm-appointments.json';

export async function getAppointments(): Promise<CrmAppointment[]> {
  // Las reuniones agendadas con los clientes, con sus datos. Estaba abierta.
  await requireAppSession();
  try {
    const items = await readData<CrmAppointment[]>(APPOINTMENTS_FILE, []);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("Error loading appointments:", error);
    throw new Error('No se pudieron cargar las citas. No se guardó ningún cambio.');
  }
}

import {
  buildWhatsAppReminderUrl,
  buildGoogleCalendarAppointmentUrl,
  buildGmailAppointmentInviteUrl,
} from '@/lib/agenda-utils';

export async function createAppointment(data: Omit<CrmAppointment, 'id' | 'creadoEn' | 'estado'> & { estado?: CrmAppointment['estado'] }): Promise<{
  success: boolean;
  appointment?: CrmAppointment;
  whatsappUrl?: string;
  googleCalendarUrl?: string;
  gmailInviteUrl?: string;
  error?: string;
}> {
  try {
    await requireAppSession();
    const appointments = await getAppointments();
    const newAppointment: CrmAppointment = {
      ...data,
      id: `cita_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      estado: data.estado || 'Agendada',
      creadoEn: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    await writeData(APPOINTMENTS_FILE, appointments);

    // Sincronizacion automatica con Google Workspace (Calendar + Gmail de la Empresa & Cliente)
    const { syncAppointmentToGoogleWorkspace } = await import('@/app/actions/google-workspace');
    syncAppointmentToGoogleWorkspace(newAppointment).catch((err) => {
      console.warn('[agenda] Google Workspace appointment sync failed:', err);
    });

    // Registrar en el historial del CRM si está vinculado a un prospecto
    if (newAppointment.leadId) {
      const { scheduleCrmMeeting } = await import('@/app/actions/crm');
      scheduleCrmMeeting(newAppointment.leadId, newAppointment.fechaHora, `Cita Comercial (${newAppointment.lugar || 'Oficina AK'})`).catch((err) => {
        console.warn('[agenda] CRM meeting schedule failed:', err);
      });
    }

    const whatsappUrl = buildWhatsAppReminderUrl(newAppointment);
    const googleCalendarUrl = buildGoogleCalendarAppointmentUrl(newAppointment);
    const gmailInviteUrl = buildGmailAppointmentInviteUrl(newAppointment);

    return {
      success: true,
      appointment: newAppointment,
      whatsappUrl,
      googleCalendarUrl,
      gmailInviteUrl,
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo agendar la cita' };
  }
}

export async function updateAppointmentStatus(
  id: string,
  estado: CrmAppointment['estado']
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const appointments = await getAppointments();
    const idx = appointments.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Cita no encontrada' };

    appointments[idx].estado = estado;
    if (estado === 'Confirmada') {
      appointments[idx].recordatorioEnviado = true;
    }

    await writeData(APPOINTMENTS_FILE, appointments);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al actualizar cita' };
  }
}

/**
 * Corregir una cita ya agendada.
 *
 * Antes lo único que se podía hacer con una cita era marcarla "Confirmada". Si
 * el cliente reprogramaba —que pasa siempre— la cita vieja quedaba para siempre
 * y había que crear otra al lado, con lo cual la agenda mostraba dos.
 */
export async function updateAppointment(
  id: string,
  cambios: Partial<Pick<CrmAppointment, 'clienteNombre' | 'clienteContacto' | 'clienteEmail' | 'fechaHora' | 'lugar' | 'notas'>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const appointments = await getAppointments();
    const idx = appointments.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Cita no encontrada' };

    if (appointments[idx].estado === 'Cancelada') {
      return { success: false, error: 'La cita está cancelada. Agendá una nueva en vez de reescribir ésta.' };
    }

    const nombre = cambios.clienteNombre?.trim();
    if (cambios.clienteNombre !== undefined && !nombre) {
      return { success: false, error: 'La cita necesita el nombre del cliente.' };
    }
    if (cambios.fechaHora !== undefined && Number.isNaN(new Date(cambios.fechaHora).getTime())) {
      return { success: false, error: 'La fecha de la cita no se entiende.' };
    }

    appointments[idx] = { ...appointments[idx], ...cambios, ...(nombre ? { clienteNombre: nombre } : {}) };
    await writeData(APPOINTMENTS_FILE, appointments);

    // Sincronizar actualización con Google Workspace
    const { syncAppointmentToGoogleWorkspace } = await import('@/app/actions/google-workspace');
    syncAppointmentToGoogleWorkspace(appointments[idx]).catch((err) => {
      console.warn('[agenda] Google Workspace appointment update sync failed:', err);
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al actualizar cita' };
  }
}

/** Cancelar una cita. No se borra: queda el registro de que existió. */
export async function cancelAppointment(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return updateAppointmentStatus(id, 'Cancelada');
}





