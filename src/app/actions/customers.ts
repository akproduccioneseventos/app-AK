
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
import type { Customer, CustomerStatus } from '@/types/customer';
// import { getFiestaActual } from '@/app/actions/fiesta-actual'; // Firebase disabled for fiesta-actual too

import fs from 'fs/promises';
import path from 'path';

const CLIENTES_COLLECTION_JSON = 'customers.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, CLIENTES_COLLECTION_JSON);

const CONTRACTS_DIR_NAME = 'contracts';
const BUDGETS_DIR_NAME = 'budgets'; // New directory for budgets
const contractsDirectoryPath = path.join(dataDirectory, CONTRACTS_DIR_NAME);
const budgetsDirectoryPath = path.join(dataDirectory, BUDGETS_DIR_NAME); // New path for budgets

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function ensureContractsDirectoryExists() {
  try {
    await fs.access(contractsDirectoryPath);
  } catch {
    await fs.mkdir(contractsDirectoryPath, { recursive: true });
  }
}

async function ensureBudgetsDirectoryExists() { // New function for budgets
  try {
    await fs.access(budgetsDirectoryPath);
  } catch {
    await fs.mkdir(budgetsDirectoryPath, { recursive: true });
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
ensureContractsDirectoryExists();
ensureBudgetsDirectoryExists(); // Ensure budgets directory also exists

export async function getCustomers(): Promise<Customer[]> {
  let customers = await readCustomersFile();
  customers = customers.map(c => ({ ...c, estadoCliente: c.estadoCliente || 'Actual' }));
  return customers;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await readCustomersFile();
  const customer = customers.find(c => c.id === id);
  if (!customer) return null;
  return { ...customer, estadoCliente: customer.estadoCliente || 'Actual' };
}

export async function saveCustomer(
  customerData: Omit<Customer, 'id'> | Customer | FormData
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  let customers = await readCustomersFile();
  let customerId: string;
  let customerToSave: Partial<Customer> = {}; // Use Partial for easier assembly

  let contractFile: File | null = null;
  let budgetFile: File | null = null; // New for budget file

  if (customerData instanceof FormData) {
    customerToSave.name = customerData.get('name') as string;
    customerToSave.companyName = customerData.get('companyName') as string | undefined;
    customerToSave.phone = customerData.get('phone') as string | undefined;
    customerToSave.taxId = customerData.get('taxId') as string | undefined;
    customerToSave.email = customerData.get('email') as string | undefined;
    // El campo 'street' ya no se toma del FormData para la dirección del salón
    // Si se quiere una dirección general del cliente, se debería agregar un campo separado
    
    customerToSave.partyDate = customerData.get('partyDate') as string | undefined;
    customerToSave.partyTime = customerData.get('partyTime') as string | undefined;
    customerToSave.partyType = customerData.get('partyType') as string | undefined;
    const guestCountStr = customerData.get('guestCount') as string | undefined;
    customerToSave.guestCount = guestCountStr ? parseInt(guestCountStr, 10) : undefined;
    customerToSave.venueName = customerData.get('venueName') as string | undefined;

    contractFile = customerData.get('contract') as File | null;
    budgetFile = customerData.get('budget') as File | null; // Get budget file

    const formId = customerData.get('id') as string | undefined;
    if (formId) customerToSave.id = formId;

    const estadoClienteForm = customerData.get('estadoCliente') as CustomerStatus | undefined;
    if(estadoClienteForm) customerToSave.estadoCliente = estadoClienteForm;

  } else {
    customerToSave = { ...customerData };
  }

  // Server-side validation: name OR companyName is required.
  if (!customerToSave.name?.trim() && !customerToSave.companyName?.trim()) {
    return { success: false, error: 'El nombre del cliente o de la empresa es obligatorio.' };
  }
  
  // Los campos de fiesta ya no son obligatorios para la creación/edición del cliente en sí.
  // La acción de crear una fiesta desde un cliente o vincularlos manejará esa lógica.


  if (customerToSave.id) { // Update
    customerId = customerToSave.id;
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) {
      return { success: false, error: `Cliente con ID ${customerId} no encontrado.` };
    }
    const existingCustomer = customers[index];
    customers[index] = {
      ...existingCustomer,
      ...customerToSave,
      name: customerToSave.name || customerToSave.companyName || existingCustomer.name || 'Sin Nombre Asignado',
      estadoCliente: customerToSave.estadoCliente || existingCustomer.estadoCliente || 'Actual',
      contractFileName: contractFile ? undefined : (customerToSave.contractFileName || existingCustomer.contractFileName),
      budgetFileName: budgetFile ? undefined : (customerToSave.budgetFileName || existingCustomer.budgetFileName),
      // address se mantiene tal cual si no se modifica. La UI ya no permite editar 'street'.
      address: customerToSave.address || existingCustomer.address
    };
    customerToSave = customers[index]; 
  } else { // Create
    customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Ensure address is an object if street was part of the input, otherwise undefined
    const newCustomerBase: Omit<Customer, 'id'> = {
        ...(customerToSave as Omit<Customer, 'id'>), // Cast excluding id
        name: customerToSave.name || customerToSave.companyName || 'Sin Nombre Asignado',
        estadoCliente: customerToSave.estadoCliente || 'Actual',
        // `address` solo se crea si 'street' viene, lo cual ya no sucede
        address: undefined, // For new customers, address is not being set from form
    };
    customers.push({
      ...newCustomerBase,
      id: customerId,
    });
    customerToSave = customers[customers.length - 1];
  }
  
  if (contractFile) {
    try {
      await ensureContractsDirectoryExists();
      const bytes = await contractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `contract_${customerId}_${Date.now()}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(contractsDirectoryPath, uniqueFilename), buffer);
      (customerToSave as Customer).contractFileName = uniqueFilename;
    } catch (fileError: any) {
      console.error("Error saving contract file:", fileError);
      return { success: false, error: `Error al guardar archivo de contrato: ${fileError.message}` };
    }
  }

  if (budgetFile) {
    try {
      await ensureBudgetsDirectoryExists();
      const bytes = await budgetFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `budget_${customerId}_${Date.now()}_${budgetFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(budgetsDirectoryPath, uniqueFilename), buffer);
      (customerToSave as Customer).budgetFileName = uniqueFilename;
    } catch (fileError: any) {
      console.error("Error saving budget file:", fileError);
      return { success: false, error: `Error al guardar archivo de presupuesto: ${fileError.message}` };
    }
  }
  
  const finalIndex = customers.findIndex(c => c.id === customerId);
  if (finalIndex !== -1) customers[finalIndex] = customerToSave as Customer;
  
  await writeCustomersFile(customers);
  return { success: true, id: customerId, customer: customerToSave as Customer };
}


export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  let customers = await readCustomersFile();
  const customerToDelete = customers.find(c => c.id === id);
  const initialLength = customers.length;
  customers = customers.filter(c => c.id !== id);

  if (customers.length === initialLength) {
    return { success: false, error: `Cliente con ID ${id} no encontrado para eliminar.` };
  }

  if (customerToDelete?.contractFileName) {
    try {
      await fs.unlink(path.join(contractsDirectoryPath, customerToDelete.contractFileName));
    } catch (fileError: any) {
      console.warn(`Error deleting contract file ${customerToDelete.contractFileName}:`, fileError.message);
    }
  }
  if (customerToDelete?.budgetFileName) { 
    try {
      await fs.unlink(path.join(budgetsDirectoryPath, customerToDelete.budgetFileName));
    } catch (fileError: any) {
      console.warn(`Error deleting budget file ${customerToDelete.budgetFileName}:`, fileError.message);
    }
  }

  await writeCustomersFile(customers);
  return { success: true };
}

export async function getContractFilePath(filename: string): Promise<string | null> {
  const filePath = path.join(contractsDirectoryPath, filename);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export async function getBudgetFilePath(filename: string): Promise<string | null> {
  const filePath = path.join(budgetsDirectoryPath, filename);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

    