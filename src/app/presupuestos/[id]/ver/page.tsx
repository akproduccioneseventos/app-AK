'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, MapPin, Share2, Gift, ClipboardCopy, TrendingUp, Info, CalendarDays as CalendarIcon, PartyPopper, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCustomerById } from '@/app/actions/customers';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { Customer } from '@/types/customer';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) { return 'Inválida'; }
};

const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";

function VerPresupuestoContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const presupuestoId = params.id;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) return;
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings, socialConnections] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings(),
        getInvoiceTemplateSettings(),
        getSocialConnections()
      ]);
      setDisplaySettings(fetchedSettings);
      setLogoUrl(templateSettings.logoUrl || null);
      
      const whatsappConnection = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
      if (whatsappConnection?.phoneNumber) {
          setWhatsappNumber(whatsappConnection.phoneNumber);
      }

      if (fetchedPresupuesto) {
        setPresupuesto(fetchedPresupuesto);
        if (fetchedPresupuesto.clienteId) {
            const clienteData = await getCustomerById(fetchedPresupuesto.clienteId);
            setCliente(clienteData);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => { fetchPresupuestoAndSettings(); }, [fetchPresupuestoAndSettings]);

  const calculatedValues = useMemo(() => {
    if (!presupuesto) return { itemsAgrupados: {}, totalFinal: 0, subtotalBruto: 0, ahorroRegalos: 0, bonificacionPromo: 0, ajusteAnual: 0, aniosDiferencia: 0 };
  
    const adultos = presupuesto.invitadosAdultos || 0;
    const ninos = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);

    const itemsRecalculados = presupuesto.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, adultos, 0, ninos)
    }));

    const brutoVenta = itemsRecalculados.filter(i => !i.esRegalo).reduce((sum, i) => sum + i.costoTotalItem, 0);
    const regalosVal = itemsRecalculados.filter(i => i.esRegalo).reduce((sum, i) => {
        const itemNormal = { ...i, esRegalo: false, precioUnitarioPresupuesto: i.precioUnitario };
        return sum + recalcularCostoItem(itemNormal, adultos, 0, ninos);
    }, 0);

    let bonificacion = 0;
    if (presupuesto.descuentoTipo === 'porcentaje') bonificacion = (brutoVenta * (presupuesto.descuentoValor || 0)) / 100;
    else if (presupuesto.descuentoTipo === 'fijo') bonificacion = presupuesto.descuentoValor || 0;

    const totalSinAjuste = brutoVenta - bonificacion;
    
    let ajuste = 0;
    let anios = 0;
    if (presupuesto.eventoFecha) {
        const anioCreacion = new Date(presupuesto.timestamp).getFullYear();
        const anioEvento = new Date(presupuesto.eventoFecha).getFullYear();
        anios = Math.max(0, anioEvento - anioCreacion);
        if (anios > 0) ajuste = totalSinAjuste * (Math.pow(1.15, anios) - 1);
    }

    const agrupados = itemsRecalculados.reduce((acc, item) => {
      const cat = item.esRegalo ? 'Regalos Incluidos' : (item.categoriaServicio || 'Otros');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedCategories = Object.keys(agrupados).sort((a, b) => {
        if (a === 'Regalos Incluidos') return 1;
        if (b === 'Regalos Incluidos') return -1;
        return a.localeCompare(b);
    });

    const sortedAgrupados: Record<string, any[]> = {};
    sortedCategories.forEach(key => sortedAgrupados[key] = agrupados[key]);

    return {
      itemsAgrupados: sortedAgrupados,
      subtotalBruto: brutoVenta + regalosVal,
      ahorroRegalos: Math.round(regalosVal),
      bonificacionPromo: Math.round(bonificacion),
      ajusteAnual: Math.round(ajuste),
      totalFinal: Math.round(totalSinAjuste + ajuste),
      aniosDiferencia: anios
    };
  }, [presupuesto]);

  const handlePrint = () => window.print();

  const handleWhatsAppMeetingRequest = () => {
    if (!whatsappNumber || !presupuesto || !displaySettings) return;
    const template = displaySettings.whatsappMessageTemplate || "Hola, ya revisé el presupuesto y me gustaría coordinar una reunión.";
    let texto = `*Solicitud de Reunión - Presupuesto #${presupuesto.numero || 'Generado'}*\n`;
    texto += `-----------------\n`;
    texto += `${template}\n\n`;
    texto += `*Presupuesto Estimado:* ${formatCurrency(calculatedValues.totalFinal)}\n`;
    texto += `*Link:* ${window.location.href}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!presupuesto || !displaySettings) return null;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
        <div className="flex justify-between items-center mb-6 print:hidden max-w-3xl mx-auto px-4">
          <Link href="/presupuestos/nuevo" passHref><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm"><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
            <Link href={`/presupuestos/${presupuestoId}/edit`} passHref><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 px-4 print:px-0">
            
            {/* SECCIÓN VENTA PRO */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-8">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <PartyPopper className="w-12 h-12 text-primary animate-bounce"/>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-black font-headline tracking-tighter text-slate-900 uppercase">
                                ¡Tu presupuesto está listo!
                            </h2>
                            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                                {displaySettings.successMessage}
                            </p>
                        </div>
                        
                        <div className="w-full flex flex-col items-center gap-6">
                            <Button 
                                onClick={handleWhatsAppMeetingRequest}
                                size="lg" 
                                className="w-full max-w-md h-20 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-2xl shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <CalendarIcon className="w-6 h-6 mr-3"/> AGENDAR REUNIÓN CON UN ASESOR
                            </Button>

                            {(displaySettings.valuePropositions?.length || 0) > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                                    {displaySettings.valuePropositions?.map((prop, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">{prop}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Enlace Copiado"}); }} className="h-10 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Share2 className="w-3.5 h-3.5 mr-2"/> Compartir Presupuesto
                                </Button>
                                <Button variant="ghost" onClick={() => window.print()} className="h-10 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Printer className="w-3.5 h-3.5 mr-2"/> Guardar PDF
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="bg-white shadow-xl print:shadow-none p-10 md:p-16 print:p-2 rounded-[2.5rem] print:rounded-none">
                <header className="mb-8 print:mb-4 flex justify-between items-start">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-primary uppercase tracking-tighter">{COMPANY_MAIN_TITLE}</h1>
                        <div className="text-xs text-muted-foreground">
                            <p className="font-bold text-slate-800">{COMPANY_CONTACT_PERSON}</p>
                            <p>{COMPANY_ADDRESS_LINE1_PDF} | {COMPANY_CONTACT_EMAIL_PDF}</p>
                        </div>
                    </div>
                    {logoUrl && <div className="w-24 h-24 relative"><Image src={logoUrl} alt="Logo" layout="fill" className="object-contain" /></div>}
                </header>

                <section className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] print:bg-white print:border-none print:p-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</p><p className="font-bold">{presupuesto.clienteNombre}</p></div>
                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</p><p className="font-bold">{formatDate(presupuesto.eventoFecha)}</p></div>
                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Invitados</p><p className="font-bold">{presupuesto.invitadosCantidad}</p></div>
                    </div>
                </section>

                <section className="mb-8">
                    <div className="border rounded-[1.5rem] overflow-hidden shadow-sm print:border-slate-300 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-3/5 font-black text-[10px] uppercase pl-8 py-4 min-w-[200px]">Artículo</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase">Cant.</TableHead>
                                    <TableHead className="text-right pr-8 font-black text-[10px] uppercase min-w-[120px]">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(calculatedValues.itemsAgrupados).map(([categoria, items]) => (
                                    <React.Fragment key={categoria}>
                                        <TableRow className="bg-muted/30 border-y"><TableCell colSpan={3} className="font-black text-[10px] uppercase text-primary pl-8 tracking-widest py-2">{categoria}</TableCell></TableRow>
                                        {items.map(item => (
                                            <TableRow key={item.idServicioCatalogo} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-8 py-3 text-xs">
                                                    {item.esRegalo ? <span className="text-rose-600 font-bold flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/> {item.nombreServicio} (REGALO)</span> : item.nombreServicio}
                                                    <p className="text-[9px] text-muted-foreground">{formatCurrency(item.precioUnitarioPresupuesto)} c/u</p>
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-bold text-slate-400">{item.cantidad}</TableCell>
                                                <TableCell className="text-right pr-8">
                                                    {item.esRegalo ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] line-through text-slate-300 font-bold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
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
                    
                <section className="flex justify-end mb-8">
                    <div className="w-full max-w-sm space-y-2 py-8 px-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 print:bg-white print:border-slate-300">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <span>Valor Real Servicios:</span>
                            <span>{formatCurrency(calculatedValues.subtotalBruto)}</span>
                        </div>
                        {calculatedValues.ahorroRegalos > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-green-600 tracking-widest">
                                <span>Ahorro Regalos:</span>
                                <span>-{formatCurrency(calculatedValues.ahorroRegalos)}</span>
                            </div>
                        )}
                        {calculatedValues.bonificacionPromo > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-500 tracking-widest">
                                <span>Bonificación Promo:</span>
                                <span>-{formatCurrency(calculatedValues.bonificacionPromo)}</span>
                            </div>
                        )}
                        {calculatedValues.ajusteAnual > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-600 tracking-widest">
                                <span>Ajuste Anual ({calculatedValues.aniosDiferencia} añ. 15%):</span>
                                <span>+{formatCurrency(calculatedValues.ajusteAnual)}</span>
                            </div>
                        )}
                        <Separator className="bg-slate-200" />
                        <div className="flex justify-between items-center text-2xl font-black text-primary pt-1">
                            <span>TOTAL FINAL:</span>
                            <span>{formatCurrency(calculatedValues.totalFinal)}</span>
                        </div>
                    </div>
                </section>
                    
                <footer className="space-y-6">
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[1.5rem] print:bg-white print:border-slate-300">
                        <h4 className="text-xs font-black uppercase text-blue-800 tracking-widest mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Condiciones de Reserva</h4>
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">{displaySettings.bookingTerms}</p>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-20 text-center">
                        <div className="border-t border-slate-200 pt-4"><p className="font-black text-[10px] uppercase tracking-widest">Tec. Alexander Knuth</p><p className="text-[9px] text-slate-400 uppercase font-bold">AK Producciones</p></div>
                        <div className="border-t border-slate-200 pt-4"><p className="font-black text-[10px] uppercase tracking-widest">{cliente?.name || presupuesto.clienteNombre}</p><p className="text-[9px] text-slate-400 uppercase font-bold">Firma del Cliente</p></div>
                    </div>
                </footer>
            </div>
        </div>
    </div>
  );
}

export default function VerPresupuestoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <VerPresupuestoContent params={params} />
    </Suspense>
  )
}
