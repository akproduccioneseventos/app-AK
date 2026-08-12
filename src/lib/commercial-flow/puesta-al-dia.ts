import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { parseEventDate } from '@/lib/public-experience/event-date';

/**
 * Puesta al día de los eventos que ya pasaron.
 *
 * El control de números que ya existe mira que las cuentas cierren y que los
 * vínculos apunten a algo que existe. Esto mira otra cosa: **el paso del
 * tiempo**. Una fiesta que ocurrió hace tres meses y sigue figurando como
 * próxima ensucia la agenda, cuenta mal en los tableros y esconde que quedó
 * plata sin cobrar.
 *
 * Es de sólo lectura: arma la lista de lo que está desacomodado y a dónde ir
 * para resolverlo. No cambia nada por su cuenta, porque cada caso puede tener un
 * motivo que sólo sabe el dueño.
 */

export type PuestaAlDiaGravedad = 'cobrar' | 'ordenar';

/** Año de una fecha guardada como texto (`2026-12-15`) sin correrla de día. */
function anioDe(fecha: string | undefined | null): number | null {
  const parseada = parseEventDate(fecha ?? undefined);
  return parseada ? parseada.getFullYear() : null;
}

export interface PuestaAlDiaItem {
  gravedad: PuestaAlDiaGravedad;
  fiestaId: string;
  nombre: string;
  fecha: string;
  /** Qué le pasa, escrito para leer sin saber de programación. */
  queLePasa: string;
  /** Qué conviene hacer. */
  queHacer: string;
  /** Plata pendiente, cuando corresponde. */
  montoPendiente?: number;
}

export interface PuestaAlDiaReporte {
  totales: {
    fiestasRevisadas: number;
    yaPasaron: number;
    paraCobrar: number;
    paraOrdenar: number;
    plataPendiente: number;
  };
  items: PuestaAlDiaItem[];
}

/** Una fiesta ya pasó si su día quedó atrás. El mismo día todavía no cuenta. */
function yaPaso(fechaEvento: string | undefined, hoy: Date): boolean {
  const fecha = parseEventDate(fechaEvento);
  if (!fecha) return false;
  const finDelDia = new Date(fecha);
  finDelDia.setHours(23, 59, 59, 999);
  return finDelDia.getTime() < hoy.getTime();
}

