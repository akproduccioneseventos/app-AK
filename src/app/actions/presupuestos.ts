'use server';

import type { Presupuesto, ItemPresupuestado, PagoCliente, EstadoPago, PresupuestoSource } from '@/types/presupuesto'; 
import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from './invoices';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { findLeadByBudgetOrCreate, getCrmStages, moveCrmLead } from './crm';
import { createNotification } from './notifications';
import { getServiciosEmpresa } from './servicios-empresa';
import { getMenus } from './menus-catering';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getAllFiestas, saveFiesta, syncFiestaFromBudget } from './fiesta/fiesta.actions';
import { syncLaundryCosts } from './fiesta/costos.actions';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { parseBudgetText } from '@/lib/parse-budget-text';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';
import { triggerWhatsAppAutomation } from '@/lib/whatsapp-automation-engine';
import * as logger from '@/lib/logger';

const PRESUPUESTOS_FILE = 'presupuestos.json';

/** Returns all presupuestos. Pass includeArchived=true to include soft-deleted ones. */
export async function getPresupuestos(includeArchived = false): Promise<Presupuesto[]> {
  const all = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  return includeArchived ? all : all.filter(p => !p.archived);
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
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
  options?: { source?: PresupuestoSource, leadId?: string, preserveTotal?: boolean }
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

  // When preserveTotal is true (e.g. when importing from text with a declared total),
  // honour the caller-provided totalConDescuento instead of recalculating from items,
  // so the saved value exactly matches what the user approved in the audit screen.
  const finalTotal = options?.preserveTotal && presupuestoData.totalConDescuento != null
    ? presupuestoData.totalConDescuento
    : Math.round(totalConDescuento);

  const presupuestoId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    id: presupuestoId,
    numero: nuevoNumero,
    itemsPresupuestados: validItems,
    costoTotalEstimado: subtotalBruto,
    totalConDescuento: finalTotal,
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
  try {
    await writeData(PRESUPUESTOS_FILE, presupuestos);
    logger.info('[Presupuesto] Guardado exitoso:', presupuestoId, `#${nuevoNumero}`, nuevoPresupuesto.clienteNombre);
  } catch (writeError: any) {
    logger.error('[Presupuesto] Error al guardar:', writeError.message || writeError);
    return { success: false, error: 'No se pudo guardar el presupuesto. Intentá de nuevo.' };
  }
  
  await syncLinkedFiesta(nuevoPresupuesto);

  // Notificación de negocio: nuevo presupuesto creado
  createNotification({
    titulo: 'Nuevo Presupuesto',
    mensaje: `Nuevo presupuesto #${nuevoNumero} creado para ${nuevoPresupuesto.clienteNombre}.`,
    href: `/presupuestos/${presupuestoId}/ver`,
    icono: 'ListChecks',
    tipo: 'info',
    entidadRelacionadaId: presupuestoId,
    rolDestino: 'admin',
  }).catch(err => console.warn('Error creating budget notification:', err));

  // Automation: fire presupuesto_generado rules (non-blocking)
  triggerWhatsAppAutomation('presupuesto_generado', {
    targetId: nuevoPresupuesto.leadId || presupuestoId,
    targetName: nuevoPresupuesto.clienteNombre,
    targetType: 'prospecto',
    leadId: nuevoPresupuesto.leadId,
    nombre: nuevoPresupuesto.clienteNombre,
    fechaEvento: nuevoPresupuesto.eventoFecha,
    link: `/presupuestos/${presupuestoId}/ver`,
  }).catch(err => console.warn('Error firing presupuesto_generado automation:', err));

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
    try {
      await writeData(PRESUPUESTOS_FILE, presupuestos);
    } catch (writeError: any) {
      console.error("Error updating presupuesto:", writeError);
      return { success: false, error: writeError.message || "Error al actualizar el presupuesto." };
    }
    
    await syncLinkedFiesta(updated);

    return { success: true, id: updated.id, presupuesto: updated };
}

/** Soft-delete: marks the presupuesto as archived so it disappears from active lists. */
export async function archivePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  const all = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  const index = all.findIndex(p => p.id === id);
  if (index === -1) return { success: false, error: 'Presupuesto no encontrado.' };
  all[index] = { ...all[index], archived: true, archivedAt: new Date().toISOString() };
  try {
    await writeData(PRESUPUESTOS_FILE, all);
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al archivar.' };
  }
  return { success: true };
}

