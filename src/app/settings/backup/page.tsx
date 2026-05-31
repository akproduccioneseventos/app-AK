'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, HardDriveDownload, History, UploadCloud, AlertTriangle, Loader2, Trash2, RotateCw, ShieldCheck, Zap, CalendarClock, Database } from 'lucide-react';
import Link from 'next/link';
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
import { createRestorePoint, getRestorePoints, restoreFromPoint, deleteRestorePoint, type RestorePoint, type RestoreSummaryItem } from '@/app/actions/backup';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function BackupPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isRestoringZip, setIsRestoringZip] = useState(false);
  const [isImportingConfirmedEvents, setIsImportingConfirmedEvents] = useState(false);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isCreatingPoint, setIsCreatingPoint] = useState(false);
  const [processingPointName, setProcessingPointName] = useState<string | null>(null);

  const buildRestoreSummary = (summary: RestoreSummaryItem[]) => {
    const details = summary
      .slice(0, 6)
      .map((entry) => `${entry.file} (${entry.count} item${entry.count === 1 ? '' : 's'})`)
      .join(', ');
    const suffix = summary.length > 6 ? ', ...' : '';
    return `Se restauraron ${summary.length} colecciones: ${details}${suffix}`;
  };

  const handleRestoreFromZip = async () => {
    if (!file) {
      toast({ title: 'Sin archivo', description: 'Selecciona un archivo .zip o .json antes de restaurar.', variant: 'destructive' });
      return;
    }
    setIsRestoringZip(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', file);
      const response = await fetch('/api/backup/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al restaurar el respaldo.');
      }
      toast({ title: '✅ Restauración Completa', description: 'Los datos fueron restaurados. La aplicación se recargará.' });
      setFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({ title: 'Error en la Restauración', description: error.message, variant: 'destructive' });
    } finally {
      setIsRestoringZip(false);
    }
  };

  const handleImportConfirmedEvents = async () => {
    setIsImportingConfirmedEvents(true);
    try {
      const response = await fetch('/api/imports/confirmed-events-29', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Error al cargar la importacion.');
      }

      toast({
        title: 'Importacion cargada',
        description: result.message || 'Se cargaron clientes, presupuestos y fiestas confirmadas.',
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({ title: 'Error al cargar importacion', description: error.message, variant: 'destructive' });
    } finally {
      setIsImportingConfirmedEvents(false);
    }
  };

  const handleDownloadConfirmedEvents = async () => {
    try {
      const response = await fetch('/api/imports/confirmed-events-29');
      if (!response.ok) throw new Error('No se pudo generar el archivo de importacion.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AK_IMPORTACION_29_FIESTAS_CLIENTES_PRESUPUESTOS_LISTO.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Descarga iniciada', description: 'Se genero el JSON importable de 29 fiestas.' });
    } catch (error: any) {
      toast({ title: 'No se pudo descargar', description: error.message, variant: 'destructive' });
    }
  };

  const loadRestorePoints = useCallback(async () => {
    setIsLoadingPoints(true);
    try {
      const points = await getRestorePoints();
      setRestorePoints(points);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los puntos de restauración.", variant: "destructive" });
    } finally {
      setIsLoadingPoints(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRestorePoints();
  }, [loadRestorePoints]);

  const handleCreateRestorePoint = async () => {
    setIsCreatingPoint(true);
    try {
        const result = await createRestorePoint(false);
        if (result.success && result.point) {
            toast({ title: "¡Punto Manual Creado!", description: `Se ha guardado tu respaldo actual.` });
            await loadRestorePoints();
        } else throw new Error(result.error);
    } catch(error: any) {
        toast({ title: "Error al Crear", description: error.message, variant: "destructive" });
    } finally {
        setIsCreatingPoint(false);
    }
  };

  const handleRestoreFromPoint = async (pointName: string) => {
    setProcessingPointName(pointName);
    try {
      const result = await restoreFromPoint(pointName);
      if (result.success) {
        const summary = result.summary ?? [];
        toast({
          title: "¡Restauración Completa!",
          description: summary.length > 0 ? buildRestoreSummary(summary) : "La aplicación se recargará ahora.",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ title: "Error en la Restauración", description: error.message, variant: "destructive" });
      setProcessingPointName(null);
    }
  };

  const handleDeleteRestorePoint = async (pointName: string) => {
    setProcessingPointName(pointName);
    try {
      const result = await deleteRestorePoint(pointName);
      if (result.success) {
        toast({ title: "Punto Eliminado" });
        await loadRestorePoints();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setProcessingPointName(null);
    }
  };

  const latestPoint = restorePoints[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Backup y Protección</h1>
        </div>
        <Link href="/settings">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card className="shadow-md border-emerald-200 bg-gradient-to-r from-emerald-50 to-white overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Estado de Respaldo
            </CardTitle>
            <Badge className="bg-emerald-600 text-white border-none">ACTIVO</Badge>
          </div>
          <CardDescription className="text-emerald-700">
            Los respaldos se guardan en Firestore y persisten aunque se redespliegue la app.
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
              <p className="text-xs text-muted-foreground">Respaldos guardados</p>
              <p className="text-2xl font-black text-slate-800">{restorePoints.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
              <p className="text-xs text-muted-foreground">Último respaldo</p>
              <p className="text-sm font-semibold text-slate-800">{latestPoint ? latestPoint.displayDate : 'Sin respaldos aún'}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                Historial de Respaldos
              </CardTitle>
              <CardDescription>
                Lista de respaldos guardados en Firestore.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingPoints ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : restorePoints.length > 0 ? (
                  restorePoints.map((point) => (
                    <Card key={point.name} className="p-4 bg-muted/30 hover:bg-muted/50 transition-colors border-slate-200">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={point.isAuto ? 'bg-blue-600 hover:bg-blue-600' : 'bg-emerald-600 hover:bg-emerald-600'}>
                              {point.isAuto ? 'AUTO' : 'MANUAL'}
                            </Badge>
                            <p className="font-bold text-sm text-slate-800">{point.displayDate}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{point.name}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Database className="w-3.5 h-3.5" />{point.collections} colecciones</span>
                            <span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{new Date(point.timestamp).toLocaleString('es-ES')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={!!processingPointName}>
                                <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                                Restaurar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Restaurar desde este punto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se sobreescribirán todos los datos actuales con los del <span className="font-bold">{point.displayDate}</span>. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestoreFromPoint(point.name)}>Sí, Restaurar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" disabled={!!processingPointName}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este punto?</AlertDialogTitle>
                                <AlertDialogDescription>El punto de restauración será eliminado permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRestorePoint(point.name)} className="bg-destructive hover:bg-destructive/90">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-10 border-2 border-dashed rounded-xl">
                    No hay respaldos guardados aún. Hacé click en &apos;Respaldar Ahora&apos;.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateRestorePoint} disabled={isCreatingPoint} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                {isCreatingPoint ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                🔒 Respaldar Ahora
              </Button>
              <Separator />
              <a href="/api/backup/download" download className="block w-full">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-primary/30 text-primary bg-white hover:bg-primary/5">
                  <HardDriveDownload className="w-4 h-4 mr-2" />
                  Descargar ZIP
                </Button>
              </a>
              <a href="/api/imports/confirmed-events-29" download className="block w-full">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50">
                  <HardDriveDownload className="w-4 h-4 mr-2" />
                  Descargar importacion 29 fiestas
                </Button>
              </a>
              <Button type="button" variant="outline" onClick={handleDownloadConfirmedEvents} className="w-full h-12 rounded-xl font-bold border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50">
                <HardDriveDownload className="w-4 h-4 mr-2" />
                Descargar importacion 29 fiestas
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white" disabled={isImportingConfirmedEvents}>
                    {isImportingConfirmedEvents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                    {isImportingConfirmedEvents ? 'Cargando...' : 'Cargar 29 fiestas ahora'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" /> Cargar importacion validada?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto cargara 29 clientes, 29 presupuestos y 29 fiestas futuras. No reemplaza tu catalogo de servicios; solo agrega las compatibilidades declaradas si faltan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImportConfirmedEvents} className="bg-emerald-700 hover:bg-emerald-800">Si, cargar ahora</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Separator />
              <Card className="shadow-sm border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-700 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" /> Restaurar desde archivo
                  </CardTitle>
                  <CardDescription className="text-orange-600 text-xs">
                    Carga un .zip de respaldo o un .json de importacion validado para restaurar tus datos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="zip-restore-input" className="text-xs font-bold text-orange-700">Archivo de respaldo o importacion</Label>
                    <Input
                      id="zip-restore-input"
                      type="file"
                      accept=".zip,.json,application/json,application/zip"
                      className="rounded-xl bg-white border-orange-200 text-sm"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      disabled={isRestoringZip}
                    />
                    {file && <p className="text-[10px] text-orange-700 font-semibold truncate">Archivo: {file.name}</p>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full h-10 rounded-xl font-bold border-orange-400 text-orange-700 bg-white hover:bg-orange-100" disabled={!file || isRestoringZip}>
                        {isRestoringZip ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        {isRestoringZip ? 'Restaurando...' : 'Restaurar archivo'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" /> Restaurar archivo?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion <strong>sobreescribira los datos incluidos en el archivo</strong>. El importador de eventos confirmados no pisa tu catalogo de servicios salvo que el archivo lo indique expresamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestoreFromZip} className="bg-destructive hover:bg-destructive/90">Si, Restaurar Ahora</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
