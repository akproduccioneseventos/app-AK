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
  salonDetails?: {
    nombre: string;
    costo: number;
    aclaracion: string;
  };
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
    if (item.id === 'serv_salon_club_uruguay' || /salón club uruguay/i.test(item.nombre)) return;
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

  if (input.salonDetails) {
    ensureSpace(26);
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(245, 158, 11);
    pdf.roundedRect(marginX, y, contentWidth, 24, 1.5, 1.5, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(146, 64, 14);
    pdf.text(`LOCACIÓN: ${input.salonDetails.nombre.toUpperCase()}`, marginX + 4, y + 5.5);
    writeRightAligned(pdf, `Precio Real: $36.000 | Promo: ${formatCurrency(input.salonDetails.costo)}`, 191, y + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(180, 83, 9);
    const salonNoteLines = pdf.splitTextToSize(
      input.salonDetails.aclaracion ||
        `El alquiler del Salón Club Uruguay (Precio Real: $36.000, Precio Promo: $16.900) NO se suma en el total de este presupuesto de AK Producciones. Se abona mediante contrato y recibo de alquiler independiente directamente en la administración del Club Uruguay.`,
      172
    ) as string[];
    pdf.text(salonNoteLines, marginX + 4, y + 11);
    y += 28;
  }

  // 15-Minute Promo Urgency Box in PDF
  ensureSpace(32);
  pdf.setFillColor(254, 242, 242);
  pdf.setDrawColor(239, 68, 68);
  pdf.roundedRect(marginX, y, contentWidth, 30, 1.5, 1.5, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(185, 28, 28);
  pdf.text("ASEGURÁ TU PROMOCIÓN ANTES DE QUE TERMINE EL TIEMPO", marginX + 4, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Aprovecha estos 15 minutos para mantener la promocion y los descuentos incluidos en tu presupuesto.", marginX + 4, y + 11);
  pdf.text("Coordina una entrevista sin costo con AK Producciones, contanos como imaginas tu fiesta y recibi asesoramiento", marginX + 4, y + 16);
  pdf.text("para elegir la fecha, los servicios y la mejor opcion para tu presupuesto.", marginX + 4, y + 21);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(185, 28, 28);
  pdf.text("Comunicate ahora y me empeza a organizar tu fiesta completa con todo resuelto en un solo lugar.", marginX + 4, y + 26);
  y += 34;

  const termsText = [
    "Confirmá tu evento con una seña de solo $5.000 y la firma del contrato. La fecha se reserva para la primera persona que complete ambos pasos.",
    "El presupuesto tiene una validez de 30 días, manteniendo durante ese período el precio promocional y todos los regalos incluidos.",
    "Los valores corresponden a eventos realizados en 2026. Para fechas desde 2027 se aplicará un ajuste acumulativo del 15% por cada año adicional.",
    "No dejes pasar tu fecha: firmá el contrato, aboná la seña y empezá a preparar tu fiesta con AK Producciones."
  ].join("\n");

  const termLines = pdf.splitTextToSize(termsText, 169) as string[];
  const termsHeight = Math.max(30, 12 + termLines.length * 4.5);
  ensureSpace(termsHeight + 15);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, y, contentWidth, termsHeight, 1.5, 1.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text("RESERVÁ TU FECHA Y ASEGURÁ LA PROMOCIÓN", marginX + 4, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(51, 65, 85);
  pdf.text(termLines, marginX + 4, y + 11);
  y += termsHeight + 5;

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