/** Hard-delete: permanently removes the presupuesto and cleans up CRM lead references and linked fiesta. */
export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  const all = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
  const target = all.find(p => p.id === id);
  const remaining = all.filter(p => p.id !== id);
  try {
    await writeData(PRESUPUESTOS_FILE, remaining);
  } catch (writeError: any) {
    console.error("Error deleting presupuesto:", writeError);
    return { success: false, error: writeError.message || "Error al eliminar el presupuesto." };
  }

  // Clean up CRM lead reference to avoid dangling pointer
  if (target?.leadId) {
    try {
      type CrmLeadRaw = { id: string; presupuestoId?: string; presupuestoEstado?: string; [key: string]: unknown };
      const allLeads = await readData<CrmLeadRaw[]>('crm-leads.json', []);
      const idx = allLeads.findIndex(l => l.id === target.leadId);
      if (idx !== -1) {
        const { presupuestoId: _pid, presupuestoEstado: _pe, ...rest } = allLeads[idx];
        allLeads[idx] = rest;
        await writeData('crm-leads.json', allLeads);
      }
    } catch (e) {
      // Non-fatal: log and continue
      console.warn('Could not clean CRM lead presupuestoId after delete:', e);
    }
  }

  // Unlink any fiesta that was linked to this presupuesto to keep planner sync healthy.
  if (target) {
    try {
      const allFiestas = await getAllFiestas();
      const linked = allFiestas.filter(f => f.presupuestoId === id);
      for (const fiesta of linked) {
        await saveFiesta({ ...fiesta, presupuestoId: undefined });
      }
    } catch (e) {
      // Non-fatal: log and continue
      console.warn('Could not unlink fiesta presupuestoId after delete:', e);
    }
  }

  return { success: true };
}

