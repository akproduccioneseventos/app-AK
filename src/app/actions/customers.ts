
'use server';

import type { Customer, CustomerStatus } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';
import { getFiestas } from './fiesta-actual';

const CLIENTES_COLLECTION_JSON = 'customers.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, CLIENTES_COLLECTION_JSON);

const CONTRACTS_DIR_NAME = 'contracts';
const BUDGETS_DIR_NAME = 'budgets'; 
const contractsDirectoryPath = path.join(dataDirectory, CONTRACTS_DIR_NAME);
const budgetsDirectoryPath = path.join(dataDirectory, BUDGETS_DIR_NAME); 

async function ensureDataFileExists(filePath: string, defaultContent: string = '[]') {
    try {
        await fs.access(dataDirectory);
    } catch {
        await fs.mkdir(dataDirectory, { recursive: true });
    }
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, defaultContent, 'utf-8');
    }
}

async function ensureSubdirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}


async function readCustomersFile(): Promise<Customer[]> {
  await ensureDataFileExists(customersFilePath, '[]');
  try {
    const fileContent = await fs.readFile(customersFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Customer[];
  } catch (error) {
    console.error('Error reading customers file, returning empty array:', error);
    return [];
  }
}

async function writeCustomersFile(data: Customer[]): Promise<void> {
  await ensureDataFileExists(customersFilePath, '[]');
  const sortedData = data.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
  await fs.writeFile(customersFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
}

async function initializeLocalCustomersFile() {
  await readCustomersFile();
  await ensureSubdirectoryExists(contractsDirectoryPath);
  await ensureSubdirectoryExists(budgetsDirectoryPath);
}
initializeLocalCustomersFile();


export async function getCustomers(): Promise<Customer[]> {
  const [customers, fiestas] = await Promise.all([
    readCustomersFile(),
    getFiestas(true) // includeArchived = true
  ]);

  const now = new Date();

  return customers.map(customer => {
    const customerFiestas = fiestas.filter(f => f.configuracion.clienteId === customer.id);
    const hasFutureEvent = customerFiestas.some(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now);
    
    // Si tiene un evento futuro, es 'Actual'. Si no, es 'Antiguo'.
    const calculatedStatus: CustomerStatus = hasFutureEvent ? 'Actual' : 'Antiguo';

    // Prioritize calculated status, but keep saved status if no events are found
    const finalStatus = customerFiestas.length > 0 ? calculatedStatus : (customer.estadoCliente || 'Antiguo');

    // Find the nearest upcoming event date for sorting purposes.
    const upcomingEvents = customerFiestas
        .filter(f => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= now)
        .sort((a, b) => new Date(a.configuracion.fechaEvento!).getTime() - new Date(b.configuracion.fechaEvento!).getTime());

    return { 
      ...customer, 
      estadoCliente: finalStatus,
      // Add the date of the next event to the customer object for sorting on the frontend
      partyDate: upcomingEvents.length > 0 ? upcomingEvents[0].configuracion.fechaEvento : customer.partyDate
    };
  });
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
  let customerToSave: Partial<Customer> = {}; 

  let contractFile: File | null = null;
  let budgetFile: File | null = null;

  if (customerData instanceof FormData) {
    customerToSave.name = customerData.get('name') as string;
    customerToSave.companyName = customerData.get('companyName') as string | undefined;
    customerToSave.phone = customerData.get('phone') as string | undefined;
    customerToSave.taxId = customerData.get('taxId') as string | undefined;
    
    customerToSave.partyDate = customerData.get('partyDate') as string | undefined;
    customerToSave.partyTime = customerData.get('partyTime') as string | undefined;
    customerToSave.partyType = customerData.get('partyType') as string | undefined;
    customerToSave.partyForWhom = customerData.get('partyForWhom') as string | undefined;
    const guestCountStr = customerData.get('guestCount') as string | undefined;
    customerToSave.guestCount = guestCountStr ? parseInt(guestCountStr, 10) : undefined;
    customerToSave.venueName = customerData.get('venueName') as string | undefined;

    contractFile = customerData.get('contract') as File | null;
    budgetFile = customerData.get('budget') as File | null; 

    const formId = customerData.get('id') as string | undefined;
    if (formId) customerToSave.id = formId;

    const estadoClienteForm = customerData.get('estadoCliente') as CustomerStatus | undefined;
    if(estadoClienteForm) customerToSave.estadoCliente = estadoClienteForm;

  } else {
    customerToSave = { ...customerData };
  }

  if (!customerToSave.name?.trim() && !customerToSave.companyName?.trim()) {
    return { success: false, error: 'El nombre del cliente o de la empresa es obligatorio.' };
  }
  
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
    };
    customerToSave = customers[index]; 
  } else { // Create
    customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCustomerBase: Omit<Customer, 'id'> = {
        ...(customerToSave as Omit<Customer, 'id'>), 
        name: customerToSave.name || customerToSave.companyName || 'Sin Nombre Asignado',
        estadoCliente: customerToSave.estadoCliente || 'Actual',
    };
    customers.push({
      ...newCustomerBase,
      id: customerId,
    });
    customerToSave = customers[customers.length - 1];
  }
  
  if (contractFile && contractFile.size > 0) {
    try {
      if (contractFile.type !== 'application/pdf') {
        throw new Error('El contrato debe ser un archivo PDF.');
      }
      await ensureSubdirectoryExists(contractsDirectoryPath);
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

  if (budgetFile && budgetFile.size > 0) {
    try {
       if (budgetFile.type !== 'application/pdf') {
        throw new Error('El presupuesto debe ser un archivo PDF.');
      }
      await ensureSubdirectoryExists(budgetsDirectoryPath);
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

export async function syncCustomerFromFiestaConfig(
  customerId: string,
  config: Partial<import('@/types/fiesta').ConfigEventoDataStorage>
): Promise<{ success: boolean; error?: string }> {
  const customerToUpdate = await getCustomerById(customerId);
  if (!customerToUpdate) {
    return { success: false, error: `Customer with ID ${customerId} not found for sync.` };
  }

  let updated = false;

  const newPartyDateISO = config.fechaEvento ? new Date(config.fechaEvento).toISOString() : undefined;
  if (newPartyDateISO && customerToUpdate.partyDate !== newPartyDateISO) {
      customerToUpdate.partyDate = newPartyDateISO;
      updated = true;
  }
  
  let partyTimeStr = '';
  if (config.horaInicio) partyTimeStr += config.horaInicio;
  if (config.horaFin) partyTimeStr += ` - ${config.horaFin}`;
  if (partyTimeStr && customerToUpdate.partyTime !== partyTimeStr) {
      customerToUpdate.partyTime = partyTimeStr;
      updated = true;
  }

  if(config.tipoCelebracion && customerToUpdate.partyType !== config.tipoCelebracion) {
    customerToUpdate.partyType = config.tipoCelebracion;
    updated = true;
  }
  
  const newGuestCount = config.invitadosEstimados !== undefined ? Number(config.invitadosEstimados) : undefined;
  if(newGuestCount !== undefined && customerToUpdate.guestCount !== newGuestCount) {
    customerToUpdate.guestCount = newGuestCount;
    updated = true;
  }

  if(config.nombreLugar && customerToUpdate.venueName !== config.nombreLugar) {
    customerToUpdate.venueName = config.nombreLugar;
    updated = true;
  }

  if (updated) {
    const saveResult = await saveCustomer(customerToUpdate);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error || "Failed to save synced customer data." };
    }
  }
  
  return { success: true };
}

export async function addDocumentReferenceToCustomer(customerId: string, documentType: 'contract' | 'budget', filename: string): Promise<{ success: boolean, error?: string}> {
    const customers = await readCustomersFile();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
        return { success: false, error: `Cliente con ID ${customerId} no encontrado.` };
    }

    if(documentType === 'contract') {
        customers[customerIndex].contractFileName = filename;
    } else if (documentType === 'budget') {
        customers[customerIndex].budgetFileName = filename;
    }

    await writeCustomersFile(customers);
    return { success: true };
}
