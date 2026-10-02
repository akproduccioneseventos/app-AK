
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { createDataItem, deleteDataItem, readData, updateDataItem } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const ACTIVOS_FIJOS_FILE = 'activos-fijos.json';
const ACTIVOS_FIJOS_COLLECTION = 'activos_fijos';

export async function getActivosFijos(): Promise<ServicioEmpresa[]> {
    // Cada activo trae lo que costo y cuanto hay. Es del equipo.
    await requireAppSession();
    const items = await readData<any[]>(ACTIVOS_FIJOS_FILE, []);
    return (Array.isArray(items) ? items : []).map(item => ({
      ...item,
      tipoItem: 'Activo Fijo',
      valorUnitarioEstimado: item.valorUnitarioEstimado !== undefined && !isNaN(Number(item.valorUnitarioEstimado)) ? Number(item.valorUnitarioEstimado) : 0,
      cantidadDisponible: item.cantidadDisponible !== undefined && !isNaN(Number(item.cantidadDisponible)) ? Number(item.cantidadDisponible) : undefined,
    })).sort((a, b) =>
      (a.categoria || '').localeCompare(b.categoria || '')
      || (a.nombre || '').localeCompare(b.nombre || '')
    );
}

export async function getActivoFijoById(id: string): Promise<ServicioEmpresa | null> {
  await requireAppSession();
  const activos = await getActivosFijos();
  return activos.find(s => s.id === id) || null;
}

export async function saveActivoFijo(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  await requireAppSession();
  let inventario = await getActivosFijos();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    tipoItem: 'Activo Fijo',
    cantidadDisponible: itemData.cantidadDisponible !== undefined && !isNaN(Number(itemData.cantidadDisponible)) ? Number(itemData.cantidadDisponible) : undefined,
    valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined && !isNaN(Number(itemData.valorUnitarioEstimado)) ? Number(itemData.valorUnitarioEstimado) : 0,
    imageUrl: itemData.imageUrl?.trim() || undefined,
    // Remover campos de precio de venta, ya que no aplican a activos para lista de carga
    precioVenta: undefined,
    precioBase: undefined,
    precioPorPersona: undefined,
    tramosDePrecio: undefined,
    // Mantener campos de cálculo de cantidad
    calculationMethod: itemData.calculationMethod || 'fijo',
    invitadosPorUnidad: itemData.invitadosPorUnidad === undefined || itemData.invitadosPorUnidad === null || isNaN(Number(itemData.invitadosPorUnidad)) ? undefined : Number(itemData.invitadosPorUnidad),
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del activo es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  // El `min` del formulario lo controla el navegador y se saltea. Un activo con
  // cantidad negativa descuadra la lista de carga del salon.
  if (dataWithParsedNumbers.cantidadDisponible !== undefined
      && Number(dataWithParsedNumbers.cantidadDisponible) < 0) {
    return { success: false, error: 'La cantidad no puede ser negativa.' };
  }
  if (Number(dataWithParsedNumbers.valorUnitarioEstimado) < 0) {
    return { success: false, error: 'El valor del activo no puede ser negativo.' };
  }
  if (!dataWithParsedNumbers.unidad) return { success: false, error: "La unidad es obligatoria para activos." };

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Activo con ID ${itemId} no encontrado.` };

    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un activo con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = `activo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }

  if ('id' in itemData && itemData.id) {
    const updated = await updateDataItem(
      ACTIVOS_FIJOS_FILE,
      ACTIVOS_FIJOS_COLLECTION,
      itemId,
      finalItemData,
    );
    if (!updated) return { success: false, error: `Activo con ID ${itemId} no encontrado.` };
  } else {
    await createDataItem(ACTIVOS_FIJOS_FILE, ACTIVOS_FIJOS_COLLECTION, itemId, finalItemData);
  }
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteActivoFijo(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const activo = await getActivoFijoById(id);
  const { getFiestas } = await import('./fiesta/fiesta.actions');
  const fiestas = await getFiestas(false);
  const fiestasEnUso = fiestas.filter(f =>
    f.listaDeCargaOperativa?.categorias?.some(cat =>
      // OJO: en la lista de carga, el equipo del catalogo se guarda en `origenId`. Antes se
      // miraban `item.id` y `activoId` -que no existen ahi- y quedaba el nombre como unica
      // defensa: **con renombrar el equipo, se podia borrar aunque estuviera asignado a una
      // fiesta**, y esa fiesta se quedaba sin el equipo sin que nadie se enterara. Lo encontro
      // Codex el 18 de septiembre de 2026.
      // Sin `as any`: si manana alguien renombra el campo, el revisor de tipos avisa. Con
      // `as any` no avisaba nadie, y esa es justamente la forma en que este control se rompio.
      cat.items?.some(item =>
        item.origenId === id
        || item.id === id
        || (activo && item.nombre === activo.nombre)
      )
    )
  );
  if (fiestasEnUso.length > 0) {
    return {
      success: false,
      error: `No se puede eliminar el activo fijo porque está asignado en la lista de carga de ${fiestasEnUso.length} evento(s).`,
    };
  }

  const deleted = await deleteDataItem(ACTIVOS_FIJOS_FILE, ACTIVOS_FIJOS_COLLECTION, id);
  if (!deleted) return { success: false, error: `Activo Fijo con ID ${id} no encontrado para eliminar.` };
  return { success: true };
}

