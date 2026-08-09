'use server';

import type { Invoice, InvoiceItem, Payment } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';
import { readData, writeData } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';
import { addPagoToPresupuesto, markPresupuestoAsFacturado } from './presupuestos';
import { addInvoiceId, removeInvoiceId } from './fiesta/fiesta.actions';
import * as logger from '@/lib/logger';
import { uploadToStorage } from '@/lib/firebase/storage';
import { verifySession } from '@/lib/auth/session-token';
import { findMatchingClientPayment, parseCleanMoney } from '@/lib/budget/financial-guardrails';
import { findExistingDepositReceipt } from '@/lib/commercial-flow/ledger-service';
import { triggerWhatsAppAutomation } from '@/lib/whatsapp-automation-engine';
import { getScheduledMessages } from '@/app/actions/scheduled-messages';
import { invoiceMoneyTolerance, roundInvoiceMoney } from '@/lib/invoice-money';
import {
  buildDepositPaymentBreakdown,
  mapDepositMethodToBudgetMethod,
  mapDepositMethodToInvoiceMethod,
} from '@/lib/payments/deposit-payment';

const INVOICES_FILE = 'invoices.json';

type NewInvoiceInput = Omit<Invoice, 'id' | 'items' | 'payments'> & {
  items: Omit<InvoiceItem, 'id'>[];
  payments?: Payment[];
};

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

function getInvoicePaidAmount(invoice: Pick<Invoice, 'payments' | 'currency'>): number {
  return (invoice.payments || []).reduce((sum, payment) => sum + roundInvoiceMoney(payment.amount, invoice.currency), 0);
}

