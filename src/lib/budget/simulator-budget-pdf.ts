import type { jsPDF } from "jspdf";
import type {
  SimulatorDetailedService,
  SimulatorPriceStats,
} from "@/lib/simulator/pricing";

export type SimulatorBudgetPdfInput = {
  documentId: string;
  publicUrl: string;
  clientName: string;
  eventType: string;
  eventDate?: Date;
  adults: number;
  childrenAndTeens: number;
  packageName?: string;
  items: SimulatorDetailedService[];
  stats: Pick<
    SimulatorPriceStats,
    | "subtotalBruto"
    | "ahorroRegalos"
    | "descPromo"
    | "totalFinal"
    | "precioPorPersona"
    | "discountPercentage"
    | "annualProjection"
  >;
  bookingTerms?: string;
};

export type SimulatorBudgetPdfModel = {
  categories: Array<{
    name: string;
    items: SimulatorDetailedService[];
  }>;
  guestCount: number;
  issuedAt: Date;
  validUntil: Date;
};

const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-UY");

export function buildSimulatorBudgetPdfModel(
  input: SimulatorBudgetPdfInput,
  issuedAt = new Date(),
): SimulatorBudgetPdfModel {
  const grouped = new Map<string, SimulatorDetailedService[]>();
  input.items.forEach((item) => {
    const category = item.categoria?.trim() || "Otros servicios";
    const current = grouped.get(category) || [];
    current.push(item);
    grouped.set(category, current);
  });

  const validUntil = new Date(issuedAt);
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    categories: Array.from(grouped, ([name, items]) => ({ name, items })),
    guestCount: Math.max(0, input.adults + input.childrenAndTeens),
    issuedAt,
    validUntil,
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

function writeRightAligned(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
) {
  pdf.text(text, x, y, { align: "right" });
}

export async function createSimulatorBudgetPdf(
  input: SimulatorBudgetPdfInput,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const model = buildSimulatorBudgetPdfModel(input);
  const marginX = 15;
  const contentWidth = 180;
  const bottomLimit = 273;
  let y = 0;
  let rowIndex = 0;

  const renderBrandHeader = (continuation = false) => {
    pdf.setFillColor(185, 28, 28);
    pdf.rect(0, 0, 210, 5, "F");
    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(continuation ? 12 : 17);
    pdf.text("AK PRODUCCIONES", marginX, continuation ? 16 : 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      continuation ? "Presupuesto - continuación" : "FIESTAS Y EVENTOS",
      marginX,
      continuation ? 21 : 23,
    );
    writeRightAligned(pdf, `Ref. ${input.documentId}`, 195, 16);
    y = continuation ? 29 : 31;
  };

  const renderTableHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(marginX, y, contentWidth, 8, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(marginX, y, contentWidth, 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text("SERVICIO / CATEGORÍA", marginX + 3, y + 5.2);
    writeRightAligned(pdf, "CANT.", 143, y + 5.2);
    writeRightAligned(pdf, "UNITARIO", 170, y + 5.2);
    writeRightAligned(pdf, "TOTAL", 192, y + 5.2);
    y += 8;
  };

  const addContinuationPage = () => {
    pdf.addPage();
    renderBrandHeader(true);
    renderTableHeader();
  };

  const ensureSpace = (requiredHeight: number, withTableHeader = false) => {
    if (y + requiredHeight <= bottomLimit) return;
    pdf.addPage();
    renderBrandHeader(true);
    if (withTableHeader) renderTableHeader();
  };

  pdf.setProperties({
    title: `Presupuesto AK - ${input.clientName}`,
    subject: `Presupuesto para ${input.eventType}`,
    author: "AK Producciones",
    creator: "AK Producciones",
  });

  renderBrandHeader();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Presupuesto para ${input.eventType}`, marginX, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  writeRightAligned(pdf, `Emitido: ${dateFormatter.format(model.issuedAt)}`, 195, y + 2);
  writeRightAligned(pdf, `Válido hasta: ${dateFormatter.format(model.validUntil)}`, 195, y + 7);
  y += 14;

  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, y, contentWidth, 23, 1.5, 1.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text("CLIENTE", marginX + 4, y + 6);
  pdf.text("FECHA DEL EVENTO", marginX + 4, y + 15);
  pdf.text("INVITADOS", 112, y + 6);
  pdf.text("PAQUETE", 112, y + 15);
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(input.clientName, marginX + 27, y + 6);
  pdf.text(
    input.eventDate ? dateFormatter.format(input.eventDate) : "A confirmar",
    marginX + 32,
    y + 15,
  );
  pdf.text(`${model.guestCount} personas`, 135, y + 6);
  pdf.text(input.packageName || "Propuesta personalizada", 130, y + 15);
  y += 29;

  renderTableHeader();
  model.categories.forEach((category) => {
    ensureSpace(18, true);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(marginX, y, contentWidth, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(category.name.toUpperCase(), marginX + 3, y + 4.8);
    y += 7;

    category.items.forEach((item) => {
      const lines = pdf.splitTextToSize(item.nombre, 95) as string[];
      const rowHeight = Math.max(10, lines.length * 4 + 4);
      if (y + rowHeight > bottomLimit) addContinuationPage();

      if (rowIndex % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(marginX, y, contentWidth, rowHeight, "F");
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.line(marginX, y + rowHeight, 195, y + rowHeight);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      pdf.text(lines, marginX + 3, y + 4.8);
      if (item.esRegalo) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.8);
        pdf.setTextColor(21, 128, 61);
        pdf.text("Incluido sin cargo", marginX + 3, y + rowHeight - 2);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      writeRightAligned(pdf, String(item.cantidad || 1), 143, y + 5);
      writeRightAligned(
        pdf,
        item.esRegalo ? "-" : formatCurrency(item.precioUnitario),
        170,
        y + 5,
      );
      pdf.setFont("helvetica", "bold");
      writeRightAligned(
        pdf,
        item.esRegalo ? "INCLUIDO" : formatCurrency(item.costoTotal),
        192,
        y + 5,
      );
      y += rowHeight;
      rowIndex += 1;
    });
  });

  ensureSpace(43);
  y += 5;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(105, y, 90, 36, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text("Subtotal", 110, y + 7);
  writeRightAligned(pdf, formatCurrency(input.stats.subtotalBruto), 190, y + 7);
  let summaryY = y + 13;
  if (input.stats.ahorroRegalos > 0) {
    pdf.text("Servicios incluidos sin cargo", 110, summaryY);
    writeRightAligned(pdf, `-${formatCurrency(input.stats.ahorroRegalos)}`, 190, summaryY);
    summaryY += 6;
  }
  if (input.stats.descPromo > 0) {
    pdf.text(`Bonificación (${input.stats.discountPercentage}%)`, 110, summaryY);
    writeRightAligned(pdf, `-${formatCurrency(input.stats.descPromo)}`, 190, summaryY);
  }
  pdf.setDrawColor(203, 213, 225);
  pdf.line(110, y + 25, 190, y + 25);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text("PRECIO VIGENTE", 110, y + 32);
  writeRightAligned(pdf, formatCurrency(input.stats.totalFinal), 190, y + 32);
  y += 42;

  if (input.stats.precioPorPersona > 0) {
    ensureSpace(11);
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(marginX, y, contentWidth, 10, 1.5, 1.5, "F");
    pdf.setFontSize(8.5);
    pdf.setTextColor(153, 27, 27);
    pdf.text("Valor aproximado por persona", marginX + 4, y + 6.5);
    writeRightAligned(pdf, formatCurrency(input.stats.precioPorPersona), 191, y + 6.5);
    y += 15;
  }

  if (input.stats.annualProjection.applies) {
    const requiredHeight = 17 + input.stats.annualProjection.rows.length * 6;
    ensureSpace(requiredHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      `REFERENCIA DE AJUSTE ANUAL (${input.stats.annualProjection.adjustmentPct}%)`,
      marginX,
      y + 4,
    );
    y += 8;
    input.stats.annualProjection.rows.forEach((row) => {
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total estimado ${row.year}`, marginX + 3, y + 4);
      pdf.setFont("helvetica", "bold");
      writeRightAligned(pdf, formatCurrency(row.total), 192, y + 4);
      y += 6;
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `El precio principal es el vigente ${input.stats.annualProjection.currentYear}; la proyección futura es informativa.`,
      marginX + 3,
      y + 4,
    );
    y += 10;
  }

  const terms =
    input.bookingTerms?.trim() ||
    "El presupuesto es válido por 30 días. Con una seña de $5.000 se puede solicitar la reserva; AK confirma disponibilidad y condiciones antes de registrar el pago.";
  const termLines = pdf.splitTextToSize(terms, 169) as string[];
  const termsHeight = Math.max(25, 14 + termLines.length * 4);
  ensureSpace(termsHeight + 5);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, y, contentWidth, termsHeight, 1.5, 1.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text("CONDICIONES", marginX + 4, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(71, 85, 105);
  pdf.text(termLines, marginX + 4, y + 11);
  y += termsHeight + 5;

  ensureSpace(15);
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Ver propuesta personalizada:", marginX, y + 4);
  pdf.setTextColor(29, 78, 216);
  pdf.textWithLink(
    pdf.splitTextToSize(input.publicUrl, contentWidth)[0],
    marginX,
    y + 9,
    { url: input.publicUrl },
  );

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(marginX, 282, 195, 282);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("AK Producciones | Salto, Uruguay", marginX, 288);
    writeRightAligned(pdf, `Página ${page} de ${totalPages}`, 195, 288);
  }

  return pdf;
}

export async function downloadSimulatorBudgetPdf(
  input: SimulatorBudgetPdfInput,
) {
  const pdf = await createSimulatorBudgetPdf(input);
  pdf.save(`presupuesto-ak-${input.documentId}.pdf`);
}
