
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Invoice, InvoiceItem, Customer, Payment } from '@/types/invoice';

const INVOICES_COLLECTION = 'facturas'; // Using Spanish "facturas"

export async function getInvoices(): Promise<Invoice[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener facturas.");
    return [];
  }
  try {
    const snapshot = await db.collection(INVOICES_COLLECTION).orderBy('issueDate', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    // Ensure payments array exists for each invoice
    return snapshot.docs.map(doc => {
        const data = doc.data() as Invoice;
        return { id: doc.id, ...data, payments: data.payments || [] };
    });
  } catch (error) {
    console.error('Error obteniendo facturas de Firestore:', error);
    throw new Error('No se pudieron cargar las facturas.');
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!db) {
    console.error("Firestore no está inicializado.");
    return null;
  }
  try {
    const doc = await db.collection(INVOICES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data() as Invoice;
    return { id: doc.id, ...data, payments: data.payments || [] };
  } catch (error) {
    console.error(`Error obteniendo factura ${id} de Firestore:`, error);
    throw new Error('No se pudo obtener la factura.');
  }
}

export async function saveInvoice(
  invoiceDataInput: Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] } | Invoice
): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    let finalInvoiceData: Invoice;
    let invoiceId: string;

    if ('id' in invoiceDataInput && invoiceDataInput.id) {
      // Update existing invoice
      invoiceId = invoiceDataInput.id;
      const { id, ...dataToUpdate } = invoiceDataInput;

      const updatedItems = dataToUpdate.items.map((item, idx) => ({
        ...item,
        id: (item as InvoiceItem).id || `item_${invoiceId}_${idx + 1}_${Date.now()}`
      }));
      
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxRate = dataToUpdate.taxRate ?? 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;
      
      const updatePayload = { 
        ...dataToUpdate, 
        items: updatedItems as InvoiceItem[],
        payments: dataToUpdate.payments || [],
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
      };
      await db.collection(INVOICES_COLLECTION).doc(invoiceId).set(updatePayload, { merge: true });
      finalInvoiceData = { id: invoiceId, ...updatePayload };
    } else {
      // Create new invoice
      const newInvoiceRef = db.collection(INVOICES_COLLECTION).doc();
      invoiceId = newInvoiceRef.id;
      
      const itemsWithIds: InvoiceItem[] = invoiceDataInput.items.map((item, index) => ({
        ...item,
        id: `item_${invoiceId}_${index + 1}_${Date.now()}`
      }));

      finalInvoiceData = {
        ...(invoiceDataInput as Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] }),
        id: invoiceId,
        items: itemsWithIds,
        payments: [] // Initialize with empty payments array
      };
      await newInvoiceRef.set(finalInvoiceData);
    }
    return { success: true, id: invoiceId, invoice: finalInvoiceData };
  } catch (error: any) {
    console.error('Error guardando factura en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar la factura.' };
  }
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const doc = await db.collection(INVOICES_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return { success: false, error: `Factura con ID ${id} no encontrada para eliminar.` };
    }
    await db.collection(INVOICES_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando factura ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar la factura.' };
  }
}

export async function addPaymentToInvoice(
  invoiceId: string,
  paymentData: Omit<Payment, 'id'>
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      return { success: false, error: `Factura con ID ${invoiceId} no encontrada.` };
    }

    const invoice = invoiceDoc.data() as Invoice;
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
      if (invoice.status !== 'Overdue') newStatus = 'Sent'; // Or a new 'PartiallyPaid' status
    }
    
    await invoiceRef.update({ payments: payments, status: newStatus });
    const updatedInvoice = { ...invoice, payments, status: newStatus };
    return { success: true, invoice: updatedInvoice };
  } catch (error: any) {
    console.error('Error añadiendo pago a factura en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo añadir el pago.' };
  }
}
