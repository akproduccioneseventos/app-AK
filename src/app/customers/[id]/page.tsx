
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, CalendarDays, DollarSign, FileText, CreditCard, UploadCloud, Info, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, Payment } from '@/types/invoice';
import { getCustomerById } from '@/app/actions/customers';
import { getHistorialFiestas, getFiestaActual } from '@/app/actions/fiesta-actual';
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

export default function CustomerDetailsPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp);
  const customerId = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [eventPaymentHistory, setEventPaymentHistory] = useState<EventPaymentDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      const todasLasFiestasDelCliente: FiestaEnPlanificacion[] = [];
      if (actual && actual.configuracion.clienteId === customerId) {
        todasLasFiestasDelCliente.push(actual);
      }
      historial.forEach(fiestaHist => {
        if (fiestaHist.configuracion.clienteId === customerId) {
          todasLasFiestasDelCliente.push(fiestaHist);
        }
      });
      
      // Ordenar por fecha de evento, más próxima primero
      todasLasFiestasDelCliente.sort((a, b) => {
        const dateA = a.configuracion.fechaEvento ? new Date(a.configuracion.fechaEvento).getTime() : 0;
        const dateB = b.configuracion.fechaEvento ? new Date(b.configuracion.fechaEvento).getTime() : 0;
        return dateA - dateB; // Ascendente para que las más próximas queden al principio si invertimos luego, o descendente si no
      });
      // Para mostrar más próximas primero, podríamos hacer reverse o cambiar el sort a b - a

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

        const costoTotalFiesta = presupuestoFiesta?.costoTotalEstimado || 0;
        const saldoFiesta = costoTotalFiesta - totalPagadoFiesta;

        paymentHistory.push({
          fiesta,
          presupuestoFiesta,
          facturasFiesta,
          totalPagadoFiesta,
          saldoFiesta
        });
      }
      // Ordenar por fecha de evento descendente (más reciente primero)
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

  const [notFound, setNotFound] = useState(false); // To handle not found customer

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCircle className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              {customer.companyName || customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">Detalles y Historial de Pagos del Cliente</p>
          </div>
        </div>
        <Link href="/customers" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Clientes</Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium text-muted-foreground">Nombre:</span> {customer.name}</div>
          {customer.companyName && <div><span className="font-medium text-muted-foreground">Empresa:</span> {customer.companyName}</div>}
          <div><span className="font-medium text-muted-foreground">Teléfono:</span> {customer.phone || '-'}</div>
          <div><span className="font-medium text-muted-foreground">RUT/Cédula:</span> {customer.taxId || '-'}</div>
        </CardContent>
      </Card>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 text-primary">Eventos Contratados y Pagos</h2>
        {eventPaymentHistory.length > 0 ? (
          <ScrollArea className="h-auto max-h-[calc(100vh-400px)] pr-3">
            <div className="space-y-6">
              {eventPaymentHistory.map(eventDetail => (
                <Card key={eventDetail.fiesta.id} className="shadow-md border-l-4 border-primary/70">
                  <CardHeader className="bg-muted/20 pb-3">
                    <CardTitle className="font-headline text-lg">{eventDetail.fiesta.configuracion.nombreEvento}</CardTitle>
                    <CardDescription className="text-xs">
                      {eventDetail.fiesta.configuracion.tipoCelebracion} - {formatDate(eventDetail.fiesta.configuracion.fechaEvento)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2 border rounded-md bg-blue-50"><span className="font-medium text-blue-700">Costo Evento:</span> {formatCurrency(eventDetail.presupuestoFiesta?.costoTotalEstimado)}</div>
                      <div className="p-2 border rounded-md bg-green-50"><span className="font-medium text-green-700">Total Pagado:</span> {formatCurrency(eventDetail.totalPagadoFiesta)}</div>
                      <div className={`p-2 border rounded-md ${eventDetail.saldoFiesta > 0 ? 'bg-red-50' : 'bg-green-50'}`}><span className={`font-medium ${eventDetail.saldoFiesta > 0 ? 'text-red-700' : 'text-green-700'}`}>Saldo:</span> {formatCurrency(eventDetail.saldoFiesta)}</div>
                    </div>

                    {eventDetail.presupuestoFiesta && (
                      <Link href={`/presupuestos/${eventDetail.presupuestoFiesta.id}/ver`} passHref>
                        <Button variant="outline" size="sm" className="text-xs">
                          <FileText className="w-3 h-3 mr-1.5"/>Ver Presupuesto del Evento
                        </Button>
                      </Link>
                    )}

                    {eventDetail.facturasFiesta.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-1.5">Pagos Registrados:</h4>
                        <ul className="space-y-1 text-xs list-disc list-inside pl-2">
                          {eventDetail.facturasFiesta.flatMap(factura => 
                            factura.payments?.map(pago => (
                              <li key={pago.id} className="flex justify-between items-center">
                                <span>{formatDate(pago.paymentDate)} - {pago.method} - {formatCurrency(pago.amount, factura.currency)} ({pago.notes || 'Pago'})</span>
                                <Link href={`/invoices/${factura.id}`} passHref>
                                   <InvoiceStatusBadge status={factura.status} />
                                </Link>
                              </li>
                            )) || []
                          )}
                        </ul>
                      </div>
                    )}
                    {eventDetail.facturasFiesta.length === 0 && <p className="text-xs text-muted-foreground italic">No hay pagos registrados para este evento aún.</p>}
                    
                    <div className="pt-3 text-right">
                       <Button variant="secondary" size="sm" className="text-xs" disabled>
                         <UploadCloud className="w-3 h-3 mr-1.5"/> Subir Comprobante (Próximamente)
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card className="p-6 text-center bg-muted/30">
            <Info className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3"/>
            <p className="text-muted-foreground">Este cliente no tiene eventos o pagos registrados en el sistema.</p>
          </Card>
        )}
      </section>
      <CardFooter className="mt-6 border-t pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            La funcionalidad de descarga de resumen de pagos por cliente en PDF estará disponible en futuras actualizaciones.
          </p>
      </CardFooter>
    </div>
  );
}
