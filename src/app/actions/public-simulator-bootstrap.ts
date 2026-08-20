"use server";

import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenusPublicos } from "@/app/actions/menus-catering";
import { getServiciosEmpresaPublicos } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnectionsPublicas } from "@/app/actions/social-connections";
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
  const resolvedServicesRaw = (services && services.length > 0) ? services : FALLBACK_SERVICES;
  const resolvedServices = resolvedServicesRaw.filter((service) => service.tipoItem === "Servicio");
  const finalServices = resolvedServices.length > 0 ? resolvedServices : FALLBACK_SERVICES;
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
    whatsappNumber: whatsappConnection?.phoneNumber || "59899123456",
    logoUrl: templateSettings?.logoUrl || null,
  };
}
