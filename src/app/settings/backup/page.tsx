'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HardDriveDownload, History, UploadCloud, Info } from 'lucide-react';
import Link from 'next/link';

export default function BackupPage() {
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
      </Card>

      <Card className="shadow-lg border-orange-500/50 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><UploadCloud className="w-6 h-6 text-orange-600"/>Restaurar desde un Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
           <p>
            La funcionalidad para restaurar un backup directamente desde un archivo ZIP estará disponible en futuras actualizaciones.
          </p>
          <p className="text-xs">
            Por ahora, si necesitas restaurar un respaldo, deberás hacerlo manualmente reemplazando el contenido de la carpeta `src/data` con los archivos de tu backup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
