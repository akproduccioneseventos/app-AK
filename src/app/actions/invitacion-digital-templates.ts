
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { InvitacionDigitalData } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';

export interface InvitacionDigitalTemplate extends InvitacionDigitalData {
  id: string;
  name: string;
  category: 'Boda' | 'XV Años' | 'Cumpleaños' | 'General';
}

const TEMPLATES_FILE = 'invitacion-digital-templates.json';

const defaultGraziaTemplate: InvitacionDigitalTemplate = {
    ...defaultInvitacionDigitalData,
    id: 'tpl_grazia_default',
    name: 'Grazia Base',
    category: 'Boda',
    plantilla: 'Grazia',
};

export async function getInvitationTemplates(): Promise<InvitacionDigitalTemplate[]> {
  // Ensure the default template exists if the file is empty
  const templates = await readData<InvitacionDigitalTemplate[]>(TEMPLATES_FILE, [defaultGraziaTemplate]);
  if (templates.length === 0) {
    return [defaultGraziaTemplate];
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveInvitationTemplate(
  templateData: Omit<InvitacionDigitalTemplate, 'id'> | InvitacionDigitalTemplate
): Promise<{ success: boolean; template?: InvitacionDigitalTemplate; error?: string }> {
  if (!templateData.name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }

  const templates = await getInvitationTemplates();
  let savedTemplate: InvitacionDigitalTemplate;

  if ('id' in templateData && templateData.id) {
    // Update
    const index = templates.findIndex(t => t.id === templateData.id);
    if (index === -1) {
      return { success: false, error: "Plantilla no encontrada para actualizar." };
    }
    savedTemplate = { ...templates[index], ...templateData };
    templates[index] = savedTemplate;
  } else {
    // Create
    savedTemplate = { ...defaultInvitacionDigitalData, ...templateData, id: `tpl_${Date.now()}` };
    templates.push(savedTemplate);
  }
  
  await writeData(TEMPLATES_FILE, templates);
  return { success: true, template: savedTemplate };
}

export async function deleteInvitationTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await getInvitationTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada para eliminar." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}

export async function duplicateInvitationTemplate(templateId: string): Promise<{ success: boolean; newTemplate?: InvitacionDigitalTemplate, error?: string }> {
  const templates = await getInvitationTemplates();
  const templateToDuplicate = templates.find(t => t.id === templateId);

  if (!templateToDuplicate) {
    return { success: false, error: "Plantilla a duplicar no encontrada." };
  }

  const newTemplate: InvitacionDigitalTemplate = {
    ...templateToDuplicate,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: `[COPIA] ${templateToDuplicate.name}`,
  };

  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates);
  return { success: true, newTemplate };
}
