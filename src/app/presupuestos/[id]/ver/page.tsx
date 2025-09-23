
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, Coins, StickyNote, FileSignature, MessageSquare, Mail, Percent, Tag, Phone, Globe as GlobeIcon, Share2, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido'; 

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 };
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

const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.";

export default function VerPresupuestoPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [armadoRapidoConfig, setArmadoRapidoConfig] = useState<{ descuentoGeneral?: number } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) { setError("ID de presupuesto no válido."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings, armadoConfig] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings(),
        getInvoiceTemplateSettings(),
        getArmadoRapidoConfig()
      ]);
      setDisplaySettings(fetchedSettings);
      setLogoUrl(templateSettings.logoUrl);
      setArmadoRapidoConfig(armadoConfig);
      if (fetchedPresupuesto) {
        setPresupuesto(fetchedPresupuesto);
      } else {
        setError(`Presupuesto con ID ${presupuestoId} no encontrado.`);
        toast({ title: "Error", description: `Presupuesto no encontrado.`, variant: "destructive"});
      }
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el presupuesto.");
      toast({ title: "Error al Cargar", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]); 

  useEffect(() => {
    fetchPresupuestoAndSettings();
  }, [fetchPresupuestoAndSettings]);

  const handleCreateInvoice = () => {
    if (presupuesto) router.push(`/invoices/new?fromPresupuesto=${presupuesto.id}`);
  };
  
  const handlePrint = () => {
    const printContents = document.getElementById('invoice-to-print')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // Use reload to ensure styles and scripts are reloaded correctly after print
      window.location.reload(); 
    }
  };
  
  const generarTextoWhatsApp = () => {
    if (!presupuesto) return '';
    const pageUrl = `${window.location.origin}/presupuestos/${presupuesto.id}/ver`;
    let texto = `🎉 *¡Hola ${presupuesto.clienteNombre}!* 🎉\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}*.`;
    texto += ` Hemos preparado un presupuesto para tu *${presupuesto.eventoTipo}*.\n\n`;
    texto += `Puedes ver todos los detalles en el siguiente enlace:\n`;
    texto += pageUrl;
    texto += `\n\n¡Esperamos tu consulta!\n*El equipo de AK PRODUCCIONES*`;
    return texto;
  };
  
  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`, '_blank');
  };

  const { itemsAgrupados, costoTotalRegalos, subtotalBruto, descuentoPromocional, totalConDescuento, ajustesAnuales, totalFinal } = useMemo(() => {
    if (!presupuesto || !displaySettings) {
      return { itemsAgrupados: {}, costoTotalRegalos: 0, subtotalBruto: 0, descuentoPromocional: 0, totalConDescuento: 0, ajustesAnuales: [], totalFinal: 0 };
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
    const totalDescuento = presupuesto.totalConDescuento ?? bruto;

    let ajustes: { anio: number; monto: number; totalAcumulado: number }[] = [];
    let montoAjustable = totalDescuento;
    let totalAjustado = totalDescuento;

    if (presupuesto.ajusteAnualActivo && presupuesto.eventoFecha && displaySettings.annualAdjustmentPercentage && displaySettings.annualAdjustmentPercentage > 0) {
        const anioCreacion = new Date(presupuesto.timestamp).getFullYear();
        const anioEvento = new Date(presupuesto.eventoFecha).getFullYear();
        for (let anio = anioCreacion + 1; anio <= anioEvento; anio++) {
            const ajuste = montoAjustable * (displaySettings.annualAdjustmentPercentage / 100);
            montoAjustable += ajuste;
            totalAjustado = montoAjustable;
            ajustes.push({ anio, monto: ajuste, totalAcumulado: montoAjustable });
        }
    }
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: bruto,
      descuentoPromocional: Math.max(0, descPromo),
      totalConDescuento: totalDescuento,
      ajustesAnuales: ajustes,
      totalFinal: totalAjustado,
    };

  }, [presupuesto, displaySettings]);
  
  const getDisplayQuantity = (item: ItemPresupuestado, invitados: number): string => {
    switch (item.calculationMethod) {
      case 'porPersona':
        return `${invitados}`;
      case 'ratio':
        if (item.invitadosPorUnidad && item.invitadosPorUnidad > 0) {
          return `${Math.ceil(invitados / item.invitadosPorUnidad)}`;
        }
        return `${item.cantidad}`;
      case 'fijo':
      case 'tramos':
      default:
        return `${item.cantidad}`;
    }
  };


  if (isLoading || !displaySettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  }
  if (error || !presupuesto) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos/nuevo" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link></div>;
  }
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);
    
  const protagonistas = [presupuesto.protagonista1Nombre, presupuesto.protagonista2Nombre].filter(Boolean).join(' y ');

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans text-gray-800 print:text-black">
      <div className="flex justify-between items-center mb-6 print:hidden max-w-3xl mx-auto">
        <Link href={`/presupuestos/${presupuestoId}/editar`} passHref><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}><Share2 className="mr-2 h-4 w-4"/>WhatsApp</Button>
          <Button onClick={handlePrint} size="sm"><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
          {presupuesto.estado !== 'Facturado' ? 
            (<Button onClick={handleCreateInvoice} variant='default' size="sm"><FileTextIcon className="mr-2 h-4 w-4"/>Crear Factura</Button>) : 
            presupuesto.invoiceId ? 
            (<Link href={`/invoices/${presupuesto.invoiceId}`} passHref><Button variant="secondary" size="sm" className="bg-green-100 text-green-700 hover:bg-green-200"><FileSignature className="mr-2 h-4 w-4"/>Ver Factura</Button></Link>) : 
            (<Button variant="secondary" size="sm" disabled>Facturado</Button>)}
        </div>
      </div>
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2" id="invoice-to-print">
        <header className="mb-6 print:mb-4">
          <h1 className="text-xl font-bold text-center mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h1>
          <div className="flex flex-col md:flex-row justify-between items-start text-xs print:text-[8pt] gap-2">
            <div className="space-y-px text-center md:text-left">
              <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
              <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
              <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
            </div>
            {displaySettings.showCompanyLogo && logoUrl && (
                <div className="w-20 h-20 print:w-16 print:h-16 flex-shrink-0 self-center md:self-start">
                    <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
          </div>
        </header>

        {displaySettings.showClientData && (
          <section className="mb-4 print:mb-2 text-sm print:text-[9pt] border-y py-2 print:py-1">
            <p><span className="font-semibold">Cliente:</span> {presupuesto.clienteNombre}</p>
            {presupuesto.clienteContacto && <p><span className="font-semibold">Contacto:</span> {presupuesto.clienteContacto}</p>}
          </section>
        )}
        
           <section className="mb-4 print:mb-2">
            <table className="w-full text-xs print:text-[7pt] border-collapse">
              <thead className="print:bg-gray-100">
                <tr>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de Presupuesto</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Fecha</th>
                  <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">Nº {presupuesto.id.split('_')[1] || presupuesto.id}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(presupuesto.timestamp, true)}</td>
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
                </tr>
              </tbody>
             </table>
             <table className="w-full text-xs print:text-[7pt] border-collapse mt-2">
                <thead className="print:bg-gray-100">
                    <tr>
                         <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Tipo de Evento</th>
                         <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Protagonista(s)</th>
                         <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Fecha del Evento</th>
                         <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Lugar</th>
                         <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Nº Invitados</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.eventoTipo}</td>
                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{protagonistas || 'N/A'}</td>
                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(presupuesto.eventoFecha)}</td>
                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.salonFiestas}</td>
                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{presupuesto.invitadosCantidad}</td>
                    </tr>
                </tbody>
             </table>
          </section>

        {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
          <section className="mb-6 print:mb-3">
              <table className="w-full text-xs print:text-[7pt] border-collapse">
                  <thead className="print:bg-gray-100">
                  <tr>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50 w-2/5">Artículo</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50">Cantidad</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50">Precio</th>
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50">Importe total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                     <React.Fragment key={categoria}>
                        <tr className="bg-gray-50 print:bg-gray-100">
                          <td colSpan={4} className="border border-gray-300 print:border-gray-400 px-1.5 py-1 font-bold text-gray-600">{categoria}</td>
                        </tr>
                        {items.map((item) => (
                            <tr key={item.idServicioCatalogo}>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 align-top">
                                  {item.esRegalo ? <span className="text-red-600 font-semibold flex items-center gap-1"><Gift className="w-3 h-3"/> {item.nombreServicio} (REGALO)</span> : item.nombreServicio}
                                </td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">{getDisplayQuantity(item, presupuesto.invitadosCantidad)} {item.unidad && `(${item.unidad})`}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? <span className="line-through text-gray-500">{formatCurrency(item.precioUnitario, true)}</span> : formatCurrency(item.precioUnitarioPresupuesto, true)}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top font-semibold">{item.esRegalo ? formatCurrency(0, true) : formatCurrency(item.costoTotalItem, true)}</td>
                            </tr>
                        ))}
                     </React.Fragment>
                  ))}
                  </tbody>
              </table>
          </section>
        )}
        
        <section className="flex justify-end mb-6 print:mb-3 text-sm print:text-xs">
          <div className="w-full max-w-xs print:max-w-[220px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotalBruto, true, true)}</span>
              </div>
              {descuentoPromocional > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Descuento{presupuesto.nombrePromocion ? ` (${presupuesto.nombrePromocion})` : ''}:</span>
                    <span>-{formatCurrency(descuentoPromocional, true, true)}</span>
                  </div>
              )}
               {costoTotalRegalos > 0 && (
                 <div className="flex justify-between text-green-600">
                    <span>Ahorro en Regalos:</span>
                    <span>{formatCurrency(costoTotalRegalos, true, true)}</span>
                  </div>
               )}
               {descuentoPromocional > 0 && (
                 <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Subtotal con Descuento:</span>
                    <span>{formatCurrency(totalConDescuento, true)}</span>
                  </div>
               )}
               {ajustesAnuales.map((ajuste, index) => (
                 <div key={ajuste.anio} className="flex justify-between text-orange-600">
                    <span>Ajuste anual {ajuste.anio} ({displaySettings.annualAdjustmentPercentage}%):</span>
                    <span>+{formatCurrency(ajuste.monto, true, true)}</span>
                 </div>
               ))}
              <div className="flex justify-between font-bold pt-1 border-t-2 border-gray-600 print:border-gray-700">
                <span className="text-base">Importe total</span>
                <span className="text-base">{formatCurrency(totalFinal, true)}</span>
              </div>
            </div>
        </section>
        
        <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-2 print:pt-1.5 print:border-gray-400 text-xs print:text-[8pt] text-gray-600 print:text-black">
          <p className="text-red-600 font-bold text-sm">{BUDGET_DEPOSIT_NOTE_PDF}</p>
          {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-1 print:mt-0.5 whitespace-pre-line">{presupuesto.notas}</p>}
          {presupuesto.ajusteAnualActivo && displaySettings.annualAdjustmentPercentage && displaySettings.annualAdjustmentPercentage > 0 && (
            <p className="mt-1 print:mt-0.5 text-orange-600 font-medium">Nota: El importe total incluye un ajuste anual del {displaySettings.annualAdjustmentPercentage}% por cada año hasta la fecha del evento.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
