
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Archive, Loader2, AlertTriangle, PlusCircle, Info, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getHistorialFiestas, archivarFiestaActual, getFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return "N/A";
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "N/A";
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numAmount);
};


export default function TodasLasFiestasPage() {
  const { toast } = useToast();
  const [historialFiestas, setHistorialFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [fiestaActualNombre, setFiestaActualNombre] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [historial, actual] = await Promise.all([
        getHistorialFiestas(),
        getFiestaActual()
      ]);
      setHistorialFiestas(historial);
      setFiestaActualNombre(actual?.configuracion?.nombreEvento || "Evento Actual Sin Nombre");
    } catch (e: any) {
      console.error("Error loading fiestas history:", e);
      setError("No se pudo cargar el historial de fiestas.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleArchivar = async () => {
    setIsArchiving(true);
    try {
      const result = await archivarFiestaActual();
      if (result.success) {
        toast({
          title: "¡Fiesta Archivada!",
          description: `"${result.archivada?.configuracion.nombreEvento}" ha sido archivada. Ahora puedes planificar una nueva.`,
        });
        await loadData(); // Recargar la lista
      } else {
        throw new Error(result.error || "No se pudo archivar la fiesta actual.");
      }
    } catch (e: any) {
      toast({ title: "Error al Archivar", description: e.message, variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Todas las Fiestas
          </h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="lg" disabled={isArchiving || isLoading}>
              {isArchiving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Archive className="w-5 h-5 mr-2" />}
              {isArchiving ? "Archivando..." : "Finalizar y Archivar Fiesta Actual"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Archivación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto moverá la fiesta actual "{fiestaActualNombre || 'Evento Actual'}" al historial y reiniciará el planificador para una nueva fiesta. ¿Estás seguro?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchivar} disabled={isArchiving} className="bg-primary hover:bg-primary/90">
                {isArchiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sí, Archivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Historial de Fiestas Archivadas</CardTitle>
          <CardDescription className="text-sm">
            Aquí puedes ver un resumen de las fiestas que ya has planificado y archivado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al Cargar Historial</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : historialFiestas.length > 0 ? (
            <div className="space-y-4">
              {historialFiestas.map((fiesta) => (
                <Card key={fiesta.id} className="bg-muted/30 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-primary">{fiesta.configuracion.nombreEvento}</CardTitle>
                    <CardDescription className="text-xs">
                      {fiesta.configuracion.tipoCelebracion} - {formatDate(fiesta.configuracion.fechaEvento)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3.5 h-3.5"/> Invitados: <span className="font-medium text-foreground">{fiesta.configuracion.invitadosEstimados}</span>
                    </div>
                     <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5"/> Presupuesto: <span className="font-medium text-foreground">{formatCurrency(fiesta.configuracion.presupuestoEstimado)}</span>
                    </div>
                    {/* Podríamos añadir más detalles o un botón "Ver Detalles" en el futuro */}
                  </CardContent>
                  {/* <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" disabled>Ver Detalles (Próximamente)</Button>
                  </CardFooter> */}
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Info className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                No hay fiestas archivadas todavía.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando archives una fiesta actual, aparecerá aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
