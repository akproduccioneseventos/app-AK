
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define the types for the "Armado Rápido" configuration

export interface ServicioPaquete {
  id: string; // Corresponds to the id in ServicioEmpresa
  nombre: string;
}

export interface PaqueteArmadoRapido {
  id: string; // e.g., 'paquete-basico'
  nombre: string; // e.g., 'Paquete Básico'
  serviciosIncluidos: ServicioPaquete[];
}

export interface ArmadoRapidoConfig {
  paquetes: PaqueteArmadoRapido[];
  reglasAdicionales: any[]; // Placeholder for future rules
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'armado-rapido-config.json');

const defaultConfig: ArmadoRapidoConfig = {
  paquetes: [
    { id: 'paquete_basico', nombre: 'Paquete Básico', serviciosIncluidos: [] },
    { id: 'paquete_premium', nombre: 'Paquete Premium', serviciosIncluidos: [] },
    { id: 'paquete_completo', nombre: 'Paquete Completo', serviciosIncluidos: [] },
  ],
  reglasAdicionales: [],
};


// Function to ensure the config file exists and read it
async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  try {
    await fs.access(CONFIG_FILE_PATH);
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultConfig;
    return JSON.parse(fileContent) as ArmadoRapidoConfig;
  } catch (error) {
    // If the file doesn't exist, create it with the default config
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

// Function to save the configuration
export async function saveArmadoRapidoConfig(
  config: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string; }> {
  try {
    const dataToSave = JSON.stringify(config, null, 2);
    await fs.writeFile(CONFIG_FILE_PATH, dataToSave, 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving armado-rapido-config.json:", error);
    return { success: false, error: error.message || "Unknown error saving configuration." };
  }
}

// Export a function to be used by the page component
export async function loadArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  return getArmadoRapidoConfig();
}
