
'use server';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto'; 
import fs from 'fs/promises';
import path from 'path';

// Import invoice actions and types
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';


const PRESUPUESTOS_COLLECTION_JSON = 'presupuestos.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const presupuestosFilePath = path.join(dataDirectory, PRESUPUESTOS_COLLECTION_JSON);


async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readPresupuestosFile(): Promise<Presupuesto[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(presupuestosFilePath);
    const fileContent = await fs.readFile(presupuestosFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    // Migration for old structure if needed (platosSeleccionados -> itemsPresupuestados)
    return (JSON.parse(fileContent) as Presupuesto[]).map(p => {
      if ((p as any).platosSeleccionados || (p as any).serviciosAdicionales) {
        const newItems: ItemPresupuestado[] = [];
        ((p as any).platosSeleccionados || []).forEach((plato: any) => {
          newItems.push({
            idServicioCatalogo: plato.idPlato || `plato_${plato.nombrePlato.replace(/\s+/g, '_')}`,
            nombreServicio: plato.nombrePlato,
            cantidad: plato.cantidad,
            precioUnitario: plato.costoUnitario,
            costoTotalItem: plato.costoTotalPlato,
            categoriaServicio: 'Menú', // Or derive from plato.descripcion
            unidad: 'porción', // Default or derive
          });
        });
        ((p as any).serviciosAdicionales || []).forEach((sa: any) => {
          newItems.push({
            idServicioCatalogo: sa.idServicio || `sa_${sa.nombreServicio.replace(/\s+/g, '_')}`,
            nombreServicio: sa.nombreServicio,
            cantidad: 1, // Assume 1 for old services
            precioUnitario: sa.costoServicio,
            costoTotalItem: sa.costoServicio,
            categoriaServicio: 'Servicio Adicional', // Or derive
            unidad: 'evento', // Default
          });
        });
        const { platosSeleccionados, serviciosAdicionales, costoSubtotalPlatos, costoSubtotalServicios, ...rest } = p as any;
        return { ...rest, itemsPresupuestados: newItems };
      }
      return {
        ...p,
        itemsPresupuestados: p.itemsPresupuestados || [], // Ensure it exists
      };
    });
  } catch (error) {
    return [];
  }
}

async function writePresupuestosFile(data: Presupuesto[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    await fs.writeFile(presupuestosFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing presupuestos JSON file:', error);
  }
}

async function initializeLocalPresupuestosFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(presupuestosFilePath);
    const fileContent = await fs.readFile(presupuestosFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writePresupuestosFile([]);
    } else {
      // Potentially run migration logic here if structure significantly changed
      const presupuestos = await readPresupuestosFile(); // This will apply migration if needed
      await writePresupuestosFile(presupuestos); // Re-save if migration occurred
    }
  } catch (error) {
    await writePresupuestosFile([]);
  }
}
initializeLocalPresupuestosFile();

// getPlatos is no longer relevant for the new structure as services are fetched from a different source
// export async function getPlatos(): Promise<PlatoPresupuesto[]> { ... }

