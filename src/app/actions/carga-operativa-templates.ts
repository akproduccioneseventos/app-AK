
'use server';

import type { CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';

export interface CargaOperativaTemplateItem {
  name: string;
  quantity: string;
  unit?: string;
}

export interface CargaOperativaTemplateCategory {
  name: string;
  items: CargaOperativaTemplateItem[];
}

export interface CargaOperativaTemplate {
  id: string;
  name: string;
  categories: CargaOperativaTemplateCategory[];
}

const TEMPLATES_FILE = 'carga-operativa-templates.json';

export async function getCargaOperativaTemplates(): Promise<CargaOperativaTemplate[]> {
  return readData<CargaOperativaTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveCargaOperativaTemplate(
    templateData: Omit<CargaOperativaTemplate, 'id'>
): Promise<{ success: boolean; template?: CargaOperativaTemplate; error?: string }> {
  if (!templateData.name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }
  const templates = await getCargaOperativaTemplates();
  const newTemplate: CargaOperativaTemplate = {
    id: `tpl_carga_${Date.now()}`,
    ...templateData
  };
  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates, (a, b) => a.name.localeCompare(b.name));
  return { success: true, template: newTemplate };
}

export async function deleteCargaOperativaTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await getCargaOperativaTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