export async function markPresupuestoAsFacturado(
  presupuestoId: string,
  invoiceId: string
): Promise<{ success: boolean; error?: string; suggestContractFlow?: boolean }> {
  let presupuestos = await getPresupuestos();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);

  if (index === -1) {
    return { success: false, error: "No encontrado" };
  }

  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].ajusteAnualActivo = true;

  try {
    const syncRes = await findLeadByBudgetOrCreate(presupuestos[index]);
    presupuestos[index].leadId = syncRes.lead.id;
  } catch (e) {
    console.warn("CRM Sync error on invoice", e);
  }

  try {
    await writeData(PRESUPUESTOS_FILE, presupuestos);
  } catch (writeError: any) {
    console.error("Error saving presupuesto on invoice:", writeError);
    return { success: false, error: writeError.message || "Error al actualizar el estado del presupuesto." };
  }

  // Sincronizar con la fiesta si ya existe. No crear una nueva fiesta
  // automáticamente sin contrato firmado: el flujo de contratación debe
  // iniciarse desde el CRM con confirmBookingWithContract.
  try {
    const fiestas = await getAllFiestas();
    const existingFiesta = fiestas.find(f => f.presupuestoId === presupuestoId);

    if (existingFiesta) {
      await syncFiestaFromBudget(existingFiesta.id);
      return { success: true };
    }

    // No hay evento creado aún → sugerir flujo de contratación al llamador
    return { success: true, suggestContractFlow: true };
  } catch (e) {
    console.warn("Error syncing fiesta on invoice", e);
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
  const result = await updatePresupuesto({ ...presupuesto, pagosCliente: updatedPagos });

  if (result.success) {
    const montoFmt = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(pago.monto);
    createNotification({
      titulo: 'Pago Registrado',
      mensaje: `Pago de ${montoFmt} registrado para ${presupuesto.clienteNombre} (${pago.metodoPago}).`,
      href: `/presupuestos/${presupuestoId}/ver`,
      icono: 'ListChecks',
      tipo: 'exito',
      entidadRelacionadaId: presupuestoId,
      rolDestino: 'admin',
    }).catch(err => console.warn('Error creating payment notification:', err));
  }

  return result;
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

export interface ImportarPresupuestoOptions {
  crearFiesta?: boolean;
  senaManual?: number;
  eventoFechaOverride?: string;
}

export async function importarPresupuestoDesdeTexto(
  texto: string,
  options: ImportarPresupuestoOptions = {}
): Promise<{
  success: boolean;
  presupuestoId?: string;
  fiestaId?: string;
  warnings?: string[];
  error?: string;
}> {
  if (!texto || texto.trim().length < 20) {
    return { success: false, error: 'El texto pegado está vacío o es demasiado corto.' };
  }

  const parsed = parseBudgetText(texto);

  // clienteNombre now defaults to 'Cliente' in the parser, so we always have something.
  // Only block if we got nothing at all useful.
  if (!parsed.clienteNombre && parsed.items.length === 0) {
    return {
      success: false,
      error: 'No se pudo detectar información válida en el texto. Revisá el formato.',
      warnings: parsed.warnings,
    };
  }

  const eventoFecha = options.eventoFechaOverride || parsed.eventoFecha || '';
  const total = parsed.totalDeclarado;
  const senaPct = parsed.senaCondicion;
  const sena = options.senaManual !== undefined ? options.senaManual : Math.round(total * senaPct / 100);

  const notas = [
    parsed.notas,
    `Total declarado: $${total.toLocaleString('es-UY')}`,
    `Seña: $${sena.toLocaleString('es-UY')} (${senaPct}%)`,
    `Saldo: $${(total - sena).toLocaleString('es-UY')}`,
  ].filter(Boolean).join(' | ');

  const budgetData: Omit<Presupuesto, 'id'> = {
    clienteNombre: parsed.clienteNombre,
    eventoTipo: parsed.eventoTipo || 'Otro',
    eventoFecha,
    invitadosCantidad: parsed.invitadosCantidad,
    invitadosAdultos: parsed.invitadosCantidad,
    invitadosNinos: 0,
    invitadosAdolescentes: 0,
    salonFiestas: parsed.salonFiestas || '',
    itemsPresupuestados: parsed.items as ItemPresupuestado[],
    costoTotalEstimado: total,
    totalConDescuento: total,
    notas,
    estado: 'Borrador',
    timestamp: new Date().toISOString(),
    source: 'manual',
  };

  const presupuestoResult = await savePresupuesto(budgetData, { source: 'manual', preserveTotal: total > 0 });
  if (!presupuestoResult.success || !presupuestoResult.id) {
    return {
      success: false,
      error: presupuestoResult.error || 'Error al guardar el presupuesto.',
      warnings: parsed.warnings,
    };
  }

  const presupuestoId = presupuestoResult.id;
  let fiestaId: string | undefined;

  if (options.crearFiesta) {
    try {
      const newFiesta: FiestaEnPlanificacion = {
        ...initialFiestaActualData,
        id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        presupuestoId,
        estado: 'En Planificación',
        configuracion: {
          ...initialFiestaActualData.configuracion,
          nombreEvento: `${parsed.eventoTipo || 'Evento'} de ${parsed.clienteNombre}`,
          tipoCelebracion: parsed.eventoTipo || 'Otro',
          fechaEvento: eventoFecha,
          invitadosEstimados: parsed.invitadosCantidad,
          invitadosAdultos: parsed.invitadosCantidad,
          invitadosNinos: 0,
          invitadosAdolescentes: 0,
          presupuestoEstimado: total,
          nombreLugar: parsed.salonFiestas || '',
          clienteId: presupuestoResult.leadId,
          clienteNombre: parsed.clienteNombre,
        },
        modulosContratados: { ...defaultModulosContratados },
      };

      const fiestaResult = await saveFiesta(newFiesta);
      if (fiestaResult.success && fiestaResult.fiesta) {
        fiestaId = fiestaResult.fiesta.id;
        await createNotification({
          mensaje: `Nuevo evento creado desde presupuesto importado: ${newFiesta.configuracion.nombreEvento}`,
          href: `/fiestas/nueva?fiestaId=${fiestaId}`,
          icono: 'PartyPopper',
        });
      } else {
        parsed.warnings.push(`El presupuesto se creó pero no se pudo crear la fiesta: ${fiestaResult.error}`);
      }
    } catch (e: any) {
      parsed.warnings.push(`El presupuesto se creó pero hubo un error al crear la fiesta: ${e.message}`);
    }
  }

  return {
    success: true,
    presupuestoId,
    fiestaId,
    warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
  };
}

export async function createFiestaFromPresupuesto(
  presupuestoId: string
): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado.' };

  const allFiestas = await getAllFiestas();
  const existing = allFiestas.find(f => f.presupuestoId === presupuestoId);
  if (existing) {
    return { success: true, fiestaId: existing.id };
  }

  const newFiesta: FiestaEnPlanificacion = {
    ...initialFiestaActualData,
    id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    presupuestoId,
    estado: 'En Planificación',
    configuracion: {
      ...initialFiestaActualData.configuracion,
      nombreEvento: `${presupuesto.eventoTipo} de ${presupuesto.clienteNombre}`,
      tipoCelebracion: presupuesto.eventoTipo,
      fechaEvento: presupuesto.eventoFecha || '',
      invitadosEstimados: presupuesto.invitadosCantidad,
      invitadosAdultos: presupuesto.invitadosAdultos,
      invitadosNinos: presupuesto.invitadosNinos,
      invitadosAdolescentes: presupuesto.invitadosAdolescentes,
      presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      nombreLugar: presupuesto.salonFiestas || '',
      clienteId: presupuesto.leadId,
      clienteNombre: presupuesto.clienteNombre,
    },
    modulosContratados: { ...defaultModulosContratados },
  };

  const result = await saveFiesta(newFiesta);
  if (!result.success || !result.fiesta) {
    return { success: false, error: result.error || 'Error al crear el evento.' };
  }

  await createNotification({
    mensaje: `Nuevo evento creado desde presupuesto: ${newFiesta.configuracion.nombreEvento}`,
    href: `/fiestas/nueva?fiestaId=${result.fiesta.id}`,
    icono: 'PartyPopper',
  });

  return { success: true, fiestaId: result.fiesta.id };
}

