'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, HardDriveDownload, History, UploadCloud, Info, AlertTriangle, Loader2 } from 'lucide-react';
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


export default function BackupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/zip') {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: "Archivo incorrecto",
        description: "Por favor, selecciona un archivo .zip.",
        variant: "destructive",
      });
      setFile(null);
      event.target.value = ''; // Reset file input
    }
  };
  
  const handleRestoreSubmit = async () => {
    if (!file) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor, selecciona un archivo de backup para restaurar.",
        variant: "destructive",
      });
      return;
    }
    setIsRestoring(true);
    const formData = new FormData();
    formData.append('backupFile', file);
    try {
      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el servidor');
      }

      toast({
        title: "¡Restauración Exitosa!",
        description: "Los datos han sido restaurados. La aplicación se recargará.",
      });

      // Reload the page to reflect the new data state across the app
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      toast({
        title: "Error en la Restauración",
        description: error.message || "Ocurrió un problema al restaurar el backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <CardTitle className="font-headline text-xl">Crear un Respaldo Completo</CardTitle>
          <CardDescription>
            Genera un archivo ZIP con todos los datos de tu aplicación (clientes, facturas, presupuestos, configuración de eventos, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Guarda este archivo en un lugar seguro, como tu computadora o un servicio en la nube (Google Drive, Dropbox) para tener un respaldo de toda tu información.
          </p>
          <a href="/api/backup/download" download>
            <Button className="w-full sm:w-auto">
              <HardDriveDownload className="w-5 h-5 mr-2" />
              Descargar Backup Ahora
            </Button>
          </a>
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
          <Info className="w-4 h-4 mr-2 shrink-0"/> 
          Se recomienda descargar un respaldo manualmente después de realizar cambios importantes. La descarga automática después de cada cambio no es práctica, pero esta opción está siempre disponible.
        </CardFooter>
      </Card>

      <Card className="shadow-lg border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><UploadCloud className="w-6 h-6 text-destructive"/>Restaurar desde un Backup</CardTitle>
           <CardDescription className="text-destructive/90">
            <AlertTriangle className="inline-block w-4 h-4 mr-1" />
            ¡Acción peligrosa! Esto reemplazará TODOS los datos actuales con el contenido del archivo de respaldo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
           <div className="space-y-2">
            <Label htmlFor="backup-file-upload">Seleccionar archivo de respaldo (.zip)</Label>
            <Input id="backup-file-upload" type="file" accept=".zip" onChange={handleFileChange} disabled={isRestoring} />
           </div>
           {file && <p className="text-sm text-muted-foreground">Archivo seleccionado: <span className="font-medium">{file.name}</span></p>}
        </CardContent>
         <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!file || isRestoring} className="w-full sm:w-auto">
                  {isRestoring ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <UploadCloud className="w-5 h-5 mr-2" />}
                  {isRestoring ? "Restaurando..." : "Restaurar Backup"}
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
                  <AlertDialogCancel disabled={isRestoring}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreSubmit} disabled={isRestoring} className="bg-destructive hover:bg-destructive/90">
                    {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
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
