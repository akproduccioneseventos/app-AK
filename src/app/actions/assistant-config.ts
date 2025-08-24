
'use server';

import fs from 'fs/promises';
import path from 'path';

// Note: The structure of DialogConfig is now simplified as the assistant's
// logic is primarily driven by the system prompt in assistant-flow.ts.
// This file is kept for potential future use with more complex, configurable flows.

export interface DialogStep {
  id: string;
  title: string;
  pregunta: string;
}

export interface DialogConfig {
  pasos: DialogStep[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'asistente-ak-config.json');

// Default config is now much simpler.
const defaultConfig: DialogConfig = {
  pasos: [
    {
      id: "saludo",
      title: "Saludo",
      pregunta: "¡Hola! Soy Asistente AK. ¿Te gustaría que te ayude a crear un presupuesto para tu evento?",
    },
    {
      id: "nombreCliente",
      title: "Nombre del Cliente",
      pregunta: "¡Genial! Para empezar, ¿a nombre de quién sería el presupuesto?"
    },
    {
      id: "tipoEvento",
      title: "Tipo de Evento",
      pregunta: "Perfecto. ¿Qué tipo de evento estás planeando?"
    },
    {
      id: "cantidadInvitados",
      title: "Cantidad de Invitados",
      pregunta: "Entendido. ¿Para cuántas personas sería el evento, aproximadamente?"
    },
    {
      id: "fechaEvento",
      title: "Fecha del Evento",
      pregunta: "¡Ya casi terminamos! ¿Tienes alguna fecha en mente? Si no, no hay problema."
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
    // Basic validation to ensure it returns a valid structure.
    const savedConfig = fileContent.trim() === '' ? {} : JSON.parse(fileContent);
    if (!savedConfig.pasos || !Array.isArray(savedConfig.pasos)) {
        return defaultConfig;
    }
    return savedConfig;
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
    if (!config || !Array.isArray(config.pasos)) {
        throw new Error("La configuración de los pasos no es válida.");
    }
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving asistente-ak-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}
