/**
 * Los límites de cambio de invitados que fija el contrato.
 *
 * El texto vive en `src/lib/contract-template.ts` y dice, palabra por palabra:
 *
 *   "La lista final deberá entregarse siete días antes. Podrá reducirse hasta
 *   10% de los invitados, ajustando solo servicios por persona, y aumentarse
 *   hasta 30%, sujeto a disponibilidad y pago previo. No habrá devolución por
 *   inasistencias."
 *
 * Esto estaba escrito en el contrato y en ningún lado del sistema, así que el
 * equipo podía bajar la cantidad de invitados un 40% sin que nada avisara, y
 * después no había con qué respaldar el cobro. Acá queda la regla en un solo
 * lugar, para que todas las pantallas digan lo mismo.
 */

/** Hasta cuánto se puede bajar la cantidad contratada. */
export const TOPE_DE_REDUCCION = 0.10;

/** Hasta cuánto se puede subir, sujeto a disponibilidad y pago previo. */
export const TOPE_DE_AUMENTO = 0.30;

/** Cuántos días antes del evento vence la lista final. */
export const DIAS_PARA_LISTA_FINAL = 7;

export type NivelDeAviso = 'ok' | 'atencion' | 'fuera-de-contrato';

export interface CambioDeInvitados {
  /** Cuántos invitados figuran en el presupuesto contratado. */
  contratados: number;
  /** A cuántos se quiere cambiar. */
  nuevos: number;
  /** Fecha del evento en formato AAAA-MM-DD. Si no se sabe, se omite. */
  fechaDelEvento?: string;
  /** Para calcular los días que faltan. Por defecto, hoy. */
  hoy?: Date;
}

export interface VeredictoDelCambio {
  nivel: NivelDeAviso;
  /** Mensaje ya escrito para mostrar en pantalla, en criollo. */
  mensaje: string;
  /** Cuántos invitados se pueden sacar como máximo. */
  minimoPermitido: number;
  /** Hasta cuántos se puede subir. */
  maximoPermitido: number;
  /** Días que faltan para el evento. null si no se sabe la fecha. */
  diasParaElEvento: number | null;
  /** true si ya pasó el plazo de los siete días. */
  listaFinalVencida: boolean;
}

function diasHasta(fechaDelEvento: string | undefined, hoy: Date): number | null {
  if (!fechaDelEvento) return null;
  const partes = fechaDelEvento.split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  const [anio, mes, dia] = partes;
  const evento = new Date(anio, mes - 1, dia);
  const referencia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((evento.getTime() - referencia.getTime()) / (1000 * 60 * 60 * 24));
}

export function validarCambioDeInvitados(cambio: CambioDeInvitados): VeredictoDelCambio {
  const { contratados, nuevos } = cambio;
  const hoy = cambio.hoy ?? new Date();

  // Se redondea a favor del cliente: con 100 contratados puede bajar a 90.
  const minimoPermitido = Math.floor(contratados * (1 - TOPE_DE_REDUCCION));
  const maximoPermitido = Math.floor(contratados * (1 + TOPE_DE_AUMENTO));
  const diasParaElEvento = diasHasta(cambio.fechaDelEvento, hoy);
  const listaFinalVencida =
    diasParaElEvento !== null && diasParaElEvento < DIAS_PARA_LISTA_FINAL;

  const base = { minimoPermitido, maximoPermitido, diasParaElEvento, listaFinalVencida };

  if (contratados <= 0) {
    return {
      ...base,
      nivel: 'ok',
      mensaje: 'Todavía no hay una cantidad contratada con la cual comparar.',
    };
  }

  if (nuevos < minimoPermitido) {
    const deMenos = contratados - nuevos;
    return {
      ...base,
      nivel: 'fuera-de-contrato',
      mensaje:
        `El contrato permite bajar hasta ${minimoPermitido} invitados (un 10% de los ${contratados} contratados). ` +
        `Estás sacando ${deMenos}. Por debajo de ese límite se cobra igual lo contratado: ` +
        'si el cliente lo pide, hay que dejarlo por escrito.',
    };
  }

  if (nuevos > maximoPermitido) {
    return {
      ...base,
      nivel: 'fuera-de-contrato',
      mensaje:
        `El contrato permite subir hasta ${maximoPermitido} invitados (un 30% sobre los ${contratados} contratados). ` +
        'Para pasarlo hay que confirmar disponibilidad con el salón y actualizar el presupuesto.',
    };
  }

  if (nuevos > contratados) {
    return {
      ...base,
      nivel: 'atencion',
      mensaje:
        `Suben ${nuevos - contratados} invitados. Entra dentro del contrato, pero va con pago previo: ` +
        'actualizá el presupuesto antes de la fiesta.',
    };
  }

  if (listaFinalVencida && nuevos !== contratados) {
    return {
      ...base,
      nivel: 'atencion',
      mensaje:
        `Faltan ${diasParaElEvento} días para la fiesta y la lista final vencía a los ${DIAS_PARA_LISTA_FINAL}. ` +
        'El cambio se puede hacer, pero confirmá con el salón y con la cocina.',
    };
  }

  return {
    ...base,
    nivel: 'ok',
    mensaje: `Dentro de lo contratado. Se puede mover entre ${minimoPermitido} y ${maximoPermitido} invitados.`,
  };
}
