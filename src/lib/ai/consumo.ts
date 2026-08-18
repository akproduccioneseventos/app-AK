/**
 * Cuánto se está gastando en inteligencia artificial este mes.
 *
 * Los topes que ya existían (tres intentos por invitado, ciento cincuenta por hora
 * por estación) frenan el abuso de una persona, pero **nadie avisaba cuánto se
 * lleva consumido en el mes**. Con cuatro fiestas grandes seguidas eso se nota
 * recién en la factura, cuando ya está gastado.
 *
 * Acá viven las cuentas puras, sin tocar archivos, para poder probarlas. El
 * guardado y la lectura están en `consumo-servidor.ts`.
 */

/** Las funciones que consumen plata de verdad: las que generan imágenes. */
export type FuncionConCosto =
  | 'touchpix'
  | 'espejo-magico'
  | 'remarketing'
  | 'vendedor-virtual'
  | 'seguimiento-comercial'
  | 'material-post-evento'
  | 'revision-diaria'
  | 'generador-textos-marketing';


/**
 * Costo estimado por generación, en pesos uruguayos.
 *
 * Es una estimación, no la factura: sirve para ver la tendencia y para frenar
 * antes de que se dispare. Si el proveedor cambia el precio, se cambia acá.
 */
export const COSTO_ESTIMADO_UYU: Record<FuncionConCosto, number> = {
  touchpix: 6,
  'espejo-magico': 6,
  remarketing: 2,
  'vendedor-virtual': 4,
  // Solo texto y a pedido del equipo, apretando un boton: sale mucho menos que
  // una foto con efecto. El de post-evento devuelve tres textos de una.
  'seguimiento-comercial': 1,
  'material-post-evento': 2,
  'revision-diaria': 2,
  'generador-textos-marketing': 2,
};

/** Cuánto se avisa antes de llegar al tope. */
export const AVISO_A_PARTIR_DE = 0.8;

export type ConteoPorFuncion = Partial<Record<FuncionConCosto, number>>;

export interface ConsumoDelMes {
  mes: string;
  porFuncion: ConteoPorFuncion;
  generaciones: number;
  gastadoUYU: number;
}

export type EstadoDelGasto = 'sin-tope' | 'tranquilo' | 'cerca-del-tope' | 'pasado';

export interface ResumenDeGasto extends ConsumoDelMes {
  topeUYU: number;
  estado: EstadoDelGasto;
  porcentaje: number;
  /** Cuando está pasado, las funciones que generan imágenes dejan de gastar. */
  frenado: boolean;
  mensaje: string;
}

/** El mes en curso, como '2026-08'. */
export function claveDelMes(fecha: Date = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}`;
}

export function calcularConsumo(mes: string, porFuncion: ConteoPorFuncion): ConsumoDelMes {
  let generaciones = 0;
  let gastadoUYU = 0;

  for (const [funcion, cantidad] of Object.entries(porFuncion ?? {})) {
    const veces = Number(cantidad);
    if (!Number.isFinite(veces) || veces <= 0) continue;
    generaciones += veces;
    gastadoUYU += veces * (COSTO_ESTIMADO_UYU[funcion as FuncionConCosto] ?? 0);
  }

  return { mes, porFuncion: porFuncion ?? {}, generaciones, gastadoUYU };
}

function redondearPesos(valor: number): number {
  return Math.round(valor);
}

export function resumirGasto(consumo: ConsumoDelMes, topeUYU: number): ResumenDeGasto {
  const tope = Number.isFinite(topeUYU) && topeUYU > 0 ? topeUYU : 0;
  const gastado = redondearPesos(consumo.gastadoUYU);

  if (tope === 0) {
    return {
      ...consumo,
      gastadoUYU: gastado,
      topeUYU: 0,
      estado: 'sin-tope',
      porcentaje: 0,
      frenado: false,
      mensaje:
        consumo.generaciones === 0
          ? 'Este mes todavía no se usó la inteligencia artificial de las fotos.'
          : `Este mes van ${consumo.generaciones} fotos con efectos, unos $${gastado}. No hay tope puesto.`,
    };
  }

  const porcentaje = Math.round((gastado / tope) * 100);

  if (gastado >= tope) {
    return {
      ...consumo,
      gastadoUYU: gastado,
      topeUYU: tope,
      estado: 'pasado',
      porcentaje,
      frenado: true,
      mensaje: `Se llegó al tope del mes ($${tope}). Los efectos de las fotos quedan apagados hasta el mes que viene o hasta que subas el tope. La fotocabina y el espejo siguen andando: sacan la foto igual, sin el efecto.`,
    };
  }

  if (porcentaje >= AVISO_A_PARTIR_DE * 100) {
    return {
      ...consumo,
      gastadoUYU: gastado,
      topeUYU: tope,
      estado: 'cerca-del-tope',
      porcentaje,
      frenado: false,
      mensaje: `Vas por $${gastado} de $${tope} este mes (${porcentaje}%). Si tenés fiestas grandes esta semana, conviene subir el tope antes.`,
    };
  }

  return {
    ...consumo,
    gastadoUYU: gastado,
    topeUYU: tope,
    estado: 'tranquilo',
    porcentaje,
    frenado: false,
    mensaje: `Vas por $${gastado} de $${tope} este mes (${porcentaje}%).`,
  };
}
