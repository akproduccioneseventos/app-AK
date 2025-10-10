/**
 * @fileOverview A centralized service for reading and writing data files.
 * This service ensures that file operations are consistent and provides a single point of entry
 * for all data persistence, preventing race conditions and simplifying actions.
 */
'use server';

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

/**
 * Ensures a file exists at the given path. If not, it creates it with default content.
 * @param filePath The absolute path to the file.
 * @param defaultContent The content to write if the file doesn't exist.
 */
async function ensureFile(filePath: string, defaultContent: string = '[]'): Promise<void> {
  try {
    await fs.access(path.dirname(filePath));
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, defaultContent, 'utf-8');
  }
}

/**
 * Reads and parses a JSON file.
 * @param filePath The relative path from the 'src/data' directory.
 * @param defaultValue The default value to return if the file is empty or doesn't exist.
 * @returns The parsed JSON data or the default value.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath, JSON.stringify(defaultValue, null, 2));
  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    // If the file is empty, return the default value to prevent JSON.parse error
    if (fileContent.trim() === '') {
      return defaultValue;
    }
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error reading or parsing ${absolutePath}, returning default value.`, error);
    // Attempt to fix the file by writing the default value back.
    await fs.writeFile(absolutePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file.
 * @param filePath The relative path from the 'src/data' directory.
 * @param data The data to write.
 * @param sortFn An optional function to sort the data before writing.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath);
  let dataToWrite = data;
  if (Array.isArray(dataToWrite) && sortFn) {
    dataToWrite.sort(sortFn);
  }
  await fs.writeFile(absolutePath, JSON.stringify(dataToWrite, null, 2), 'utf-8');
}
