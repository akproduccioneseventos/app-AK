'use server';

import type { Invoice, InvoiceItem, Payment } from '@/types/invoice';
import type { MetodoPago, Presupuesto } from '@/types/presupuesto';
import { readData, writeData } from '@/lib/data-service';
import { addPagoToPresupuesto, markPresupuestoAsFacturado } from './presupuestos';
import { addInvoiceId, removeInvoiceId } from './fiesta/fiesta.actions';
import * as logger from '@/lib/logger';
import { uploadToStorage } from '@/lib/firebase/storage';
import { verifySession } from '@/lib/auth/session-token';
import { findMatchingClientPayment, parseCleanMoney } from '@/lib/budget/financial-guardrails';
import { findExistingDepositReceipt } from '@/lib/commercial-flow/ledger-service';
import { triggerWhatsAppAutomation } from '@/lib/whatsapp-automation-engine';
import { getScheduledMessages } from '@/app/actions/scheduled-messages';

const INVOICES_FILE = 'invoices.json';
const MONEY_TOLERANCE = 1;

function mapDepositMethodToInvoiceMethod(method: string): 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro' {
  const m = (method || '').trim().toLowerCase();
  if (m === 'efectivo') return 'Efectivo';
  if (m === 'tarjeta') return 'Tarjeta';
  if (m === 'transferencia' || m === 'transferencia bancaria' || m === 'transferencia_bancaria') return 'Transferencia';
  return 'Otro';
}

function roundMoney(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function normalizeQuantity(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 1000) / 1000);
}

