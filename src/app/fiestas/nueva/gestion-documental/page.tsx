
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Archive, FileText, Printer, Share2, DollarSign, CreditCard, CalendarCheck, FileSignature, PlusCircle, Info, Users, Loader2, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label'; // Added Label import
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import { StatusBadge as InvoiceStatusBadge } from '@/components/status-badge';
import { useToast } from '@/hooks/use-toast';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, Payment } from '@/types/invoice';
import type { BudgetDisplaySettings } from '@/types/settings';

import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { getBudgetDisplaySettings } from '@/app/actions/settings';

const formatCurrency = (amount?: number, currency: string = 'UYU') => {
  if (amount === undefined || amount === null || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

export default function GestionDocumentalPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [facturas, setFacturas] = useState<Invoice[]>([]);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);

      let tempCliente = null;
      if (fiestaData.configuracion.clienteId) {
        tempCliente = await getCustomerById(fiestaData.configuracion.clienteId);
        setCliente(tempCliente);
      }

      if (fiestaData.presupuestoId) {
        const presData = await getPresupuestoById(fiestaData.presupuestoId);
        setPresupuesto(presData);
      }

      if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
        const invoicePromises = fiestaData.invoiceIds.map(id => getInvoiceById(id));
        const resolvedInvoices = (await Promise.all(invoicePromises)).filter(inv => inv !== null) as Invoice[];
        setFacturas(resolvedInvoices);
      }
      
      const settings = await getBudgetDisplaySettings();
      setDisplaySettings(settings);

    } catch (err: any) {
      console.error("Error loading data for financial management:", err);
      setError("No se pudo cargar la información administrativa del evento.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPagado = facturas.reduce((sum, inv) => {
    const pagosFactura = inv.payments?.reduce((paySum, payment) => paySum + payment.amount, 0) || 0;
    return sum + pagosFactura;
  }, 0);

  const totalPresupuestado = presupuesto?.costoTotalEstimado || 0;
  const saldoPendiente = totalPresupuestado - totalPagado;
  const porcentajePagado = totalPresupuestado > 0 ? (totalPagado / totalPresupuestado) * 100 : 0;
  
  const handlePrintSummary = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando gestión documental...</p>
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No hay datos de fiesta actual."}</p>
        <Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button>
      </div>
    );
  }
  
  const eventYear = presupuesto ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  let calculatedAnnualAdjustmentAmount = 0;
  if (presupuesto && displaySettings?.annualAdjustmentPercentage && displaySettings.annualAdjustmentPercentage > 0 && eventYear > currentYear) {
    calculatedAnnualAdjustmentAmount = (presupuesto.costoTotalEstimado * displaySettings.annualAdjustmentPercentage) / 100;
  }
  const showAnnualAdjustmentLegend = calculatedAnnualAdjustmentAmount > 0 && presupuesto?.estado !== 'Facturado';


  return (
    <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión Documental y Financiera</h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>

      <Card className="shadow-md print:shadow-none print:border-none">
        <CardHeader className="bg-muted/30 p-4 print:p-2">
          <CardTitle className="font-headline text-xl print:text-lg">{fiesta.configuracion.nombreEvento}</CardTitle>
          <CardDescription className="print:text-sm">
            Fecha: {formatDate(fiesta.configuracion.fechaEvento)} | Cliente: {cliente?.name || cliente?.companyName || "No asignado"}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:gap-3">
        {/* Contrato del Evento */}
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary"/>Contrato del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cliente?.contractFileName ? (
              <a href={`/api/contracts/${cliente.contractFileName}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2"/>Ver Contrato Firmado</Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay contrato del cliente cargado.</p>
            )}
            <Button variant="outline" className="w-full" disabled><PlusCircle className="w-4 h-4 mr-2"/>Subir Contrato (Próximamente)</Button>
          </CardContent>
        </Card>

        {/* Presupuesto del Evento */}
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/>Presupuesto del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {presupuesto ? (
              <>
                <p className="text-sm">ID Presupuesto: <span className="font-medium">{presupuesto.id.split('_').pop()}</span></p>
                <PresupuestoStatusBadge status={presupuesto.estado} />
                <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref>
                  <Button variant="outline" className="w-full">Ver Presupuesto Detallado</Button>
                </Link>
                {showAnnualAdjustmentLegend && (
                  <p className="text-xs text-orange-600 mt-1">
                    <Info className="inline w-3 h-3 mr-1"/>
                    Se aplicará ajuste anual del {displaySettings?.annualAdjustmentPercentage}%.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay presupuesto asignado a esta fiesta.</p>
            )}
          </CardContent>
        </Card>

        {/* Facturas */}
        <Card className="md:col-span-2 lg:col-span-1 print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/>Facturas Asociadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {facturas.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {facturas.map(fac => (
                  <li key={fac.id} className="p-2 border rounded-md bg-muted/20 hover:bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span>{fac.invoiceNumber} ({formatCurrency(fac.totalAmount, fac.currency)})</span>
                      <InvoiceStatusBadge status={fac.status} />
                    </div>
                    <Link href={`/invoices/${fac.id}`} passHref>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">Ver Detalle</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay facturas asignadas a esta fiesta.</p>
            )}
            <Button variant="outline" className="w-full" disabled><PlusCircle className="w-4 h-4 mr-2"/>Generar Factura (Próximamente)</Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6 print:my-3"/>

      <Card className="shadow-lg print:shadow-none print:border print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary"/>Resumen Financiero del Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
              <p className="text-xs font-medium text-blue-700">TOTAL PRESUPUESTADO</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPresupuestado)}</p>
            </div>
            <div className="p-3 border rounded-md bg-green-50 border-green-200">
              <p className="text-xs font-medium text-green-700">TOTAL PAGADO</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagado)}</p>
            </div>
            <div className={`p-3 border rounded-md ${saldoPendiente > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs font-medium ${saldoPendiente > 0 ? 'text-red-700' : 'text-green-700'}`}>SALDO PENDIENTE</p>
              <p className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(saldoPendiente)}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Progreso de Pago</Label>
            <Progress value={porcentajePagado} className="h-3 mt-1" />
            <p className="text-xs text-right mt-0.5 text-muted-foreground">{porcentajePagado.toFixed(1)}% pagado</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" disabled><PlusCircle className="w-4 h-4 mr-2"/>Registrar Nuevo Pago (Próximamente)</Button>
        </CardContent>
      </Card>
      
      <CardFooter className="mt-6 print:hidden flex flex-col sm:flex-row justify-end items-center gap-3 border-t pt-6">
         <Button variant="outline" onClick={() => toast({ title: "Próximamente", description: "La función de compartir resumen estará disponible pronto."})} disabled>
            <Share2 className="w-4 h-4 mr-2" /> Compartir Resumen
        </Button>
        <Button onClick={handlePrintSummary}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir Resumen Administrativo
        </Button>
      </CardFooter>
    </div>
  );
}

