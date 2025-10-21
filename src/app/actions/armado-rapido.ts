

'use server';

import type { ArmadoRapidoConfig, LeadFromQuickBudget } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import { savePresupuesto } from './presupuestos';
import type { ItemPresupuestado, Presupuesto } from '@/types/presupuesto';
import { createNotification } from './notifications';

const CONFIG_FILE = 'armado-rapido-config.json';
const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: 0,
  paquetes: [],
  menus: [],
  platosVisibles: [],
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
      platosVisibles: newConfigData.platosVisibles || [],
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
    const presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId' > = {
      clienteNombre: data.clienteNombre,
      clienteContacto: data.clienteContacto,
      eventoTipo: 'Evento (desde Simulador)',
      eventoFecha: new Date().toISOString(), // Placeholder
      invitadosCantidad: (data.adultos || 0) + (data.ninos || 0),
      invitadosAdultos: data.adultos,
      invitadosNinos: data.ninos,
      salonFiestas: 'A definir',
      itemsPresupuestados: data.items.map(item => ({...item, costoTotalItem: 0})), // cost is recalculated server-side
      timestamp: new Date().toISOString(),
      notas: `Presupuesto generado desde el Simulador. Paquete: ${data.paqueteNombre || 'N/A'}. Costo estimado: ${formatCurrency(data.costoEstimado)}`,
      costoTotalEstimado: data.costoEstimado,
    };

    // This call ALWAYS creates a new prospect because leadId is undefined.
    const budgetResult = await savePresupuesto(presupuestoData, {
      source: 'simulator',
      leadId: undefined, // Explicitly undefined to ensure a new lead is created
    });

    if (budgetResult.success && budgetResult.id) {
       await createNotification({
        mensaje: `Nuevo prospecto desde Simulador: ${data.clienteNombre}`,
        href: `/contabilidad/crm`, // Direct link to CRM to see the new lead
        icono: 'Wand2',
      });
      return { success: true, presupuestoId: budgetResult.id, leadId: budgetResult.leadId };
    } else {
      return { success: false, error: budgetResult.error || "No se pudo procesar la solicitud." };
    }
  } catch (error: any) {
    console.error("Error in generateBudgetAndLeadFromSimulator:", error);
    return { success: false, error: error.message || "Error al generar el prospecto y presupuesto." };
  }
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};
