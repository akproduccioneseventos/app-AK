
'use server';

import type { Customer } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, 'customers.json');

// Helper function to ensure data directory exists
async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para clientes:', error);
  }
}

// Helper function to read customers from JSON file
async function readCustomersFile(): Promise<Customer[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(customersFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with an empty array or initial data
      // For now, let's start with an empty array if not found.
      // The initial data is now in customers.json directly.
      await writeCustomersFile([]);
      return [];
    }
    console.error('Error leyendo el archivo de clientes, devolviendo array vacío:', error);
    return [];
  }
}

// Helper function to write customers to JSON file
async function writeCustomersFile(data: Customer[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(customersFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de clientes:', error);
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const customers = await readCustomersFile();
  return customers.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await readCustomersFile();
  const customer = customers.find(c => c.id === id);
  return customer ? { ...customer } : null;
}

export async function saveCustomer(
  customerData: Omit<Customer, 'id'> | Customer
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  let customers = await readCustomersFile();
  
  if ('id' in customerData && customerData.id) {
    // Update existing customer
    const index = customers.findIndex(c => c.id === customerData.id);
    if (index !== -1) {
      customers[index] = { 
        ...customers[index], 
        ...customerData, 
      };
      await writeCustomersFile(customers);
      return { success: true, id: customerData.id, customer: { ...customers[index] } };
    } else {
      return { success: false, error: `Cliente con ID ${customerData.id} no encontrado para actualizar.` };
    }
  } else {
    // Create new customer
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customerData.name || customerData.companyName || 'Sin Nombre Asignado', // Ensure name is set
    };
    customers.push(newCustomer);
    await writeCustomersFile(customers);
    return { success: true, id: newCustomer.id, customer: { ...newCustomer } };
  }
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  let customers = await readCustomersFile();
  const initialLength = customers.length;
  customers = customers.filter(c => c.id !== id);
  
  if (customers.length < initialLength) {
    await writeCustomersFile(customers);
    return { success: true };
  } else {
    return { success: false, error: `Cliente con ID ${id} no encontrado para eliminar.` };
  }
}

// Ensure the customers.json file exists with initial data if it's missing
async function initializeCustomerData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(customersFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo customers.json no encontrado, creando con datos iniciales...');
            // If you have a predefined initial list, you can place it here.
            // For now, it will be created empty by readCustomersFile if it's the first run.
            // Or, if you want to ensure src/data/customers.json is used as is:
            // const initialData = [] // or load from a static source if you prefer
            // await writeCustomersFile(initialData);
            // The customers.json is now manually created with the list.
        }
    }
}

initializeCustomerData();
