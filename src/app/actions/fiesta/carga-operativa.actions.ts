
'use server';

import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem, FiestaEnPlanificacion } from '@/types/fiesta';
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

/**
 * Genera (o regenera) la lista de carga operativa de una fiesta a partir del catálogo
 * de activos fijos, calculando cantidades en base al número de invitados del evento.
 *
 * Lógica de cálculo:
 * - calculationMethod === 'porPersona': cantidad = totalInvitados
 * - calculationMethod === 'ratio' && invitadosPorUnidad: cantidad = Math.ceil(totalInvitados / invitadosPorUnidad)
 * - calculationMethod === 'fijo' || default: cantidad = precioVenta (si existe) || cantidadDisponible || 1
 *
 * Agrupa los activos por su `categoria` formando CargaOperativaCategorias.
 * Preserva los items marcados como `cargado: true` o `retornado: true` si el item ya existe (por origenId).
 */
export async function generateCargaFromActivos(
  fiestaId: string,
  totalInvitados: number
): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    const [fiesta, activos] = await Promise.all([
      getFiestaById(fiestaId),
      getActivosFijos(),
    ]);

    if (!fiesta) throw new Error('Fiesta no encontrada');

    const byCategory: Record<string, typeof activos> = {};
    activos.forEach((a) => {
      const cat = a.categoria || 'General';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(a);
    });

    const existingItemsByOrigenId: Record<string, CargaOperativaItem> = {};
    (fiesta.listaDeCargaOperativa?.categorias || []).forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.origenId) existingItemsByOrigenId[item.origenId] = item;
      });
    });

    const categorias: CargaOperativaCategoria[] = Object.entries(byCategory).map(([catName, assets]) => {
      const items: CargaOperativaItem[] = assets.map((asset) => {
        let qty: number;
        if (asset.calculationMethod === 'porPersona') {
          qty = totalInvitados;
        } else if (asset.calculationMethod === 'ratio' && asset.invitadosPorUnidad && asset.invitadosPorUnidad > 0) {
          qty = Math.ceil(totalInvitados / asset.invitadosPorUnidad);
        } else {
          const precioVenta = Number(asset.precioVenta);
          qty = precioVenta > 0 ? precioVenta : (asset.cantidadDisponible || 1);
        }

        const existing = existingItemsByOrigenId[asset.id];
        return {
          id: `gen_${asset.id}`,
          nombre: asset.nombre,
          cantidad: String(qty),
          unidad: asset.unidad || 'Uds.',
          cargado: existing?.cargado || false,
          retornado: existing?.retornado || false,
          origenId: asset.id,
          notas: asset.notas || '',
        };
      });

      const categorySlug = catName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      return {
        id: `cat_${categorySlug}`,
        nombre: catName,
        items,
      };
    });

    const newLista: ListaDeCargaOperativa = {
      id: fiesta.listaDeCargaOperativa?.id || 'lista_auto',
      name: 'Lista de Carga (Generada desde Activos)',
      categorias,
      notasGenerales: fiesta.listaDeCargaOperativa?.notasGenerales || '',
    };

    return await updateListaDeCargaOperativa(fiestaId, newLista);
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
