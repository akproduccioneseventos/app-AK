
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData } from '@/lib/data-service';

const SERVICIOS_EMPRESA_FILE = 'servicios-empresa.json';

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
    const items = await readData<any[]>(SERVICIOS_EMPRESA_FILE, []);
    return items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      tipoItem: item.tipoItem,
      categoria: item.categoria,
      subcategoria: item.subcategoria || undefined,
      cantidadDisponible: item.cantidadDisponible === undefined ? undefined : Number(item.cantidadDisponible),
      valorUnitarioEstimado: item.valorUnitarioEstimado === undefined ? undefined : Number(item.valorUnitarioEstimado),
      unidad: item.unidad,
      notas: item.notas || undefined,
      precioVenta: item.precioVenta === undefined ? undefined : Number(item.precioVenta),
      calculationMethod: item.calculationMethod,
      precioBase: item.precioBase === undefined ? undefined : Number(item.precioBase),
      precioPorPersona: item.precioPorPersona === undefined ? undefined : Number(item.precioPorPersona),
      invitadosPorUnidad: item.invitadosPorUnidad === undefined ? undefined : Number(item.invitadosPorUnidad),
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

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined ? Number(itemData.valorUnitarioEstimado) : undefined,
    cantidadDisponible: itemData.cantidadDisponible !== undefined ? Number(itemData.cantidadDisponible) : undefined,
    precioVenta: itemData.precioVenta !== undefined ? Number(itemData.precioVenta) : undefined,
    precioBase: itemData.precioBase !== undefined ? Number(itemData.precioBase) : undefined,
    precioPorPersona: itemData.precioPorPersona !== undefined ? Number(itemData.precioPorPersona) : undefined,
    invitadosPorUnidad: itemData.invitadosPorUnidad !== undefined ? Number(itemData.invitadosPorUnidad) : undefined,
    tramosDePrecio: itemData.tramosDePrecio || undefined,
    tipoItem: itemData.tipoItem || 'Insumo/Ingrediente',
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del ítem es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  if (!dataWithParsedNumbers.unidad && dataWithParsedNumbers.tipoItem !== 'Servicio') return { success: false, error: "La unidad es obligatoria para Insumos y Activos." };
  if (!dataWithParsedNumbers.tipoItem) return { success: false, error: "El tipo de ítem es obligatorio." };

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Ítem con ID ${itemId} no encontrado.` };
    
    // Ensure that numeric fields that are empty/NaN become undefined, not 0
    const numberFields: (keyof ServicioEmpresa)[] = ['valorUnitarioEstimado', 'cantidadDisponible', 'precioVenta', 'precioBase', 'precioPorPersona', 'invitadosPorUnidad'];
    numberFields.forEach(field => {
        if (dataWithParsedNumbers[field] !== undefined && isNaN(Number(dataWithParsedNumbers[field]))) {
            dataWithParsedNumbers[field] = undefined;
        }
    });

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
