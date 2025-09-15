'use server';

import fs from 'fs/promises';
import path from 'path';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import { addCrmLead, getCrmStages } from './crm';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'armado-rapido-config.json');

const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: 0,
  paquetes: [],
  menus: [], // Although unused by the new system, kept for potential future features
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
    // Merge with defaults to ensure all keys are present
    const finalConfig = { ...defaultConfig, ...parsedConfig };
    finalConfig.menus = finalConfig.menus || [];
    finalConfig.paquetes = finalConfig.paquetes || [];
    return finalConfig;
  } catch (error) {
    console.error("Error reading armado-rapido-config.json, returning default. The file will NOT be overwritten.", error);
    return defaultConfig;
  }
}

// This function now ONLY saves the structure of packages and menus. 
// Prices are no longer stored here, they are always fetched from the master catalog.
export async function saveArmadoRapidoConfig(
  newConfigData: Partial<ArmadoRapidoConfig>
): Promise<{ success: boolean; error?: string }> {
  await ensureDataFileExists();
  try {
    const existingConfig = await getArmadoRapidoConfig();
    
    // Create a config to save that ONLY contains the IDs and gift status, stripping any other data.
    const sanitizedConfig: ArmadoRapidoConfig = {
      ...existingConfig,
      ...newConfigData,
      paquetes: (newConfigData.paquetes || existingConfig.paquetes).map(pkg => ({
        id: pkg.id,
        nombre: pkg.nombre,
        descripcion: pkg.descripcion,
        serviciosIncluidos: pkg.serviciosIncluidos.map(serv => ({
          id: serv.id,
          esRegalo: serv.esRegalo || false,
        })),
      })),
      // Menus are currently unused in the new system but we sanitize them anyway for consistency
      menus: (newConfigData.menus || existingConfig.menus).map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        serviciosIncluidos: menu.serviciosIncluidos.map(serv => ({
          id: serv.id,
          esRegalo: serv.esRegalo || false,
          categoria: serv.categoria, // Keep category for menus
        })),
      }))
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(sanitizedConfig, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving armado-rapido-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}

// This function is no longer needed in the new system but kept for reference or potential re-use.
// The new system does not generate leads from the simulator.
export async function generateLeadFromQuickBudget(
  data: any
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const allStages = await getCrmStages();
    const targetStage = allStages.find(stage => stage.name.toLowerCase() === 'con presupuesto');
    const targetStageId = targetStage?.id || allStages[0]?.id;

    if (!targetStageId) {
        return { success: false, error: "No hay etapas configuradas en el CRM." };
    }
    
    const notes = `Generado desde SIMULADOR DE PRESUPUESTO.
Paquete: "${data.nombrePaquete}"
Catering: "${data.nombreMenu}"
Invitados: ${data.cantidadInvitados}
Costo Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(data.costoEstimado)}`;
    
    const leadResult = await addCrmLead({
      name: data.clienteNombre,
      notes: notes,
      currentStageId: targetStageId 
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
