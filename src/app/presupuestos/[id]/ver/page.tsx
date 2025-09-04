
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, Coins, StickyNote, FileSignature, MessageSquare, Mail, Percent, Tag, Phone, Globe as GlobeIcon, Share2, Copy, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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

const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const COMPANY_LOGO_URL_PDF = "https://placehold.co/120x120/EF4444/FFFFFF.png?text=AK&font=montserrat"; 
const COMPANY_LOGO_AI_HINT_PDF = "company logo AK circle red";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";

export default function VerPresupuestoPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) { setError("ID de presupuesto no válido."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [fetchedPresupuesto, fetchedSettings] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings()
      ]);
      setDisplaySettings(fetchedSettings);
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
    window.print();
  };
  
  const generarTextoWhatsApp = () => {
    if (!presupuesto || !displaySettings) return '';
    const totalFinalConDescuento = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    let texto = `🎉 *¡Presupuesto para tu Evento!* 🎉\n\n`;
    texto += `Estimado/a *${presupuesto.clienteNombre}*,\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}* para tu *${presupuesto.eventoTipo}*.\n`;
    if (displaySettings.showClientData) {
      texto += `*Salón:* ${presupuesto.salonFiestas}\n`;
    }
    if (displaySettings.showEventTypeAndDate) {
      texto += `*Fecha del Evento:* ${formatDate(presupuesto.eventoFecha)}\n`;
      texto += `*Cantidad de Invitados:* ${presupuesto.invitadosCantidad}\n`;
    }
    texto += `\n`;
    if (displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0) {
      texto += `------------------------------------\n✨ *DETALLE DE SERVICIOS* ✨\n------------------------------------\n\n`;
      presupuesto.itemsPresupuestados.forEach(item => {
        if (!item.nombreServicio.toLowerCase().includes('elección')) {
          texto += `  • ${item.nombreServicio}\n`;
        }
      });
      texto += `\n`;
    }
    texto += `------------------------------------\n💰 *TOTAL FINAL: ${formatCurrency(totalFinalConDescuento, true, true)}*\n\n`;
    if(presupuesto.notas && presupuesto.notas.trim() !== '' && displaySettings.showPaymentMethodNotes){ texto += `📝 *Notas Adicionales:*\n${presupuesto.notas}\n\n`; }
    texto += `------------------------------------\n\n${BUDGET_DEPOSIT_NOTE_PDF}\n\n¡Esperamos tu consulta!\n*El equipo de ${COMPANY_NAME_BRAND}*`;
    return texto;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generarTextoWhatsApp())
      .then(() => toast({ title: "¡Texto Copiado!", description: "Resumen copiado para WhatsApp." }))
      .catch(() => toast({ title: "Error al Copiar", variant: "destructive" }));
  };

  const handleShare = async () => {
    const shareData = {
      title: `Presupuesto para ${presupuesto?.clienteNombre}`,
      text: `Aquí está el presupuesto para tu ${presupuesto?.eventoTipo}.`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Share API not supported');
      }
    } catch (err) {
      handleCopyToClipboard(); // Fallback to copy link
    }
  };

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
    
    // Move "Regalos" to the end if it exists
    const sortedKeys = Object.keys(agrupados).sort((a,b) => a.localeCompare(b));
    const sortedAgrupados: Record<string, ItemPresupuestado[]> = {};
    sortedKeys.forEach(key => sortedAgrupados[key] = agrupados[key]);

    if (itemsRegalo.length > 0) {
      sortedAgrupados['Regalos Incluidos'] = itemsRegalo;
    }
    
    const costoRegalos = itemsRegalo.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
    const costoRegular = itemsRegulares.reduce((sum, item) => sum + item.costoTotalItem, 0);
    
    const bruto = costoRegular + costoRegalos;
    const descPromo = bruto - (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado) - costoRegalos;
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: bruto,
      descuentoPromocional: Math.max(0, descPromo),
      totalFinal: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado
    };

  }, [presupuesto]);

  if (isLoading || !displaySettings) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  }
  if (error || !presupuesto) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link></div>;
  }
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);

  const eventYear = new Date(presupuesto.eventoFecha).getFullYear();
  const currentYear = new Date().getFullYear();
  const showAnnualAdjustmentLegend = 
    displaySettings?.annualAdjustmentPercentage && 
    displaySettings.annualAdjustmentPercentage > 0 && 
    eventYear > currentYear && 
    presupuesto?.estado !== 'Facturado';

  return (
    <div className="max-w-4xl mx-auto bg-white print:bg-white font-sans text-gray-800 print:text-black">
      <div className="p-4 md:p-8 print:p-2">
        <div className="mb-6 print:hidden flex flex-row justify-between items-start">
          <Link href="/presupuestos" passHref><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/>Compartir</Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
            {presupuesto.estado !== 'Facturado' ? 
              (<Button onClick={handleCreateInvoice} variant='default' size="sm"><FileTextIcon className="mr-2 h-4 w-4"/>Crear Factura</Button>) : 
              presupuesto.invoiceId ? 
              (<Link href={`/invoices/${presupuesto.invoiceId}`} passHref><Button variant="secondary" size="sm" className="bg-green-100 text-green-700 hover:bg-green-200"><FileSignature className="mr-2 h-4 w-4"/>Ver Factura</Button></Link>) : 
              (<Button variant="secondary" size="sm" disabled>Facturado</Button>)}
            <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref><Button variant="secondary" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
          </div>
        </div>
        
        <header className="mb-6 print:mb-4">
          <h1 className="text-xl font-bold text-center mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h1>
          <div className="flex justify-between items-start text-xs print:text-[8pt]">
            <div className="space-y-px">
              <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
              <p>{COMPANY_ADDRESS_LINE1_PDF}</p>
              <p>{COMPANY_ADDRESS_LINE2_PDF}</p>
              <p>{COMPANY_CONTACT_EMAIL_PDF}</p>
              <p>{COMPANY_WEBSITE_PDF}</p>
            </div>
            {displaySettings.showCompanyLogo && (
                <div className="w-20 h-20 print:w-16 print:h-16 flex-shrink-0">
                    <Image src={COMPANY_LOGO_URL_PDF} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint={COMPANY_LOGO_AI_HINT_PDF}/>
                </div>
            )}
          </div>
        </header>

        {displaySettings.showClientData && displaySettings.showEventTypeAndDate && (
            <section className="my-4 print:my-2 text-sm print:text-[9pt] text-center">
                <p>
                <span className="font-semibold">{presupuesto.clienteNombre}</span> {presupuesto.eventoTipo ? ` ${presupuesto.eventoTipo}` : ''}{presupuesto.eventoFecha ? ` - ${formatDate(presupuesto.eventoFecha, true)}` : ''}
                </p>
            </section>
        )}
        
        <section className="mb-6 print:mb-3">
          <table className="w-full text-xs print:text-[7pt] border-collapse">
            <thead className="print:bg-gray-100">
              <tr>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Número de cliente</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Número de Documento</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Página</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Fecha</th>
                <th className="border border-gray-300 print:border-gray-400 px-2 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{presupuesto.id.split('_')[1]?.substring(0,4) || 'N/A'}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{presupuesto.id.split('_').pop()?.substring(0,6)}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">1/1</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{formatDate(presupuesto.timestamp, true)}</td>
                <td className="border border-gray-300 print:border-gray-400 px-2 py-1">{formatDate(fechaValidoHasta.toISOString(), true)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {displaySettings.showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
          <section className="mb-6 print:mb-3">
            {Object.entries(itemsAgrupados).map(([categoria, items]) => (
                <div key={categoria} className="mb-3 print:mb-1.5 print:break-inside-avoid">
                    <h3 className={`font-bold text-sm mb-1 p-1 print:text-[8pt] ${categoria === 'Regalos Incluidos' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                        {categoria === 'Regalos Incluidos' ? <span className="flex items-center gap-1"><Gift className="w-4 h-4"/>{categoria}</span> : categoria}
                      </h3>
                    <table className="w-full text-xs print:text-[7pt] border-collapse">
                        <thead className="print:bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50 w-2/5">Artículo</th>
                            <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center font-medium bg-gray-50 w-[10%]">Cantidad</th>
                            <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Precio</th>
                            <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right font-medium bg-gray-50 w-[15%]">Importe total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((item) => (
                            <tr key={item.idServicioCatalogo}>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 align-top">{item.nombreServicio}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">{item.cantidad}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? <span className="line-through">{formatCurrency(item.precioUnitario, false)}</span> : formatCurrency(item.precioUnitario, false)}</td>
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-right align-top">{item.esRegalo ? formatCurrency(0, false) : formatCurrency(item.costoTotalItem, false)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ))}
          </section>
        )}
        
        <section className="flex justify-end mb-6 print:mb-3 text-sm print:text-xs">
          <div className="w-full max-w-xs print:max-w-[200px] space-y-0.5">
            <div className="flex justify-between"><span>Subtotal Bruto:</span><span>{formatCurrency(subtotalBruto)}</span></div>
            {costoTotalRegalos > 0 && <div className="flex justify-between text-red-600"><span>Ahorro por Regalos:</span><span>-{formatCurrency(costoTotalRegalos)}</span></div>}
            {descuentoPromocional > 0 && <div className="flex justify-between text-red-600"><span>Descuento Promocional:</span><span>-{formatCurrency(descuentoPromocional)}</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t border-gray-400 print:border-gray-500"><span className="text-base">TOTAL A PAGAR:</span><span className="text-base">{formatCurrency(totalFinal)}</span></div>
          </div>
        </section>
        
        <footer className="mt-8 pt-4 text-xs print:text-[8pt] text-gray-600 print:text-black">
          <p>{BUDGET_DEPOSIT_NOTE_PDF}</p>
          {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-2 whitespace-pre-line">{presupuesto.notas}</p>}
          {showAnnualAdjustmentLegend && (<p className="mt-1 print:mt-0.5 text-orange-600">Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.</p>)}
        </footer>
      </div>
    </div>
  );
}
