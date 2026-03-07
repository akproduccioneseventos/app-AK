
'use server';

import type { ListaDeCargaOperativa, CargaOperativaItem, FiestaEnPlanificacion } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { getFiestas, getFiestaById, saveFiesta } from './fiesta.actions';
import { getActivosFijos } from '../activos-fijos';
import { isSameDay } from 'date-fns';

const MASTER_TEMPLATE_FILE = 'carga-operativa-master-template.json';
const defaultMasterTemplate: ListaDeCargaOperativa = {
  id: "master",
  name: "Plantilla Maestra de Carga Operativa",
  categorias: [],
};

// --- MÓDULO 1: CEREBRO LOGÍSTICO ---

/**
 * Escanea todos los eventos activos en una fecha específica para detectar conflictos de stock.
 */
export async function checkAssetConflicts(fiestaId: string, date: string, items: CargaOperativaItem[]): Promise<CargaOperativaItem[]> {
    const allFiestas = await getFiestas(false); // Solo activas
    const assetsCatalog = await getActivosFijos();
    const otherFiestasSameDay = allFiestas.filter(f => f.id !== fiestaId && f.configuracion.fechaEvento && isSameDay(new Date(f.configuracion.fechaEvento), new Date(date)));

    return items.map(item => {
        if (!item.origenId) return item;

        const asset = assetsCatalog.find(a => a.id === item.origenId);
        if (!asset) return item;

        const totalStock = asset.cantidadDisponible || 0;
        
        // Calcular cuánto de este activo están usando otros eventos el mismo día
        let sumOtherEvents = 0;
        otherFiestasSameDay.forEach(f => {
            f.listaDeCargaOperativa?.categorias.forEach(cat => {
                cat.items.forEach(otherItem => {
                    if (otherItem.origenId === item.origenId) {
                        sumOtherEvents += parseFloat(otherItem.cantidad) || 0;
                    }
                });
            });
        });

        const currentNeed = parseFloat(item.cantidad) || 0;
        const availableStock = totalStock - sumOtherEvents;
        const hasConflict = currentNeed > availableStock;

        return {
            ...item,
            hasConflict,
            availableStockAtDate: Math.max(0, availableStock)
        };
    });
}

// --- ACCIONES PARA LA PLANTILLA MAESTRA ---

/**
 * Obtiene la plantilla maestra de Carga Operativa.
 */
export async function getCargaOperativaMasterTemplate(): Promise<ListaDeCargaOperativa> {
  return readData<ListaDeCargaOperativa>(MASTER_TEMPLATE_FILE, defaultMasterTemplate);
}

/**
 * Guarda la plantilla maestra de Carga Operativa.
 * @param data Los nuevos datos de la plantilla.
 */
export async function saveCargaOperativaMasterTemplate(
  data: ListaDeCargaOperativa
): Promise<{ success: boolean; data?: ListaDeCargaOperativa; error?: string }> {
  try {
    const dataToSave = { ...data, id: 'master', name: 'Plantilla Maestra de Carga Operativa' };
    await writeData(MASTER_TEMPLATE_FILE, dataToSave);
    return { success: true, data: dataToSave };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


// --- ACCIONES PARA LA FIESTA ESPECÍFICA ---

export async function updateListaDeCargaOperativa(fiestaId: string, lista: ListaDeCargaOperativa): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    // Módulo 1: Al guardar, refrescamos los estados de conflicto
    if (fiesta.configuracion.fechaEvento) {
        const updatedCategorias = await Promise.all(lista.categorias.map(async cat => ({
            ...cat,
            items: await checkAssetConflicts(fiestaId, fiesta.configuracion.fechaEvento!, cat.items)
        })));
        lista.categorias = updatedCategorias;
    }

    const updatedFiesta = { ...fiesta, listaDeCargaOperativa: lista };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.listaDeCargaOperativa };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
