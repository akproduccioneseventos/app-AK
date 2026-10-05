
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, CompraProveedorEstado, Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { getFiestaById, saveFiesta, updateFiestaPartial } from './fiesta.actions';

import { requireAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
const FIESTAS_DIR = 'fiestas';

export async function updateMenuAsignado(fiestaId: string, menuId?: string) {
  // Cambiar el menú de una fiesta cambia lo que se cocina: organización o insumos, no cualquier
  // sesión (auditoría con las 35 preguntas, 5/10/2026).
  await requireEventPermission(fiestaId, [PERMISOS.ORGANIZACION, PERMISOS.INSUMOS]);
  return updateFiestaPartial(fiestaId, { menuAsignadoId: menuId });
}

export async function updateShoppingListStatus(fiestaId: string, estados: CompraProveedorEstado[]): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
    if (!fiestaId) return { success: false, error: "ID de Fiesta no proporcionado." };

    try {
        // Quién puede (auditoría con las 35 preguntas, 5/10/2026). Antes alcanzaba cualquier sesión:
        // marcar un pedido es de organización; marcar que se le PAGÓ al proveedor es plata, de
        // insumos o contabilidad.
        const actual = await getFiestaById(fiestaId);
        if (!actual) throw new Error("Fiesta no encontrada");
        const cambiaUnPago = estados.some((nuevo) => {
            const antiguo = (actual.estadosCompra || []).find((o) => o.proveedor === nuevo.proveedor);
            return Boolean(antiguo?.pagado) !== Boolean(nuevo.pagado);
        });
        await requireEventPermission(
            fiestaId,
            cambiaUnPago ? [PERMISOS.INSUMOS, PERMISOS.CONTABILIDAD] : [PERMISOS.INSUMOS, PERMISOS.ORGANIZACION],
        );

        /**
         * LA TAREA DE PAGO SE ARMA ACA Y SE GUARDA UNA SOLA VEZ, Y AHORA ADENTRO DEL TURNO.
         *
         * Antes la tarea "Pagar insumos a: X" se perdía porque se guardaba aparte; después se
         * guardaba la fiesta entera leída antes, y un cambio de otro en ese momento se pisaba
         * (pregunta 22). Ahora todo se hace sobre la fiesta leída adentro de la misma operación.
         */
        const result = await actualizarFiesta(fiestaId, (fiesta) => {
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

            return { ...fiesta, tareas, estadosCompra: estados };
        });
        if (!result.success) throw new Error(result.error);

        return { success: true };
    } catch(e: any) {
        console.error("Error updating shopping list status:", e);
        return { success: false, error: e.message };
    }
}