function getInvoiceBalance(invoice: Pick<Invoice, 'totalAmount' | 'payments' | 'currency'>): number {
  return Math.max(0, roundInvoiceMoney(invoice.totalAmount, invoice.currency) - getInvoicePaidAmount(invoice));
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

// Todas estas funciones hacen leer-modificar-escribir sobre el mismo archivo de
// facturas. Sin turno, dos guardados simultaneos se pisan y se pierde una
// factura entera. `presupuestos.ts` ya usaba este mismo mecanismo; facturas no.
// OJO: `registerBookingDeposit` NO se envuelve, porque llama a `saveInvoice`
// aca adentro y el turno no es reentrante: se colgaria la app al cobrar una sena.
const invoicesMutex = new AsyncMutex();

export async function saveInvoice(
  ...args: Parameters<typeof saveInvoiceInner>
): ReturnType<typeof saveInvoiceInner> {
  return invoicesMutex.runExclusive(() => saveInvoiceInner(...args));
}

export async function deleteInvoice(
  ...args: Parameters<typeof deleteInvoiceInner>
): ReturnType<typeof deleteInvoiceInner> {
  return invoicesMutex.runExclusive(() => deleteInvoiceInner(...args));
}

export async function resetAllInvoices(): ReturnType<typeof resetAllInvoicesInner> {
  return invoicesMutex.runExclusive(() => resetAllInvoicesInner());
}

export async function addPaymentToInvoice(
  ...args: Parameters<typeof addPaymentToInvoiceInner>
): ReturnType<typeof addPaymentToInvoiceInner> {
  return invoicesMutex.runExclusive(() => addPaymentToInvoiceInner(...args));
}

async function saveInvoiceInner(
  invoiceDataInput: NewInvoiceInput | Invoice,
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

    // Dos facturas con el mismo numero rompen la busqueda y los reportes.
    // Los recibos de sena quedan afuera a proposito: comparten el numero por
    // evento cuando el cliente paga la sena en varias veces, y la duplicacion
    // real ya la corta findExistingDepositReceipt.
    const numeroPedido = invoiceDataInput.invoiceNumber?.trim();
    const idPropio = 'id' in invoiceDataInput ? invoiceDataInput.id : undefined;
    const esRecibaDeSena = numeroPedido
      ? isDepositReceiptInvoice({ documentKind: invoiceDataInput.documentKind, invoiceNumber: numeroPedido })
      : false;
    if (numeroPedido && !esRecibaDeSena
        && invoices.some(inv => inv.invoiceNumber?.trim() === numeroPedido && inv.id !== idPropio)) {
      return { success: false, error: `Ya existe otra factura con el número ${numeroPedido}.` };
    }

    if ('id' in invoiceDataInput && invoiceDataInput.id) {
      invoiceId = invoiceDataInput.id;
      const index = invoices.findIndex(inv => inv.id === invoiceId);
      if (index === -1) {
        return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
      }
      const { id, ...dataToUpdate } = invoiceDataInput;
      const facturaActual = invoices[index];
      const tienePagos = (facturaActual.payments ?? []).length > 0;

      // Una factura ya cobrada es un comprobante: no se le cambia el numero, la
      // moneda ni se la vuelve a poner en borrador. El cliente ya estaba
      // protegido asi en la pantalla; faltaba el resto, y faltaba en el servidor.
      if (tienePagos) {
        if (dataToUpdate.invoiceNumber && dataToUpdate.invoiceNumber !== facturaActual.invoiceNumber) {
          return { success: false, error: 'No se puede cambiar el número de una factura con pagos registrados.' };
        }
        if (dataToUpdate.currency && dataToUpdate.currency !== facturaActual.currency) {
          return { success: false, error: 'No se puede cambiar la moneda de una factura con pagos registrados.' };
        }
      }
      if (facturaActual.status === 'Paid' && dataToUpdate.status && dataToUpdate.status !== 'Paid') {
        return { success: false, error: 'Una factura pagada no puede volver a otro estado. Registrá una nota de crédito o un ajuste.' };
      }

      const currency = dataToUpdate.currency || invoices[index].currency || 'UYU';

      const updatedItems = (dataToUpdate.items || invoices[index].items).map((item, idx) => {
        const quantity = normalizeQuantity(item.quantity);
        const unitPrice = roundInvoiceMoney(item.unitPrice, currency);
        const total = roundInvoiceMoney(quantity * unitPrice, currency);
        return {
          ...item,
          quantity,
          unitPrice,
          total,
          id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}_update`,
        };
      });

      const subtotal = updatedItems.reduce((sum, item) => sum + roundInvoiceMoney(item.total, currency), 0);
      const taxRate = normalizeTaxRate(dataToUpdate.taxRate ?? invoices[index].taxRate ?? 0);
      const taxAmount = roundInvoiceMoney((subtotal * taxRate) / 100, currency);
      const totalAmount = roundInvoiceMoney(subtotal + taxAmount, currency);
      const payments = (dataToUpdate.payments || invoices[index].payments || []).map(payment => ({
        ...payment,
        amount: roundInvoiceMoney(payment.amount, currency),
      }));
      const totalPaid = getInvoicePaidAmount({ payments, currency });
      if (totalPaid > totalAmount + invoiceMoneyTolerance(currency)) {
        return { success: false, error: 'Los pagos registrados superan el total de la factura.' };
      }

      invoices[index] = {
        ...invoices[index],
        ...dataToUpdate,
        items: updatedItems as InvoiceItem[],
        payments,
        currency,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
      };
      finalInvoiceData = invoices[index];
    } else {
      invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const currency = invoiceDataInput.currency || 'UYU';
      const itemsWithIds: InvoiceItem[] = invoiceDataInput.items.map((item, index) => {
        const quantity = normalizeQuantity(item.quantity);
        const unitPrice = roundInvoiceMoney(item.unitPrice, currency);
        const total = roundInvoiceMoney(quantity * unitPrice, currency);
        return {
          ...item,
          quantity,
          unitPrice,
          total,
          id: `item_${invoiceId}_${index + 1}_${Date.now()}_create`,
        };
      });
      const subtotal = itemsWithIds.reduce((sum, item) => sum + roundInvoiceMoney(item.total, currency), 0);
      const taxRate = normalizeTaxRate(invoiceDataInput.taxRate ?? 0);
      const taxAmount = roundInvoiceMoney((subtotal * taxRate) / 100, currency);
      const totalAmount = roundInvoiceMoney(subtotal + taxAmount, currency);
      const inputPayments = ('payments' in invoiceDataInput ? invoiceDataInput.payments : []) || [];
      const payments = inputPayments.map((payment) => ({
        ...payment,
        amount: roundInvoiceMoney(payment.amount, currency),
      }));
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPaid > totalAmount + invoiceMoneyTolerance(currency)) {
        return { success: false, error: 'Los pagos registrados superan el total de la factura.' };
      }
      finalInvoiceData = {
        ...(invoiceDataInput as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }),
        id: invoiceId,
        items: itemsWithIds,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        currency,
        payments,
        status: totalAmount > 0 && totalPaid >= totalAmount - invoiceMoneyTolerance(currency)
          ? 'Paid'
          : invoiceDataInput.status,
        sourcePresupuestoId: invoiceDataInput.sourcePresupuestoId || sourcePresupuestoId,
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
  installments?: number;
  skipBudgetPayment?: boolean;
  skipFiestaSave?: boolean;
}): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const baseAmount = parseCleanMoney(data.amount);
    if (baseAmount <= 0) return { success: false, error: 'El monto de la seña debe ser mayor a cero.' };
    if (!data.date || Number.isNaN(new Date(data.date).getTime())) return { success: false, error: 'La fecha de la seña no es válida.' };
    const paymentBreakdown = buildDepositPaymentBreakdown(
      baseAmount,
      data.method,
      data.installments,
    );
    const chargedAmount = paymentBreakdown.chargedAmount;

    const fiesta = await readData<any>(`fiestas/${data.fiestaId}.json`, null);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const paymentDay = new Date(data.date).toISOString().slice(0, 10);
    const paymentReference = [
      'Seña registrada',
      data.fiestaId,
      paymentDay,
      baseAmount,
      chargedAmount,
      paymentBreakdown.installments ?? 0,
    ].join(':');
    let linkedBudget: Presupuesto | null = null;

    if (fiesta.presupuestoId) {
      const { getPresupuestoById } = await import('./presupuestos');
      linkedBudget = await getPresupuestoById(fiesta.presupuestoId);
    }

    const existingReceipt = findExistingDepositReceipt(await getInvoices(), {
      fiestaId: data.fiestaId,
      invoiceIds: fiesta.invoiceIds,
      amount: chargedAmount,
      date: data.date,
    });

    if (existingReceipt) {
      if (linkedBudget && !data.skipBudgetPayment) {
        const paymentAlreadyRegistered = Boolean(findMatchingClientPayment(
          linkedBudget.pagosCliente,
          baseAmount,
          data.date,
        ));
        if (!paymentAlreadyRegistered) {
          const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
            fecha: data.date,
            monto: baseAmount,
            metodoPago: paymentBreakdown.budgetMethod,
            referencia: paymentReference,
            estadoPago: 'confirmado',
            montoCobrado: chargedAmount,
            recargoFinanciero: paymentBreakdown.surchargeAmount,
            cuotasFinanciacion: paymentBreakdown.installments,
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
        const validation = validatePaymentAgainstBudget(linkedBudget, baseAmount, { includePendingForLimit: true });
        if (!validation.ok) return { success: false, error: validation.error };
      }
    }

    const invoiceItems: Omit<InvoiceItem, 'id'>[] = [{
      description: `Seña para reserva de evento: ${fiesta.configuracion.nombreEvento}`,
      quantity: 1,
      unitPrice: baseAmount,
      total: baseAmount,
    }];
    if (paymentBreakdown.surchargeAmount > 0) {
      invoiceItems.push({
        description: `Recargo de financiación Mercado Pago (${paymentBreakdown.installments} cuotas)`,
        quantity: 1,
        unitPrice: paymentBreakdown.surchargeAmount,
        total: paymentBreakdown.surchargeAmount,
      });
    }

    const newInvoice: NewInvoiceInput = {
      invoiceNumber: `SEÑA-${data.fiestaId.slice(-5)}`,
      customer: { id: fiesta.configuracion.clienteId, name: fiesta.configuracion.clienteNombre || fiesta.configuracion.nombreEvento?.split(' de ')[1] || 'Cliente' },
      issueDate: data.date,
      dueDate: data.date,
      items: invoiceItems,
      subtotal: chargedAmount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: chargedAmount,
      status: 'Paid',
      currency: 'UYU',
      vendorName: 'AK Producciones',
      documentKind: 'deposit_receipt',
      sourceFiestaId: data.fiestaId,
      sourcePresupuestoId: fiesta.presupuestoId,
      payments: [{
        id: `pay_dep_${Date.now()}`,
        paymentDate: data.date,
        amount: chargedAmount,
        method: paymentBreakdown.invoiceMethod,
        notes: paymentBreakdown.installmentOption
          ? `Seña inicial. ${paymentBreakdown.installmentOption.label}.`
          : 'Seña inicial de contratación',
        baseAmount,
        surchargeAmount: paymentBreakdown.surchargeAmount,
        installments: paymentBreakdown.installments,
      }],
    };

    const invoiceResult = await saveInvoice(newInvoice);
    if (!invoiceResult.success || !invoiceResult.id) throw new Error(invoiceResult.error || 'Error al crear recibo de seña.');

    if (fiesta.presupuestoId && !data.skipBudgetPayment) {
      const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
        fecha: data.date,
        monto: baseAmount,
        metodoPago: paymentBreakdown.budgetMethod,
        referencia: paymentReference,
        estadoPago: 'confirmado',
        montoCobrado: chargedAmount,
        recargoFinanciero: paymentBreakdown.surchargeAmount,
        cuotasFinanciacion: paymentBreakdown.installments,
      });
      if (!paymentResult.success) {
        // Deshacer el recibo recien creado tambien es leer-modificar-escribir:
        // va con turno, o pisa lo que otro guardo entremedio.
        await invoicesMutex.runExclusive(async () => {
          const invoicesWithoutDeposit = (await getInvoices()).filter((invoice) => invoice.id !== invoiceResult.id);
          await writeData(INVOICES_FILE, invoicesWithoutDeposit);
        });
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

async function deleteInvoiceInner(id: string, linkedFiestaId?: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifySession();
  if (!auth.success) return { success: false, error: auth.error };
  if (auth.user?.role !== 'admin') return { success: false, error: 'Solo administradores pueden eliminar facturas.' };
  const originalInvoices = await getInvoices();
  // Borrar una factura cobrada hace desaparecer el comprobante del cobro.
  const aBorrar = originalInvoices.find(inv => inv.id === id);
  if (aBorrar && ((aBorrar.payments ?? []).length > 0 || aBorrar.status === 'Paid')) {
    return { success: false, error: 'No se puede eliminar una factura con pagos registrados. Es el comprobante del cobro.' };
  }
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

async function resetAllInvoicesInner(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    if (auth.user?.role !== 'admin') return { success: false, error: 'Solo administradores pueden resetear facturas.' };
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

async function addPaymentToInvoiceInner(
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
  const amount = roundInvoiceMoney(parseCleanMoney(amountStr), invoice.currency);
  const balance = getInvoiceBalance(invoice);

  if (amount <= 0) return { success: false, error: 'El monto del pago debe ser mayor a cero.' };
  if (amount > balance + invoiceMoneyTolerance(invoice.currency)) return { success: false, error: `El pago supera el saldo pendiente. Saldo: ${balance.toLocaleString('es-UY')} ${invoice.currency}.` };
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
  const totalPaid = updatedPayments.reduce((sum, p) => sum + roundInvoiceMoney(p.amount, invoice.currency), 0);
  let newStatus = invoice.status;
  if (totalPaid >= roundInvoiceMoney(invoice.totalAmount, invoice.currency) - invoiceMoneyTolerance(invoice.currency)) {
    newStatus = 'Paid';
  } else if (totalPaid > 0 && invoice.status !== 'Overdue' && invoice.status !== 'Paid') {
    newStatus = invoice.status === 'Draft' ? 'Sent' : invoice.status;
  }

  invoices[invoiceIndex] = { ...invoice, payments: updatedPayments, status: newStatus };
  await writeData(INVOICES_FILE, invoices);

  if (invoice.sourcePresupuestoId) {
    const budgetPaymentResult = await addPagoToPresupuesto(invoice.sourcePresupuestoId, {
      fecha: paymentDate,
      monto: amount,
      metodoPago: mapDepositMethodToBudgetMethod(method),
      referencia: `AK_SYNC:invoice:${invoiceId}:payment:${paymentId}`,
      estadoPago: 'confirmado',
    });
    if (!budgetPaymentResult.success) {
      invoices[invoiceIndex] = invoice;
      try {
        await writeData(INVOICES_FILE, invoices);
      } catch (rollbackError) {
        logger.error('[Facturas] No se pudo revertir un pago sin sincronizar:', rollbackError);
        return { success: false, error: 'El pago quedó pendiente de conciliación. No lo ingreses nuevamente y revisa el presupuesto vinculado.' };
      }
      return { success: false, error: budgetPaymentResult.error || 'No se pudo sincronizar el pago con el presupuesto vinculado.' };
    }
  }

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
