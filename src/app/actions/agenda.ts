'use server';

import { getFiestas, getHistorialFiestas, saveFiesta } from './fiesta/fiesta.actions';
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

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const [activeFiestas, archivedFiestas] = await Promise.all([
      getFiestas(false),
      getHistorialFiestas(),
    ]);

    const toCalendarEvent = (fiesta: FiestaEnPlanificacion, isArchived: boolean): CalendarEvent | null => {
      if (!fiesta.configuracion.fechaEvento) return null;
      const dateTime = fiesta.configuracion.fechaEvento;
      const date = new Date(dateTime).toISOString().split('T')[0];
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

    return [...activeEvents, ...archivedEvents];
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
    const fiestas = await getFiestas(false);
    const fiesta = fiestas.find(f => f.id === fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    // Preserve the original time, update only the date
    const originalDate = fiesta.configuracion.fechaEvento
      ? new Date(fiesta.configuracion.fechaEvento)
      : new Date();
    const [year, month, day] = newDate.split('-').map(Number);
    originalDate.setFullYear(year, month - 1, day);

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
  try {
    const fiestas = await getFiestas();
    const occupiedDates: string[] = [];

    fiestas.forEach(fiesta => {
      if (fiesta.configuracion.fechaEvento) {
        occupiedDates.push(new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0]);
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
  try {
    const items = await readData<CrmAppointment[]>(APPOINTMENTS_FILE, []);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("Error loading appointments:", error);
    return [];
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
  return updateAppointmentStatus(id, 'Cancelada');
}





