'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { EVENT_TIMEZONE, parseEventDateTimeUruguay, parseEventHourParts } from '@/lib/public-experience/event-date';

export interface AddToCalendarButtonProps {
  eventName: string;
  startDate: string; // Fecha ISO o calendario (YYYY-MM-DD / DD/MM/YYYY / ISO)
  horaEvento?: string;
  durationHours?: number;
  location?: string;
  description?: string;
  primaryColor?: string;
}

const uyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatCalDateUruguay(date: Date): string {
  const parts = uyFormatter.formatToParts(date);
  const find = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const rawHour = find('hour');
  const hour = rawHour === '24' ? '00' : rawHour.padStart(2, '0');
  return `${find('year')}${find('month').padStart(2, '0')}${find('day').padStart(2, '0')}T${hour}${find('minute').padStart(2, '0')}${find('second').padStart(2, '0')}`;
}

function resolveStartAndEnd(props: Pick<AddToCalendarButtonProps, 'startDate' | 'horaEvento' | 'durationHours'>): { start: string; end: string } {
  const rawDate = String(props.startDate || '').trim();
  const hasValidHour = Boolean(parseEventHourParts(props.horaEvento));
  const hasExplicitNonMidnightTime = /T(\d{2}):(\d{2})/.test(rawDate) && !/T00:00/.test(rawDate);
  const effectiveHour = hasValidHour
    ? props.horaEvento
    : hasExplicitNonMidnightTime
      ? undefined
      : '20:00';

  const parsedStart = parseEventDateTimeUruguay(rawDate, effectiveHour) ?? new Date(rawDate);
  const safeStart = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const durationHours = Number.isFinite(props.durationHours) && (props.durationHours ?? 0) > 0
    ? Number(props.durationHours)
    : 4;
  const safeEnd = new Date(safeStart.getTime() + durationHours * 60 * 60 * 1000);

  return {
    start: formatCalDateUruguay(safeStart),
    end: formatCalDateUruguay(safeEnd),
  };
}

export function buildGoogleCalUrl(props: AddToCalendarButtonProps): string {
  const { start, end } = resolveStartAndEnd(props);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.eventName,
    dates: `${start}/${end}`,
    ctz: EVENT_TIMEZONE,
  });
  if (props.description) params.set('details', props.description);
  if (props.location) params.set('location', props.location);
  return `https://www.google.com/calendar/render?${params.toString()}`.replace(`${start}%2F${end}`, `${start}/${end}`);
}

export function buildIcsContent(props: AddToCalendarButtonProps): string {
  const { start, end } = resolveStartAndEnd(props);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AK Producciones//AK App//ES',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${EVENT_TIMEZONE}:${start}`,
    `DTEND;TZID=${EVENT_TIMEZONE}:${end}`,
    `SUMMARY:${props.eventName}`,
    props.location ? `LOCATION:${props.location}` : '',
    props.description ? `DESCRIPTION:${props.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function downloadIcs(props: AddToCalendarButtonProps) {
  const ics = buildIcsContent(props);

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = props.eventName.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_').replace(/^_|_$/g, '') || 'evento';
  a.download = `${safeName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AddToCalendarButton(props: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = props.primaryColor || '#8b5cf6';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm text-white shadow-md transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: color }}
      >
        <Calendar className="w-4 h-4" />
        Agendar
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden min-w-[190px]">
          <a
            href={buildGoogleCalUrl(props)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect width="24" height="24" rx="5" fill="#4285F4" />
              <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Google Calendar
          </a>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
            onClick={() => { downloadIcs(props); setOpen(false); }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect width="24" height="24" rx="5" fill="#1C1C1E" />
              <path d="M12 6v8m0 0l-3-3m3 3l3-3M7 18h10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
