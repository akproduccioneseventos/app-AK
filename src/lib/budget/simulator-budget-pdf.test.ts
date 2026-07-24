import { buildSimulatorBudgetPdfModel } from "./simulator-budget-pdf";

describe("buildSimulatorBudgetPdfModel", () => {
  it("groups every service and keeps a 30-day validity window", () => {
    const issuedAt = new Date("2026-07-24T12:00:00.000Z");
    const model = buildSimulatorBudgetPdfModel(
      {
        documentId: "pres_1",
        publicUrl: "https://akproducciones.uy/presupuestos/pres_1/ver",
        clientName: "Ana",
        eventType: "15 años",
        adults: 80,
        childrenAndTeens: 20,
        items: [
          {
            id: "food",
            nombre: "Cena",
            categoria: "Catering",
            cantidad: 100,
            precioUnitario: 400,
            costoTotal: 40_000,
            esRegalo: false,
          },
          {
            id: "gift",
            nombre: "Invitación digital",
            categoria: "Regalos",
            cantidad: 1,
            precioUnitario: 2_000,
            costoTotal: 2_000,
            esRegalo: true,
          },
        ],
        stats: {
          subtotalBruto: 42_000,
          ahorroRegalos: 2_000,
          descPromo: 0,
          totalFinal: 40_000,
          precioPorPersona: 400,
          discountPercentage: 0,
          annualProjection: {
            applies: false,
            currentYear: 2026,
            eventYear: 2026,
            adjustmentPct: 15,
            baseTotal: 40_000,
            adjustedTotal: 40_000,
            adjustmentAmount: 0,
            rows: [],
          },
        },
      },
      issuedAt,
    );

    expect(model.guestCount).toBe(100);
    expect(model.categories.map((category) => category.name)).toEqual([
      "Catering",
      "Regalos",
    ]);
    expect(model.categories.flatMap((category) => category.items)).toHaveLength(2);
    expect(model.validUntil.toISOString()).toBe("2026-08-23T12:00:00.000Z");
  });
});
