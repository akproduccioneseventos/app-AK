

'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import { ArrowLeft, Archive, FileText, Printer, Share2, DollarSign, CreditCard, CalendarCheck, FileSignature, PlusCircle, Info, Users, Loader2, AlertTriangle, BarChart3, UploadCloud, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import { StatusBadge as InvoiceStatusBadge } from '@/components/status-badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import type { BudgetDisplaySettings } from '@/types/settings';

import { getFiestaActual, updatePresupuestoAsignadoFiestaActual, uploadContratoFiesta } from '@/app/actions/fiesta-actual';
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
  const router = useRouter();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [facturas, setFacturas] = useState<Invoice[]>([]);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [contratoSalonFile, setContratoSalonFile] = useState<File | null>(null);
  const [contratoServicioFile, setContratoServicioFile] = useState<File | null>(null);
  
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
      } else {
        setPresupuesto(null); 
      }

      if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
        const invoicePromises = fiestaData.invoiceIds.map(id => getInvoiceById(id));
        const resolvedInvoices = (await Promise.all(invoicePromises)).filter(inv => inv !== null) as Invoice[];
        setFacturas(resolvedInvoices);
      } else {
        setFacturas([]);
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

  const handleFileUpload = async (file: File | null, contractType: 'salon' | 'servicio') => {
      if (!file) {
          toast({title: "No hay archivo", description: "Por favor, selecciona un archivo PDF.", variant: "destructive"});
          return;
      }
      setIsSaving(true);
      const formData = new FormData();
      formData.append('contractFile', file);
      formData.append('contractType', contractType);
      
      try {
          const result = await uploadContratoFiesta(formData);
          if (result.success) {
              toast({title: "Contrato Subido", description: `El contrato de ${contractType === 'salon' ? 'salón' : 'servicio'} se ha guardado.`});
              await loadData();
              if (contractType === 'salon') setContratoSalonFile(null);
              else setContratoServicioFile(null);
          } else {
              throw new Error(result.error || "No se pudo subir el archivo.");
          }
      } catch (err: any) {
          toast({title: "Error al Subir", description: err.message, variant: "destructive"});
      } finally {
          setIsSaving(false);
      }
  };


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
  
  const handleToggleAssignPresupuesto = async () => {
    if (!fiesta) return;
    if (!presupuesto && (!cliente || !cliente.id)) {
        toast({title: "Acción no disponible", description: "Primero asigna un cliente a la fiesta y luego busca o crea un presupuesto para asignarlo.", variant: "default"});
        return;
    }
    if (fiesta.presupuestoId) {
        setIsSaving(true);
        const result = await updatePresupuestoAsignadoFiestaActual(undefined);
        if (result.success) {
            toast({title: "Presupuesto Desasignado", description: "El presupuesto ha sido desasignado de la fiesta actual."});
            await loadData();
        } else {
            toast({title: "Error", description: result.error || "No se pudo desasignar el presupuesto.", variant: "destructive"});
        }
        setIsSaving(false);
    } else {
        router.push("/presupuestos");
    }
  };

  const handleShare = () => toast({title: "Próximamente", description: "La función de compartir aún no está implementada."});

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
        <Card className="shadow-md print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary"/>Contrato del Salón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fiesta.contratoSalonFileName ? (
              <a href={`/api/contracts/fiestas/${fiesta.contratoSalonFileName}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2"/>Ver Contrato de Salón</Button>
              </a>
            ) : <p className="text-sm text-muted-foreground italic">No hay un contrato de salón cargado.</p>}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="salon-contract-upload" className="text-xs text-muted-foreground">Subir o Reemplazar (PDF):</Label>
              <Input id="salon-contract-upload" type="file" accept="application/pdf" onChange={e => setContratoSalonFile(e.target.files?.[0] || null)} disabled={isSaving}/>
              <Button type="button" onClick={() => handleFileUpload(contratoSalonFile, 'salon')} disabled={!contratoSalonFile || isSaving} className="w-full mt-1" size="sm">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}
                  {isSaving ? "Subiendo..." : "Subir Contrato Salón"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary"/>Contrato de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fiesta.contratoServicioFileName ? (
              <a href={`/api/contracts/fiestas/${fiesta.contratoServicioFileName}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2"/>Ver Contrato de Servicio</Button>
              </a>
            ) : <p className="text-sm text-muted-foreground italic">No hay un contrato de servicio cargado.</p>}
             <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="service-contract-upload" className="text-xs text-muted-foreground">Subir o Reemplazar (PDF):</Label>
              <Input id="service-contract-upload" type="file" accept="application/pdf" onChange={e => setContratoServicioFile(e.target.files?.[0] || null)} disabled={isSaving} />
              <Button type="button" onClick={() => handleFileUpload(contratoServicioFile, 'servicio')} disabled={!contratoServicioFile || isSaving} className="w-full mt-1" size="sm">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}
                  {isSaving ? "Subiendo..." : "Subir Contrato Servicio"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1 print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/>Presupuesto del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {presupuesto ? (
              <>
                <p className="text-sm">ID: <span className="font-medium">{presupuesto.id.split('_').pop()?.substring(0,5)}</span></p>
                <PresupuestoStatusBadge status={presupuesto.estado} />
                <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref><Button variant="outline" className="w-full">Ver Presupuesto Detallado</Button></Link>
              </>
            ) : (<p className="text-sm text-muted-foreground italic">No hay presupuesto asignado.</p>)}
            <Button variant="default" className="w-full" onClick={handleToggleAssignPresupuesto} disabled={isSaving || !cliente}>
              {fiesta.presupuestoId ? "Desvincular Presupuesto" : "Asignar/Crear Presupuesto"}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary"/>Resumen Financiero y Facturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="p-3 border rounded-md bg-blue-50 border-blue-200"><p className="text-xs font-medium text-blue-700">TOTAL PRESUPUESTADO</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPresupuestado)}</p></div>
                <div className="p-3 border rounded-md bg-green-50 border-green-200"><p className="text-xs font-medium text-green-700">TOTAL PAGADO</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagado)}</p></div>
                <div className={`p-3 border rounded-md ${saldoPendiente > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}><p className={`text-xs font-medium ${saldoPendiente > 0 ? 'text-red-700' : 'text-green-700'}`}>SALDO PENDIENTE</p><p className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(saldoPendiente)}</p></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Progreso de Pago</Label><Progress value={porcentajePagado} className="h-3 mt-1" /></div>
              
              <Separator className="my-4"/>
              
              <div className="space-y-2">
                <h4 className="text-md font-medium">Facturas Asociadas ({facturas.length})</h4>
                 {facturas.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {facturas.map(fac => (<li key={fac.id} className="p-2 border rounded-md bg-muted/20 hover:bg-muted/30 flex justify-between items-center"><div className="flex items-center gap-2"><span className="font-semibold">{fac.invoiceNumber}</span> ({formatCurrency(fac.totalAmount, fac.currency)})<StatusBadge status={fac.status} /></div><Link href={`/invoices/${fac.id}`} passHref><Button variant="ghost" size="sm" className="h-7 text-xs">Ver</Button></Link></li>))}
                  </ul>
                ) : (<p className="text-sm text-muted-foreground italic">No hay facturas asignadas a esta fiesta.</p>)}
                <Button variant="outline" className="w-full sm:w-auto" disabled={!presupuesto || presupuesto.estado === 'Facturado'} onClick={() => presupuesto && router.push(`/invoices/new?fromPresupuesto=${presupuesto.id}`)}><PlusCircle className="w-4 h-4 mr-2"/>Generar Factura desde Presupuesto</Button>
              </div>
          </CardContent>
      </Card>
      
      <CardFooter className="mt-6 border-t pt-6 flex flex-col sm:flex-row justify-end items-center gap-3 print:hidden">
         <Button variant="outline" onClick={handleShare} disabled><Share2 className="w-4 h-4 mr-2" /> Compartir Resumen</Button>
         <Button onClick={handlePrintSummary} disabled><Printer className="w-4 h-4 mr-2" /> Imprimir Resumen</Button>
      </CardFooter>
    </div>
  );
}
