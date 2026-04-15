/**
 * @fileOverview A centralized service for reading and writing data.
 * Firestore is the single source of truth for all environments.
 */
'use server';

import { syncToFirestore, readFromFirestore } from './firebase-sync';
import * as logger from './logger';

/**
 * Reads data from Firestore. Returns defaultValue if not found or on error.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await readFromFirestore(filePath);
    if (data !== null && data !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(data)) return defaultValue;
      return data as T;
    }
  } catch (e) {
    logger.error(`[readData] Error leyendo ${filePath} desde Firestore:`, e);
  }
  return defaultValue;
}

/**
 * Writes data to Firestore. Throws on failure.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  let dataToWrite: T = data;
  if (Array.isArray(data) && sortFn) {
    dataToWrite = [...data].sort(sortFn) as unknown as T;
  }
  try {
    await syncToFirestore(normalizedFilePath, dataToWrite);
  } catch (err) {
    logger.error(`[writeData] Error escribiendo ${filePath} en Firestore:`, err);
    throw new Error(`Error al guardar datos: ${err instanceof Error ? err.message : err}`);
  }
}
