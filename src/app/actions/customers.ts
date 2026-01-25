
'use server';

import type { Customer, CustomerStatus } from '@/types/customer';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';
import { createNewFiestaForCustomer } from './fiesta/fiesta.actions';

const CUSTOMERS_FILE = 'customers.json';
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONTRACTS_DIR_NAME = 'contracts';
const BUDGETS_DIR_NAME = 'budgets'; 
const SALON_CONTRACTS_DIR_NAME = 'salon-contracts';
const contractsDirectoryPath = path.join(DATA_DIR, CONTRACTS_DIR_NAME);
const budgetsDirectoryPath = path.join(DATA_DIR, BUDGETS_DIR_NAME); 
const salonContractsDirectoryPath = path.join(DATA_DIR, SALON_CONTRACTS_DIR_NAME);


async function ensureSubdirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}
ensureSubdirectoryExists(contractsDirectoryPath);
ensureSubdirectoryExists(budgetsDirectoryPath);
ensureSubdirectoryExists(salonContractsDirectoryPath);


export async function getCustomers(): Promise<Customer[]> {
  return readData<Customer[]>(CUSTOMERS_FILE, []);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await getCustomers();
  return customers.find(c => c.id === id) || null;
}

export async function saveCustomer(
  customerData: Omit<Customer, 'id'> | Customer | FormData
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  let customers = await getCustomers();
  let customerId: string;
  let customerToSave: Partial<Customer> = {}; 
  let isNewCustomer = false;

  let contractFile: File | null = null;
  let budgetFile: File | null = null; 
  let salonContractFile: File | null = null;

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
    salonContractFile = customerData.get('salonContract') as File | null;

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
      salonContractFileName: salonContractFile ? undefined : (customerToSave.salonContractFileName || existingCustomer.salonContractFileName),
    };
    customerToSave = customers[index]; 
  } else { // Create
    isNewCustomer = true;
    customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCustomerBase: Omit<Customer, 'id'> = {
        ...(customerToSave as Omit<Customer, 'id'>), 
        name: customerToSave.name || customerToSave.companyName || 'Sin Nombre Asignado',
        estadoCliente: customerToSave.estadoCliente || 'Actual',
    };
    const newCustomerWithId = {
      ...newCustomerBase,
      id: customerId,
      name: newCustomerBase.name || newCustomerBase.companyName || '', // Ensure name is set on creation
    };
    customers.push(newCustomerWithId);
    customerToSave = newCustomerWithId;
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
  
  if (salonContractFile && salonContractFile.size > 0) {
    try {
      if (salonContractFile.type !== 'application/pdf') {
        throw new Error('El contrato del salón debe ser un archivo PDF.');
      }
      await ensureSubdirectoryExists(salonContractsDirectoryPath);
      const bytes = await salonContractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `salon_contract_${customerId}_${Date.now()}_${salonContractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(salonContractsDirectoryPath, uniqueFilename), buffer);
      (customerToSave as Customer).salonContractFileName = uniqueFilename;
    } catch (fileError: any) {
      console.error("Error saving salon contract file:", fileError);
      return { success: false, error: `Error al guardar archivo de contrato del salón: ${fileError.message}` };
    }
  }
  
  const finalIndex = customers.findIndex(c => c.id === customerId);
  if (finalIndex !== -1) customers[finalIndex] = customerToSave as Customer;
  
  await writeData(CUSTOMERS_FILE, customers, (a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));

  if (isNewCustomer) {
    try {
      await createNewFiestaForCustomer(customerToSave as Customer);
    } catch (e: any) {
      // Don't fail the whole operation if fiesta creation fails, but log it.
      console.warn(`Customer ${customerId} created, but failed to create associated event: ${e.message}`);
    }
  }
  
  return { success: true, id: customerId, customer: customerToSave as Customer };
}


export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  let customers = await getCustomers();
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
  if (customerToDelete?.salonContractFileName) { 
    try {
      await fs.unlink(path.join(salonContractsDirectoryPath, customerToDelete.salonContractFileName));
    } catch (fileError: any) {
      console.warn(`Error deleting salon contract file ${customerToDelete.salonContractFileName}:`, fileError.message);
    }
  }

  await writeData(CUSTOMERS_FILE, customers);
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

export async function getSalonContractFilePath(filename: string): Promise<string | null> {
  const filePath = path.join(salonContractsDirectoryPath, filename);
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

export async function addDocumentReferenceToCustomer(customerId: string, documentType: 'contract' | 'budget' | 'salonContract', filename: string): Promise<{ success: boolean, error?: string}> {
    const customers = await getCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
        return { success: false, error: `Cliente con ID ${customerId} no encontrado.` };
    }

    if(documentType === 'contract') {
        customers[customerIndex].contractFileName = filename;
    } else if (documentType === 'budget') {
        customers[customerIndex].budgetFileName = filename;
    } else if (documentType === 'salonContract') {
        customers[customerIndex].salonContractFileName = filename;
    }


    await writeData(CUSTOMERS_FILE, customers);
    return { success: true };
}

    

    

    