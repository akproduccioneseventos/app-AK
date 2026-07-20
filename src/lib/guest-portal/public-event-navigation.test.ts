import type { PublicGuestEvent } from "@/lib/guest-portal-public-data";
import {
  buildPublicEventTools,
  normalizePublicEventAccent,
  withGuestAccess,
} from "./public-event-navigation";

function event(overrides: Partial<PublicGuestEvent> = {}): PublicGuestEvent {
  return {
    configuracion: {
      nombreEvento: "Fiesta de prueba",
      tipoCelebracion: "Evento",
      horaInicio: "21:00",
      nombreLugar: "Salon de prueba",
    },
    programa: [],
    ...overrides,
  };
}

describe("public event navigation", () => {
  it("preserves guest access when the destination already has a query", () => {
    expect(withGuestAccess("/evento/social/fiesta-1?section=songs", "guest 1", "token/1"))
      .toBe("/evento/social/fiesta-1?section=songs&guestId=guest+1&token=token%2F1");
  });

  it("only exposes contracted bar and digital-zone modules", () => {
    const tools = buildPublicEventTools({
      fiestaId: "fiesta-1",
      guestId: "guest-1",
      guestAccessToken: "secret",
      photoCount: 2,
      event: event({
        modulosContratados: {
          tareas: false,
          invitados: true,
          paginaWeb: true,
          decoracion: false,
          catering: true,
          musica: true,
          personal: false,
          itinerario: true,
          documentos: false,
          costos: false,
          cargaOperativa: false,
          fotografia: true,
          videoVida: false,
          reuniones: false,
          muroSocial: true,
          redSocial: true,
          regalos: false,
          feedback: false,
          menuMesa: true,
          checkin: true,
          resumenImprimible: false,
          configuracion: true,
          disenoSalon: false,
          listaCompras: false,
          portalCliente: true,
          numerosMesa: true,
          mesasCliente: true,
          resumenPlanificacion: false,
          enVivo: true,
          barraTecnologica: false,
          zonaDigital: true,
        },
        zonaDigitalAdolescentes: {
          enabled: true,
        } as PublicGuestEvent["zonaDigitalAdolescentes"],
      }),
    });

    expect(tools.map((tool) => tool.id)).toEqual(["social", "gallery", "songs", "games"]);
    expect(tools.every((tool) => tool.href.includes("guestId=guest-1"))).toBe(true);
    expect(tools.every((tool) => tool.href.includes("token=secret"))).toBe(true);
  });

  it("uses a safe accent when event configuration is invalid", () => {
    expect(normalizePublicEventAccent("#2563eb")).toBe("#2563eb");
    expect(normalizePublicEventAccent("url(javascript:alert(1))")).toBe("#b91c1c");
  });
});
