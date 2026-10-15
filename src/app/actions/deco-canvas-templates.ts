'use server';

import { readData, writeData } from '@/lib/data-service';
import { DECO_PREBUILT_TEMPLATES } from '@/lib/deco-prebuilt-templates';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';
import { PERMISOS } from '@/lib/auth/perfiles';
import { idDelIntento } from '@/lib/intento-en-servidor';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';

const TEMPLATES_FILE = 'deco-canvas-templates.json';
const PRESET_ID_PREFIX = 'preset_';

async function getUserDecoCanvasTemplates(): Promise<DecoCanvasTemplate[]> {
  const data = await readData<DecoCanvasTemplate[]>(TEMPLATES_FILE, []);
  const templates = Array.isArray(data) ? data : [];
  return templates.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
}

export async function getDecoCanvasTemplates(): Promise<DecoCanvasTemplate[]> {
  await requireAppSession();
  const userTemplates = await getUserDecoCanvasTemplates();
  return [...DECO_PREBUILT_TEMPLATES, ...userTemplates];
}

export async function saveDecoCanvasTemplate(
  nombre: string,
  elementos: ElementoDecorativo[],
  fondoColor: string,
  fondoImagenUrl?: string,
  miniatura?: string,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; template?: DecoCanvasTemplate; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  try {
    const templates = await getUserDecoCanvasTemplates();
    // Pregunta 58: si la respuesta se perdio y la persona reintenta, la plantilla ya esta con ese id.
    const idDeLaPantalla = idDelIntento('deco_tpl', opciones?.idIntento);
    const yaGuardada = idDeLaPantalla ? templates.find((t) => t.id === idDeLaPantalla) : undefined;
    if (yaGuardada) return { success: true, template: yaGuardada };
    const template: DecoCanvasTemplate = {
      id: idDeLaPantalla ?? `deco_tpl_${crypto.randomUUID()}`,
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
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  try {
    if (id.startsWith(PRESET_ID_PREFIX)) {
      return { success: false, error: 'Las plantillas pre-armadas no se pueden eliminar.' };
    }
    const templates = await getUserDecoCanvasTemplates();
    await writeData(TEMPLATES_FILE, templates.filter(t => t.id !== id));
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
