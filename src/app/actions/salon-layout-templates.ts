
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { DecoracionData } from '@/types/fiesta';

export interface SalonLayoutTemplate {
  id: string;
  name: string;
  layoutData: Pick<DecoracionData, 'salonWidth' | 'salonHeight' | 'salonPlanBackgroundImageUrl' | 'salonElements' | 'layoutTemplateName'>;
  createdAt: string;
}

const TEMPLATES_FILE = 'salon-layout-templates.json';

export async function getSalonLayoutTemplates(): Promise<SalonLayoutTemplate[]> {
  const templates = await readData<SalonLayoutTemplate[]>(TEMPLATES_FILE, []);
  return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSalonLayoutTemplate(
  name: string,
  layoutData: DecoracionData
): Promise<{ success: boolean; template?: SalonLayoutTemplate; error?: string }> {
  if (!name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }

  const templates = await getSalonLayoutTemplates();
  
  const templateDataToSave: SalonLayoutTemplate['layoutData'] = {
    salonWidth: layoutData.salonWidth,
    salonHeight: layoutData.salonHeight,
    salonPlanBackgroundImageUrl: layoutData.salonPlanBackgroundImageUrl,
    salonElements: layoutData.salonElements,
    layoutTemplateName: name.trim(),
  };

  const newTemplate: SalonLayoutTemplate = {
    id: `layout_tpl_${Date.now()}`,
    name: name.trim(),
    layoutData: templateDataToSave,
    createdAt: new Date().toISOString(),
  };

  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates);
  return { success: true, template: newTemplate };
}

export async function deleteSalonLayoutTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await getSalonLayoutTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
