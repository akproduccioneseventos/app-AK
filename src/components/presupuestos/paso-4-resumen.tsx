
'use client';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardCopy, Printer, Gift, Share2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useMemo } from 'react';
import { getBudgetDisplaySettings, getWhatsAppTemplates } from '@/app/actions/settings';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings, WhatsAppTemplates } from '@/types/settings';
import Image from 'next/image';

// Company Info Constants
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_VALIDITY_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";

interface Paso4ResumenProps {
  presupuesto: Presupuesto;
}

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 } as Intl.NumberFormatOptions;
  const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
  if (!includeSymbol) return formatted;
  return useNUS ? `NU$ ${formatted}` : `$ ${formatted}`;
};

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return "Fecha no especificada";
  try {
    const date = new Date(dateString);
    const year = dateString.includes('T') ? date.getUTCFullYear() : date.getFullYear();
    const month = dateString.includes('T') ? date.getUTCMonth() : date.getMonth();
    const day = dateString.includes('T') ? date.getUTCDate() : date.getDate();

    if (shortMonth) {
      return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    }
    return new Date(year, month, day).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Fecha inválida';
  }
};

/** Generate annual price projection rows */
function generateProjectionRows(totalBase: number, adjustmentPct: number, currentYear: number, eventYear: number): { year: number; base: number; adjustment: number; total: number }[] {
  const rows: { year: number; base: number; adjustment: number; total: number }[] = [];
  const maxYears = 4;
  const yearsToShow = Math.min(Math.max(0, eventYear - currentYear), maxYears);

  if (yearsToShow <= 0) return rows;

  rows.push({ year: currentYear, base: totalBase, adjustment: 0, total: totalBase });

  let prevTotal = totalBase;
  for (let i = 1; i <= yearsToShow; i++) {
    const adj = Math.round(prevTotal * (adjustmentPct / 100));
    const newTotal = prevTotal + adj;
    rows.push({ year: currentYear + i, base: Math.round(prevTotal), adjustment: adj, total: newTotal });
    prevTotal = newTotal;
  }

  return rows;
}