export async function registrarMantenimientoDeEquipo(
  equipoId: string,
  datos: { fecha: string; nota: string; costo?: number; registroId?: string }
): Promise<{ success: boolean; error?: string; gastoPendiente?: boolean; registroId?: string; servicio?: ServicioEmpresa }> {
  await requireAppSession();
  const activo = await getActivoFijoById(equipoId);
  if (!activo) return { success: false, error: `Activo con ID ${equipoId} no encontrado.` };

  const registroId = datos.registroId || `mant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const costoNum = typeof datos.costo === 'number' && datos.costo > 0 ? datos.costo : undefined;
  const tieneCosto = costoNum !== undefined && costoNum > 0;

  const historialPrevio = Array.isArray(activo.mantenimiento?.historial) ? [...activo.mantenimiento!.historial] : [];
  const idxExistente = historialPrevio.findIndex(h => h.id === registroId);

  const registroMantenimiento = {
    id: registroId,
    fecha: datos.fecha,
    nota: datos.nota.trim(),
    costo: costoNum,
    gastoPendiente: tieneCosto,
  };

  if (idxExistente >= 0) {
    historialPrevio[idxExistente] = { ...historialPrevio[idxExistente], ...registroMantenimiento };
  } else {
    historialPrevio.unshift(registroMantenimiento);
  }

  const activoConMantenimiento: ServicioEmpresa = {
    ...activo,
    mantenimiento: {
      ...activo.mantenimiento,
      ultimoAt: datos.fecha,
      historial: historialPrevio,
    },
  };

  const resSaveActivo = await saveActivoFijo(activoConMantenimiento);
  if (!resSaveActivo.success) {
    return { success: false, error: resSaveActivo.error || 'No se pudo guardar el mantenimiento del equipo.' };
  }

  if (tieneCosto) {
    const { saveGastoGeneral } = await import('./gastos');
    let gastoExitoso = false;
    try {
      const resGasto = await saveGastoGeneral({
        concepto: `Mantenimiento: ${activo.nombre || 'Equipo'} - ${datos.nota.trim()}`,
        fecha: datos.fecha,
        categoria: 'Reparaciones y Mantenimiento',
        monto: costoNum,
        notas: `Registrado automáticamente desde Activos Fijos (${equipoId})`,
        idempotencyKey: `mantenimiento:${equipoId}:${registroId}`,
      });
      gastoExitoso = Boolean(resGasto?.success);
    } catch {
      gastoExitoso = false;
    }

    if (!gastoExitoso) {
      return {
        success: false,
        gastoPendiente: true,
        registroId,
        error: 'Se anotó el mantenimiento pero no el gasto: tocá Reintentar',
      };
    }

    const histFinal = historialPrevio.map(h => h.id === registroId ? { ...h, gastoPendiente: false } : h);
    const activoFinal: ServicioEmpresa = {
      ...activoConMantenimiento,
      mantenimiento: {
        ...activoConMantenimiento.mantenimiento,
        historial: histFinal,
      },
    };
    const resGuardado = await saveActivoFijo(activoFinal);
    if (!resGuardado.success) {
      return {
        success: false,
        registroId,
        error: resGuardado.error || 'No se pudo guardar el activo con el mantenimiento',
      };
    }
    return { success: true, registroId, servicio: activoFinal };
  }

  return { success: true, registroId, servicio: activoConMantenimiento };
}
