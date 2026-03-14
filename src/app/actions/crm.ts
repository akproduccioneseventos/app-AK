'use server';

import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import { readData, writeData } from '@/lib/data-service';
import { saveCustomer } from '@/app/actions/customers'; 
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from './notifications';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';

const LEADS_FILE = 'crm-leads.json';
const STAGES_FILE = 'crm-stages.json';

const defaultStages: CrmStage[] = [
  { id: 's1', name: 'Consultó', order: 1, headerBgColor: "bg-sky-500", headerTextColor: 'text-sky-50', bgColor: 'bg-sky-100', borderColor: 'border-sky-500', textColor: 'text-sky-700' },
  { id: 's2', name: 'Agendó entrevista', order: 2, headerBgColor: "bg-teal-500", headerTextColor: 'text-teal-50', bgColor: 'bg-teal-100', borderColor: 'border-teal-500', textColor: 'text-teal-700' },
  { id: 's3', name: 'Con presupuesto', order: 3, headerBgColor: "bg-amber-500", headerTextColor: 'text-amber-900', bgColor: 'bg-amber-100', borderColor: 'border-amber-500', textColor: 'text-amber-700' },
  { id: 's4', name: 'Firmó contrato', order: 4, headerBgColor: "bg-emerald-500", headerTextColor: 'text-emerald-50', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-500', textColor: 'text-emerald-700', isConversionStage: true },
  { id: 's5', name: 'No contrató', order: 5, headerBgColor: "bg-rose-500", headerTextColor: 'text-rose-50', bgColor: 'bg-rose-100', borderColor: 'border-rose-500', textColor: 'text-rose-700' },
];

export async function getCrmStages(): Promise<CrmStage[]> {
  return readData<CrmStage[]>(STAGES_FILE, defaultStages);
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  return readData<CrmLead[]>(LEADS_FILE, []);
}

export async function addCrmLead(leadData: NewCrmLeadData): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  if (!leadData.name?.trim()) return { success: false, error: 'Nombre obligatorio' };
  const leads = await getCrmLeads();
  const stages = await getCrmStages();
  const now = new Date().toISOString();
  
  const newLead: CrmLead = {
    ...leadData,
    id: `lead_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    currentStageId: leadData.currentStageId || stages[0].id
  };
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);
  return { success: true, lead: newLead };
}

export async function moveCrmLead(leadId: string, newStageId: string, meetingDate?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
  let leads = await getCrmLeads();
  const index = leads.findIndex(l => l.id === leadId);
  if (index === -1) return { success: false, error: "No encontrado" };
  
  leads[index].currentStageId = newStageId;
  leads[index].updatedAt = new Date().toISOString();
  if (meetingDate) leads[index].followUpDate = meetingDate;

  await writeData(LEADS_FILE, leads);
  return { success: true, lead: leads[index] };
}

export async function scheduleCrmMeeting(leadId: string, date: string, title?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    let leads = await getCrmLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) return { success: false, error: "Prospecto no encontrado" };

    leads[index].followUpDate = date;
    leads[index].updatedAt = new Date().toISOString();
    if (title) {
        const existingNotes = leads[index].notes || '';
        leads[index].notes = `${existingNotes}\n[REUNIÓN AGENDADA: ${title} para el ${new Date(date).toLocaleString('es-ES')}]`.trim();
    }

    await writeData(LEADS_FILE, leads);
    return { success: true, lead: leads[index] };
}

export async function deleteCrmLead(leadId: string): Promise<{ success: boolean; error?: string }> {
    let leads = await getCrmLeads();
    const initialLength = leads.length;
    leads = leads.filter(l => l.id !== leadId);
    if (leads.length === initialLength) return { success: false, error: "No encontrado" };
    await writeData(LEADS_FILE, leads);
    return { success: true };
}

export async function confirmBooking(leadId: string, presupuestoId: string): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const [leads, presupuesto, stages] = await Promise.all([
      getCrmLeads(),
      getPresupuestoById(presupuestoId),
      getCrmStages()
    ]);

    const lead = leads.find(l => l.id === leadId);
    if (!lead || !presupuesto) throw new Error("Datos no encontrados");

    const conversionStage = stages.find(s => s.isConversionStage);

    // 1. Crear Cliente
    const customerResult = await saveCustomer({
      name: lead.name,
      phone: lead.phone,
      estadoCliente: 'Actual',
      partyDate: presupuesto.eventoFecha,
      partyType: presupuesto.eventoTipo,
      venueName: presupuesto.salonFiestas,
      guestCount: presupuesto.invitadosCantidad
    });

    if (!customerResult.success || !customerResult.id) throw new Error(customerResult.error);

    // 2. Crear Fiesta
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}`,
      estado: 'Contratada',
      presupuestoId: presupuesto.id,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customerResult.id,
        nombreEvento: `${presupuesto.eventoTipo} de ${lead.name}`,
        fechaEvento: presupuesto.eventoFecha,
        nombreLugar: presupuesto.salonFiestas,
        invitadosEstimados: presupuesto.invitadosCantidad,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      }
    };
    
    newFiesta.modulosContratados = { ...defaultModulosContratados };

    await saveFiesta(newFiesta);

    // 3. Actualizar Presupuesto
    await updatePresupuesto({ ...presupuesto, estado: 'Aceptado' });

    // 4. Mover Lead
    if (conversionStage) await moveCrmLead(lead.id, conversionStage.id);

    await createNotification({
      mensaje: `¡Contratación Confirmada! ${lead.name} es ahora cliente.`,
      href: `/fiestas/nueva?fiestaId=${newFiesta.id}`,
      icono: 'PartyPopper'
    });

    return { success: true, fiestaId: newFiesta.id };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCrmKpiData() {
    const [leads, presupuestos] = await Promise.all([getCrmLeads(), readData<any[]>('presupuestos.json', [])]);
    const activeLeads = leads.filter(l => l.currentStageId !== 's4' && l.currentStageId !== 's5');
    const pipelineValue = presupuestos
        .filter(p => activeLeads.some(l => l.presupuestoId === p.id))
        .reduce((sum, p) => sum + (p.totalConDescuento ?? p.costoTotalEstimado), 0);

    const wonCount = leads.filter(l => l.currentStageId === 's4').length;
    const lostCount = leads.filter(l => l.currentStageId === 's5').length;
    const totalFinished = wonCount + lostCount;

    return {
        success: true,
        data: {
            activeLeads: activeLeads.length,
            pipelineValue,
            conversionRate: totalFinished > 0 ? (wonCount / totalFinished) * 100 : 0,
            wonLeads: wonCount,
            lostLeads: lostCount
        }
    };
}