function diasDesde(fechaEvento: string | undefined, hoy: Date): number {
  const fecha = parseEventDate(fechaEvento);
  if (!fecha) return 0;
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

function nombreDe(fiesta: FiestaEnPlanificacion): string {
  return fiesta.configuracion?.nombreEvento?.trim() || 'Evento sin nombre';
}

export function buildPuestaAlDiaReporte(
  fiestas: FiestaEnPlanificacion[],
  presupuestos: Presupuesto[],
  hoy: Date = new Date(),
): PuestaAlDiaReporte {
  const items: PuestaAlDiaItem[] = [];
  const presupuestoPorId = new Map(presupuestos.map((p) => [p.id, p]));
  let yaPasaron = 0;

  for (const fiesta of fiestas) {
    const fecha = fiesta.configuracion?.fechaEvento;
    if (!yaPaso(fecha, hoy)) continue;
    yaPasaron += 1;

    const nombre = nombreDe(fiesta);
    const dias = diasDesde(fecha, hoy);
    const base = { fiestaId: fiesta.id, nombre, fecha: fecha ?? '' };

    // 1. Plata primero: la fiesta se hizo y todavía queda saldo sin cobrar.
    const presupuesto = fiesta.presupuestoId ? presupuestoPorId.get(fiesta.presupuestoId) : undefined;
    if (presupuesto) {
      const resumen = getBudgetPaymentSummary(presupuesto);
      if (resumen.balance > 0) {
        items.push({
          ...base,
          gravedad: 'cobrar',
          queLePasa: `La fiesta se hizo hace ${dias} día(s) y en la aplicación figura saldo sin cobrar.`,
          // Los eventos viejos se cargaron para tener el registro, con sus precios
          // de entonces, y muchas veces sin los pagos cargados uno por uno. Por eso
          // esto se plantea como algo para mirar, no como una deuda confirmada.
          queHacer: 'Si es un evento viejo cargado para el registro, puede que falten los pagos: revisalo antes de reclamar nada.',
          montoPendiente: resumen.balance,
        });
      }
    }

    // 2. La fiesta ya pasó pero sigue figurando entre las próximas.
    const estado = String(fiesta.estado ?? '').toLowerCase();
    const yaCerrada = estado.includes('finaliz') || estado.includes('cerrad') || estado.includes('archiv');
    if (!yaCerrada) {
      items.push({
        ...base,
        gravedad: 'ordenar',
        queLePasa: `Pasó hace ${dias} día(s) y sigue figurando como evento activo.`,
        queHacer: 'Cerrala o archivala para que salga de la agenda y de los tableros.',
      });
    }

    // 3. Trabajo operativo abierto en un evento que ya pasó. El presupuesto
    // sincroniza la organización (personal, tareas), así que un evento viejo
    // cargado para el registro puede dejar gente asignada y tareas pendientes en
    // fechas que ya fueron, ensuciando la operación de lo que sí viene.
    const personal = fiesta.personalAsignado ?? [];
    const tareasAbiertas = (fiesta.clientChecklist ?? []).filter((t: { completada?: boolean }) => !t?.completada);
    if (!yaCerrada && (personal.length > 0 || tareasAbiertas.length > 0)) {
      const partes: string[] = [];
      if (personal.length > 0) partes.push(`${personal.length} persona(s) del equipo asignada(s)`);
      if (tareasAbiertas.length > 0) partes.push(`${tareasAbiertas.length} tarea(s) sin terminar`);
      items.push({
        ...base,
        gravedad: 'ordenar',
        queLePasa: `Es un evento que ya pasó y todavía tiene ${partes.join(' y ')}.`,
        queHacer: 'Al cerrarlo se libera al equipo y deja de aparecer entre lo pendiente.',
      });
    }

    // 4. Se hizo sin presupuesto vinculado: no hay con qué controlar la plata.
    if (!fiesta.presupuestoId) {
      items.push({
        ...base,
        gravedad: 'ordenar',
        queLePasa: 'Es un evento que ya se hizo y no tiene ningún presupuesto vinculado.',
        queHacer: 'Vinculale su presupuesto, si no la fiesta no suma en las cuentas del negocio.',
      });
    }
  }

  // 5. Contratos viejos cuya fiesta todavía no llegó: les corresponde el ajuste
  // anual y puede estar sin marcar.
  //
  // Es el caso de los eventos que se contrataron hace tiempo, con los precios de
  // entonces, y se celebran en un año posterior. Si el presupuesto no tiene el
  // ajuste anual activo, la aplicación cobra el precio viejo: son miles de pesos
  // por contrato que se pierden sin que nadie lo note.
  for (const presupuesto of presupuestos) {
    const contratado = presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
    if (!contratado) continue;
    if (yaPaso(presupuesto.eventoFecha, hoy)) continue;
    if (presupuesto.ajusteAnualActivo) continue;

    const anioContrato = anioDe(presupuesto.timestamp ? String(presupuesto.timestamp).slice(0, 10) : undefined);
    const anioEvento = anioDe(presupuesto.eventoFecha);
    if (anioContrato === null || anioEvento === null || anioEvento <= anioContrato) continue;

    const anios = anioEvento - anioContrato;
    const porcentaje = presupuesto.ajusteAnualPorcentaje ?? 15;
    const resumen = getBudgetPaymentSummary(presupuesto);
    const seDejaDeCobrar = Math.round(resumen.total * (Math.pow(1 + porcentaje / 100, anios) - 1));

    items.push({
      gravedad: 'cobrar',
      fiestaId: '',
      nombre: presupuesto.clienteNombre?.trim() || `Presupuesto ${presupuesto.numero ?? presupuesto.id}`,
      fecha: presupuesto.eventoFecha ?? '',
      queLePasa: `Se contrató en ${anioContrato} y la fiesta es en ${anioEvento}, pero no tiene puesto el ajuste anual.`,
      queHacer: `Activale el ajuste anual: se está cobrando el precio de ${anioContrato}.`,
      montoPendiente: seDejaDeCobrar > 0 ? seDejaDeCobrar : undefined,
    });
  }

  // 6. Presupuestos cobrados o aceptados que nunca se convirtieron en evento.
  const fiestaPorPresupuesto = new Set(fiestas.map((f) => f.presupuestoId).filter(Boolean) as string[]);
  for (const presupuesto of presupuestos) {
    const contratado = presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
    if (!contratado || fiestaPorPresupuesto.has(presupuesto.id)) continue;
    if (!yaPaso(presupuesto.eventoFecha, hoy)) continue;

    items.push({
      gravedad: 'ordenar',
      fiestaId: '',
      nombre: presupuesto.clienteNombre?.trim() || `Presupuesto ${presupuesto.numero ?? presupuesto.id}`,
      fecha: presupuesto.eventoFecha ?? '',
      queLePasa: 'Está aceptado y la fecha ya pasó, pero nunca se creó el evento.',
      queHacer: 'Fijate si la fiesta se hizo y quedó sin cargar, o si el presupuesto tendría que estar rechazado.',
    });
  }

  // Primero lo que es plata, y dentro de eso lo más viejo.
  items.sort((a, b) => {
    if (a.gravedad !== b.gravedad) return a.gravedad === 'cobrar' ? -1 : 1;
    return String(a.fecha).localeCompare(String(b.fecha));
  });

  return {
    totales: {
      fiestasRevisadas: fiestas.length,
      yaPasaron,
      paraCobrar: items.filter((i) => i.gravedad === 'cobrar').length,
      paraOrdenar: items.filter((i) => i.gravedad === 'ordenar').length,
      plataPendiente: Math.round(items.reduce((suma, i) => suma + (i.montoPendiente ?? 0), 0)),
    },
    items,
  };
}
