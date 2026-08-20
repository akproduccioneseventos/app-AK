import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenusPublicos } from "@/app/actions/menus-catering";
import { getPublicSimulatorBootstrap } from "@/app/actions/public-simulator-bootstrap";
import { getServiciosEmpresaPublicos } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnectionsPublicas } from "@/app/actions/social-connections";

jest.mock("@/app/actions/armado-rapido", () => ({
  getArmadoRapidoConfig: jest.fn(),
}));
jest.mock("@/app/actions/menus-catering", () => ({ getMenusPublicos: jest.fn() }));
jest.mock("@/app/actions/servicios-empresa", () => ({
  getServiciosEmpresaPublicos: jest.fn(),
}));
jest.mock("@/app/actions/settings", () => ({
  getBudgetDisplaySettings: jest.fn(),
  getInvoiceTemplateSettings: jest.fn(),
}));
jest.mock("@/app/actions/social-connections", () => ({
  getSocialConnectionsPublicas: jest.fn(),
}));

describe("getPublicSimulatorBootstrap", () => {
  it("returns one compact public payload and excludes non-service catalog rows", async () => {
    jest
      .mocked(getArmadoRapidoConfig)
      .mockResolvedValue({ paquetes: [] } as never);
    jest
      .mocked(getBudgetDisplaySettings)
      .mockResolvedValue({ successMessage: "Listo" } as never);
    jest.mocked(getServiciosEmpresaPublicos).mockResolvedValue([
      { id: "service-1", nombre: "Discoteca", tipoItem: "Servicio" },
      { id: "supply-1", nombre: "Vaso", tipoItem: "Insumo" },
    ] as never);
    jest.mocked(getSocialConnectionsPublicas).mockResolvedValue([
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
      .mocked(getMenusPublicos)
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
