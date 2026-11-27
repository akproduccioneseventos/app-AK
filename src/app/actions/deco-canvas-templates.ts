'use server';

import { readData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { DECO_PREBUILT_TEMPLATES } from '@/lib/deco-prebuilt-templates';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';
import { PERMISOS } from '@/lib/auth/perfiles';
import { idDelIntento } from '@/lib/intento-en-servidor';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';
import { approvedCatalogTemplates, dismissCatalogDraft } from '@/lib/decoracion/catalog-service';

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
  return [...DECO_PREBUILT_TEMPLATES, ...userTemplates, ...await approvedCatalogTemplates()];
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
    const idDeLaPantalla = idDelIntento('deco_tpl', opciones?.idIntento);
    let resultado: DecoCanvasTemplate | undefined;
    await mutateGenericJsonArray<DecoCanvasTemplate>(TEMPLATES_FILE, (actuales) => {
      const templates = Array.isArray(actuales) ? actuales : [];
      const yaGuardada = idDeLaPantalla ? templates.find((t) => t.id === idDeLaPantalla) : undefined;
      if (yaGuardada) {
        resultado = yaGuardada;
        return null;
      }
      const template: DecoCanvasTemplate = {
        id: idDeLaPantalla ?? `deco_tpl_${crypto.randomUUID()}`,
        nombre,
        elementos,
        fondoColor,
        fondoImagenUrl,
        creadoEn: new Date().toISOString(),
        miniatura,
      };
      resultado = template;
      return [template, ...templates];
    });
    return { success: true, template: resultado };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function deleteDecoCanvasTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  try {
    if (id.startsWith('catalog_deco_')) {
      await dismissCatalogDraft(id.slice('catalog_deco_'.length));
      return { success: true };
    }
    if (id.startsWith(PRESET_ID_PREFIX)) {
      return { success: false, error: 'Las plantillas pre-armadas no se pueden eliminar.' };
    }
    let encontrada = false;
    await mutateGenericJsonArray<DecoCanvasTemplate>(TEMPLATES_FILE, (actuales) => {
      const templates = Array.isArray(actuales) ? actuales : [];
      if (!templates.some((t) => t.id === id)) return null;
      encontrada = true;
      return templates.filter((t) => t.id !== id);
    });
    if (!encontrada) {
      return { success: false, error: 'Plantilla no encontrada.' };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
