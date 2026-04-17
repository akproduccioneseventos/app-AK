'use server';

import { readData, writeData } from '@/lib/data-service';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';

const TEMPLATES_FILE = 'deco-canvas-templates.json';

export async function getDecoCanvasTemplates(): Promise<DecoCanvasTemplate[]> {
  const data = await readData<DecoCanvasTemplate[]>(TEMPLATES_FILE, []);
  const templates = Array.isArray(data) ? data : [];
  return templates.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
}

export async function saveDecoCanvasTemplate(
  nombre: string,
  elementos: ElementoDecorativo[],
  fondoColor: string,
  fondoImagenUrl?: string,
  miniatura?: string,
): Promise<{ success: boolean; template?: DecoCanvasTemplate; error?: string }> {
  try {
    const templates = await getDecoCanvasTemplates();
    const template: DecoCanvasTemplate = {
      id: `deco_tpl_${Date.now()}`,
      nombre,
      elementos,
      fondoColor,
      fondoImagenUrl,
      creadoEn: new Date().toISOString(),
      miniatura,
    };
    await writeData(TEMPLATES_FILE, [template, ...templates]);
    return { success: true, template };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function deleteDecoCanvasTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const templates = await getDecoCanvasTemplates();
    await writeData(TEMPLATES_FILE, templates.filter(t => t.id !== id));
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
