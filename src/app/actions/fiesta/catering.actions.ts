
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

/** Las casillas que son plata: pagarle al proveedor no es de organización. */
const CAMPOS_DE_PAGO = ['pagado', 'montoPagado'] as const;
const claveProveedor = (e: Pick<CompraProveedorEstado, 'proveedor' | 'proveedorId'>) => e.proveedorId || e.proveedor;
const mismoProveedor = (a: CompraProveedorEstado, b: CompraProveedorEstado) =>
  (Boolean(a.proveedorId) && a.proveedorId === b.proveedorId) || a.proveedor === b.proveedor;
const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Lo que la pantalla PIDIÓ cambiar: cada casilla donde lo que manda difiere de lo que tenía
 * cuando leyó. No la lista entera (Codex, auditoría 71, COMPRA01): una pantalla vieja
 * mandaba la lista leída antes y deshacía un pago que contabilidad acababa de anotar.
 */
function cambiosPedidos(leidos: CompraProveedorEstado[], estados: CompraProveedorEstado[]) {
  const cambios: { nuevo: CompraProveedorEstado; campos: string[]; antes?: CompraProveedorEstado }[] = [];
  for (const nuevo of estados) {
    const antes = leidos.find((o) => mismoProveedor(o, nuevo));
    const campos = Object.keys(nuevo).filter((k) => !igual((antes as any)?.[k], (nuevo as any)[k]));
    if (campos.length > 0) cambios.push({ nuevo, campos, antes });
  }
  return cambios;
}

export async function updateShoppingListStatus(
  fiestaId: string,
  estados: CompraProveedorEstado[],
  leidos?: CompraProveedorEstado[],
): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
    if (!fiestaId) return { success: false, error: "ID de Fiesta no proporcionado." };

    try {
        // Quién puede (auditoría con las 35 preguntas, 5/10/2026): marcar un pedido es de
        // organización; marcar que se le PAGÓ al proveedor es plata, de insumos o contabilidad.
        // El permiso sale de lo que se PIDE cambiar, no de comparar con una lectura que otro
        // puede cambiar un instante después.
        const actual = await getFiestaById(fiestaId);
        if (!actual) throw new Error("Fiesta no encontrada");
        const cambios = cambiosPedidos(leidos ?? actual.estadosCompra ?? [], estados);
        if (cambios.length === 0) return { success: true };
        const tocaUnPago = cambios.some((c) => c.campos.some((k) => (CAMPOS_DE_PAGO as readonly string[]).includes(k)));
        await requireEventPermission(
            fiestaId,
            tocaUnPago ? [PERMISOS.INSUMOS, PERMISOS.CONTABILIDAD] : [PERMISOS.INSUMOS, PERMISOS.ORGANIZACION],
        );

        /**
         * LA TAREA DE PAGO SE ARMA ACA Y SE GUARDA UNA SOLA VEZ, ADENTRO DEL TURNO.
         *
         * Se aplica sólo lo pedido, casilla por casilla, sobre la lista de ESE momento. Si otro ya
         * cambió la misma casilla desde que la pantalla leyó, no se pisa: se pide recargar.
         */
        const result = await actualizarFiesta(fiestaId, (fiesta) => {
            const estadosActuales = [...(fiesta.estadosCompra || [])];
            let tareas = [...(fiesta.tareas || [])];

            for (const { nuevo, campos, antes } of cambios) {
                const i = estadosActuales.findIndex((o) => mismoProveedor(o, nuevo));
                const actualProv = i >= 0 ? estadosActuales[i] : undefined;
                for (const k of campos) {
                    if (!igual((actualProv as any)?.[k], (antes as any)?.[k]) && !igual((actualProv as any)?.[k], (nuevo as any)[k])) {
                        throw new Error(`Otra persona cambió lo de ${nuevo.proveedor} recién. Recargá la lista y volvé a marcarlo.`);
                    }
                }
                const base: CompraProveedorEstado = actualProv ?? { proveedor: nuevo.proveedor, proveedorId: nuevo.proveedorId, pedido: false, pagado: false };
                const resultado: CompraProveedorEstado = { ...base };
                for (const k of campos) (resultado as any)[k] = (nuevo as any)[k];
                if (i >= 0) estadosActuales[i] = resultado; else estadosActuales.push(resultado);

                const tareaTexto = `Pagar insumos a: ${resultado.proveedor}`;
                if (campos.includes('pedido') && resultado.pedido && !resultado.pagado) {
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
                if (campos.includes('pagado') && resultado.pagado) {
                    tareas = tareas.map(t => (t.texto === tareaTexto ? { ...t, completada: true } : t));
                }
            }

            return { ...fiesta, tareas, estadosCompra: estadosActuales };
        });
        if (!result.success) throw new Error(result.error);

        return { success: true };
    } catch(e: any) {
        console.error("Error updating shopping list status:", e);
        return { success: false, error: e.message };
    }
}
