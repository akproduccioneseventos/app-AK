
'use server';

import type { CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';

// This file now manages a SINGLE master template object, not an array of templates.
export interface CargaOperativaTemplate {
  id: 'master';
  name: string;
  categories: CargaOperativaCategoria[];
}

const TEMPLATE_FILE = 'carga-operativa-master-template.json';
const defaultMasterTemplate: CargaOperativaTemplate = {
    id: 'master',
    name: 'Plantilla Maestra de Carga Operativa',
    categories: [],
};

export async function getMasterCargaOperativaTemplate(): Promise<CargaOperativaTemplate> {
  return readData<CargaOperativaTemplate>(TEMPLATE_FILE, defaultMasterTemplate);
}

export async function saveMasterCargaOperativaTemplate(
    templateData: CargaOperativaTemplate
): Promise<{ success: boolean; template?: CargaOperativaTemplate; error?: string }> {
  if (templateData.id !== 'master') {
    return { success: false, error: "Solo se puede guardar la plantilla maestra." };
  }
  await writeData(TEMPLATE_FILE, templateData);
  return { success: true, template: templateData };
}
