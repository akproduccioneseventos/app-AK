
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData } from '@/lib/data-service';

const SERVICIOS_EMPRESA_FILE = 'servicios-empresa.json';

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
    const items = await readData<any[]>(SERVICIOS_EMPRESA_FILE, []);
    // Ensure all numeric fields are correctly parsed or defaulted to undefined
    return items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      tipoItem: item.tipoItem,
      categoria: item.categoria,
      subcategoria: item.subcategoria || undefined,
      cantidadDisponible: item.cantidadDisponible !== undefined && !isNaN(Number(item.cantidadDisponible)) ? Number(item.cantidadDisponible) : undefined,
      valorUnitarioEstimado: item.valorUnitarioEstimado !== undefined && !isNaN(Number(item.valorUnitarioEstimado)) ? Number(item.valorUnitarioEstimado) : undefined,
      unidad: item.unidad,
      notas: item.notas || undefined,
      precioVenta: item.precioVenta !== undefined && !isNaN(Number(item.precioVenta)) ? Number(item.precioVenta) : undefined,
      calculationMethod: item.calculationMethod,
      precioBase: item.precioBase !== undefined && !isNaN(Number(item.precioBase)) ? Number(item.precioBase) : undefined,
      precioPorPersona: item.precioPorPersona !== undefined && !isNaN(Number(item.precioPorPersona)) ? Number(item.precioPorPersona) : undefined,
      invitadosPorUnidad: item.invitadosPorUnidad !== undefined && !isNaN(Number(item.invitadosPorUnidad)) ? Number(item.invitadosPorUnidad) : undefined,
      tramosDePrecio: item.tramosDePrecio || undefined,
    }));
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  const servicios = await getServiciosEmpresa();
  return servicios.find(s => s.id === id) || null;
}

export async function saveServicioEmpresa(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  let inventario = await getServiciosEmpresa();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  // Robust parsing of numeric values, ensuring they are numbers or undefined, but never NaN
  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    valorUnitarioEstimado: itemData.valorUnitarioEstimado === undefined || itemData.valorUnitarioEstimado === null || isNaN(Number(itemData.valorUnitarioEstimado)) ? 0 : Number(itemData.valorUnitarioEstimado),
    cantidadDisponible: itemData.cantidadDisponible === undefined || itemData.cantidadDisponible === null || isNaN(Number(itemData.cantidadDisponible)) ? undefined : Number(itemData.cantidadDisponible),
    precioVenta: itemData.precioVenta === undefined || itemData.precioVenta === null || isNaN(Number(itemData.precioVenta)) ? undefined : Number(itemData.precioVenta),
    precioBase: itemData.precioBase === undefined || itemData.precioBase === null || isNaN(Number(itemData.precioBase)) ? undefined : Number(itemData.precioBase),
    precioPorPersona: itemData.precioPorPersona === undefined || itemData.precioPorPersona === null || isNaN(Number(itemData.precioPorPersona)) ? undefined : Number(itemData.precioPorPersona),
    invitadosPorUnidad: itemData.invitadosPorUnidad === undefined || itemData.invitadosPorUnidad === null || isNaN(Number(itemData.invitadosPorUnidad)) ? undefined : Number(itemData.invitadosPorUnidad),
    tramosDePrecio: itemData.tramosDePrecio || undefined,
    tipoItem: itemData.tipoItem || 'Insumo/Ingrediente',
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del ítem es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  if (!dataWithParsedNumbers.tipoItem) return { success: false, error: "El tipo de ítem es obligatorio." };
  if (dataWithParsedNumbers.tipoItem !== 'Servicio' && !dataWithParsedNumbers.unidad) {
    return { success: false, error: "La unidad es obligatoria para Insumos y Activos." };
  }


  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Ítem con ID ${itemId} no encontrado.` };
    
    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un ítem con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }
  await writeData(SERVICIOS_EMPRESA_FILE, inventario, (a, b) => {
      const catComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (catComp !== 0) return catComp;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let inventario = await getServiciosEmpresa();
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) return { success: false, error: `Ítem con ID ${id} no encontrado para eliminar.` };
  await writeData(SERVICIOS_EMPRESA_FILE, inventario);
  return { success: true };
}
