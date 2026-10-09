import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';

/**
 * PONER AL DÍA LO QUE QUEDÓ ATRASADO EN LA APP (pedido del dueño, 9/10/2026).
 *
 * Al comparar su respaldo con lo que él sabe aparecieron cuatro cosas: fiestas que ya pasaron y
 * se cobraron pero figuran con todo el saldo, fiestas canceladas que siguen "en planificación",
 * fiestas cargadas dos veces (una copia vieja con los acentos rotos, sin presupuesto detrás) y
 * presupuestos de prueba. Esta función arma la lista; la pantalla la muestra con casillas y una
 * persona de contabilidad toca "Aplicar". Marcar cobrado o cancelar NO lo hace la app sola.
 */
export interface CobroAtrasado {
  presupuestoId: string;
  cliente: string;
  fecha: string;
  total: number;
  cobrado: number;
  saldo: number;
}
export interface FiestaVigente {
  fiestaId: string;
  presupuestoId?: string;
  nombre: string;
  cliente: string;
  fecha: string;
}
export interface Copia {
  fiestaId: string;
  nombre: string;
  fecha: string;
  igualA: string;
}
export interface PresupuestoDePrueba {
  presupuestoId: string;
  cliente: string;
  fecha: string;
  total: number;
}
export interface PonerAlDia {
  cobros: CobroAtrasado[];
  vigentes: FiestaVigente[];
  copias: Copia[];
  pruebas: PresupuestoDePrueba[];
}

const dia = (v?: string) => (v || '').slice(0, 10);
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ACTIVA = (estado?: string) => !/suspend|cancel|archiv|demo/i.test(estado || '');

/** Un texto guardado con los acentos rotos ("aÃ±os"), como en las copias viejas. */
export function tieneAcentosRotos(t: string): boolean {
  return /Ã[\u0080-¿]|Â[\u0080-¿]/.test(t);
}

export function armarPonerAlDia(
  presupuestos: Presupuesto[],
  fiestas: FiestaEnPlanificacion[],
  hoy: string,
): PonerAlDia {
  const vivos = presupuestos.filter((p) => !p.archived);
  const porId = new Map(vivos.map((p) => [p.id, p]));
  const conFiesta = new Set(fiestas.map((f) => f.presupuestoId).filter(Boolean) as string[]);

  const cobros: CobroAtrasado[] = [];
  for (const p of vivos) {
    const fecha = dia(p.eventoFecha);
    if (!fecha || fecha >= hoy) continue;
    if (!conFiesta.has(p.id) && p.estado !== 'Aceptado') continue;
    const r = getBudgetPaymentSummary(p);
    if (r.balance <= 0) continue;
    cobros.push({ presupuestoId: p.id, cliente: p.clienteNombre || '—', fecha, total: r.total, cobrado: r.paid, saldo: r.balance });
  }

  // Las fiestas que valen: tienen un presupuesto vivo detrás. Las otras, si hay una gemela con el
  // mismo día y el mismo cliente, son copias.
  const reales = fiestas.filter((f) => f.presupuestoId && porId.has(f.presupuestoId) && ACTIVA(f.estado));
  const vigentes: FiestaVigente[] = reales
    .map((f) => ({
      fiestaId: f.id,
      presupuestoId: f.presupuestoId,
      nombre: f.configuracion?.nombreEvento || 'Fiesta',
      cliente: porId.get(f.presupuestoId!)?.clienteNombre || '',
      fecha: dia(f.configuracion?.fechaEvento),
    }))
    .filter((f) => f.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const copias: Copia[] = [];
  for (const f of fiestas) {
    if (f.presupuestoId && porId.has(f.presupuestoId)) continue;
    if (!ACTIVA(f.estado)) continue;
    const fecha = dia(f.configuracion?.fechaEvento);
    const nombre = f.configuracion?.nombreEvento || '';
    const palabras = sinAcentos(nombre).split(/[^a-z]+/).filter((w) => w.length >= 4);
    const gemela = reales.find((r) => {
      if (dia(r.configuracion?.fechaEvento) !== fecha) return false;
      const cliente = sinAcentos(porId.get(r.presupuestoId!)?.clienteNombre || '');
      return palabras.some((w) => cliente.includes(w));
    });
    if (gemela) copias.push({ fiestaId: f.id, nombre, fecha, igualA: gemela.configuracion?.nombreEvento || gemela.id });
  }

  const pruebas: PresupuestoDePrueba[] = vivos
    .filter((p) => p.estado === 'Pendiente Verificación' && !conFiesta.has(p.id) && dia(p.eventoFecha) && dia(p.eventoFecha) < hoy)
    .map((p) => ({ presupuestoId: p.id, cliente: p.clienteNombre || '—', fecha: dia(p.eventoFecha), total: getBudgetPaymentSummary(p).total }));

  return { cobros, vigentes, copias, pruebas };
}
