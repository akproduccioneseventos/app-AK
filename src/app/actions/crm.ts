
'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer } from '@/app/actions/customers'; 
import type { Customer } from '@/types/customer'; 
import { createNewFiestaForCustomer } from '@/app/actions/fiesta/fiesta.actions';
import { activateAnnualAdjustmentForBudget, getPresupuestos } from './presupuestos';
import { addReunion } from './fiesta/reuniones.actions';
import { createNotification } from './notifications';

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
  let leads = await readData<CrmLead[]>(LEADS_FILE, []);
  let needsWrite = false;

  try {
    const allBudgets = await getPresupuestos();
    const allStages = await getCrmStages();
    const targetStage = allStages.find(stage => stage.name.toLowerCase() === 'con presupuesto');
    const targetStageId = targetStage?.id || allStages[0]?.id;
    
    // Filter budgets that came from the simulator (more robust search)
    const simulatorBudgets = allBudgets.filter(p => p.notas?.toLowerCase().includes('simulador'));
    
    if (targetStageId) {
        for (const budget of simulatorBudgets) {
            const budgetIdInNotes = `Presupuesto ID: ${budget.id}`;
            const leadExists = leads.some(lead => lead.notes?.includes(budgetIdInNotes));
            
            if (!leadExists) {
                let notes = `Generado desde el Simulador.\n- ${budgetIdInNotes}\n- Invitados: ${budget.invitadosAdultos || 0} Adultos, ${budget.invitadosNinos || 0} Niños/Adol.\n- Costo Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(budget.totalConDescuento ?? budget.costoTotalEstimado)}`;
                
                const newLead: CrmLead = {
                    id: `lead_recovered_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: budget.clienteNombre,
                    phone: budget.clienteContacto,
                    notes: notes,
                    currentStageId: targetStageId,
                    createdAt: budget.timestamp,
                    updatedAt: new Date().toISOString(),
                    history: [{ stageId: targetStageId, stageName: targetStage.name, timestamp: new Date().toISOString() }],
                };
                leads.push(newLead);
                needsWrite = true;
                console.log(`Recuperando prospecto para el presupuesto ${budget.id}`);
            }
        }
    }

    if (needsWrite) {
      await writeData(LEADS_FILE, leads);
    }

  } catch (error) {
    console.error("Error durante la recuperación de prospectos desde presupuestos:", error);
  }
  
  return leads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function addCrmLead(
  leadData: NewCrmLeadData
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name.trim()) {
    return { success: false, error: 'El nombre del prospecto es obligatorio.' };
  }
  const leads = await getCrmLeads();

  const isDuplicate = leads.some(lead => lead.name.trim().toLowerCase() === leadData.name.trim().toLowerCase());
  if (isDuplicate) {
    return { success: false, error: `Ya existe un prospecto con el nombre "${leadData.name.trim()}".` };
  }
  
  const stages = await getCrmStages();
  const now = new Date().toISOString();
  
  const stageId = leadData.currentStageId || stages[0]?.id || 's1';
  const stageName = stages.find(s => s.id === stageId)?.name || 'Etapa desconocida';

  // Construct notes from optional fields
  let combinedNotes = leadData.notes?.trim() || '';
  if (leadData.partyType) combinedNotes += `\n- Tipo de Fiesta: ${leadData.partyType}`;
  if (leadData.venueName) combinedNotes += `\n- Salón: ${leadData.venueName}`;
  if (leadData.guestCount) combinedNotes += `\n- Invitados: ${leadData.guestCount}`;
  if (leadData.followUpDate) combinedNotes += `\n- Fecha Evento: ${new Date(leadData.followUpDate).toLocaleDateString('es-ES')}`;

  const newLead: CrmLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: leadData.name.trim(),
    email: leadData.email?.trim() || undefined,
    phone: leadData.phone?.trim() || undefined,
    notes: combinedNotes.trim() || undefined,
    partyType: leadData.partyType?.trim() || undefined,
    venueName: leadData.venueName?.trim() || undefined,
    guestCount: leadData.guestCount,
    followUpDate: leadData.followUpDate,
    currentStageId: stageId,
    createdAt: now,
    updatedAt: now,
    history: [{ stageId: stageId, stageName, timestamp: now }],
  };
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);
  
  // Create a notification for the new lead
  await createNotification({
    mensaje: `Nuevo prospecto añadido: ${newLead.name}`,
    href: '/contabilidad/crm',
    icono: 'KanbanSquare',
  });

  return { success: true, lead: newLead };
}

export async function moveCrmLead(
  leadId: string,
  newStageId: string,
  meetingDate?: string,
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  let leads = await getCrmLeads();
  const stages = await getCrmStages(); 
  const leadIndex = leads.findIndex(l => l.id === leadId);

  if (leadIndex === -1) {
    return { success: false, error: `Prospecto con ID ${leadId} no encontrado.` };
  }
  
  const newStageName = stages.find(s => s.id === newStageId)?.name || 'Etapa desconocida';
  const now = new Date().toISOString();

  let currentNotes = leads[leadIndex].notes || '';
  if (meetingDate) {
      let meetingNote = '';
      if (newStageName.toLowerCase().includes('entrevista')) {
          meetingNote = `\nREUNIÓN DE ENTREVISTA: ${new Date(meetingDate).toLocaleString('es-UY')}`;
      } else if (newStageName.toLowerCase().includes('contrato')) {
          meetingNote = `\nREUNIÓN DE FIRMA DE CONTRATO: ${new Date(meetingDate).toLocaleString('es-UY')}`;
      }
      currentNotes = `${meetingNote}\n---\n${currentNotes}`;
      leads[leadIndex].followUpDate = meetingDate;
  }

  const updatedLead = {
    ...leads[leadIndex],
    currentStageId: newStageId,
    updatedAt: now,
    notes: currentNotes.trim(),
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
  const meetingDate = formData.get('meetingDate') as string | undefined;

  if (!prospectId || !prospectName) {
    return { success: false, error: "Faltan datos del prospecto." };
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
  if (contractFile && contractFile.size > 0) {
    customerFormData.append('contract', contractFile);
  }

  try {
    const customerResult = await saveCustomer(customerFormData);

    if (!customerResult.success || !customerResult.id || !customerResult.customer) {
      return { success: false, error: customerResult.error || "No se pudo crear el cliente." };
    }
    
    // Create or retrieve the fiesta for the new customer
    const newFiestaResult = await createNewFiestaForCustomer(customerResult.customer);
    if (!newFiestaResult.success || !newFiestaResult.fiesta) {
        console.error(`Cliente y prospecto actualizados, pero falló la creación automática de la nueva fiesta para el cliente ${customerResult.id}: ${newFiestaResult.error}`);
        // Continue but warn about it
    } else if (meetingDate) {
        // If a meeting was scheduled, add it to the newly created Fiesta's reunions
        await addReunion({
            fiestaId: newFiestaResult.fiesta.id, // Associate reunion with the new fiesta
            titulo: `Reunión de Firma de Contrato`,
            fecha: new Date(meetingDate).toISOString(),
            notas: `Reunión agendada desde el CRM al convertirse en cliente.`,
        });
    }

    // Now, activate adjustment on the associated budget
    if (newFiestaResult.fiesta?.presupuestoId) {
      const budgetActivationResult = await activateAnnualAdjustmentForBudget(newFiestaResult.fiesta.presupuestoId);
      if (!budgetActivationResult.success) {
        console.warn(`Ajuste anual no activado para presupuesto ${newFiestaResult.fiesta.presupuestoId}. Error: ${budgetActivationResult.error}`);
        // Don't fail the whole operation, just log a warning
      }
    }

    const moveResult = await moveCrmLead(prospectId, firmStage.id, meetingDate);
    if (!moveResult.success) {
      console.warn(`Cliente ${customerResult.id} creado, pero no se pudo mover el prospecto ${prospectId}. Error: ${moveResult.error}`);
      return { success: false, error: `Cliente creado, pero no se pudo actualizar el prospecto: ${moveResult.error}`, customerId: customerResult.id };
    }

    return { success: true, customerId: customerResult.id, lead: moveResult.lead };

  } catch (error: any) {
    console.error("Error in convertToClientAndMoveProspect:", error);
    return { success: false, error: error.message || "Error desconocido durante la conversión." };
  }
}