export async function approvePresupuesto(
  presupuestoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const presupuestos = await getPresupuestos();
    const index = presupuestos.findIndex(p => p.id === presupuestoId);
    if (index === -1) return { success: false, error: 'Presupuesto no encontrado' };

    presupuestos[index].estado = 'Enviado';
    await writeData(PRESUPUESTOS_FILE, presupuestos);

    // Automation: fire presupuesto_enviado rules (non-blocking)
    const p = presupuestos[index];
    triggerWhatsAppAutomation('presupuesto_enviado', {
      targetId: p.leadId || presupuestoId,
      targetName: p.clienteNombre,
      targetType: 'prospecto',
      leadId: p.leadId,
      nombre: p.clienteNombre,
      fechaEvento: p.eventoFecha,
      link: `/presupuestos/${presupuestoId}/ver`,
    }).catch(err => console.warn('Error firing presupuesto_enviado automation:', err));

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Payment confirmation/rejection actions ──────────────────────────

export async function addPagoClienteFromPortal(
  presupuestoId: string,
  pago: Omit<PagoCliente, 'id' | 'estadoPago'>
): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado' };

  const newPago: PagoCliente = {
    ...pago,
    id: `pago_${presupuestoId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    estadoPago: 'pendiente_confirmacion',
  };

  const updatedPagos = [...(presupuesto.pagosCliente || []), newPago];
  const result = await updatePresupuesto({ ...presupuesto, pagosCliente: updatedPagos });

  if (result.success) {
    const montoFmt = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(pago.monto);
    createNotification({
      titulo: 'Pago Informado por Cliente',
      mensaje: `${presupuesto.clienteNombre} informó un pago de ${montoFmt} (${pago.metodoPago}). Pendiente de confirmación.`,
      href: `/pagos-rapidos`,
      icono: 'ListChecks',
      tipo: 'aviso',
      entidadRelacionadaId: presupuestoId,
      rolDestino: 'admin',
    }).catch(err => console.warn('Error creating client payment notification:', err));
  }

  return result;
}

export async function confirmPagoCliente(
  presupuestoId: string,
  pagoId: string
): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado' };

  const pagos = presupuesto.pagosCliente || [];
  const pagoIndex = pagos.findIndex(p => p.id === pagoId);
  if (pagoIndex === -1) return { success: false, error: 'Pago no encontrado' };

  pagos[pagoIndex] = { ...pagos[pagoIndex], estadoPago: 'confirmado', motivoRechazo: undefined };
  const result = await updatePresupuesto({ ...presupuesto, pagosCliente: pagos });

  if (result.success) {
    const montoFmt = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(pagos[pagoIndex].monto);
    createNotification({
      titulo: 'Pago Confirmado',
      mensaje: `Pago de ${montoFmt} confirmado para ${presupuesto.clienteNombre}.`,
      href: `/presupuestos/${presupuestoId}/estado-de-cuenta`,
      icono: 'ListChecks',
      tipo: 'exito',
      entidadRelacionadaId: presupuestoId,
      rolDestino: 'admin',
    }).catch(err => console.warn('Error creating payment confirmation notification:', err));
  }

  return result;
}

export async function rejectPagoCliente(
  presupuestoId: string,
  pagoId: string,
  motivo: string
): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado' };

  const updatedPagos = (presupuesto.pagosCliente || []).filter(p => p.id !== pagoId);
  const result = await updatePresupuesto({ ...presupuesto, pagosCliente: updatedPagos });

  if (result.success) {
    createNotification({
      titulo: 'Pago Rechazado',
      mensaje: `Pago rechazado para ${presupuesto.clienteNombre}. Motivo: ${motivo}`,
      href: `/presupuestos/${presupuestoId}/ver`,
      icono: 'ListChecks',
      tipo: 'aviso',
      entidadRelacionadaId: presupuestoId,
      rolDestino: 'admin',
    }).catch(err => console.warn('Error creating payment rejection notification:', err));
  }

  return result;
}

export async function getPresupuestosWithPendingPayments(): Promise<Presupuesto[]> {
  const presupuestos = await getPresupuestos();
  return presupuestos.filter(p =>
    (p.pagosCliente || []).some(pago => pago.estadoPago === 'pendiente_confirmacion')
  );
}

/**
 * Deletes ALL presupuestos permanently from Firestore.
 * This is a destructive admin-only operation and requires explicit confirmation in the UI.
 */
export async function resetAllPresupuestos(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const all = await getPresupuestos(true);
    const deletedIds = new Set(all.map(p => p.id));
    const deletedCount = all.length;

    // Canonical wipe through data-service sync (handles Firestore cleanup by deleting orphan docs).
    await writeData(PRESUPUESTOS_FILE, []);

    // Keep local JSON fallbacks in sync so the UI doesn't resurrect deleted presupuestos.
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const localCandidates = [
        path.join(process.cwd(), 'data', PRESUPUESTOS_FILE),
        path.join(process.cwd(), 'src', 'data', PRESUPUESTOS_FILE),
      ];
      for (const localPath of localCandidates) {
        try {
          await fs.writeFile(localPath, JSON.stringify([], null, 2), 'utf-8');
        } catch {
          // ignore missing local fallback file
        }
      }
    } catch {
      // ignore local fallback write errors in restricted environments
    }

    // Clean stale CRM references to deleted presupuestos.
    if (deletedIds.size > 0) {
      type CrmLeadRaw = { presupuestoId?: string; presupuestoEstado?: string; [key: string]: unknown };
      const leads = await readData<CrmLeadRaw[]>('crm-leads.json', []);
      const cleanedLeads = leads.map((lead) => {
        if (lead.presupuestoId && deletedIds.has(lead.presupuestoId)) {
          const { presupuestoId: _pid, presupuestoEstado: _pestado, ...rest } = lead;
          return rest;
        }
        return lead;
      });
      await writeData('crm-leads.json', cleanedLeads);

      // Unlink fiestas that referenced deleted presupuestos to keep planner synchronization healthy.
      const allFiestas = await getAllFiestas();
      const fiestasToUnlink = allFiestas.filter(fiesta => fiesta.presupuestoId && deletedIds.has(fiesta.presupuestoId));
      for (const fiesta of fiestasToUnlink) {
        await saveFiesta({ ...fiesta, presupuestoId: undefined });
      }
    }

    logger.info('[Presupuestos] Todos los presupuestos eliminados por admin.', { deletedCount });
    return { success: true, deletedCount };
  } catch (error: any) {
    logger.error('[Presupuestos] Error al reiniciar presupuestos:', error);
    return { success: false, error: error.message || 'Error al reiniciar los presupuestos.' };
  }
}
