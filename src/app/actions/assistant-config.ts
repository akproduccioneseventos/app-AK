
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface DialogStep {
  pregunta: string;
}

export interface DialogConfig {
  pasos: {
    tipoFiesta: DialogStep;
    cantidadInvitados: DialogStep;
    nombreCliente: DialogStep;
    fechaEvento: DialogStep;
  }
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'asistente-ak-config.json');

const defaultConfig: DialogConfig = {
  pasos: {
    tipoFiesta: {
      pregunta: "¿Qué tipo de evento estás planeando? Por ejemplo: una boda, un cumpleaños de 15, un evento corporativo..."
    },
    cantidadInvitados: {
      pregunta: "¡Genial! ¿Y para cuántas personas sería el evento aproximadamente?"
    },
    nombreCliente: {
      pregunta: "Perfecto. Para ir creando el borrador, ¿a nombre de quién lo preparo?"
    },
    fechaEvento: {
      pregunta: "Por último, ¿tienes alguna fecha en mente para tu evento? Si no, no te preocupes, podemos dejarla a confirmar."
    }
  }
};

async function ensureConfigFileExists() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
  try { await fs.access(CONFIG_FILE_PATH); } catch { await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8'); }
}

export async function getAssistantConfig(): Promise<DialogConfig> {
  await ensureConfigFileExists();
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    return fileContent.trim() === '' ? defaultConfig : JSON.parse(fileContent);
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
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving asistente-ak-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}
