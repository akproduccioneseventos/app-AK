

'use server';

import type { Invoice, InvoiceItem, Payment } from '@/types/invoice';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';
import { markPresupuestoAsFacturado } from './presupuestos';

const INVOICES_FILE = 'invoices.json';
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PAYMENT_PROOFS_DIR_NAME = 'payment-proofs';
const paymentProofsDirectoryPath = path.join(DATA_DIR, PAYMENT_PROOFS_DIR_NAME);

async function ensureSubdirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}
ensureSubdirectoryExists(paymentProofsDirectoryPath);


export async function getInvoices(): Promise<Invoice[]> {
  const invoices = await readData<Invoice[]>(INVOICES_FILE, []);
  return invoices.map(inv => ({ ...inv, payments: inv.payments || [] }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  return invoices.find(inv => inv.id === id) || null;
}

export async function saveInvoice(
  invoiceDataInput: (Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }) | Invoice,
  sourcePresupuestoId?: string
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  // Validate that all item quantities are positive and descriptions are not empty
  if (!invoiceDataInput.items || invoiceDataInput.items.some(item => item.quantity <= 0)) {
    return { success: false, error: 'La cantidad de cada ítem debe ser un número positivo.' };
  }
  if (invoiceDataInput.items.some(item => !item.description || item.description.trim() === '')) {
    return { success: false, error: 'Todos los ítems de la factura deben tener una descripción.' };
  }

  let invoices = await getInvoices();
  let finalInvoiceData: Invoice;
  let invoiceId: string;

  if ('id' in invoiceDataInput && invoiceDataInput.id) {
    // Update
    invoiceId = invoiceDataInput.id;
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index === -1) {
      return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
    }
    const { id, ...dataToUpdate } = invoiceDataInput;
    
    const updatedItems = (dataToUpdate.items || invoices[index].items).map((item, idx) => ({
      ...item,
      id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}_update`
    }));

    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = dataToUpdate.taxRate ?? invoices[index].taxRate ?? 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    invoices[index] = { 
      ...invoices[index], 
      ...dataToUpdate, 
      items: updatedItems as InvoiceItem[],
      payments: dataToUpdate.payments || invoices[index].payments || [],
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
     };
    finalInvoiceData = invoices[index];
  } else {
    // Create
    invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const itemsWithIds: InvoiceItem[] = invoiceDataInput.items.map((item, index) => ({
      ...item,
      id: `item_${invoiceId}_${index + 1}_${Date.now()}_create`
    }));
    finalInvoiceData = {
      ...(invoiceDataInput as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }),
      id: invoiceId,
      items: itemsWithIds,
      payments: [], 
    };
    invoices.push(finalInvoiceData);
  }
  await writeData(INVOICES_FILE, invoices, (a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  if (sourcePresupuestoId && !('id' in invoiceDataInput)) { 
    const markResult = await markPresupuestoAsFacturado(sourcePresupuestoId, finalInvoiceData.id);
    if (!markResult.success) {
      console.warn(`Factura ${finalInvoiceData.id} creada, pero no se pudo marcar el presupuesto ${sourcePresupuestoId} como facturado: ${markResult.error}`);
    }
  }

  return { success: true, id: invoiceId, invoice: finalInvoiceData };
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  let invoices = await getInvoices();
  const initialLength = invoices.length;
  invoices = invoices.filter(inv => inv.id !== id);
  if (invoices.length === initialLength) {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
  await writeData(INVOICES_FILE, invoices);
  return { success: true };
}

export async function addPaymentToInvoice(
  invoiceId: string,
  formData: FormData
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  const paymentDate = formData.get('paymentDate') as string;
  const amountStr = formData.get('amount') as string;
  const method = formData.get('method') as Payment['method'];
  const notes = formData.get('notes') as string | undefined;
  const transactionProofFile = formData.get('transactionProof') as File | null;

  if (!paymentDate || !amountStr || !method) {
    return { success: false, error: "Faltan datos del pago (fecha, monto o método)." };
  }
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "El monto del pago debe ser un número positivo." };
  }

  let invoices = await getInvoices();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

  if (invoiceIndex === -1) {
    return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
  }

  const invoice = invoices[invoiceIndex];
  const payments = invoice.payments || [];
  const paymentId = `pay_${invoiceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let transactionProofUrl: string | undefined = undefined;

  if (transactionProofFile && transactionProofFile.size > 0) {
    try {
      await ensureSubdirectoryExists(paymentProofsDirectoryPath);
      const bytes = await transactionProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `proof_${paymentId}_${transactionProofFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(paymentProofsDirectoryPath, uniqueFilename), buffer);
      transactionProofUrl = `/api/payment-proofs/${uniqueFilename}`;
    } catch (fileError: any) {
      console.error("Error saving payment proof file:", fileError);
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

  payments.push(newPayment);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  let newStatus = invoice.status;
  if (totalPaid >= invoice.totalAmount) {
    newStatus = 'Paid';
  } else if (totalPaid > 0 && invoice.status !== 'Overdue' && invoice.status !== 'Paid') {
    newStatus = invoice.status === 'Draft' ? 'Sent' : invoice.status;
  }

  invoices[invoiceIndex] = { ...invoice, payments, status: newStatus };
  await writeData(INVOICES_FILE, invoices);
  return { success: true, invoice: invoices[invoiceIndex] };
}
