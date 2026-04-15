'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock, Archive, Loader2, AlertTriangle, PlusCircle, Info, Users, DollarSign, FileText, CalendarDays, Trash2, Copy, Search, AlertCircle, RotateCcw } from 'lucide-react';
import { getFiestas, archiveFiesta, getHistorialFiestas, deleteFiestaArchivada, createFiestaVacia, duplicateFiesta, deleteFiesta as deleteFiestaAction, resetAllActiveFiestas, deleteAllFiestas } from '@/app/actions/fiesta-actual';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

export default function GestorFiestasPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [fiestasActivas, setFiestasActivas] = useState<FiestaEnPlanificacion[]>([]);
  const [fiestasArchivadas, setFiestasArchivadas] = useState<FiestaEnPlanificacion[]>([]);
  
  const [kpiData, setKpiData] = useState({
    fiestasPasadas: 0,
    fiestasFuturas: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResettingPlanificador, setIsResettingPlanificador] = useState(false);
  const [isDeletingAllFiestas, setIsDeletingAllFiestas] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let kpiResult: Awaited<ReturnType<typeof getDashboardKpiData>> | undefined;
      try {
        kpiResult = await getDashboardKpiData();
      } catch {
        kpiResult = undefined;
      }

      const [activas, archivadas] = await Promise.all([
        getFiestas(false),
        getHistorialFiestas()
      ]);

      if (kpiResult?.success && kpiResult?.data) {
        setKpiData(kpiResult.data);
      }
      // KPI failure doesn't block fiesta loading
      
      setFiestasActivas(Array.isArray(activas) ? activas : []);
      setFiestasArchivadas(Array.isArray(archivadas) ? archivadas : []);

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

  const filteredFiestasActivas = React.useMemo(() => {
    const now = new Date();
    return fiestasActivas.filter(fiesta => {
      const nombre = fiesta.configuracion.nombreEvento || '';
      const matchesSearch = nombre === '' || nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const eventDate = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : null;
      const isContracted = fiesta.estado === 'Contratada';
      const isFutureOrNoDate = !eventDate || eventDate >= now;
      return matchesSearch && (isFutureOrNoDate || isContracted);
    });
  }, [fiestasActivas, searchTerm]);
  
  const pastActiveEvents = React.useMemo(() => {
    const now = new Date();
    return fiestasActivas.filter(fiesta => {
      const eventDate = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : null;
      const isContracted = fiesta.estado === 'Contratada';
      return eventDate && eventDate < now && !isContracted;
    });
  }, [fiestasActivas]);

  const filteredFiestasArchivadas = React.useMemo(() => 
    fiestasArchivadas.filter(fiesta => 
      fiesta.configuracion.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase())
    ), [fiestasArchivadas, searchTerm]);

  // Phase 3.13: Multi-event resource conflict detection
  // Detect active events scheduled on the same date
  const conflictingDates = useMemo(() => {
    const dateGroups: Record<string, FiestaEnPlanificacion[]> = {};
    filteredFiestasActivas.forEach(fiesta => {
      const fecha = fiesta.configuracion.fechaEvento;
      if (!fecha) return;
      // Use Date parsing to safely extract YYYY-MM-DD, handling timezones
      const dateObj = new Date(fecha);
      if (isNaN(dateObj.getTime())) return;
      const dateKey = dateObj.toISOString().substring(0, 10); // YYYY-MM-DD
      if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
      dateGroups[dateKey].push(fiesta);
    });
    // Only return dates with more than one event
    return Object.entries(dateGroups)
      .filter(([, fiestas]) => fiestas.length > 1)
      .map(([date, fiestas]) => ({ date, fiestas }));
  }, [filteredFiestasActivas]);

  const handleDeleteFiesta = async (fiestaId: string, nombreFiesta: string) => {
    setIsProcessing(fiestaId);
    try {
      const result = await deleteFiestaAction(fiestaId);
      if (result.success) {
        const displayName = nombreFiesta || 'Sin nombre';
        toast({ title: "¡Evento Eliminado!", description: `El evento "${displayName}" ha sido eliminado.`, variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error || "No se pudo eliminar el evento.");
      }
    } catch(e: any) {
      toast({ title: "Error al Eliminar", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleArchivar = async (fiestaId: string) => {
    setIsProcessing(fiestaId);
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
      setIsProcessing(null);
    }
  };
  
  const handleReset = async () => {
    setIsProcessing('reset-fiesta');

    try {
      const result = await createFiestaVacia();

      if (result.success && result.newFiestaId) {
        toast({
          title: "¡Nuevo Evento Creado!",
          description: "Se ha creado un nuevo evento en blanco."
        });

        router.push(`/fiestas/nueva?fiestaId=${result.newFiestaId}`);
        return;
      }

      throw new Error(result.error || "No se pudo crear el nuevo evento.");
    } catch (error: any) {
      toast({
        title: "Error al Crear",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteArchived = async (fiestaId: string) => {
    setIsProcessing(fiestaId);
    try {
      const result = await deleteFiestaArchivada(fiestaId);
      if (result.success) {
        toast({ title: "Evento Archivado Eliminado", variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error || "No se pudo eliminar el evento archivado.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetPlanificador = async () => {
    setIsResettingPlanificador(true);
    try {
      const result = await resetAllActiveFiestas();
      if (result.success) {
        toast({
          title: 'Planificador reiniciado',
          description: `${result.archivedCount ?? 0} evento(s) archivado(s). Podés empezar de cero.`,
        });
        await loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo reiniciar el planificador.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsResettingPlanificador(false);
    }
  };

  const handleDeleteAllFiestas = async () => {
    setIsDeletingAllFiestas(true);
    try {
      const result = await deleteAllFiestas();
      if (result.success) {
        toast({
          title: '🗑️ Eventos eliminados permanentemente',
          description: `${result.deletedCount ?? 0} evento(s) eliminado(s) de forma irreversible.`,
          variant: 'destructive',
        });
        await loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron eliminar los eventos.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingAllFiestas(false);
    }
  };

  const handleDuplicate = async (fiestaId: string) => {
    setIsProcessing(fiestaId);
    try {
      const result = await duplicateFiesta(fiestaId);
      if (result.success) {
        toast({ title: "Evento Duplicado", description: "Se ha creado una copia del evento." });
        await loadData();
      } else {
        throw new Error(result.error || "No se pudo duplicar el evento.");
      }
    } catch (error: any) {
      toast({ title: "Error al Duplicar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div data-testid="eventos-page" className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestor de Eventos
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Crear Nuevo Evento Manual
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Crear Nuevo Evento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción creará una nueva planificación en blanco sin archivar los eventos existentes. ¿Deseas continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Sí, crear nuevo evento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isResettingPlanificador || fiestasActivas.length === 0}>
                {isResettingPlanificador ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Reiniciar Planificador
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar el Planificador?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción archivará <strong>todos los eventos activos</strong> ({fiestasActivas.length}) para que puedas comenzar de cero. Los eventos se conservan en el historial. Esta operación no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPlanificador} className="bg-destructive hover:bg-destructive/90">
                  Sí, archivar todos y reiniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isDeletingAllFiestas || fiestasActivas.length === 0}>
                {isDeletingAllFiestas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                🗑️ Eliminar todo permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ ¿Eliminar TODOS los eventos permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará <strong>de forma irreversible</strong> todos los eventos activos ({fiestasActivas.length}). Los datos <strong>NO se podrán recuperar</strong>. Esta operación borra directamente de Firestore y no puede deshacerse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllFiestas} className="bg-destructive hover:bg-destructive/90">
                  Sí, eliminar todo permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link href="/calendario">
            <Button variant="outline">
              <CalendarDays className="w-4 h-4 mr-2" />
              Ver Calendario General
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú Principal
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

      {/* Phase 3.13: Resource Conflict Detection */}
      {conflictingDates.length > 0 && !isLoading && (
        <Card className="border-red-300 bg-red-50 shadow-sm print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600" />
              ⚠️ Conflicto de Fechas Detectado
              <Badge className="bg-red-200 text-red-800 border-0">{conflictingDates.length} conflicto(s)</Badge>
            </CardTitle>
            <CardDescription className="text-red-700">
              Se detectaron múltiples eventos programados para la misma fecha. Verificar disponibilidad de personal y recursos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflictingDates.map(({ date, fiestas }) => (
              <div key={date} className="p-3 rounded-lg bg-white border border-red-200">
                <p className="text-sm font-bold text-red-800 mb-2">
                  📅 {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="space-y-1">
                  {fiestas.map(f => (
                    <div key={f.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-slate-700">{f.configuracion.nombreEvento}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {f.configuracion.horaInicio && `${f.configuracion.horaInicio}hs`}
                          {f.configuracion.nombreLugar && ` · ${f.configuracion.nombreLugar}`}
                        </span>
                      </div>
                      <Link href={`/fiestas/nueva?fiestaId=${f.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7 border-red-200 text-red-700 hover:bg-red-100">
                          Ver evento
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
       
      <Separator className="my-6 print:my-3" />

      {pastActiveEvents.length > 0 && !isLoading && (
        <Card className="bg-amber-50 border-amber-200 shadow-sm print:hidden mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  {pastActiveEvents.length} evento(s) con fecha pasada necesitan ser archivados
                </p>
                <p className="text-xs text-amber-600">
                  {pastActiveEvents.map(f => f.configuracion.nombreEvento).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {pastActiveEvents.map(fiesta => (
                <Button
                  key={fiesta.id}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => handleArchivar(fiesta.id)}
                  disabled={isProcessing === fiesta.id}
                >
                  {isProcessing === fiesta.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4 mr-1" />}
                  Archivar
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="print:break-before-page">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold font-headline text-foreground print:text-lg">
            Eventos Activos en Planificación
          </h2>
          <div className="relative w-full max-w-xs print:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar evento activo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="text-destructive bg-destructive/10 p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <p className="font-semibold text-lg">Error al Cargar Eventos</p>
            <p className="text-sm">{error}</p>
          </Card>
        ) : filteredFiestasActivas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiestasActivas.map((fiesta) => (
              <Card key={fiesta.id} className="bg-card hover:shadow-md transition-shadow print:shadow-none print:border print:break-inside-avoid flex flex-col">
                <CardHeader className="pb-3 pt-4 px-4 print:pb-1 print:pt-1 print:px-2">
                  <CardTitle className="text-md font-semibold text-primary/90 print:text-sm">
                    {fiesta.configuracion.nombreEvento || 'Sin nombre'}
                  </CardTitle>
                  <CardDescription className="text-xs print:text-[10px]">
                    {fiesta.configuracion.tipoCelebracion} - {formatDate(fiesta.configuracion.fechaEvento)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs print:px-2 print:pb-2 print:text-[10px] flex-grow">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3 h-3" /> Invitados: <span className="font-medium text-foreground">{fiesta.configuracion.invitadosEstimados}</span>
                  </div>

                  {fiesta.configuracion.presupuestoEstimado ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-3 h-3" /> Presupuesto:{' '}
                      <span className="font-medium text-foreground">
                        {new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(fiesta.configuracion.presupuestoEstimado)}
                      </span>
                    </div>
                  ) : null}

                  {fiesta.configuracion.nombreLugar ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <FileText className="w-3 h-3" /> Lugar: <span className="font-medium text-foreground truncate">{fiesta.configuracion.nombreLugar}</span>
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="p-2 border-t flex flex-col items-stretch gap-2 print:hidden">
                  <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`}>
                    <Button variant="default" size="sm" className="w-full">
                      Planificar
                    </Button>
                  </Link>

                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicate(fiesta.id)} disabled={isProcessing === fiesta.id}>
                      {isProcessing === fiesta.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2">Duplicar</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1" disabled={isProcessing === fiesta.id}>
                          {isProcessing === fiesta.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          <span className="ml-2">Eliminar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar Evento Activo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            El evento "{fiesta.configuracion.nombreEvento || 'Sin nombre'}" se eliminará permanentemente. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFiesta(fiesta.id, fiesta.configuracion.nombreEvento)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground bg-muted/20 rounded-md print:hidden">
            <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No hay fiestas activas que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
        
      <Separator className="my-8 print:my-4" />

      <div className="print:break-before-page">
        <h2 className="text-xl font-semibold font-headline mb-4 text-foreground print:text-lg">
          Eventos Pasados y Archivados
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredFiestasArchivadas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiestasArchivadas.map(fiesta => (
              <Card key={fiesta.id} className="bg-muted/40 print:border print:shadow-none">
                <CardHeader className="p-4 flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-medium text-muted-foreground print:text-sm">
                      {fiesta.configuracion.nombreEvento}
                    </CardTitle>
                    <CardDescription className="text-xs print:text-[10px]">
                      {formatDate(fiesta.configuracion.fechaEvento)}
                    </CardDescription>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-7 w-7" disabled={isProcessing === fiesta.id}>
                        {isProcessing === fiesta.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Evento Archivado?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente el archivo del evento "{fiesta.configuracion.nombreEvento}". No podrás recuperar sus datos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteArchived(fiesta.id)} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground bg-muted/20 rounded-md print:hidden">
            <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{searchTerm ? 'No hay eventos archivados que coincidan con tu búsqueda.' : 'No hay eventos en el archivo histórico.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
