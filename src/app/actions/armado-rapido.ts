
'use server';

import type { ArmadoRapidoConfig, LeadFromQuickBudget } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import { addCrmLead, getCrmStages } from './crm';
import { savePresupuesto } from './presupuestos';
import type { ItemPresupuestado, Presupuesto } from '@/types/presupuesto';

const CONFIG_FILE = 'armado-rapido-config.json';
const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: 0,
  paquetes: [],
  menus: [],
  platosVisibles: [], // Initialize with an empty array
};

export async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  const config = await readData<ArmadoRapidoConfig>(CONFIG_FILE, defaultConfig);
  return { ...defaultConfig, ...config };
}

export async function saveArmadoRapidoConfig(
  newConfigData: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitizedConfig: ArmadoRapidoConfig = {
      ...newConfigData,
      paquetes: (newConfigData.paquetes || []).map(pkg => ({
        id: pkg.id,
        nombre: pkg.nombre,
        descripcion: pkg.descripcion,
        serviciosIncluidos: pkg.serviciosIncluidos.map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      menus: (newConfigData.menus || []).map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        serviciosIncluidos: menu.serviciosIncluidos.map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      platosVisibles: newConfigData.platosVisibles || [], // Ensure this is saved
    };
    await writeData(CONFIG_FILE, sanitizedConfig);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}

export async function generateBudgetAndLeadFromSimulator(
  data: LeadFromQuickBudget & { items: Omit<ItemPresupuestado, 'costoTotalItem'>[] }
): Promise<{ success: boolean; leadId?: string; presupuestoId?: string; error?: string }> {
  try {
    // 1. Create and save the Presupuesto
    const presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId' | 'costoTotalEstimado' | 'totalConDescuento' | 'ajusteAnualActivo'> = {
      clienteNombre: data.clienteNombre,
      clienteContacto: data.clienteContacto,
      eventoTipo: 'Evento (desde Simulador)',
      eventoFecha: new Date().toISOString(), // Use current date as placeholder
      invitadosCantidad: data.adultos + data.ninos,
      invitadosAdultos: data.adultos,
      invitadosNinos: data.ninos,
      salonFiestas: 'A definir',
      itemsPresupuestados: data.items.map(item => ({...item, costoTotalItem: 0})), // cost will be recalculated
      timestamp: new Date().toISOString(),
      notas: `Presupuesto generado automáticamente desde el Simulador de Presupuestos. Paquete seleccionado: ${data.paqueteNombre || 'N/A'}.`,
    };

    const budgetResult = await savePresupuesto(presupuestoData);
    if (!budgetResult.success || !budgetResult.presupuesto) {
      return { success: false, error: budgetResult.error || "No se pudo crear el presupuesto." };
    }
    
    // 2. Create the CRM Lead, linking it to the new budget
    const allStages = await getCrmStages();
    const targetStage = allStages.find(stage => stage.name.toLowerCase() === 'con presupuesto');
    
    // If "Con presupuesto" stage is not found, fallback to the first stage.
    const targetStageId = targetStage?.id || allStages[0]?.id;

    if (!targetStageId) {
        return { success: false, error: "No hay etapas configuradas en el CRM." };
    }
    
    let notes = `Generado desde el Simulador de Presupuestos.\n- Presupuesto ID: ${budgetResult.id}\n- Invitados: ${data.adultos} Adultos, ${data.ninos} Niños/Adol.\n- Costo Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(data.costoEstimado)}`;
    if (data.paqueteNombre) {
      notes += `\n- Paquete de Servicios: "${data.paqueteNombre}"`;
    }
    
    const leadResult = await addCrmLead({
      name: data.clienteNombre,
      phone: data.clienteContacto,
      notes: notes,
      currentStageId: targetStageId,
    });

    if (leadResult.success && leadResult.lead) {
      return { success: true, leadId: leadResult.lead.id, presupuestoId: budgetResult.id };
    } else {
      // Budget was created but lead failed. This is a partial success state.
      // For simplicity, we'll return an error, but in a real-world scenario, this might need compensation logic.
      return { success: false, error: leadResult.error || "Presupuesto creado, pero no se pudo crear el prospecto en el CRM." };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al generar el prospecto y presupuesto." };
  }
}
