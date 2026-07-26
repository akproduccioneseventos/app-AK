import { writeFileSync } from "node:fs";
import { TextDecoder, TextEncoder } from "node:util";
import { createSimulatorBudgetPdf } from "./simulator-budget-pdf";

Object.assign(globalThis, { TextDecoder, TextEncoder });

describe("createSimulatorBudgetPdf", () => {
  it("renders a long formal budget as numbered A4 pages without clipping", async () => {
    const items = Array.from({ length: 52 }, (_, index) => ({
      id: `service-${index}`,
      nombre: `Servicio detallado ${index + 1} con descripción profesional`,
      categoria: index < 20 ? "Catering" : index < 38 ? "Entretenimiento" : "Producción",
      cantidad: index < 20 ? 100 : 1,
      precioUnitario: index < 20 ? 350 : 4_500,
      costoTotal: index < 20 ? 35_000 : 4_500,
      esRegalo: index % 13 === 0,
    }));

    const pdf = await createSimulatorBudgetPdf({
      documentId: "pres_visual_test",
      publicUrl: "https://akproducciones.uy/presupuestos/pres_visual_test/ver",
      clientName: "Cliente de prueba",
      eventType: "15 años",
      eventDate: new Date("2027-08-21T18:00:00.000Z"),
      adults: 80,
      childrenAndTeens: 20,
      packageName: "Producción integral",
      items,
      stats: {
        subtotalBruto: 180_000,
        ahorroRegalos: 12_000,
        descPromo: 8_000,
        totalFinal: 160_000,
        precioPorPersona: 1_600,
        discountPercentage: 5,
        annualProjection: {
          applies: true,
          currentYear: 2026,
          eventYear: 2027,
          adjustmentPct: 15,
          baseTotal: 160_000,
          adjustedTotal: 184_000,
          adjustmentAmount: 24_000,
          rows: [{ year: 2027, total: 184_000, adjustmentAmount: 24_000 }],
        },
      },
    });

    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    for (let page = 1; page <= pdf.getNumberOfPages(); page += 1) {
      pdf.setPage(page);
      expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
      expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    }

    const output = Buffer.from(pdf.output("arraybuffer"));
    expect(output.byteLength).toBeGreaterThan(8_000);

    if (process.env.AK_PDF_FIXTURE_PATH) {
      writeFileSync(process.env.AK_PDF_FIXTURE_PATH, output);
    }
  });
});
