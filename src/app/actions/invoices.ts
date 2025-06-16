
'use server';

import type { Invoice, InvoiceItem, Payment } from '@/types/invoice';
import fs from 'fs/promises';
import path from 'path';
import { markPresupuestoAsFacturado } from './presupuestos';

const INVOICES_COLLECTION_JSON = 'invoices.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const invoicesFilePath = path.join(dataDirectory, INVOICES_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readInvoicesFile(): Promise<Invoice[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(invoicesFilePath);
    const fileContent = await fs.readFile(invoicesFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Invoice[];
  } catch (error) {
    return [];
  }
}

async function writeInvoicesFile(data: Invoice[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    await fs.writeFile(invoicesFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing invoices JSON file:', error);
  }
}

async function initializeLocalInvoicesFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(invoicesFilePath);
    const fileContent = await fs.readFile(invoicesFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeInvoicesFile([]);
    } else {
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeInvoicesFile([]);
  }
}
initializeLocalInvoicesFile();

export async function getInvoices(): Promise<Invoice[]> {
  const invoices = await readInvoicesFile();
  return invoices.map(inv => ({ ...inv, payments: inv.payments || [] }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await readInvoicesFile();
  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) return null;
  return { ...invoice, payments: invoice.payments || [] };
}

export async function saveInvoice(
  invoiceDataInput: (Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }) | Invoice,
  sourcePresupuestoId?: string
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  let invoices = await readInvoicesFile();
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
    
    // Ensure items have IDs, if they are being updated.
    // For simplicity in this refactor, if items are passed in an update, we assume they are the new full set.
    // More complex merging of items could be done if needed.
    const updatedItems = (dataToUpdate.items || invoices[index].items).map((item, idx) => ({
      ...item,
      id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}_update`
    }));

    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = dataToUpdate.taxRate ?? invoices[index].taxRate ?? 0; // Keep existing tax rate if not provided
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    invoices[index] = { 
      ...invoices[index], 
      ...dataToUpdate, 
      items: updatedItems as InvoiceItem[],
      payments: dataToUpdate.payments || invoices[index].payments || [], // Preserve existing payments if not provided
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
  await writeInvoicesFile(invoices);

  if (sourcePresupuestoId && !('id' in invoiceDataInput)) { 
    const markResult = await markPresupuestoAsFacturado(sourcePresupuestoId, finalInvoiceData.id);
    if (!markResult.success) {
      console.warn(`Factura ${finalInvoiceData.id} creada, pero no se pudo marcar el presupuesto ${sourcePresupuestoId} como facturado: ${markResult.error}`);
    }
  }

  return { success: true, id: invoiceId, invoice: finalInvoiceData };
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  let invoices = await readInvoicesFile();
  const initialLength = invoices.length;
  invoices = invoices.filter(inv => inv.id !== id);
  if (invoices.length === initialLength) {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
  await writeInvoicesFile(invoices);
  // Also remove from fiestaActual if assigned
  // This might need to be a separate action or handled by the caller after successful deletion
  // For now, just deleting from the invoices store.
  return { success: true };
}

export async function addPaymentToInvoice(
  invoiceId: string,
  paymentData: Omit<Payment, 'id'>
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  let invoices = await readInvoicesFile();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

  if (invoiceIndex === -1) {
    return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
  }

  const invoice = invoices[invoiceIndex];
  const payments = invoice.payments || [];
  const newPayment: Payment = {
    ...paymentData,
    amount: Number(paymentData.amount), // Ensure amount is a number
    id: `pay_${invoiceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  payments.push(newPayment);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  let newStatus = invoice.status;
  if (totalPaid >= invoice.totalAmount) {
    newStatus = 'Paid';
  } else if (totalPaid > 0 && totalPaid < invoice.totalAmount && invoice.status !== 'Overdue') {
    newStatus = 'Sent'; // Or keep 'Sent' / 'Viewed' if already that, just means partially paid
  }
  
  invoices[invoiceIndex] = { ...invoice, payments, status: newStatus };
  await writeInvoicesFile(invoices);
  return { success: true, invoice: invoices[invoiceIndex] };
}
