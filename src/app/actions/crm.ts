
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import fs from 'fs/promises';
import path from 'path';

const CRM_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const LEADS_FILE_PATH = path.join(CRM_DATA_DIR, 'crm-leads.json');
const STAGES_FILE_PATH = path.join(CRM_DATA_DIR, 'crm-stages.json');

const defaultStages: CrmStage[] = [
  { id: 's1', name: 'Etapa 1', order: 1, bgColor: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-500 dark:border-blue-700', textColor: 'text-blue-700 dark:text-blue-300', headerBgColor: 'bg-blue-500 dark:bg-blue-700', headerTextColor: 'text-blue-50' },
  { id: 's2', name: 'Etapa 2', order: 2, bgColor: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-500 dark:border-green-700', textColor: 'text-green-700 dark:text-green-300', headerBgColor: 'bg-green-500 dark:bg-green-700', headerTextColor: 'text-green-50' },
  { id: 's3', name: 'Etapa 3', order: 3, bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', borderColor: 'border-yellow-500 dark:border-yellow-600', textColor: 'text-yellow-700 dark:text-yellow-300', headerBgColor: 'bg-yellow-500 dark:bg-yellow-600', headerTextColor: 'text-yellow-900 dark:text-yellow-100' },
  { id: 's4', name: 'Etapa 4', order: 4, bgColor: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-500 dark:border-orange-700', textColor: 'text-orange-700 dark:text-orange-300', headerBgColor: 'bg-orange-500 dark:bg-orange-700', headerTextColor: 'text-orange-50' },
  { id: 's5', name: 'Etapa 5', order: 5, bgColor: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-500 dark:border-purple-700', textColor: 'text-purple-700 dark:text-purple-300', headerBgColor: 'bg-purple-500 dark:bg-purple-700', headerTextColor: 'text-purple-50' },
];

async function ensureDataDirectoryExists() {
  try {
    await fs.access(CRM_DATA_DIR);
  } catch {
    await fs.mkdir(CRM_DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return fileContent.trim() === '' ? defaultValue : JSON.parse(fileContent) as T;
  } catch (error) {
    // If file doesn't exist or is invalid, write and return default
    if (defaultValue !== null) { // Avoid writing null if that's the default
      await writeJsonFile(filePath, defaultValue);
    }
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    // Potentially throw error or handle as needed
  }
}

async function initializeCrmFiles() {
  await readJsonFile(LEADS_FILE_PATH, []);
  // Initialize stages file with default stages if it's empty or doesn't exist
  const stages = await readJsonFile(STAGES_FILE_PATH, []);
  if (!stages || stages.length === 0) {
    await writeJsonFile(STAGES_FILE_PATH, defaultStages);
  }
}
initializeCrmFiles();


export async function getCrmStages(): Promise<CrmStage[]> {
  const stages = await readJsonFile<CrmStage[]>(STAGES_FILE_PATH, defaultStages);
  return stages.sort((a, b) => a.order - b.order);
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  const leads = await readJsonFile<CrmLead[]>(LEADS_FILE_PATH, []);
  return leads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addCrmLead(
  leadData: Pick<CrmLead, 'name' | 'currentStageId'>
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name.trim()) {
    return { success: false, error: 'El nombre del lead es obligatorio.' };
  }
  const leads = await getCrmLeads();
  const now = new Date().toISOString();
  const newLead: CrmLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: leadData.name.trim(),
    currentStageId: leadData.currentStageId,
    createdAt: now,
    updatedAt: now,
  };
  leads.push(newLead);
  await writeJsonFile(LEADS_FILE_PATH, leads);
  return { success: true, lead: newLead };
}

export async function moveCrmLead(
  leadId: string,
  newStageId: string
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  let leads = await getCrmLeads();
  const leadIndex = leads.findIndex(l => l.id === leadId);

  if (leadIndex === -1) {
    return { success: false, error: `Lead con ID ${leadId} no encontrado.` };
  }

  leads[leadIndex] = {
    ...leads[leadIndex],
    currentStageId: newStageId,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(LEADS_FILE_PATH, leads);
  return { success: true, lead: leads[leadIndex] };
}

export async function deleteCrmLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    let leads = await getCrmLeads();
    const initialLength = leads.length;
    leads = leads.filter(lead => lead.id !== leadId);

    if (leads.length === initialLength) {
        return { success: false, error: `Lead con ID ${leadId} no encontrado para eliminar.` };
    }
    await writeJsonFile(LEADS_FILE_PATH, leads);
    return { success: true };
}

// Future function stub for renaming stages
export async function updateCrmStageName(
  stageId: string,
  newName: string
): Promise<{ success: boolean; stage?: CrmStage; error?: string }> {
  let stages = await getCrmStages();
  const stageIndex = stages.findIndex(s => s.id === stageId);

  if (stageIndex === -1) {
    return { success: false, error: `Etapa con ID ${stageId} no encontrada.` };
  }
  if (!newName.trim()) {
    return { success: false, error: "El nuevo nombre de la etapa no puede estar vacío." };
  }

  stages[stageIndex] = { ...stages[stageIndex], name: newName.trim() };
  await writeJsonFile(STAGES_FILE_PATH, stages);
  return { success: true, stage: stages[stageIndex] };
}
