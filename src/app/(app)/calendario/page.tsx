'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  Users,
  MapPin,
  Tag,
  UserCheck,
  CircleDollarSign,
  ExternalLink,
  GripVertical,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { getCalendarEvents, updateFiestaDate, getAppointments, createAppointment, updateAppointmentStatus } from '@/app/actions/agenda';
import { buildWhatsAppReminderUrl, buildGoogleCalendarAppointmentUrl, buildGmailAppointmentInviteUrl } from '@/lib/agenda-utils';
import type { CalendarEvent } from '@/app/actions/agenda';
import type { CrmAppointment } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';

// ──────────────────────────────────────────────────────────────────────────────
// Status config
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmado',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500',
    badge: 'bg-green-500 text-white',
  },
  pending: {
    label: 'Pendiente',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-500 text-white',
  },
  completed: {
    label: 'Completado',
    bg: 'bg-gray-100 dark:bg-gray-800/40',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
    dot: 'bg-gray-400',
    badge: 'bg-gray-400 text-white',
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Draggable Event Chip
// ──────────────────────────────────────────────────────────────────────────────

interface EventChipProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  isDragging?: boolean;
}

function EventChip({ event, onClick, isDragging = false }: EventChipProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
    disabled: event.status === 'completed',
  });

  const cfg = STATUS_CONFIG[event.status];
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border cursor-pointer select-none transition-opacity',
        cfg.bg,
        cfg.text,
        cfg.border,
        isDragging ? 'opacity-40' : 'hover:opacity-90',
        event.status !== 'completed' && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={e => {
        e.stopPropagation();
        onClick(event);
      }}
    >
      {event.status !== 'completed' && (
        <span
          {...attributes}
          {...listeners}
          className="touch-none opacity-0 group-hover:opacity-60 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 flex-shrink-0" />
        </span>
      )}
      <span className="truncate max-w-[120px]">{event.title}</span>
    </div>
  );
}

function DragOverlayChip({ event }: { event: CalendarEvent }) {
  const cfg = STATUS_CONFIG[event.status];
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border shadow-lg cursor-grabbing opacity-95',
        cfg.bg,
        cfg.text,
        cfg.border
      )}
    >
      <GripVertical className="h-3 w-3 flex-shrink-0" />
      <span className="truncate max-w-[120px]">{event.title}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Droppable Day Cell
// ──────────────────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  activeDragId: string | null;
}

