
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
import type { Invoice, InvoiceItem, Customer, Payment } from '@/types/invoice';

import fs from 'fs/promises';
import path from 'path';

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
    // Sort by issueDate descending
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
  // console.log("Firebase is disabled. Reading invoices from JSON.");
  const invoices = await readInvoicesFile();
  return invoices.map(inv => ({ ...inv, payments: inv.payments || [] }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  // console.log(`Firebase is disabled. Reading invoice ${id} from JSON.`);
  const invoices = await readInvoicesFile();
  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) return null;
  return { ...invoice, payments: invoice.payments || [] };
}

export async function saveInvoice(
  invoiceDataInput: Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] } | Invoice
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  // console.log("Firebase is disabled. Saving invoice to JSON.");
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
    const updatedItems = dataToUpdate.items.map((item, idx) => ({
      ...item,
      id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}`
    }));
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = dataToUpdate.taxRate ?? 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    invoices[index] = { 
      ...invoices[index], 
      ...dataToUpdate, 
      items: updatedItems as InvoiceItem[],
      payments: dataToUpdate.payments || [],
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
      id: `item_${invoiceId}_${index + 1}_${Date.now()}`
    }));
    finalInvoiceData = {
      ...(invoiceDataInput as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }),
      id: invoiceId,
      items: itemsWithIds,
      payments: [], // Initialize with empty payments array
    };
    invoices.push(finalInvoiceData);
  }
  await writeInvoicesFile(invoices);
  return { success: true, id: invoiceId, invoice: finalInvoiceData };
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  // console.log(`Firebase is disabled. Deleting invoice ${id} from JSON.`);
  let invoices = await readInvoicesFile();
  const initialLength = invoices.length;
  invoices = invoices.filter(inv => inv.id !== id);
  if (invoices.length === initialLength) {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
  await writeInvoicesFile(invoices);
  return { success: true };
}

export async function addPaymentToInvoice(
  invoiceId: string,
  paymentData: Omit<Payment, 'id'>
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  // console.log(`Firebase is disabled. Adding payment to invoice ${invoiceId} in JSON.`);
  let invoices = await readInvoicesFile();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

  if (invoiceIndex === -1) {
    return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
  }

  const invoice = invoices[invoiceIndex];
  const payments = invoice.payments || [];
  const newPayment: Payment = {
    ...paymentData,
    id: `pay_${invoiceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  payments.push(newPayment);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  let newStatus = invoice.status;
  if (totalPaid >= invoice.totalAmount) {
    newStatus = 'Paid';
  } else if (totalPaid > 0 && totalPaid < invoice.totalAmount) {
    if (invoice.status !== 'Overdue') newStatus = 'Sent'; 
  }
  
  invoices[invoiceIndex] = { ...invoice, payments, status: newStatus };
  await writeInvoicesFile(invoices);
  return { success: true, invoice: invoices[invoiceIndex] };
}
