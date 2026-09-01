import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La hoja que se imprime y se pega en la cocina la noche del evento.
 *
 * Los datos ya estaban todos en la app, pero **agrupados para COMPRAR**: la lista
 * de compras junta por proveedor, que sirve para ir al mercado y no sirve para
 * cocinar. En la cocina la pregunta es otra: *cuántas entradas salen, cuántos
 * principales, cuántos postres, y cuántos platos especiales aparte*.
 *
 * Esto arma eso, con dos cuidados que ya costaron caro en otras pantallas:
 *
 * 1. **Las porciones se cuentan igual que en la lista de compras**: los platos
 *    principales se cuentan por adultos, los infantiles por chicos y el resto por
 *    todos. Si dos pantallas dan números distintos, no se le puede creer a
 *    ninguna.
 * 2. **Las personas con restricciones se cuentan por PERSONA, no por fila.** Un
 *    invitado puede venir con acompañantes: contando filas, una familia de cinco
 *    celíacos figuraba como un solo plato especial y cuatro se quedaban sin comer.
 */

export type MomentoDelServicio = 'Entrada' | 'Plato Principal' | 'Postre' | 'Menú Infantil' | 'Otros';

export interface PlatoDeLaNoche {
  nombre: string;
  momento: MomentoDelServicio;
  porciones: number;
  /** Para qué grupo se cuenta: sirve para que el cocinero entienda el número. */
  paraQuien: 'todos' | 'adultos' | 'chicos';
  alergenos?: string[];
}

export interface PlatoEspecial {
  restriccion: string;
  personas: number;
  detalle?: string;
}

export interface HojaDeCocina {
  nombreDeLaFiesta: string;
  fecha?: string;
  adultos: number;
  chicos: number;
  totalContratado: number;
  /** Confirmados de verdad, si la fiesta lleva lista de invitados. */
  totalConfirmado: number;
  platos: PlatoDeLaNoche[];
  especiales: PlatoEspecial[];
  /** Avisos en criollo para el que arma la hoja: qué falta cargar. */
  avisos: string[];
}

const ORDEN: MomentoDelServicio[] = ['Entrada', 'Plato Principal', 'Menú Infantil', 'Postre', 'Otros'];

function momentoDe(categoria: string, nombre: string): MomentoDelServicio {
  const c = `${categoria} ${nombre}`.toLowerCase();
  if (c.includes('infantil') || c.includes('adolescente') || c.includes('niñ') || c.includes('nin')) {
    return 'Menú Infantil';
  }
  if (c.includes('entrada')) return 'Entrada';
  if (c.includes('postre') || c.includes('torta')) return 'Postre';
  if (c.includes('principal')) return 'Plato Principal';
  return 'Otros';
}

/** Cuenta personas, no filas: un invitado puede venir con acompañantes. */
function contarPersonas(invitados: Array<{ partySize?: number }>): number {
  return invitados.reduce((suma, g) => suma + (g.partySize || 1), 0);
}

export function armarHojaDeCocina(
  fiesta: FiestaEnPlanificacion,
  platosDelPresupuesto: Array<{ nombre: string; categoria?: string; alergenos?: string[] }>,
  invitadosPorGrupo: { adultos: number; chicos: number },
): HojaDeCocina {
  const { adultos, chicos } = invitadosPorGrupo;
  const total = adultos + chicos;
  const avisos: string[] = [];

  const platos: PlatoDeLaNoche[] = platosDelPresupuesto.map((p) => {
    const momento = momentoDe(p.categoria || '', p.nombre);
    // La misma regla que usa la lista de compras, para que los numeros coincidan.
    const paraQuien: PlatoDeLaNoche['paraQuien'] =
      momento === 'Menú Infantil' ? 'chicos' : momento === 'Plato Principal' ? 'adultos' : 'todos';
    const porciones = paraQuien === 'chicos' ? chicos : paraQuien === 'adultos' ? adultos : total;
    return { nombre: p.nombre, momento, porciones, paraQuien, alergenos: p.alergenos };
  });

  platos.sort((a, b) => ORDEN.indexOf(a.momento) - ORDEN.indexOf(b.momento));

  const invitados = fiesta.invitados ?? [];
  const confirmados = invitados.filter((g) => g.rsvp === 'Confirmado');
  const conRestriccion = confirmados.filter(
    (g) => g.dietaryRestriction && g.dietaryRestriction !== 'Ninguna',
  );

  const porRestriccion = new Map<string, { personas: number; detalles: string[] }>();
  for (const g of conRestriccion) {
    const clave = String(g.dietaryRestriction);
    const actual = porRestriccion.get(clave) || { personas: 0, detalles: [] };
    actual.personas += g.partySize || 1;
    if (g.alergiasEspecificas) actual.detalles.push(g.alergiasEspecificas);
    porRestriccion.set(clave, actual);
  }

  const especiales: PlatoEspecial[] = [...porRestriccion.entries()]
    .map(([restriccion, d]) => ({
      restriccion,
      personas: d.personas,
      detalle: d.detalles.length > 0 ? [...new Set(d.detalles)].join('; ') : undefined,
    }))
    .sort((a, b) => b.personas - a.personas);

  if (platos.length === 0) {
    avisos.push('Todavía no hay platos cargados en el presupuesto: la hoja sale vacía.');
  }
  if (total === 0) {
    avisos.push('No hay cantidad de invitados cargada: no se pueden calcular las porciones.');
  }
  if (invitados.length > 0 && confirmados.length === 0) {
    avisos.push('Hay invitados cargados pero ninguno confirmó todavía: los platos especiales pueden cambiar.');
  }

  return {
    nombreDeLaFiesta: fiesta.configuracion?.nombreEvento || 'Fiesta',
    fecha: fiesta.configuracion?.fechaEvento,
    adultos,
    chicos,
    totalContratado: total,
    totalConfirmado: contarPersonas(confirmados),
    platos,
    especiales,
    avisos,
  };
}
