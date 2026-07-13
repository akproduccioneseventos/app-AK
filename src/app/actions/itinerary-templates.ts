
'use server';

import type { ItineraryTemplate, ProgramaEventoItem } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const TEMPLATES_FILE = 'itinerary-templates.json';

export async function getItineraryTemplates(): Promise<ItineraryTemplate[]> {
  return readData<ItineraryTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveItineraryTemplate(name: string, items: ProgramaEventoItem[]): Promise<{ success: boolean; template?: ItineraryTemplate; error?: string }> {
  await requireAppSession();
  if (!name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }
  const templates = await getItineraryTemplates();
  const newTemplate: ItineraryTemplate = {
    id: `template_${Date.now()}`,
    name: name.trim(),
    items: items.map(item => ({...item, id: `item_${Date.now()}_${Math.random()}`}))
  };
  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates, (a, b) => a.name.localeCompare(b.name));
  return { success: true, template: newTemplate };
}

export async function deleteItineraryTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  let templates = await getItineraryTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
