
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { ArmadoRapidoConfig, LeadGenerationData } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { addCrmLead, getCrmStages } from './crm'; // Importar getCrmStages
import { saveServicioEmpresa } from './servicios-empresa'; // Importar saveServicioEmpresa

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'armado-rapido-config.json');

const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: 0,
  paquetes: [],
  menus: [],
};

async function ensureDataFileExists() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
  try { await fs.access(CONFIG_FILE_PATH); } catch { await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8'); }
}

export async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  await ensureDataFileExists();
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const parsedConfig = fileContent.trim() === '' ? defaultConfig : JSON.parse(fileContent);
    parsedConfig.menus = parsedConfig.menus || [];
    parsedConfig.paquetes = parsedConfig.paquetes || [];
    return parsedConfig;
  } catch (error) {
    console.error("Error reading armado-rapido-config.json, returning default. The file will NOT be overwritten.", error);
    return defaultConfig;
  }
}

export async function saveArmadoRapidoConfig(
  newConfigData: Partial<ArmadoRapidoConfig>
): Promise<{ success: boolean; error?: string }> {
  await ensureDataFileExists();
  try {
    const existingConfig = await getArmadoRapidoConfig();
    const configToSave: ArmadoRapidoConfig = {
      ...existingConfig,
      ...newConfigData,
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configToSave, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving armado-rapido-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}


export async function updateArmadoRapidoAndSyncServices(
  configToSave: ArmadoRapidoConfig,
  updatedServices: ServicioEmpresa[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Save all services that were modified in the master catalog
    for (const service of updatedServices) {
      await saveServicioEmpresa(service);
    }

    // 2. Save the Armado Rapido config (which now doesn't store prices)
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configToSave, null, 2), 'utf-8');

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateArmadoRapidoAndSyncServices:", error);
    return { success: false, error: error.message || "Error desconocido durante la sincronización." };
  }
}


export async function generateLeadFromQuickBudget(
  data: LeadGenerationData
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const allStages = await getCrmStages();
    // Find the target stage, but handle the case where it might not exist.
    const targetStage = allStages.find(stage => stage.name.toLowerCase() === 'con presupuesto');
    
    // If 'Con presupuesto' stage is not found, default to the first stage in the array.
    // If no stages exist at all, this will be undefined.
    const targetStageId = targetStage?.id || allStages[0]?.id;

    if (!targetStageId) {
        // This is a more critical error, as there are no stages to add the lead to.
        console.error("CRM has no stages configured. Cannot add lead.");
        return { success: false, error: "No hay etapas configuradas en el CRM para añadir el prospecto." };
    }
    
    let notes = `Generado desde SIMULADOR DE PRESUPUESTO.\nMenú: "${data.nombreMenu}"\nPaquete de Servicios: "${data.nombrePaquete}"`;
    notes += `\nTipo: ${data.tipoEvento}\nInvitados: ${data.cantidadInvitados}\nSalón: ${data.salon}\nPresupuesto Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(data.costoEstimado)}`;
    
    const leadResult = await addCrmLead({
      name: data.clienteNombre,
      notes: notes,
      currentStageId: targetStageId // Pass the specific stage ID here
    });

    if (leadResult.success && leadResult.lead) {
      return { success: true, leadId: leadResult.lead.id };
    } else {
      return { success: false, error: leadResult.error || "No se pudo crear el prospecto en el CRM." };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al generar el prospecto." };
  }
}
