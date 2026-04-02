'use server';

import { readData, writeData } from '@/lib/data-service';
import type { MarketingTemplate, ChecklistItem, MarketingData } from '@/types/marketing';

const TEMPLATES_FILE = 'marketing-templates.json';
const CHECKLIST_FILE = 'marketing-checklist.json';

// --- Templates ---

export async function getMarketingTemplates(): Promise<MarketingTemplate[]> {
  return readData<MarketingTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveMarketingTemplate(
  template: MarketingTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    const templates = await getMarketingTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.unshift({ ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await writeData(TEMPLATES_FILE, templates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar plantilla.' };
  }
}

export async function deleteMarketingTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const templates = await getMarketingTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await writeData(TEMPLATES_FILE, filtered);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar plantilla.' };
  }
}

// --- Checklist ---

export async function getMarketingChecklist(): Promise<ChecklistItem[]> {
  return readData<ChecklistItem[]>(CHECKLIST_FILE, []);
}

export async function saveMarketingChecklist(
  items: ChecklistItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await writeData(CHECKLIST_FILE, items);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar checklist.' };
  }
}

// --- Export / Import ---

export async function exportMarketingData(): Promise<{ success: boolean; data?: MarketingData; error?: string }> {
  try {
    const [templates, checklist] = await Promise.all([
      getMarketingTemplates(),
      getMarketingChecklist(),
    ]);
    return { success: true, data: { templates, checklist } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al exportar datos.' };
  }
}

export async function importMarketingData(
  data: MarketingData
): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      writeData(TEMPLATES_FILE, data.templates ?? []),
      writeData(CHECKLIST_FILE, data.checklist ?? []),
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al importar datos.' };
  }
}
