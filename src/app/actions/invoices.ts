'use server';

import type { Invoice, InvoiceItem, Payment } from '@/types/invoice';
import type { MetodoPago } from '@/types/presupuesto';
import { readData, writeData } from '@/lib/data-service';
import { addPagoToPresupuesto, markPresupuestoAsFacturado } from './presupuestos';
import { addInvoiceId } from './fiesta/fiesta.actions';
import * as logger from '@/lib/logger';
import { uploadToStorage } from '@/lib/firebase/storage';
import { verifySession } from '@/lib/auth/session-token';

const INVOICES_FILE = 'invoices.json';
const MONEY_TOLERANCE = 1;

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
    const amount = roundMoney(data.amount);
    if (amount <= 0) return { success: false, error: 'El monto de la seña debe ser mayor a cero.' };
    if (!data.date || Number.isNaN(new Date(data.date).getTime())) return { success: false, error: 'La fecha de la seña no es válida.' };

    const fiesta = await readData<any>(`fiestas/${data.fiestaId}.json`, null);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    if (fiesta.presupuestoId && !data.skipBudgetPayment) {
      const [{ getPresupuestoById }, { validatePaymentAgainstBudget }] = await Promise.all([
        import('./presupuestos'),
        import('@/lib/budget/financial-guardrails'),
      ]);
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
      if (presupuesto) {
        const validation = validatePaymentAgainstBudget(presupuesto, amount, { includePendingForLimit: true });
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
      vendorName: 'AK Producciones'
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
        method: data.method as any,
        notes: 'Seña inicial de contratación'
      }];
      await writeData(INVOICES_FILE, freshInvoices);
    }

    if (fiesta.presupuestoId && !data.skipBudgetPayment) {
      const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
        fecha: data.date,
        monto: amount,
        metodoPago: mapDepositMethodToBudgetMethod(data.method),
        referencia: `Seña registrada desde evento ${fiesta.configuracion.nombreEvento || data.fiestaId}`,
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

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  let invoices = await getInvoices();
  const initialLength = invoices.length;
  invoices = invoices.filter(inv => inv.id !== id);
  if (invoices.length === initialLength) {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
  try {
    await writeData(INVOICES_FILE, invoices);
  } catch (writeError: any) {
    console.error('Error deleting invoice:', writeError);
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
  const method = formData.get('method') as Payment['method'] || 'Transferencia';
  const notes = formData.get('notes') as string | undefined;
  const transactionProofFile = formData.get('transactionProof') as File | null;

  let invoices = await getInvoices();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
  if (invoiceIndex === -1) return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };

  const invoice = invoices[invoiceIndex];
  const amount = roundMoney(amountStr);
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
