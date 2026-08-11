'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData } from '@/lib/data-service';
import { getMenus, saveMenu } from './menus-catering';
import { requireAppSession } from '@/lib/auth/require-session';

const INSUMOS_FILE = 'insumos.json';

let cachedInsumos: ServicioEmpresa[] | null = null;

export async function invalidateInsumosCache() {
  cachedInsumos = null;
}

export async function getInsumos(): Promise<ServicioEmpresa[]> {
    if (cachedInsumos) return cachedInsumos;
    const items = await readData<any[]>(INSUMOS_FILE, []);
    const mapped = (Array.isArray(items) ? items : []).map(item => ({
      ...item,
      tipoItem: item.tipoItem || 'Insumo/Ingrediente',
      valorUnitarioEstimado: item.valorUnitarioEstimado !== undefined && !isNaN(Number(item.valorUnitarioEstimado)) ? Number(item.valorUnitarioEstimado) : 0,
      cantidadDisponible: item.cantidadDisponible !== undefined && !isNaN(Number(item.cantidadDisponible)) ? Number(item.cantidadDisponible) : undefined,
    }));
    cachedInsumos = mapped;
    return mapped;
}

export async function getInsumoById(id: string): Promise<ServicioEmpresa | null> {
  const insumos = await getInsumos();
  return insumos.find(s => s.id === id) || null;
}

/**
 * Sincroniza los cambios de un insumo en todos los menús que lo utilizan.
 */
async function propagateInsumoChangesToMenus(updatedInsumo: ServicioEmpresa) {
    const menus = await getMenus();
    let anyMenuChanged = false;

    const updatedMenus = menus.map(menu => {
        let menuChanged = false;
        const updatedItems = menu.items.map(item => {
            let itemChanged = false;
            const updatedIngredients = item.ingredients.map(ing => {
                if (ing.origenId === updatedInsumo.id) {
                    itemChanged = true;
                    menuChanged = true;
                    anyMenuChanged = true;
                    return {
                        ...ing,
                        name: updatedInsumo.nombre,
                        unit: updatedInsumo.unidad || ing.unit,
                        // Si el insumo quedo sin precio cargado, se respeta el que
                        // ya tenia el menu. Antes se lo pisaba con cero: el plato
                        // pasaba a costar de menos y el presupuesto salia barato
                        // sin que nadie se diera cuenta.
                        costoUnitario: Number(updatedInsumo.valorUnitarioEstimado) > 0
                          ? Number(updatedInsumo.valorUnitarioEstimado)
                          : (ing.costoUnitario ?? 0),
                        proveedor: updatedInsumo.proveedor || undefined,
                    };
                }
                return ing;
            });

            if (itemChanged) {
                return { ...item, ingredients: updatedIngredients };
            }
            return item;
        });

        if (menuChanged) {
            return { ...menu, items: updatedItems };
        }
        return menu;
    });

    if (anyMenuChanged) {
        for (const m of updatedMenus) {
            await saveMenu(m);
        }
    }
}

export async function saveInsumo(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  await requireAppSession();
  invalidateInsumosCache();
  let inventario = await getInsumos();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    tipoItem: itemData.tipoItem || 'Insumo/Ingrediente',
    valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined && !isNaN(Number(itemData.valorUnitarioEstimado)) ? Number(itemData.valorUnitarioEstimado) : (itemData.valorUnitarioEstimado || 0),
    cantidadDisponible: itemData.cantidadDisponible !== undefined && !isNaN(Number(itemData.cantidadDisponible)) ? Number(itemData.cantidadDisponible) : undefined,
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del insumo es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  if (!dataWithParsedNumbers.unidad) return { success: false, error: "La unidad es obligatoria para insumos." };

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Insumo con ID ${itemId} no encontrado.` };
    
    const originalItem = inventario[index];
    if (originalItem.nombre.trim().toLowerCase() !== dataWithParsedNumbers.nombre!.trim().toLowerCase()) {
        const isDuplicate = inventario.some(s => s.id !== itemId && s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase());
        if (isDuplicate) return { success: false, error: `Ya existe otro insumo con el nombre "${dataWithParsedNumbers.nombre!.trim()}".` };
    }

    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un insumo con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = `insumo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }
  
  await writeData(INSUMOS_FILE, inventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
  invalidateInsumosCache();
  
  await propagateInsumoChangesToMenus(finalItemData as ServicioEmpresa);

  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteInsumo(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const { getMenus } = await import('./menus-catering');
  const menus = await getMenus();
  const menusEnUso = menus.filter(m =>
    m.items?.some(item =>
      item.ingredients?.some(ing => ing.origenId === id || (ing as any).insumoId === id)
    )
  );
  if (menusEnUso.length > 0) {
    return {
      success: false,
      error: `No se puede eliminar el insumo porque está siendo utilizado en ${menusEnUso.length} menú(s)/receta(s) de catering.`,
    };
  }

  invalidateInsumosCache();
  let inventario = await getInsumos();
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) return { success: false, error: `Insumo con ID ${id} no encontrado para eliminar.` };
  await writeData(INSUMOS_FILE, inventario);
  invalidateInsumosCache();
  return { success: true };
}

export async function adjustAllInsumoCosts(
  percentage: number
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: "El porcentaje debe ser un número distinto de cero." };
  }
  // Los mismos dos topes que ya tenian los servicios. Sin ellos, un -200 daba
  // vuelta el signo y todo el catalogo de insumos quedaba en negativo; y un 5000
  // mal tipeado (en vez de 50) multiplicaba los costos por cincuenta y uno.
  if (percentage <= -100) {
    return { success: false, error: 'No se puede bajar los costos un 100% o más: quedarían en cero o en negativo.' };
  }
  if (percentage > 1000) {
    return { success: false, error: 'El ajuste no puede superar el 1000%. Revisá el número que pusiste.' };
  }


  try {
    invalidateInsumosCache();
    const inventario = await getInsumos();
    if (inventario.length === 0) {
      return { success: false, error: "No hay insumos en el catálogo para ajustar." };
    }

    const multiplier = 1 + percentage / 100;

    const updatedInventario = inventario.map(insumo => {
      const newInsumo = { ...insumo };

      if (newInsumo.valorUnitarioEstimado !== undefined) {
        newInsumo.valorUnitarioEstimado = Math.round((newInsumo.valorUnitarioEstimado * multiplier));
      }
      
      return newInsumo;
    });

    await writeData(INSUMOS_FILE, updatedInventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
    invalidateInsumosCache();

    for (const insumo of updatedInventario) {
        await propagateInsumoChangesToMenus(insumo);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error adjusting insumo costs:", error);
    return { success: false, error: "Ocurrió un error al intentar ajustar los costos de los insumos." };
  }
}
