/** Un mes de la proyeccion. Se declara aca para no arrastrar el archivo de
 *  acciones -que es de servidor- adentro de una prueba comun. */
export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export type ResultadoFlujoCaja = {
  success: boolean;
  data?: CashFlowMonth[];
  error?: string;
  fuentesCaidas?: string[];
};

export type QueMostrar =
  | { modo: 'error'; mensaje: string }
  | { modo: 'numeros'; meses: CashFlowMonth[]; faltan: string[] };

/**
 * QUE MOSTRAR EN EL FLUJO DE CAJA, SEGUN LO QUE CONTESTO EL SERVIDOR.
 *
 * Vive aparte de la pantalla para que se pueda comprobar de verdad. La regla que
 * decide es una sola y es la que fallaba: **cero no es lo mismo que "no se pudo
 * leer"**. Seis meses en cero se ven igual que "no entro plata", asi que cuando no
 * se pudieron leer los datos NO se muestran numeros.
 */
export function queMostrarElFlujoDeCaja(resultado: ResultadoFlujoCaja): QueMostrar {
  if (!resultado.success || !resultado.data) {
    return {
      modo: 'error',
      mensaje: resultado.error || 'No se pudieron leer los datos del flujo de caja.',
    };
  }
  return { modo: 'numeros', meses: resultado.data, faltan: resultado.fuentesCaidas ?? [] };
}
