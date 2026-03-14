'use server';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto'; 
import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { findLeadByBudgetOrCreate, getCrmStages, moveCrmLead } from './crm';
import { createNotification } from './notifications';
import { getServiciosEmpresa } from './servicios-empresa';
import { getMenus } from './menus-catering';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getAllFiestas, saveFiesta } from './fiesta/fiesta.actions';
import { syncLaundryCosts } from './fiesta/costos.actions';

const PRESUPUESTOS_FILE = 'presupuestos.json';

function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, adolescentes: number, ninos: number): number {
  const categoria = (item.categoriaServicio || '').toLowerCase();
  const subcategoria = (item.subcategoria || '').toLowerCase();
  const ninosYAdolescentes = ninos + adolescentes;
  
  if (categoria.includes('infantil') || categoria.includes('adolescente') || subcategoria.includes('infantil') || subcategoria.includes('adolescente')) {
    return ninosYAdolescentes;
  }
  
  if (categoria.includes('plato principal') || subcategoria.includes('plato principal')) {
    return adultos;
  }
  
  return adultos + ninosYAdolescentes;
};

function recalcularCostoItem(item: ItemPresupuestado, adultos: number, adolescentes: number, ninos: number): number {
  if (item.esRegalo) return 0;
  
  const totalInvitados = adultos + adolescentes + ninos;
  const cantidadInvitados = getGuestCountForItem(item, adultos, adolescentes, ninos);
  
  if (cantidadInvitados === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }
  
  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = (item.precioBase ?? precioUnitario) * (item.cantidad > 0 ? item.cantidad : 1);
      break;
    case 'porPersona':
      itemTotal = (item.precioPorPersona ?? precioUnitario) * cantidadInvitados;
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (item.precioBase ?? precioUnitario);
      } else {
        itemTotal = item.precioBase ?? precioUnitario;
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default:
      itemTotal = item.cantidad * precioUnitario;
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

async function syncLinkedFiesta(presupuesto: Presupuesto) {
    try {
        const allFiestas = await getAllFiestas();
        const linkedFiesta = allFiestas.find(f => f.presupuestoId === presupuesto.id);
        if (linkedFiesta) {
            linkedFiesta.configuracion = {
                ...linkedFiesta.configuracion,
                nombreEvento: `${presupuesto.eventoTipo} de ${presupuesto.clienteNombre}`,
                fechaEvento: presupuesto.eventoFecha,
                invitadosEstimados: presupuesto.invitadosCantidad,
                presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
                nombreLugar: presupuesto.salonFiestas,
            };
            await saveFiesta(linkedFiesta);
            
            // Sincronización Automática Lavadero del Sol (Blindaje de Módulo 1)
            await syncLaundryCosts(linkedFiesta.id, presupuesto.invitadosCantidad, presupuesto.itemsPresupuestados);
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
    idServicioCatalogo: item.idServicioCatalogo,
    nombreServicio: item.nombreServicio,
    descripcionServicio: item.descriptionServicio,
    cantidad: item.cantidad,
    unidad: item.unidad,
    precioUnitario: item.precioUnitario,
    precioUnitarioPresupuesto: item.precioUnitarioPresupuesto,
    costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos),
    categoriaServicio: item.categoriaServicio,
    subcategoria: item.subcategoria,
    esRegalo: item.esRegalo,
    calculationMethod: item.calculationMethod,
    precioBase: item.precioBase,
    precioPorPersona: item.precioPorPersona,
    invitadosPorUnidad: item.invitadosPorUnidad,
    tramosDePrecio: item.tramosDePrecio,
  }));

  const costoTotalEstimadoRecalculated = validItems
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + item.costoTotalItem, 0);

  let finalTotalWithDiscount = costoTotalEstimadoRecalculated;
  let descuentoAplicado = 0;

  if (presupuestoData.descuentoTipo && presupuestoData.descuentoValor && presupuestoData.descuentoValor > 0) {
    descuentoAplicado = presupuestoData.descuentoTipo === 'porcentaje'
      ? (costoTotalEstimadoRecalculated * presupuestoData.descuentoValor) / 100
      : presupuestoData.descuentoValor;
    finalTotalWithDiscount = costoTotalEstimadoRecalculated - descuentoAplicado;
  }

  const presupuestoId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    id: presupuestoId,
    numero: nuevoNumero,
    itemsPresupuestados: validItems,
    costoTotalEstimado: costoTotalEstimadoRecalculated,
    totalConDescuento: finalTotalWithDiscount,
    timestamp: new Date().toISOString(),
    estado: presupuestoData.estado || 'Enviado',
    invoiceId: undefined,
    ajusteAnualActivo: false,
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
        totalConDescuento: finalTotal
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

export async function markPresupuestoAsFacturado(presupuestoId: string, invoiceId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) return { success: false, error: "No encontrado" };
  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].ajusteAnualActivo = true;
  
  try {
      await findLeadByBudgetOrCreate(presupuestos[index]);
  } catch (e) { console.warn("CRM Sync error on invoice", e); }

  await writeData(PRESUPUESTOS_FILE, presupuestos);
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
