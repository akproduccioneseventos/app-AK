'use server';

import { getFiestas, getHistorialFiestas, saveFiesta } from './fiesta/fiesta.actions';
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
    return result.success ? { success: true } : { success: false, error: result.error };
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
