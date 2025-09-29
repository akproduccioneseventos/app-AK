
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, HardDriveDownload, History, UploadCloud, Info, AlertTriangle, Loader2, PlusCircle, Trash2, RotateCw } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { createRestorePoint, getRestorePoints, restoreFromPoint, deleteRestorePoint, type RestorePoint } from '@/app/actions/backup';
import { Separator } from '@/components/ui/separator';

export default function BackupPage() {
  const { toast } = useToast();
  const router = useRouter();

  // State for manual backup/restore
  const [file, setFile] = useState<File | null>(null);
  const [isRestoringZip, setIsRestoringZip] = useState(false);

  // State for restore points
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
        const result = await createRestorePoint();
        if (result.success && result.point) {
            toast({ title: "¡Punto de Restauración Creado!", description: `Se ha creado el punto de restauración: ${result.point.displayDate}` });
            await loadRestorePoints(); // Refresh list
        } else {
            throw new Error(result.error || "No se pudo crear el punto de restauración.");
        }
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
            toast({ title: "¡Restauración Completa!", description: "Los datos han sido restaurados desde el punto seleccionado. La aplicación se recargará." });
            setTimeout(() => window.location.reload(), 2000);
        } else {
            throw new Error(result.error || "Falló la restauración.");
        }
    } catch (error: any) {
        toast({ title: "Error en la Restauración", description: error.message, variant: "destructive" });
    } finally {
        setProcessingPointName(null);
    }
  };

  const handleDeleteRestorePoint = async (pointName: string) => {
    setProcessingPointName(pointName);
     try {
        const result = await deleteRestorePoint(pointName);
        if (result.success) {
            toast({ title: "Punto de Restauración Eliminado", variant: "destructive" });
            await loadRestorePoints();
        } else {
            throw new Error(result.error || "No se pudo eliminar el punto de restauración.");
        }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setProcessingPointName(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/zip') {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({ title: "Archivo incorrecto", description: "Por favor, selecciona un archivo .zip.", variant: "destructive" });
      setFile(null);
      event.target.value = ''; // Reset file input
    }
  };
  
  const handleRestoreZipSubmit = async () => {
    if (!file) {
      toast({ title: "No hay archivo seleccionado", variant: "destructive" });
      return;
    }
    setIsRestoringZip(true);
    const formData = new FormData();
    formData.append('backupFile', file);
    try {
      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error en el servidor');
      toast({ title: "¡Restauración Exitosa!", description: "Los datos han sido restaurados. La aplicación se recargará." });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast({ title: "Error en la Restauración", description: error.message, variant: "destructive" });
    } finally {
      setIsRestoringZip(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Backup y Restauración
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><History className="w-6 h-6 text-primary"/>Puntos de Restauración Internos</CardTitle>
          <CardDescription>Crea y gestiona copias de seguridad directamente en el servidor. Útil para revertir cambios recientes rápidamente.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleCreateRestorePoint} disabled={isCreatingPoint} className="w-full sm:w-auto">
                {isCreatingPoint ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <PlusCircle className="w-5 h-5 mr-2"/>}
                {isCreatingPoint ? "Creando..." : "Crear Nuevo Punto de Restauración"}
            </Button>
            <Separator className="my-4"/>
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Puntos Guardados:</h4>
                {isLoadingPoints ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div> : 
                 restorePoints.length > 0 ? (
                    restorePoints.map(point => (
                        <Card key={point.name} className="p-3 flex justify-between items-center bg-muted/30">
                            <div>
                                <p className="font-semibold text-sm">{point.displayDate}</p>
                                <p className="text-xs text-muted-foreground">{point.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={!!processingPointName}><RotateCw className="w-4 h-4 mr-1.5"/>Restaurar</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>¿Restaurar desde este punto?</AlertDialogTitle><AlertDialogDescription>Se sobreescribirán todos los datos actuales con los del punto de restauración de <span className="font-bold">{point.displayDate}</span>. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRestoreFromPoint(point.name)}>Sí, Restaurar</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-9 w-9" disabled={!!processingPointName}><Trash2 className="w-4 h-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar este punto?</AlertDialogTitle><AlertDialogDescription>El punto de restauración de <span className="font-bold">{point.displayDate}</span> será eliminado permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRestorePoint(point.name)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>
                    ))
                 ) : <p className="text-sm text-center text-muted-foreground py-3">No hay puntos de restauración guardados.</p>}
            </div>
        </CardContent>
      </Card>
      

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Backup Manual (Descarga/Subida ZIP)</CardTitle>
          <CardDescription>
            Genera un archivo ZIP con todos los datos para guardarlo externamente (ej: en tu computadora, Google Drive).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ideal para tener un respaldo completo y seguro fuera del servidor.
          </p>
          <a href="/api/backup/download" download>
            <Button className="w-full sm:w-auto">
              <HardDriveDownload className="w-5 h-5 mr-2" />
              Descargar Backup ZIP Ahora
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><UploadCloud className="w-6 h-6 text-destructive"/>Restaurar desde archivo ZIP</CardTitle>
           <CardDescription className="text-destructive/90">
            <AlertTriangle className="inline-block w-4 h-4 mr-1" />
            ¡Acción peligrosa! Esto reemplazará TODOS los datos actuales con el contenido del archivo de respaldo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
           <div className="space-y-2">
            <Label htmlFor="backup-file-upload">Seleccionar archivo de respaldo (.zip)</Label>
            <Input id="backup-file-upload" type="file" accept=".zip" onChange={handleFileChange} disabled={isRestoringZip} />
           </div>
           {file && <p className="text-sm text-muted-foreground">Archivo seleccionado: <span className="font-medium">{file.name}</span></p>}
        </CardContent>
         <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!file || isRestoringZip} className="w-full sm:w-auto">
                  {isRestoringZip ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <UploadCloud className="w-5 h-5 mr-2" />}
                  {isRestoringZip ? "Restaurando..." : "Restaurar Backup"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es irreversible. Se borrarán todos los datos actuales y se reemplazarán con los datos del archivo <span className="font-bold">{file?.name}</span>. ¿Deseas continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isRestoringZip}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreZipSubmit} disabled={isRestoringZip} className="bg-destructive hover:bg-destructive/90">
                    {isRestoringZip ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Sí, restaurar y sobreescribir todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

    