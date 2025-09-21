
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Archive, Loader2, AlertTriangle, PlusCircle, Info, Users, DollarSign, FileText, PartyPopper, Printer, Edit, Calculator, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { getFiestas, archiveFiesta, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import { getDashboardKpiData } from '@/app/actions/dashboard';
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
  const [fiestasActivas, setFiestasActivas] = useState<FiestaEnPlanificacion[]>([]);
  const [fiestasArchivadas, setFiestasArchivadas] = useState<FiestaEnPlanificacion[]>([]);
  
  const [kpiData, setKpiData] = useState({
    fiestasPasadas: 0,
    fiestasFuturas: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpiResult, activas, archivadas] = await Promise.all([
        getDashboardKpiData(),
        getFiestas(false), // Solo fiestas activas
        getHistorialFiestas()
      ]);

      if (kpiResult.success && kpiResult.data) {
        setKpiData(kpiResult.data);
      } else {
        throw new Error(kpiResult.error || "No se pudieron cargar los datos del panel.");
      }
      
      setFiestasActivas(activas);
      setFiestasArchivadas(archivadas);

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

  const handleArchivar = async (fiestaId: string) => {
    setIsArchiving(fiestaId);
    try {
      const result = await archiveFiesta(fiestaId);
      if (result.success) {
        toast({ title: "¡Evento Archivado!" });
        await loadData(); 
      } else {
        throw new Error(result.error || "No se pudo archivar la fiesta.");
      }
    } catch (e: any) {
      toast({ title: "Error al Archivar", description: e.message, variant: "destructive" });
    } finally {
      setIsArchiving(null);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };
  
  const handleShare = async () => {
    const shareData = {
      title: 'Resumen de Eventos - AK Producciones',
      text: `Resumen de eventos y planificación actual.`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error();
      }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a esta página ha sido copiado a tu portapapeles.",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestor de Eventos
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
           <Button variant="outline" onClick={handlePrintSummary} disabled={isLoading}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleShare} disabled={isLoading}>
              <Share2 className="w-4 h-4 mr-2"/>Compartir
            </Button>
            <Link href="/customers/new" passHref>
              <Button>
                  <PlusCircle className="w-4 h-4 mr-2"/> Nuevo Cliente/Evento
              </Button>
            </Link>
        </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Pasados</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.fiestasPasadas}</div>
                <p className="text-xs text-muted-foreground">Total de eventos archivados.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Futuros</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.fiestasFuturas}</div>
                <p className="text-xs text-muted-foreground">Eventos en planificación activa.</p>
              </CardContent>
            </Card>
       </div>
       
       <Separator className="my-6 print:my-3"/>

        <div className="print:break-before-page">
            <h2 className="text-xl font-semibold font-headline mb-4 text-foreground print:text-lg">Eventos Activos en Planificación</h2>
            {isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : error ? (
                 <Card className="text-destructive bg-destructive/10 p-6 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold text-lg">Error al Cargar Eventos</p>
                    <p className="text-sm">{error}</p>
                </Card>
            ) : fiestasActivas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fiestasActivas.map((fiesta) => (
                  <Card key={fiesta.id} className="bg-card hover:shadow-md transition-shadow print:shadow-none print:border print:break-inside-avoid flex flex-col">
                    <CardHeader className="pb-3 pt-4 px-4 print:pb-1 print:pt-1 print:px-2">
                      <CardTitle className="text-md font-semibold text-primary/90 print:text-sm">{fiesta.configuracion.nombreEvento}</CardTitle>
                      <CardDescription className="text-xs print:text-[10px]">
                        {fiesta.configuracion.tipoCelebracion} - {formatDate(fiesta.configuracion.fechaEvento)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:px-2 print:pb-2 print:text-[10px] flex-grow">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3 h-3"/> Invitados: <span className="font-medium text-foreground">{fiesta.configuracion.invitadosEstimados}</span>
                      </div>
                    </CardContent>
                     <CardFooter className="p-2 border-t flex justify-end gap-2 print:hidden">
                        <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} passHref>
                          <Button variant="default" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-2"/>Planificar
                          </Button>
                        </Link>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isArchiving === fiesta.id}>
                                {isArchiving === fiesta.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Archive className="w-4 h-4"/>}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Archivar Evento?</AlertDialogTitle><AlertDialogDescription>El evento "{fiesta.configuracion.nombreEvento}" se moverá al historial. Podrás verlo pero no editarlo.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleArchivar(fiesta.id)}>Archivar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground bg-muted/20 rounded-md print:hidden">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay fiestas activas. Crea un nuevo cliente para empezar a planificar.</p>
              </div>
            )}
        </div>
        
        <Separator className="my-8 print:my-4" />

        <div className="print:break-before-page">
            <h2 className="text-xl font-semibold font-headline mb-4 text-foreground print:text-lg">Eventos Pasados y Archivados</h2>
            {isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : fiestasArchivadas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fiestasArchivadas.map(fiesta => (
                        <Card key={fiesta.id} className="bg-muted/40 print:border print:shadow-none">
                            <CardHeader className="p-4">
                                <CardTitle className="text-base font-medium text-muted-foreground print:text-sm">{fiesta.configuracion.nombreEvento}</CardTitle>
                                <CardDescription className="text-xs print:text-[10px]">{formatDate(fiesta.configuracion.fechaEvento)}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center text-muted-foreground bg-muted/20 rounded-md print:hidden">
                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No hay eventos en el archivo histórico.</p>
                </div>
            )}
        </div>

    </div>
  );
}

    