export async function findLeadByBudgetOrCreate(presupuesto: any) {
    const leads = await getCrmLeads();
    const stages = await getCrmStages();
    
    // Normalizar datos de búsqueda para evitar duplicados
    const searchName = presupuesto.clienteNombre?.toLowerCase().trim();
    const searchPhone = presupuesto.clienteContacto?.replace(/\D/g, '').slice(-9);

    // 1. Intentar encontrar por ID vinculada o ID de presupuesto
    let leadIndex = leads.findIndex(l => 
        (presupuesto.leadId && l.id === presupuesto.leadId) || 
        (l.presupuestoId === presupuesto.id)
    );
    
    // 2. Intentar encontrar por Nombre o Teléfono Normalizado (Evita duplicados)
    if (leadIndex === -1 && (searchName || searchPhone)) {
        leadIndex = leads.findIndex(l => {
            const leadName = l.name?.toLowerCase().trim();
            const leadPhone = l.phone?.replace(/\D/g, '').slice(-9);
            return (searchName && leadName === searchName) || 
                   (searchPhone && leadPhone && leadPhone === searchPhone);
        });
    }

    if (leadIndex === -1) {
        // Crear nuevo si no se encuentra nada
        const res = await addCrmLead({
            name: presupuesto.clienteNombre,
            phone: presupuesto.clienteContacto,
            presupuestoId: presupuesto.id,
            presupuestoEstado: presupuesto.estado,
            partyType: presupuesto.eventoTipo,
            venueName: presupuesto.salonFiestas,
            guestCount: presupuesto.invitadosCantidad,
            budgetSource: presupuesto.source || 'manual',
            currentStageId: stages[0].id
        } as NewCrmLeadData);
        return { lead: res.lead!, isNew: true };
    } else {
        // Actualizar datos del lead existente (Sincronización Inteligente)
        const lead = leads[leadIndex];
        lead.presupuestoId = presupuesto.id;
        lead.presupuestoEstado = presupuesto.estado;
        if (presupuesto.invoiceId) lead.invoiceId = presupuesto.invoiceId;
        
        // Sincronizar campos si estaban vacíos
        if (!lead.phone && presupuesto.clienteContacto) lead.phone = presupuesto.clienteContacto;
        if (!lead.partyType) lead.partyType = presupuesto.eventoTipo;
        if (!lead.venueName) lead.venueName = presupuesto.salonFiestas;
        
        // Progresión automática de etapas
        if ((presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado')) {
            const conversionStage = stages.find(s => s.isConversionStage);
            if (conversionStage) lead.currentStageId = conversionStage.id;
        } else if (presupuesto.estado === 'Enviado' && lead.currentStageId === stages[0].id) {
            const budgetStage = stages.find(s => s.name.toLowerCase().includes('presupuesto'));
            if (budgetStage) lead.currentStageId = budgetStage.id;
        }

        lead.updatedAt = new Date().toISOString();
        await writeData(LEADS_FILE, leads);
        return { lead, isNew: false };
    }
}
