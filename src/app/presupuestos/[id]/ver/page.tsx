
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, Coins, StickyNote, FileSignature, MessageSquare, Mail, Percent, Tag, Phone, Globe as GlobeIcon, Share2, Gift, ClipboardCopy, TrendingUp, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { getCustomerById } from '@/app/actions/customers';
import type { Customer } from '@/types/customer';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';

const formatCurrency = (amount?: number, includeSymbol = true) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha no definida";
    
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

function VerPresupuestoContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
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
        setPresupuesto(fetchedPresupuesto);
        if (fetchedPresupuesto.clienteId) {
            const clienteData = await getCustomerById(fetchedPresupuesto.clienteId);
            setCliente(clienteData);
        }
      } else {
        setError(`Presupuesto con ID ${presupuestoId} no encontrado.`);
        toast({ title: "Error", description: `Presupuesto no encontrado.`, variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el presupuesto.");
      toast({ title: "Error al Cargar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => {
    fetchPresupuestoAndSettings();
  }, [fetchPresupuestoAndSettings]);

  const calculatedValues = useMemo(() => {
    if (!presupuesto || !displaySettings) {
      return { itemsAgrupados: {}, subtotalBruto: 0, ahorroRegalos: 0, bonificacionPromo: 0, totalSinAjuste: 0, ajusteAnual: 0, totalFinal: 0, aniosDiferencia: 0 };
    }
  
    const adultos = presupuesto.invitadosAdultos || 0;
    const adolescentes = presupuesto.invitadosAdolescentes || 0;
    const ninos = presupuesto.invitadosNinos || 0;

    const itemsRecalculados = presupuesto.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos)
    }));

    // Subtotal de servicios que SI se cobran
    const subtotalVenta = itemsRecalculados
        .filter(item => !item.esRegalo)
        .reduce((sum, item) => sum + item.costoTotalItem, 0);
    
    // Valor real de los regalos
    const ahorroRegalos = itemsRecalculados
      .filter(item => item.esRegalo)
      .reduce((sum, item) => {
        const itemSinRegalo = { ...item, esRegalo: false };
        // Si el precio del presupuesto es 0, usamos el precio original del catálogo para el ahorro
        const originalPriceItem = { ...itemSinRegalo, precioUnitarioPresupuesto: item.precioUnitario };
        return sum + recalcularCostoItem(originalPriceItem, adultos, adolescentes, ninos);
      }, 0);

    // Bonificación aplicada (del presupuesto manual)
    let bonificacionPromo = 0;
    if (presupuesto.descuentoTipo === 'porcentaje') {
        bonificacionPromo = (subtotalVenta * (presupuesto.descuentoValor || 0)) / 100;
    } else if (presupuesto.descuentoTipo === 'fijo') {
        bonificacionPromo = presupuesto.descuentoValor || 0;
    }

    const totalSinAjuste = subtotalVenta - bonificacionPromo;
    
    // Agrupamiento por categorías - Sincronizado con el simulador
    const agrupados: Record<string, ItemPresupuestado[]> = itemsRecalculados.reduce((acc, item) => {
      const categoria = item.esRegalo ? 'Regalos Incluidos' : (item.categoriaServicio || 'Otros Servicios');
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, ItemPresupuestado[]>);
    
    // Ordenar categorías: Alfabético pero "Regalos Incluidos" siempre al final
    const sortedCategories = Object.keys(agrupados).sort((a, b) => {
        if (a === 'Regalos Incluidos') return 1;
        if (b === 'Regalos Incluidos') return -1;
        return a.localeCompare(b);
    });

    const sortedAgrupados: Record<string, ItemPresupuestado[]> = {};
    sortedCategories.forEach(key => sortedAgrupados[key] = agrupados[key]);
    
    // Ajuste Anual del 15% (CFO Virtual)
    let ajusteAnual = 0;
    let totalFinal = totalSinAjuste;
    let aniosDiferencia = 0;

    if (presupuesto.eventoFecha) {
        const anioCreacion = new Date(presupuesto.timestamp).getFullYear();
        const anioEvento = new Date(presupuesto.eventoFecha).getFullYear();
        aniosDiferencia = Math.max(0, anioEvento - anioCreacion);
        
        if (aniosDiferencia > 0) {
            const factorAjuste = Math.pow(1.15, aniosDiferencia);
            totalFinal = totalSinAjuste * factorAjuste;
            ajusteAnual = totalFinal - totalSinAjuste;
        }
    }

    return {
      itemsAgrupados: sortedAgrupados,
      subtotalBruto: subtotalVenta + ahorroRegalos,
      ahorroRegalos: Math.round(ahorroRegalos),
      bonificacionPromo: Math.round(bonificacionPromo),
      totalSinAjuste: Math.round(totalSinAjuste),
      ajusteAnual: Math.round(ajusteAnual),
      totalFinal: Math.round(totalFinal),
      aniosDiferencia
    };
  }, [presupuesto, displaySettings]);
  
  const generarTextoWhatsApp = useCallback(() => {
    if (!presupuesto) return '';
    
    const { subtotalBruto, bonificacionPromo, ahorroRegalos, totalFinal, totalSinAjuste } = calculatedValues;
    const pageUrl = `${window.location.origin}/presupuestos/${presupuesto.id}/ver`;
    
    let texto = `*Resumen de Presupuesto - ${COMPANY_NAME_BRAND}*\n`;
    texto += `-----------------\n`;
    texto += `*Cliente:* ${presupuesto.clienteNombre}\n`;
    texto += `*Evento:* ${presupuesto.eventoTipo}\n`;
    if(presupuesto.eventoFecha) texto += `*Fecha:* ${formatDate(presupuesto.eventoFecha)}\n`;
    texto += `-----------------\n`;
    
    texto += `*TOTAL A PAGAR:* *${formatCurrency(totalFinal)}*\n`;
    texto += `-----------------\n`;
    texto += `Puedes ver el presupuesto detallado en el siguiente enlace:\n${pageUrl}`;
    
    return texto;
  }, [presupuesto, calculatedValues]);
  
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
  
  const getDisplayQuantity = (item: ItemPresupuestado): string => {
    if (!presupuesto) return 'N/A';
    const adultos = presupuesto.invitadosAdultos || 0;
    const ninos = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);
    const qtyTarget = getGuestCountForItem(item, adultos, 0, ninos);

    switch (item.calculationMethod) {
        case 'porPersona': return `${qtyTarget}`;
        case 'ratio': return item.invitadosPorUnidad ? `${Math.ceil(qtyTarget / item.invitadosPorUnidad)}` : `${item.cantidad}`;
        default: return `${item.cantidad}`;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-4 text-xl">Generando documento...</p></div>;
  if (error || !presupuesto || !displaySettings) {
    return <div className="max-w-2xl mx-auto text-center py-10"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error || "Presupuesto no encontrado."}</p><Link href="/presupuestos/nuevo" passHref><Button variant="outline" className="mt-6"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link></div>;
  }
  
  const displayId = presupuesto.numero ? `#${presupuesto.numero}` : `#${presupuesto.id.split('_').pop()?.substring(0,6)}`;
  const protagonistas = [presupuesto.protagonista1Nombre, presupuesto.protagonista2Nombre].filter(Boolean).join(' y ');

  return (
    <>
      <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans text-gray-800 print:text-black">
        <div className="flex justify-between items-center mb-6 print:hidden max-w-3xl mx-auto">
          <Link href="/presupuestos/nuevo" passHref><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp}><Share2 className="w-4 h-4 mr-2"/>WhatsApp</Button>
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard}><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar Texto</Button>
            <Button onClick={handlePrint} size="sm"><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
            <Link href={`/presupuestos/${presupuestoId}/editar`} passHref><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
          </div>
        </div>

        <div className="bg-white shadow-xl print:shadow-none p-10 md:p-16 print:p-2 max-w-3xl mx-auto" id="invoice-to-print">
              <header className="mb-8 print:mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-left mb-2 print:text-lg leading-tight text-primary uppercase tracking-tighter">{COMPANY_MAIN_TITLE}</h1>
                    <div className="text-xs print:text-[8pt] text-muted-foreground">
                        <p className="font-bold text-slate-800">{COMPANY_CONTACT_PERSON}</p>
                        <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
                        <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
                    </div>
                  </div>
                  {displaySettings.showCompanyLogo && logoUrl && (
                      <div className="w-32 h-24 print:w-24 print:h-20 flex-shrink-0">
                          <Image src={logoUrl} alt="Logo" width={128} height={96} className="object-contain" />
                      </div>
                  )}
                </div>
              </header>

              <section className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] print:bg-white print:border-none print:p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm print:text-[8pt]">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</p>
                        <p className="font-bold text-slate-800">{presupuesto.clienteNombre}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presupuesto</p>
                        <p className="font-bold text-slate-800">{displayId}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Evento</p>
                        <p className="font-bold text-slate-800">{formatDate(presupuesto.eventoFecha)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salón</p>
                        <p className="font-bold text-slate-800">{presupuesto.salonFiestas}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invitados</p>
                        <p className="font-bold text-slate-800">{presupuesto.invitadosCantidad} Personas</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Válido hasta</p>
                        <p className="font-bold text-rose-600">{formatDate(new Date(new Date(presupuesto.timestamp).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), true)}</p>
                    </div>
                </div>
              </section>

              {displaySettings.showPriceBreakdown && (
                <section className="mb-8 print:mb-4">
                    <div className="border rounded-[1.5rem] overflow-hidden shadow-sm print:border-slate-300">
                        <Table>
                            <TableHeader className="bg-slate-50 print:bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-3/5 font-black text-[10px] uppercase pl-6">Artículo / Servicio</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase">Cant.</TableHead>
                                    <TableHead className="text-right pr-6 font-black text-[10px] uppercase">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(calculatedValues.itemsAgrupados).map(([categoria, items]) => (
                                    <React.Fragment key={categoria}>
                                        <TableRow className="bg-muted/30 border-y print:bg-gray-50"><TableCell colSpan={3} className="font-black text-[10px] uppercase text-primary pl-6 tracking-widest">{categoria}</TableCell></TableRow>
                                        {items.map(item => (
                                            <TableRow key={item.idServicioCatalogo} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 py-3 font-medium text-xs">
                                                    {item.esRegalo ? <span className="text-rose-600 font-bold flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/> {item.nombreServicio}</span> : item.nombreServicio}
                                                    {!item.esRegalo && <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(item.precioUnitarioPresupuesto)} c/u</p>}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-bold text-slate-400">{getDisplayQuantity(item)}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {item.esRegalo ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] line-through text-slate-300 font-bold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                                                            <Badge className="bg-green-600 text-white border-none font-black text-[8px] h-4">REGALO</Badge>
                                                        </div>
                                                    ) : <span className="text-xs font-black text-slate-700">{formatCurrency(item.costoTotalItem)}</span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
              )}
                
               <section className="flex justify-end mb-8 print:mb-4">
                  <div className="w-full max-w-xs space-y-2 py-6 px-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 print:bg-white print:border-slate-300 print:p-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <span>Subtotal Servicios:</span>
                          <span className="font-bold text-slate-600">{formatCurrency(calculatedValues.subtotalBruto - calculatedValues.ahorroRegalos)}</span>
                      </div>
                      {calculatedValues.ahorroRegalos > 0 && (
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-green-600 tracking-widest">
                            <span>Ahorro Regalos:</span>
                            <span>-{formatCurrency(calculatedValues.ahorroRegalos)}</span>
                          </div>
                      )}
                      {calculatedValues.bonificacionPromo > 0 && (
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-500 tracking-widest">
                            <span>{presupuesto.nombrePromocion || 'Bonificación'}:</span>
                            <span>-{formatCurrency(calculatedValues.bonificacionPromo)}</span>
                          </div>
                      )}
                      {calculatedValues.ajusteAnual > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-600 tracking-widest">
                            <span>Ajuste Anual ({calculatedValues.aniosDiferencia} añ.):</span>
                            <span>+{formatCurrency(calculatedValues.ajusteAnual)}</span>
                        </div>
                      )}
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between items-center text-2xl font-black text-primary pt-1">
                          <span>TOTAL:</span>
                          <span>{formatCurrency(calculatedValues.totalFinal)}</span>
                      </div>
                  </div>
                </section>
                
               <footer className="space-y-6">
                  <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[1.5rem] print:bg-white print:border-slate-300">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-widest mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Condiciones de Reserva</h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">{BUDGET_DEPOSIT_NOTE_PDF}</p>
                    {presupuesto.notes && <p className="mt-3 text-xs text-slate-500 whitespace-pre-line border-t border-blue-100 pt-3 italic">{presupuesto.notes}</p>}
                  </div>

                  <div className="mt-16 grid grid-cols-2 gap-20 text-center print:mt-10">
                    <div className="border-t border-slate-200 pt-4">
                        <p className="font-black text-[10px] uppercase text-slate-900 tracking-widest">Tec. Alexander Knuth</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Por la Empresa</p>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                        <p className="font-black text-[10px] uppercase text-slate-900 tracking-widest">{cliente?.name || presupuesto.clienteNombre}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Firma del Cliente</p>
                    </div>
                  </div>
                </footer>
            </div>
        </div>
        <style jsx global>{`
            @media print {
              body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
              .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header { display: none !important ; }
              @page { size: A4; margin: 1.5cm; }
              main { padding: 0 !important; margin: 0 !important; }
            }
        `}</style>
    </>
  );
}

export default function VerPresupuestoPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = use(paramsProp);
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <VerPresupuestoContent params={params} />
    </Suspense>
  )
}
