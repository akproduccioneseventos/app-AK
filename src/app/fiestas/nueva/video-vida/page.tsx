'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, AlertTriangle, Link as LinkIcon, ClipboardCopy, Image, Download, Camera, Music2, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { getFiestaActual, updateVideoVidaSettings } from '@/app/actions/fiesta-actual';
import { getLifeStoryVideoPhotos } from '@/app/actions/video-vida';
import NextImage from 'next/image';

export default function VideoVidaAdminPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [videoVidaSettings, setVideoVidaSettings] = useState<VideoVidaData | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const uniqueLink = typeof window !== 'undefined' && fiesta ? `${window.location.origin}/video-vida/${fiesta.id}` : '';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setVideoVidaSettings(fiestaData.videoVida || { galleryEnabled: false, photosUploaded: false });
      
      if (fiestaData.videoVida?.photosUploaded) {
        const photos = await getLifeStoryVideoPhotos(fiestaData.id);
        setUploadedPhotos(photos);
      }
    } catch (err) {
      toast({ title: "Error al cargar datos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleToggleGallery = async (enabled: boolean) => {
    if (!videoVidaSettings) return;
    setIsSaving(true);
    const newSettings = { ...videoVidaSettings, galleryEnabled: enabled };
    setVideoVidaSettings(newSettings);
    
    const result = await updateVideoVidaSettings(newSettings);
    if(result.success) {
        toast({title: "Configuración guardada"});
    } else {
        toast({title: "Error al guardar", variant: "destructive"});
        setVideoVidaSettings(videoVidaSettings); // Revert UI on failure
    }
    setIsSaving(false);
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(uniqueLink);
    toast({ title: "Enlace Copiado", description: "El enlace único se ha copiado al portapapeles." });
  };
  
  const handleDownloadAll = async () => {
    if (!fiesta || uploadedPhotos.length === 0) return;
    setIsDownloading(true);
    toast({ title: "Iniciando descarga...", description: `Se descargarán ${uploadedPhotos.length} fotos. Por favor, permite las descargas múltiples si tu navegador lo solicita.`});
    try {
      for (const photoName of uploadedPhotos) {
        const response = await fetch(`/api/video-vida-photos/${fiesta.id}/${photoName}`);
        if (!response.ok) {
          throw new Error(`No se pudo descargar ${photoName}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = photoName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        // Pequeña pausa para no sobrecargar el navegador
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      toast({ title: "¡Descarga Completa!", description: "Todas las fotos han sido descargadas."});
    } catch (error: any) {
        toast({ title: "Error en la Descarga", description: error.message || "Ocurrió un error al descargar las fotos.", variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (!fiesta || !videoVidaSettings) {
      return <div className="text-center p-6"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />No se encontraron datos de la fiesta actual.</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Carga de Fotos para Video de Vida</h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configuración de la Galería</CardTitle>
          <CardDescription>Activa el enlace para que tu cliente pueda subir las fotos y compártelo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="gallery-enabled" className="text-base font-medium">Activar enlace de carga para el cliente</Label>
                <Switch id="gallery-enabled" checked={videoVidaSettings.galleryEnabled} onCheckedChange={handleToggleGallery} disabled={isSaving}/>
            </div>
             {videoVidaSettings.galleryEnabled && (
                <div className="space-y-2">
                    <Label htmlFor="unique-link">Enlace único para el cliente</Label>
                    <div className="flex gap-2">
                        <Input id="unique-link" value={uniqueLink} readOnly />
                        <Button type="button" onClick={handleCopyToClipboard}><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar</Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Fotos Subidas</CardTitle>
          <CardDescription>
            {videoVidaSettings.photosUploaded 
             ? `Se subieron ${uploadedPhotos.length} fotos el ${videoVidaSettings.uploadDate ? new Date(videoVidaSettings.uploadDate).toLocaleDateString() : 'N/A'}.`
             : "El cliente aún no ha subido las fotos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {uploadedPhotos.map((photoName, index) => (
                <div key={index} className="aspect-square relative rounded-md overflow-hidden border bg-muted group">
                  <NextImage 
                    src={`/api/video-vida-photos/${fiesta.id}/${photoName}`}
                    alt={`Foto ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground"><Image className="w-12 h-12 mx-auto mb-2 opacity-50"/>Esperando fotos del cliente...</div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
            <Button onClick={handleDownloadAll} disabled={isDownloading || uploadedPhotos.length === 0}>
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                {isDownloading ? "Descargando..." : "Descargar Todas las Fotos"}
            </Button>
        </CardFooter>
      </Card>
      
      {videoVidaSettings.photosUploaded && (
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Información Adicional del Cliente</CardTitle>
                  <CardDescription>Sugerencias del cliente para la edición del video.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                  <div>
                      <h4 className="font-semibold flex items-center gap-2"><Music2 className="w-4 h-4 text-primary"/>Canción Sugerida:</h4>
                      <p className="text-muted-foreground pl-6">{videoVidaSettings.songSuggestion || 'No se sugirió una canción.'}</p>
                  </div>
                   <div>
                      <h4 className="font-semibold flex items-center gap-2"><Type className="w-4 h-4 text-primary"/>Texto para el Video:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap pl-6">{videoVidaSettings.customText || 'No se añadió texto personalizado.'}</p>
                  </div>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