export default function Paso4Resumen({ presupuesto }: Paso4ResumenProps) {
  const { toast } = useToast();
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplates | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        const [budgetSettings, templateSettings, whatsappTemplates] = await Promise.all([
          getBudgetDisplaySettings(),
          getInvoiceTemplateSettings(),
          getWhatsAppTemplates(),
        ]);
        setDisplaySettings(budgetSettings);
        setLogoUrl(templateSettings.logoUrl ?? null);
        setWaTemplates(whatsappTemplates);
      } catch (e) {
        toast({title: "Error", description: "No se pudo cargar la configuración de visualización.", variant: "destructive"});
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, [toast]);

  const { itemsAgrupados, costoTotalRegalos, subtotalBruto, descuentoPromocional, totalFinal } = useMemo(() => {
    if (!presupuesto) {
      return { itemsAgrupados: {}, costoTotalRegalos: 0, subtotalBruto: 0, descuentoPromocional: 0, totalFinal: 0 };
    }
    
    const itemsRegulares = presupuesto.itemsPresupuestados.filter(item => !item.esRegalo);
    const itemsRegalo = presupuesto.itemsPresupuestados.filter(item => item.esRegalo);

    const agrupados: Record<string, ItemPresupuestado[]> = itemsRegulares.reduce((acc, item) => {
        const categoria = item.categoriaServicio || 'Otros Servicios';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(item);
        return acc;
    }, {} as Record<string, ItemPresupuestado[]>);
    
    const sortedKeys = Object.keys(agrupados).sort((a,b) => a.localeCompare(b));
    const sortedAgrupados: Record<string, ItemPresupuestado[]> = {};
    sortedKeys.forEach(key => sortedAgrupados[key] = agrupados[key]);

    if (itemsRegalo.length > 0) {
      sortedAgrupados['Regalos Incluidos'] = itemsRegalo;
    }
    
    const costoRegalos = itemsRegalo.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const bruto = presupuesto.costoTotalEstimado;
    const descPromo = bruto - (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado);
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: bruto,
      descuentoPromocional: Math.max(0, descPromo),
      totalFinal: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado
    };

  }, [presupuesto]);
  
 const generarTextoWhatsApp = () => {
    if (!presupuesto) return '';
    const pageUrl = `${window.location.origin}/presupuestos/${presupuesto.id}/ver`;

    // Use the configurable budgetShareTemplate when available; fall back to hardcoded text
    const template = waTemplates?.budgetShareTemplate;
    if (template) {
      const fechaEvento = presupuesto.eventoFecha
        ? new Date(presupuesto.eventoFecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
        : '';
      const baseText = template
        .replace(/\{\{NOMBRE\}\}/g, presupuesto.clienteNombre || '')
        .replace(/\{\{FECHA_EVENTO\}\}/g, fechaEvento)
        .replace(/\{\{LINK\}\}/g, pageUrl);
      return annualAdjustmentAmount > 0
        ? `${baseText}\nAjuste anual (${adjustmentPct}%): ${formatCurrency(annualAdjustmentAmount, true)}\nTotal final: ${formatCurrency(adjustedTotal, true)}`
        : baseText;
    }

    // Fallback
    let texto = `🎉 *¡Hola ${presupuesto.clienteNombre}!* 🎉\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}*.`;
    texto += ` Hemos preparado un presupuesto para tu *${presupuesto.eventoTipo}*.\n\n`;
    texto += `Puedes ver todos los detalles en el siguiente enlace:\n`;
    texto += pageUrl;
    if (annualAdjustmentAmount > 0) {
      texto += `\n\nAjuste anual (${adjustmentPct}%): ${formatCurrency(annualAdjustmentAmount, true)}`;
      texto += `\nTotal final: ${formatCurrency(adjustedTotal, true)}`;
    }
    texto += `\n\n¡Esperamos tu consulta!\n*El equipo de ${COMPANY_NAME_BRAND}*`;
    return texto;
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generarTextoWhatsApp())
      .then(() => toast({ title: "¡Texto Copiado!", description: "Resumen copiado para WhatsApp." }))
      .catch(() => toast({ title: "Error al Copiar", variant: "destructive" }));
  };
  
  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`, '_blank');
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (isLoadingSettings) {
    return <div className="flex justify-center items-center h-64"><p>Cargando previsualización...</p></div>;
  }
  if (!presupuesto || !displaySettings) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Error al Generar Resumen</p>
        <p className="text-muted-foreground">No se pudieron cargar todos los datos necesarios.</p>
      </div>
    );
  }
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);
  
  const eventYear = presupuesto.eventoFecha ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  const adjustmentPct = presupuesto.ajusteAnualPorcentaje ?? displaySettings?.annualAdjustmentPercentage ?? 15;
  const showAnnualAdjustmentLegend = 
    adjustmentPct > 0 && 
    eventYear > currentYear && 
    presupuesto?.estado !== 'Facturado';

  const projectionRows = showAnnualAdjustmentLegend
    ? generateProjectionRows(totalFinal, adjustmentPct, currentYear, eventYear)
    : [];
  const adjustedTotal = projectionRows.length > 0 ? projectionRows[projectionRows.length - 1].total : totalFinal;
  const annualAdjustmentAmount = Math.max(0, adjustedTotal - totalFinal);
  const nextYear = currentYear + 1;
  const nextYearProjectedTotal = Math.round(totalFinal * (1 + adjustmentPct / 100));
    
  const budgetNumber = presupuesto.numero || (presupuesto.id.split('_').pop() || presupuesto.id).substring(0,6).toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Printable Budget Document ── */}
      <div className="budget-print-document bg-white print:bg-[#ffffff]" id="budget-summary-printable">
        {/* Wrapping table for repeating thead/tfoot in print */}
        <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <tr><td className="p-0">
              {/* Repeating header for each print page */}
              <div className="budget-print-thead-content" style={{ padding: '0 0 4px 0' }}>
                <p className="text-[8px] text-gray-500 text-center print:text-[7pt]">
                  {presupuesto.clienteNombre} — Presupuesto #{budgetNumber} — {formatDate(presupuesto.timestamp, true)}
                </p>
              </div>
            </td></tr>
          </thead>
          <tfoot>
            <tr><td className="p-0">
              {/* Repeating footer (signatures) for each print page */}
              <div className="budget-print-tfoot-content" style={{ paddingTop: '20px' }}>
                <div className="flex justify-between" style={{ gap: '40px' }}>
                  <div className="text-center flex-1" style={{ borderTop: '1px solid #666', paddingTop: '6px' }}>
                    <p className="text-[9px] text-gray-700 font-semibold print:text-[7pt]">Firma del Cliente</p>
                    <p className="text-[8px] text-gray-500 print:text-[6pt]">{presupuesto.clienteNombre}</p>
                  </div>
                  <div className="text-center flex-1" style={{ borderTop: '1px solid #666', paddingTop: '6px' }}>
                    <p className="text-[9px] text-gray-700 font-semibold print:text-[7pt]">Firma y sello de la empresa</p>
                    <p className="text-[8px] text-gray-500 print:text-[6pt]">{COMPANY_NAME_BRAND}</p>
                  </div>
                </div>
              </div>
            </td></tr>
          </tfoot>
          <tbody>
            <tr><td className="p-0">

        {/* ═══ DOCUMENT CONTENT ═══ */}
        <Card className="shadow-lg print:shadow-none print:border-none print:bg-transparent">

          {/* HEADER — Title + company info + logo */}
          <CardHeader className="p-4 md:p-6 print:p-0 print:pb-2">
            {/* Main title centered */}
            <h1 className="text-center text-base md:text-lg font-extrabold uppercase tracking-wide text-gray-900 print:text-[12pt] mb-3 print:mb-2"
                style={{ borderBottom: '2px solid #0f172a' }}>
              Presupuesto para fiestas o eventos - {COMPANY_NAME_BRAND}
            </h1>

            <div className="flex justify-between items-start gap-3 print:gap-2">
              {/* Company info — left */}
              <div className="space-y-0.5 text-xs print:text-[8pt]">
                <p className="font-bold text-gray-800">{COMPANY_CONTACT_PERSON}</p>
                <p className="text-gray-600">{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
                <p className="text-gray-600">{COMPANY_CONTACT_EMAIL_PDF}</p>
                <p className="text-gray-600">{COMPANY_WEBSITE_PDF}</p>
              </div>
              {/* Logo — right */}
              <div className="flex-shrink-0">
                {displaySettings.showCompanyLogo && logoUrl ? (
                  <div className="w-20 h-20 print:w-[65px] print:h-[65px]">
                    <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint="company logo" />
                  </div>
                ) : (
                  <span className="text-lg font-extrabold tracking-widest text-gray-800 uppercase print:text-[14pt]">
                    {COMPANY_NAME_BRAND}
                  </span>
                )}
              </div>
            </div>

            {/* Centered "Presupuesto" label */}
            <p className="text-center font-bold text-sm uppercase tracking-widest text-gray-700 mt-3 print:text-[10pt] print:mt-2"
               style={{ backgroundColor: '#f8fafc', padding: '4px 0', borderRadius: '2px' }}>
              Presupuesto
            </p>
          </CardHeader>

          <CardContent className="p-4 md:p-6 print:p-0 space-y-4 print:space-y-3">

            {/* Note at top */}
            <p className="text-[10px] text-center text-gray-600 italic print:text-[7pt] border border-gray-300 rounded px-2 py-1 print:border-gray-400"
               style={{ backgroundColor: '#ffffff' }}>
              {BUDGET_VALIDITY_NOTE_PDF}
            </p>

            {/* Document data table */}
            <section className="mb-3 print:mb-2">
              <table className="w-full text-xs print:text-[8pt] border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Nº de cliente</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Nº de Documento</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">Página</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Fecha</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Válido hasta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono">{presupuesto.clienteNombre.substring(0, 3).toUpperCase()}-{presupuesto.id.substring(0, 4).toUpperCase()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono font-semibold">#{budgetNumber}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">1/1</td>
                    <td className="border border-gray-300 px-2 py-1.5">{formatDate(presupuesto.timestamp, true)}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Client + event data */}
            <section className="mb-3 print:mb-2 border border-gray-300 rounded px-3 py-2 print:border-gray-400"
                     style={{ backgroundColor: '#ffffff' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm print:text-[8.5pt]">
                {displaySettings.showClientData && (
                  <>
                    <p><span className="font-semibold">Cliente:</span> {presupuesto.clienteNombre}</p>
                    {presupuesto.clienteContacto && (
                      <p><span className="font-semibold">Contacto:</span> {presupuesto.clienteContacto}</p>
                    )}
                  </>
                )}
                <p><span className="font-semibold">Tipo de evento:</span> {presupuesto.eventoTipo}</p>
                <p><span className="font-semibold">Fecha del evento:</span> {formatDate(presupuesto.eventoFecha)}</p>
                <p><span className="font-semibold">Lugar / Salón:</span> {presupuesto.salonFiestas}</p>
                <p><span className="font-semibold">Número de invitados:</span> {presupuesto.invitadosCantidad}</p>
              </div>
            </section>

            {/* Services/items table */}
            {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
              <section className="mb-3 print:mb-2">
                <table className="w-full text-xs print:text-[8pt] border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                      <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold" style={{ width: '40%' }}>Artículo</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Cantidad</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Unidad</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Precio</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Desc.%</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Importe total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                      <React.Fragment key={categoria}>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <td colSpan={6} className="border border-gray-400 px-2 py-1 font-bold text-gray-700 text-xs print:text-[7.5pt] uppercase tracking-wide">
                            {categoria}
                          </td>
                        </tr>
                        {items.map((item) => (
                          <tr key={item.idServicioCatalogo} style={{ backgroundColor: '#ffffff' }}>
                            <td className="border border-gray-300 px-2 py-1.5 align-top">
                              {item.esRegalo ? (
                                <div>
                                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                                    <Gift className="w-3 h-3 print:hidden" /> {item.nombreServicio}
                                  </span>
                                  <span className="text-[10px] text-slate-500 italic block print:text-[7pt]">Regalo exclusivo</span>
                                </div>
                              ) : item.nombreServicio}
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">{item.cantidad}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">Serv.</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                              {formatCurrency(item.precioUnitario, true)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                              {item.esRegalo ? '100%' : '—'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1.5 text-right align-top font-semibold">
                              {item.esRegalo
                                ? <span className="text-slate-700 font-bold">$ 0,00</span>
                                : formatCurrency(item.costoTotalItem, true)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {annualAdjustmentAmount > 0 && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right font-semibold text-xs">
                          Ajuste anual ({adjustmentPct}%):
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold text-xs">
                          {formatCurrency(annualAdjustmentAmount, true)}
                        </td>
                      </tr>
                    )}
                    {/* Total row */}
                    <tr style={{ backgroundColor: '#f8fafc', color: '#111827' }}>
                      <td colSpan={5} className="border border-gray-300 px-2 py-2 text-right font-bold text-sm print:text-[10pt]">
                        Importe total
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right font-bold text-sm print:text-[10pt]">
                        {formatCurrency(adjustedTotal, true)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* Totals breakdown */}
            <section className="flex justify-end mb-3 print:mb-2">
              <div className="w-full max-w-xs print:max-w-[240px] border border-gray-300 print:border-gray-400 rounded p-3 print:p-2 space-y-1 text-sm print:text-[9pt]"
                   style={{ backgroundColor: '#ffffff' }}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotalBruto, true)}</span>
                </div>
                {descuentoPromocional > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Descuento{presupuesto.nombrePromocion ? ` (${presupuesto.nombrePromocion})` : ''}:</span>
                    <span>−{formatCurrency(descuentoPromocional, true)}</span>
                  </div>
                )}
                {costoTotalRegalos > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Ahorro en Regalos:</span>
                    <span>−{formatCurrency(costoTotalRegalos, true)}</span>
                  </div>
                )}
                {(() => {
                  const markupPct = presupuesto.marketingMarkupPercent || 0;
                  const precioLista = markupPct > 0 ? Math.round(totalFinal * (1 + markupPct / 100)) : 0;
                  const ahorroMkt = precioLista > 0 ? precioLista - totalFinal : 0;
                  if (precioLista > 0) {
                    return (
                      <>
                        <div className="flex justify-between text-gray-400 line-through">
                          <span>Precio de Lista (+{markupPct}%):</span>
                          <span>{formatCurrency(precioLista, true)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700 font-semibold">
                          <span>Ahorro:</span>
                          <span>−{formatCurrency(ahorroMkt, true)}</span>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
                {annualAdjustmentAmount > 0 && (
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Ajuste anual ({adjustmentPct}%):</span>
                    <span>+{formatCurrency(annualAdjustmentAmount, true)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t-2 border-gray-700 pt-1.5 mt-1">
                  <span className="text-base print:text-[11pt]">TOTAL</span>
                  <span className="text-base print:text-[11pt]">{formatCurrency(adjustedTotal, true)}</span>
                </div>

                {/* Total with annual projection inline */}
                {projectionRows.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 space-y-0.5 text-[10px] print:text-[7pt]">
                    <p className="font-semibold text-gray-700">Precio con ajuste anual ({adjustmentPct}%):</p>
                    {projectionRows.map((row) => (
                      <div key={row.year} className="flex justify-between text-gray-600">
                        <span>{row.year === currentYear ? `Precio ${currentYear}` : `Precio al 1/1/${row.year}`}:</span>
                        <span className="font-semibold">{formatCurrency(row.total, true)}</span>
                      </div>
                    ))}
                    <p className="pt-1 text-gray-700 font-semibold">
                      Precio {currentYear}: {formatCurrency(totalFinal, true)} — Si tu evento es en {nextYear}, el precio será {formatCurrency(nextYearProjectedTotal, true)} (+{adjustmentPct}%).
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Annual Projection Table */}
            {projectionRows.length > 0 && (
              <section className="mb-3 print:mb-2">
                <h3 className="text-xs font-bold text-gray-800 mb-2 print:text-[9pt] text-center uppercase"
                    style={{ backgroundColor: '#f8fafc', padding: '4px', borderRadius: '2px' }}>
                  Proyección de Precios por Año (ajuste del {adjustmentPct}% anual al 1° de enero)
                </h3>
                <table className="w-full text-xs print:text-[8pt] border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                      <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold">Año</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Precio Base</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Ajuste {adjustmentPct}%</th>
                      <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Total Ajustado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionRows.map((row) => (
                      <tr key={row.year} style={{ backgroundColor: '#ffffff' }}>
                        <td className="border border-gray-300 px-2 py-1.5 font-semibold">
                          {row.year} {row.year === currentYear ? '(actual)' : `(1° de enero)`}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right">{formatCurrency(row.base, true)}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right">
                          {row.adjustment === 0 ? '—' : `+${formatCurrency(row.adjustment, true)}`}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{formatCurrency(row.total, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Footer — deposit note, legal, notes */}
            <footer className="mt-4 pt-3 border-t border-gray-300 text-xs print:text-[8pt] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800 print:text-black">{BUDGET_VALIDITY_NOTE_PDF}</p>
              {presupuesto.notas && displaySettings.showPaymentMethodNotes && (
                <p className="whitespace-pre-line">{presupuesto.notas}</p>
              )}
              {showAnnualAdjustmentLegend && (
                <p className="text-orange-600 print:text-orange-700">
                  Nota: Precios {currentYear} — Ajuste anual del {adjustmentPct}% para eventos futuros (acumulativo al 1° de enero de cada año).
                </p>
              )}

              {/* Value Propositions — screen only */}
              {displaySettings?.valuePropositions && displaySettings.valuePropositions.length > 0 && (
                <div className="mt-8 p-6 bg-slate-50 rounded-xl print:hidden">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
                    ¿Por qué elegir AK Producciones?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displaySettings.valuePropositions.map((vp, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{vp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </footer>

          </CardContent>
        </Card>

            </td></tr>
          </tbody>
        </table>
      </div>

      {/* ── UI Actions card — hidden on print ── */}
      <Card className="shadow-md border-primary/20 print:hidden mt-6">
        <CardHeader className="bg-primary/5 p-4 md:p-6">
          <CardTitle className="font-headline text-lg md:text-xl text-primary">Acciones y Compartir</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handlePrint} className="w-full"><Printer className="w-4 h-4 mr-2" />Imprimir o Guardar como PDF</Button>
          <Button variant="secondary" onClick={handleShareWhatsApp} className="w-full"><Share2 className="w-4 h-4 mr-2" />Enviar por WhatsApp</Button>
          <Button variant="secondary" onClick={handleCopyToClipboard} className="w-full"><ClipboardCopy className="w-4 h-4 mr-2" />Copiar Resumen</Button>
        </CardContent>
      </Card>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm 1cm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .budget-print-document {
            background-color: #ffffff !important;
          }
          .budget-print-thead-content {
            border-bottom: 1px solid #ccc;
            margin-bottom: 8px;
          }
          .budget-print-tfoot-content {
            border-top: 1px solid #ccc;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}
