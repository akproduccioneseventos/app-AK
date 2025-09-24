'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Camera, Download, Loader2, AlertTriangle, Music2, Type, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { getFiestaActual, updateVideoVidaSettingsFiestaActual as updateVideoVidaSettings } from '@/app/actions/fiesta-actual';
import { getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';
import { Separator } from '@/components/ui/separator';

const PHOTO_SLOT_COUNT = 50;

export default function VideoVidaAdminPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [videoVidaData, setVideoVidaData] = useState<VideoVidaData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setVideoVidaData(fiestaData.videoVida || { galleryEnabled: true, photosUploaded: false });
      const photoUrls = await getLifeStoryVideoPhotos(fiestaData.id);
      setPhotos(photoUrls);
    } catch (err: any) {
      setError("No se pudieron cargar los datos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSettingsChange = (field: keyof VideoVidaData, value: any) => {
    setVideoVidaData(prev => prev ? ({...prev, [field]: value}) : null);
  };
  
  const handleSaveSettings = async () => {
    if (!videoVidaData) return;
    setIsSaving(true);
    const result = await updateVideoVidaSettings(videoVidaData);
    if(result.success) {
      toast({title: "Configuración Guardada"});
    } else {
      toast({title: "Error", description: result.error, variant: "destructive"});
    }
    setIsSaving(false);
  }
  
  const getPublicLink = () => {
    if (typeof window !== 'undefined' && fiesta) {
      return `${window.location.origin}/video-vida/${fiesta.id}`;
    }
    return '';
  };
  
  const handleCopyLink = () => {
      navigator.clipboard.writeText(getPublicLink());
      toast({title: "Enlace Copiado", description: "El enlace de carga se ha copiado al portapapeles."});
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }
  if (!fiesta) return null;

  const photoSlotsForAdmin = Array.from({ length: PHOTO_SLOT_COUNT }).map((_, index) => {
      const photoNumber = index + 1;
      const matchingPhoto = photos.find(url => {
          const filename = url.split('/').pop()?.split('.')[0];
          return parseInt(filename || '0', 10) === photoNumber;
      });
      return {
        number: photoNumber,
        imageUrl: matchingPhoto || null,
      };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Video de Vida</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración y Galería</CardTitle>
          <CardDescription>Gestiona las fotos y las opciones para el video de vida que el cliente subirá.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                <div className="space-y-1">
                    <Label htmlFor="gallery-enabled" className="text-base font-medium">Habilitar página de carga de fotos</Label>
                    <p className="text-sm text-muted-foreground">Permite que el cliente acceda al enlace para subir sus fotos.</p>
                </div>
                <Switch id="gallery-enabled" checked={videoVidaData?.galleryEnabled} onCheckedChange={(val) => handleSettingsChange('galleryEnabled', val)} disabled={isSaving}/>
            </div>

            {videoVidaData?.galleryEnabled && (
                <div className="space-y-2">
                    <Label>Enlace para el Cliente</Label>
                    <div className="flex gap-2">
                        <Input value={getPublicLink()} readOnly />
                        <Button type="button" onClick={handleCopyLink}>Copiar Enlace</Button>
                    </div>
                </div>
            )}
            <Separator/>
            <div className="space-y-2">
                <Label htmlFor="song-suggestion" className="flex items-center gap-2"><Music2 className="w-4 h-4 text-primary"/>Canción Sugerida</Label>
                <Input id="song-suggestion" value={videoVidaData?.songSuggestion || ''} onChange={e => handleSettingsChange('songSuggestion', e.target.value)} placeholder="Ej: 'Viva la Vida' - Coldplay" disabled={isSaving}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="custom-text" className="flex items-center gap-2"><Type className="w-4 h-4 text-primary"/>Texto Personalizado para el Cliente</Label>
                <Textarea id="custom-text" value={videoVidaData?.customText || ''} onChange={e => handleSettingsChange('customText', e.target.value)} placeholder="Ej: 'Sube una foto por cada año, desde el nacimiento hasta hoy.'" rows={2} disabled={isSaving}/>
            </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                Guardar Configuración
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Galería de Fotos Subidas ({photos.length} de {PHOTO_SLOT_COUNT})</CardTitle>
          <CardDescription>Aquí verás las fotos que el cliente ha subido, en su orden correcto.</CardDescription>
        </CardHeader>
        <CardContent>
           {photos.length > 0 ? (
            <>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {photoSlotsForAdmin.map(slot => (
                    <div key={slot.number} className="aspect-square relative rounded-md bg-muted overflow-hidden border">
                         {slot.imageUrl ? (
                             <NextImage src={slot.imageUrl} alt={`Foto ${slot.number}`} layout="fill" objectFit="cover" data-ai-hint="life story photo"/>
                         ) : (
                             <div className="flex items-center justify-center h-full text-xs text-muted-foreground">{String(slot.number).padStart(2, '0')}</div>
                         )}
                         {slot.imageUrl && <CheckCircle className="absolute bottom-0.5 right-0.5 w-4 h-4 text-green-400 bg-white rounded-full"/>}
                         <div className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md rounded-tl-sm">{String(slot.number).padStart(2, '0')}</div>
                    </div>
                ))}
              </div>
               <Button asChild className="mt-4">
                 <a href={`/api/video-vida-photos/${fiesta.id}/download`}>
                   <Download className="w-4 h-4 mr-2"/> Descargar Todas (.zip)
                 </a>
               </Button>
            </>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
                <p>El cliente aún no ha subido las fotos.</p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
