

'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer } from '@/app/actions/customers'; 
import type { Customer } from '@/types/customer'; 
import { createNewFiestaForCustomer } from '@/app/actions/fiesta/fiesta.actions';
import { activateAnnualAdjustmentForBudget, getPresupuestos, updatePresupuesto } from './presupuestos';
import { addReunion } from './fiesta/reuniones.actions';
import { createNotification } from './notifications';
import type { Presupuesto } from '@/types/presupuesto';

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
  const [leads, presupuestos] = await Promise.all([
    readData<CrmLead[]>(LEADS_FILE, []),
    getPresupuestos(),
  ]);

  const presupuestosMap = new Map(presupuestos.map(p => [p.id, p]));

  const leadsWithData = leads.map(lead => {
    const presupuesto = lead.presupuestoId ? presupuestosMap.get(lead.presupuestoId) : undefined;
    return {
      ...lead,
      presupuestoId: lead.presupuestoId, // Ensure presupuestoId is always passed through
      presupuestoEstado: presupuesto?.estado,
      invoiceId: presupuesto?.invoiceId,
    };
  });

  return leadsWithData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function addCrmLead(
  leadData: NewCrmLeadData,
  options: { preventDuplicateCheck?: boolean } = {}
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name?.trim()) {
    return { success: false, error: 'El nombre del prospecto es obligatorio.' };
  }
  const leads = await getCrmLeads();

  if (!options.preventDuplicateCheck) {
    const existingLead = leads.find(lead => 
      lead.name.trim().toLowerCase() === leadData.name!.trim().toLowerCase() && 
      !lead.presupuestoId // Only block if it's a general lead without a budget
    );
    if (existingLead && !leadData.id) { // Only block if creating a new one
         return { success: false, error: `Ya existe un prospecto con el nombre "${leadData.name.trim()}".` };
    }
  }
  
  const stages = await getCrmStages();
  const now = new Date().toISOString();
  
  const stageId = leadData.currentStageId || stages[0]?.id || 's1';
  const stageName = stages.find(s => s.id === stageId)?.name || 'Etapa desconocida';

  let combinedNotes = leadData.notes?.trim() || '';
  
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
    presupuestoId: leadData.presupuestoId || undefined,
    currentStageId: stageId,
    createdAt: now,
    updatedAt: now,
    history: [{ stageId: stageId, stageName, timestamp: now }],
  };
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);
  
  if (newLead.presupuestoId) {
    await createNotification({
      mensaje: `Nuevo prospecto y presupuesto de ${newLead.name}`,
      href: `/contabilidad/crm?leadId=${newLead.id}`,
      icono: 'KanbanSquare',
    });
  }

  return { success: true, lead: newLead };
}

export async function findLeadByBudgetOrCreate(
  presupuestoData: Presupuesto
): Promise<{lead: CrmLead; isNew: boolean}> {
  const allLeads = await readData<CrmLead[]>(LEADS_FILE, []);
  let existingLead: CrmLead | null = null;
  
  if (presupuestoData.leadId) {
    existingLead = allLeads.find(lead => lead.id === presupuestoData.leadId) || null;
  }
  if (!existingLead) {
    existingLead = allLeads.find(lead => lead.presupuestoId === presupuestoData.id) || null;
  }
  
  if (existingLead) {
    let leadNeedsUpdate = false;
    const updates: Partial<CrmLead> = {};

    if (existingLead.presupuestoId !== presupuestoData.id) {
       updates.presupuestoId = presupuestoData.id;
       leadNeedsUpdate = true;
    }
    if (existingLead.name !== presupuestoData.clienteNombre) {
       updates.name = presupuestoData.clienteNombre;
       leadNeedsUpdate = true;
    }
    if (presupuestoData.clienteContacto && existingLead.phone !== presupuestoData.clienteContacto) {
        updates.phone = presupuestoData.clienteContacto;
        leadNeedsUpdate = true;
    }

    if (leadNeedsUpdate) {
        const leadIndex = allLeads.findIndex(l => l.id === existingLead!.id);
        if (leadIndex !== -1) {
            allLeads[leadIndex] = { ...allLeads[leadIndex], ...updates };
            await writeData(LEADS_FILE, allLeads);
            return { lead: allLeads[leadIndex], isNew: false };
        }
    }
    return { lead: existingLead, isNew: false };
  }

  // If no lead exists, create a new one
  const newLeadData: NewCrmLeadData = {
    name: presupuestoData.clienteNombre,
    phone: presupuestoData.clienteContacto,
    notes: `Presupuesto Nº ${presupuestoData.numero || presupuestoData.id.slice(-5)}\nCosto: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(presupuestoData.totalConDescuento ?? presupuestoData.costoTotalEstimado)}`,
    currentStageId: 's1', 
    presupuestoId: presupuestoData.id,
  };

  const result = await addCrmLead(newLeadData, { preventDuplicateCheck: true });
  if (!result.success || !result.lead) {
    console.error("Failed to create a new CRM lead from budget:", result.error);
    throw new Error('Failed to create a new lead for the budget.');
  }

  // **CRUCIAL FIX**: Ensure the newly created lead's ID is saved back to the budget object.
  const newLead = result.lead;
  const updatedBudget: Presupuesto = { ...presupuestoData, leadId: newLead.id };
  await updatePresupuesto(updatedBudget);

  return { lead: newLead, isNew: true };
}

