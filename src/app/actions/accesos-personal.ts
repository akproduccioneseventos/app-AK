
'use server';

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type ModuloPermiso = 'musica' | 'itinerario' | 'carga-operativa' | 'decoracion';

export interface AccesoPersonal {
  id: string; // Token único y secreto
  nombreAcceso: string; // Ej: "Acceso DJ", "Acceso Decoradora"
  fiestaId: string;
  permisos: ModuloPermiso[];
  fechaCreacion: string; // ISO Date String
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ACCESOS_FILE_PATH = path.join(DATA_DIR, 'accesos-personal.json');

async function ensureDataFileExists() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
  try { await fs.access(ACCESOS_FILE_PATH); } catch { await fs.writeFile(ACCESOS_FILE_PATH, '[]', 'utf-8'); }
}

async function readAccesosFile(): Promise<AccesoPersonal[]> {
  await ensureDataFileExists();
  const fileContent = await fs.readFile(ACCESOS_FILE_PATH, 'utf-8');
  return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
}

async function writeAccesosFile(data: AccesoPersonal[]): Promise<void> {
  await ensureDataFileExists();
  await fs.writeFile(ACCESOS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function createAccesoPersonal(
  data: Omit<AccesoPersonal, 'id' | 'fechaCreacion'>
): Promise<{ success: boolean; acceso?: AccesoPersonal; error?: string }> {
  if (!data.nombreAcceso.trim() || !data.fiestaId || data.permisos.length === 0) {
    return { success: false, error: "Faltan datos para crear el acceso." };
  }
  const accesos = await readAccesosFile();
  const newAcceso: AccesoPersonal = {
    ...data,
    id: randomUUID(), // Genera un token seguro y único
    fechaCreacion: new Date().toISOString(),
  };
  accesos.push(newAcceso);
  await writeAccesosFile(accesos);
  return { success: true, acceso: newAcceso };
}

export async function getAccesosByFiestaId(fiestaId: string): Promise<AccesoPersonal[]> {
  const accesos = await readAccesosFile();
  return accesos.filter(a => a.fiestaId === fiestaId);
}

export async function getAccesoById(tokenId: string): Promise<AccesoPersonal | null> {
    const accesos = await readAccesosFile();
    return accesos.find(a => a.id === tokenId) || null;
}

export async function deleteAccesoPersonal(tokenId: string): Promise<{ success: boolean; error?: string }> {
  let accesos = await readAccesosFile();
  const initialLength = accesos.length;
  accesos = accesos.filter(a => a.id !== tokenId);
  if (accesos.length === initialLength) {
    return { success: false, error: "No se encontró el acceso para eliminar." };
  }
  await writeAccesosFile(accesos);
  return { success: true };
}
