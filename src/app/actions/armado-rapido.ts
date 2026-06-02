'use server';

import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ArmadoRapidoConfig, LeadFromQuickBudget, ServiceDependency } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import { savePresupuesto } from './presupuestos';
import type { ItemPresupuestado, Presupuesto, PresupuestoSource } from '@/types/presupuesto';

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

function getSimulatorDiscountPercentage(data: LeadFromQuickBudget): number {
  const pct = Number(data.descuentoGeneral ?? SIMULATOR_DISCOUNT_PERCENTAGE);
  if (!Number.isFinite(pct) || pct < 0) return SIMULATOR_DISCOUNT_PERCENTAGE;
  return Math.min(100, pct);
}

function calculateSimulatorTotal(data: LeadFromQuickBudget): number {
  const subtotal = Math.max(0, Math.round(data.subtotal || 0));
  return Math.round(subtotal * (1 - getSimulatorDiscountPercentage(data) / 100));
}

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
      descuentoGeneral: SIMULATOR_DISCOUNT_PERCENTAGE,
      paquetes: (newConfigData.paquetes || []).map(pkg => ({
        id: pkg.id,
        nombre: pkg.nombre,
        descripcion: pkg.descripcion,
        recommended: pkg.recommended || false,
        tiposDeEventoAplicables: (pkg.tiposDeEventoAplicables || [])
          .map((tipo) => tipo.trim())
          .filter(Boolean),
        serviciosIncluidos: pkg.serviciosIncluidos.map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      menus: (newConfigData.menus || []).map(menu => ({
        id: menu.id,
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        serviciosIncluidos: menu.serviciosIncluidos.map(serv => ({ id: serv.id, esRegalo: serv.esRegalo || false })),
      })),
      platosVisibles: (newConfigData.platosVisibles || []).map(p => ({
        id: p.id,
        visible: p.visible,
        recommended: p.recommended || false
      })),
      serviceDependencies: (newConfigData.serviceDependencies || []).map((dep: ServiceDependency) => ({
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
    return { success: false, error: error.message || 'Unknown error saving config.' };
  }
}

export async function generateBudgetAndLeadFromSimulator(
  data: LeadFromQuickBudget & { items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] },
  options?: { source?: PresupuestoSource; eventoTipo?: string; salonFiestas?: string }
): Promise<{ success: boolean; leadId?: string; presupuestoId?: string; error?: string }> {
  try {
    const source = options?.source || 'simulator_common';
    const adultos = Math.max(0, Math.round(data.adultos || 0));
    const adolescentes = Math.max(0, Math.round(data.adolescentes || 0));
    const ninos = Math.max(0, Math.round(data.ninos || 0));
    const totalInvitados = adultos + adolescentes + ninos;
    const totalConDescuento = calculateSimulatorTotal(data);
    const discountPercentage = getSimulatorDiscountPercentage(data);

    const presupuestoData: Omit<Presupuesto, 'id'> = {
      clienteNombre: data.clienteNombre,
      clienteContacto: data.clienteContacto,
      eventoTipo: options?.eventoTipo || 'Evento (desde Simulador)',
      eventoFecha: data.eventoFecha || new Date().toISOString(),
      eventoHoraInicio: data.eventoHoraInicio,
      invitadosCantidad: totalInvitados,
      invitadosAdultos: adultos,
      invitadosAdolescentes: adolescentes,
      invitadosNinos: ninos,
      salonFiestas: options?.salonFiestas || 'A definir',
      itemsPresupuestados: data.items as ItemPresupuestado[],
      timestamp: new Date().toISOString(),
      notas: `Presupuesto generado desde el Simulador. Paquete: ${data.paqueteNombre || 'N/A'}. Total vigente: ${formatCurrency(totalConDescuento)}. Descuento aplicado: ${discountPercentage}%.`,
      costoTotalEstimado: Math.max(0, Math.round(data.subtotal || 0)),
      descuentoTipo: 'porcentaje',
      descuentoValor: discountPercentage,
      ajusteAnualActivo: data.ajusteAnualActivo,
      ajusteAnualPorcentaje: data.ajusteAnualPorcentaje,
      totalConDescuento,
      estado: 'Pendiente Verificación',
      source,
    };

    const budgetResult = await savePresupuesto(presupuestoData, {
      source,
      preserveTotal: true,
    });

    if (budgetResult.success && budgetResult.id && budgetResult.leadId) {
      return { success: true, presupuestoId: budgetResult.id, leadId: budgetResult.leadId };
    }
    return { success: false, error: budgetResult.error || 'No se pudo procesar la solicitud.' };
  } catch (error: any) {
    console.error('Error in generateBudgetAndLeadFromSimulator:', error);
    return { success: false, error: error.message || 'Error al generar el prospecto y presupuesto.' };
  }
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};
