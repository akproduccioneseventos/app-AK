/**
 * Agenda del personal: choques de horario entre eventos.
 *
 * Vive en `lib` y no en el archivo de acciones porque son funciones comunes y
 * sincronicas. Un archivo marcado como `'use server'` solo puede exportar
 * funciones asincronas; exportar estas desde alli rompe la guarda del proyecto y
 * Next las trata como acciones de servidor, que no lo son.
 */
export interface ConflictoAgendaEmpleado {
  nombreEvento: string;
  horaInicio: string;
  horaFin: string;
  solapaHorario: boolean;
}

export interface ResultadoAgendaEmpleado {
  mismoDiaNoSolapado: ConflictoAgendaEmpleado[];
  solapadas: ConflictoAgendaEmpleado[];
  horarioSinConfirmar: ConflictoAgendaEmpleado[];
}

export interface FiestaTimeRange {
  startMs: number;
  endMs: number;
  horaInicio: string;
  horaFin: string;
  fechaStr: string;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MONTEVIDEO_UTC_OFFSET_MINUTES = 3 * 60;

function localDateTimeToUtcMs(fecha: string, hora: string): number | null {
  const dateMatch = DATE_ONLY_PATTERN.exec(fecha);
  const timeMatch = TIME_PATTERN.exec(hora);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const dateOnlyMs = Date.UTC(year, month - 1, day);
  const normalized = new Date(dateOnlyMs);

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return null;
  }

  // Toda la agenda AK usa la hora local de Uruguay (UTC-3).
  return dateOnlyMs + (hour * 60 + minute + MONTEVIDEO_UTC_OFFSET_MINUTES) * 60_000;
}

export function getFiestaTimeRange(fiesta: any): FiestaTimeRange | null {
  const rawFecha = String(fiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
  const horaInicio = String(fiesta?.configuracion?.horaInicio ?? '');
  const horaFin = String(fiesta?.configuracion?.horaFin ?? '');
  const startMs = localDateTimeToUtcMs(rawFecha, horaInicio);
  let endMs = localDateTimeToUtcMs(rawFecha, horaFin);

  if (startMs === null || endMs === null || endMs === startMs) return null;
  if (endMs < startMs) endMs += 24 * 60 * 60 * 1000;

  return { startMs, endMs, horaInicio, horaFin, fechaStr: rawFecha };
}

export function evaluarAgendaEmpleado(
  fiestas: any[],
  empleadoId: string,
  targetFiesta: any,
  exceptoFiestaId?: string,
): ResultadoAgendaEmpleado {
  const dia = String(targetFiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
  const targetRange = getFiestaTimeRange(targetFiesta);
  const mismoDiaNoSolapado: ConflictoAgendaEmpleado[] = [];
  const solapadas: ConflictoAgendaEmpleado[] = [];
  const horarioSinConfirmar: ConflictoAgendaEmpleado[] = [];

  for (const fiesta of fiestas) {
    if (exceptoFiestaId && fiesta?.id === exceptoFiestaId) continue;
    const tieneEmpleado = (fiesta?.personalAsignado ?? []).some(
      (personal: any) => personal?.empleadoId === empleadoId,
    );
    if (!tieneEmpleado) continue;

    const fechaExistente = String(fiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
    const existingRange = getFiestaTimeRange(fiesta);
    const conflictoBase = {
      nombreEvento: String(fiesta?.configuracion?.nombreEvento || 'Evento sin nombre'),
      horaInicio: existingRange?.horaInicio || 'A confirmar',
      horaFin: existingRange?.horaFin || 'A confirmar',
    };

    if (targetRange && existingRange) {
      const solapa = targetRange.startMs < existingRange.endMs && existingRange.startMs < targetRange.endMs;
      if (solapa) {
        solapadas.push({ ...conflictoBase, solapaHorario: true });
      } else if (fechaExistente === dia) {
        mismoDiaNoSolapado.push({ ...conflictoBase, solapaHorario: false });
      }
    } else if (fechaExistente === dia) {
      horarioSinConfirmar.push({ ...conflictoBase, solapaHorario: false });
    }
  }

  return { mismoDiaNoSolapado, solapadas, horarioSinConfirmar };
}

