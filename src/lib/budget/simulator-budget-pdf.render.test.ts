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

  it("un nombre largo no pisa la columna derecha y ningún texto de la izquierda termina después de x=108", async () => {
    const jspdfModule = await import("jspdf");
    const nombreLargo = "Maria Fernanda Rodriguez y Juan Sebastian Fernandez";
    const paqueteLargo = "Paquete Exclusivo de Producción Integral y Decoración Completa ".repeat(2);

    const textosColumnaIzquierda: { texto: string; x: number; y: number; width: number; endX: number }[] = [];
    const lineasDelNombre: string[] = [];

    const OrigJsPDF = jspdfModule.jsPDF;
    const jspdfSpy = jest.spyOn(jspdfModule, "jsPDF").mockImplementation(function (this: any, ...args: any[]) {
      const doc = new OrigJsPDF(...args);
      const origText = doc.text;
      doc.text = function (this: any, text: any, x: any, y: any, ...rest: any[]) {
        if (typeof text === "string" && typeof x === "number") {
          const width = this.getTextWidth(text);
          if (x >= 15 && x < 108 && y >= 30 && y <= 65) {
            textosColumnaIzquierda.push({ texto: text, x, y, width, endX: x + width });
            if (nombreLargo.includes(text)) {
              lineasDelNombre.push(text);
            }
          }
        }
        return origText.call(this, text, x, y, ...rest);
      };
      return doc;
    });

    try {
      await createSimulatorBudgetPdf({
        documentId: "pres_long_name_test",
        publicUrl: "https://akproducciones.uy/presupuestos/pres_long_name_test/ver",
        clientName: nombreLargo,
        eventType: "Boda",
        eventDate: new Date("2027-08-21T18:00:00.000Z"),
        adults: 100,
        childrenAndTeens: 20,
        packageName: paqueteLargo,
        items: [],
        stats: {
          subtotalBruto: 100_000,
          ahorroRegalos: 0,
          descPromo: 0,
          totalFinal: 100_000,
          precioPorPersona: 1_000,
          discountPercentage: 0,
          annualProjection: {
            applies: false,
            currentYear: 2026,
            eventYear: 2027,
            adjustmentPct: 0,
            baseTotal: 100_000,
            adjustedTotal: 100_000,
            adjustmentAmount: 0,
            rows: [],
          },
        },
      });

      expect(lineasDelNombre.length).toBeGreaterThan(1);
      for (const item of textosColumnaIzquierda) {
        expect(item.endX).toBeLessThanOrEqual(108.01);
      }

      const nombreReconstruido = lineasDelNombre.join(" ");
      expect(nombreReconstruido).toBe(nombreLargo);
    } finally {
      jspdfSpy.mockRestore();
    }
  });
});
