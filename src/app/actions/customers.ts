
'use server';

import type { Customer, SalesFunnelStage, CustomerStatus } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';
import { getFiestaActual } from '@/app/actions/fiesta-actual'; // Importar para obtener la fiesta actual

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
    return Array.isArray(data) ? data.map(c => ({
        ...c, 
        salesFunnelStage: c.salesFunnelStage || 'Lead',
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
  let customers = await readCustomersFile();
  let hasChanges = false;

  try {
    const fiestaActual = await getFiestaActual();
    const clienteIdFiestaActual = fiestaActual?.configuracion?.clienteId;
    const fechaEventoFiestaActual = fiestaActual?.configuracion?.fechaEvento;

    if (clienteIdFiestaActual && fechaEventoFiestaActual) {
      const eventDate = new Date(fechaEventoFiestaActual);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to the beginning of today for comparison

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
    // No bloqueamos la devolución de clientes si esta lógica falla
  }
  
  return customers.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await readCustomersFile(); // Usamos readCustomersFile para consistencia de datos por defecto
  const customer = customers.find(c => c.id === id);
  return customer ? { 
    ...customer, 
    salesFunnelStage: customer.salesFunnelStage || 'Lead', // Asegurar default
    estadoCliente: customer.estadoCliente || 'Actual'  // Asegurar default
  } : null;
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
        salesFunnelStage: customerData.salesFunnelStage || customers[index].salesFunnelStage || 'Lead',
        estadoCliente: customerData.estadoCliente || customers[index].estadoCliente || 'Actual',
      };
      await writeCustomersFile(customers);
      return { success: true, id: customerData.id, customer: { ...customers[index] } };
    } else {
      return { success: false, error: `Cliente con ID ${customerData.id} no encontrado para actualizar.` };
    }
  } else {
    // Create new customer
    const newCustomer: Customer = {
      ...(customerData as Omit<Customer, 'id'>), // Type assertion for new customer data
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customerData.name || customerData.companyName || 'Sin Nombre Asignado', // Ensure name is set
      salesFunnelStage: customerData.salesFunnelStage || 'Lead',
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

// Ensure the customers.json file exists with initial data if it's missing
async function initializeCustomerData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(customersFilePath);
        // Ensure existing customers have default fields if missing
        const currentCustomers = await readCustomersFile();
        let wasModified = false;
        const updatedCustomers = currentCustomers.map(c => {
            let customerModified = false;
            if (!c.salesFunnelStage) {
                c.salesFunnelStage = 'Lead';
                customerModified = true;
            }
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
            // If the file doesn't exist, readCustomersFile will create it with an empty array
            // or the initial mock data if that logic was present.
            // Here, we ensure that if it's created empty, it respects defaults.
            await readCustomersFile(); 
        }
    }
}

initializeCustomerData();