function normalizeTaxRate(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function getInvoicePaidAmount(invoice: Pick<Invoice, 'payments'>): number {
  return (invoice.payments || []).reduce((sum, payment) => sum + roundMoney(payment.amount), 0);
}

function getInvoiceBalance(invoice: Pick<Invoice, 'totalAmount' | 'payments'>): number {
  return Math.max(0, roundMoney(invoice.totalAmount) - getInvoicePaidAmount(invoice));
}

function mapDepositMethodToBudgetMethod(method: string): MetodoPago {
  if (method === 'Efectivo') return 'Efectivo';
  if (method === 'Tarjeta') return 'Tarjeta';
  if (method === 'MercadoPago') return 'MercadoPago';
  if (method === 'Transferencia Bancaria' || method === 'Transferencia') return 'Transferencia Bancaria';
  return 'Otro';
}

export async function getInvoices(): Promise<Invoice[]> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  const invoices = await readData<Invoice[]>(INVOICES_FILE, []);
  return invoices.map(inv => ({ ...inv, payments: inv.payments || [] }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');
  const invoices = await getInvoices();
  return invoices.find(inv => inv.id === id) || null;
}

export async function saveInvoice(
  invoiceDataInput: (Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }) | Invoice,
  sourcePresupuestoId?: string
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  if (!invoiceDataInput.items || invoiceDataInput.items.some(item => normalizeQuantity(item.quantity) <= 0)) {
    return { success: false, error: 'La cantidad de cada ítem debe ser un número positivo.' };
  }
  if (invoiceDataInput.items.some(item => !item.description || item.description.trim() === '')) {
    return { success: false, error: 'Todos los ítems de la factura deben tener una descripción.' };
  }

  try {
    let invoices = await getInvoices();
    let finalInvoiceData: Invoice;
    let invoiceId: string;

    if ('id' in invoiceDataInput && invoiceDataInput.id) {
      invoiceId = invoiceDataInput.id;
      const index = invoices.findIndex(inv => inv.id === invoiceId);
      if (index === -1) {
        return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
      }
      const { id, ...dataToUpdate } = invoiceDataInput;

      const updatedItems = (dataToUpdate.items || invoices[index].items).map((item, idx) => {
        const quantity = normalizeQuantity(item.quantity);
        const unitPrice = roundMoney(item.unitPrice);
        const total = roundMoney(quantity * unitPrice);
        return {
          ...item,
          quantity,
          unitPrice,
          total,
          id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}_update`,
        };
      });

      const subtotal = updatedItems.reduce((sum, item) => sum + roundMoney(item.total), 0);
      const taxRate = normalizeTaxRate(dataToUpdate.taxRate ?? invoices[index].taxRate ?? 0);
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const totalAmount = roundMoney(subtotal + taxAmount);
      const payments = (dataToUpdate.payments || invoices[index].payments || []).map(payment => ({
        ...payment,
        amount: roundMoney(payment.amount),
      }));
      const totalPaid = getInvoicePaidAmount({ payments });
      if (totalPaid > totalAmount + MONEY_TOLERANCE) {
        return { success: false, error: 'Los pagos registrados superan el total de la factura.' };
      }

      invoices[index] = {
        ...invoices[index],
        ...dataToUpdate,
        items: updatedItems as InvoiceItem[],
        payments,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
      };
      finalInvoiceData = invoices[index];
    } else {
      invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const itemsWithIds: InvoiceItem[] = invoiceDataInput.items.map((item, index) => {
        const quantity = normalizeQuantity(item.quantity);
        const unitPrice = roundMoney(item.unitPrice);
        const total = roundMoney(quantity * unitPrice);
        return {
          ...item,
          quantity,
          unitPrice,
          total,
          id: `item_${invoiceId}_${index + 1}_${Date.now()}_create`,
        };
      });
      const subtotal = itemsWithIds.reduce((sum, item) => sum + roundMoney(item.total), 0);
      const taxRate = normalizeTaxRate(invoiceDataInput.taxRate ?? 0);
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const totalAmount = roundMoney(subtotal + taxAmount);
      finalInvoiceData = {
        ...(invoiceDataInput as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }),
        id: invoiceId,
        items: itemsWithIds,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        payments: [],
      };
      invoices.push(finalInvoiceData);
    }
    await writeData(INVOICES_FILE, invoices, (a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    if (sourcePresupuestoId && !('id' in invoiceDataInput)) {
      await markPresupuestoAsFacturado(sourcePresupuestoId, finalInvoiceData.id);
    }

    return { success: true, id: invoiceId, invoice: finalInvoiceData };
  } catch (error: any) {
    console.error('Error guardando factura:', error);
    return { success: false, error: error.message || 'Error al guardar la factura.' };
  }
}

export async function registerBookingDeposit(data: {
  fiestaId: string;
  amount: number;
  method: string;
  date: string;
  skipBudgetPayment?: boolean;
  skipFiestaSave?: boolean;
}): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const amount = parseCleanMoney(data.amount);
    if (amount <= 0) return { success: false, error: 'El monto de la seña debe ser mayor a cero.' };
    if (!data.date || Number.isNaN(new Date(data.date).getTime())) return { success: false, error: 'La fecha de la seña no es válida.' };

    const fiesta = await readData<any>(`fiestas/${data.fiestaId}.json`, null);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const paymentDay = new Date(data.date).toISOString().slice(0, 10);
    const paymentReference = `Seña registrada:${data.fiestaId}:${paymentDay}:${amount}`;
    let linkedBudget: Presupuesto | null = null;

    if (fiesta.presupuestoId) {
      const { getPresupuestoById } = await import('./presupuestos');
      linkedBudget = await getPresupuestoById(fiesta.presupuestoId);
    }

    const existingReceipt = findExistingDepositReceipt(await getInvoices(), {
      fiestaId: data.fiestaId,
      invoiceIds: fiesta.invoiceIds,
      amount,
      date: data.date,
    });

    if (existingReceipt) {
      if (linkedBudget && !data.skipBudgetPayment) {
        const paymentAlreadyRegistered = Boolean(findMatchingClientPayment(
          linkedBudget.pagosCliente,
          amount,
          data.date,
        ));
        if (!paymentAlreadyRegistered) {
          const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
            fecha: data.date,
            monto: amount,
            metodoPago: mapDepositMethodToBudgetMethod(data.method),
            referencia: paymentReference,
            estadoPago: 'confirmado',
          });
          if (!paymentResult.success) return { success: false, error: paymentResult.error };
        }
      }
      if (!data.skipFiestaSave && !(fiesta.invoiceIds || []).includes(existingReceipt.id)) {
        await addInvoiceId(data.fiestaId, existingReceipt.id);
      }
      return { success: true, invoiceId: existingReceipt.id };
    }

    if (linkedBudget && !data.skipBudgetPayment) {
      const { validatePaymentAgainstBudget } = await import('@/lib/budget/financial-guardrails');
      if (linkedBudget) {
        const validation = validatePaymentAgainstBudget(linkedBudget, amount, { includePendingForLimit: true });
        if (!validation.ok) return { success: false, error: validation.error };
      }
    }

    const newInvoice: Omit<Invoice, 'id' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] } = {
      invoiceNumber: `SEÑA-${data.fiestaId.slice(-5)}`,
      customer: { id: fiesta.configuracion.clienteId, name: fiesta.configuracion.clienteNombre || fiesta.configuracion.nombreEvento?.split(' de ')[1] || 'Cliente' },
      issueDate: data.date,
      dueDate: data.date,
      items: [{
        id: `item_${Date.now()}`,
        description: `Seña para reserva de evento: ${fiesta.configuracion.nombreEvento}`,
        quantity: 1,
        unitPrice: amount,
        total: amount,
      }],
      subtotal: amount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: amount,
      status: 'Paid',
      currency: 'UYU',
      vendorName: 'AK Producciones',
      documentKind: 'deposit_receipt',
      sourceFiestaId: data.fiestaId,
      sourcePresupuestoId: fiesta.presupuestoId,
    };

    const invoiceResult = await saveInvoice(newInvoice);
    if (!invoiceResult.success || !invoiceResult.id) throw new Error(invoiceResult.error || 'Error al crear recibo de seña.');

    const freshInvoices = await getInvoices();
    const invIdx = freshInvoices.findIndex(i => i.id === invoiceResult.id);
    if (invIdx !== -1) {
      freshInvoices[invIdx].payments = [{
        id: `pay_dep_${Date.now()}`,
        paymentDate: data.date,
        amount,
        method: mapDepositMethodToInvoiceMethod(data.method),
        notes: 'Seña inicial de contratación'
      }];
      await writeData(INVOICES_FILE, freshInvoices);
    }

    if (fiesta.presupuestoId && !data.skipBudgetPayment) {
      const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
        fecha: data.date,
        monto: amount,
        metodoPago: mapDepositMethodToBudgetMethod(data.method),
        referencia: paymentReference,
        estadoPago: 'confirmado',
      });
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'No se pudo registrar la sena en el presupuesto.');
      }
    }

    if (!data.skipFiestaSave) {
      await addInvoiceId(data.fiestaId, invoiceResult.id);
    }
    return { success: true, invoiceId: invoiceResult.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(id: string, linkedFiestaId?: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  const originalInvoices = await getInvoices();
  const initialLength = originalInvoices.length;
  const invoices = originalInvoices.filter(inv => inv.id !== id);
  if (invoices.length === initialLength) {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
  let deletionPersisted = false;
  try {
    await writeData(INVOICES_FILE, invoices);
    deletionPersisted = true;
    if (linkedFiestaId) {
      const unlinkResult = await removeInvoiceId(linkedFiestaId, id);
      if (!unlinkResult.success) {
        await writeData(INVOICES_FILE, originalInvoices);
        return { success: false, error: 'No se pudo desvincular la factura del evento. La eliminación fue revertida.' };
      }
    }
  } catch (writeError: any) {
    console.error('Error deleting invoice:', writeError);
    if (deletionPersisted) {
      try {
        await writeData(INVOICES_FILE, originalInvoices);
      } catch (rollbackError) {
        console.error('Error restoring invoice after unlink failure:', rollbackError);
        return { success: false, error: 'La factura quedó en un estado inconsistente. Recargá y no repitas la operación.' };
      }
    }
    return { success: false, error: writeError.message || 'Error al eliminar la factura.' };
  }
  return { success: true };
}

export async function resetAllInvoices(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const { dbAdmin } = await import('@/lib/firebase/server');
    let deletedCount = 0;
    if (dbAdmin) {
      const snapshot = await dbAdmin.collection('facturas').get();
      deletedCount = snapshot.size;
      const batchSize = 450;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = dbAdmin.batch();
        docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    logger.info('[Facturas] Todas las facturas eliminadas por admin.', { deletedCount });
    return { success: true, deletedCount };
  } catch (error: any) {
    logger.error('[Facturas] Error al reiniciar facturas:', error);
    return { success: false, error: error.message || 'Error al reiniciar las facturas.' };
  }
}

export async function addPaymentToInvoice(
  invoiceId: string,
  formData: FormData
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  const paymentDate = formData.get('paymentDate') as string || new Date().toISOString();
  const amountStr = formData.get('amount') as string;
  const rawMethod = formData.get('method') as string || 'Transferencia';
  const method = mapDepositMethodToInvoiceMethod(rawMethod);
  const notes = formData.get('notes') as string | undefined;
  const transactionProofFile = formData.get('transactionProof') as File | null;

  let invoices = await getInvoices();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
  if (invoiceIndex === -1) return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };

  const invoice = invoices[invoiceIndex];
  const amount = parseCleanMoney(amountStr);
  const balance = getInvoiceBalance(invoice);

  if (amount <= 0) return { success: false, error: 'El monto del pago debe ser mayor a cero.' };
  if (amount > balance + MONEY_TOLERANCE) return { success: false, error: `El pago supera el saldo pendiente. Saldo: ${balance.toLocaleString('es-UY')} UYU.` };
  if (!paymentDate || Number.isNaN(new Date(paymentDate).getTime())) return { success: false, error: 'La fecha del pago no es válida.' };

  const payments = invoice.payments || [];
  const paymentId = `pay_${invoiceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let transactionProofUrl: string | undefined = undefined;

  if (transactionProofFile && transactionProofFile.size > 0) {
    try {
      const bytes = await transactionProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `proof_${paymentId}_${transactionProofFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `payment-proofs/${uniqueFilename}`;
      transactionProofUrl = await uploadToStorage(buffer, storagePath, transactionProofFile.type || 'application/octet-stream', false);
    } catch (fileError: any) {
      console.error('Error saving payment proof file:', fileError);
      return { success: false, error: `Error al guardar el comprobante: ${fileError.message}` };
    }
  }

  const newPayment: Payment = {
    id: paymentId,
    paymentDate,
    amount,
    method,
    notes: notes?.trim() || undefined,
    transactionProofUrl,
  };

  const updatedPayments = [...payments, newPayment];
  const totalPaid = updatedPayments.reduce((sum, p) => sum + roundMoney(p.amount), 0);
  let newStatus = invoice.status;
  if (totalPaid >= roundMoney(invoice.totalAmount) - MONEY_TOLERANCE) {
    newStatus = 'Paid';
  } else if (totalPaid > 0 && invoice.status !== 'Overdue' && invoice.status !== 'Paid') {
    newStatus = invoice.status === 'Draft' ? 'Sent' : invoice.status;
  }

  invoices[invoiceIndex] = { ...invoice, payments: updatedPayments, status: newStatus };
  await writeData(INVOICES_FILE, invoices);
  return { success: true, invoice: invoices[invoiceIndex] };
}

function parseDateStringLocal(dateStr: string): Date {
  const match = (dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(dateStr);
}

export async function scanAndTriggerPaymentReminders(): Promise<{ success: boolean; triggeredCount: number; errors: string[] }> {
  const auth = await verifySession();
  if (!auth.success) throw new Error('No autorizado');

  const [invoices, scheduledMessages] = await Promise.all([
    getInvoices(),
    getScheduledMessages().catch(() => [])
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let triggeredCount = 0;
  const errors: string[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const inv of invoices) {
    if (inv.status === 'Paid') continue;
    const balance = getInvoiceBalance(inv);
    if (balance <= 0) continue;

    const due = parseDateStringLocal(inv.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determine trigger
    let trigger: 'pago_vencido' | 'pago_por_vencer' | null = null;
    if (diffDays < 0) {
      trigger = 'pago_vencido';
    } else if (diffDays >= 0 && diffDays <= 3) {
      trigger = 'pago_por_vencer';
    }

    if (trigger) {
      // Check for duplicate pending messages or recently sent ones to prevent spam
      const hasRecentOrPending = scheduledMessages.some(m =>
        m.targetId === inv.customer.id &&
        m.templateType === trigger &&
        (m.status === 'pendiente' || (m.status === 'enviado' && m.sentAt && new Date(m.sentAt) > oneDayAgo))
      );

      if (hasRecentOrPending) {
        continue;
      }

      const ctx = {
        targetId: inv.customer.id,
        targetName: inv.customer.name,
        targetType: 'cliente' as const,
        targetPhone: inv.customer.phone,
        fiestaId: inv.sourceFiestaId,
        nombre: inv.customer.name,
        saldo: `${inv.currency || 'UYU'} ${balance}`,
        fecha: inv.dueDate,
        link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/${inv.sourceFiestaId || ''}`,
      };

      const result = await triggerWhatsAppAutomation(trigger, ctx);
      if (result.scheduled > 0) {
        triggeredCount += result.scheduled;
      }
      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
    }
  }

  return { success: true, triggeredCount, errors };
}
