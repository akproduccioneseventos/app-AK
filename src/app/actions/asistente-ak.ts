
'use server';

// This file is being kept for potential future use or migration of old assistant logic.
// The primary assistant functionality is now handled by the new AI chat-based assistant.

import type { AsistenteAkConfig, AsistenteData } from '@/types/fiesta';
import fs from 'fs/promises';
import path from 'path';
import { savePresupuesto } from '@/app/actions/presupuestos';
import type { ItemPresupuestado } from '@/types/presupuesto';


const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'asistente-ak-config.json');

const defaultOpcionesTipoFiesta = [
  { id: 'boda', nombre: 'Boda', costoBase: 80000, img: 'https://placehold.co/400x300.png', hint: 'wedding couple' },
  { id: 'quince', nombre: 'Quince Años', costoBase: 60000, img: 'https://placehold.co/400x300.png', hint: 'quinceanera dress' },
  { id: 'infantil', nombre: 'Cumpleaños Infantil', costoBase: 30000, img: 'https://placehold.co/400x300.png', hint: 'kids party' },
  { id: 'corporativo', nombre: 'Evento Corporativo', costoBase: 90000, img: 'https://placehold.co/400x300.png', hint: 'corporate meeting' },
  { id: 'otro', nombre: 'Otro Tipo de Evento', costoBase: 40000, img: 'https://placehold.co/400x300.png', hint: 'event celebration' },
];

const defaultConfig: AsistenteAkConfig = {
  pasos: {
    tipoFiesta: {
      pregunta: "¿Qué tipo de evento estás planeando?",
      descripcion: "Selecciona una opción para empezar.",
      opciones: defaultOpcionesTipoFiesta,
    },
    // Future steps can be re-defined here if the old wizard is revived.
  }
};

async function ensureConfigFileExists() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(CONFIG_FILE_PATH);
  } catch {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
}

export async function getAsistenteAkConfig(): Promise<AsistenteAkConfig> {
  await ensureConfigFileExists();
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultConfig;
    const savedConfig = JSON.parse(fileContent);
    let needsUpdate = false;
    for (const key in defaultConfig.pasos) {
        if (!savedConfig.pasos[key]) {
            (savedConfig.pasos as any)[key] = (defaultConfig.pasos as any)[key];
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        await saveAsistenteAkConfig(savedConfig);
    }
    return savedConfig;
  } catch (error) {
    console.error('Error reading Asistente AK config file, returning default:', error);
    return defaultConfig;
  }
}

export async function saveAsistenteAkConfig(configData: AsistenteAkConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureConfigFileExists();
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Error writing Asistente AK config file:', error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}
