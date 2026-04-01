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
} from 'lucide-react';
import Link from 'next/link';
import { getCalendarEvents, updateFiestaDate } from '@/app/actions/agenda';
import type { CalendarEvent } from '@/app/actions/agenda';
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
          <Link href={`/fiestas/nueva?fiestaId=${event.fiestaId}`}>
            <Button className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir planificador
            </Button>
          </Link>
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

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los eventos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
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

      {/* Event detail sheet */}
      <EventDetailSheet event={selectedEvent} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
