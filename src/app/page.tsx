
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { CalendarDays, DollarSign, CreditCard, Landmark, PiggyBank, AlertTriangle, Loader2, BarChart3, Info } from 'lucide-react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Invoice } from '@/types/invoice';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceById } from '@/app/actions/invoices';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formatCurrency = (amount?: number | string, currency: string = 'ARS') => {
  if (amount === undefined || amount === null || amount === '') return "N/A";
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "N/A";
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(numericAmount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

interface FinancialSummary {
  presupuestoEstimado: number | string;
  totalFacturado: number;
  totalPagado: number;
  saldoPendiente: number;
}

export default function DashboardPage() {
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [eventDateForCalendar, setEventDateForCalendar] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      if (fiesta?.configuracion?.fechaEvento) {
        try {
            setEventDateForCalendar(new Date(fiesta.configuracion.fechaEvento));
        } catch (e) {
            console.warn("Fecha de evento inválida para el calendario:", fiesta.configuracion.fechaEvento);
            setEventDateForCalendar(undefined);
        }
      } else {
        setEventDateForCalendar(undefined);
      }

      let linkedInvoices: Invoice[] = [];
      if (fiesta?.invoiceIds && fiesta.invoiceIds.length > 0) {
        const invoiceDetailsPromises = fiesta.invoiceIds.map(id => getInvoiceById(id));
        linkedInvoices = (await Promise.all(invoiceDetailsPromises)).filter(inv => inv !== null) as Invoice[];
      }

      const presupuestoEstimado = fiesta?.configuracion?.presupuestoEstimado ?? 0;
      const totalFacturado = linkedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPagado = linkedInvoices.reduce((sum, inv) => 
        sum + (inv.payments?.reduce((paySum, p) => paySum + p.amount, 0) || 0)
      , 0);
      const saldoPendiente = totalFacturado - totalPagado;

      setFinancialSummary({
        presupuestoEstimado,
        totalFacturado,
        totalPagado,
        saldoPendiente
      });

    } catch (e: any) {
      console.error("Error loading dashboard data:", e);
      setError(e.message || "Error al cargar los datos del dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem))]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem))] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error al Cargar Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadDashboardData}>Intentar de Nuevo</Button>
      </div>
    );
  }
  
  if (!fiestaActual) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem))] text-center p-4">
        <Info className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-semibold">Planifica tu Próxima Fiesta</h2>
        <p className="text-muted-foreground mb-4">Aún no has configurado una fiesta. ¡Empieza ahora!</p>
        <Link href="/fiestas/nueva" passHref>
            <Button>Comenzar a Planificar</Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Fiesta Actual Card */}
      <Card className="shadow-lg bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PartyPopper className="w-7 h-7 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">
              Fiesta Actual en Planificación
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{fiestaActual.configuracion.nombreEvento || "Evento Sin Nombre"}</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{formatDate(fiestaActual.configuracion.fechaEvento)}</span>
          </div>
          {fiestaActual.configuracion.nombreLugar && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{fiestaActual.configuracion.nombreLugar}</span>
            </div>
          )}
           <div className="pt-2">
            <Link href="/fiestas/nueva" passHref>
                <Button variant="outline" size="sm">Ir al Planificador</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summaries */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Estimado</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.presupuestoEstimado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Costo total proyectado para el evento.
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturado</CardTitle>
            <Landmark className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.totalFacturado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de todas las facturas generadas.
            </p>
          </CardContent>
        </Card>
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pagado</CardTitle>
            <PiggyBank className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary?.totalPagado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de todos los pagos recibidos.
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Pendiente</CardTitle>
            <CreditCard className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary && financialSummary.saldoPendiente > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(financialSummary?.saldoPendiente)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary && financialSummary.saldoPendiente <= 0 ? 'Todo al día' : 'Facturado menos pagado.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Vista Rápida</CardTitle>
                  <CardDescription>Otros módulos importantes.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/presupuestos" passHref>
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-primary"/>
                                <p className="font-medium">Gestión de Presupuestos</p>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/invoices" passHref>
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-primary"/>
                                <p className="font-medium">Administrar Facturas</p>
                            </div>
                        </Card>
                    </Link>
                     <Link href="/customers" passHref>
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-primary"/>
                                <p className="font-medium">Directorio de Clientes</p>
                            </div>
                        </Card>
                    </Link>
                     <Link href="/empleados" passHref>
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <ContactRound className="w-6 h-6 text-primary"/>
                                <p className="font-medium">Equipo y Personal</p>
                            </div>
                        </Card>
                    </Link>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Calendario de Eventos</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-2 sm:p-4">
              <DashboardCalendar eventDate={eventDateForCalendar} />
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    La fecha del evento actual ({fiestaActual.configuracion.nombreEvento}) está resaltada.
                </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Added MapPin for location, PartyPopper for current party title
// Adjusted DashboardCalendar to be centered with mx-auto
import { PartyPopper, MapPin, Users, ContactRound, FileText } from 'lucide-react';
