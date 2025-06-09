
'use server';

import type { Invoice, InvoiceItem, Customer, Payment } from '@/types/invoice';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const invoicesFilePath = path.join(dataDirectory, 'invoices.json');

const initialMockInvoices: Invoice[] = [
  {
    id: 'inv_img_1',
    invoiceNumber: '2342',
    customer: { id: 'cust_1', name: 'INTERNACIONAL DE RECURSOS HUM. SOLUC. S.L.' } as Customer, // Cast for type compatibility
    issueDate: '2022-01-01',
    dueDate: '2022-01-01',
    items: [{ id: 'item_img_1_1', description: 'ALQUILER EQUIPO AUDIOVISUAL', quantity: 1, unitPrice: 300.00, total: 300.00 }],
    subtotal: 300.00,
    taxRate: 21,
    taxAmount: 63.00,
    totalAmount: 363.00,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
    notes: 'Gracias por su negocio.',
    payments: [{id: 'pay_1', paymentDate: '2022-01-01', amount: 363.00, method: 'Transferencia'}]
  }
];

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para facturas:', error);
  }
}

async function readInvoicesFile(): Promise<Invoice[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(invoicesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    // Ensure payments array exists for each invoice
    const invoicesWithPayments = (Array.isArray(data) ? data : [...initialMockInvoices]).map(inv => ({
      ...inv,
      payments: inv.payments || [] 
    }));
    return invoicesWithPayments;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const initialDataWithPayments = initialMockInvoices.map(inv => ({ ...inv, payments: inv.payments || [] }));
      await writeInvoicesFile(initialDataWithPayments);
      return [...initialDataWithPayments];
    }
    console.error('Error leyendo el archivo de facturas, usando datos iniciales de fallback:', error);
    return [...initialMockInvoices.map(inv => ({ ...inv, payments: inv.payments || [] }))]; 
  }
}

async function writeInvoicesFile(data: Invoice[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(invoicesFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de facturas:', error);
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  const invoices = await readInvoicesFile();
  return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await readInvoicesFile();
  const invoice = invoices.find(inv => inv.id === id);
  return invoice ? { ...invoice, payments: invoice.payments || [] } : null;
}

export async function saveInvoice(
  invoiceData: Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] } | Invoice
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  let invoices = await readInvoicesFile();
  
  if ('id' in invoiceData && invoiceData.id) {
    // Update existing invoice - Placeholder for future edit functionality
    const index = invoices.findIndex(inv => inv.id === invoiceData.id);
    if (index !== -1) {
      // Ensure items have IDs
      const updatedItems = invoiceData.items.map((item, idx) => ({
        ...item,
        id: (item as InvoiceItem).id || `item_${invoiceData.id}_${idx + 1}_${Date.now()}`
      }));
      invoices[index] = { 
        ...invoiceData, 
        items: updatedItems as InvoiceItem[],
        payments: invoiceData.payments || invoices[index].payments || [] // Preserve existing payments if not provided
      };
      await writeInvoicesFile(invoices);
      return { success: true, id: invoiceData.id, invoice: JSON.parse(JSON.stringify(invoices[index])) };
    } else {
      return { success: false, error: `Factura con ID ${invoiceData.id} no encontrada para actualizar.` };
    }
  } else {
    // Create new invoice
    const newInvoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const itemsWithIds: InvoiceItem[] = invoiceData.items.map((item, index) => ({
      ...item,
      id: `item_${newInvoiceId}_${index + 1}_${Date.now()}`
    }));

    const newInvoice: Invoice = {
      ...(invoiceData as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }), // Type assertion
      id: newInvoiceId,
      items: itemsWithIds,
      payments: [] // Initialize with empty payments array
    };
    invoices.push(newInvoice);
    await writeInvoicesFile(invoices);
    return { success: true, id: newInvoice.id, invoice: JSON.parse(JSON.stringify(newInvoice)) };
  }
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  let invoices = await readInvoicesFile();
  const initialLength = invoices.length;
  invoices = invoices.filter(inv => inv.id !== id);
  
  if (customers.length < initialLength) {
    await writeInvoicesFile(invoices);
    return { success: true };
  } else {
    return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
  }
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
  if (!invoice.payments) {
    invoice.payments = [];
  }

  const newPayment: Payment = {
    ...paymentData,
    id: `pay_${invoiceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  invoice.payments.push(newPayment);

  // Update invoice status based on payments
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaid >= invoice.totalAmount) {
    invoice.status = 'Paid';
  } else if (totalPaid > 0 && totalPaid < invoice.totalAmount) {
    // Keep status if it was 'Sent' or 'Overdue', or could be 'Partially Paid' if we add that status
    if (invoice.status !== 'Overdue') invoice.status = 'Sent'; // Or a new 'PartiallyPaid' status
  }
  // 'Overdue' status would typically be set by a separate process checking due dates

  invoices[invoiceIndex] = invoice;
  await writeInvoicesFile(invoices);
  return { success: true, invoice: JSON.parse(JSON.stringify(invoice)) };
}


async function initializeInvoiceData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(invoicesFilePath);
        // If file exists, read it to ensure payments array is initialized if missing from old data
        const currentInvoices = await readInvoicesFile();
        let wasModified = false;
        const updatedInvoices = currentInvoices.map(inv => {
            if (!inv.payments) {
                inv.payments = [];
                wasModified = true;
            }
            return inv;
        });
        if (wasModified) {
            await writeInvoicesFile(updatedInvoices);
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo invoices.json no encontrado, creando con datos iniciales...');
            await readInvoicesFile(); 
        }
    }
}

initializeInvoiceData();

// Dummy customer array for deleteInvoice function - this should be removed or refactored
// as customer data is managed in customers.ts
const customers: any[] = [];