export async function savePresupuesto(presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'>): Promise<{ success: boolean, id?: string, error?: string }> {
  let presupuestos = await readPresupuestosFile();
  
  // Ensure all items have positive quantities and prices before saving
  const validItems = presupuestoData.itemsPresupuestados.filter(item => item.cantidad > 0 && item.precioUnitario >= 0);
  if(validItems.length !== presupuestoData.itemsPresupuestados.length) {
    // Could return an error or just save valid items. For now, saving valid items.
    console.warn("Some items had invalid quantities or prices and were filtered out.");
  }

  const costoTotalEstimadoRecalculado = validItems.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  let finalTotalWithDiscount = costoTotalEstimadoRecalculado;
  let descuentoAplicado = 0;

  if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor && presupuestoData.descuentoValor > 0) {
    if (presupuestoData.descuentoTipo === 'porcentaje') {
      descuentoAplicado = (costoTotalEstimadoRecalculado * presupuestoData.descuentoValor) / 100;
    } else {
      descuentoAplicado = presupuestoData.descuentoValor;
    }
    finalTotalWithDiscount = costoTotalEstimadoRecalculado - descuentoAplicado;
  }


  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    itemsPresupuestados: validItems, // Use only valid items
    costoTotalEstimado: costoTotalEstimadoRecalculado, // Base total before discount
    totalConDescuento: descuentoAplicado > 0 ? finalTotalWithDiscount : undefined, // Final total after discount
    id: `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    estado: 'Borrador', 
    invoiceId: undefined,
  };
  presupuestos.push(nuevoPresupuesto);
  await writePresupuestosFile(presupuestos);
  return { success: true, id: nuevoPresupuesto.id };
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  return readPresupuestosFile();
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const presupuestos = await readPresupuestosFile();
  return presupuestos.find(p => p.id === id) || null;
}

export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const index = presupuestos.findIndex(p => p.id === presupuestoData.id);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoData.id} no encontrado.` };
  }

  const { id, ...dataToUpdate } = presupuestoData;
  
  const validItems = dataToUpdate.itemsPresupuestados.filter(item => item.cantidad > 0 && item.precioUnitario >= 0);
  const costoTotalEstimadoRecalculado = validItems.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  let finalTotalWithDiscount = costoTotalEstimadoRecalculado;
  let descuentoAplicado = 0;

  if (dataToUpdate.descuentoTipo && dataToUpdate.descuentoValor && dataToUpdate.descuentoValor > 0) {
    if (dataToUpdate.descuentoTipo === 'porcentaje') {
      descuentoAplicado = (costoTotalEstimadoRecalculado * dataToUpdate.descuentoValor) / 100;
    } else {
      descuentoAplicado = dataToUpdate.descuentoValor;
    }
    finalTotalWithDiscount = costoTotalEstimadoRecalculado - descuentoAplicado;
  }
  
  const finalDataToUpdate: Omit<Presupuesto, 'id'> = {
    ...dataToUpdate,
    itemsPresupuestados: validItems,
    costoTotalEstimado: costoTotalEstimadoRecalculado,
    totalConDescuento: descuentoAplicado > 0 ? finalTotalWithDiscount : undefined,
    timestamp: new Date().toISOString(), // Always update timestamp
  };
  
  const updatedPresupuesto = { id, ...finalDataToUpdate };
  presupuestos[index] = updatedPresupuesto;
  await writePresupuestosFile(presupuestos);

  // Fase 3: Sincronizar factura si el presupuesto está facturado
  if (updatedPresupuesto.estado === 'Facturado' && updatedPresupuesto.invoiceId) {
    try {
      const linkedInvoice = await getInvoiceById(updatedPresupuesto.invoiceId);
      if (linkedInvoice) {
        
        const budgetTotal = updatedPresupuesto.totalConDescuento ?? updatedPresupuesto.costoTotalEstimado;
        
        // Se actualiza la factura con un único ítem que resume el nuevo total del presupuesto.
        // Esto es más seguro que intentar replicar cada ítem y descuento.
        const summaryItem: Omit<InvoiceItem, 'id'> = {
            description: `Servicios según presupuesto #${updatedPresupuesto.id.split('_').pop()?.substring(0,5)} (actualizado)`,
            quantity: 1,
            unitPrice: budgetTotal,
            total: budgetTotal,
        };
        
        const invoiceDataToUpdate: Invoice = {
            ...linkedInvoice,
            items: [{
                ...summaryItem,
                id: `item_${linkedInvoice.id}_summary_update` 
            }],
            notes: updatedPresupuesto.notas || linkedInvoice.notes,
        };

        const updateInvoiceResult = await saveInvoice(invoiceDataToUpdate);
        
        if (!updateInvoiceResult.success) {
          console.warn(`Presupuesto ${updatedPresupuesto.id} actualizado, pero falló la sincronización con la factura ${updatedPresupuesto.invoiceId}: ${updateInvoiceResult.error}`);
        }
      }
    } catch (invoiceError) {
      console.error(`Error al sincronizar la factura del presupuesto actualizado ${updatedPresupuesto.id}:`, invoiceError);
    }
  }

  return { success: true, presupuesto: updatedPresupuesto };
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const initialLength = presupuestos.length;
  presupuestos = presupuestos.filter(p => p.id !== id);
  if (presupuestos.length === initialLength) {
    return { success: false, error: `Presupuesto con ID ${id} no encontrado para eliminar.` };
  }
  await writePresupuestosFile(presupuestos);
  return { success: true };
}

export async function markPresupuestoAsFacturado(presupuestoId: string, invoiceId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoId} no encontrado.` };
  }
  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].timestamp = new Date().toISOString();
  
  await writePresupuestosFile(presupuestos);
  return { success: true };
}
