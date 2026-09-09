
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, CompraProveedorEstado, Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';

import { requireAppSession } from '@/lib/auth/require-session';
const FIESTAS_DIR = 'fiestas';

export async function updateMenuAsignado(fiestaId: string, menuId?: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
      throw new Error("Fiesta no encontrada");
  }
  const updatedFiesta = { ...fiesta, menuAsignadoId: menuId };
  return saveFiesta(updatedFiesta);
}

export async function updateShoppingListStatus(fiestaId: string, estados: CompraProveedorEstado[]): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
    if (!fiestaId) return { success: false, error: "ID de Fiesta no proporcionado." };

    try {
        let fiesta: FiestaEnPlanificacion = await getFiestaById(fiestaId) as FiestaEnPlanificacion;
        if (!fiesta) throw new Error("Fiesta no encontrada");
        
        /**
         * LA TAREA DE PAGO SE ARMA ACA Y SE GUARDA UNA SOLA VEZ.
         *
         * **Antes se perdia.** La tarea "Pagar insumos a: X" se guardaba por su lado
         * llamando al modulo de tareas, y dos lineas mas abajo se guardaba la fiesta
         * con la copia que se habia leido ANTES: esa copia no tenia la tarea nueva, asi
         * que la pisaba. El equipo marcaba el pedido como hecho, la pantalla decia que
         * si, y **el recordatorio de pagarle al proveedor no quedaba en ningun lado**.
         *
         * Ahora la tarea se agrega a la misma copia que se guarda, y se guarda una
         * sola vez. Y no se duplica: si ya hay una tarea de pago para ese proveedor sin
         * completar, no se agrega otra.
         */
        const oldEstados = fiesta.estadosCompra || [];
        let tareas = [...(fiesta.tareas || [])];

        for (const nuevo of estados) {
            const antiguo = oldEstados.find(o => o.proveedor === nuevo.proveedor);
            const tareaTexto = `Pagar insumos a: ${nuevo.proveedor}`;

            if ((!antiguo || antiguo.pedido !== nuevo.pedido) && nuevo.pedido && !nuevo.pagado) {
                const yaEsta = tareas.some(t => t.texto === tareaTexto && !t.completada);
                if (!yaEsta) {
                    tareas = [
                        {
                            id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                            texto: tareaTexto,
                            descripcion: `Pedido realizado para el evento ${fiesta?.configuracion?.nombreEvento ?? 'Evento sin nombre'}. Pendiente de pago.`,
                            asignadaA: 'Organizador',
                            completada: false,
                        },
                        ...tareas,
                    ];
                }
            }

            if ((!antiguo || antiguo.pagado !== nuevo.pagado) && nuevo.pagado) {
                tareas = tareas.map(t => (t.texto === tareaTexto ? { ...t, completada: true } : t));
            }
        }

        const updatedFiesta = { ...fiesta, tareas, estadosCompra: estados };
        const result = await saveFiesta(updatedFiesta);
        if (!result.success) throw new Error(result.error);
        
        return { success: true };
    } catch(e: any) {
        console.error("Error updating shopping list status:", e);
        return { success: false, error: e.message };
    }
}
