"use server";

import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenus } from "@/app/actions/menus-catering";
import { getServiciosEmpresa } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnections } from "@/app/actions/social-connections";
import type { ArmadoRapidoConfig } from "@/types/armado-rapido";
import type { FullMenu } from "@/types/catering";
import type { ServicioEmpresa } from "@/types/empresa";
import type { BudgetDisplaySettings } from "@/types/settings";

export interface PublicSimulatorBootstrap {
  config: ArmadoRapidoConfig;
  budgetSettings: BudgetDisplaySettings;
  services: ServicioEmpresa[];
  menus: FullMenu[];
  whatsappNumber: string;
  logoUrl: string | null;
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
    getArmadoRapidoConfig(),
    getBudgetDisplaySettings(),
    getServiciosEmpresa(),
    getSocialConnections(),
    getInvoiceTemplateSettings(),
    getMenus(),
  ]);

  const whatsappConnection = socialConnections.find(
    (connection) =>
      connection.platform === "WhatsApp" && connection.isConnected,
  );

  return {
    config,
    budgetSettings,
    services: services.filter((service) => service.tipoItem === "Servicio"),
    menus,
    whatsappNumber: whatsappConnection?.phoneNumber || "",
    logoUrl: templateSettings.logoUrl || null,
  };
}
