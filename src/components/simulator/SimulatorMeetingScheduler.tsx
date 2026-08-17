'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, MessageSquare, CalendarCheck, Loader2, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSimulatorAvailableSlots, bookAppointmentFromSimulator } from '@/app/actions/simulator-agenda';
import type { DayAvailableSlots, TimeSlot } from '@/lib/agenda/horarios-disponibles';

interface SimulatorMeetingSchedulerProps {
  leadId?: string;
  presupuestoId?: string;
  clienteNombre: string;
  clienteContacto: string;
  clienteEmail?: string;
  onWhatsAppFallback: () => void;
}

export function SimulatorMeetingScheduler({
  leadId,
  presupuestoId,
  clienteNombre,
  clienteContacto,
  clienteEmail,
  onWhatsAppFallback,
}: SimulatorMeetingSchedulerProps) {
  const [days, setDays] = useState<DayAvailableSlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedResult, setBookedResult] = useState<{
    appointment: any;
    googleCalendarUrl?: string;
    whatsappUrl?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingSlots(true);
      try {
        const res = await getSimulatorAvailableSlots();
        if (res.success && res.days.length > 0) {
          setDays(res.days);
          setSelectedDayIndex(0);
          if (res.days[0].slots.length > 0) {
            setSelectedSlot(res.days[0].slots[0]);
          }
        }
      } catch (err) {
        console.error('Error cargando slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    load();
  }, []);

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);
    if (days[index] && days[index].slots.length > 0) {
      setSelectedSlot(days[index].slots[0]);
    } else {
      setSelectedSlot(null);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setErrorMessage(null);
    try {
      const res = await bookAppointmentFromSimulator({
        leadId,
        presupuestoId,
        clienteNombre: clienteNombre || 'Cliente Simulador',
        clienteContacto: clienteContacto || '',
        clienteEmail: clienteEmail || '',
        fechaHora: selectedSlot.datetimeIso,
        tipoReunion: 'Presencial en Oficina',
      });

      if (res.success && res.appointment) {
        setBookedResult({
          appointment: res.appointment,
          googleCalendarUrl: res.googleCalendarUrl,
          whatsappUrl: res.whatsappUrl,
        });
      } else {
        setErrorMessage(res.error || 'No se pudo reservar el turno. Por favor elegí otro horario.');
        // Recargar horarios disponibles si falló por choque
        const updated = await getSimulatorAvailableSlots();
        if (updated.success) setDays(updated.days);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión. Podés coordinar por WhatsApp.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (bookedResult) {
    return (
      <div className="w-full rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 text-left shadow-xl sm:p-8">
        <div className="flex items-center gap-3.5 mb-4 border-b border-emerald-200 pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Reunión confirmada
            </span>
            <h3 className="font-headline text-xl font-bold text-slate-900 sm:text-2xl mt-0.5">
              ¡Te esperamos en AK Producciones!
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-700 leading-relaxed mb-6">
          <div className="rounded-xl bg-white p-4 border border-emerald-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>{new Date(bookedResult.appointment.fechaHora).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>{new Date(bookedResult.appointment.fechaHora).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })} hs</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>Oficina AK Producciones · Salto, Uruguay</span>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Guardamos tu lugar y congelamos las promociones de tu presupuesto para la entrevista. Podés sincronizar la fecha con tu calendario o escribirnos si necesitás ajustar el horario.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {bookedResult.googleCalendarUrl && (
            <Button variant="outline" className="h-11 border-slate-300 font-bold text-slate-800 gap-2 rounded-xl" asChild>
              <a href={bookedResult.googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4 text-emerald-600" /> Sincronizar Google Calendar
              </a>
            </Button>
          )}
          {bookedResult.whatsappUrl && (
            <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 font-bold text-white gap-2 rounded-xl" asChild>
              <a href={bookedResult.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" /> Hablar por WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-50/40 via-white to-amber-50/40 p-5 text-left shadow-lg sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-800 mb-1">
            <Sparkles className="h-3 w-3 text-red-600" /> Agenda tu visita
          </div>
          <h3 className="font-headline text-lg sm:text-xl font-black text-slate-900">
            ¿Cuándo querés venir a verlo?
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Elegí el día y la hora para tu entrevista sin costo en nuestra oficina.
          </p>
        </div>
      </div>

      {loadingSlots ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          <p className="text-xs font-semibold">Buscando horarios disponibles...</p>
        </div>
      ) : days.length === 0 ? (
        <div className="py-6 text-center text-slate-600 space-y-3">
          <p className="text-xs font-semibold">No encontramos turnos automáticos disponibles en los próximos días.</p>
          <Button onClick={onWhatsAppFallback} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-2 rounded-xl">
            <MessageSquare className="h-4 w-4" /> Coordinar por WhatsApp
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selector de días */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              1. Seleccioná el día
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => handleDaySelect(idx)}
                    className={`rounded-xl p-2.5 text-left border transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-600 text-white shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <p className={`text-xs font-black capitalize ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {day.dayName}
                    </p>
                    <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {day.date.split('-')[2]}/{day.date.split('-')[1]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de horarios */}
          {days[selectedDayIndex] && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                2. Seleccioná el horario ({days[selectedDayIndex].formattedDate})
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {days[selectedDayIndex].slots.map((slot) => {
                  const isSelected = selectedSlot?.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`min-h-10 rounded-xl px-3 py-2 text-center text-xs font-bold border transition-all ${
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <Clock className="h-3 w-3 mx-auto mb-1 opacity-70" />
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Botón de Confirmación Principal */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={handleBook}
              disabled={!selectedSlot || bookingLoading}
              className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm shadow-md gap-2 transition"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Agendando tu reunión...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4" />
                  <span>Confirmar reunión para el {days[selectedDayIndex]?.dayName} {selectedSlot?.label}</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onWhatsAppFallback}
              className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              O si preferís, coordiná directamente por WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
