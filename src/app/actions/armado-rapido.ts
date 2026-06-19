'use server';

import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ArmadoRapidoConfig, LeadFromQuickBudget, ServiceDependency } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import type { ItemPresupuestado, PresupuestoSource } from '@/types/presupuesto';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';
import { createNotification } from './notifications';

const CONFIG_FILE = 'armado-rapido-config.json';
const SIMULATOR_DISCOUNT_PERCENTAGE = 15;

const defaultConfig: ArmadoRapidoConfig = {
  descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
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
    descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
    clubUruguayConfig: {
      ...defaultClubUruguayConfig,
      ...(config?.clubUruguayConfig || {}),
      prestaciones: (config?.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones)
        .map((item) => item.trim())
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
      descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
      paquetes: (newConfigData.paquetes || []).map((pkg) => ({
        id: pkg.id,
        nombre: pkg.nombre,
        descripcion: pkg.descripcion,
        recommended: pkg.recommended || false,
        tiposDeEventoAplicables: (pkg.tiposDeEventoAplicables || [])
          .map((tipo) => tipo.trim())
          .filter(Boolean),
        serviciosIncluidos: pkg.serviciosIncluidos.map((service) => ({
          id: service.id,
          esRegalo: service.esRegalo || false,
        })),
      })),
      menus: (newConfigData.menus || []).map((menu) => ({
        id: menu.id,
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        serviciosIncluidos: menu.serviciosIncluidos.map((service) => ({
          id: service.id,
          esRegalo: service.esRegalo || false,
        })),
      })),
      platosVisibles: (newConfigData.platosVisibles || []).map((dish) => ({
        id: dish.id,
        visible: dish.visible,
        recommended: dish.recommended || false,
      })),
      serviceDependencies: (newConfigData.serviceDependencies || []).map((dependency: ServiceDependency) => ({
        id: dependency.id,
        triggerServiceId: dependency.triggerServiceId,
        requiredServiceId: dependency.requiredServiceId,
      })),
      clubUruguayConfig: {
        activo: newConfigData.clubUruguayConfig?.activo ?? defaultClubUruguayConfig.activo,
        precio: Number(newConfigData.clubUruguayConfig?.precio) || defaultClubUruguayConfig.precio,
        prestaciones: (newConfigData.clubUruguayConfig?.prestaciones || defaultClubUruguayConfig.prestaciones)
          .map((item) => item.trim())
          .filter(Boolean),
      },
    };
    await writeData(CONFIG_FILE, sanitizedConfig);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar la configuracion.' };
  }
}

export async function generateBudgetAndLeadFromSimulator(
  data: LeadFromQuickBudget & { items?: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] },
  options?: {
    source?: PresupuestoSource;
    eventoTipo?: string;
    salonFiestas?: string;
    acquisition?: CommercialAttribution;
  }
): Promise<{ success: boolean; leadId?: string; presupuestoId?: string; token?: string; error?: string }> {
  try {
    const requestedSource = options?.source;
    const source = requestedSource === 'simulator_assistant'
      ? 'simulator_assistant'
      : requestedSource === 'simulator'
        ? 'simulator'
        : 'simulator_common';
    const result = await persistPublicSimulatorBudget(data, {
      source,
      eventoTipo: options?.eventoTipo || 'Evento (desde Simulador)',
      salonFiestas: options?.salonFiestas,
      acquisition: options?.acquisition,
    });
    const { generateBudgetToken } = await import('@/lib/auth/session-token');
    const token = await generateBudgetToken(result.presupuesto.id);

    createNotification({
      titulo: result.reused ? 'Presupuesto de simulador actualizado' : 'Nuevo presupuesto del simulador',
      mensaje: `${result.presupuesto.clienteNombre} completo el simulador (${result.presupuesto.eventoTipo}).`,
      href: `/presupuestos/${result.presupuesto.id}/ver`,
      icono: 'Sparkles',
      tipo: 'aviso',
      entidadRelacionadaId: result.presupuesto.id,
      rolDestino: 'admin',
    }).catch(() => {});

    return {
      success: true,
      presupuestoId: result.presupuesto.id,
      leadId: result.leadId,
      token,
    };
  } catch (error: any) {
    console.error('Error in generateBudgetAndLeadFromSimulator:', error);
    return { success: false, error: error.message || 'Error al generar el prospecto y presupuesto.' };
  }
}
