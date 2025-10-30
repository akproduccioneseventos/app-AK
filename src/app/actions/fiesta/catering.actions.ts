

'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, CompraProveedorEstado } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { createNotification } from '../notifications';
import { addTareaToFiestaActual } from '../fiesta-actual';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateMenuAsignado(fiestaId: string, menuId?: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
      throw new Error("Fiesta no encontrada");
  }
  const updatedFiesta = { ...fiesta, menuAsignadoId: menuId };
  return saveFiesta(updatedFiesta);
}

export async function updateShoppingListStatus(fiestaId: string, estados: CompraProveedorEstado[]): Promise<{ success: boolean, error?: string }> {
    if (!fiestaId) return { success: false, error: "ID de Fiesta no proporcionado." };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");
        
        // Find changes to create tasks
        const oldEstados = fiesta.estadosCompra || [];
        for (const nuevo of estados) {
            const antiguo = oldEstados.find(o => o.proveedor === nuevo.proveedor);
            if (!antiguo || antiguo.pedido !== nuevo.pedido) {
                if (nuevo.pedido && !nuevo.pagado) {
                    await addTareaToFiestaActual(fiestaId, {
                        texto: `Pagar pedido a proveedor: ${nuevo.proveedor}`,
                        descripcion: 'Pedido de insumos realizado, pendiente de pago.',
                        completada: false
                    });
                } else if (!nuevo.pedido) {
                     // Optionally remove the "Pagar" task if the order is un-marked.
                }
            }
             if ((!antiguo || antiguo.pagado !== nuevo.pagado) && nuevo.pagado) {
                 const tareaTexto = `Pagar pedido a proveedor: ${nuevo.proveedor}`;
                 const tareaExistente = fiesta.tareas?.find(t => t.texto === tareaTexto);
                 if (tareaExistente) {
                     await addTareaToFiestaActual(fiestaId, {...tareaExistente, completada: true});
                 }
             }
        }


        const updatedFiesta = { ...fiesta, estadosCompra: estados };
        const result = await saveFiesta(updatedFiesta);
        if (!result.success) throw new Error(result.error);
        
        return { success: true };
    } catch(e: any) {
        console.error("Error updating shopping list status:", e);
        return { success: false, error: e.message };
    }
}
