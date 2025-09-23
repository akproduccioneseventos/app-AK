
'use server';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto'; 
import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';

const PRESUPUESTOS_FILE = 'presupuestos.json';

// Helper function to recalculate costs based on complex logic for a single item
function recalcularCostoItem(item: ItemPresupuestado, invitados: number): number {
  if (item.esRegalo) return 0;
  
  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = item.precioBase ?? precioUnitario;
      break;
    case 'porPersona':
      itemTotal = (item.precioPorPersona ?? precioUnitario) * invitados;
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        const basePrice = item.precioBase ?? precioUnitario;
        itemTotal = Math.ceil(invitados / invitadosPorUnidadNum) * basePrice;
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback for single unit
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => invitados >= t.desde && invitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to original simple calculation
      itemTotal = item.cantidad * item.precioUnitario;
  }
  return itemTotal;
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  return readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const presupuestos = await getPresupuestos();
  return presupuestos.find(p => p.id === id) || null;
}

export async function savePresupuesto(presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'>): Promise<{ success: boolean, id?: string, error?: string, presupuesto?: Presupuesto }> {
  let presupuestos = await getPresupuestos();
  
  const validItems = presupuestoData.itemsPresupuestados.map(item => {
    const costoTotalItem = recalcularCostoItem(item, presupuestoData.invitadosCantidad);
    return { ...item, costoTotalItem };
  });

  const costoTotalEstimadoRecalculado = validItems
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + item.costoTotalItem, 0);

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
    itemsPresupuestados: validItems,
    costoTotalEstimado: costoTotalEstimadoRecalculado,
    totalConDescuento: descuentoAplicado > 0 ? finalTotalWithDiscount : undefined,
    id: `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    estado: 'Borrador', 
    invoiceId: undefined,
    ajusteAnualActivo: false, // Ensure it's false on creation
  };
  presupuestos.push(nuevoPresupuesto);
  await writeData(PRESUPUESTOS_FILE, presupuestos, (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { success: true, id: nuevoPresupuesto.id, presupuesto: nuevoPresupuesto };
}

export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoData.id);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoData.id} no encontrado.` };
  }
  
  const isNowAcceptedOrBilled = ['Aceptado', 'Facturado'].includes(presupuestoData.estado);
  const wasNotAcceptedOrBilled = !['Aceptado', 'Facturado'].includes(presupuestos[index].estado);

  // Activate adjustment if the status changes TO 'Aceptado' or 'Facturado' for the first time.
  const activateAdjustment = isNowAcceptedOrBilled && wasNotAcceptedOrBilled;


  const validItems = presupuestoData.itemsPresupuestados.map(item => {
    const costoTotalItem = recalcularCostoItem(item, presupuestoData.invitadosCantidad);
    return { ...item, costoTotalItem };
  });

  const costoTotalEstimadoRecalculado = validItems
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + item.costoTotalItem, 0);
  
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
  
  const updatedPresupuesto: Presupuesto = {
    ...presupuestoData,
    itemsPresupuestados: validItems,
    costoTotalEstimado: costoTotalEstimadoRecalculado,
    totalConDescuento: descuentoAplicado > 0 ? finalTotalWithDiscount : undefined,
    timestamp: new Date().toISOString(),
    // Keep existing value OR activate it if conditions are met. Never deactivate automatically.
    ajusteAnualActivo: presupuestos[index].ajusteAnualActivo || activateAdjustment,
  };
  
  presupuestos[index] = updatedPresupuesto;
  await writeData(PRESUPUESTOS_FILE, presupuestos);

  if (updatedPresupuesto.estado === 'Facturado' && updatedPresupuesto.invoiceId) {
    try {
      const linkedInvoice = await getInvoiceById(updatedPresupuesto.invoiceId);
      if (linkedInvoice) {
        
        const budgetTotal = updatedPresupuesto.totalConDescuento ?? updatedPresupuesto.costoTotalEstimado;
        
        const summaryItem: Omit<InvoiceItem, 'id'> = {
            description: `Servicios según presupuesto #${updatedPresupuesto.id.split('_').pop()?.substring(0,5)} (actualizado)`,
            quantity: 1,
            unitPrice: budgetTotal,
            total: budgetTotal,
        };
        
        const invoiceDataToUpdate: Invoice = {
            ...linkedInvoice,
            items: [{ ...summaryItem, id: `item_summary_update_${Date.now()}` }],
            notes: updatedPresupuesto.notas || linkedInvoice.notes,
        };

        await saveInvoice(invoiceDataToUpdate);
      }
    } catch (invoiceError) {
      console.error(`Error al sincronizar la factura del presupuesto actualizado ${updatedPresupuesto.id}:`, invoiceError);
    }
  }

  return { success: true, presupuesto: updatedPresupuesto };
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const initialLength = presupuestos.length;
  presupuestos = presupuestos.filter(p => p.id !== id);
  if (presupuestos.length === initialLength) {
    return { success: false, error: `Presupuesto con ID ${id} no encontrado para eliminar.` };
  }
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}

export async function markPresupuestoAsFacturado(presupuestoId: string, invoiceId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoId} no encontrado.` };
  }
  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].timestamp = new Date().toISOString();
  presupuestos[index].ajusteAnualActivo = true; // Also activate adjustment on invoicing
  
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}

export async function activateAnnualAdjustmentForBudget(presupuestoId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoId} no encontrado para activar ajuste.` };
  }
  if (presupuestos[index].ajusteAnualActivo) {
    return { success: true }; // Already active, no change needed.
  }
  
  presupuestos[index].ajusteAnualActivo = true;
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}
