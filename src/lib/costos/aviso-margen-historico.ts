import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';

export interface ParametrosComparativa {
  tipoEvento?: string;
  salon?: string;
  invitados?: number;
}

export interface AvisoMargenHistorico {
  mensaje: string;
  cantidadFiestas: number;
  desvioPorcentaje: number;
  costoEstimadoPromedio: number;
  costoRealPromedio: number;
}

function normalizarTexto(texto?: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calcula un aviso preventivo si en fiestas parecidas anteriores los costos
 * reales terminaron superando lo estimado.
 *
 * REGLA DE ORO: NO frena ni recalcula ningún precio. Solo devuelve el aviso.
 */
export function calcularAvisoMargenHistorico(
  fiestasHistoricas: FiestaEnPlanificacion[],
  params: ParametrosComparativa,
): AvisoMargenHistorico | null {
  const tipoBuscado = normalizarTexto(params.tipoEvento);
  const salonBuscado = normalizarTexto(params.salon);
  const invitadosBuscados = Number(params.invitados) || 0;

  if (!tipoBuscado && invitadosBuscados <= 0) return null;

  // Filtrar fiestas parecidas que tengan gastos reales cargados
  const parecidas = fiestasHistoricas.filter((fiesta) => {
    const ganancia = calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores);
    if (!ganancia.hayGastoCargado || ganancia.costoEstimado <= 0) return false;

    // Coincidencia de tipo si se especificó
    if (tipoBuscado) {
      const tipoFiesta = normalizarTexto(
        fiesta.configuracion?.tipoCelebracion ||
        fiesta.configuracion?.tipoEvento ||
        fiesta.configuracion?.tipoFiesta ||
        fiesta.tipo
      );
      if (tipoFiesta && !tipoFiesta.includes(tipoBuscado) && !tipoBuscado.includes(tipoFiesta)) {
        return false;
      }
    }

    // Coincidencia de invitados (+/- 35%) si se especificó
    if (invitadosBuscados > 0) {
      const cantInvitados = Number(
        fiesta.configuracion?.invitadosEstimados ||
        fiesta.configuracion?.numeroInvitados ||
        fiesta.invitadosCount ||
        0
      );
      if (cantInvitados > 0) {
        const min = invitadosBuscados * 0.65;
        const max = invitadosBuscados * 1.35;
        if (cantInvitados < min || cantInvitados > max) return false;
      }
    }

    return true;
  });

  // Si hay menos de 2 fiestas parecidas con gastos cargados, no se emite aviso
  if (parecidas.length < 2) return null;

  // Tomar hasta las 5 más recientes
  const muestra = parecidas.slice(0, 5);

  let sumaEstimada = 0;
  let sumaReal = 0;

  for (const fiesta of muestra) {
    const ganancia = calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores);
    sumaEstimada += ganancia.costoEstimado;
    sumaReal += ganancia.costoReal;
  }

  if (sumaEstimada <= 0) return null;

  const desvio = Math.round(((sumaReal - sumaEstimada) / sumaEstimada) * 100);

  // Solo avisar si el costo real superó el estimado por más del 5%
  if (desvio <= 5) return null;

  const costoEstimadoPromedio = Math.round(sumaEstimada / muestra.length);
  const costoRealPromedio = Math.round(sumaReal / muestra.length);

  return {
    mensaje: `En las últimas ${muestra.length} fiestas parecidas, los costos reales superaron un ${desvio}% lo estimado.`,
    cantidadFiestas: muestra.length,
    desvioPorcentaje: desvio,
    costoEstimadoPromedio,
    costoRealPromedio,
  };
}
