
'use server';

import type { FiestaEnPlanificacion, DecoracionData, MoodboardItem, DecoItem, CostoItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { updateGestionCostos } from './costos.actions';

export async function updateDecoracion(fiestaId: string, decoracion: DecoracionData): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, decoracion };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.decoracion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addMoodboardItem(fiestaId: string, url: string, description?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = decoracion.moodboardItems || [];

        const newItem: MoodboardItem = {
            id: `mood_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            url,
            description,
            likedByClient: false,
            uploadedBy: 'Organizador',
            timestamp: new Date().toISOString()
        };

        const updatedDecoracion = { ...decoracion, moodboardItems: [...items, newItem] };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).filter(i => i.id !== itemId);

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleLikeMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).map(i => 
            i.id === itemId ? { ...i, likedByClient: !i.likedByClient } : i
        );

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Sincroniza los costos internos de los items de decoración con el módulo de Gestión de Costos.
 * Los items de decoración tienen costos internos (gastos) que NO se suman al presupuesto del cliente,
 * pero sí deben reflejarse en los gastos operativos del evento.
 */
export async function syncDecoGastosToModule(
  fiestaId: string,
  itemsDecoracion: DecoItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    const costos = fiesta.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 };
    const otherItems = (costos.costosItems || []).filter(c => !c.id.startsWith('deco_'));

    const decoItems: CostoItem[] = itemsDecoracion
      .filter(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return costo > 0;
      })
      .map(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return {
          id: `deco_${item.id}`,
          nombre: `Decoración: ${item.nombre}${item.cantidad > 1 ? ` (x${item.cantidad})` : ''}`,
          category: 'Decoración',
          montoEstimado: Math.round(costo * item.cantidad), // Integer amount as gestionCostos uses whole currency units
          notas: item.notas || `Gasto interno de decoración - ${item.categoria}`,
        };
      });

    const updatedCostos = {
      ...costos,
      costosItems: [...otherItems, ...decoItems],
    };

    await updateGestionCostos(fiestaId, updatedCostos);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
