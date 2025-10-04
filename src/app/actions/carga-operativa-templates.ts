
'use server';

// This file is now obsolete and its functionality has been merged into
// `activos-fijos.ts`. The content is kept temporarily to avoid build errors from
// existing imports, but it should be considered deprecated and removed in a future cleanup.
// All logic now points to using "Activo Fijo" type items from the main catalog.

export interface CargaOperativaItem {
  id: string;
  nombre: string;
  cantidad: string;
}

export interface CargaOperativaTemplateCategory {
  id: string;
  name: string;
  items: CargaOperativaItem[];
}

export interface CargaOperativaTemplate {
  id: 'master';
  name: string;
  categories: CargaOperativaTemplateCategory[];
}

export async function getMasterCargaOperativaTemplate(): Promise<CargaOperativaTemplate> {
  // Return a default empty structure to avoid errors.
  return {
    id: 'master',
    name: 'Plantilla Maestra de Carga Operativa (Obsoleta)',
    categories: [],
  };
}

export async function saveMasterCargaOperativaTemplate(
    templateData: CargaOperativaTemplate
): Promise<{ success: boolean; error?: string }> {
  console.warn("saveMasterCargaOperativaTemplate is deprecated and does nothing.");
  return { success: true };
}
