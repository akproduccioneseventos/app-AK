
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface DialogOption {
  id: string;
  type: 'text' | 'service';
  label: string;
  serviceId?: string; // Only if type is 'service'
}

export interface DialogStep {
  id: string;
  title: string;
  icon?: string; // Icon name from lucide-react
  pregunta: string;
  opciones?: DialogOption[]; 
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
      title: "Presentacion",
      icon: "PartyPopper",
      pregunta: "Soy  Nicolás el asistente virtual de AK producciones, un gusto atenderte te voy a ayudar a hacer un presupuesto para una fiesta, te parece bien?",
      opciones: [
        { id: 'start_option', type: 'text', label: 'Comenzar ahora' }
      ]
    },
    {
      id: "nombreCliente",
      title: "Nombre del Cliente",
      icon: "User",
      pregunta: "Me dirías tu nombre para hacer el presupuesto?"
    },
    {
      id: "cantidadInvitados",
      title: "Cantidad de Invitados",
      icon: "Users",
      pregunta: "¡Genial! ¿Y para cuántas personas sería el evento aproximadamente?"
    },
    {
      id: "seleccionServicios",
      title: "Selección de Servicios",
      icon: "Sparkles",
      pregunta: "Perfecto, {{{nombreCliente}}}. Ahora, ¿qué servicios te gustaría incluir en tu presupuesto? Puedes seleccionar varios.",
      opciones: []
    },
    {
      id: "fechaEvento",
      title: "Fecha del Evento",
      icon: "CalendarDays",
      pregunta: "Por último, {{{nombreCliente}}}, ¿tienes alguna fecha en mente para tu fiesta? Si no, no te preocupes, podemos dejarla a confirmar.",
      opciones: [
        { id: 'date_select', type: 'text', label: 'Elegir fecha' },
        { id: 'date_unknown', type: 'text', label: 'Aún no sé la fecha' }
      ]
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
    const mergedConfig = { ...defaultConfig, ...savedConfig };
    if (!Array.isArray(mergedConfig.pasos)) {
      mergedConfig.pasos = defaultConfig.pasos;
    }
    mergedConfig.pasos = mergedConfig.pasos.map((step, index) => ({
      ...defaultConfig.pasos.find(ds => ds.id === step.id) || {},
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
