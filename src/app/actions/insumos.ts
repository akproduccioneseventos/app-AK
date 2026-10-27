'use server';

import { idDelIntento } from '@/lib/intento-en-servidor';
import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData, createDataItem, mutateDataItem, deleteDataItem } from '@/lib/data-service';
import { aplicarInsumoEnMenus } from './menus-catering';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';

/**
 * Quién toca los insumos (Codex, auditoría 66, 5/10/2026). Antes alcanzaba cualquier sesión, y el
 * personal o el operador podían cambiar costos y stock llamando la acción directo.
 * - Cambiar (guardar, borrar, ajustar costos): INSUMOS (dueño, secretaria).
 * - Leer: INSUMOS u ORGANIZACION, porque la lista de compras y el resumen de la fiesta los usan.
 */
async function requirePermisoAlguno(...permisos: Permiso[]): Promise<void> {
  for (const permiso of permisos) {
    if ((await requirePermiso(permiso)).ok) return;
  }
  throw new Error('Tu perfil no tiene acceso a los insumos.');
}
const PARA_LEER = [PERMISOS.INSUMOS, PERMISOS.ORGANIZACION] as const;
import { leerInsumosCrudos, limpiarCacheInsumos } from '@/lib/insumos/leer-insumos';
import { AsyncMutex } from '@/lib/mutex';

const INSUMOS_FILE = 'insumos.json';
const INSUMOS_COLLECTION = 'insumos';
/**
 * Con base, un insumo se guarda y se borra SOLO, no la lista entera (23 de septiembre de
 * 2026). La lista leida un rato antes, guardada desde otro servidor, le volvia el costo
 * viejo al insumo que otro acababa de cambiar, o borraba el que otro acababa de crear.
 * El ajuste de todos los costos a la vez sigue guardando la lista: cambia todos a proposito.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

export async function invalidateInsumosCache() {
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  limpiarCacheInsumos();
}

export async function getInsumos(): Promise<ServicioEmpresa[]> {
    // Cada insumo trae lo que cuesta y cuanto queda en deposito. Es del equipo.
    await requirePermisoAlguno(...PARA_LEER);
    return leerInsumosCrudos();
}

export async function getInsumoById(id: string): Promise<ServicioEmpresa | null> {
  await requirePermisoAlguno(...PARA_LEER);
  const insumos = await leerInsumosCrudos();
  return insumos.find(s => s.id === id) || null;
}

/**
 * Sincroniza los cambios de un insumo en todos los menús que lo utilizan.
 */
/**
 * Lleva el cambio del insumo a todos los menus que lo usan.
 *
 * **Devuelve si pudo o no.** Antes no devolvia nada y guardaba cada menu sin mirar
 * el resultado: si un menu no se guardaba, el insumo quedaba con el precio nuevo y
 * el plato con el viejo, y **el costo de la comida salia mal sin que nadie lo
 * notara**. Se corrigio el 8 de septiembre de 2026.
 */
/**
 * LLEVA EL CAMBIO DE UN INSUMO A LOS MENUS QUE LO USAN.
 *
 * **Dos cosas que encontro Codex el 18 de septiembre de 2026:**
 *
 * 1. **Se guardaban TODOS los menus**, no solo los que usan ese insumo: si cambiaba uno, se
 *    reescribian los veinte. Ademas de tardar, pisaba menus que nadie habia tocado.
 * 2. **Si un menu no se podia guardar, el ajuste igual decia "listo"**, asi que los platos
 *    seguian costando lo viejo y el presupuesto siguiente salia con precios de antes.
 */
async function propagateInsumoChangesToMenus(
    updatedInsumo: ServicioEmpresa,
    operationId?: string,
): Promise<{ success: boolean; error?: string }> {
    // Cada menú se cambia sobre su versión guardada en ese momento (pregunta 22): ver
    // `aplicarInsumoEnMenus` en menus-catering.ts.
    return aplicarInsumoEnMenus(updatedInsumo, operationId);
}



