import { getArmadoRapidoConfig } from "@/app/actions/armado-rapido";
import { getMenusPublicos } from "@/app/actions/menus-catering";
import { getServiciosEmpresaPublicos } from "@/app/actions/servicios-empresa";
import {
  getBudgetDisplaySettings,
  getInvoiceTemplateSettings,
} from "@/app/actions/settings";
import { getSocialConnectionsPublicas } from "@/app/actions/social-connections";
import { createNotification } from "@/lib/notifications/create-notification";
import {
  getPublicSimulatorBootstrap,
  _resetSimulatorFallbackNotificationDateForTesting,
} from "@/app/actions/public-simulator-bootstrap";

jest.mock("@/app/actions/armado-rapido", () => ({
  getArmadoRapidoConfig: jest.fn(),
}));
jest.mock("@/app/actions/menus-catering", () => ({
  getMenusPublicos: jest.fn(),
}));
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
jest.mock("@/lib/notifications/create-notification", () => ({
  createNotification: jest.fn(),
}));

describe("simulador-origen-precios", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await _resetSimulatorFallbackNotificationDateForTesting();
    jest.mocked(getArmadoRapidoConfig).mockResolvedValue({ paquetes: [] } as never);
    jest.mocked(getBudgetDisplaySettings).mockResolvedValue({} as never);
    jest.mocked(getSocialConnectionsPublicas).mockResolvedValue([] as never);
    jest.mocked(getInvoiceTemplateSettings).mockResolvedValue(null as never);
    jest.mocked(getMenusPublicos).mockResolvedValue([] as never);
    jest.mocked(createNotification).mockResolvedValue({ success: true } as never);
  });

  it("devuelve 'respaldo' y envia un aviso cuando la lectura viva falla", async () => {
    jest.mocked(getServiciosEmpresaPublicos).mockRejectedValue(new Error("Network error"));

    const result = await getPublicSimulatorBootstrap();

    expect(result.origenDePrecios).toBe("respaldo");
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith({
      titulo: "Simulador de presupuesto",
      mensaje: "El simulador usó la lista de precios guardada porque no pudo leer la del momento.",
      tipo: "aviso",
      href: "/settings/catalogo-servicios",
    });
  });

  it("envia un SOLO aviso aunque se llame dos veces el mismo dia con fallback", async () => {
    jest.mocked(getServiciosEmpresaPublicos).mockRejectedValue(new Error("Timeout"));

    const res1 = await getPublicSimulatorBootstrap();
    const res2 = await getPublicSimulatorBootstrap();

    expect(res1.origenDePrecios).toBe("respaldo");
    expect(res2.origenDePrecios).toBe("respaldo");
    expect(createNotification).toHaveBeenCalledTimes(1);
  });

  it("devuelve 'vivo' y NO envia aviso cuando la lectura viva funciona", async () => {
    jest.mocked(getServiciosEmpresaPublicos).mockResolvedValue([
      { id: "srv-1", nombre: "Discoteca", tipoItem: "Servicio" },
    ] as never);

    const result = await getPublicSimulatorBootstrap();

    expect(result.origenDePrecios).toBe("vivo");
    expect(createNotification).not.toHaveBeenCalled();
  });
});
