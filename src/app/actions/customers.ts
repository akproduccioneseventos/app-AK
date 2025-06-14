
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
const contractsDirectoryPath = path.join(dataDirectory, CONTRACTS_DIR_NAME);

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
ensureContractsDirectoryExists(); // Ensure contracts directory also exists on module load

export async function getCustomers(): Promise<Customer[]> {
  // console.log("Firebase is disabled. Reading customers from JSON.");
  let customers = await readCustomersFile();
  customers = customers.map(c => ({ ...c, estadoCliente: c.estadoCliente || 'Actual' }));
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
  customerData: Omit<Customer, 'id'> | Customer | FormData
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  let customers = await readCustomersFile();
  let customerId: string;
  let customerToSave: Customer;

  let contractFile: File | null = null;
  let inputData: Partial<Omit<Customer, 'id'>> = {};

  if (customerData instanceof FormData) {
    contractFile = customerData.get('contract') as File | null;
    inputData.name = customerData.get('name') as string;
    inputData.companyName = customerData.get('companyName') as string | undefined;
    inputData.phone = customerData.get('phone') as string | undefined;
    inputData.taxId = customerData.get('taxId') as string | undefined;
    inputData.email = customerData.get('email') as string | undefined;
    const street = customerData.get('street') as string | undefined;
    if (street) {
      inputData.address = { street };
    }
    // ID might be passed in FormData for updates, but we are not using it here for simplicity
    // For new customers, ID is generated. For updates, assume customerData is Customer object.
  } else {
    // If it's an object, it might be a new customer or an update
    inputData = { ...customerData };
  }

  if (inputData.id) { // Update
    customerId = inputData.id;
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) {
      return { success: false, error: `Cliente con ID ${customerId} no encontrado.` };
    }
    const existingCustomer = customers[index];
    customerToSave = {
      ...existingCustomer,
      ...inputData,
      name: inputData.name || inputData.companyName || existingCustomer.name || 'Sin Nombre Asignado',
      estadoCliente: inputData.estadoCliente || existingCustomer.estadoCliente || 'Actual',
      // contractFileName is preserved from existing if not overwritten by new upload
      contractFileName: inputData.contractFileName || existingCustomer.contractFileName,
    };
    customers[index] = customerToSave;
  } else { // Create
    customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    customerToSave = {
      ...(inputData as Omit<Customer, 'id'>), // Cast to exclude id for new customer base
      id: customerId,
      name: inputData.name || inputData.companyName || 'Sin Nombre Asignado',
      estadoCliente: inputData.estadoCliente || 'Actual',
    };
    customers.push(customerToSave);
  }

  if (contractFile) {
    try {
      await ensureContractsDirectoryExists();
      const bytes = await contractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `contract_${customerId}_${Date.now()}_${contractFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      await fs.writeFile(path.join(contractsDirectoryPath, uniqueFilename), buffer);
      customerToSave.contractFileName = uniqueFilename;
      // If updating, need to update the customer in the array again with the filename
      const index = customers.findIndex(c => c.id === customerId);
      if (index !== -1) customers[index] = customerToSave;

    } catch (fileError: any) {
      console.error("Error saving contract file:", fileError);
      // Decide if this should be a hard error or just a warning
      return { success: false, id: customerId, customer: customerToSave, error: `Cliente guardado, pero error al guardar contrato: ${fileError.message}` };
    }
  }
  
  await writeCustomersFile(customers);
  return { success: true, id: customerId, customer: customerToSave };
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
      // Non-critical error, proceed with deleting customer record
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
