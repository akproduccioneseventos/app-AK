
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, CompraProveedorEstado } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { addTareaToFiestaActual } from '../fiesta-actual';

const FIESTAS_DIR = 'fiestas';

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
        let fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");
        
        // Buscar cambios para crear tareas automáticas de pago
        const oldEstados = fiesta.estadosCompra || [];
        for (const nuevo of estados) {
            const antiguo = oldEstados.find(o => o.proveedor === nuevo.proveedor);
            if (!antiguo || antiguo.pedido !== nuevo.pedido) {
                if (nuevo.pedido && !nuevo.pagado) {
                    await addTareaToFiestaActual(fiestaId, {
                        texto: `Pagar insumos a: ${nuevo.proveedor}`,
                        descripcion: `Pedido realizado para el evento ${fiesta.configuracion?.nombreEvento ?? 'el evento'}. Pendiente de pago.`,
                        completada: false,
                        asignadaA: 'Organizador'
                    });
                }
            }
             if ((!antiguo || antiguo.pagado !== nuevo.pagado) && nuevo.pagado) {
                 const tareaTexto = `Pagar insumos a: ${nuevo.proveedor}`;
                 const tareaExistente = fiesta.tareas?.find(t => t.texto === tareaTexto);
                 if (tareaExistente) {
                     // Marcar como completada si ya existe (sin mutar el objeto original)
                     fiesta = { ...fiesta, tareas: (fiesta.tareas || []).map(t => t.id === tareaExistente.id ? {...t, completada: true} : t) };
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
