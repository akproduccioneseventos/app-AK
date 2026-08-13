import { calcularGananciaDeEvento, type GananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { parseEventDate } from '@/lib/public-experience/event-date';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * Comparar la ganancia entre todas las fiestas.
 *
 * El Analizador de Rentabilidad ya muestra cuánto dejó **una** fiesta, pero de a
 * una por vez. La pregunta que decide qué conviene vender es otra: ¿los casamientos
 * dejan más que los quince? ¿Este mes anduvo mejor que el anterior? Eso no se podía
 * contestar.
 *
 * Las cuentas de cada fiesta salen de `calcularGananciaDeEvento`, que es el único
 * lugar donde vive esa suma. Acá sólo se agrupa.
 */

export interface FiestaConGanancia {
  id: string;
  nombre: string;
  tipo: string;
  fecha?: string;
  /** El año y mes del evento, como '2026-08'. Vacío si no tiene fecha. */
  mes: string;
  ganancia: GananciaDeEvento;
}

export interface ResumenDeGrupo {
  clave: string;
  cantidad: number;
  ingreso: number;
  costoReal: number;
  gananciaReal: number;
  /** Margen del grupo entero, no el promedio de los márgenes. */
  margenReal: number;
  /** Cuánto deja en promedio una fiesta de este grupo. */
  gananciaPromedio: number;
}

export interface Comparativa {
  fiestas: FiestaConGanancia[];
  porTipo: ResumenDeGrupo[];
  porMes: ResumenDeGrupo[];
  total: ResumenDeGrupo;
  /** Cuántas fiestas no tienen ningún gasto cargado todavía. */
  sinGastoCargado: number;
}

const SIN_TIPO = 'Sin tipo';

function mesDe(fecha?: string): string {
  const dia = parseEventDate(fecha);
  if (!dia) return '';
  return `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}`;
}

function resumir(clave: string, fiestas: FiestaConGanancia[]): ResumenDeGrupo {
  const ingreso = fiestas.reduce((s, f) => s + f.ganancia.ingreso, 0);
  const costoReal = fiestas.reduce((s, f) => s + f.ganancia.costoReal, 0);
  const gananciaReal = ingreso - costoReal;

  return {
    clave,
    cantidad: fiestas.length,
    ingreso,
    costoReal,
    gananciaReal,
    // El margen del grupo se calcula sobre los totales. Promediar los porcentajes
    // de cada fiesta le daría el mismo peso a una fiesta de diez personas que a
    // una de trescientas, y el número saldría mal.
    margenReal: ingreso > 0 ? (gananciaReal / ingreso) * 100 : 0,
    gananciaPromedio: fiestas.length > 0 ? gananciaReal / fiestas.length : 0,
  };
}

function agrupar(
  fiestas: FiestaConGanancia[],
  clavePara: (f: FiestaConGanancia) => string,
): ResumenDeGrupo[] {
  const grupos = new Map<string, FiestaConGanancia[]>();
  for (const fiesta of fiestas) {
    const clave = clavePara(fiesta);
    if (!clave) continue;
    const actual = grupos.get(clave);
    if (actual) actual.push(fiesta);
    else grupos.set(clave, [fiesta]);
  }
  return [...grupos.entries()].map(([clave, delGrupo]) => resumir(clave, delGrupo));
}

/**
 * @param fiestas  Todas las fiestas, incluidas las archivadas: la comparación
 *                 sirve justamente para mirar hacia atrás.
 */
export function compararGanancias(fiestas: FiestaEnPlanificacion[]): Comparativa {
  const conGanancia: FiestaConGanancia[] = (fiestas ?? [])
    .map((fiesta) => {
      const ganancia = calcularGananciaDeEvento(fiesta?.gestionCostos, fiesta?.pagosProveedores);
      return {
        id: String(fiesta?.id ?? ''),
        nombre: String(fiesta?.configuracion?.nombreEvento || 'Fiesta sin nombre'),
        tipo: String(fiesta?.configuracion?.tipoCelebracion || SIN_TIPO),
        fecha: fiesta?.configuracion?.fechaEvento,
        mes: mesDe(fiesta?.configuracion?.fechaEvento),
        ganancia,
      };
    })
    // Una fiesta sin nada cargado no dice nada y ensucia los promedios.
    .filter((f) => f.ganancia.ingreso > 0 || f.ganancia.costoEstimado > 0);

  const porGanancia = [...conGanancia].sort(
    (a, b) => b.ganancia.gananciaReal - a.ganancia.gananciaReal,
  );

  return {
    fiestas: porGanancia,
    porTipo: agrupar(conGanancia, (f) => f.tipo).sort((a, b) => b.gananciaReal - a.gananciaReal),
    porMes: agrupar(conGanancia, (f) => f.mes).sort((a, b) => a.clave.localeCompare(b.clave)),
    total: resumir('Todas', conGanancia),
    sinGastoCargado: conGanancia.filter((f) => !f.ganancia.hayGastoCargado).length,
  };
}
