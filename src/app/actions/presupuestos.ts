'use server';

import type { Presupuesto, ItemPresupuestado, PagoCliente } from '@/types/presupuesto'; 
import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { findLeadByBudgetOrCreate, getCrmStages, moveCrmLead, confirmBooking } from './crm';
import { createNotification } from './notifications';
import { getServiciosEmpresa } from './servicios-empresa';
import { getMenus } from './menus-catering';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getAllFiestas, saveFiesta, syncFiestaFromBudget } from './fiesta/fiesta.actions';
import { syncLaundryCosts } from './fiesta/costos.actions';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';

const PRESUPUESTOS_FILE = 'presupuestos.json';

export async function getPresupuestos(): Promise<Presupuesto[]> {
  return readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const presupuestos = await getPresupuestos();
  return presupuestos.find(p => p.id === id) || null;
}

async function syncLinkedFiesta(presupuesto: Presupuesto) {
    try {
        const allFiestas = await getAllFiestas();
        const linkedFiesta = allFiestas.find(f => f.presupuestoId === presupuesto.id);
        if (linkedFiesta) {
            if (presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado') {
                await syncFiestaFromBudget(linkedFiesta.id);
            } else {
                linkedFiesta.configuracion = {
                    ...linkedFiesta.configuracion,
                    nombreEvento: `${presupuesto.eventoTipo} de ${presupuesto.clienteNombre}`,
                    fechaEvento: presupuesto.eventoFecha,
                    invitadosEstimados: presupuesto.invitadosCantidad,
                    invitadosAdultos: presupuesto.invitadosAdultos,
                    invitadosNinos: presupuesto.invitadosNinos,
                    invitadosAdolescentes: presupuesto.invitadosAdolescentes,
                    presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
                    nombreLugar: presupuesto.salonFiestas,
                };
                await saveFiesta(linkedFiesta);
                await syncLaundryCosts(linkedFiesta.id, presupuesto.invitadosCantidad, presupuesto.itemsPresupuestados);
            }
        }
    } catch (e) {
        console.error("Error auto-syncing fiesta from budget:", e);
    }
}

export async function savePresupuesto(
  presupuestoData: Omit<Presupuesto, 'id'>,
  options?: { source?: 'manual' | 'simulator', leadId?: string }
): Promise<{ success: boolean, id?: string, error?: string, presupuesto?: Presupuesto, leadId?: string }> {
  let presupuestos = await getPresupuestos();
  
  const maxNumero = presupuestos.reduce((max, p) => Math.max(max, p.numero || 0), 0);
  const nuevoNumero = maxNumero + 1;
  
  const adultos = presupuestoData.invitadosAdultos || 0;
  const adolescentes = presupuestoData.invitadosAdolescentes || 0;
  const ninos = presupuestoData.invitadosNinos || 0;

  const validItems = presupuestoData.itemsPresupuestados.map(item => ({
    ...item,
    costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos),
  }));

  const subtotalBruto = validItems
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + item.costoTotalItem, 0);

  let totalConDescuento = subtotalBruto;
  if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor && presupuestoData.descuentoValor > 0) {
    const desc = presupuestoData.descuentoTipo === 'porcentaje'
      ? (subtotalBruto * presupuestoData.descuentoValor) / 100
      : presupuestoData.descuentoValor;
    totalConDescuento = subtotalBruto - desc;
  }

  const presupuestoId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    id: presupuestoId,
    numero: nuevoNumero,
    itemsPresupuestados: validItems,
    costoTotalEstimado: subtotalBruto,
    totalConDescuento: Math.round(totalConDescuento),
    timestamp: new Date().toISOString(),
    estado: presupuestoData.estado || 'Enviado',
    leadId: options?.leadId,
    source: options?.source || 'manual',
  };

  try {
    const syncRes = await findLeadByBudgetOrCreate(nuevoPresupuesto);
    nuevoPresupuesto.leadId = syncRes.lead.id;
  } catch (crmError: any) {
    console.warn(`CRM Sync error during save: ${crmError.message}`);
  }
  
  presupuestos.push(nuevoPresupuesto);
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  
  await syncLinkedFiesta(nuevoPresupuesto);

  return { success: true, id: presupuestoId, presupuesto: nuevoPresupuesto, leadId: nuevoPresupuesto.leadId };
}

