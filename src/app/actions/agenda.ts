'use server';

import { getFiestas, getHistorialFiestas, saveFiesta } from './fiesta/fiesta.actions';
import { syncFiestaToGoogleWorkspace } from './google-workspace';
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

import { buildGoogleCalendarTemplateUrl } from '@/lib/google-workspace';

export async function createAppointment(data: Omit<CrmAppointment, 'id' | 'creadoEn' | 'estado'> & { estado?: CrmAppointment['estado'] }): Promise<{
  success: boolean;
  appointment?: CrmAppointment;
  whatsappUrl?: string;
  googleCalendarUrl?: string;
  gmailInviteUrl?: string;
  error?: string;
}> {
  try {
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
      const { addTimelineEventToLead } = await import('@/app/actions/crm');
      addTimelineEventToLead(newAppointment.leadId, {
        type: 'meeting_scheduled',
        description: `Cita agendada para el ${new Date(newAppointment.fechaHora).toLocaleDateString('es-UY')} a las ${new Date(newAppointment.fechaHora).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })} hs (${newAppointment.lugar || 'Oficina AK'})`,
      }).catch(() => {});
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

export function buildWhatsAppReminderUrl(appointment: CrmAppointment): string {
  const phoneClean = appointment.clienteContacto.replace(/\D/g, '');
  const phoneUruguay = phoneClean.startsWith('598') ? phoneClean : `598${phoneClean.replace(/^0/, '')}`;
  
  const dateObj = new Date(appointment.fechaHora);
  const fechaFormatted = dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaFormatted = dateObj.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

  const text = `¡Hola ${appointment.clienteNombre}! 👋 Te escribimos de *AK Producciones*. Te recordamos nuestra reunión agendada para el *${fechaFormatted}* a las *${horaFormatted} hs* ${appointment.lugar ? `en ${appointment.lugar}` : ''} para coordinar todos los detalles de tu evento. ¡Te esperamos! ✨`;

  return `https://wa.me/${phoneUruguay}?text=${encodeURIComponent(text)}`;
}

export function buildGoogleCalendarAppointmentUrl(appointment: CrmAppointment): string {
  const start = new Date(appointment.fechaHora);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hr appointment
  return buildGoogleCalendarTemplateUrl({
    summary: `Reunión AK Producciones - ${appointment.clienteNombre} (${appointment.eventoTipo || 'Cita Comercial'})`,
    description: `Cita agendada con ${appointment.clienteNombre}.\nContacto: ${appointment.clienteContacto}\nTipo: ${appointment.eventoTipo || 'Entrevista'}\nNotas: ${appointment.notas || 'Sin notas'}`,
    location: appointment.lugar || 'Oficina AK Producciones Salto',
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
}

export function buildGmailAppointmentInviteUrl(appointment: CrmAppointment): string {
  const dateObj = new Date(appointment.fechaHora);
  const fechaFormatted = dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaFormatted = dateObj.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

  const subject = `Confirmación de Cita - AK Producciones (${appointment.clienteNombre})`;
  const body = `Hola ${appointment.clienteNombre},\n\nTe confirmamos tu cita con el equipo de AK Producciones:\n\n📅 Fecha: ${fechaFormatted}\n⏰ Hora: ${horaFormatted} hs\n📍 Lugar: ${appointment.lugar || 'Oficina AK Producciones Salto'}\n🎉 Tipo de evento: ${appointment.eventoTipo || 'Fiesta'}\n\nEn la reunión repasaremos el presupuesto, la tecnología y todas las ideas para tu gran día.\n\n¡Nos vemos pronto!\nEquipo AK Producciones\nWhatsApp: 098 355 530`;

  const targetEmail = appointment.clienteContacto.includes('@') ? appointment.clienteContacto : '';

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}


