'use server';

import { readData, writeData } from '@/lib/data-service';
import { adjustAllServicePrices, adjustAllServiceCosts, getServiciosEmpresa } from './servicios-empresa';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

// Ajustar los precios de venta es plata: contabilidad, no cualquier sesión (revisión de plata, 6/10/2026).
const requireAppSession = () => requirePermisoAlguno(PERMISOS.CONTABILIDAD);
import { AsyncMutex } from '@/lib/mutex';

export interface PriceAdjustmentRecord {
  id: string;
  date: string; // ISO date string
  percentage: number;
  type: 'precios' | 'costos' | 'ambos';
  serviciosAfectados: number;
  aplicadoPor: string;
  revertido?: boolean;
  revertidoEn?: string;
  /**
   * Marcadores de operacion a medias (12/10/2026). El ajuste "ambos" mueve precios Y costos en dos
   * pasos: si el segundo falla o se corta el servidor, antes quedaba el primero aplicado y, al
   * reintentar, se aplicaba otra vez. Ahora el registro se anota ANTES de tocar nada y cada parte
   * hecha se marca; el reintento termina solo lo que falta.
   */
  estado?: 'aplicando' | 'revirtiendo' | 'listo';
  partesHechas?: Array<'precios' | 'costos'>;
  reversionPartesHechas?: Array<'precios' | 'costos'>;
}

function partesDe(type: PriceAdjustmentRecord['type']): Array<'precios' | 'costos'> {
  return type === 'ambos' ? ['precios', 'costos'] : [type];
}

export interface PreviewItem {
  id: string;
  nombre: string;
  categoria: string;
  precioVentaActual?: number;
  precioVentaNuevo?: number;
  costoActual?: number;
  costoNuevo?: number;
}

const ADJUSTMENTS_FILE = 'price-adjustments-history.json';

export async function getPriceAdjustmentHistory(): Promise<PriceAdjustmentRecord[]> {
  await requireAppSession();
  return readData<PriceAdjustmentRecord[]>(ADJUSTMENTS_FILE, []);
}

export async function previewPriceAdjustment(
  percentage: number,
  type: 'precios' | 'costos' | 'ambos'
): Promise<{ success: boolean; preview?: PreviewItem[]; error?: string }> {
  await requireAppSession();
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: 'El porcentaje debe ser un número distinto de cero.' };
  }

  try {
    const servicios = await getServiciosEmpresa();
    if (servicios.length === 0) {
      return { success: false, error: 'No hay servicios en el catálogo.' };
    }

    const multiplier = 1 + percentage / 100;

    const preview: PreviewItem[] = servicios.map(s => {
      const item: PreviewItem = {
        id: s.id,
        nombre: s.nombre,
        categoria: s.categoria || '',
      };

      if (type === 'precios' || type === 'ambos') {
        item.precioVentaActual = s.precioVenta ?? s.precioBase ?? s.precioPorPersona ?? 0;
        item.precioVentaNuevo = Math.round((item.precioVentaActual) * multiplier);
      }

      if (type === 'costos' || type === 'ambos') {
        item.costoActual = s.valorUnitarioEstimado ?? 0;
        item.costoNuevo = Math.round(item.costoActual * multiplier * 100) / 100;
      }

      return item;
    });

    return { success: true, preview };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al generar preview.' };
  }
}

async function applyPriceAdjustmentInterno(
  percentage: number,
  type: 'precios' | 'costos' | 'ambos' = 'ambos'
): Promise<{ success: boolean; error?: string; record?: PriceAdjustmentRecord }> {
  await requireAppSession();
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: 'El porcentaje debe ser un número distinto de cero.' };
  }
  // La pantalla limita el campo a -100, pero eso lo controla el navegador y se
  // saltea mandando el pedido a mano. Con -200 el precio cambia de signo y todo
  // el catalogo queda en negativo: se cobraria al reves.
  if (percentage <= -100) {
    return { success: false, error: 'No se puede bajar los precios un 100% o más: quedarían en cero o en negativo.' };
  }
  // Un ajuste enorme casi siempre es un error de tipeo (5000 en vez de 50).
  if (percentage > 1000) {
    return { success: false, error: 'El ajuste no puede superar el 1000%. Revisá el número que pusiste.' };
  }

  try {
    const servicios = await getServiciosEmpresa();
    const serviciosCount = servicios.length;

    if (serviciosCount === 0) {
      return { success: false, error: 'No hay servicios en el catálogo para ajustar.' };
    }

    const history = await getPriceAdjustmentHistory();

    const revirtiendo = history.find((a) => a.estado === 'revirtiendo');
    if (revirtiendo) {
      return { success: false, error: `Hay una reversión del ajuste del ${revirtiendo.percentage}% que quedó a medias. Volvé a revertir ese mismo ajuste para terminarla antes de hacer otro.` };
    }
    let record = history.find((a) => a.estado === 'aplicando');
    if (record) {
      // Un ajuste anterior quedo a medias: el mismo porcentaje y tipo lo TERMINA (solo la parte que
      // falta); otro distinto se rechaza, porque se sumaria encima del anterior.
      if (record.percentage !== percentage || record.type !== type) {
        return { success: false, error: `Hay un ajuste del ${record.percentage}% (${record.type}) que quedó a medias. Volvé a aplicar ese mismo ajuste para terminarlo (no se vuelve a subir lo que ya se aplicó) y después hacé el nuevo.` };
      }
    } else {
      record = {
        id: `adj_${Date.now()}`,
        date: new Date().toISOString(),
        percentage,
        type,
        serviciosAfectados: serviciosCount,
        aplicadoPor: 'Admin',
        estado: 'aplicando',
        partesHechas: [],
      };
      // El marcador se anota ANTES de tocar un solo precio.
      history.unshift(record);
      await writeData(ADJUSTMENTS_FILE, history);
    }

    for (const parte of partesDe(type)) {
      if (record.partesHechas?.includes(parte)) continue;
      const result = parte === 'precios' ? await adjustAllServicePrices(percentage) : await adjustAllServiceCosts(percentage);
      if (!result.success) {
        return { success: false, error: `${result.error || 'No se pudo aplicar el ajuste.'} Volvé a aplicar el mismo ajuste: sólo se termina lo que falta, no se vuelve a subir lo ya aplicado.` };
      }
      record.partesHechas = [...(record.partesHechas || []), parte];
      await writeData(ADJUSTMENTS_FILE, history);
    }

    record.estado = 'listo';
    await writeData(ADJUSTMENTS_FILE, history);

    return { success: true, record };
  } catch (error: any) {
    console.error('Error applying price adjustment:', error);
    return { success: false, error: error.message || 'Error al aplicar el ajuste.' };
  }
}

