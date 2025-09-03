
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { ArmadoRapidoConfig, LeadGenerationData } from '@/types/armado-rapido';
import { addCrmLead } from './crm';

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
    // Ensure menus and paquetes are always arrays
    parsedConfig.menus = parsedConfig.menus || [];
    parsedConfig.paquetes = parsedConfig.paquetes || [];
    return parsedConfig;
  } catch (error) {
    console.error("Error reading armado-rapido-config.json, returning default.", error);
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

export async function saveArmadoRapidoConfig(
  newConfigData: Partial<ArmadoRapidoConfig>
): Promise<{ success: boolean; error?: string }> {
  await ensureDataFileExists();
  try {
    // **CRITICAL FIX**: Read the existing config first to merge, not overwrite.
    const existingConfig = await getArmadoRapidoConfig();

    const configToSave: ArmadoRapidoConfig = {
      ...existingConfig,
      ...newConfigData,
      menus: newConfigData.menus !== undefined ? newConfigData.menus : existingConfig.menus,
      paquetes: newConfigData.paquetes !== undefined ? newConfigData.paquetes : existingConfig.paquetes,
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configToSave, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving armado-rapido-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}

export async function generateLeadFromQuickBudget(
  data: LeadGenerationData
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    let notes = `Generado desde Mi Presupuesto al Instante.\nMenú: "${data.nombreMenu}"\nPaquete de Servicios: "${data.nombrePaquete}"`;
    notes += `\nTipo: ${data.tipoEvento}\nInvitados: ${data.cantidadInvitados}\nSalón: ${data.salon}\nPresupuesto Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(data.costoEstimado)}`;
    
    const leadResult = await addCrmLead({
      name: data.clienteNombre,
      notes: notes
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
