
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData } from '@/lib/data-service';

const SERVICIOS_EMPRESA_FILE = 'servicios-empresa.json';

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
    const items = await readData<any[]>(SERVICIOS_EMPRESA_FILE, []);
    return items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      tipoItem: 'Servicio',
      categoria: item.categoria,
      subcategoria: item.subcategoria || undefined,
      valorUnitarioEstimado: item.valorUnitarioEstimado === undefined || item.valorUnitarioEstimado === null || isNaN(Number(item.valorUnitarioEstimado)) ? 0 : Number(item.valorUnitarioEstimado),
      notas: item.notas || undefined,
      precioVenta: item.precioVenta === undefined || item.precioVenta === null || isNaN(Number(item.precioVenta)) ? undefined : Number(item.precioVenta),
      calculationMethod: item.calculationMethod,
      precioBase: item.precioBase === undefined || item.precioBase === null || isNaN(Number(item.precioBase)) ? undefined : Number(item.precioBase),
      precioPorPersona: item.precioPorPersona === undefined || item.precioPorPersona === null || isNaN(Number(item.precioPorPersona)) ? undefined : Number(item.precioPorPersona),
      invitadosPorUnidad: item.invitadosPorUnidad === undefined || item.invitadosPorUnidad === null || isNaN(Number(item.invitadosPorUnidad)) ? undefined : Number(item.invitadosPorUnidad),
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
    tipoItem: 'Servicio', // Force type to 'Servicio'
    valorUnitarioEstimado: itemData.valorUnitarioEstimado === undefined || itemData.valorUnitarioEstimado === null || isNaN(Number(itemData.valorUnitarioEstimado)) ? 0 : Number(itemData.valorUnitarioEstimado),
    precioVenta: itemData.precioVenta === undefined || itemData.precioVenta === null || isNaN(Number(itemData.precioVenta)) ? undefined : Number(itemData.precioVenta),
    precioBase: itemData.precioBase === undefined || itemData.precioBase === null || isNaN(Number(itemData.precioBase)) ? undefined : Number(itemData.precioBase),
    precioPorPersona: itemData.precioPorPersona === undefined || itemData.precioPorPersona === null || isNaN(Number(itemData.precioPorPersona)) ? undefined : Number(itemData.precioPorPersona),
    invitadosPorUnidad: itemData.invitadosPorUnidad === undefined || itemData.invitadosPorUnidad === null || isNaN(Number(itemData.invitadosPorUnidad)) ? undefined : Number(itemData.invitadosPorUnidad),
    tramosDePrecio: itemData.tramosDePrecio || undefined,
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };
  
  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del servicio es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  
  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Servicio con ID ${itemId} no encontrado.` };
    
    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un servicio con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = `serv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }
  
  await writeData(SERVICIOS_EMPRESA_FILE, inventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let inventario = await getServiciosEmpresa();
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  await writeData(SERVICIOS_EMPRESA_FILE, inventario);
  return { success: true };
}

export async function duplicateServicioEmpresa(
  servicioId: string
): Promise<{ success: boolean; servicio?: ServicioEmpresa; error?: string }> {
  const inventario = await getServiciosEmpresa();
  const servicioToDuplicate = inventario.find(s => s.id === servicioId);

  if (!servicioToDuplicate) {
    return { success: false, error: 'Servicio a duplicar no encontrado.' };
  }

  // Create a new object, omitting the id
  const { id, ...originalData } = servicioToDuplicate;

  const newServicioData: Omit<ServicioEmpresa, 'id'> = {
    ...originalData,
    nombre: `[COPIA] ${originalData.nombre}`,
  };

  // Use the existing save function to create the new service.
  // It will generate a new ID and handle saving the file.
  return saveServicioEmpresa(newServicioData);
}

export async function adjustAllServicePrices(
  percentage: number
): Promise<{ success: boolean; error?: string }> {
  if (isNaN(percentage) || percentage === 0) {
    return { success: false, error: "El porcentaje debe ser un número distinto de cero." };
  }
  
  try {
    const inventario = await getServiciosEmpresa();
    if (inventario.length === 0) {
      return { success: false, error: "No hay servicios en el catálogo para ajustar." };
    }

    const multiplier = 1 + percentage / 100;

    const updatedInventario = inventario.map(servicio => {
      // We only adjust the selling prices, not the estimated cost (valorUnitarioEstimado)
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

    await writeData(SERVICIOS_EMPRESA_FILE, updatedInventario, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));

    return { success: true };
  } catch (error: any) {
    console.error("Error adjusting service prices:", error);
    return { success: false, error: "Ocurrió un error al intentar ajustar los precios." };
  }
}
