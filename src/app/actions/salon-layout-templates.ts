
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { DecoracionData } from '@/types/fiesta';
import { requireAppSession } from '@/lib/auth/require-session';

export interface SalonLayoutTemplate {
  id: string;
  name: string;
  layoutData: Pick<DecoracionData, 'salonWidth' | 'salonHeight' | 'salonPlanBackgroundImageUrl' | 'salonElements' | 'layoutTemplateName' | 'pixelsPerMeter'>;
  createdAt: string;
}

const TEMPLATES_FILE = 'salon-layout-templates.json';

export async function getSalonLayoutTemplates(): Promise<SalonLayoutTemplate[]> {
  await requireAppSession();
  const templates = await readData<SalonLayoutTemplate[]>(TEMPLATES_FILE, []);
  return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSalonLayoutTemplate(
  name: string,
  layoutData: DecoracionData
): Promise<{ success: boolean; template?: SalonLayoutTemplate; error?: string }> {
  await requireAppSession();
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
    // La escala viaja con el plano (auditoría 72, SALON72-1): sin ella, al cargar la plantilla se
    // usaba la de fábrica (40) y una mesa de 2 m dibujada a 80 px/m pasaba a medir 4 m. Las
    // plantillas viejas, que no la tienen, siguen abriendo como siempre: no se adivina.
    ...(typeof layoutData.pixelsPerMeter === 'number' && layoutData.pixelsPerMeter > 0
      ? { pixelsPerMeter: layoutData.pixelsPerMeter }
      : {}),
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
  await requireAppSession();
  let templates = await getSalonLayoutTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
