'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, HardDriveDownload, History, UploadCloud, Info, AlertTriangle, Loader2, PlusCircle, Trash2, RotateCw, ShieldCheck, Zap } from 'lucide-react';
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
import { createRestorePoint, getRestorePoints, restoreFromPoint, deleteRestorePoint, type RestorePoint } from '@/app/actions/backup';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function BackupPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isRestoringZip, setIsRestoringZip] = useState(false);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isCreatingPoint, setIsCreatingPoint] = useState(false);
  const [processingPointName, setProcessingPointName] = useState<string | null>(null);

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
            toast({ title: "¡Restauración Completa!", description: "La aplicación se recargará ahora." });
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Backup y Protección</h1>
        </div>
        <Link href="/settings">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      {/* AUTO BACKUP STATUS */}
      <Card className="bg-emerald-50 border-emerald-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600"/> Protección Automática Activa
                </CardTitle>
                <Badge className="bg-emerald-600 text-white border-none animate-pulse">LIVE</Badge>
              </div>
              <CardDescription className="text-emerald-700">
                  El sistema está monitoreando tus cambios. Se crea un punto de restauración automático cada 30 minutos de actividad.
              </CardDescription>
          </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><History className="w-6 h-6 text-primary"/>Puntos de Restauración</CardTitle>
                <CardDescription>Lista de respaldos internos guardados en el servidor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {isLoadingPoints ? <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div> : 
                        restorePoints.length > 0 ? (
                            restorePoints.map(point => (
                                <Card key={point.name} className="p-3 flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{point.displayDate}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{point.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={!!processingPointName}><RotateCw className="w-3.5 h-3.5 mr-1.5"/>Restaurar</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>¿Restaurar desde este punto?</AlertDialogTitle><AlertDialogDescription>Se sobreescribirán todos los datos actuales con los del <span className="font-bold">{point.displayDate}</span>. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRestoreFromPoint(point.name)}>Sí, Restaurar</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" disabled={!!processingPointName}><Trash2 className="w-4 h-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>¿Eliminar este punto?</AlertDialogTitle><AlertDialogDescription>El punto de restauración será eliminado permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRestorePoint(point.name)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))
                        ) : <p className="text-sm text-center text-muted-foreground py-10 border-2 border-dashed rounded-xl">No hay puntos de restauración aún.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
            <Card className="shadow-lg border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Acción Manual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleCreateRestorePoint} disabled={isCreatingPoint} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                        {isCreatingPoint ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Zap className="w-4 h-4 mr-2"/>}
                        Respaldo Ahora
                    </Button>
                    <Separator />
                    <a href="/api/backup/download" download className="block w-full">
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-primary/30 text-primary bg-white hover:bg-primary/5">
                            <HardDriveDownload className="w-4 h-4 mr-2" />
                            Bajar ZIP Físico
                        </Button>
                    </a>
                </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Consejo de Seguridad:</strong> Aunque el sistema hace auto-backups en el servidor, descarga el ZIP físico a tu computadora una vez por semana para tener una copia externa de seguridad.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
