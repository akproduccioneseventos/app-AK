

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
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

export async function initializeEventsForAllCustomers(): Promise<{ success: boolean; created: number; errors: number }> {
  await ensureFiestasDirectoryExists();
  const customers = await readCustomersFile();
  let createdCount = 0;
  let errorCount = 0;

  for (const customer of customers) {
    const fiestaId = `fiesta_${customer.id}`;
    const fiestaPath = path.join(FIESTAS_DIR, `${fiestaId}.json`);

    try {
      await fs.access(fiestaPath);
      // Fiesta file already exists, do nothing.
    } catch (error) {
      // Fiesta file does not exist, create it.
      const newFiesta: FiestaEnPlanificacion = {
        ...initialFiestaActualData,
        id: fiestaId,
        configuracion: {
          ...initialFiestaActualData.configuracion,
          clienteId: customer.id,
          nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
          fechaEvento: customer.partyDate || new Date().toISOString(),
          invitadosEstimados: customer.guestCount || 50,
          nombreLugar: customer.venueName || 'A definir',
        },
      };
      await fs.writeFile(fiestaPath, JSON.stringify(newFiesta, null, 2), 'utf-8');
      createdCount++;
    }
  }
  return { success: true, created: createdCount, errors: errorCount };
}
