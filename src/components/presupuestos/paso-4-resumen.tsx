
'use client';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardCopy, Printer, Gift, Share2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useMemo } from 'react';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import Image from 'next/image';

// Company Info Constants - To be moved to a settings file eventually
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.";

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

export default function Paso4Resumen({ presupuesto }: Paso4ResumenProps) {
  const { toast } = useToast();
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        const [budgetSettings, templateSettings] = await Promise.all([
          getBudgetDisplaySettings(),
          getInvoiceTemplateSettings(),
        ]);
        setDisplaySettings(budgetSettings);
        setLogoUrl(templateSettings.logoUrl ?? null);
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
    let texto = `🎉 *¡Hola ${presupuesto.clienteNombre}!* 🎉\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}*.`;
    texto += ` Hemos preparado un presupuesto para tu *${presupuesto.eventoTipo}*.\n\n`;
    texto += `Puedes ver todos los detalles en el siguiente enlace:\n`;
    texto += pageUrl;
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
  const showAnnualAdjustmentLegend = 
    displaySettings?.annualAdjustmentPercentage && 
    displaySettings.annualAdjustmentPercentage > 0 && 
    eventYear > currentYear && 
    presupuesto?.estado !== 'Facturado';
    
  return (
    <div className="space-y-6">
      {/* ── Printable Budget Document ── */}
      <Card className="shadow-lg print:shadow-none print:border-none" id="budget-summary-printable">

        {/* HEADER — company branding */}
        <CardHeader className="p-4 md:p-6 print:p-0 print:bg-transparent">
          <div className="print-header flex flex-col md:flex-row justify-between items-start gap-3
                          border-b-2 border-gray-800 pb-3 mb-4
                          print:flex print:flex-row print:justify-between print:items-start
                          print:border-b-2 print:border-black print:pb-2 print:mb-3">

            {/* Company info block */}
            <div className="print-header-company space-y-0.5">
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-gray-900 print:text-[13pt] print:mb-1">
                {COMPANY_NAME_BRAND}
              </h2>
              <p className="text-xs font-semibold text-gray-700 print:text-[8pt]">{COMPANY_CONTACT_PERSON}</p>
              <p className="text-xs text-gray-600 print:text-[8pt]">{COMPANY_ADDRESS_LINE1_PDF} — {COMPANY_ADDRESS_LINE2_PDF}</p>
              <p className="text-xs text-gray-600 print:text-[8pt]">{COMPANY_CONTACT_EMAIL_PDF}</p>
              <p className="text-xs text-gray-600 print:text-[8pt]">{COMPANY_WEBSITE_PDF}</p>
            </div>

            {/* Logo + document title */}
            <div className="flex flex-col items-end gap-2 print-header-logo">
              {displaySettings.showCompanyLogo && logoUrl ? (
                <div className="w-20 h-20 print:w-[70px] print:h-[70px] flex-shrink-0">
                  <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint="company logo" />
                </div>
              ) : (
                <div className="flex items-center justify-end">
                  <span className="text-2xl font-extrabold tracking-widest text-gray-800 uppercase print:text-[18pt]">
                    {COMPANY_NAME_BRAND}
                  </span>
                </div>
              )}
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wider text-right print:text-[10pt]">
                Presupuesto para fiestas o eventos
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 print:p-0 space-y-4 print:space-y-3">

          {/* Budget meta — number, dates */}
          <section className="mb-4 print:mb-2">
            <table className="w-full text-xs print:text-[8pt] border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Nº Presupuesto</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Fecha de emisión</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Válido hasta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1.5 font-mono font-semibold">#{presupuesto.id.split('_').pop()?.substring(0,6).toUpperCase()}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{formatDate(presupuesto.timestamp, true)}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Client + event data */}
          <section className="print-client-section mb-4 print:mb-3
                              bg-gray-50 border border-gray-300 rounded-md px-4 py-3
                              print:bg-gray-100 print:border-gray-400 print:rounded-none print:px-3 print:py-2">
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
              {/* Canva catalog link based on event type */}
              {(() => {
                const tipo = (presupuesto.eventoTipo || '').toLowerCase();
                let canvaUrl: string | null = null;
                let canvaLabel = 'Ver Catálogo';
                if (tipo.includes('boda') || tipo.includes('casamiento')) {
                  canvaUrl = 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas';
                  canvaLabel = '💍 Ver Catálogo de Bodas';
                } else if (tipo.includes('xv') || tipo.includes('quince')) {
                  canvaUrl = 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web';
                  canvaLabel = '👑 Ver Catálogo XV Años';
                } else if (tipo.includes('catering')) {
                  canvaUrl = 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering';
                  canvaLabel = '🍽️ Ver Catálogo Catering';
                } else {
                  canvaUrl = 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web';
                  canvaLabel = '🎉 Ver Catálogo de Fiestas';
                }
                return (
                  <div className="mt-2 print:hidden">
                    <a href={canvaUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-xs">{canvaLabel}</Button>
                    </a>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Items table */}
          {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
            <section className="mb-4 print:mb-3">
              <table className="w-full text-xs print:text-[8pt] border-collapse">
                <thead>
                  <tr className="bg-gray-800 print:bg-gray-800 text-white">
                    <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold w-3/5">Descripción del Servicio</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Precio unitario</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                    <React.Fragment key={categoria}>
                      {/* Category separator row */}
                      <tr className="print-category-row bg-gray-200 print:bg-gray-200">
                        <td colSpan={3} className="border border-gray-400 px-2 py-1 font-bold text-gray-700 text-xs print:text-[7.5pt] uppercase tracking-wide">
                          {categoria}
                        </td>
                      </tr>
                      {items.map((item) => (
                        <tr key={item.idServicioCatalogo} className="even:bg-gray-50 print:even:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 align-top">
                            {item.esRegalo ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1 print:text-green-800">
                                <Gift className="w-3 h-3 print:hidden" /> {item.nombreServicio}
                                <span className="text-xs font-normal italic print:inline">&nbsp;(regalo)</span>
                              </span>
                            ) : item.nombreServicio}
                          </td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                            {item.esRegalo
                              ? <span className="line-through text-gray-400">{formatCurrency(item.precioUnitario, true)}</span>
                              : formatCurrency(item.precioUnitario, true)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right align-top font-semibold">
                            {item.esRegalo ? <span className="text-emerald-700 print:text-green-800 font-bold">$ 0,00</span> : formatCurrency(item.costoTotalItem, true)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Totals */}
          <section className="print-totals flex justify-end mb-4 print:mb-3">
            <div className="print-totals-inner w-full max-w-xs print:max-w-[240px] border border-gray-300 print:border-gray-400 rounded-md print:rounded-none p-3 print:p-2 space-y-1 text-sm print:text-[9pt]">
              <div className="print-total-row flex justify-between">
                <span className="text-gray-600 print:text-gray-700">Subtotal:</span>
                <span>{formatCurrency(subtotalBruto, true, true)}</span>
              </div>
              {descuentoPromocional > 0 && (
                <div className="print-total-row print-discount flex justify-between text-red-600 print:text-red-700">
                  <span>Descuento{presupuesto.nombrePromocion ? ` (${presupuesto.nombrePromocion})` : ''}:</span>
                  <span>−{formatCurrency(descuentoPromocional, true, true)}</span>
                </div>
              )}
              {costoTotalRegalos > 0 && (
                <div className="print-total-row print-gift flex justify-between text-emerald-700 print:text-green-800">
                  <span>Ahorro en Regalos:</span>
                  <span>−{formatCurrency(costoTotalRegalos, true, true)}</span>
                </div>
              )}
              {(() => {
                const markupPct = presupuesto.marketingMarkupPercent || 0;
                const precioLista = markupPct > 0 ? Math.round(totalFinal * (1 + markupPct / 100)) : 0;
                const ahorroMkt = precioLista > 0 ? precioLista - totalFinal : 0;
                if (precioLista > 0) {
                  return (
                    <>
                      <div className="print-total-row flex justify-between text-gray-400 print:text-gray-500 line-through">
                        <span>Precio de Lista (+{markupPct}%):</span>
                        <span>{formatCurrency(precioLista, true, true)}</span>
                      </div>
                      <div className="print-total-row flex justify-between text-violet-700 print:text-violet-800 font-semibold">
                        <span>Ahorro:</span>
                        <span>−{formatCurrency(ahorroMkt, true, true)}</span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
              <div className="print-total-row print-total-final flex justify-between font-bold border-t-2 border-gray-700 print:border-black pt-1.5 mt-1">
                <span className="text-base print:text-[11pt]">TOTAL</span>
                <span className="text-base print:text-[11pt]">{formatCurrency(totalFinal, true)}</span>
              </div>
            </div>
          </section>

          {/* Footer — deposit note, legal, notes */}
          <footer className="print-footer mt-6 pt-4 border-t border-gray-300 print:border-gray-500 text-xs print:text-[8pt] text-gray-600 print:text-gray-800 space-y-1 print:space-y-0.5">
            <p className="font-semibold text-gray-800 print:text-black">{BUDGET_DEPOSIT_NOTE_PDF}</p>
            {presupuesto.notas && displaySettings.showPaymentMethodNotes && (
              <p className="whitespace-pre-line">{presupuesto.notas}</p>
            )}
            {showAnnualAdjustmentLegend && (
              <p className="text-orange-600 print:text-orange-700">
                Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.
              </p>
            )}

            {/* Value Propositions — marketing block, screen only */}
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

            {/* Signature area — visible on screen and in print */}
            <div className="flex justify-between mt-10 pt-4 border-t border-gray-300 print:border-gray-500 print-signature-area">
              <div className="print-signature-block text-center" style={{ width: '38%', borderTop: '1px solid #999', paddingTop: '8px' }}>
                <p className="text-xs text-gray-600 print:text-[8pt] print:text-gray-800">Firma del Cliente</p>
                <p className="text-xs text-gray-500 mt-1 print:text-[8pt]">{presupuesto.clienteNombre}</p>
              </div>
              <div className="print-signature-block text-center" style={{ width: '38%', borderTop: '1px solid #999', paddingTop: '8px' }}>
                <p className="text-xs text-gray-600 print:text-[8pt] print:text-gray-800">Firma y sello de la empresa</p>
                <p className="text-xs text-gray-500 mt-1 print:text-[8pt]">{COMPANY_NAME_BRAND}</p>
              </div>
            </div>
          </footer>

        </CardContent>
      </Card>

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
    </div>
  );
}
