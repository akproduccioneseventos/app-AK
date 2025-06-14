
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
import type { Customer, CustomerStatus } from '@/types/customer';
// import { getFiestaActual } from '@/app/actions/fiesta-actual'; // Firebase disabled for fiesta-actual too

import fs from 'fs/promises';
import path from 'path';

const CLIENTES_COLLECTION_JSON = 'customers.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, CLIENTES_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readCustomersFile(): Promise<Customer[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(customersFilePath);
    const fileContent = await fs.readFile(customersFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Customer[];
  } catch (error) {
    return [];
  }
}

async function writeCustomersFile(data: Customer[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
    await fs.writeFile(customersFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing customers JSON file:', error);
  }
}

async function initializeLocalCustomersFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(customersFilePath);
    const fileContent = await fs.readFile(customersFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeCustomersFile([]);
    } else {
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeCustomersFile([]);
  }
}
initializeLocalCustomersFile();

export async function getCustomers(): Promise<Customer[]> {
  // console.log("Firebase is disabled. Reading customers from JSON.");
  let customers = await readCustomersFile();
  customers = customers.map(c => ({ ...c, estadoCliente: c.estadoCliente || 'Actual' }));
  
  // Logic for updating estadoCliente based on fiestaActual would need fiesta-actual.ts to also read from JSON.
  // For now, this part is simplified as fiesta-actual also needs refactoring.
  // const fiestaActual = await getFiestaActual(); 
  // const clienteIdFiestaActual = fiestaActual?.configuracion?.clienteId;
  // const fechaEventoFiestaActual = fiestaActual?.configuracion?.fechaEvento;
  // if (clienteIdFiestaActual && fechaEventoFiestaActual) { /* ... existing logic ... */ }

  return customers;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  // console.log(`Firebase is disabled. Reading customer ${id} from JSON.`);
  const customers = await readCustomersFile();
  const customer = customers.find(c => c.id === id);
  if (!customer) return null;
  return { ...customer, estadoCliente: customer.estadoCliente || 'Actual' };
}

export async function saveCustomer(
  customerData: Omit<Customer, 'id'> | Customer
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  // console.log("Firebase is disabled. Saving customer to JSON.");
  let customers = await readCustomersFile();
  let finalCustomerData: Customer;
  let customerId: string;

  if ('id' in customerData && customerData.id) {
    // Update
    customerId = customerData.id;
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) {
      return { success: false, error: `Cliente con ID ${customerId} no encontrado.` };
    }
    const updatePayload = {
      ...customers[index],
      ...customerData,
      name: customerData.name || customerData.companyName || 'Sin Nombre Asignado',
      estadoCliente: customerData.estadoCliente || 'Actual',
    };
    customers[index] = updatePayload;
    finalCustomerData = updatePayload;
  } else {
    // Create
    customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    finalCustomerData = {
      ...(customerData as Omit<Customer, 'id'>),
      id: customerId,
      name: customerData.name || customerData.companyName || 'Sin Nombre Asignado',
      estadoCliente: (customerData as Customer).estadoCliente || 'Actual',
    };
    customers.push(finalCustomerData);
  }
  await writeCustomersFile(customers);
  return { success: true, id: customerId, customer: finalCustomerData };
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  // console.log(`Firebase is disabled. Deleting customer ${id} from JSON.`);
  let customers = await readCustomersFile();
  const initialLength = customers.length;
  customers = customers.filter(c => c.id !== id);
  if (customers.length === initialLength) {
    return { success: false, error: `Cliente con ID ${id} no encontrado para eliminar.` };
  }
  await writeCustomersFile(customers);
  return { success: true };
}
