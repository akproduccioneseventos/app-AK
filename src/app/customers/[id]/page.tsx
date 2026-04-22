
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, FileText, Info, Eye, Briefcase, Phone, Printer, Star, MessageCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import { getCustomerById } from '@/app/actions/customers';
import { getHistorialFiestas, getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge as InvoiceStatusBadge } from '@/components/status-badge';

const formatCurrency = (amount?: number, currency: string = 'UYU') => {
  if (amount === undefined || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency }).format(amount);
};

const formatDate = (dateString?: string, includeTime: boolean = false) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('es-ES', options);
  } catch (e) { return "Fecha inválida"; }
};

interface EventPaymentDetails {
  fiesta: FiestaEnPlanificacion;
  presupuestoFiesta: Presupuesto | null;
  facturasFiesta: Invoice[];
  totalPagadoFiesta: number;
  saldoFiesta: number;
  pagosConfirmados: number;
  fuentePagos: 'presupuesto' | 'facturas' | 'mixto' | 'sin_pagos';
}

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [eventPaymentHistory, setEventPaymentHistory] = useState<EventPaymentDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadCustomerData = useCallback(async () => {
    if (!customerId) {
      setError("ID de cliente no proporcionado.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCustomer = await getCustomerById(customerId);
      if (!fetchedCustomer) {
        setNotFound(true);
        setError(`Cliente con ID ${customerId} no encontrado.`);
        toast({ title: "Error", description: "Cliente no encontrado.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      setCustomer(fetchedCustomer);

      const [historial, actual] = await Promise.all([
        getHistorialFiestas(),
        getFiestaActual()
      ]);
      
      const todasLasFiestasDelCliente = [actual, ...(Array.isArray(historial) ? historial : [])].filter(
        (f): f is FiestaEnPlanificacion => f !== null && f.configuracion.clienteId === customerId
      );
      
      const paymentHistory: EventPaymentDetails[] = [];
      for (const fiesta of todasLasFiestasDelCliente) {
        let presupuestoFiesta: Presupuesto | null = null;
        if (fiesta.presupuestoId) {
          presupuestoFiesta = await getPresupuestoById(fiesta.presupuestoId);
        }

        let facturasFiesta: Invoice[] = [];
        if (fiesta.invoiceIds && fiesta.invoiceIds.length > 0) {
          const invoicePromises = fiesta.invoiceIds.map(id => getInvoiceById(id));
          facturasFiesta = (await Promise.all(invoicePromises)).filter(inv => inv !== null) as Invoice[];
        }
        
        let totalPagadoFacturas = 0;
        facturasFiesta.forEach(factura => {
          totalPagadoFacturas += factura.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        });
        const pagosConfirmados = (presupuestoFiesta?.pagosCliente || []).filter((p) => p.estadoPago !== 'pendiente_confirmacion').length;
        const totalPagadoDesdePresupuesto = (presupuestoFiesta?.pagosCliente || [])
          .filter((p) => p.estadoPago !== 'pendiente_confirmacion')
          .reduce((sum, p) => sum + p.monto, 0);
        const hasBudgetPayments = totalPagadoDesdePresupuesto > 0;
        const hasInvoicePayments = totalPagadoFacturas > 0;
        const totalPagadoFiesta = hasBudgetPayments && hasInvoicePayments
          ? Math.max(totalPagadoDesdePresupuesto, totalPagadoFacturas)
          : hasBudgetPayments
            ? totalPagadoDesdePresupuesto
            : totalPagadoFacturas;
        const fuentePagos: EventPaymentDetails['fuentePagos'] = hasBudgetPayments && hasInvoicePayments
          ? 'mixto'
          : hasBudgetPayments
            ? 'presupuesto'
            : hasInvoicePayments
              ? 'facturas'
              : 'sin_pagos';

        const costoTotalFiesta = presupuestoFiesta?.totalConDescuento ?? presupuestoFiesta?.costoTotalEstimado ?? 0;
        const saldoFiesta = costoTotalFiesta - totalPagadoFiesta;

        paymentHistory.push({
          fiesta,
          presupuestoFiesta,
          facturasFiesta,
          totalPagadoFiesta,
          saldoFiesta,
          pagosConfirmados,
          fuentePagos,
        });
      }
      setEventPaymentHistory(paymentHistory.sort((a,b) => 
        (b.fiesta.configuracion.fechaEvento ? new Date(b.fiesta.configuracion.fechaEvento).getTime() : 0) - 
        (a.fiesta.configuracion.fechaEvento ? new Date(a.fiesta.configuracion.fechaEvento).getTime() : 0)
      ));

    } catch (err: any) {
      console.error("Error loading customer details:", err);
      setError("No se pudo cargar la información del cliente y sus eventos.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);
  
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (notFound) {
    return <div className="text-center text-destructive p-6"><AlertTriangle className="mx-auto w-12 h-12 mb-3"/>Cliente no encontrado. <Link href="/customers" className="underline">Volver a la lista</Link>.</div>;
  }
  
  if (error || !customer) {
    return <div className="text-center text-destructive p-6"><AlertTriangle className="mx-auto w-12 h-12 mb-3"/>{error || "No se pudo cargar la información del cliente."}</div>;
  }

  // ── Derived state for status badge and next step ──────────────────────────
  const latestEvent = eventPaymentHistory[0] ?? null;
  const hasEvents = eventPaymentHistory.length > 0;
  const hasPendingBalance = eventPaymentHistory.some(e => e.saldoFiesta > 0);

  let statusBadge: React.ReactNode;
  if (!hasEvents) {
    statusBadge = <Badge className="bg-slate-200 text-slate-600 text-xs font-semibold">📋 Sin eventos</Badge>;
  } else if (hasPendingBalance) {
    statusBadge = <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">💳 Saldo pendiente</Badge>;
  } else {
    statusBadge = <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs font-semibold">✅ Al día</Badge>;
  }

  let nextStepLabel: string;
  let nextStepHref: string | null = null;

  if (!hasEvents || !latestEvent?.presupuestoFiesta) {
    nextStepLabel = 'Crear presupuesto';
    nextStepHref = '/presupuestos/nuevo/crear';
  } else if (latestEvent.presupuestoFiesta.estado !== 'Aceptado' && latestEvent.presupuestoFiesta.estado !== 'Facturado') {
    nextStepLabel = 'Confirmar presupuesto';
    nextStepHref = `/presupuestos/${latestEvent.presupuestoFiesta.id}/ver`;
  } else if (hasPendingBalance) {
    nextStepLabel = 'Registrar pago pendiente';
    nextStepHref = '/pagos-rapidos';
  } else {
    nextStepLabel = 'Todo en orden ✅';
    nextStepHref = null;
  }

  const whatsappPhone = customer.phone ? customer.phone.replace(/\D/g, '') : null;
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola ${customer.name || ''}, te contactamos de AK Producciones.`)}`
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserCircle className="w-12 h-12 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              {customer.companyName || customer.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Centro de Control del Cliente</p>
              {statusBadge}
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Link href="/customers" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4 mr-2"/>Clientes</Button>
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/5">
                  <MessageCircle className="w-4 h-4 mr-2"/>WhatsApp
                </Button>
              </a>
            )}
             <Link href={`/customers/${customerId}/edit`} className="flex-1 sm:flex-none">
                <Button variant="default" className="w-full">Editar Cliente</Button>
             </Link>
             <Button onClick={handlePrint} variant="secondary" className="flex-1 sm:flex-none">
                <Printer className="w-4 h-4 mr-2"/>Imprimir
             </Button>
        </div>
      </div>

      {/* ── PRÓXIMO PASO ────────────────────────────────────── */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-md">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Próximo paso</p>
                <p className="font-bold text-indigo-900">{nextStepLabel}</p>
              </div>
            </div>
            {nextStepHref && (
              <Link href={nextStepHref}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs">
                  Ir ahora <ArrowRight className="w-3.5 h-3.5 ml-1.5"/>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información General y Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Empresa:</span> {customer.companyName || '-'}</div>
              <div className="flex items-center gap-2"><UserCircle className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Contacto:</span> {customer.name}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Teléfono:</span> {customer.phone ? (
                  <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${customer.name || ''}!`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline font-medium">
                    {customer.phone} <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                ) : '-'}</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">RUT/Cédula:</span> {customer.taxId || '-'}</div>
            </div>
            <Separator />
            <div>
                 <h4 className="text-sm font-semibold mb-2">Documentos y Acciones</h4>
                 <div className="flex flex-wrap gap-2">
                    {customer.contractFileName ? (
                        <a href={customer.contractFileName.startsWith('https://') ? customer.contractFileName : `/api/contracts/${customer.contractFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Contrato</Button>
                        </a>
                    ) : (
                        <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Contrato no subido</Button>
                    )}
                     {customer.budgetFileName ? (
                        <a href={customer.budgetFileName.startsWith('https://') ? customer.budgetFileName : `/api/budgets/${customer.budgetFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Presupuesto Firmado</Button>
                        </a>
                    ) : (
                         <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Presupuesto no subido</Button>
                    )}
                    {customer.salonContractFileName ? (
                        <a href={customer.salonContractFileName.startsWith('https://') ? customer.salonContractFileName : `/api/salon-contracts/${customer.salonContractFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Contrato Salón</Button>
                        </a>
                    ) : (
                         <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Contrato Salón no subido</Button>
                    )}
                    <Link href="/settings/feedback">
                        <Button variant="secondary"><Star className="w-4 h-4 mr-2"/>Ver Feedback</Button>
                    </Link>
                 </div>
            </div>
        </CardContent>
      </Card>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 text-primary">Historial de Eventos</h2>
        {eventPaymentHistory.length > 0 ? (
          <div className="space-y-6">
              {eventPaymentHistory.map((eventDetail, index) => (
                <Card key={eventDetail.fiesta.id} className={`shadow-md border-l-4 ${index === 0 ? 'border-indigo-500' : 'border-primary/70'}`}>
                  <CardHeader className={`pb-3 ${index === 0 ? 'bg-indigo-50/60' : 'bg-muted/20'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="font-headline text-lg">{eventDetail.fiesta.configuracion.nombreEvento}</CardTitle>
                              {index === 0 && <Badge className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest">Más reciente</Badge>}
                            </div>
                            <CardDescription className="text-xs">
                              {eventDetail.fiesta.configuracion.tipoCelebracion} — {formatDate(eventDetail.fiesta.configuracion.fechaEvento)}
                            </CardDescription>
                            {/* Payment status summary for the most recent event */}
                            {index === 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {eventDetail.saldoFiesta > 0 ? (
                                  <Badge className="bg-red-100 text-red-700 border border-red-200 text-[9px]">💳 Saldo: {formatCurrency(eventDetail.saldoFiesta)}</Badge>
                                ) : eventDetail.totalPagadoFiesta > 0 ? (
                                  <Badge className="bg-green-100 text-green-700 border border-green-200 text-[9px]">✅ Pagado</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-600 text-[9px]">Sin pagos registrados</Badge>
                                )}
                              </div>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {eventDetail.presupuestoFiesta && (
                            <Link href={`/presupuestos/${eventDetail.presupuestoFiesta.id}/ver`}>
                              <Button variant="outline" size="sm" className="text-xs"><FileText className="w-3 h-3 mr-1.5"/>Ver Presupuesto</Button>
                            </Link>
                          )}
                          {eventDetail.presupuestoFiesta && (
                            <Link href={`/presupuestos/${eventDetail.presupuestoFiesta.id}/estado-de-cuenta`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                <FileText className="w-3 h-3 mr-1.5"/>Estado de Cuenta
                              </Button>
                            </Link>
                          )}
                          <Button asChild size="sm" variant={index === 0 ? 'default' : 'outline'}>
                             <Link href={`/fiestas/nueva?fiestaId=${eventDetail.fiesta.id}`}>
                               {index === 0 ? 'Planificar Evento' : 'Ver Evento'}
                             </Link>
                          </Button>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2 border rounded-md bg-blue-50 dark:bg-blue-900/30"><span className="font-medium text-blue-700 dark:text-blue-300">Costo Evento:</span> {formatCurrency(eventDetail.presupuestoFiesta?.totalConDescuento ?? eventDetail.presupuestoFiesta?.costoTotalEstimado)}</div>
                      <div className="p-2 border rounded-md bg-green-50 dark:bg-green-900/30"><span className="font-medium text-green-700 dark:text-green-300">Total Pagado:</span> {formatCurrency(eventDetail.totalPagadoFiesta)}</div>
                      <div className={`p-2 border rounded-md ${eventDetail.saldoFiesta > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}><span className={`font-medium ${eventDetail.saldoFiesta > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>Saldo:</span> {formatCurrency(eventDetail.saldoFiesta)}</div>
                    </div>
                    {eventDetail.pagosConfirmados > 0 && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Recibos registrados: {eventDetail.pagosConfirmados} (disponibles en Estado de Cuenta).
                      </p>
                    )}
                    {eventDetail.fuentePagos === 'mixto' && (
                      <p className="text-[11px] text-slate-500">
                        Se detectaron pagos tanto en presupuesto como en facturas; se muestra el mayor total registrado.
                      </p>
                    )}

                     <div className="flex flex-wrap gap-2">
                        {eventDetail.facturasFiesta.map(factura => (
                             <Link href={`/invoices/${factura.id}`} key={factura.id}>
                                <Button variant="secondary" size="sm" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1.5"/> Factura #{factura.invoiceNumber} <InvoiceStatusBadge status={factura.status} className="ml-1.5"/>
                                </Button>
                             </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        ) : (
          <Card className="p-6 text-center bg-muted/30">
            <Info className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3"/>
            <p className="text-muted-foreground">Este cliente no tiene eventos registrados en el sistema.</p>
             <Button asChild className="mt-4">
                <Link href="/fiestas/nueva/configuracion">Crear Nuevo Evento</Link>
             </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
