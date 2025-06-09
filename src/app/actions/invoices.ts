
'use server';

import type { Invoice } from '@/types/invoice';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const invoicesFilePath = path.join(dataDirectory, 'invoices.json');

const initialMockInvoices: Invoice[] = [
  // Esta data inicial se usará solo si invoices.json no existe o está vacío.
  // Es la misma que está ahora en invoices.json.
  {
    id: 'inv_img_1',
    invoiceNumber: '2342',
    customer: { id: 'cust_1', name: 'INTERNACIONAL DE RECURSOS HUM. SOLUC. S.L.' },
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
    notes: 'Gracias por su negocio.'
  }
  // ... (podrías añadir más si quieres que el fallback sea más completo,
  // pero idealmente invoices.json siempre existirá)
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
    // Basic validation: check if it's an array.
    return Array.isArray(data) ? data : [...initialMockInvoices];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with initial/empty data
      await writeInvoicesFile([...initialMockInvoices]); // O un array vacío [] si prefieres
      return [...initialMockInvoices]; // O []
    }
    console.error('Error leyendo el archivo de facturas, usando datos iniciales de fallback:', error);
    return [...initialMockInvoices]; // Fallback a datos en memoria si hay error
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
  // Ordenar por fecha de emisión descendente (más recientes primero)
  return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await readInvoicesFile();
  const invoice = invoices.find(inv => inv.id === id);
  return invoice ? JSON.parse(JSON.stringify(invoice)) : null; // Deep copy
}

// Placeholder para futuras funciones de guardar y eliminar
// export async function saveInvoice(invoiceData: Omit<Invoice, 'id'> | Invoice): Promise<{ success: boolean; id?: string; invoice?: Invoice; error?: string }> {
//   // Lógica para guardar (crear o actualizar)
//   return { success: false, error: "Not implemented" };
// }

// export async function deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
//   // Lógica para eliminar
//   return { success: false, error: "Not implemented" };
// }

// Inicializar el archivo de datos si no existe al cargar este módulo
async function initializeInvoiceData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(invoicesFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo invoices.json no encontrado, creando con datos iniciales...');
            // Los datos iniciales se copian de src/data/invoices.json si existe, o del mock de este archivo.
            // readInvoicesFile() se encarga de esto.
            await readInvoicesFile(); 
        }
    }
}

initializeInvoiceData();
