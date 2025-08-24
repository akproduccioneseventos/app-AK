
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface DialogOption {
  id: string;
  type: 'text' | 'service';
  label: string;
  serviceId?: string; // Links to a service from the main catalog
}


export interface DialogStep {
  id: string;
  title: string;
  icon: string;
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
        {
          id: "start_now",
          type: "text",
          label: "Comenzar ahora"
        }
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
      id: "fechaEvento",
      title: "Fecha del Evento",
      icon: "CalendarDays",
      pregunta: "{{{nombreCliente}}}, ¿tienes alguna fecha en mente para tu fiesta? Si no, no te preocupes, podemos dejarla a confirmar.",
      opciones: [
        {id: "choose_date", type: 'text', label: "Elegir fecha"},
        {id: "no_date_yet", type: 'text', label: "Aún no sé la fecha"}
      ]
    },
    {
      id: "seleccionServicios",
      title: "Comenzamos a hacer el presupuesto",
      icon: "Sparkles",
      pregunta: "{{{nombreCliente}}} ahora vamos a elegir los menú para el catering. primero elegiremos la primer entrada."
    },
    {
      id: "step_1755976920250",
      title: "Elegir entrada 2",
      icon: "Users",
      pregunta: "Ahora debes elegir la segunda entrada"
    },
    {
      id: "step_1755976978146",
      title: "Elegir Plato principal",
      icon: "Users",
      pregunta: "{{{nombreCliente}}}¿Que plato principal te gustaria?"
    },
    {
      id: "step_1755977112686",
      title: "Plato principal para niños y adolescente",
      icon: "Users",
      pregunta: "¿Qué plato plato principal te gustaría para niños y adolescente?"
    }
  ]
};

async function ensureDataFileExists() {
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


export async function getAssistantConfig(): Promise<DialogConfig> {
  await ensureDataFileExists();
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
  await ensureDataFileExists();
  try {
    // Basic validation
    if (!config || !Array.isArray(config.pasos) || config.pasos.length === 0) {
        throw new Error("La configuración de pasos es inválida o está vacía.");
    }
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving asistente-ak-config.json", error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}
