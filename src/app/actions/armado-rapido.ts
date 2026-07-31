'use server';

import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { ArmadoRapidoConfig, LeadFromQuickBudget, ServiceDependency } from '@/types/armado-rapido';
import { readData, writeData } from '@/lib/data-service';
import type { ItemPresupuestado, PresupuestoSource } from '@/types/presupuesto';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';
import { createNotification } from '@/lib/notifications/create-notification';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { requireAppSession } from '@/lib/auth/require-session';

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
  await requireAppSession();
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

export async function captureSimulatorLeadProgress(input: {
  clienteNombre: string;
  clienteContacto: string;
  eventoTipo?: string;
  eventoFecha?: string;
  invitados?: number;
  salonFiestas?: string;
  acquisition?: CommercialAttribution;
  marketingConsent?: boolean;
}): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const phone = normalizeUruguayPhone(input.clienteContacto);
    await enforcePublicRateLimit({
      scope: 'public-simulator-progress',
      identity: phone,
      limit: 100,
      windowMs: 60 * 60 * 1000,
    });
    const result = await upsertPublicCommercialLead({
      name: input.clienteNombre,
      phone,
      partyType: input.eventoTipo,
      eventDate: input.eventoFecha,
      guestCount: input.invitados,
      venueName: input.salonFiestas,
      notes: 'El prospecto comenzo el simulador visual y todavia no genero el presupuesto final.',
      budgetSource: 'simulator_common',
      acquisition: input.acquisition,
      marketingConsent: input.marketingConsent === true,
      marketingConsentSource: 'simulador-publico-paso-contacto',
    });
    return { success: true, leadId: result.lead.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar el avance del simulador.' };
  }
}

export async function getPublicBudgetsByPhone(rawPhone: string): Promise<{
  success: boolean;
  budgets?: {
    id: string;
    numero: number;
    clienteNombre: string;
    eventoTipo: string;
    eventoFecha: string;
    totalConDescuento: number;
    token: string;
  }[];
  error?: string;
}> {
  try {
    const phone = normalizeUruguayPhone(rawPhone);
    if (!phone || !/^09\d{7}$/.test(phone)) {
      return { success: false, error: 'Ingresa un celular uruguayo valido.' };
    }

    await enforcePublicRateLimit({
      scope: 'public-budget-history',
      identity: phone,
      limit: 12,
      windowMs: 60 * 60 * 1000,
    });

    let matchingBudgets: any[] = [];

    // 1. Try querying Firestore if available. Local-only mode must never wait
    // for credentials before using the deterministic JSON test data.
    if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
      try {
        const { dbAdmin } = await import('@/lib/firebase/server');
        if (dbAdmin) {
          const snapshot = await dbAdmin
            .collection('presupuestos')
            .where('clienteContacto', '==', phone)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

          snapshot.forEach((doc) => {
            matchingBudgets.push(doc.data());
          });
        }
      } catch (firebaseError) {
        console.warn('[getPublicBudgetsByPhone] Firestore query failed, falling back to JSON file:', firebaseError);
      }
    }

    // 2. If no budgets fetched from Firestore (or failed), fallback to reading local JSON
    if (matchingBudgets.length === 0) {
      const allBudgets = await readData<any[]>('presupuestos.json', []);
      matchingBudgets = allBudgets
        .filter((b) => b.clienteContacto === phone)
        .sort((a, b) => new Date(b.timestamp || b.eventoFecha || 0).getTime() - new Date(a.timestamp || a.eventoFecha || 0).getTime())
        .slice(0, 20);
    }

    // 3. Map budgets and generate access tokens
    const { generateBudgetToken } = await import('@/lib/auth/session-token');
    const budgetsWithTokens = await Promise.all(
      matchingBudgets.map(async (b) => {
        const token = await generateBudgetToken(b.id);
        return {
          id: b.id,
          numero: b.numero || 0,
          clienteNombre: b.clienteNombre,
          eventoTipo: b.eventoTipo || 'Evento',
          eventoFecha: b.eventoFecha,
          totalConDescuento: b.totalConDescuento || b.costoTotalEstimado || 0,
          token,
        };
      })
    );

    return {
      success: true,
      budgets: budgetsWithTokens,
    };
  } catch (error: any) {
    console.error('Error in getPublicBudgetsByPhone:', error);
    return { success: false, error: error.message || 'Error al obtener presupuestos.' };
  }
}

