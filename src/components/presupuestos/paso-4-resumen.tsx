
'use client';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import BudgetDocument from '@/components/budget/BudgetDocument';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardCopy, Printer, Gift, Share2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useMemo } from 'react';
import { getBudgetDisplaySettings, getWhatsAppTemplates } from '@/app/actions/settings';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings, WhatsAppTemplates } from '@/types/settings';
import Image from 'next/image';
import { calculateBudgetFinancials } from '@/lib/budget/financial-guardrails';

// Company Info Constants
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproducciones.uy";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_VALIDITY_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";

interface Paso4ResumenProps {
  presupuesto: Presupuesto;
}

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 } as Intl.NumberFormatOptions;
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
    const financials = calculateBudgetFinancials(presupuesto, { preserveStoredTotal: true });
    const bruto = presupuesto.costoTotalEstimado;
    const descPromo = bruto - financials.total;
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: bruto,
      descuentoPromocional: Math.max(0, descPromo),
      totalFinal: financials.total || presupuesto.totalConDescuento || presupuesto.costoTotalEstimado
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
        ? `${baseText}\nProyección informativa ${eventYear}: ${formatCurrency(adjustedTotal, true)}`
        : baseText;
    }

    // Fallback
    let texto = `🎉 *¡Hola ${presupuesto.clienteNombre}!* 🎉\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}*.`;
    texto += ` Hemos preparado un presupuesto para tu *${presupuesto.eventoTipo}*.\n\n`;
    texto += `Puedes ver todos los detalles en el siguiente enlace:\n`;
    texto += pageUrl;
    if (annualAdjustmentAmount > 0) {
      texto += `\n\nProyección informativa ${eventYear}: ${formatCurrency(adjustedTotal, true)}`;
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
  const isContracted = presupuesto?.estado === 'Aceptado' || presupuesto?.estado === 'Facturado';
  const showAnnualAdjustmentLegend = 
    isContracted &&
    adjustmentPct > 0 && 
    eventYear > currentYear && 
    presupuesto?.ajusteAnualActivo === true;

  const projectionRows = showAnnualAdjustmentLegend
    ? generateProjectionRows(totalFinal, adjustmentPct, currentYear, eventYear)
    : [];
  const adjustedTotal = projectionRows.length > 0 ? projectionRows[projectionRows.length - 1].total : totalFinal;
  const annualAdjustmentAmount = Math.max(0, adjustedTotal - totalFinal);
  const nextYear = currentYear + 1;
  const nextYearProjectedTotal = Math.round(totalFinal * (1 + adjustmentPct / 100));
    
  const budgetNumber = presupuesto.numero || (presupuesto.id.split('_').pop() || presupuesto.id).substring(0,6).toUpperCase();
  const shouldShowBudgetSignatures =
    presupuesto.estado === 'Aceptado' ||
    presupuesto.estado === 'Facturado' ||
    Boolean(presupuesto.fechaFirmaContrato);

  return (
    <div className="space-y-6">
      <div id="budget-summary-printable">
        <BudgetDocument
          presupuesto={presupuesto}
          logoUrl={logoUrl}
          adjustmentPct={adjustmentPct}
          annualAdjustmentAmount={annualAdjustmentAmount}
          showPriceBreakdown={displaySettings.showPriceBreakdown}
          pricePerPerson={0}
          clienteNombre={presupuesto.clienteNombre}
          showSignatures={shouldShowBudgetSignatures}
          itemsAgrupadosOverride={itemsAgrupados}
          subtotalBrutoOverride={subtotalBruto}
          descuentoPromoOverride={descuentoPromocional}
          totalFinalOverride={totalFinal}
        />
      </div>

      {/* ── UI Actions card — hidden on print ── */}
      <Card className="shadow-md border-primary/20 print:hidden mt-6">
        <CardHeader className="bg-primary/5 p-4 md:p-6">
          <CardTitle className="font-headline text-lg md:text-xl text-primary">Acciones y Compartir</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handlePrint} className="w-full"><Printer className="w-4 h-4 mr-2 shrink-0" /><span className="truncate">Imprimir o Guardar como PDF</span></Button>
          <Button variant="secondary" onClick={handleShareWhatsApp} className="w-full"><Share2 className="w-4 h-4 mr-2 shrink-0" /><span className="truncate">Enviar por WhatsApp</span></Button>
          <Button variant="secondary" onClick={handleCopyToClipboard} className="w-full"><ClipboardCopy className="w-4 h-4 mr-2 shrink-0" /><span className="truncate">Copiar Resumen</span></Button>
        </CardContent>
      </Card>
    </div>
  );
}
