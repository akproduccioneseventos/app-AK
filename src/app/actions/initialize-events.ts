

'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const customersFilePath = path.join(dataDirectory, 'customers.json');
const FIESTAS_DIR = path.join(dataDirectory, 'fiestas');

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

async function ensureFiestasDirectoryExists() {
  try {
    await fs.access(FIESTAS_DIR);
  } catch {
    await fs.mkdir(FIESTAS_DIR, { recursive: true });
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

export async function initializeEventsFromCustomers(): Promise<{ success: boolean; createdCount: number; error?: string }> {
  try {
    await ensureFiestasDirectoryExists();
    const customers = await readCustomersFile();
    const activeCustomers = customers.filter(c => c.estadoCliente === 'Actual');
    let createdCount = 0;

    for (const customer of activeCustomers) {
      const fiestaFilePath = path.join(FIESTAS_DIR, `fiesta_${customer.id}.json`);
      try {
        await fs.access(fiestaFilePath);
        // File exists, skip creation
      } catch {
        // File does not exist, create it
        const newFiesta: FiestaEnPlanificacion = {
          ...initialFiestaActualData, // Start with a clean slate
          id: `fiesta_${customer.id}`, // Link to customer
          configuracion: {
            ...initialFiestaActualData.configuracion,
            clienteId: customer.id,
            nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
            fechaEvento: customer.partyDate,
            invitadosEstimados: customer.guestCount || 50,
            nombreLugar: customer.venueName || 'A definir',
          },
        };
        await fs.writeFile(fiestaFilePath, JSON.stringify(newFiesta, null, 2), 'utf-8');
        createdCount++;
      }
    }
    return { success: true, createdCount };
  } catch (error: any) {
    console.error("Error initializing events from customers:", error);
    return { success: false, createdCount: 0, error: error.message };
  }
}