export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; id?: string; presupuesto?: Presupuesto; error?: string }> {
    let presupuestos = await getPresupuestos();
    const index = presupuestos.findIndex(p => p.id === presupuestoData.id);
    if (index === -1) return { success: false, error: "No encontrado" };

    const adultos = presupuestoData.invitadosAdultos || 0;
    const adolescentes = presupuestoData.invitadosAdolescentes || 0;
    const ninos = presupuestoData.invitadosNinos || 0;

    const validItems = presupuestoData.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos),
    }));

    const subtotal = validItems.filter(item => !item.esRegalo).reduce((sum, item) => sum + item.costoTotalItem, 0);
    
    let totalConDescuento = subtotal;
    if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor) {
        const desc = presupuestoData.descuentoTipo === 'porcentaje' 
            ? (subtotal * presupuestoData.descuentoValor) / 100 
            : presupuestoData.descuentoValor;
        totalConDescuento = subtotal - desc;
    }

    let finalTotal = totalConDescuento;
    if (presupuestoData.ajusteAnualActivo && presupuestoData.eventoFecha) {
        const yearCreated = new Date(presupuestoData.timestamp).getFullYear();
        const yearEvent = new Date(presupuestoData.eventoFecha).getFullYear();
        if (yearEvent > yearCreated) {
            const diff = yearEvent - yearCreated;
            finalTotal = totalConDescuento * Math.pow(1.15, diff);
        }
    }

    const updated: Presupuesto = {
        ...presupuestoData,
        itemsPresupuestados: validItems,
        costoTotalEstimado: subtotal,
        totalConDescuento: Math.round(finalTotal)
    };

    try {
        const syncRes = await findLeadByBudgetOrCreate(updated);
        updated.leadId = syncRes.lead.id;
    } catch (e) {
        console.warn("CRM Sync error during update", e);
    }

    presupuestos[index] = updated;
    await writeData(PRESUPUESTOS_FILE, presupuestos);
    
    await syncLinkedFiesta(updated);

    return { success: true, id: updated.id, presupuesto: updated };
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  presupuestos = presupuestos.filter(p => p.id !== id);
  await writeData(PRESUPUESTOS_FILE, presupuestos);
  return { success: true };
}

export async function markPresupuestoAsFacturado(
  presupuestoId: string,
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);

  if (index === -1) {
    return { success: false, error: "No encontrado" };
  }

  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].ajusteAnualActivo = true;

  let leadId = presupuestos[index].leadId;

  try {
    const syncRes = await findLeadByBudgetOrCreate(presupuestos[index]);
    presupuestos[index].leadId = syncRes.lead.id;
    leadId = syncRes.lead.id;
  } catch (e) {
    console.warn("CRM Sync error on invoice", e);
  }

  await writeData(PRESUPUESTOS_FILE, presupuestos);

  try {
    const fiestas = await getAllFiestas();
    const existingFiesta = fiestas.find(f => f.presupuestoId === presupuestoId);

    if (existingFiesta) {
      await syncFiestaFromBudget(existingFiesta.id);
    } else if (leadId) {
      await confirmBooking(leadId, presupuestoId);
    }
  } catch (e) {
    console.warn("Error auto-creating fiesta on invoice", e);
  }

  return { success: true };
}

export async function recalculatePresupuestoFromCatalog(presupuestoId: string): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'No encontrado' };
  
  const catalogServices = await getServiciosEmpresa();
  const updatedItems = presupuesto.itemsPresupuestados.map(item => {
    const catalogItem = catalogServices.find(s => s.id === item.idServicioCatalogo);
    if (catalogItem) {
      const newPrice = catalogItem.precioVenta || catalogItem.precioPorPersona || catalogItem.precioBase || item.precioUnitario;
      return {
        ...item,
        precioUnitario: catalogItem.valorUnitarioEstimado || item.precioUnitario,
        precioUnitarioPresupuesto: newPrice,
      };
    }
    return item;
  });

  return await updatePresupuesto({ ...presupuesto, itemsPresupuestados: updatedItems });
}

export async function addPagoToPresupuesto(
  presupuestoId: string,
  pago: Omit<PagoCliente, 'id'>
): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado' };

  const newPago: PagoCliente = {
    ...pago,
    id: `pago_${presupuestoId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  const updatedPagos = [...(presupuesto.pagosCliente || []), newPago];
  return updatePresupuesto({ ...presupuesto, pagosCliente: updatedPagos });
}

export async function deletePagoFromPresupuesto(
  presupuestoId: string,
  pagoId: string
): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado' };

  const updatedPagos = (presupuesto.pagosCliente || []).filter(p => p.id !== pagoId);
  return updatePresupuesto({ ...presupuesto, pagosCliente: updatedPagos });
}