async function revertPriceAdjustmentInterno(
  adjustmentId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const history = await getPriceAdjustmentHistory();
    const adjustment = history.find(a => a.id === adjustmentId);

    if (!adjustment) return { success: false, error: 'Ajuste no encontrado.' };
    if (adjustment.revertido) return { success: false, error: 'Este ajuste ya fue revertido.' };
    if (adjustment.estado === 'aplicando') {
      return { success: false, error: 'Este ajuste quedó a medias: volvé a aplicarlo para terminarlo antes de revertirlo.' };
    }
    const otraReversion = history.find((a) => a.estado === 'revirtiendo' && a.id !== adjustmentId);
    if (otraReversion) {
      return { success: false, error: `Hay una reversión del ajuste del ${otraReversion.percentage}% que quedó a medias. Terminala primero.` };
    }

    // Revert by applying the inverse percentage
    const revertPercentage = -adjustment.percentage / (1 + adjustment.percentage / 100) * 100;

    // El marcador va antes de tocar un precio; cada parte hecha se marca, y un reintento termina
    // solo lo que falta (antes, revertir "ambos" con un corte en el medio deshacia los precios dos veces).
    if (adjustment.estado !== 'revirtiendo') {
      adjustment.estado = 'revirtiendo';
      adjustment.reversionPartesHechas = [];
      await writeData(ADJUSTMENTS_FILE, history);
    }

    /**
     * REVERTIR UN AJUSTE MUEVE TODOS LOS PRECIOS DE LA EMPRESA.
     *
     * Si falla y nadie lo mira, el ajuste queda marcado como revertido y los precios
     * siguen movidos: el catalogo entero queda con el numero equivocado y nadie se
     * entera hasta que se cotiza mal.
     */
    for (const parte of partesDe(adjustment.type)) {
      if (adjustment.reversionPartesHechas?.includes(parte)) continue;
      const r = parte === 'precios' ? await adjustAllServicePrices(revertPercentage) : await adjustAllServiceCosts(revertPercentage);
      if (!r?.success) {
        return { success: false, error: `${r?.error || (parte === 'precios' ? 'No se pudieron revertir los precios.' : 'No se pudieron revertir los costos.')} Volvé a revertir: sólo se termina lo que falta.` };
      }
      adjustment.reversionPartesHechas = [...(adjustment.reversionPartesHechas || []), parte];
      await writeData(ADJUSTMENTS_FILE, history);
    }

    // Mark as reverted
    adjustment.revertido = true;
    adjustment.revertidoEn = new Date().toISOString();
    adjustment.estado = 'listo';
    await writeData(ADJUSTMENTS_FILE, history);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al revertir.' };
  }
}

/**
 * UN TURNO PARA QUE DOS GUARDADOS NO SE PISEN.
 *
 * Cada guardado aca lee la lista entera, le cambia un renglon y vuelve a escribir la lista
 * entera. Sin turno, si dos personas guardan casi al mismo tiempo, **el segundo escribe encima
 * de la lista vieja y el cambio del primero desaparece**, con las dos pantallas diciendo
 * "guardado". Con turno, el segundo espera y trabaja sobre lo que ya quedo guardado.
 */
const turnoDeAjustesDePrecio = new AsyncMutex();

export async function applyPriceAdjustment(...datos: Parameters<typeof applyPriceAdjustmentInterno>): ReturnType<typeof applyPriceAdjustmentInterno> {
  // La sesion se pide aca, en la puerta de entrada, y no solo adentro: asi el control de
  // seguridad ve el candado en la accion que de verdad se llama desde la pantalla.
  await requireAppSession();
  return turnoDeAjustesDePrecio.runExclusive(() => applyPriceAdjustmentInterno(...datos));
}

export async function revertPriceAdjustment(...datos: Parameters<typeof revertPriceAdjustmentInterno>): ReturnType<typeof revertPriceAdjustmentInterno> {
  // La sesion se pide aca, en la puerta de entrada, y no solo adentro: asi el control de
  // seguridad ve el candado en la accion que de verdad se llama desde la pantalla.
  await requireAppSession();
  return turnoDeAjustesDePrecio.runExclusive(() => revertPriceAdjustmentInterno(...datos));
}
