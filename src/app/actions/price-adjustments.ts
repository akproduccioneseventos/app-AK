'use server';

import { readData, writeData } from '@/lib/data-service';
import { adjustAllServicePrices, adjustAllServiceCosts, getServiciosEmpresa } from './servicios-empresa';

export interface PriceAdjustmentRecord {
  id: string;
  date: string; // ISO date string
  percentage: number;
  type: 'precios' | 'costos' | 'ambos';
  serviciosAfectados: number;
  aplicadoPor: string;
  revertido?: boolean;
  revertidoEn?: string;
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
  return readData<PriceAdjustmentRecord[]>(ADJUSTMENTS_FILE, []);
}

export async function previewPriceAdjustment(
  percentage: number,
  type: 'precios' | 'costos' | 'ambos'
): Promise<{ success: boolean; preview?: PreviewItem[]; error?: string }> {
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
        item.costoNuevo = Math.round((item.costoActual) * multiplier);
      }

      return item;
    });

    return { success: true, preview };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al generar preview.' };
  }
}

export async function applyPriceAdjustment(
  percentage: number,
  type: 'precios' | 'costos' | 'ambos' = 'ambos'
): Promise<{ success: boolean; error?: string; record?: PriceAdjustmentRecord }> {
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: 'El porcentaje debe ser un número distinto de cero.' };
  }

  try {
    const servicios = await getServiciosEmpresa();
    const serviciosCount = servicios.length;

    if (serviciosCount === 0) {
      return { success: false, error: 'No hay servicios en el catálogo para ajustar.' };
    }

    if (type === 'precios' || type === 'ambos') {
      const result = await adjustAllServicePrices(percentage);
      if (!result.success) return result;
    }

    if (type === 'costos' || type === 'ambos') {
      const result = await adjustAllServiceCosts(percentage);
      if (!result.success) return result;
    }

    const record: PriceAdjustmentRecord = {
      id: `adj_${Date.now()}`,
      date: new Date().toISOString(),
      percentage,
      type,
      serviciosAfectados: serviciosCount,
      aplicadoPor: 'Admin',
    };

    const history = await getPriceAdjustmentHistory();
    history.unshift(record);
    await writeData(ADJUSTMENTS_FILE, history);

    return { success: true, record };
  } catch (error: any) {
    console.error('Error applying price adjustment:', error);
    return { success: false, error: error.message || 'Error al aplicar el ajuste.' };
  }
}

export async function revertPriceAdjustment(
  adjustmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const history = await getPriceAdjustmentHistory();
    const adjustment = history.find(a => a.id === adjustmentId);

    if (!adjustment) return { success: false, error: 'Ajuste no encontrado.' };
    if (adjustment.revertido) return { success: false, error: 'Este ajuste ya fue revertido.' };

    // Revert by applying the inverse percentage
    const revertPercentage = -adjustment.percentage / (1 + adjustment.percentage / 100) * 100;

    if (adjustment.type === 'precios' || adjustment.type === 'ambos') {
      await adjustAllServicePrices(revertPercentage);
    }
    if (adjustment.type === 'costos' || adjustment.type === 'ambos') {
      await adjustAllServiceCosts(revertPercentage);
    }

    // Mark as reverted
    const idx = history.findIndex(a => a.id === adjustmentId);
    history[idx].revertido = true;
    history[idx].revertidoEn = new Date().toISOString();
    await writeData(ADJUSTMENTS_FILE, history);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al revertir.' };
  }
}
