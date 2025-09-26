
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, CalendarDays, DollarSign, FileText, CreditCard, UploadCloud, Info, Eye, Briefcase, Phone, Mail, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, Payment } from '@/types/invoice';
import { getCustomerById } from '@/app/actions/customers';
import { getHistorialFiestas, getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

export default function CustomerDetailsPage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp);
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
      
      const todasLasFiestasDelCliente = [actual, ...historial].filter(
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
        
        let totalPagadoFiesta = 0;
        facturasFiesta.forEach(factura => {
          totalPagadoFiesta += factura.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        });

        const costoTotalFiesta = presupuestoFiesta?.totalConDescuento ?? presupuestoFiesta?.costoTotalEstimado ?? 0;
        const saldoFiesta = costoTotalFiesta - totalPagadoFiesta;

        paymentHistory.push({
          fiesta,
          presupuestoFiesta,
          facturasFiesta,
          totalPagadoFiesta,
          saldoFiesta
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserCircle className="w-12 h-12 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              {customer.companyName || customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">Centro de Control del Cliente</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/customers" passHref className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4 mr-2"/>Clientes</Button>
            </Link>
             <Link href={`/customers/${customerId}/edit`} passHref className="flex-1 sm:flex-none">
                <Button variant="default" className="w-full">Editar Cliente</Button>
             </Link>
             <Button onClick={handlePrint} variant="secondary" className="flex-1 sm:flex-none">
                <Printer className="w-4 h-4 mr-2"/>Imprimir Resumen
             </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información General y Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Empresa:</span> {customer.companyName || '-'}</div>
              <div className="flex items-center gap-2"><UserCircle className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Contacto:</span> {customer.name}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">Teléfono:</span> {customer.phone || '-'}</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground"/> <span className="font-medium">RUT/Cédula:</span> {customer.taxId || '-'}</div>
            </div>
            <Separator />
            <div>
                 <h4 className="text-sm font-semibold mb-2">Documentos Adjuntos</h4>
                 <div className="flex flex-wrap gap-2">
                    {customer.contractFileName ? (
                        <a href={`/api/contracts/${customer.contractFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Contrato de Servicio</Button>
                        </a>
                    ) : (
                        <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Contrato de Servicio no subido</Button>
                    )}
                     {customer.budgetFileName ? (
                        <a href={`/api/budgets/${customer.budgetFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Presupuesto Firmado</Button>
                        </a>
                    ) : (
                         <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Presupuesto no subido</Button>
                    )}
                    {customer.salonContractFileName ? (
                        <a href={`/api/salon-contracts/${customer.salonContractFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline"><Eye className="w-4 h-4 mr-2"/> Ver Contrato del Salón</Button>
                        </a>
                    ) : (
                         <Button variant="outline" disabled><FileText className="w-4 h-4 mr-2"/> Contrato Salón no subido</Button>
                    )}
                 </div>
            </div>
        </CardContent>
      </Card>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 text-primary">Historial de Eventos</h2>
        {eventPaymentHistory.length > 0 ? (
          <div className="space-y-6">
              {eventPaymentHistory.map(eventDetail => (
                <Card key={eventDetail.fiesta.id} className="shadow-md border-l-4 border-primary/70">
                  <CardHeader className="bg-muted/20 pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-lg">{eventDetail.fiesta.configuracion.nombreEvento}</CardTitle>
                            <CardDescription className="text-xs">
                              {eventDetail.fiesta.configuracion.tipoCelebracion} - {formatDate(eventDetail.fiesta.configuracion.fechaEvento)}
                            </CardDescription>
                        </div>
                         <Button asChild size="sm">
                            <Link href={`/fiestas/nueva?fiestaId=${eventDetail.fiesta.id}`}>Planificar Evento</Link>
                         </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2 border rounded-md bg-blue-50 dark:bg-blue-900/30"><span className="font-medium text-blue-700 dark:text-blue-300">Costo Evento:</span> {formatCurrency(eventDetail.presupuestoFiesta?.totalConDescuento ?? eventDetail.presupuestoFiesta?.costoTotalEstimado)}</div>
                      <div className="p-2 border rounded-md bg-green-50 dark:bg-green-900/30"><span className="font-medium text-green-700 dark:text-green-300">Total Pagado:</span> {formatCurrency(eventDetail.totalPagadoFiesta)}</div>
                      <div className={`p-2 border rounded-md ${eventDetail.saldoFiesta > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}><span className={`font-medium ${eventDetail.saldoFiesta > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>Saldo:</span> {formatCurrency(eventDetail.saldoFiesta)}</div>
                    </div>

                     <div className="flex flex-wrap gap-2">
                        {eventDetail.presupuestoFiesta && (
                          <Link href={`/presupuestos/${eventDetail.presupuestoFiesta.id}/ver`} passHref>
                            <Button variant="outline" size="sm" className="text-xs">
                              <FileText className="w-3 h-3 mr-1.5"/>Ver Presupuesto
                            </Button>
                          </Link>
                        )}
                        {eventDetail.facturasFiesta.map(factura => (
                             <Link href={`/invoices/${factura.id}`} passHref key={factura.id}>
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
