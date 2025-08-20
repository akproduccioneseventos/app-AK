
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface DialogStep {
  id: string;
  title: string;
  icon?: string; // Icon name from lucide-react
  pregunta: string;
  opciones?: string[]; 
}

export interface DialogConfig {
  pasos: DialogStep[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'asistente-ak-config.json');

const defaultConfig: DialogConfig = {
  pasos: [
    {
      id: "tipoFiesta",
      title: "Tipo de Fiesta",
      icon: "PartyPopper",
      pregunta: "¿Qué tipo de evento estás planeando?",
      opciones: ["Cumpleaños", "Fiesta de 15", "Boda", "Evento empresarial", "Otro"]
    },
    {
      id: "cantidadInvitados",
      title: "Cantidad de Invitados",
      icon: "Users",
      pregunta: "¡Genial! ¿Y para cuántas personas sería el evento aproximadamente?"
    },
    {
      id: "nombreCliente",
      title: "Nombre del Cliente",
      icon: "User",
      pregunta: "Perfecto. Para ir creando el borrador, ¿a nombre de quién lo preparo?"
    },
    {
      id: "fechaEvento",
      title: "Fecha del Evento",
      "icon": "CalendarDays",
      pregunta: "Por último, ¿tienes alguna fecha en mente para tu evento? Si no, no te preocupes, podemos dejarla a confirmar."
    }
  ]
};

async function ensureConfigFileExists() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
  try { await fs.access(CONFIG_FILE_PATH); } catch { await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8'); }
}

export async function getAssistantConfig(): Promise<DialogConfig> {
  await ensureConfigFileExists();
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const savedConfig = fileContent.trim() === '' ? {} : JSON.parse(fileContent);
    // Simple merge to add new fields if default config changes
    const mergedConfig = { ...defaultConfig, ...savedConfig };
    // Ensure `pasos` is an array and each step has an ID
    if (!Array.isArray(mergedConfig.pasos)) {
      mergedConfig.pasos = defaultConfig.pasos;
    }
    mergedConfig.pasos = mergedConfig.pasos.map((step, index) => ({
      ...defaultConfig.pasos[index] || {}, // get defaults for icon/title
      ...step,
      id: step.id || `step_${index}_${Date.now()}`
    }));
    return mergedConfig;
  } catch (error) {
    console.error("Error reading asistente-ak-config.json, returning default.", error);
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

export async function saveAssistantConfig(
  config: DialogConfig
): Promise<{ success: boolean; error?: string }> {
  await ensureConfigFileExists();
  try {
    // Basic validation to ensure we're not saving an empty config
    if (!config || !Array.isArray(config.pasos) || config.pasos.length === 0) {
        throw new Error("La configuración de los pasos no puede estar vacía.");
    }
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving asistente-ak-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}