function DayCell({ day, currentMonth, events, onEventClick, activeDragId }: DayCellProps) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isDayToday = isToday(day);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[80px] sm:min-h-[100px] p-1 border-r border-b last:border-r-0 transition-colors',
        !isCurrentMonth && 'bg-muted/30',
        isOver && 'bg-primary/10 ring-1 ring-inset ring-primary'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1',
          isDayToday && 'bg-primary text-primary-foreground',
          !isCurrentMonth && 'text-muted-foreground',
          isCurrentMonth && !isDayToday && 'text-foreground'
        )}
      >
        {format(day, 'd')}
      </span>
      <div className="space-y-0.5">
        {events.map(event => (
          <EventChip
            key={event.id}
            event={event}
            onClick={onEventClick}
            isDragging={activeDragId === event.id}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Event Detail Sheet
// ──────────────────────────────────────────────────────────────────────────────

function EventDetailSheet({
  event,
  open,
  onClose,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;
  const cfg = STATUS_CONFIG[event.status];
  const formattedDate = event.dateTime
    ? format(parseISO(event.dateTime), "EEEE d 'de' MMMM, yyyy", { locale: es })
    : 'Sin fecha';
  const formattedAmount = event.presupuestoEstimado
    ? new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(event.presupuestoEstimado)
    : null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full flex-shrink-0', cfg.dot)} />
            <SheetTitle className="text-xl leading-tight">{event.title}</SheetTitle>
          </div>
          <SheetDescription asChild>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.badge)}>
              {cfg.label}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Fecha</p>
              <p className="text-muted-foreground capitalize">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Tipo de evento</p>
              <p className="text-muted-foreground">{event.type}</p>
            </div>
          </div>

          {event.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Lugar</p>
                <p className="text-muted-foreground">{event.venue}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Invitados</p>
              <p className="text-muted-foreground">{event.guestCount} personas</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Personal asignado</p>
              <p className={cn('font-semibold', event.personalCount === 0 ? 'text-destructive' : 'text-foreground')}>
                {event.personalCount === 0 ? 'Sin asignar ⚠️' : `${event.personalCount} persona(s)`}
              </p>
            </div>
          </div>

          {formattedAmount && (
            <div className="flex items-start gap-3">
              <CircleDollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Presupuesto estimado</p>
                <p className="text-muted-foreground">{formattedAmount}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button asChild className="w-full" variant="default"><Link href={`/fiestas/nueva?fiestaId=${event.fiestaId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir planificador
            </Link></Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarioInteractivoPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const [appointments, setAppointments] = useState<CrmAppointment[]>([]);
  const [isCitaModalOpen, setIsCitaModalOpen] = useState(false);
  const [citaNombre, setCitaNombre] = useState('');
  const [citaTelefono, setCitaTelefono] = useState('');
  const [citaEmail, setCitaEmail] = useState('');
  const [citaTipo, setCitaTipo] = useState('Fiesta de 15');
  const [citaFecha, setCitaFecha] = useState('');
  const [citaHora, setCitaHora] = useState('18:00');
  const [citaLugar, setCitaLugar] = useState('Oficina AK Salto');
  const [citaNotas, setCitaNotas] = useState('');
  const [isSubmittingCita, setIsSubmittingCita] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsData, apptData] = await Promise.all([
        getCalendarEvents(),
        getAppointments(),
      ]);
      setEvents(eventsData);
      setAppointments(apptData);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los eventos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleCreateCita = async () => {
    if (!citaNombre || !citaTelefono || !citaFecha) {
      toast({ title: 'Datos incompletos', description: 'Ingresá el nombre, teléfono y fecha de la cita.', variant: 'destructive' });
      return;
    }
    setIsSubmittingCita(true);
    try {
      const fullDateTime = new Date(`${citaFecha}T${citaHora}`).toISOString();
      const res = await createAppointment({
        clienteNombre: citaNombre,
        clienteContacto: citaTelefono,
        clienteEmail: citaEmail || undefined,
        eventoTipo: citaTipo,
        fechaHora: fullDateTime,
        lugar: citaLugar,
        notas: citaNotas,
      });

      if (res.success && res.appointment) {
        toast({ title: '¡Cita agendada!', description: `Cita con ${citaNombre} creada correctamente.` });
        if (res.whatsappUrl) {
          window.open(res.whatsappUrl, '_blank');
        }
        setIsCitaModalOpen(false);
        setCitaNombre('');
        setCitaTelefono('');
        setCitaEmail('');
        setCitaNotas('');
        fetchEvents();
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo crear la cita', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al agendar la cita.', variant: 'destructive' });
    } finally {
      setIsSubmittingCita(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let current = gridStart;
    while (current <= gridEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    return map;
  }, [events]);

  const activeDragEvent = useMemo(
    () => (activeDragId ? events.find(e => e.id === activeDragId) ?? null : null),
    [activeDragId, events]
  );

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const newDateStr = String(over.id);
    const eventId = String(active.id);
    const draggedEvent = events.find(ev => ev.id === eventId);
    if (!draggedEvent || draggedEvent.date === newDateStr) return;

    // Optimistic update — preserve original time portion using parseISO
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        const originalDate = parseISO(ev.dateTime);
        const [y, m, d] = newDateStr.split('-').map(Number);
        originalDate.setFullYear(y, m - 1, d);
        return { ...ev, date: newDateStr, dateTime: originalDate.toISOString() };
      })
    );

    const result = await updateFiestaDate(draggedEvent.fiestaId, newDateStr);
    if (!result.success) {
      toast({ title: 'Error', description: result.error ?? 'No se pudo reprogramar el evento.', variant: 'destructive' });
      fetchEvents();
    } else {
      toast({
        title: 'Evento reprogramado',
        description: `"${draggedEvent.title}" movido al ${format(parseISO(newDateStr), "d 'de' MMMM", { locale: es })}.`,
      });
    }
  };

  const confirmedCount = useMemo(() => events.filter(e => e.status === 'confirmed').length, [events]);
  const pendingCount = useMemo(() => events.filter(e => e.status === 'pending').length, [events]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Calendario Maestro de Eventos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arrastra eventos para reprogramarlos. Haz clic para ver los detalles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCitaModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold size-sm gap-2">
            <Users className="w-4 h-4" /> + Agendar Cita Comercial
          </Button>
          <Button asChild variant="outline" size="sm"><Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link></Button>
        </div>
      </div>

      {/* Legend + counters */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(key => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_CONFIG[key].dot)} />
            <span className="text-muted-foreground">{STATUS_CONFIG[key].label}</span>
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-muted-foreground">
          <span>{confirmedCount} confirmados</span>·<span>{pendingCount} pendientes</span>
        </span>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="border rounded-lg overflow-hidden shadow-sm">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                return (
                  <DayCell
                    key={dateStr}
                    day={day}
                    currentMonth={currentMonth}
                    events={eventsByDate[dateStr] ?? []}
                    onEventClick={ev => { setSelectedEvent(ev); setSheetOpen(true); }}
                    activeDragId={activeDragId}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDragEvent ? <DragOverlayChip event={activeDragEvent} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Seccion Agenda Secretaria AK & Citas CRM */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl rounded-3xl overflow-hidden mt-10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white tracking-tight font-headline flex items-center gap-2">
                Agenda de la Secretaria AK
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  {appointments.length} cita(s)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300 mt-0.5">
                Gestión ejecutiva de entrevistas comerciales con sincronización automática en Google Calendar, Gmail y WhatsApp.
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsCitaModalOpen(true)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black h-11 px-5 rounded-xl shadow-lg transition-transform active:scale-95">
            + Agendar Cita
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {appointments.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/15 rounded-2xl bg-white/5">
              <Users className="w-10 h-10 mx-auto text-emerald-400/60 mb-2" />
              <p className="text-sm font-bold text-slate-200">No hay entrevistas comerciales agendadas aún</p>
              <p className="text-xs text-slate-400 mt-1">Tocá en "+ Agendar Cita" para programar la primera entrevista con cliente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appt) => {
                const waUrl = buildWhatsAppReminderUrl(appt);
                const gCalUrl = buildGoogleCalendarAppointmentUrl(appt);
                const gmailUrl = buildGmailAppointmentInviteUrl(appt);

                const dateObj = new Date(appt.fechaHora);
                const fechaStr = dateObj.toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit', month: 'short' });
                const horaStr = dateObj.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                const initial = appt.clienteNombre ? appt.clienteNombre.charAt(0).toUpperCase() : 'C';

                return (
                  <div key={appt.id} className="group relative rounded-2xl border border-white/15 bg-white/5 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-emerald-400/50 hover:bg-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-black text-slate-950 text-base shadow-md">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-black text-base text-white truncate">{appt.clienteNombre}</span>
                            <span className="block text-xs font-semibold text-emerald-400">{appt.eventoTipo || 'Entrevista Comercial'}</span>
                          </div>
                        </div>
                        <span className={cn(
                          'text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border',
                          appt.estado === 'Confirmada' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                          appt.estado === 'Realizada' ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' :
                          appt.estado === 'Cancelada' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        )}>
                          {appt.estado}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 rounded-xl bg-slate-900/60 p-3 text-xs border border-white/10">
                        <div className="flex items-center justify-between text-slate-200">
                          <span className="flex items-center gap-2 font-bold text-white">
                            <CalendarDays className="w-4 h-4 text-emerald-400" />
                            {fechaStr}
                          </span>
                          <span className="font-mono font-black text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {horaStr} hs
                          </span>
                        </div>
                        {appt.lugar && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-none" />
                            <span className="truncate">{appt.lugar}</span>
                          </div>
                        )}
                        {appt.notas && (
                          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
                            "{appt.notas}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" title="Enviar recordatorio WhatsApp" className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all">
                          📲 WA
                        </a>
                        <a href={gCalUrl} target="_blank" rel="noopener noreferrer" title="Ver en Google Calendar" className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-blue-500/20 border border-blue-500/40 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition-all">
                          📅 GCal
                        </a>
                        <a href={gmailUrl} target="_blank" rel="noopener noreferrer" title="Enviar mail Gmail" className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all">
                          <Mail className="w-3.5 h-3.5" /> Gmail
                        </a>
                      </div>

                      {appt.estado === 'Agendada' && (
                        <Button variant="ghost" size="sm" className="w-full h-8 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={async () => {
                          await updateAppointmentStatus(appt.id, 'Confirmada');
                          fetchEvents();
                        }}>
                          Marcar Confirmada ✓
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Crear Cita Comercial */}
      <Dialog open={isCitaModalOpen} onOpenChange={setIsCitaModalOpen}>
        <DialogContent className="sm:max-w-lg border-emerald-500/30 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-black text-white flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              Agendar Entrevista Comercial
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Agendá una reunión de ventas. Se sincroniza automáticamente con Google Calendar, Gmail y se abre WhatsApp para enviarle el recordatorio al cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="cita-nombre" className="text-slate-200 font-bold text-xs">Nombre del Cliente *</Label>
              <Input id="cita-nombre" value={citaNombre} onChange={e => setCitaNombre(e.target.value)} placeholder="Ej: María Rodríguez" className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cita-tel" className="text-slate-200 font-bold text-xs">Celular / WhatsApp *</Label>
                <Input id="cita-tel" value={citaTelefono} onChange={e => setCitaTelefono(e.target.value)} placeholder="Ej: 099123456" className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cita-email" className="text-slate-200 font-bold text-xs">Email (Opcional)</Label>
                <Input id="cita-email" type="email" value={citaEmail} onChange={e => setCitaEmail(e.target.value)} placeholder="ejemplo@gmail.com" className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cita-tipo" className="text-slate-200 font-bold text-xs">Tipo de Evento</Label>
                <Input id="cita-tipo" value={citaTipo} onChange={e => setCitaTipo(e.target.value)} placeholder="Ej: Fiesta de 15, Boda" className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cita-lugar" className="text-slate-200 font-bold text-xs">Lugar / Medio</Label>
                <Input id="cita-lugar" value={citaLugar} onChange={e => setCitaLugar(e.target.value)} placeholder="Oficina AK Salto" className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cita-fecha" className="text-slate-200 font-bold text-xs">Fecha *</Label>
                <Input id="cita-fecha" type="date" value={citaFecha} onChange={e => setCitaFecha(e.target.value)} className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cita-hora" className="text-slate-200 font-bold text-xs">Hora</Label>
                <Input id="cita-hora" type="time" value={citaHora} onChange={e => setCitaHora(e.target.value)} className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cita-notas" className="text-slate-200 font-bold text-xs">Notas adicionales</Label>
              <Input id="cita-notas" value={citaNotas} onChange={e => setCitaNotas(e.target.value)} placeholder="Notas para la entrevista..." className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-emerald-400" />
            </div>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] text-emerald-300 space-y-1">
              <p className="font-bold">📅 Sincronización Automática</p>
              <p className="text-slate-400">Al confirmar, la cita se agrega al Google Calendar de la empresa, se envía un correo de confirmación a ambas partes y se abre WhatsApp para el recordatorio directo.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" className="border-white/20 text-slate-300 hover:text-white hover:bg-white/10">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateCita} disabled={isSubmittingCita} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-lg transition-transform active:scale-95">
              {isSubmittingCita ? 'Agendando...' : '✨ Agendar Cita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event detail sheet */}
      <EventDetailSheet event={selectedEvent} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
