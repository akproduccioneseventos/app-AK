

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
  await ensureDataFileExists(customersFilePath, '[]'