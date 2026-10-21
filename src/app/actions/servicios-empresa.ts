'use server';

import { idDelIntento } from '@/lib/intento-en-servidor';
import type { ServicioEmpresa, TipoCosto } from '@/types/empresa';
import { readData, writeData, createDataItem, mutateDataItem, deleteDataItem } from '@/lib/data-service';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { cachedFetch, cacheInvalidate } from '@/lib/server-cache';

const SERVICIOS_EMPRESA_FILE = 'servicios-empresa.json';
const SERVICIOS_COLLECTION = 'servicios';
/**
 * Con base, un servicio se guarda y se borra SOLO, no la lista entera (12 de octubre de 2026).
 * Antes cada guardado leia la lista de un cache de 15 segundos y la escribia entera: una lista
 * vieja le volvia el precio anterior al servicio que otro acababa de cambiar, o borraba el que
 * otro acababa de crear. Igual que insumos y menus. El ajuste masivo sigue guardando la lista
 * (cambia todos a proposito) pero leyendola fresca y con sus marcas de lectura.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';
const ORDEN_SERVICIOS = (a: ServicioEmpresa, b: ServicioEmpresa) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || '');

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
    // Cada servicio guarda lo que le CUESTA a la empresa y quien es el proveedor.
    // Sin esto, cualquiera pedia la lista y sacaba el margen de ganancia de cada
    // cosa que vende AK.
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM, PERMISOS.INSUMOS, PERMISOS.ORGANIZACION); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
    return leerServiciosEmpresa();
}

/** Sin comprobar sesion: uso interno de este archivo con cache en memoria. */
async function leerServiciosEmpresa(): Promise<ServicioEmpresa[]> {
    return cachedFetch('servicios-empresa-raw', async () => {
      const items = await readData<any[]>(SERVICIOS_EMPRESA_FILE, []);
      return (Array.isArray(items) ? items : []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        tipoItem: item.tipoItem || 'Servicio',
        categoria: item.categoria,
        subcategoria: item.subcategoria || undefined,
        valorUnitarioEstimado: item.valorUnitarioEstimado === undefined || item.valorUnitarioEstimado === null || isNaN(Number(item.valorUnitarioEstimado)) ? 0 : Number(item.valorUnitarioEstimado),
        tipoCosto: item.tipoCosto || (item.categoria === 'Personal' ? 'Personal' : 'Proveedor'),
        proveedor: item.proveedor || undefined,
        notas: item.notas || undefined,
        precioVenta: item.precioVenta === undefined || item.precioVenta === null || isNaN(Number(item.precioVenta)) ? undefined : Number(item.precioVenta),
        calculationMethod: item.calculationMethod || 'fijo',
        precioBase: item.precioBase === undefined || item.precioBase === null || isNaN(Number(item.precioBase)) ? undefined : Number(item.precioBase),
        precioPorPersona: item.precioPorPersona === undefined || item.precioPorPersona === null || isNaN(Number(item.precioPorPersona)) ? undefined : Number(item.precioPorPersona),
        invitadosPorUnidad: item.invitadosPorUnidad === undefined || item.invitadosPorUnidad === null || isNaN(Number(item.invitadosPorUnidad)) ? undefined : Number(item.invitadosPorUnidad),
        tramosDePrecio: item.tramosDePrecio || undefined,
        unidad: item.unidad || 'Unidad',
        imageUrl: item.imageUrl || undefined,
      }));
    }, 15_000);
}

/**
 * Los servicios como se muestran al prospecto y al cliente: nombre, categoria,
 * foto y **precio de venta**. Sin el costo, sin el margen y sin el proveedor.
 */
export async function getServiciosEmpresaPublicos(): Promise<ServicioEmpresa[]> {
  const servicios = await leerServiciosEmpresa();
  return servicios.map((s) => ({
    ...s,
    valorUnitarioEstimado: 0,
    proveedor: undefined,
    notas: undefined,
  }));
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM, PERMISOS.INSUMOS, PERMISOS.ORGANIZACION); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  const servicios = await leerServiciosEmpresa();
  return servicios.find(s => s.id === id) || null;
}

