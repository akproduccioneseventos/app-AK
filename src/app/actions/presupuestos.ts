

'use server';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto'; 
import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { findLeadByBudgetOrCreate, getCrmStages, moveCrmLead } from './crm';
import { createNotification } from './notifications';

const PRESUPUESTOS_FILE = 'presupuestos.json';

function recalcularCostoItem(item: ItemPresupuestado, invitados: number): number {
  if (item.esRegalo) return 0;
  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;
  switch (item.calculationMethod) {
    case 'fijo': itemTotal = item.precioBase ?? precioUnitario; break;
    case 'porPersona': itemTotal = (item.precioPorPersona ?? precioUnitario) * invitados; break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(invitados / invitadosPorUnidadNum) * (item.precioBase ?? precioUnitario);
      } else {
        itemTotal = item.precioBase ?? precioUnitario;
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => invitados >= t.desde && invitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: itemTotal = item.cantidad * item.precioUnitario;
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

export async function savePresupuesto(
  presupuestoData: Omit<Presupuesto, 'id'>,
  options?: { source?: 'manual' | 'simulator', leadId?: string }
): Promise<{ success: boolean, id?: string, error?: string, presupuesto?: Presupuesto, leadId?: string }> {
  let presupuestos = await getPresupuestos();
  
  const validItems = presupuestoData.itemsPresupuestados.map(item => ({
    ...item,
    costoTotalItem: recalcularCostoItem(item, presupuestoData.invitadosCantidad),
  }));

  const costoTotalEstimadoRecalculado = validItems
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + item.costoTotalItem, 0);

  let finalTotalWithDiscount = costoTotalEstimadoRecalculado;
  let descuentoAplicado = 0;

  if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor && presupuestoData.descuentoValor > 0) {
    descuentoAplicado = presupuestoData.descuentoTipo === 'porcentaje'
      ? (costoTotalEstimadoRecalculado * presupuestoData.descuentoValor) / 100
      : presupuestoData.descuentoValor;
    finalTotalWithDiscount = costoTotalEstimadoRecalculado - descuentoAplicado;
  }

  const presupuestoId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    id: presupuestoId,
    itemsPresupuestados: validItems,
    costoTotalEstimado: costoTotalEstimadoRecalculado,
    totalConDescuento: descuentoAplicado > 0 ? finalTotalWithDiscount : undefined,
    timestamp: new Date().toISOString(),
    estado: 'Enviado', // Default to "Sent" for new budgets
    invoiceId: undefined,
    ajusteAnualActivo: false,
    leadId: options?.leadId, // Start with the provided leadId
  };

  presupuestos.push(nuevoPresupuesto);
  await writeData(PRESUPUESTOS_FILE, presupuestos, (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let finalLeadId = options?.leadId;

  // Post-save CRM logic
  try {
    const { lead, isNew } = await findLeadByBudgetOrCreate(nuevoPresupuesto);
    finalLeadId = lead.id;

    if (isNew || options?.source === 'manual' || options?.source === 'simulator') {
        const stages = await getCrmStages();
        const targetStage = stages.find(s => s.name.toLowerCase().includes('presupuesto'));
        if (targetStage && lead.currentStageId !== targetStage.id) {
            await moveCrmLead(lead.id, targetStage.id);
        }
    }
  } catch (crmError: any) {
    console.warn(`Presupuesto ${presupuestoId} guardado, pero falló la sincronización con el CRM: ${crmError.message}`);
  }

  return { success: true, id: nuevoPresupuesto.id, presupuesto: nuevoPresupuesto, leadId: finalLeadId };
}


export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; id?: string; presupuesto?: Presupuesto; error?: string }> {
    let presupuestos = await getPresupuestos();
    const index = presupuestos.findIndex(p => p.id === presupuestoData.id);
    if (index === -1) {
        return { success: false, error: `Presupuesto con ID ${presupuestoData.id} no encontrado.` };
    }

    const isNowAcceptedOrBilled = ['Aceptado', 'Facturado'].includes(presupuestoData.estado);
    const wasNotAcceptedOrBilled = !['Aceptado', 'Facturado'].includes(presupuestos[index].estado);
    const activateAdjustment = isNowAcceptedOrBilled && wasNotAcceptedOrBilled;

    const validItems = presupuestoData.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, presupuestoData.invitadosCantidad),
    }));

    const costoTotalEstimadoRecalculado = validItems
        .filter(item => !item.esRegalo)
        .reduce((sum, item) => sum + item.costoTotalItem, 0);

    let finalTotalWithDiscount = costoTotalEstimadoRecalculado;
    if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor && presupuestoData.descuentoValor > 0) {
        const descuentoAplicado = presupuestoData.descuentoTipo === 'porcentaje'
            ? (costoTotalEstimadoRecalculado * presupuestoData.descuentoValor) / 100
            : presupuestoData.descuentoValor;
        finalTotalWithDiscount = costoTotalEstimadoRecalculado - descuentoAplicado;
    }
    
    let newStatus = presupuestoData.estado;
    if (presupuestos[index].estado === 'Borrador' && presupuestoData.estado === 'Borrador') {
      newStatus = 'Enviado';
    }


    const updatedPresupuesto: Presupuesto = {
        ...presupuestoData,
        estado: newStatus,
        itemsPresupuestados: validItems,
        costoTotalEstimado: costoTotalEstimadoRecalculado,
        totalConDescuento: finalTotalWithDiscount !== costoTotalEstimadoRecalculado ? finalTotalWithDiscount : undefined,
        timestamp: new Date().toISOString(),
        ajusteAnualActivo: presupuestos[index].ajusteAnualActivo || activateAdjustment,
    };

    presupuestos[index] = updatedPresupuesto;
    await writeData(PRESUPUESTOS_FILE, presupuestos);

    try {
        await findLeadByBudgetOrCreate(updatedPresupuesto);
    } catch (crmError: any) {
        console.warn(`Presupuesto ${updatedPresupuesto.id} actualizado, pero falló la sincronización con el CRM: ${crmError.message}`);
    }

    if (updatedPresupuesto.estado === 'Facturado' && updatedPresupuesto.invoiceId) {
        try {
            const linkedInvoice = await getInvoiceById(updatedPresupuesto.invoiceId);
            if (linkedInvoice) {
                const budgetTotal = updatedPresupuesto.totalConDescuento ?? updatedPresupuesto.costoTotalEstimado;
                const invoiceItemTotal = linkedInvoice.items.reduce((sum, item) => sum + item.total, 0);

                if (Math.abs(budgetTotal - invoiceItemTotal) > 0.01) {
                    const summaryItem: Omit<InvoiceItem, 'id'> = {
                        description: `Servicios según presupuesto #${updatedPresupuesto.id.split('_').pop()?.substring(0,5)} (actualizado)`,
                        quantity: 1,
                        unitPrice: budgetTotal,
                        total: budgetTotal,
                    };
                    
                    let invoiceDataToUpdate: Invoice = { ...linkedInvoice, items: [{ ...summaryItem, id: `item_summary_update_${Date.now()}` }], notes: updatedPresupuesto.notas || linkedInvoice.notes };
                    
                    const newSubtotal = invoiceDataToUpdate.items.reduce((sum, item) => sum + item.total, 0);
                    const newTaxAmount = (newSubtotal * (invoiceDataToUpdate.taxRate || 0)) / 100;
                    const newTotalAmount = newSubtotal + newTaxAmount;
                    
                    invoiceDataToUpdate.subtotal = newSubtotal;
                    invoiceDataToUpdate.taxAmount = newTaxAmount;
                    invoiceDataToUpdate.totalAmount = newTotalAmount;

                    await saveInvoice(invoiceDataToUpdate);
                }
            }
        } catch (invoiceError) {
            console.error(`Error al sincronizar la factura del presupuesto actualizado ${updatedPresupuesto.id}:`, invoiceError);
        }
    }

    return { success: true, id: updatedPresupuesto.id, presupuesto: updatedPresupuesto };
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
  presupuestos[index].ajusteAnualActivo = true; // Mark adjustment as active on billing
  
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}

export async function activateAnnualAdjustmentForBudget(presupuestoId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoId} no encontrado.` };
  }
  if (presupuestos[index].ajusteAnualActivo) return { success: true }; // Already active
  
  presupuestos[index].ajusteAnualActivo = true;
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}

  

