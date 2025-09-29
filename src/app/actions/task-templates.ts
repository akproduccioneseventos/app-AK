
'use server';

import type { Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';

export interface TaskTemplate {
  id: string;
  name: string;
  tasks: Omit<Tarea, 'id' | 'completada'>[];
}

const TEMPLATES_FILE = 'task-templates.json';

export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  return readData<TaskTemplate[]>(TEMPLATES_FILE, []);
}

export async function saveTaskTemplate(name: string, tasks: Omit<Tarea, 'id' | 'completada'>[]): Promise<{ success: boolean; template?: TaskTemplate; error?: string }> {
  if (!name.trim()) {
    return { success: false, error: "El nombre de la plantilla es obligatorio." };
  }
  const templates = await getTaskTemplates();
  const newTemplate: TaskTemplate = {
    id: `tpl_task_${Date.now()}`,
    name: name.trim(),
    tasks: tasks
  };
  templates.push(newTemplate);
  await writeData(TEMPLATES_FILE, templates, (a, b) => a.name.localeCompare(b.name));
  return { success: true, template: newTemplate };
}

export async function deleteTaskTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  let templates = await getTaskTemplates();
  const initialLength = templates.length;
  templates = templates.filter(t => t.id !== id);
  if (templates.length === initialLength) {
    return { success: false, error: "Plantilla no encontrada." };
  }
  await writeData(TEMPLATES_FILE, templates);
  return { success: true };
}

    