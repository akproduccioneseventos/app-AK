"use server";

import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenusPublicos } from "@/app/actions/menus-catering";
import { getServiciosEmpresaPublicos } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnectionsPublicas } from "@/app/actions/social-connections";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import { createNotification } from "@/lib/notifications/create-notification";
import type { ArmadoRapidoConfig } from "@/types/armado-rapido";
import { defaultClubUruguayConfig } from "@/types/armado-rapido";
import type { FullMenu } from "@/types/catering";
import type { ServicioEmpresa } from "@/types/empresa";
import type { BudgetDisplaySettings } from "@/types/settings";
import { defaultBudgetDisplaySettings } from "@/types/settings";
import fallbackConfigJson from "@/data/armado-rapido-config.json";
import fallbackMenusJson from "@/data/menus-catering.json";
import fallbackServicesJson from "@/data/servicios-empresa.json";

export interface PublicSimulatorBootstrap {
  config: ArmadoRapidoConfig;
  budgetSettings: BudgetDisplaySettings;
  services: ServicioEmpresa[];
  menus: FullMenu[];
  whatsappNumber: string;
  logoUrl: string | null;
  origenDePrecios: 'vivo' | 'respaldo';
}

const FALLBACK_CONFIG_DATA = fallbackConfigJson as unknown as ArmadoRapidoConfig;
const FALLBACK_CONFIG: ArmadoRapidoConfig = {
  ...FALLBACK_CONFIG_DATA,
  clubUruguayConfig: {
    ...defaultClubUruguayConfig,
    ...(FALLBACK_CONFIG_DATA.clubUruguayConfig || {}),
  },
};
const FALLBACK_MENUS = fallbackMenusJson as unknown as FullMenu[];
const FALLBACK_SERVICES = fallbackServicesJson as unknown as ServicioEmpresa[];

let lastSimulatorFallbackNotificationDate: string | null = null;

export async function _resetSimulatorFallbackNotificationDateForTesting(): Promise<void> {
  lastSimulatorFallbackNotificationDate = null;
}

async function withBootstrapFallback<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 4_500,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getPublicSimulatorBootstrap(): Promise<PublicSimulatorBootstrap> {
  const [
    config,
    budgetSettings,
    services,
    socialConnections,
    templateSettings,
    menus,
  ] = await Promise.all([
    withBootstrapFallback(getArmadoRapidoConfig(), FALLBACK_CONFIG),
    withBootstrapFallback(getBudgetDisplaySettings(), defaultBudgetDisplaySettings),
    withBootstrapFallback(getServiciosEmpresaPublicos(), FALLBACK_SERVICES),
    withBootstrapFallback(getSocialConnectionsPublicas(), []),
    withBootstrapFallback(getInvoiceTemplateSettings(), null),
    withBootstrapFallback(getMenusPublicos(), FALLBACK_MENUS),
  ]);

  const resolvedConfig = config || FALLBACK_CONFIG;
  const isServicesFromFallback = services === FALLBACK_SERVICES || !services || services.length === 0;
  const resolvedServicesRaw = (!isServicesFromFallback && services && services.length > 0) ? services : FALLBACK_SERVICES;
  const resolvedServices = resolvedServicesRaw.filter((service) => service.tipoItem === "Servicio");
  const finalServices = resolvedServices.length > 0 ? resolvedServices : FALLBACK_SERVICES;
  const origenDePrecios: 'vivo' | 'respaldo' =
    isServicesFromFallback || finalServices === FALLBACK_SERVICES || resolvedServices.length === 0
      ? 'respaldo'
      : 'vivo';

  if (origenDePrecios === 'respaldo') {
    const todayInMontevideo = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Montevideo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    if (lastSimulatorFallbackNotificationDate !== todayInMontevideo) {
      lastSimulatorFallbackNotificationDate = todayInMontevideo;
      try {
        // no-mira-el-resultado: es un aviso interno en el panel; si falla no debe interrumpir el presupuesto del cliente
        await createNotification({
          titulo: 'Simulador de presupuesto',
          mensaje: 'El simulador usó la lista de precios guardada porque no pudo leer la del momento.',
          tipo: 'aviso',
          href: '/settings/catalogo-servicios',
        });
      } catch (err) {
        console.error('Error enviando notificacion de respaldo de precios:', err);
      }
    }
  }
  const resolvedMenus = (menus && menus.length > 0) ? menus : FALLBACK_MENUS;

  const whatsappConnection = (socialConnections || []).find(
    (connection) =>
      connection.platform === "WhatsApp" && connection.isConnected,
  );

  return {
    config: resolvedConfig,
    budgetSettings: budgetSettings || defaultBudgetDisplaySettings,
    services: finalServices,
    menus: resolvedMenus,
    // Si la conexion de WhatsApp Business no esta o no se pudo leer, va el numero
    // OFICIAL de AK, no un ejemplo. Antes aca habia un numero de ejemplo escrito a mano: un numero que no
    // existe. El prospecto terminaba su presupuesto, tocaba "consultar" y **caia en
    // la nada**. Nunca un dato de contacto escrito a mano.
    whatsappNumber: whatsappConnection?.phoneNumber || AK_WHATSAPP_NUMBER,
    logoUrl: templateSettings?.logoUrl || null,
    origenDePrecios,
  };
}