export async function saveServicioEmpresa(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  cacheInvalidate('servicios-empresa-raw'); // nada de lista vieja de 15 s para decidir si existe o esta repetido
  let inventario = await leerServiciosEmpresa();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    tipoItem: itemData.tipoItem || 'Servicio',
    valorUnitarioEstimado: itemData.valorUnitarioEstimado === undefined || itemData.valorUnitarioEstimado === null || isNaN(Number(itemData.valorUnitarioEstimado)) ? 0 : Number(itemData.valorUnitarioEstimado),
    precioVenta: itemData.precioVenta === undefined || itemData.precioVenta === null || isNaN(Number(itemData.precioVenta)) ? undefined : Number(itemData.precioVenta),
    precioBase: itemData.precioBase === undefined || itemData.precioBase === null || isNaN(Number(itemData.precioBase)) ? undefined : Number(itemData.precioBase),
    precioPorPersona: itemData.precioPorPersona === undefined || itemData.precioPorPersona === null || isNaN(Number(itemData.precioPorPersona)) ? undefined : Number(itemData.precioPorPersona),
    invitadosPorUnidad: itemData.invitadosPorUnidad === undefined || itemData.invitadosPorUnidad === null || isNaN(Number(itemData.invitadosPorUnidad)) ? undefined : Number(itemData.invitadosPorUnidad),
    tramosDePrecio: itemData.tramosDePrecio || undefined,
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: itemData.notas?.trim() || undefined,
    tipoCosto: itemData.tipoCosto || (itemData.categoria === 'Personal' ? 'Personal' : 'Proveedor'),
    proveedor: itemData.proveedor?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del servicio es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };

  // Un precio negativo en el catalogo se arrastra a todos los presupuestos que
  // usen ese servicio, y ahi infla la ganancia sin que se note. El cero se
  // permite a proposito: hay servicios de cortesia.
  const preciosAControlar: Array<[string, number | undefined]> = [
    ['el precio de venta', dataWithParsedNumbers.precioVenta],
    ['el precio base', dataWithParsedNumbers.precioBase],
    ['el precio por persona', dataWithParsedNumbers.precioPorPersona],
    ['el costo estimado', dataWithParsedNumbers.valorUnitarioEstimado],
  ];
  for (const [nombreCampo, valor] of preciosAControlar) {
    if (valor !== undefined && valor < 0) {
      return { success: false, error: `No se puede guardar ${nombreCampo} en negativo.` };
    }
  }
  const tramoEnNegativo = (dataWithParsedNumbers.tramosDePrecio || []).some(tramo => Number(tramo.precio) < 0);
  if (tramoEnNegativo) {
    return { success: false, error: 'Ningún tramo de precio puede quedar en negativo.' };
  }

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Servicio con ID ${itemId} no encontrado.` };

    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    // Pregunta 58: reintento de una respuesta perdida = exito con el servicio que ya esta, no "ya existe".
    const idDeLaPantalla = idDelIntento('serv', opciones?.idIntento);
    const yaGuardado = idDeLaPantalla ? inventario.find(s => s.id === idDeLaPantalla) : undefined;
    if (yaGuardado) return { success: true, id: yaGuardado.id, servicio: yaGuardado };
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un servicio con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = idDeLaPantalla ?? `serv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }

  if (SIN_BASE()) {
    await writeData(SERVICIOS_EMPRESA_FILE, inventario, ORDEN_SERVICIOS);
  } else if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    const cambios = dataWithParsedNumbers;
    const guardado = await mutateDataItem<ServicioEmpresa>(SERVICIOS_EMPRESA_FILE, SERVICIOS_COLLECTION, itemId, (actual) => ({ ...actual, ...cambios } as ServicioEmpresa));
    if (!guardado) {
      cacheInvalidate('servicios-empresa-raw');
      return { success: false, error: 'Ese servicio ya no existe: lo borró otra persona.' };
    }
    finalItemData = guardado;
  } else {
    await createDataItem(SERVICIOS_EMPRESA_FILE, SERVICIOS_COLLECTION, itemId, finalItemData as ServicioEmpresa);
  }
  cacheInvalidate('servicios-empresa-raw');
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  cacheInvalidate('servicios-empresa-raw');
  let inventario = await leerServiciosEmpresa();
  const targetServicio = inventario.find(s => s.id === id);

  const { getPresupuestos } = await import('./presupuestos');
  const presupuestos = await getPresupuestos();
  const presupuestosEnUso = presupuestos.filter(p =>
    p.itemsPresupuestados?.some(item =>
      item.idServicioCatalogo === id || (targetServicio && item.nombreServicio === targetServicio.nombre)
    )
  );
  if (presupuestosEnUso.length > 0) {
    return {
      success: false,
      error: `No se puede eliminar el servicio porque está siendo utilizado en ${presupuestosEnUso.length} presupuesto(s).`,
    };
  }

  if (!SIN_BASE()) {
    const borrado = await deleteDataItem(SERVICIOS_EMPRESA_FILE, SERVICIOS_COLLECTION, id);
    cacheInvalidate('servicios-empresa-raw');
    return borrado ? { success: true } : { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  }
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  await writeData(SERVICIOS_EMPRESA_FILE, inventario);
  cacheInvalidate('servicios-empresa-raw');
  return { success: true };
}

