
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { InvitacionDigitalData } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import {
  tplBodaRosaEterna,
  tplBodaBohoMistica,
  tplBodaEleganciaModerna,
  tplXvPrincesaDorada,
  tplXvNeonVibrante,
  tplXvJardinDeSuenos,
  tplCumpleFiesta,
  tplCumpleElegante,
  tplEventoGeneral,
} from '@/lib/invitation-template-seeds';

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

const builtInTemplates: InvitacionDigitalTemplate[] = [
  defaultGraziaTemplate,
  tplBodaRosaEterna,
  tplBodaBohoMistica,
  tplBodaEleganciaModerna,
  tplXvPrincesaDorada,
  tplXvNeonVibrante,
  tplXvJardinDeSuenos,
  tplCumpleFiesta,
  tplCumpleElegante,
  tplEventoGeneral,
];

export async function getInvitationTemplates(): Promise<InvitacionDigitalTemplate[]> {
  const savedTemplates = await readData<InvitacionDigitalTemplate[]>(TEMPLATES_FILE, []);
  const savedIds = new Set(savedTemplates.map(t => t.id));

  // Include built-in templates that haven't been saved/edited by the user
  const mergedTemplates = [
    ...builtInTemplates.filter(t => !savedIds.has(t.id)),
    ...savedTemplates,
  ];

  return mergedTemplates.sort((a, b) => a.name.localeCompare(b.name));
}

/** Reads only the user-saved templates from the JSON file (excludes built-ins). */
async function readSavedTemplates(): Promise<InvitacionDigitalTemplate[]> {
  return readData<InvitacionDigitalTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveInvitationTemplate(
  templateData: Omit<InvitacionDigitalTemplate, 'id'> | InvitacionDigitalTemplate
): Promise<{ success: boolean; template?: InvitacionDigitalTemplate; error?: string }> {
  if (!templateData.name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }

  // Work only with the saved-templates list so built-ins are never written to disk
  const allTemplates = await getInvitationTemplates();
  const savedTemplates = await readSavedTemplates();
  let savedTemplate: InvitacionDigitalTemplate;

  if ('id' in templateData && templateData.id) {
    // Update — look up the full template (may be built-in) to merge changes
    const source = allTemplates.find(t => t.id === templateData.id);
    if (!source) {
      return { success: false, error: "Plantilla no encontrada para actualizar." };
    }
    savedTemplate = { ...source, ...templateData };
    const idx = savedTemplates.findIndex(t => t.id === templateData.id);
    if (idx !== -1) {
      savedTemplates[idx] = savedTemplate;
    } else {
      // Built-in being edited for the first time — persist it in the saved list
      savedTemplates.push(savedTemplate);
    }
  } else {
    // Create new template
    savedTemplate = { ...defaultInvitacionDigitalData, ...templateData, id: `tpl_${Date.now()}` };
    savedTemplates.push(savedTemplate);
  }

  await writeData(TEMPLATES_FILE, savedTemplates);
  return { success: true, template: savedTemplate };
}

export async function deleteInvitationTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const allTemplates = await getInvitationTemplates();
  const exists = allTemplates.some(t => t.id === id);
  if (!exists) {
    return { success: false, error: "Plantilla no encontrada para eliminar." };
  }

  // Only remove from the saved list; built-ins simply won't appear in savedTemplates
  const savedTemplates = await readSavedTemplates();
  const filtered = savedTemplates.filter(t => t.id !== id);
  await writeData(TEMPLATES_FILE, filtered);
  return { success: true };
}

export async function duplicateInvitationTemplate(templateId: string): Promise<{ success: boolean; newTemplate?: InvitacionDigitalTemplate, error?: string }> {
  const allTemplates = await getInvitationTemplates();
  const templateToDuplicate = allTemplates.find(t => t.id === templateId);

  if (!templateToDuplicate) {
    return { success: false, error: "Plantilla a duplicar no encontrada." };
  }

  const newTemplate: InvitacionDigitalTemplate = {
    ...templateToDuplicate,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: `[COPIA] ${templateToDuplicate.name}`,
  };

  const savedTemplates = await readSavedTemplates();
  savedTemplates.push(newTemplate);
  await writeData(TEMPLATES_FILE, savedTemplates);
  return { success: true, newTemplate };
}
