
'use server';

import type { ProgramaEventoItem } from '@/types/fiesta';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const TEMPLATES_FILE_PATH = path.join(DATA_DIR, 'itinerary-templates.json');

export interface ItineraryTemplate {
  id: string;
  name: string;
  items: ProgramaEventoItem[];
}

async function ensureDataFileExists() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(TEMPLATES_FILE_PATH);
  } catch {
    await fs.writeFile(TEMPLATES_FILE_PATH, '[]', 'utf-8');
  }
}

async function readTemplatesFile(): Promise<ItineraryTemplate[]> {
  await ensureDataFileExists();
  const fileContent = await fs.readFile(TEMPLATES_FILE_PATH, 'utf-8');
  return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
}

async function writeTemplatesFile(data: ItineraryTemplate[]): Promise<void> {
  await ensureDataFileExists();
  const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(TEMPLATES_FILE_PATH, JSON.stringify(sortedData, null, 2), 'utf-8');
}

export async function getItineraryTemplates(): Promise<ItineraryTemplate[]> {
  return readTemplatesFile();
}

export async function saveItineraryTemplate(name: string, items: ProgramaEventoItem[]): Promise<{ success: boolean; template?: ItineraryTemplate; error?: string }> {
  if (!name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }
  const templates = await readTemplatesFile();
  const newTemplate: ItineraryTemplate = {
    id: `template_${Date.now()}`,
    name: name.trim(),
    items: items.map(item => ({...item, id: `item_${Date.now()}_${Math.random()}`})) // Give new IDs to avoid key conflicts
  };
  templates.push(newTemplate);
  await writeTemplatesFile(templates);
  return { success: true, template: newTemplate };
}

export async function deleteItineraryTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await readTemplatesFile();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeTemplatesFile(templates);
  return { success: true };
}
