
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
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

const formatCurrency = (amount?: number, includeSymbol = true, useNUS = false) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  // Use toLocaleString which handles rounding and formatting according to locale rules.
  // Using maximumFractionDigits: 0 will effectively round to the nearest integer.
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string }, adultos: number, adolescentes: number, ninos: number): number {
  const categoria = (item.categoriaServicio || '').toLowerCase();
  
  if (categoria.includes('infantil') || categoria.includes('adolescente')) {
    return ninos + adolescentes;
  }
  
  if (categoria.includes('plato principal')) {
    return adultos;
  }

  return adultos + adolescentes + ninos;
};

function calcularCostoItem(item: ItemPresupuestado, adultos: number, adolescentes: number, ninos: number): number {
  if (item.esRegalo) return 0;
  
  const totalInvitados = adultos + adolescentes + ninos;
  const cantidadInvitados = getGuestCountForItem(item, adultos, adolescentes, ninos);
  
  if (cantidadInvitados === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }

  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo': 
      itemTotal = (item.precioBase ?? precioUnitario) * (item.cantidad > 0 ? item.cantidad : 1);
      break;
    case 'porPersona': 
      itemTotal = (item.precioPorPersona ?? precioUnitario) * cantidadInvitados; 
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (item.precioBase ?? precioUnitario);
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to simple calculation
      itemTotal = item.cantidad * precioUnitario;
  }
  return itemTotal;
}

function VerPresupuestoContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) { setError("ID de presupuesto no válido."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings(),
        getInvoiceTemplateSettings()
      ]);
      setDisplaySettings(fetchedSettings);
      setLogoUrl(templateSettings.logoUrl);
      if (fetchedPresupuesto) {
        // Recalculate costs on load
        const adultos = fetchedPresupuesto.invitadosAdultos || 0;
        const adolescentes = fetchedPresupuesto.invitadosAdolescentes || 0;
        const ninos = fetchedPresupuesto.invitadosNinos || 0;

        const itemsRecalculados = fetchedPresupuesto.itemsPresupuestados.map(item => ({
            ...item,
            costoTotalItem: calcularCostoItem(item, adultos, adolescentes, ninos)
        }));

        const subtotal = itemsRecalculados.filter(item => !item.esRegalo).reduce((sum, item) => sum + item.costoTotalItem, 0);

        let totalConDescuento = subtotal;
        if (fetchedPresupuesto.descuentoTipo && fetchedPresupuesto.descuentoValor) {
            const descuento = fetchedPresupuesto.descuentoTipo === 'porcentaje' 
                ? (subtotal * fetchedPresupuesto.descuentoValor) / 100 
                : fetchedPresupuesto.descuentoValor;
            totalConDescuento = subtotal - descuento;
        }
        
        const presupuestoActualizado = {
            ...fetchedPresupuesto,
            itemsPresupuestados: itemsRecalculados,
            costoTotalEstimado: subtotal,
            totalConDescuento: totalConDescuento !== subtotal ? totalConDescuento : undefined,
        };

        setPresupuesto(presupuestoActualizado);

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
    if (!presupuesto) return '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const pageUrl = `${baseUrl}/presupuestos/${presupuesto.id}`;
    let texto = `🎉 *¡Hola ${presupuesto.clienteNombre}!* 🎉\n\n`;
    texto += `Gracias por considerar a *${COMPANY_NAME_BRAND}*.`;
    texto += ` Hemos preparado un presupuesto para tu *${presupuesto.eventoTipo}*.\n\n`;
    texto += `Puedes ver todos los detalles en el siguiente enlace:\n`;
    texto += pageUrl;
    texto += `\n\n¡Esperamos tu consulta!\n*El equipo de ${COMPANY_NAME_BRAND}*`;
    return texto;
  };
  
  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`, '_blank');
  };
  
  const getDisplayQuantity = (item: ItemPresupuestado): string => {
    if (!presupuesto) return 'N/A';
    const adultos = presupuesto.invitadosAdultos || 0;
    const adolescentes = presupuesto.invitadosAdolescentes || 0;
    const ninos = presupuesto.invitadosNinos || 0;
    const cantidadInvitados = getGuestCountForItem(item, adultos, adolescentes, ninos);
    
    switch (item.calculationMethod) {
        case 'porPersona':
            return `${cantidadInvitados}`;
        case 'ratio':
            if (item.invitadosPorUnidad && item.invitadosPorUnidad > 0) {
              return `${Math.ceil(cantidadInvitados / item.invitadosPorUnidad)}`;
            }
            return `${item.cantidad}`; // Fallback
        case 'fijo':
        case 'tramos':
        default:
            return `${item.cantidad}`;
    }
  };


  const { itemsAgrupados, costoTotalRegalos, subtotalBruto, descuentoPromocional, totalFinal, showAnnualAdjustmentLegend } = useMemo(() => {
    if (!presupuesto || !displaySettings) {
      return { itemsAgrupados: {}, costoTotalRegalos: 0, subtotalBruto: 0, descuentoPromocional: 0, totalFinal: 0, showAnnualAdjustmentLegend: false };
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
    
    let descAplicado = 0;
    if (presupuesto.descuentoTipo && presupuesto.descuentoValor) {
        if (presupuesto.descuentoTipo === 'porcentaje') {
            descAplicado = (bruto * presupuesto.descuentoValor) / 100;
        } else {
            descAplicado = presupuesto.descuentoValor;
        }
    }

    const totalConDescuento = bruto - descAplicado;
    
    let ajustesAnuales: { anio: number; monto: number; totalAcumulado: number }[] = [];
    let montoAjustable = totalConDescuento;
    let totalFinalAjustado = totalConDescuento;
    
    const anioCreacion = new Date(presupuesto.timestamp).getFullYear();
    const anioEvento = presupuesto.eventoFecha ? new Date(presupuesto.eventoFecha).getFullYear() : anioCreacion;
    
    let shouldShowAdjustmentLegend = false;
    if (displaySettings.annualAdjustmentPercentage && displaySettings.annualAdjustmentPercentage > 0 && anioEvento > anioCreacion) {
        shouldShowAdjustmentLegend = true; // Preview is needed
        if (presupuesto.ajusteAnualActivo) { // Only calculate if active
            for (let anio = anioCreacion + 1; anio <= anioEvento; anio++) {
                const ajuste = montoAjustable * (displaySettings.annualAdjustmentPercentage / 100);
                montoAjustable += ajuste;
                totalFinalAjustado = montoAjustable;
                ajustesAnuales.push({ anio, monto: ajuste, totalAcumulado: montoAjustable });
            }
        }
    }
    
    return {
      itemsAgrupados: sortedAgrupados,
      costoTotalRegalos: costoRegalos,
      subtotalBruto: bruto,
      descuentoPromocional: descAplicado,
      totalFinal: totalFinalAjustado,
      showAnnualAdjustmentLegend: shouldShowAdjustmentLegend
    };

  }, [presupuesto, displaySettings]);
  

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  }
  if (error || !presupuesto) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos/nuevo" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link></div>;
  }
  
  const fechaValidoHasta = new Date(presupuesto.timestamp);
  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);
    
  const protagonistas = [presupuesto.protagonista1Nombre, presupuesto.protagonista2Nombre].filter(Boolean).join(' y ');
  const displayId = presupuesto.numero ? `#${presupuesto.numero}` : `#${presupuesto.id.split('_').pop()?.substring(0,6)}`;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans text-gray-800 print:text-black">
      <div className="flex justify-between items-center mb-6 print:hidden max-w-3xl mx-auto">
        <Link href="/presupuestos/nuevo" passHref><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al Creador</Button></Link>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}><Share2 className="mr-2 h-4 w-4"/>WhatsApp</Button>
          <Button onClick={handlePrint} size="sm"><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
          {presupuesto.estado !== 'Facturado' ? 
            (<Link href={`/invoices/new?fromPresupuesto=${presupuesto.id}`} passHref><Button variant='default' size="sm"><FileTextIcon className="mr-2 h-4 w-4"/>Crear Factura</Button></Link>) : 
            presupuesto.invoiceId ? 
            (<Link href={`/invoices/${presupuesto.invoiceId}`} passHref><Button variant="secondary" size="sm" className="bg-green-100 text-green-700 hover:bg-green-200"><FileSignature className="mr-2 h-4 w-4"/>Ver Factura</Button></Link>) : 
            (<Button variant="secondary" size="sm" disabled>Facturado</Button>)}
           <Link href={`/presupuestos/${presupuestoId}/editar`} passHref><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2" id="invoice-to-print">
        <header className="mb-6 print:mb-4">
          <div className="flex justify-between items-start">
             <h1 className="text-xl font-bold text-left mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h1>
             {displaySettings.showCompanyLogo && logoUrl && (
                <div className="w-24 h-20 print:w-20 print:h-16 flex-shrink-0">
                    <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={100} height={80} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
          </div>
          <div className="text-xs print:text-[8pt] gap-2 text-left">
            <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
            <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
            <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
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
                  <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{displayId}</td>
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
                      <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50 w-3/5">Artículo</th>
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
                                <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-center align-top">{getDisplayQuantity(item)} {item.unidad && `(${item.unidad})`}</td>
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
              <div className="flex justify-between font-bold pt-1 border-t-2 border-gray-600 print:border-gray-700">
                <span className="text-base">Importe total</span>
                <span className="text-base">{formatCurrency(totalFinal, true)}</span>
              </div>
            </div>
          </section>
          
           <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-2 print:pt-1.5 print:border-gray-400 text-xs print:text-[8pt] text-gray-600 print:text-black">
            <p>{BUDGET_DEPOSIT_NOTE_PDF}</p>
            {presupuesto.notas && displaySettings.showPaymentMethodNotes && <p className="mt-1 print:mt-0.5 whitespace-pre-line">{presupuesto.notas}</p>}
            {showAnnualAdjustmentLegend && (<p className="mt-1 print:mt-0.5 text-orange-600 font-medium">Nota: Este presupuesto podría estar sujeto a un ajuste anual del {displaySettings.annualAdjustmentPercentage}% si el evento se realiza en un año posterior al actual.</p>)}
          </footer>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <VerPresupuestoContent params={params} />
    </Suspense>
  )
}
