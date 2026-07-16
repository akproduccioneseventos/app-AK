import {
  buildPublicGuestPortalData,
  type PublicGuestPortalData,
} from "./guest-portal-public-data";
import type { FiestaEnPlanificacion } from "@/types/fiesta";

describe("public guest portal data", () => {
  const fiesta = {
    id: "fiesta-private",
    configuracion: {
      nombreEvento: "XV de Valentina",
      tipoCelebracion: "15 años",
      fechaEvento: "2027-08-10",
      horaInicio: "21:00",
      nombreLugar: "Club Uruguay",
      direccionLugar: "Centro",
      invitadosEstimados: 120,
      presupuestoEstimado: 500000,
      notesAdicionales: "Nota interna sensible",
      clienteId: "cliente-secreto",
    },
    invitados: [
      {
        id: "guest-1",
        nombre: "Ana",
        contacto: "099111222",
        rsvp: "Confirmado",
        notes: "Nota privada",
        guestAccessToken: "token-guest-1",
      },
      {
        id: "guest-2",
        nombre: "Otra persona",
        contacto: "099333444",
        rsvp: "Pendiente",
      },
    ],
    gestionCostos: { total: 200000 },
    programa: [
      {
        id: "public",
        hora: "21:00",
        titulo: "Recepción",
        visibleParaCliente: true,
      },
      {
        id: "private",
        hora: "20:00",
        titulo: "Reunión interna",
        visibleParaCliente: false,
      },
    ],
  } as unknown as FiestaEnPlanificacion;

  it("returns only the linked guest and public event fields", () => {
    const result = buildPublicGuestPortalData(
      fiesta,
      "guest-1",
    ) as PublicGuestPortalData;

    expect(result.guest).toEqual(
      expect.objectContaining({
        id: "guest-1",
        nombre: "Ana",
        guestAccessToken: "token-guest-1",
      }),
    );
    expect(result.guest).not.toHaveProperty("contacto");
    expect(result.guest).not.toHaveProperty("notes");
    expect(result.fiesta).not.toHaveProperty("invitados");
    expect(result.fiesta).not.toHaveProperty("gestionCostos");
    expect(result.fiesta.configuracion).not.toHaveProperty(
      "presupuestoEstimado",
    );
    expect(result.fiesta.configuracion).not.toHaveProperty("notesAdicionales");
    expect(result.fiesta.programa).toEqual([
      expect.objectContaining({ id: "public", titulo: "Recepción" }),
    ]);
  });

  it("rejects a guest id that does not belong to the event", () => {
    expect(buildPublicGuestPortalData(fiesta, "missing")).toBeNull();
  });
});