export async function duplicateServicioEmpresa(
  servicioId: string
): Promise<{ success: boolean; servicio?: ServicioEmpresa; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  const inventario = await leerServiciosEmpresa();
  const servicioToDuplicate = inventario.find(s => s.id === servicioId);

  if (!servicioToDuplicate) {
    return { success: false, error: 'Servicio a duplicar no encontrado.' };
  }

  const { id, ...originalData } = servicioToDuplicate;

  const newServicioData: Omit<ServicioEmpresa, 'id'> = {
    ...originalData,
    nombre: `[COPIA] ${originalData.nombre}`,
  };

  return saveServicioEmpresa(newServicioData);
}

/**
 * Para el ajuste masivo: la lista FRESCA (no la de 15 s) y con las marcas de lectura de la base.
 * Con las marcas, guardar la lista no pisa un servicio que otra persona edito en el medio
 * (avisa del choque) ni borra uno que otra persona creo.
 */
async function leerServiciosParaAjustar(): Promise<ServicioEmpresa[]> {
  cacheInvalidate('servicios-empresa-raw');
  const crudos = await readData<any[]>(SERVICIOS_EMPRESA_FILE, []);
  const num = (v: unknown) => (v === undefined || v === null || isNaN(Number(v)) ? undefined : Number(v));
  return (Array.isArray(crudos) ? crudos : []).map((item) => ({
    ...item,
    valorUnitarioEstimado: num(item.valorUnitarioEstimado) ?? 0,
    precioVenta: num(item.precioVenta),
    precioBase: num(item.precioBase),
    precioPorPersona: num(item.precioPorPersona),
  })) as ServicioEmpresa[];
}

export async function adjustAllServicePrices(
  percentage: number
): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: "El porcentaje debe ser un número distinto de cero." };
  }

  try {
    const inventario = await leerServiciosParaAjustar();
    if (inventario.length === 0) {
      return { success: false, error: "No hay servicios en el catálogo para ajustar." };
    }

    const multiplier = 1 + percentage / 100;

    const updatedInventario = inventario.map(servicio => {
      const newServicio = { ...servicio };

      if (newServicio.precioVenta !== undefined) {
        newServicio.precioVenta = Math.round((newServicio.precioVenta * multiplier));
      }
      if (newServicio.precioPorPersona !== undefined) {
        newServicio.precioPorPersona = Math.round((newServicio.precioPorPersona * multiplier));
      }
      if (newServicio.precioBase !== undefined) {
        newServicio.precioBase = Math.round((newServicio.precioBase * multiplier));
      }
      if (newServicio.tramosDePrecio && newServicio.tramosDePrecio.length > 0) {
        newServicio.tramosDePrecio = newServicio.tramosDePrecio.map(tramo => ({
          ...tramo,
          precio: Math.round((tramo.precio * multiplier)),
        }));
      }

      return newServicio;
    });

    await writeData(SERVICIOS_EMPRESA_FILE, updatedInventario, ORDEN_SERVICIOS);
    cacheInvalidate('servicios-empresa-raw');

    return { success: true };
  } catch (error: any) {
    console.error("Error adjusting service prices:", error);
    return { success: false, error: "Ocurrió un error al intentar ajustar los precios." };
  }
}

export async function adjustAllServiceCosts(
  percentage: number
): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS); // Precios del catálogo: no cualquier sesión (revisión de plata, 6/10/2026).
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: "El porcentaje debe ser un número distinto de cero." };
  }

  try {
    const inventario = await leerServiciosParaAjustar();
    if (inventario.length === 0) {
      return { success: false, error: "No hay servicios en el catálogo para ajustar." };
    }

    const multiplier = 1 + percentage / 100;

    const updatedInventario = inventario.map(servicio => {
      const newServicio = { ...servicio };

      if (newServicio.valorUnitarioEstimado !== undefined) {
        newServicio.valorUnitarioEstimado = Math.round(newServicio.valorUnitarioEstimado * multiplier * 100) / 100;
      }

      return newServicio;
    });

    await writeData(SERVICIOS_EMPRESA_FILE, updatedInventario, ORDEN_SERVICIOS);
    cacheInvalidate('servicios-empresa-raw');

    return { success: true };
  } catch (error: any) {
    console.error("Error adjusting service costs:", error);
    return { success: false, error: "Ocurrió un error al intentar ajustar los costos." };
  }
}
