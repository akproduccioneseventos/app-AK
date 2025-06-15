
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Archive, Loader2, AlertTriangle, PlusCircle, Info, Users, DollarSign, FileText, PartyPopper, Printer, Edit, Calculator, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getHistorialFiestas, archivarFiestaActual, getFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getCustomerById } from '@/app/actions/customers';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

export default function GestorFiestasPage() {
  const { toast } = useToast();
  const [historialFiestas, setHistorialFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [clienteActual, setClienteActual] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setClienteActual(null);
    try {
      const [historial, actual] = await Promise.all([
        getHistorialFiestas(),
        getFiestaActual()
      ]);
      setHistorialFiestas(historial);
      setFiestaActual(actual);
      if (actual && actual.configuracion.clienteId) {
        const cliente = await getCustomerById(actual.configuracion.clienteId);
        setClienteActual(cliente);
      }
    } catch (e: any) {
      console.error("Error loading fiestas data:", e);
      setError("No se pudo cargar la información de las fiestas.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleArchivarYCrearNueva = async () => {
    setIsArchiving(true);
    try {
      const result = await archivarFiestaActual();
      if (result.success) {
        toast({
          title: "¡Operación Exitosa!",
          description: `"${result.archivada?.configuracion.nombreEvento}" ha sido archivada. Ahora puedes planificar una nueva fiesta.`,
        });
        await loadData(); // Recargar todos los datos
      } else {
        throw new Error(result.error || "No se pudo archivar la fiesta actual.");
      }
    } catch (e: any) {
      toast({ title: "Error al Archivar", description: e.message, variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const fiestasPasadasCount = historialFiestas.length;
  let fiestasFuturasCount = 0;
  if (fiestaActual && fiestaActual.configuracion.fechaEvento) {
    if (new Date(fiestaActual.configuracion.fechaEvento) >= new Date()) {
      fiestasFuturasCount = 1;
    }
  }
  const isFiestaActualConfigured = fiestaActual && fiestaActual.configuracion.nombreEvento && fiestaActual.configuracion.nombreEvento !== "Mi Próximo Evento Increíble";


  return (
    <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestor de Fiestas y Eventos
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
           <Button variant="outline" onClick={handlePrintSummary} disabled={isLoading}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Resumen
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="lg" disabled={isArchiving || isLoading}>
                  {isArchiving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Archive className="w-5 h-5 mr-2" />}
                  {isArchiving ? "Archivando..." : "Archivar Fiesta Actual y Crear Nueva"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar Acción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto moverá la fiesta actual "{fiestaActual?.configuracion.nombreEvento || 'Evento Actual'}" al historial y reiniciará el planificador para una nueva. ¿Estás seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchivarYCrearNueva} disabled={isArchiving} className="bg-primary hover:bg-primary/90">
                    {isArchiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, Archivar y Crear Nueva
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Cargando información de fiestas...</p>
        </div>
      ) : error ? (
        <Card className="text-destructive bg-destructive/10 p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-semibold text-lg">Error al Cargar Información</p>
          <p className="text-sm">{error}</p>
        </Card>
      ) : (
        <>
          <Card className="shadow-xl border-t-4 border-primary print:shadow-none print:border-2 print:border-primary/50 print:break-inside-avoid">
            <CardHeader className="pb-4 print:pb-2">
              <CardTitle className="font-headline text-xl md:text-2xl text-primary flex items-center gap-2 print:text-lg">
                <PartyPopper className="w-7 h-7 print:w-5 print:h-5"/> Fiesta Actual en Planificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFiestaActualConfigured && fiestaActual ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground print:text-base">{fiestaActual.configuracion.nombreEvento}</h3>
                  <p className="text-sm text-muted-foreground print:text-xs">
                    {fiestaActual.configuracion.tipoCelebracion} - {formatDate(fiestaActual.configuracion.fechaEvento)}
                  </p>
                  {clienteActual && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Cliente:</span> {clienteActual.name || clienteActual.companyName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2 print:hidden">
                    <Link href="/fiestas/nueva" passHref>
                      <Button variant="default" size="sm">
                        <Edit className="w-4 h-4 mr-2"/>Gestionar Fiesta Actual
                      </Button>
                    </Link>
                     {clienteActual?.contractFileName && (
                        <a href={`/api/contracts/${clienteActual.contractFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2"/> Ver Contrato
                            </Button>
                        </a>
                    )}
                    {clienteActual?.budgetFileName && (
                        <a href={`/api/budgets/${clienteActual.budgetFileName}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2"/> Ver Presupuesto
                            </Button>
                        </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-60"/>
                  <p>No hay una fiesta configurada o está con datos por defecto.</p>
                  <p className="text-xs">Usa el botón "Archivar y Crear Nueva" o configura la actual en el planificador.</p>
                   <Link href="/fiestas/nueva/configuracion" passHref className="print:hidden">
                      <Button variant="link" size="sm" className="mt-2">Configurar Fiesta Actual</Button>
                    </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg print:shadow-none print:border-2 print:border-primary/50 print:break-inside-avoid">
            <CardHeader className="pb-4 print:pb-2">
              <CardTitle className="font-headline text-xl md:text-2xl text-primary flex items-center gap-2 print:text-lg">
                <Calculator className="w-7 h-7 print:w-5 print:h-5"/> Planner Costo-Fiesta
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Calcula y gestiona proporciones, costos y precios para tus eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este módulo te permitirá diseñar menús, planificar repostería, gestionar bebidas y más. (En desarrollo)
              </p>
            </CardContent>
            <CardFooter className="pt-3">
              <Link href="/planner-costo-fiesta" passHref className="w-full">
                <Button variant="default" className="w-full">
                  Acceder al Planner
                  <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
              </Link>
            </CardFooter>
          </Card>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 print:hidden">
            <Card className="shadow-md">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fiestas Pasadas</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fiestasPasadasCount}</div>
                <p className="text-xs text-muted-foreground">Total de eventos archivados.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fiestas Futuras</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fiestasFuturasCount}</div>
                <p className="text-xs text-muted-foreground">Eventos actualmente en planificación.</p>
              </CardContent>
            </Card>
          </div>
          
          <Separator className="my-6 print:my-3"/>

          <div className="print:break-before-page">
            <h2 className="text-xl font-semibold font-headline mb-4 text-foreground print:text-lg">Historial de Fiestas Archivadas</h2>
            {historialFiestas.length > 0 ? (
              <div className="space-y-4">
                {historialFiestas.map((fiesta) => (
                  <Card key={fiesta.id} className="bg-muted/30 hover:shadow-md transition-shadow print:shadow-none print:border print:break-inside-avoid">
                    <CardHeader className="pb-3 pt-4 px-4 print:pb-1 print:pt-1 print:px-2">
                      <CardTitle className="text-md font-semibold text-foreground print:text-sm">{fiesta.configuracion.nombreEvento}</CardTitle>
                      <CardDescription className="text-xs print:text-[10px]">
                        {fiesta.configuracion.tipoCelebracion} - {formatDate(fiesta.configuracion.fechaEvento)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:px-2 print:pb-2 print:text-[10px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3 h-3"/> Invitados: <span className="font-medium text-foreground">{fiesta.configuracion.invitadosEstimados}</span>
                      </div>
                       {/* <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="w-3 h-3"/> Presupuesto: <span className="font-medium text-foreground">{formatCurrency(fiesta.configuracion.presupuestoEstimado)}</span>
                      </div> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground bg-muted/20 rounded-md print:hidden">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay fiestas archivadas todavía.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
