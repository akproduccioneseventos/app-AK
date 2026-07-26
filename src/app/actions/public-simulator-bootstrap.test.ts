import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenus } from "@/app/actions/menus-catering";
import { getPublicSimulatorBootstrap } from "@/app/actions/public-simulator-bootstrap";
import { getServiciosEmpresa } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnections } from "@/app/actions/social-connections";

jest.mock("@/app/actions/armado-rapido", () => ({
  getArmadoRapidoConfig: jest.fn(),
}));
jest.mock("@/app/actions/menus-catering", () => ({ getMenus: jest.fn() }));
jest.mock("@/app/actions/servicios-empresa", () => ({
  getServiciosEmpresa: jest.fn(),
}));
jest.mock("@/app/actions/settings", () => ({
  getBudgetDisplaySettings: jest.fn(),
  getInvoiceTemplateSettings: jest.fn(),
}));
jest.mock("@/app/actions/social-connections", () => ({
  getSocialConnections: jest.fn(),
}));

describe("getPublicSimulatorBootstrap", () => {
  it("returns one compact public payload and excludes non-service catalog rows", async () => {
    jest
      .mocked(getArmadoRapidoConfig)
      .mockResolvedValue({ paquetes: [] } as never);
    jest
      .mocked(getBudgetDisplaySettings)
      .mockResolvedValue({ successMessage: "Listo" } as never);
    jest.mocked(getServiciosEmpresa).mockResolvedValue([
      { id: "service-1", nombre: "Discoteca", tipoItem: "Servicio" },
      { id: "supply-1", nombre: "Vaso", tipoItem: "Insumo" },
    ] as never);
    jest.mocked(getSocialConnections).mockResolvedValue([
      {
        platform: "WhatsApp",
        isConnected: true,
        phoneNumber: "59899111222",
      },
    ] as never);
    jest
      .mocked(getInvoiceTemplateSettings)
      .mockResolvedValue({ logoUrl: "/logo.png" } as never);
    jest
      .mocked(getMenus)
      .mockResolvedValue([{ id: "menu-1", name: "Menú AK" }] as never);

    const result = await getPublicSimulatorBootstrap();

    expect(result.services).toEqual([
      expect.objectContaining({ id: "service-1", tipoItem: "Servicio" }),
    ]);
    expect(result.whatsappNumber).toBe("59899111222");
    expect(result.logoUrl).toBe("/logo.png");
    expect(result.menus).toHaveLength(1);
  });
});
