'use server';

import {
  readData as readDataFromStore,
  writeData as writeDataToStore,
  type WriteDataOptions,
} from './data-service';

// Unified: all data operations go through the main data-service which handles
// JSON persistence, server-cache, and optional Firestore dual-write.
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  return readDataFromStore(filePath, defaultValue);
}

export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number,
  options?: WriteDataOptions
): Promise<void> {
  return writeDataToStore(filePath, data, sortFn, options);
}
