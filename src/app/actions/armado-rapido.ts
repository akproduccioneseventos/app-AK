
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
  menus: [], // Ensure menus array is always present
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
  config: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string }> {
  await ensureDataFileExists();
  try {
    // Ensure `incluyeSeleccionMenu` is not undefined
    const configToSave = {
        ...config,
        menus: config.menus || [], // Ensure menus array exists
        paquetes: config.paquetes.map(p => ({
            ...p,
            incluyeSeleccionMenu: p.incluyeSeleccionMenu || false
        }))
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
    let notes = `Generado desde Armado Rápido.\nPaquete: "${data.nombrePaquete}"`;
    if (data.nombreMenu) {
        notes += `\nMenú de Catering: "${data.nombreMenu}"`;
    }
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