async function saveInsumoInterno(
  itemData: Partial<ServicioEmpresa> & { id?: string },
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  limpiarCacheInsumos();
  let inventario = await leerInsumosCrudos();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  if (itemData.valorUnitarioEstimado !== undefined && !isNaN(Number(itemData.valorUnitarioEstimado))) {
    if (Number(itemData.valorUnitarioEstimado) < 0) {
      return { success: false, error: 'El costo del insumo no puede ser negativo.' };
    }
  }
  if (itemData.cantidadDisponible !== undefined && !isNaN(Number(itemData.cantidadDisponible))) {
    if (Number(itemData.cantidadDisponible) < 0) {
      return { success: false, error: 'La cantidad disponible no puede ser negativa.' };
    }
  }

  const itemIdBuscado = itemData.id;
  const index = itemIdBuscado ? inventario.findIndex(s => s.id === itemIdBuscado) : -1;

  if (itemIdBuscado && index !== -1) {
    itemId = itemIdBuscado;
    const originalItem = inventario[index];

    if (itemData.nombre !== undefined && itemData.nombre.trim() !== '') {
      const nuevoNombre = itemData.nombre.trim();
      if (originalItem.nombre.trim().toLowerCase() !== nuevoNombre.toLowerCase()) {
        const isDuplicate = inventario.some(s => s.id !== itemId && s.nombre.trim().toLowerCase() === nuevoNombre.toLowerCase());
        if (isDuplicate) return { success: false, error: `Ya existe otro insumo con el nombre "${nuevoNombre}".` };
      }
    } else if (itemData.nombre !== undefined && itemData.nombre.trim() === '') {
      return { success: false, error: 'El nombre del insumo es obligatorio.' };
    }

    const cambios: Partial<ServicioEmpresa> = {};
    for (const [k, v] of Object.entries(itemData)) {
      if (k === 'id' || v === undefined) continue;
      if (k === 'valorUnitarioEstimado') {
        cambios.valorUnitarioEstimado = Number(v);
      } else if (k === 'cantidadDisponible') {
        cambios.cantidadDisponible = Number(v);
      } else if (k === 'subcategoria') {
        cambios.subcategoria = (v as string)?.trim() || undefined;
      } else if (k === 'notas') {
        (cambios as any).notas = (v as string)?.trim() || undefined;
      } else if (k === 'nombre') {
        cambios.nombre = (v as string)?.trim();
      } else {
        (cambios as any)[k] = v;
      }
    }

    inventario[index] = { ...originalItem, ...cambios } as ServicioEmpresa;
    finalItemData = inventario[index];

    if (SIN_BASE()) {
      await writeData(INSUMOS_FILE, inventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
    } else {
      const guardado = await mutateDataItem<ServicioEmpresa>(
        INSUMOS_FILE,
        INSUMOS_COLLECTION,
        itemId,
        (actual) => ({ ...actual, ...cambios } as ServicioEmpresa)
      );
      if (!guardado) {
        limpiarCacheInsumos();
        return { success: false, error: 'Ese insumo ya no existe: lo borró otra persona.' };
      }
      finalItemData = guardado;
    }
  } else {
    if (itemIdBuscado && index === -1) {
      return { success: false, error: `Insumo con ID ${itemIdBuscado} no encontrado.` };
    }

    const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
      ...itemData,
      tipoItem: itemData.tipoItem || 'Insumo/Ingrediente',
      valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined && !isNaN(Number(itemData.valorUnitarioEstimado)) ? Number(itemData.valorUnitarioEstimado) : (itemData.valorUnitarioEstimado || 0),
      cantidadDisponible: itemData.cantidadDisponible !== undefined && !isNaN(Number(itemData.cantidadDisponible)) ? Number(itemData.cantidadDisponible) : undefined,
      subcategoria: itemData.subcategoria?.trim() || undefined,
      notas: (itemData as any).notas?.trim() || undefined,
    };

    if (Number(dataWithParsedNumbers.valorUnitarioEstimado) < 0) {
      return { success: false, error: 'El costo del insumo no puede ser negativo.' };
    }
    if (dataWithParsedNumbers.cantidadDisponible !== undefined
        && Number(dataWithParsedNumbers.cantidadDisponible) < 0) {
      return { success: false, error: 'La cantidad disponible no puede ser negativa.' };
    }

    if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === '') return { success: false, error: 'El nombre del insumo es obligatorio.' };
    if (!dataWithParsedNumbers.categoria) return { success: false, error: 'La categoría es obligatoria.' };
    if (!dataWithParsedNumbers.unidad) return { success: false, error: 'La unidad es obligatoria para insumos.' };

    const idDeLaPantalla = idDelIntento('insumo', opciones?.idIntento);
    const yaGuardado = idDeLaPantalla ? inventario.find((s) => s.id === idDeLaPantalla) : undefined;
    if (yaGuardado) return { success: true, id: yaGuardado.id, servicio: yaGuardado };
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un insumo con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = idDeLaPantalla ?? `insumo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);

    if (SIN_BASE()) {
      await writeData(INSUMOS_FILE, inventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
    } else {
      await createDataItem(INSUMOS_FILE, INSUMOS_COLLECTION, itemId, finalItemData as ServicioEmpresa);
    }
  }

  limpiarCacheInsumos();

  // Si esto falla, el insumo queda con el precio nuevo y **los menus con el viejo**:
  // la lista de compras y el costo de la comida salen mal sin que nadie lo note.
  const propagado = await propagateInsumoChangesToMenus(finalItemData as ServicioEmpresa);
  if (!propagado?.success) {
    return {
      success: false,
      error: propagado?.error || 'El insumo se guardo, pero los menus que lo usan no se pudieron actualizar. Revisa los costos.',
      id: itemId,
      servicio: finalItemData as ServicioEmpresa,
    };
  }

  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

async function deleteInsumoInterno(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  const { getMenus } = await import('./menus-catering');
  const menus = await getMenus();
  const menusEnUso = menus.filter(m =>
    m.items?.some(item =>
      item.ingredients?.some(ing => ing.origenId === id)
    )
  );
  if (menusEnUso.length > 0) {
    return {
      success: false,
      error: `No se puede eliminar el insumo porque está siendo utilizado en ${menusEnUso.length} menú(s)/receta(s) de catering.`,
    };
  }

  limpiarCacheInsumos();
  if (!SIN_BASE()) {
    const borrado = await deleteDataItem(INSUMOS_FILE, INSUMOS_COLLECTION, id);
    limpiarCacheInsumos();
    return borrado ? { success: true } : { success: false, error: `Insumo con ID ${id} no encontrado para eliminar.` };
  }
  let inventario = await leerInsumosCrudos();
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) return { success: false, error: `Insumo con ID ${id} no encontrado para eliminar.` };
  await writeData(INSUMOS_FILE, inventario);
  limpiarCacheInsumos();
  return { success: true };
}


type AjustePendiente = { porcentaje: number; fecha: string; pendientes: string[] };
const AJUSTE_PENDIENTE_FILE = 'insumos-ajuste-pendiente.json';

async function adjustAllInsumoCostsInterno(
  percentage: number,
  operationId?: string,
): Promise<{ success: boolean; error?: string; sinCambios?: boolean }> {
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  if (!Number.isFinite(percentage) || percentage === 0 || !operationId || !/^[a-zA-Z0-9_-]{1,120}$/.test(operationId)) {
    return { success: false, sinCambios: true, error: "El porcentaje debe ser un número distinto de cero y la operación debe ser válida." };
  }
  // Los mismos dos topes que ya tenian los servicios. Sin ellos, un -200 daba
  // vuelta el signo y todo el catalogo de insumos quedaba en negativo; y un 5000
  // mal tipeado (en vez de 50) multiplicaba los costos por cincuenta y uno.
  if (percentage <= -100) {
    return { success: false, sinCambios: true, error: 'No se puede bajar los costos un 100% o más: quedarían en cero o en negativo.' };
  }
  if (percentage > 1000) {
    return { success: false, sinCambios: true, error: 'El ajuste no puede superar el 1000%. Revisá el número que pusiste.' };
  }


  try {
    limpiarCacheInsumos();
    // Un ajuste anterior quedó a medias (Codex, auditoría 66): los insumos ya tienen el porcentaje
    // y faltan menús. Reintentar con el mismo porcentaje NO lo vuelve a aplicar: sólo termina los
    // menús que faltaban. Con otro porcentaje no se deja, porque se sumaría encima del anterior.
    const pendiente = await readData<AjustePendiente | null>(AJUSTE_PENDIENTE_FILE, null);
    {
      if (SIN_BASE()) return { success: false, sinCambios: true, error: 'El ajuste seguro requiere la base de datos; no se cambiaron los costos.' };
      const { comenzarAjusteCostos, terminarAjusteCostos, leerInsumosParaAjuste, AjusteNoIniciadoError } = await import('@/lib/insumos/ajuste-costos-idempotente');
      if (pendiente?.pendientes?.length && pendiente.porcentaje !== percentage) {
        return { success: false, sinCambios: true, error: `Hay un ajuste del ${pendiente.porcentaje}% pendiente. Termina ese ajuste primero.` };
      }
      let recibo;
      try {
        recibo = await comenzarAjusteCostos(percentage, operationId, pendiente?.pendientes?.length ? pendiente.pendientes : undefined);
      } catch (error) {
        if (error instanceof AjusteNoIniciadoError) return { success: false, sinCambios: true, error: error.message };
        throw error;
      }
      if (recibo.terminado) {
        const { scheduleAutoBackupAfterWrite } = await import('@/lib/backup/schedule-after-write');
        await scheduleAutoBackupAfterWrite('insumos.json');
        return { success: true };
      }
      limpiarCacheInsumos();
      const actualizados = await leerInsumosParaAjuste();
      for (const id of recibo.ids) {
        const insumo = actualizados.find(item => item.id === id);
        if (!insumo) continue;
        const resultado = await propagateInsumoChangesToMenus(insumo, operationId);
        if (!resultado.success) return { success: false, error: resultado.error || 'El ajuste se guardo pero faltan menus. Reintenta el mismo ajuste: no se vuelve a aplicar.' };
      }
      if (pendiente?.pendientes?.length) await writeData(AJUSTE_PENDIENTE_FILE, { ...pendiente, pendientes: [] });
      await terminarAjusteCostos(operationId);
      const { scheduleAutoBackupAfterWrite } = await import('@/lib/backup/schedule-after-write');
      await scheduleAutoBackupAfterWrite('insumos.json');
      return { success: true };
    }

  } catch (error: any) {
    console.error("Error adjusting insumo costs:", error);
    return { success: false, error: `No se pudo terminar el ajuste de costos. Reintentá el mismo ajuste para confirmar sin volver a aplicarlo. ${error?.message || ''}`.trim() };
  }
}

/**
 * UN TURNO PARA QUE DOS GUARDADOS NO SE PISEN.
 *
 * Cada guardado aca lee la lista entera, le cambia un renglon y vuelve a escribir la lista
 * entera. Sin turno, si dos personas guardan casi al mismo tiempo, **el segundo escribe encima
 * de la lista vieja y el cambio del primero desaparece**, con las dos pantallas diciendo
 * "guardado". Con turno, el segundo espera y trabaja sobre lo que ya quedo guardado.
 */
const turnoDeInsumos = new AsyncMutex();

export async function saveInsumo(...datos: Parameters<typeof saveInsumoInterno>): ReturnType<typeof saveInsumoInterno> {
  // La sesion se pide aca, en la puerta de entrada, y no solo adentro: asi el control de
  // seguridad ve el candado en la accion que de verdad se llama desde la pantalla.
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  return turnoDeInsumos.runExclusive(() => saveInsumoInterno(...datos));
}

export async function deleteInsumo(...datos: Parameters<typeof deleteInsumoInterno>): ReturnType<typeof deleteInsumoInterno> {
  // La sesion se pide aca, en la puerta de entrada, y no solo adentro: asi el control de
  // seguridad ve el candado en la accion que de verdad se llama desde la pantalla.
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  return turnoDeInsumos.runExclusive(() => deleteInsumoInterno(...datos));
}

export async function adjustAllInsumoCosts(...datos: Parameters<typeof adjustAllInsumoCostsInterno>): ReturnType<typeof adjustAllInsumoCostsInterno> {
  // La sesion se pide aca, en la puerta de entrada, y no solo adentro: asi el control de
  // seguridad ve el candado en la accion que de verdad se llama desde la pantalla.
  await requirePermisoAlguno(PERMISOS.INSUMOS);
  return turnoDeInsumos.runExclusive(() => adjustAllInsumoCostsInterno(...datos));
}
