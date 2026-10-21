'use server';

import { idDelIntento, esIdYaExistente } from '@/lib/intento-en-servidor';
import { readData, writeData, deleteDataItem, createDataItem } from '@/lib/data-service';
import type { InvitacionDigitalData } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';
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
  tplAdultos50Gatsby,
  tplAdultos50Retro,
  tplAdultos50Minimal,
  tplInfantilSafari,
  tplInfantilEspacio,
  tplInfantilCastillo,
  // 25 new templates
  tplBodaJardinDorado,
  tplBodaNocheEstrellada,
  tplBodaRusticaNatural,
  tplBodaArtDeco,
  tplBodaMinimalistaBlanca,
  tplXvMariposas,
  tplXvCoronaDorada,
  tplXvNeonVioleta,
  tplXvCuentoHadas,
  tplXvTropicalGlam,
  tplCumpleConfettiPop,
  tplCumpleNeonParty,
  tplCumpleEleganteNegroOro,
  tplInfantilUnicornio,
  tplInfantilDinosaurios,
  tplInfantilSirenas,
  tplInfantilSuperheroes,
  tplInfantilCirco,
  tplGeneralCorporativoAzul,
  tplGeneralGraduacion,
  tplGeneralBabyShowerRosa,
  tplGeneralBabyShowerCeleste,
  tplGeneralAniversarioOro,
  tplGeneralJubilacion,
  tplGeneralDespedida,
} from '@/lib/invitation-template-seeds';

export interface InvitacionDigitalTemplate extends InvitacionDigitalData {
  id: string;
  name: string;
  category: 'Boda' | 'XV Años' | 'Cumpleaños' | 'General' | 'Infantil';
}

const TEMPLATES_FILE = 'invitacion-digital-templates.json';
const TEMPLATES_COLLECTION = 'invitacion_digital_templates';

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
  tplAdultos50Gatsby,
  tplAdultos50Retro,
  tplAdultos50Minimal,
  tplInfantilSafari,
  tplInfantilEspacio,
  tplInfantilCastillo,
  // 25 new templates
  tplBodaJardinDorado,
  tplBodaNocheEstrellada,
  tplBodaRusticaNatural,
  tplBodaArtDeco,
  tplBodaMinimalistaBlanca,
  tplXvMariposas,
  tplXvCoronaDorada,
  tplXvNeonVioleta,
  tplXvCuentoHadas,
  tplXvTropicalGlam,
  tplCumpleConfettiPop,
  tplCumpleNeonParty,
  tplCumpleEleganteNegroOro,
  tplInfantilUnicornio,
  tplInfantilDinosaurios,
  tplInfantilSirenas,
  tplInfantilSuperheroes,
  tplInfantilCirco,
  tplGeneralCorporativoAzul,
  tplGeneralGraduacion,
  tplGeneralBabyShowerRosa,
  tplGeneralBabyShowerCeleste,
  tplGeneralAniversarioOro,
  tplGeneralJubilacion,
  tplGeneralDespedida,
];

export async function getInvitationTemplates(): Promise<InvitacionDigitalTemplate[]> {
  await requireAppSession();
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
  templateData: Omit<InvitacionDigitalTemplate, 'id'> | InvitacionDigitalTemplate,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; template?: InvitacionDigitalTemplate; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
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
    // Pregunta 58: si la respuesta se perdio y la persona reintenta, la plantilla ya esta con ese id.
    // Crear va como "crear este id", dentro de la base: un reintento o dos toques a la vez no hacen dos.
    const idDeLaPantalla = idDelIntento('tpl', opciones?.idIntento);
    savedTemplate = {
      ...defaultInvitacionDigitalData,
      ...templateData,
      id: idDeLaPantalla ?? `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
    if (idDeLaPantalla) {
      const yaGuardada = savedTemplates.find((t) => t.id === idDeLaPantalla);
      if (yaGuardada) return { success: true, template: yaGuardada };
    }
    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
      savedTemplates.push(savedTemplate);
    } else {
      try {
        await createDataItem(TEMPLATES_FILE, TEMPLATES_COLLECTION, savedTemplate.id, savedTemplate);
      } catch (e) {
        // Dos intentos casi a la vez (otro servidor): el segundo ve la plantilla del primero.
        if (!idDeLaPantalla || !esIdYaExistente(e)) throw e;
        const existente = (await readSavedTemplates()).find((t) => t.id === idDeLaPantalla);
        return { success: true, template: existente ?? savedTemplate };
      }
      return { success: true, template: savedTemplate };
    }
  }

  await writeData(TEMPLATES_FILE, savedTemplates);
  return { success: true, template: savedTemplate };
}

export async function deleteInvitationTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  const allTemplates = await getInvitationTemplates();
  const exists = allTemplates.some(t => t.id === id);
  if (!exists) {
    return { success: false, error: "Plantilla no encontrada para eliminar." };
  }

  // Only remove from the saved list; built-ins simply won't appear in savedTemplates
  const savedTemplates = await readSavedTemplates();
  if (!savedTemplates.some(t => t.id === id)) {
    // Una plantilla base (nunca editada) no esta en la lista guardada: no hay nada que borrar.
    // No se anuncia exito si no cambio nada (si las bases se podran ocultar lo decide el dueno).
    return { success: false, error: "Esta es una plantilla base de la app y no se puede eliminar." };
  }
  const deleted = await deleteDataItem(TEMPLATES_FILE, 'invitacion_digital_templates', id);
  return deleted ? { success: true } : { success: false, error: 'La plantilla ya no estaba guardada.' };
}

export async function duplicateInvitationTemplate(templateId: string, opciones?: { idIntento?: string }): Promise<{ success: boolean; newTemplate?: InvitacionDigitalTemplate, error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION);
  const allTemplates = await getInvitationTemplates();
  const templateToDuplicate = allTemplates.find(t => t.id === templateId);

  if (!templateToDuplicate) {
    return { success: false, error: "Plantilla a duplicar no encontrada." };
  }

  // Pregunta 58: si la respuesta se perdio y la persona reintenta, la copia ya esta con ese id.
  const idDeLaPantalla = idDelIntento('tpl', opciones?.idIntento);
  const newTemplate: InvitacionDigitalTemplate = {
    ...templateToDuplicate,
    id: idDeLaPantalla ?? `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: `[COPIA] ${templateToDuplicate.name}`,
  };

  const savedTemplates = await readSavedTemplates();
  const yaGuardada = idDeLaPantalla ? savedTemplates.find((t) => t.id === idDeLaPantalla) : undefined;
  if (yaGuardada) return { success: true, newTemplate: yaGuardada };
  savedTemplates.push(newTemplate);
  await writeData(TEMPLATES_FILE, savedTemplates);
  return { success: true, newTemplate };
}
