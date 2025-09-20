
'use client';

import type { Presupuesto, PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ClipboardCopy, Send, Printer, Tag, Percent, FileText as FileTextIcon, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import Image from 'next/image';
import { Separator } from '../ui/separator';

// Company Info Constants from PDF
const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const COMPANY_LOGO_URL_PDF = "https://placehold.co/100x100/EF4444/FFFFFF.png?text=AK&font=montserrat";
const COMPANY_LOGO_AI_HINT_PDF = "AK Producciones logo";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";


interface Paso4ResumenProps {
  presupuesto: Presupuesto;
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
  if (!includeSymbol) return formatted;
  return useNUS ? `NU$ ${formatted}` : `$ ${formatted}`;
};

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return 'Fecha no especificada';
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

export default function Paso4Resumen({ presupuesto, formData, setFormData }: Paso4ResumenProps) {
  const { toast } = useToast();
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        const settings = await getBudgetDisplaySettings();
        setDisplaySettings(settings);
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
    eventYear > currentYear;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg print:shadow-none print:border-none" id="budget-summary-printable">
        <CardHeader className="bg-muted/10 p-4 md:p-6 print:p-2 print:bg-transparent">
          <h2 className="text-lg md:text-xl font-bold text-center mb-2 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h2>
          <div className="flex flex-col md:flex-row justify-between items-start text-xs print:text-[8pt] gap-2">
            <div className="space-y-px text-center md:text-left">
              <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
              <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
              <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
            </div>
            {displaySettings.showCompanyLogo && (
                <div className="w-20 h-20 print:w-16 print:h-16 flex-shrink-0 self-center md:self-start">
                    <Image src={COMPANY_LOGO_URL_PDF} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint={COMPANY_LOGO_AI_HINT_PDF}/>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 print:p-2 space-y-4 print:space-y-2">
          {displaySettings.showClientData && (
            <section className="mb-4 print:mb-2 text-sm print:text-[9pt] border-y py-1 print:py-0.5">
              <p className="font-semibold">{presupuesto.clienteNombre}</p>
            </section>
          )}
          
          <section className="mb-4 print:mb-2">
            <table className="w-full text-xs print:text-[7pt] border-collapse">
              <thead className="print:bg-gray-100">
                <tr>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de cliente</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de Documento</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Página</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Fecha</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.id.split('_')[1]?.substring(0,4) || 'N/A'}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.id.split('_').pop()?.substring(0,6)}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">1/1</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(presupuesto.timestamp, true)}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
            <section className="mb-4 print:mb-2">
              <table className="w-full text-xs print:text-[7pt] border-collapse">
                  <thead className="print:bg-gray-100">
                  <tr>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50 w-2/5">Artículo</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50 w-[10%]">Cantidad</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50 w-[10%]">Unidad</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Precio</th>
                       <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50 w-[10%]">Desc.%</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Importe total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {presupuesto.itemsPresupuestados.map((item) => (
                      <tr key={item.idServicioCatalogo}>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 align-top">
                        {item.esRegalo ? <span className="text-primary font-semibold flex items-center gap-1"><Gift className="w-3 h-3"/> {item.nombreServicio}</span> : item.nombreServicio}
                      </td>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">{item.cantidad}</td>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">$</td>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? <span className="line-through">{formatCurrency(item.precioUnitario, false)}</span> : formatCurrency(item.precioUnitario, false)}</td>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">
                          {descuentoAplicado > 0 && formData.descuentoTipo === 'porcentaje' && !item.esRegalo ? `${formData.descuentoValor}%` : ''}
                      </td>
                      <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top font-semibold">{item.esRegalo ? formatCurrency(0, false) : formatCurrency(item.costoTotalItem, false)}</td>
                      </tr>
                  ))}
                  </tbody>
              </table>
            </section>
          )}
          
          <section className="flex justify-end mb-4 print:mb-2 text-sm print:text-xs">
            <div className="w-full max-w-xs print:max-w-[200px] space-y-0.5">
              {descuentoAplicado > 0 && displaySettings.showPriceBreakdown && ( 
                <>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotalBruto, true, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-destructive">Descuento{formData.nombrePromocion ? ` (${formData.nombrePromocion})` : ''}:</span>
                    <span className="text-destructive">-{formatCurrency(descuentoAplicado, true, true)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-gray-400 print:border-gray-500">
                <span className="text-base">Importe total</span>
                <span className="text-base">{formatCurrency(totalFinal, true)}</span>
              </div>
            </div>
          </section>
          
          <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-2 print:pt-1.5 print:border-gray-400 text-xs print:text-[8pt] text-gray-600 print:text-black">
            <p>{BUDGET_DEPOSIT_NOTE_PDF}</p>
            {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-1 print:mt-0.5 whitespace-pre-line">{presupuesto.notas}</p>}
            {showAnnualAdjustmentLegend && (<p className="mt-1 print:mt-0.5 text-orange-600">Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.</p>)}
          </footer>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-primary/20 print:hidden mt-6">
        <CardHeader className="bg-primary/5 p-4 md:p-6"><CardTitle className="font-headline text-lg md:text-xl text-primary">Acciones y Compartir</CardTitle></CardHeader>
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handlePrint} className="w-full"><Printer className="w-4 h-4 mr-2"/>Imprimir o Guardar como PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
}
