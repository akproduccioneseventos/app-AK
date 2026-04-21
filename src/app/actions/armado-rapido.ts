'use server';

import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ArmadoRapidoConfig, LeadFromQuickBudget, ServiceDependency } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import { savePresupuesto } from './presupuestos';
import type { ItemPresupuestado, Presupuesto } from '@/types/presupuesto';
import { createNotification } from './notifications';

const CONFIG_FILE = 'armado-rapido-config.json';
const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: 15,
  paquetes: [],
  menus: [],
  platosVisibles: [],
  serviceDependencies: [],
  mostrarPrecios: true,
  clubUruguayConfig: defaultClubUruguayConfig,
};

export async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  const config = await readData<ArmadoRapidoConfig>(CONFIG_FILE, defaultConfig);
  return {
    ...defaultConfig,
    ...config,
    clubUruguayConfig: {
      ...defaultClubUruguayConfig,
      ...(config?.clubUruguayConfig || {}),
      prestaciones: (config?.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones)
        .map((p) => p.trim())
        .filter(Boolean),
    },
  };
}

export async function saveArmadoRapidoConfig(
  newConfigData: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitizedConfig: ArmadoRapidoConfig = {
      ...newConfigData,
      paquetes: (newConfigData.paquetes || []).map(pkg => ({
        id: pkg.id,
        nombre: (pkg.nombre || '').trim(),
        descripcion: (pkg.descripcion || '').trim(),
        recommended: pkg.recommended || false,
        tiposDeEventoAplicables: (pkg.tiposDeEventoAplicables || [])
          .map((tipo) => tipo.trim())
          .filter(Boolean),
        serviciosIncluidos: (pkg.serviciosIncluidos || []).map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      menus: (newConfigData.menus || []).map(menu => ({
        id: menu.id,
        nombre: (menu.nombre || '').trim(),
        descripcion: (menu.descripcion || '').trim(),
        serviciosIncluidos: (menu.serviciosIncluidos || []).map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      platosVisibles: (newConfigData.platosVisibles || []).map(p => ({
        id: p.id,
        visible: p.visible,
        recommended: p.recommended || false
      })),
      serviceDependencies: (newConfigData.serviceDependencies || []).map(dep => ({
        id: dep.id,
        triggerServiceId: dep.triggerServiceId,
        requiredServiceId: dep.requiredServiceId,
      })),
      clubUruguayConfig: {
        activo: newConfigData.clubUruguayConfig?.activo ?? defaultClubUruguayConfig.activo,
        precio: Number(newConfigData.clubUruguayConfig?.precio) || defaultClubUruguayConfig.precio,
        prestaciones: (newConfigData.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones)
          .map((p) => p.trim())
          .filter(Boolean),
      },
    };
    await writeData(CONFIG_FILE, sanitizedConfig);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}

export async function generateBudgetAndLeadFromSimulator(
  data: LeadFromQuickBudget & { items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] }
): Promise<{ success: boolean; leadId?: string; presupuestoId?: string; error?: string }> {
  try {
    const presupuestoData: Omit<Presupuesto, 'id'> = {
      clienteNombre: data.clienteNombre,
      clienteContacto: data.clienteContacto,
      eventoTipo: 'Evento (desde Simulador)',
      eventoFecha: data.eventoFecha || new Date().toISOString(),
      eventoHoraInicio: data.eventoHoraInicio,
      invitadosCantidad: (data.adultos || 0) + (data.ninos || 0),
      invitadosAdultos: data.adultos,
      invitadosAdolescentes: 0,
      invitadosNinos: data.ninos,
      salonFiestas: 'A definir',
      itemsPresupuestados: data.items as ItemPresupuestado[],
      timestamp: new Date().toISOString(),
      notas: `Presupuesto generado desde el Simulador. Paquete: ${data.paqueteNombre || 'N/A'}. Costo estimado: ${formatCurrency(data.costoEstimado)}`,
      costoTotalEstimado: data.subtotal,
      descuentoTipo: data.descuentoGeneral && data.descuentoGeneral > 0 ? 'porcentaje' : undefined,
      descuentoValor: data.descuentoGeneral,
      totalConDescuento: data.costoEstimado,
      estado: 'Pendiente Verificación',
      source: 'simulator'
    };

    // savePresupuesto ahora internamente llama a findLeadByBudgetOrCreate
    const budgetResult = await savePresupuesto(presupuestoData, {
      source: 'simulator'
    });
    
    if (budgetResult.success && budgetResult.id && budgetResult.leadId) {
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
