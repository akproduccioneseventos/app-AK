'use server';

import type { CrmAppointment } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { calcularHorariosDisponibles, type DayAvailableSlots } from '@/lib/agenda/horarios-disponibles';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

const APPOINTMENTS_FILE = 'crm-appointments.json';

/**
 * Obtiene los días y horarios libres para que el cliente que armó su presupuesto
 * pueda elegir cuándo visitar la oficina sin intervención manual.
 */
export async function getSimulatorAvailableSlots(): Promise<{
  success: boolean;
  days: DayAvailableSlots[];
  error?: string;
}> {
  try {
    const appointments = await readData<CrmAppointment[]>(APPOINTMENTS_FILE, []);
    const days = calcularHorariosDisponibles(appointments, 14);
    return { success: true, days };
  } catch (error: any) {
    console.error('Error calculando horarios disponibles para simulador:', error);
    return { success: false, days: [], error: 'No se pudieron calcular los horarios disponibles' };
  }
}

/**
 * Reserva un turno directamente desde el paso final del simulador de presupuesto.
 * Previene colisiones concurrentes y sincroniza automáticamente con el CRM.
 */
export async function bookAppointmentFromSimulator(data: {
  clienteNombre: string;
  clienteContacto: string;
  clienteEmail?: string;
  fechaHora: string; // ISO 8601 string
  tipoReunion?: 'Presencial en Oficina' | 'Videollamada Google Meet';
  presupuestoId?: string;
  leadId?: string;
}): Promise<{
  success: boolean;
  appointment?: CrmAppointment;
  googleCalendarUrl?: string;
  whatsappUrl?: string;
  error?: string;
}> {
  await enforcePublicRateLimit({
    scope: 'agenda_simulator',
    identity: data.clienteContacto || 'simulator_booking',
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  try {
    const nombre = data.clienteNombre?.trim();
    if (!nombre) {
      return { success: false, error: 'Por favor ingresá tu nombre para reservar la entrevista.' };
    }
    if (!data.fechaHora) {
      return { success: false, error: 'Por favor seleccioná un día y horario.' };
    }

    const requestedDate = new Date(data.fechaHora);
    if (isNaN(requestedDate.getTime()) || requestedDate.getTime() < Date.now()) {
      return { success: false, error: 'El horario seleccionado ya no está disponible.' };
    }

    const appointments = await readData<CrmAppointment[]>(APPOINTMENTS_FILE, []);

    // Validar que no haya otra cita en ese mismo rango (45 min)
    const slotBusy = appointments.some((apt) => {
      if (apt.estado === 'Cancelada') return false;
      const aptTime = new Date(apt.fechaHora).getTime();
      return Math.abs(aptTime - requestedDate.getTime()) < 45 * 60 * 1000;
    });

    if (slotBusy) {
      return {
        success: false,
        error: 'Ese horario acaba de ser ocupado. Por favor elegí otro horario disponible.',
      };
    }

    const newAppointment: CrmAppointment = {
      id: `cita_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      clienteNombre: nombre,
      clienteContacto: data.clienteContacto || '',
      clienteEmail: data.clienteEmail || '',
      fechaHora: data.fechaHora,
      estado: 'Agendada',
      lugar: data.tipoReunion === 'Videollamada Google Meet' ? 'Videollamada Google Meet' : 'Oficina AK Producciones',
      notas: `Agendado automáticamente desde el Simulador de Presupuesto.${data.presupuestoId ? ` Presupuesto ID: ${data.presupuestoId}` : ''}`,
      leadId: data.leadId,
      presupuestoId: data.presupuestoId,
      creadoEn: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    await writeData(APPOINTMENTS_FILE, appointments);

    // Registrar en el CRM si corresponde
    try {
      if (newAppointment.leadId) {
        const { scheduleCrmMeeting } = await import('@/app/actions/crm');
        await scheduleCrmMeeting(newAppointment.leadId, newAppointment.fechaHora, `Reunión en Oficina AK (${newAppointment.lugar})`);
      }
    } catch {
      // Ignorar errores de CRM no bloqueantes
    }

    // Generar enlaces útiles (Google Calendar + WhatsApp)
    const startTimeIso = requestedDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTimeIso = new Date(requestedDate.getTime() + 45 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Reunión con AK Producciones - ${nombre}`
    )}&dates=${startTimeIso}/${endTimeIso}&details=${encodeURIComponent(
      `Entrevista para coordinar tu fiesta y revisar el presupuesto con el equipo de AK Producciones.`
    )}&location=${encodeURIComponent('Oficina AK Producciones, Salto, Uruguay')}`;

    const fechaLegible = requestedDate.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
    const horaLegible = requestedDate.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const whatsappMsg = `¡Hola AK Producciones! Agendé mi reunión para el ${fechaLegible} a las ${horaLegible} hs para conversar sobre mi fiesta. Mi nombre es ${nombre}.`;
    const whatsappUrl = `https://wa.me/59899000000?text=${encodeURIComponent(whatsappMsg)}`;

    return {
      success: true,
      appointment: newAppointment,
      googleCalendarUrl,
      whatsappUrl,
    };
  } catch (error: any) {
    console.error('Error agendando cita desde simulador:', error);
    return { success: false, error: error?.message || 'No se pudo agendar la reunión.' };
  }
}
