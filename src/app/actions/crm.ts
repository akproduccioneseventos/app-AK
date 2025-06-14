
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import fs from 'fs/promises';
import path from 'path';
import { saveCustomer } from '@/app/actions/customers'; // For client creation
import type { Customer } from '@/types/customer'; // For client creation

const CRM_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const LEADS_FILE_PATH = path.join(CRM_DATA_DIR, 'crm-leads.json');
const STAGES_FILE_PATH = path.join(CRM_DATA_DIR, 'crm-stages.json');

const defaultStages: CrmStage[] = [
  { id: 's1', name: 'Consultó', order: 1, bgColor: 'bg-sky-100 dark:bg-sky-900/30', borderColor: 'border-sky-500 dark:border-sky-700', textColor: 'text-sky-700 dark:text-sky-300', headerBgColor: 'bg-sky-500 dark:bg-sky-700', headerTextColor: 'text-sky-50' },
  { id: 's2', name: 'Agendó entrevista', order: 2, bgColor: 'bg-teal-100 dark:bg-teal-900/30', borderColor: 'border-teal-500 dark:border-teal-700', textColor: 'text-teal-700 dark:text-teal-300', headerBgColor: 'bg-teal-500 dark:bg-teal-700', headerTextColor: 'text-teal-50' },
  { id: 's3', name: 'Con presupuesto', order: 3, bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-500 dark:border-amber-600', textColor: 'text-amber-700 dark:text-amber-300', headerBgColor: 'bg-amber-500 dark:bg-amber-600', headerTextColor: 'text-amber-900 dark:text-amber-100' },
  { id: 's4', name: 'Firmó contrato', order: 4, bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-500 dark:border-emerald-700', textColor: 'text-emerald-700 dark:text-emerald-300', headerBgColor: 'bg-emerald-500 dark:bg-emerald-700', headerTextColor: 'text-emerald-50', isConversionStage: true },
  { id: 's5', name: 'No contrató', order: 5, bgColor: 'bg-rose-100 dark:bg-rose-900/30', borderColor: 'border-rose-500 dark:border-rose-700', textColor: 'text-rose-700 dark:text-rose-300', headerBgColor: 'bg-rose-500 dark:bg-rose-700', headerTextColor: 'text-rose-50' },
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
    if (defaultValue !== null) { 
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
  }
}

async function initializeCrmFiles() {
  await readJsonFile(LEADS_FILE_PATH, []);
  const stages = await readJsonFile(STAGES_FILE_PATH, []);
  if (!stages || stages.length === 0 || JSON.stringify(stages) !== JSON.stringify(defaultStages)) {
    await writeJsonFile(STAGES_FILE_PATH, defaultStages);
  }
}
initializeCrmFiles();


export async function getCrmStages(): Promise<CrmStage[]> {
  const stages = await readJsonFile<CrmStage[]>(STAGES_FILE_PATH, defaultStages);
  // If the stored stages are not the default ones (e.g. after an update), re-initialize with defaults
  if (JSON.stringify(stages.map(s => ({name: s.name, order: s.order}))) !== JSON.stringify(defaultStages.map(s => ({name: s.name, order: s.order})))) {
      await writeJsonFile(STAGES_FILE_PATH, defaultStages);
      return defaultStages.sort((a, b) => a.order - b.order);
  }
  return stages.sort((a, b) => a.order - b.order);
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  const leads = await readJsonFile<CrmLead[]>(LEADS_FILE_PATH, []);
  return leads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addCrmLead(
  leadData: Pick<CrmLead, 'name' | 'currentStageId' | 'email' | 'phone' | 'notes'>
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name.trim()) {
    return { success: false, error: 'El nombre del prospecto es obligatorio.' };
  }
  const leads = await getCrmLeads();
  const now = new Date().toISOString();
  const newLead: CrmLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: leadData.name.trim(),
    email: leadData.email?.trim() || undefined,
    phone: leadData.phone?.trim() || undefined,
    notes: leadData.notes?.trim() || undefined,
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
    return { success: false, error: `Prospecto con ID ${leadId} no encontrado.` };
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
        return { success: false, error: `Prospecto con ID ${leadId} no encontrado para eliminar.` };
    }
    await writeJsonFile(LEADS_FILE_PATH, leads);
    return { success: true };
}

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


export async function convertToClientAndMoveProspect(
  formData: FormData
): Promise<{ success: boolean; customerId?: string; lead?: CrmLead; error?: string }> {
  const prospectId = formData.get('prospectId') as string;
  const prospectName = formData.get('prospectName') as string;
  const email = formData.get('email') as string | undefined;
  const phone = formData.get('phone') as string | undefined;
  const companyName = formData.get('companyName') as string | undefined;
  const taxId = formData.get('taxId') as string | undefined;
  const street = formData.get('street') as string | undefined;
  const contractFile = formData.get('contract') as File | null;

  if (!prospectId || !prospectName) {
    return { success: false, error: "Faltan datos del prospecto." };
  }
  if (!contractFile) {
    return { success: false, error: "El archivo del contrato es obligatorio." };
  }
  
  const stages = await getCrmStages();
  const firmStage = stages.find(s => s.name === 'Firmó contrato');
  if (!firmStage) {
      return { success: false, error: "La etapa 'Firmó contrato' no está configurada."};
  }

  // Prepare data for saveCustomer (it expects FormData)
  const customerFormData = new FormData();
  customerFormData.append('name', prospectName); // Use prospect's name for the customer
  if (email) customerFormData.append('email', email);
  if (phone) customerFormData.append('phone', phone);
  if (companyName) customerFormData.append('companyName', companyName);
  if (taxId) customerFormData.append('taxId', taxId);
  if (street) customerFormData.append('street', street);
  customerFormData.append('contract', contractFile);

  try {
    const customerResult = await saveCustomer(customerFormData as unknown as Omit<Customer, 'id'>); // Type assertion might be needed if saveCustomer has specific FormData type

    if (!customerResult.success || !customerResult.id) {
      return { success: false, error: customerResult.error || "No se pudo crear el cliente." };
    }

    // If customer created successfully, move the prospect
    const moveResult = await moveCrmLead(prospectId, firmStage.id);
    if (!moveResult.success) {
      // Potentially rollback customer creation or log inconsistency
      console.error(`Cliente ${customerResult.id} creado, pero no se pudo mover el prospecto ${prospectId}. Error: ${moveResult.error}`);
      return { success: false, error: `Cliente creado, pero no se pudo actualizar el prospecto: ${moveResult.error}`, customerId: customerResult.id };
    }

    return { success: true, customerId: customerResult.id, lead: moveResult.lead };

  } catch (error: any) {
    console.error("Error in convertToClientAndMoveProspect:", error);
    return { success: false, error: error.message || "Error desconocido durante la conversión." };
  }
}
