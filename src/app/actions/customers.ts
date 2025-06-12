
'use server';

import type { Customer, CustomerStatus } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, 'customers.json');

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para clientes:', error);
  }
}

async function readCustomersFile(): Promise<Customer[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(customersFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data.map(c => ({
        ...c, 
        estadoCliente: c.estadoCliente || 'Actual' 
    })) : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeCustomersFile([]);
      return [];
    }
    console.error('Error leyendo el archivo de clientes, devolviendo array vacío:', error);
    return [];
  }
}

async function writeCustomersFile(data: Customer[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(customersFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de clientes:', error);
  }
}

export async function getCustomers(): Promise<Customer[]> {
  let customers = await readCustomersFile();
  let hasChanges = false;

  try {
    const fiestaActual = await getFiestaActual();
    const clienteIdFiestaActual = fiestaActual?.configuracion?.clienteId;
    const fechaEventoFiestaActual = fiestaActual?.configuracion?.fechaEvento;

    if (clienteIdFiestaActual && fechaEventoFiestaActual) {
      const eventDate = new Date(fechaEventoFiestaActual);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 

      customers = customers.map(customer => {
        if (customer.id === clienteIdFiestaActual && customer.estadoCliente === 'Actual') {
          if (eventDate < today) {
            customer.estadoCliente = 'Antiguo';
            hasChanges = true;
          }
        }
        return customer;
      });

      if (hasChanges) {
        await writeCustomersFile(customers);
      }
    }
  } catch (error) {
    console.error("Error al procesar la actualización automática del estado del cliente:", error);
  }
  
  return customers.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await readCustomersFile();
  const customer = customers.find(c => c.id === id);
  return customer ? { 
    ...customer, 
    estadoCliente: customer.estadoCliente || 'Actual'
  } : null;
}

export async function saveCustomer(
  customerData: Omit<Customer, 'id'> | Customer
): Promise<{ success: boolean; id?: string; customer?: Customer; error?: string }> {
  let customers = await readCustomersFile();
  
  if ('id' in customerData && customerData.id) {
    const index = customers.findIndex(c => c.id === customerData.id);
    if (index !== -1) {
      customers[index] = { 
        ...customers[index], 
        ...customerData,
        estadoCliente: customerData.estadoCliente || customers[index].estadoCliente || 'Actual',
      };
      await writeCustomersFile(customers);
      return { success: true, id: customerData.id, customer: { ...customers[index] } };
    } else {
      const newCustomerFromUpdate: Customer = {
        ...(customerData as Customer), 
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: customerData.name || customerData.companyName || 'Sin Nombre Asignado',
        estadoCliente: customerData.estadoCliente || 'Actual',
      };
      customers.push(newCustomerFromUpdate);
      await writeCustomersFile(customers);
      return { success: true, id: newCustomerFromUpdate.id, customer: { ...newCustomerFromUpdate } };
    }
  } else {
    // Crear nuevo cliente
    const newCustomer: Customer = {
      ...(customerData as Omit<Customer, 'id'>),
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customerData.name || customerData.companyName || 'Sin Nombre Asignado',
      estadoCliente: customerData.estadoCliente || 'Actual',
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

async function initializeCustomerData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(customersFilePath);
        const currentCustomers = await readCustomersFile();
        let wasModified = false;
        const updatedCustomers = currentCustomers.map(c => {
            let customerModified = false;
            if (!c.estadoCliente) {
                c.estadoCliente = 'Actual';
                customerModified = true;
            }
            if (customerModified) wasModified = true;
            return c;
        });
        if (wasModified) {
            await writeCustomersFile(updatedCustomers);
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo customers.json no encontrado, creando con datos iniciales...');
            await readCustomersFile(); 
        }
    }
}

initializeCustomerData();
