
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
    // Merge with defaults to ensure all keys are present
    return { ...defaultConfig, ...parsedConfig };
  } catch (error) {
    console.error("Error reading armado-rapido-config.json, returning default. The file will NOT be overwritten.", error);
    return defaultConfig;
  }
}

export async function saveArmadoRapidoConfig(
  newConfigData: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string }> {
  await ensureDataFileExists();
  try {
    const sanitizedConfig: ArmadoRapidoConfig = {
      ...newConfigData,
      paquetes: (newConfigData.paquetes || []).map(pkg => ({
        id: pkg.id,
        nombre: pkg.nombre,
        descripcion: pkg.descripcion,
        serviciosIncluidos: pkg.serviciosIncluidos.map(serv => ({
          id: serv.id,
          esRegalo: serv.esRegalo || false,
        })),
      })),
      menus: (newConfigData.menus || []).map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        serviciosIncluidos: menu.serviciosIncluidos.map(serv => ({
          id: serv.id,
          esRegalo: serv.esRegalo || false,
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

export async function generateLeadFromQuickBudget(
  data: {
    clienteNombre: string;
    cantidadInvitados: number;
    costoEstimado: number;
    nombrePaquete?: string;
    nombreMenu?: string;
    serviciosIncluidos: { nombre: string; esRegalo: boolean }[];
  }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const allStages = await getCrmStages();
    const targetStage = allStages.find(stage => stage.name.toLowerCase() === 'con presupuesto');
    const targetStageId = targetStage?.id || allStages[0]?.id;

    if (!targetStageId) {
        return { success: false, error: "No hay etapas configuradas en el CRM." };
    }
    
    let notes = `Generado desde SIMULADOR DE PRESUPUESTO.
- Cliente: ${data.clienteNombre}
- Invitados: ${data.cantidadInvitados}
- Costo Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(data.costoEstimado)}`;

    if (data.nombrePaquete) {
      notes += `\n- Paquete de Servicios: "${data.nombrePaquete}"`;
    }
    if (data.nombreMenu) {
      notes += `\n- Menú de Catering: "${data.nombreMenu}"`;
    }
    if (data.serviciosIncluidos && data.serviciosIncluidos.length > 0) {
        notes += `\n- Servicios Incluidos:\n`;
        notes += data.serviciosIncluidos.map((s: any) => `  • ${s.nombre}${s.esRegalo ? ' (REGALO)' : ''}`).join('\n');
    }
    
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
