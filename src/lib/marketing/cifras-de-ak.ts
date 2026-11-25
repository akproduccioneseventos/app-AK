export const FECHA_DE_INICIO = '2018-08-08' as const;
export const FIESTAS_BASE = 200;
const FECHA_MINIMA_FIESTAS_NUEVAS = '2027-01-01';
const ZONA_HORARIA_URUGUAY = 'America/Montevideo';

export interface FiestaParaCifraAK {
  id?: string;
  fecha?: string;
  configuracion?: {
    fechaEvento?: string;
  };
  estado?: string;
  status?: string;
  archived?: boolean;
  esMuestra?: boolean;
}

export interface CifrasDeAK {
  anios: number;
  fiestasRealizadas: number;
}

export interface EstadisticaPortadaItem {
  value: string;
  label: string;
  icon: string;
}

const montevideoDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA_URUGUAY,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDateInMontevideo(date: Date): string {
  const parts = montevideoDateFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function esFechaCalendarioValida(year: number, month: number, day: number): boolean {
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

function normalizarFechaISO(valor?: Date | string | null): string | null {
  if (!valor) return null;

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : formatDateInMontevideo(valor);
  }

  const trimmed = String(valor).trim();
  if (!trimmed) return null;

  const conBarras = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (conBarras) {
    const day = Number(conBarras[1]);
    const month = Number(conBarras[2]);
    const year = Number(conBarras[3]);
    if (!esFechaCalendarioValida(year, month, day)) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const soloIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soloIso) {
    const year = Number(soloIso[1]);
    const month = Number(soloIso[2]);
    const day = Number(soloIso[3]);
    return esFechaCalendarioValida(year, month, day) ? trimmed : null;
  }

  const conZona = /(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!conZona) {
    const prefijoIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)/);
    if (prefijoIso) {
      const year = Number(prefijoIso[1]);
      const month = Number(prefijoIso[2]);
      const day = Number(prefijoIso[3]);
      return esFechaCalendarioValida(year, month, day) ? `${prefijoIso[1]}-${prefijoIso[2]}-${prefijoIso[3]}` : null;
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  // Si viene guardado como medianoche UTC exacta de una fecha calendario, respetamos ese día.
  if (
    /T00:00:00(?:\.000)?Z$/i.test(trimmed) &&
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0
  ) {
    return parsed.toISOString().slice(0, 10);
  }

  return formatDateInMontevideo(parsed);
}

/**
 * Años cumplidos de AK Producciones desde el 8 de agosto de 2018 en hora de Uruguay.
 */
export function aniosDeAK(hoy?: Date | string): number {
  const hoyIso = normalizarFechaISO(hoy) ?? formatDateInMontevideo(new Date());
  const [y, m, d] = hoyIso.split('-').map(Number);
  const [iy, im, id] = FECHA_DE_INICIO.split('-').map(Number);

  let anios = y - iy;
  if (m < im || (m === im && d < id)) {
    anios -= 1;
  }
  return Math.max(0, anios);
}

function esFiestaExcluidaDelConteo(fiesta: FiestaParaCifraAK): boolean {
  if (!fiesta) return true;
  if (fiesta.esMuestra === true || fiesta.archived === true) return true;

  const id = String(fiesta.id || '').trim().toLowerCase();
  if (id === 'fiesta_muestra_auditor' || id.startsWith('demo_')) {
    return true;
  }

  const estado = String(fiesta.estado || '').trim().toLowerCase();
  const status = String(fiesta.status || '').trim().toLowerCase();
  if (estado === 'demo ak' || status === 'demo ak') {
    return true;
  }

  const patronExcluido = /(cancelad|rechazad|archivad|suspendid)/i;
  return patronExcluido.test(estado) || patronExcluido.test(status);
}

/**
 * Fiestas realizadas por AK: base histórica (200) más las fiestas reales
 * desde el 1/1/2027 cuya fecha ya pasó en hora de Uruguay.
 */
export function fiestasRealizadas(
  fiestas: ReadonlyArray<FiestaParaCifraAK> = [],
  hoy?: Date | string,
): number {
  const hoyIso = normalizarFechaISO(hoy) ?? formatDateInMontevideo(new Date());
  let nuevas = 0;

  for (const fiesta of fiestas) {
    if (esFiestaExcluidaDelConteo(fiesta)) continue;

    const rawFecha = fiesta.configuracion?.fechaEvento || fiesta.fecha;
    const fechaIso = normalizarFechaISO(rawFecha);
    if (!fechaIso) continue;

    if (fechaIso >= FECHA_MINIMA_FIESTAS_NUEVAS && fechaIso <= hoyIso) {
      nuevas += 1;
    }
  }

  return FIESTAS_BASE + nuevas;
}

export function resolverEstadisticasPortada<T extends EstadisticaPortadaItem>(
  stats: ReadonlyArray<T> | undefined,
  cifras: CifrasDeAK,
): EstadisticaPortadaItem[] {
  if (!stats || stats.length === 0) {
    return [
      { value: `+${cifras.fiestasRealizadas}`, label: 'Eventos realizados', icon: 'events' },
      { value: `+${cifras.anios}`, label: 'Años de experiencia', icon: 'years' },
      { value: 'Clientes', label: 'Satisfechos', icon: 'clients' },
    ];
  }

  return stats.map((stat) => {
    const labelLower = (stat.label || '').toLowerCase();
    const valueTrim = (stat.value || '').trim();

    const esStatAnios =
      stat.icon === 'years' ||
      labelLower.includes('año') ||
      labelLower.includes('ano') ||
      labelLower.includes('experiencia');

    if (esStatAnios) {
      const esValorDefaultAnios =
        /^\+?7(?:\s*a[ñn]os?)?$/i.test(valueTrim) ||
        valueTrim === `+${cifras.anios}` ||
        valueTrim === String(cifras.anios);

      return esValorDefaultAnios
        ? { ...stat, value: `+${cifras.anios}` }
        : stat;
    }

    const esStatEventos =
      stat.icon === 'events' ||
      labelLower.includes('evento') ||
      labelLower.includes('fiesta');

    if (esStatEventos) {
      const esValorDefaultEventos =
        /^\+?200(?:\s*(?:fiestas|eventos)(?:\s+realizados?)?)?$/i.test(valueTrim) ||
        valueTrim === `+${FIESTAS_BASE}` ||
        valueTrim === String(FIESTAS_BASE);

      return esValorDefaultEventos
        ? { ...stat, value: `+${cifras.fiestasRealizadas}` }
        : stat;
    }

    return stat;
  });
}
