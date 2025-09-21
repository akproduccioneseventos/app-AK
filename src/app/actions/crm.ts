
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer } from '@/app/actions/customers'; 
import type { Customer } from '@/types/customer'; 
import { createNewFiestaForCustomer } from '@/app/actions/fiesta/fiesta.actions';

const LEADS_FILE = 'crm-leads.json';
const STAGES_FILE = 'crm-stages.json';

const defaultStages: CrmStage[] = [
  { id: 's1', name: 'Consultó', order: 1, headerBgColor: "bg-sky-500 dark:bg-sky-700", headerTextColor: 'text-sky-50', bgColor: 'bg-sky-100 dark:bg-sky-900/30', borderColor: 'border-sky-500 dark:border-sky-700', textColor: 'text-sky-700 dark:text-sky-300' },
  { id: 's2', name: 'Agendó entrevista', order: 2, headerBgColor: "bg-teal-500 dark:bg-teal-700", headerTextColor: 'text-teal-50', bgColor: 'bg-teal-100 dark:bg-teal-900/30', borderColor: 'border-teal-500 dark:border-teal-700', textColor: 'text-teal-700 dark:text-teal-300' },
  { id: 's3', name: 'Con presupuesto', order: 3, headerBgColor: "bg-amber-500 dark:bg-amber-600", headerTextColor: 'text-amber-900 dark:text-amber-100', bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-500 dark:border-amber-600', textColor: 'text-amber-700 dark:text-amber-300' },
  { id: 's4', name: 'Firmó contrato', order: 4, headerBgColor: "bg-emerald-500 dark:bg-emerald-700", headerTextColor: 'text-emerald-50', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-500 dark:border-emerald-700', textColor: 'text-emerald-700 dark:text-emerald-300', isConversionStage: true },
  { id: 's5', name: 'No contrató', order: 5, headerBgColor: "bg-rose-500 dark:bg-rose-700", headerTextColor: 'text-rose-50', bgColor: 'bg-rose-100 dark:bg-rose-900/30', borderColor: 'border-rose-500 dark:border-rose-700', textColor: 'text-rose-700 dark:text-rose-300' },
];

export async function getCrmStages(): Promise<CrmStage[]> {
  const stages = await readData<CrmStage[]>(STAGES_FILE, defaultStages);
  return stages.sort((a, b) => a.order - b.order);
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  const leads = await readData<CrmLead[]>(LEADS_FILE, []);
  return leads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addCrmLead(
  leadData: NewCrmLeadData
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name.trim()) {
    return { success: false, error: 'El nombre del prospecto es obligatorio.' };
  }
  if (!leadData.phone?.trim() && !leadData.email?.trim()) {
    return { success: false, error: 'Se requiere al menos un método de contacto (teléfono o email).' };
  }
  const leads = await getCrmLeads();
  
  const stages = await getCrmStages();
  const now = new Date().toISOString();
  
  const stageId = leadData.currentStageId || stages[0]?.id || 's1';
  const stageName = stages.find(s => s.id === stageId)?.name || 'Etapa desconocida';

  // Construct notes from optional fields
  let combinedNotes = leadData.notes?.trim() || '';
  if (leadData.partyType) combinedNotes += `\n- Tipo de Fiesta: ${leadData.partyType}`;
  if (leadData.venueName) combinedNotes += `\n- Salón: ${leadData.venueName}`;
  if (leadData.guestCount) combinedNotes += `\n- Invitados: ${leadData.guestCount}`;

  const newLead: CrmLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: leadData.name.trim(),
    email: leadData.email?.trim() || undefined,
    phone: leadData.phone?.trim() || undefined,
    notes: combinedNotes.trim() || undefined,
    partyType: leadData.partyType?.trim() || undefined,
    venueName: leadData.venueName?.trim() || undefined,
    guestCount: leadData.guestCount,
    currentStageId: stageId,
    createdAt: now,
    updatedAt: now,
    history: [{ stageId: stageId, stageName, timestamp: now }],
  };
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);
  return { success: true, lead: newLead };
}

export async function moveCrmLead(
  leadId: string,
  newStageId: string
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  let leads = await getCrmLeads();
  const stages = await getCrmStages(); 
  const leadIndex = leads.findIndex(l => l.id === leadId);

  if (leadIndex === -1) {
    return { success: false, error: `Prospecto con ID ${leadId} no encontrado.` };
  }
  
  const newStageName = stages.find(s => s.id === newStageId)?.name || 'Etapa desconocida';
  const now = new Date().toISOString();

  const updatedLead = {
    ...leads[leadIndex],
    currentStageId: newStageId,
    updatedAt: now,
    history: [
      ...(leads[leadIndex].history || []),
      { stageId: newStageId, stageName: newStageName, timestamp: now }
    ],
  };

  leads[leadIndex] = updatedLead;

  await writeData(LEADS_FILE, leads);
  return { success: true, lead: updatedLead };
}

export async function deleteCrmLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    let leads = await getCrmLeads();
    const initialLength = leads.length;
    leads = leads.filter(lead => lead.id !== leadId);

    if (leads.length === initialLength) {
        return { success: false, error: `Prospecto con ID ${leadId} no encontrado para eliminar.` };
    }
    await writeData(LEADS_FILE, leads);
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
  await writeData(STAGES_FILE, stages);
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
  const contractFile = formData.get('contract') as File | null;

  if (!prospectId || !prospectName) {
    return { success: false, error: "Faltan datos del prospecto." };
  }
  if (!contractFile || contractFile.size === 0) {
    return { success: false, error: "El archivo del contrato es obligatorio y no puede estar vacío." };
  }
  
  const stages = await getCrmStages();
  const firmStage = stages.find(s => s.name === 'Firmó contrato');
  if (!firmStage) {
      return { success: false, error: "La etapa 'Firmó contrato' no está configurada."};
  }

  const customerFormData = new FormData();
  customerFormData.append('name', prospectName); 
  if (email) customerFormData.append('email', email);
  if (phone) customerFormData.append('phone', phone);
  if (companyName) customerFormData.append('companyName', companyName);
  if (taxId) customerFormData.append('taxId', taxId);
  customerFormData.append('contract', contractFile);

  try {
    const customerResult = await saveCustomer(customerFormData);

    if (!customerResult.success || !customerResult.id) {
      return { success: false, error: customerResult.error || "No se pudo crear el cliente." };
    }

    const moveResult = await moveCrmLead(prospectId, firmStage.id);
    if (!moveResult.success) {
      console.warn(`Cliente ${customerResult.id} creado, pero no se pudo mover el prospecto ${prospectId}. Error: ${moveResult.error}`);
      return { success: false, error: `Cliente creado, pero no se pudo actualizar el prospecto: ${moveResult.error}`, customerId: customerResult.id };
    }
    
    const newFiestaResult = await createNewFiestaForCustomer(customerResult.customer as Customer);
     if (!newFiestaResult.success) {
        console.error(`Cliente y prospecto actualizados, pero falló la creación automática de la nueva fiesta para el cliente ${customerResult.id}: ${newFiestaResult.error}`);
    }

    return { success: true, customerId: customerResult.id, lead: moveResult.lead };

  } catch (error: any) {
    console.error("Error in convertToClientAndMoveProspect:", error);
    return { success: false, error: error.message || "Error desconocido durante la conversión." };
  }
}
