'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, MapPin, Share2, Gift, ClipboardCopy, TrendingUp, Info, CalendarDays as CalendarIcon, PartyPopper, CheckCircle2, MessageSquare, PlusCircle, Trash2, CreditCard, Receipt, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado, PagoCliente, MetodoPago } from '@/types/presupuesto';
import { ALL_METODOS_PAGO } from '@/types/presupuesto';
import { getPresupuestoById, addPagoToPresupuesto, deletePagoFromPresupuesto } from '@/app/actions/presupuestos';
import { getCustomerById } from '@/app/actions/customers';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { Customer } from '@/types/customer';
import type { BudgetDisplaySettings, CompanyInfo } from '@/types/settings';
import { getBudgetDisplaySettings, getInvoiceTemplateSettings, getCompanyInfo } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment management state
  const [isAddingPago, setIsAddingPago] = useState(false);
  const [isSavingPago, setIsSavingPago] = useState(false);
  const [isDeletingPagoId, setIsDeletingPagoId] = useState<string | null>(null);
  const [newPagoFecha, setNewPagoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newPagoMonto, setNewPagoMonto] = useState('');
  const [newPagoMetodo, setNewPagoMetodo] = useState<MetodoPago>('Efectivo');
  const [newPagoReferencia, setNewPagoReferencia] = useState('');

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) return;
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings, socialConnections, fetchedCompanyInfo] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings(),
        getInvoiceTemplateSettings(),
        getSocialConnections(),
        getCompanyInfo()
      ]);
      setDisplaySettings(fetchedSettings);
      setCompanyInfo(fetchedCompanyInfo);
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

  const handleWhatsAppDirectContact = () => {
    if (!whatsappNumber || !presupuesto) return;
    const text = `¡Hola! Estoy revisando el presupuesto #${presupuesto.numero || ''} y tengo una consulta.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const pagosSummary = useMemo(() => {
    if (!presupuesto) return { totalPagado: 0, saldoPendiente: 0, totalCosto: 0 };
    const totalCosto = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    const totalPagado = (presupuesto.pagosCliente || []).reduce((sum, p) => sum + p.monto, 0);
    return { totalCosto, totalPagado, saldoPendiente: totalCosto - totalPagado };
  }, [presupuesto]);

  const handleAddPago = async () => {
    const monto = parseFloat(newPagoMonto);
    if (!presupuesto || isNaN(monto) || monto <= 0) {
      toast({ title: 'Error', description: 'Ingresá un monto válido mayor a 0.', variant: 'destructive' });
      return;
    }
    setIsSavingPago(true);
    try {
      const result = await addPagoToPresupuesto(presupuesto.id, {
        fecha: `${newPagoFecha}T12:00:00.000Z`,
        monto,
        metodoPago: newPagoMetodo,
        referencia: newPagoReferencia.trim() || undefined,
      });
      if (!result.success) throw new Error(result.error);
      setPresupuesto(result.presupuesto!);
      setNewPagoMonto('');
      setNewPagoReferencia('');
      setNewPagoFecha(new Date().toISOString().split('T')[0]);
      setIsAddingPago(false);
      toast({ title: 'Pago registrado', description: `${formatCurrency(monto)} guardado correctamente.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!presupuesto) return;
    setIsDeletingPagoId(pagoId);
    try {
      const result = await deletePagoFromPresupuesto(presupuesto.id, pagoId);
      if (!result.success) throw new Error(result.error);
      setPresupuesto(result.presupuesto!);
      toast({ title: 'Pago eliminado' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingPagoId(null);
    }
  };

  const getEffectiveQty = (item: any): number => {
    if (!presupuesto) return item.cantidad || 1;
    const adults = presupuesto.invitadosAdultos || 0;
    const kids = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);
    const targetGuests = getGuestCountForItem(item, adults, 0, kids);
    
    if (item.calculationMethod === 'ratio' && item.invitadosPorUnidad) {
        return Math.ceil(targetGuests / item.invitadosPorUnidad);
    }
    if (item.calculationMethod === 'porPersona') {
        return targetGuests;
    }
    if (item.calculationMethod === 'tramos') {
        return 1;
    }
    return item.cantidad || 1;
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!presupuesto || !displaySettings) return null;

  const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 0;

  return (
    <div className="bg-gray-100 min-h-screen py-6 print:bg-white print:py-0 font-sans">
        <div className="flex justify-between items-center mb-6 print:hidden max-w-3xl mx-auto px-4">
          <Link href="/presupuestos/nuevo"><Button variant="outline" size="sm" className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button></Link>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}><Button variant="outline" size="sm" className="rounded-xl"><Receipt className="mr-2 h-4 w-4"/>Estado de Cuenta</Button></Link>
            <Button onClick={handlePrint} size="sm" className="rounded-xl"><Printer className="mr-2 h-4 w-4"/>Imprimir/PDF</Button>
            <Link href={`/presupuestos/${presupuestoId}/edit`}><Button variant="outline" size="sm" className="rounded-xl"><Edit className="mr-2 h-4 w-4"/>Editar</Button></Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 px-2 sm:px-4 print:px-0">
            
            {/* SECCIÓN VENTA PRO */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
                <Card className="border-none shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-12 flex flex-col items-center text-center space-y-8">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-bounce"/>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-4xl font-black font-headline tracking-tighter text-slate-900 uppercase">
                                ¡Tu presupuesto está listo!
                            </h2>
                            <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                                {displaySettings.successMessage}
                            </p>
                        </div>
                        
                        <div className="w-full flex flex-col items-center gap-4 sm:gap-6">
                            <div className="w-full flex flex-col gap-3 items-center">
                                <Button 
                                    onClick={handleWhatsAppMeetingRequest}
                                    size="lg" 
                                    className="w-full max-w-md h-16 sm:h-20 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-2xl shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-95 px-4"
                                >
                                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 shrink-0"/> 
                                    <span className="text-[10px] xs:text-sm sm:text-lg uppercase leading-tight">AGENDAR REUNIÓN CON UN ASESOR</span>
                                </Button>

                                <Button 
                                    variant="outline"
                                    onClick={handleWhatsAppDirectContact}
                                    className="w-full max-w-sm h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs uppercase tracking-widest shadow-sm"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2"/> Consultar por WhatsApp
                                </Button>
                            </div>

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

            <div className="bg-white shadow-xl print:shadow-none p-6 sm:p-16 print:p-2 rounded-[2rem] sm:rounded-[2.5rem] print:rounded-none">
                <header className="mb-8 print:mb-4 flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tighter truncate">{COMPANY_MAIN_TITLE}</h1>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                            <p className="font-bold text-slate-800">{COMPANY_CONTACT_PERSON}</p>
                            <p>{COMPANY_ADDRESS_LINE1_PDF} | {COMPANY_CONTACT_EMAIL_PDF}</p>
                        </div>
                    </div>
                    {logoUrl ? (
                        <div className="w-16 h-16 sm:w-24 sm:h-24 relative shrink-0">
                            <Image src={logoUrl} alt="Logo" layout="fill" className="object-contain" />
                        </div>
                    ) : (
                        <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 border-2 border-primary/20 rounded-2xl text-center">
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-primary leading-tight px-1">AK Producciones</span>
                        </div>
                    )}
                </header>

                <section className="mb-8 p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] print:bg-white print:border-none print:p-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-[11px] sm:text-sm">
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</p><p className="font-bold truncate">{presupuesto.clienteNombre}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</p><p className="font-bold">{formatDate(presupuesto.eventoFecha)}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Invitados</p><p className="font-bold">{totalInvitados}</p></div>
                    </div>
                </section>

                <section className="mb-8">
                    <div className="border rounded-[1.5rem] overflow-hidden shadow-sm print:border-slate-300 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-1/2 font-black text-[9px] sm:text-[10px] uppercase pl-4 sm:pl-8 py-4 min-w-[200px]">Artículo</TableHead>
                                    <TableHead className="text-center font-black text-[9px] sm:text-[10px] uppercase min-w-[60px]">Cant.</TableHead>
                                    <TableHead className="text-right pr-4 sm:pr-8 font-black text-[9px] sm:text-[10px] uppercase min-w-[100px]">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(calculatedValues.itemsAgrupados).map(([categoria, items]) => (
                                    <React.Fragment key={categoria}>
                                        <TableRow className="bg-muted/30 border-y"><TableCell colSpan={3} className="font-black text-[9px] sm:text-[10px] uppercase text-primary pl-4 sm:pl-8 tracking-widest py-2">{categoria}</TableCell></TableRow>
                                        {items.map(item => {
                                            const effectiveQty = getEffectiveQty(item);
                                            return (
                                                <TableRow key={item.idServicioCatalogo} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                                    <TableCell className="pl-4 sm:pl-8 py-3 text-[11px] sm:text-xs">
                                                        {item.esRegalo ? <span className="text-rose-600 font-bold flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/> {item.nombreServicio} (REGALO)</span> : item.nombreServicio}
                                                        <p className="text-[9px] text-muted-foreground">
                                                            {item.calculationMethod === 'tramos' ? 'Precio por tramo' : `${formatCurrency(item.precioUnitarioPresupuesto)} c/u`}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-center text-[11px] sm:text-xs font-bold text-slate-400">{effectiveQty}</TableCell>
                                                    <TableCell className="text-right pr-4 sm:pr-8">
                                                        {item.esRegalo ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] line-through text-slate-300 font-bold">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
                                                                <Badge className="bg-green-600 text-white border-none font-black text-[8px] h-4">REGALO</Badge>
                                                            </div>
                                                        ) : <span className="text-[11px] sm:text-xs font-black text-slate-700">{formatCurrency(item.costoTotalItem)}</span>}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
                    
                <section className="flex justify-end mb-8">
                    <div className="w-full max-w-sm space-y-2 py-6 sm:py-8 px-6 sm:px-10 bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 print:bg-white print:border-slate-300">
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <span>Valor Real Servicios:</span>
                            <span>{formatCurrency(calculatedValues.subtotalBruto)}</span>
                        </div>
                        {calculatedValues.ahorroRegalos > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black text-green-600 tracking-widest">
                                <span>Ahorro Regalos:</span>
                                <span>-{formatCurrency(calculatedValues.ahorroRegalos)}</span>
                            </div>
                        )}
                        {calculatedValues.bonificacionPromo > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-rose-500 tracking-widest">
                                <span>Bonificación Promo:</span>
                                <span>-{formatCurrency(calculatedValues.bonificacionPromo)}</span>
                            </div>
                        )}
                        {calculatedValues.ajusteAnual > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-amber-600 tracking-widest">
                                <span>Ajuste Anual ({calculatedValues.aniosDiferencia} añ. 15%):</span>
                                <span>+{formatCurrency(calculatedValues.ajusteAnual)}</span>
                            </div>
                        )}
                        <Separator className="bg-slate-200" />
                        <div className="flex justify-between items-center text-xl sm:text-2xl font-black text-primary pt-1">
                            <span className="tracking-tighter">TOTAL FINAL:</span>
                            <span>{formatCurrency(calculatedValues.totalFinal)}</span>
                        </div>
                    </div>
                </section>
                    
                <footer className="space-y-6">
                    <div className="p-4 sm:p-6 bg-blue-50/50 border border-blue-100 rounded-[1.5rem] print:bg-white print:border-slate-300">
                        <h4 className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Condiciones de Reserva</h4>
                        <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed font-medium">{displaySettings.bookingTerms}</p>
                    </div>
                    {presupuesto.notas && (
                        <div className="p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] print:bg-white print:border-slate-300">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Notas y Observaciones</h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{presupuesto.notas}</p>
                        </div>
                    )}
                    <div className="mt-16 grid grid-cols-2 gap-8 sm:gap-20 text-center">
                        <div className="border-t-2 border-slate-300 pt-4 relative mt-16">
                            {companyInfo?.signatureUrl ? (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-14 pointer-events-none">
                                    <Image src={companyInfo.signatureUrl} alt="Firma Empresa" layout="fill" objectFit="contain" />
                                </div>
                            ) : (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-36 pointer-events-none">
                                    <div className="border-b border-dashed border-slate-300 h-6 w-full"></div>
                                </div>
                            )}
                            <p className="font-black text-sm uppercase tracking-tighter text-slate-900">Tec. Alexander Knuth</p>
                            <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest">Por la Empresa</p>
                        </div>
                        <div className="border-t-2 border-slate-300 pt-4 relative mt-16">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-36 pointer-events-none">
                                <div className="border-b border-dashed border-slate-300 h-6 w-full"></div>
                            </div>
                            <p className="font-black text-sm uppercase tracking-tighter text-slate-900 truncate">{cliente?.name || presupuesto.clienteNombre}</p>
                            <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">Firma del Cliente</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* ── HISTORIAL DE PAGOS (admin only, hidden on print) ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="print:hidden">
                <Card className="border-none shadow-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="pb-2 px-6 sm:px-10 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary"/>
                                <CardTitle className="font-headline text-xl">Historial de Pagos</CardTitle>
                            </div>
                            <Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}>
                                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                                    <Receipt className="w-3.5 h-3.5 mr-2"/> Ver Estado de Cuenta
                                </Button>
                            </Link>
                        </div>
                        {/* Balance summary pills */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <span>Total: {formatCurrency(pagosSummary.totalCosto)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                <CheckCircle2 className="w-3 h-3"/> Pagado: {formatCurrency(pagosSummary.totalPagado)}
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${pagosSummary.saldoPendiente <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                <Clock className="w-3 h-3"/> Pendiente: {formatCurrency(Math.max(0, pagosSummary.saldoPendiente))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 sm:px-10 pb-8 space-y-4">
                        {/* Payment history table */}
                        {(presupuesto.pagosCliente || []).length === 0 && !isAddingPago ? (
                            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-xl">
                                Sin pagos registrados aún.
                            </div>
                        ) : (presupuesto.pagosCliente || []).length > 0 && (
                            <div className="border rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pl-4">Fecha</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Método</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Referencia</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 text-right pr-4">Monto</TableHead>
                                            <TableHead className="w-10"/>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(presupuesto.pagosCliente || []).map((pago) => (
                                            <TableRow key={pago.id} className="text-sm">
                                                <TableCell className="pl-4 py-3 font-medium text-slate-700">
                                                    {new Date(pago.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase">{pago.metodoPago}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-muted-foreground text-xs max-w-[150px] truncate">{pago.referencia || '—'}</TableCell>
                                                <TableCell className="pr-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(pago.monto)}</TableCell>
                                                <TableCell className="py-3 text-right pr-2">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeletePago(pago.id)}
                                                        disabled={isDeletingPagoId === pago.id}
                                                    >
                                                        {isDeletingPagoId === pago.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Add payment form */}
                        {isAddingPago ? (
                            <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5">
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Nuevo Pago</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monto *</Label>
                                        <Input
                                            type="number" min="1" placeholder="0"
                                            value={newPagoMonto}
                                            onChange={e => setNewPagoMonto(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fecha *</Label>
                                        <Input
                                            type="date"
                                            value={newPagoFecha}
                                            onChange={e => setNewPagoFecha(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Método *</Label>
                                        <Select value={newPagoMetodo} onValueChange={(v) => setNewPagoMetodo(v as MetodoPago)}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_METODOS_PAGO.map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Referencia</Label>
                                        <Input
                                            placeholder="Ej: Nº transf. 12345"
                                            value={newPagoReferencia}
                                            onChange={e => setNewPagoReferencia(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setIsAddingPago(false)} disabled={isSavingPago}>
                                        Cancelar
                                    </Button>
                                    <Button size="sm" className="rounded-xl" onClick={handleAddPago} disabled={isSavingPago}>
                                        {isSavingPago ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                                        Guardar Pago
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full rounded-xl font-bold uppercase tracking-widest text-xs" onClick={() => setIsAddingPago(true)}>
                                <PlusCircle className="w-4 h-4 mr-2"/> Registrar Nuevo Pago
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <style jsx global>{`
            @media print {
                header, footer, button, .sidebar, .no-print, .notifications-hub, .sidebar-inset > header, aside { display: none !important; }
                body { background: white !important; padding: 0 !important; margin: 0 !important; }
                .bg-slate-50, .bg-muted\/30, .bg-primary\/5, .bg-blue-50\/50 { background-color: white !important; border: 1px solid #e2e8f0 !important; }
                .shadow-xl, .shadow-2xl, .shadow-3xl { box-shadow: none !important; }
                .rounded-\[2rem\], .rounded-\[2\.5rem\] { border-radius: 0 !important; }
                @page { size: A4 portrait; margin: 1.5cm 1cm; }
            }
        `}</style>
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
