
'use server';

import type { ItineraryTemplate, ProgramaEventoItem } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { PERMISOS } from '@/lib/auth/perfiles';
import { idDelIntento } from '@/lib/intento-en-servidor';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';

const TEMPLATES_FILE = 'itinerary-templates.json';

export async function getItineraryTemplates(): Promise<ItineraryTemplate[]> {
  await requireAppSession();
  return readData<ItineraryTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveItineraryTemplate(
  name: string,
  items: ProgramaEventoItem[],
  tipoEvento?: import('@/types/presupuesto').TipoEvento,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; template?: ItineraryTemplate; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  if (!name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }
  const templates = await getItineraryTemplates();
  // Pregunta 58: si la respuesta se perdio y la persona reintenta, la plantilla ya esta con ese id.
  const idDeLaPantalla = idDelIntento('template', opciones?.idIntento);
  const yaGuardada = idDeLaPantalla ? templates.find((t) => t.id === idDeLaPantalla) : undefined;
  if (yaGuardada) return { success: true, template: yaGuardada };
  const newTemplate: ItineraryTemplate = {
    id: idDeLaPantalla ?? `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    items: items.map(item => ({...item, id: `item_${Date.now()}_${Math.random()}`})),
    tipoEvento,
  };
  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates, (a, b) => a.name.localeCompare(b.name));
  return { success: true, template: newTemplate };
}

export async function deleteItineraryTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  let templates = await getItineraryTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}