export async function scheduleCrmMeeting(
  leadId: string,
  meetingDate: string,
  meetingTitle: string
): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  let leads = await readData<CrmLead[]>(LEADS_FILE, []);
  const leadIndex = leads.findIndex(l => l.id === leadId);

  if (leadIndex === -1) {
    return { success: false, error: `Prospecto con ID ${leadId} no encontrado.` };
  }
  
  const now = new Date().toISOString();
  let currentNotes = leads[leadIndex].notes || '';
  const meetingNote = `\nREUNIÓN: ${meetingTitle} - ${new Date(meetingDate).toLocaleString('es-UY')}`;
  
  const updatedLead = {
    ...leads[leadIndex],
    followUpDate: meetingDate,
    updatedAt: now,
    notes: `${meetingNote}\n---\n${currentNotes}`.trim(),
  };

  leads[leadIndex] = updatedLead;

  await writeData(LEADS_FILE, leads);
  return { success: true, lead: updatedLead };
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
    let leads = await readData<CrmLead[]>(LEADS_FILE, []); // Read fresh data
    const initialLength = leads.length;
    leads = leads.filter(lead => lead.id !== leadId);

    if (leads.length === initialLength) {
        return { success: false, error: `Prospecto con ID ${leadId} no encontrado.` };
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
  const firmStage = stages.find(s => s.isConversionStage);
  if (!firmStage) {
      return { success: false, error: "La etapa de conversión ('Firmó contrato') no está configurada."};
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
    
    const newFiestaResult = await createNewFiestaForCustomer(customerResult.customer);
    if (!newFiestaResult.success || !newFiestaResult.fiesta) {
        console.error(`Cliente y prospecto actualizados, pero falló la creación automática de la nueva fiesta para el cliente ${customerResult.id}: ${newFiestaResult.error}`);
    } else if (meetingDate) {
        await addReunion({
            fiestaId: newFiestaResult.fiesta.id,
            titulo: `Reunión de Firma de Contrato`,
            fecha: new Date(meetingDate).toISOString(),
            notas: `Reunión agendada desde el CRM al convertirse en cliente.`,
        });
    }

    if (newFiestaResult.fiesta?.presupuestoId) {
      const budgetActivationResult = await activateAnnualAdjustmentForBudget(newFiestaResult.fiesta.presupuestoId);
      if (!budgetActivationResult.success) {
        console.warn(`Ajuste anual no activado para presupuesto ${newFiestaResult.fiesta.presupuestoId}. Error: ${budgetActivationResult.error}`);
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

export async function getCrmKpiData() {
  try {
    const [leads, stages, presupuestos] = await Promise.all([
      getCrmLeads(),
      getCrmStages(),
      getPresupuestos(),
    ]);

    const conversionStageIds = stages.filter(s => s.isConversionStage).map(s => s.id);
    const lostStageIds = stages.filter(s => s.name.toLowerCase().includes('no contrató')).map(s => s.id);
    
    const activeLeads = leads.filter(l => !conversionStageIds.includes(l.currentStageId) && !lostStageIds.includes(l.currentStageId));
    const activeLeadsCount = activeLeads.length;

    const wonLeads = leads.filter(l => conversionStageIds.includes(l.currentStageId)).length;
    const lostLeads = leads.filter(l => lostStageIds.includes(l.currentStageId)).length;
    const concludedLeads = wonLeads + lostLeads;

    const conversionRate = concludedLeads > 0 ? (wonLeads / concludedLeads) * 100 : 0;
    
    const activePresupuestoIds = new Set(activeLeads.map(l => l.presupuestoId).filter(Boolean));
    const pipelineValue = presupuestos
      .filter(p => activePresupuestoIds.has(p.id) && p.estado !== 'Facturado' && p.estado !== 'Rechazado')
      .reduce((sum, p) => sum + (p.totalConDescuento ?? p.costoTotalEstimado), 0);

    return {
      success: true,
      data: {
        activeLeads: activeLeadsCount,
        pipelineValue: pipelineValue,
        conversionRate: conversionRate,
        wonLeads: wonLeads,
        lostLeads: lostLeads,
      },
    };
  } catch (error: any) {
    return { success: false, error: 'Failed to calculate CRM KPIs.' };
  }
}

  
    
