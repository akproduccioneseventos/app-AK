'use server';

import { readData, writeData } from '@/lib/data-service';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';

const TEMPLATES_FILE = 'deco-canvas-templates.json';

export async function getDecoCanvasTemplates(): Promise<DecoCanvasTemplate[]> {
  const templates = await readData<DecoCanvasTemplate[]>(TEMPLATES_FILE, []);
  return templates.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
}

export async function saveDecoCanvasTemplate(
  nombre: string,
  elementos: ElementoDecorativo[],
  fondoColor: string,
  fondoImagenUrl?: string,
  miniatura?: string,
): Promise<{ success: boolean; template?: DecoCanvasTemplate; error?: string }> {
  if (!nombre.trim()) {
    return { success: false, error: 'El nombre de la plantilla es obligatorio.' };
  }

  const templates = await getDecoCanvasTemplates();
  const newTemplate: DecoCanvasTemplate = {
    id: `deco_tpl_${Date.now()}`,
    nombre: nombre.trim(),
    elementos,
    fondoColor,
    fondoImagenUrl,
    creadoEn: new Date().toISOString(),
    miniatura,
  };

  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates);
  return { success: true, template: newTemplate };
}

export async function deleteDecoCanvasTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await getDecoCanvasTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);

  if (templates.length === initialLength) {
    return { success: false, error: 'Plantilla no encontrada.' };
  }

  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
