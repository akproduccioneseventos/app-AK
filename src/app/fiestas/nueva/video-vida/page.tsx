
'use client';

import React, { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Camera, Download, Loader2, AlertTriangle, Music2, Type, CheckCircle, Link as LinkIcon, Save, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { getFiestaActual, updateVideoVidaSettingsFiestaActual as updateVideoVidaSettings } from '@/app/actions/fiesta-actual';
import { getLifeStoryVideoPhotos, saveLifeStoryVideoPhoto, deleteAllVideoVidaPhotos } from '@/app/actions/fiesta/video-vida.actions';
import { Separator } from '@/components/ui/separator';
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

interface PhotoSlot {
  number: number;
  imageUrl: string | null;
}

const PhotoUploadSlot: React.FC<{
  slot: PhotoSlot;
  fiestaId: string;
  onUploadComplete: (slotNumber: number, url: string) => void;
}> = ({ slot, fiestaId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const inputId = `upload-${slot.number}`;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: "Archivo muy grande", description: "El tamaño máximo por foto es 5MB.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', file);
    formData.append('photoNumber', String(slot.number));

    try {
      const result = await saveLifeStoryVideoPhoto(formData);
      if (result.success && result.url) {
        onUploadComplete(slot.number, result.url);
        toast({ title: "¡Foto Subida!", description: `La foto ${slot.number} se ha guardado.` });
      } else {
        throw new Error(result.error || "No se pudo guardar la foto.");
      }
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
        setIsUploading(false);
        // Reset file input to allow re-uploading the same file
        if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="aspect-square relative rounded-md bg-muted overflow-hidden border-2 border-dashed hover:border-primary transition-colors group">
      <Label htmlFor={inputId} className="w-full h-full cursor-pointer flex flex-col items-center justify-center text-center text-muted-foreground p-1">
        {slot.imageUrl && !isUploading ? (
            <NextImage src={slot.imageUrl} alt={`Foto ${slot.number}`} layout="fill" objectFit="cover" />
        ) : (
          !isUploading && (
            <div className="flex flex-col items-center">
              <Camera className="w-5 h-5 mb-1 text-gray-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">Subir foto</span>
            </div>
          )
        )}
      </Label>
      <Input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      {isUploading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
       <div className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md rounded-tl-sm">{String(slot.number).padStart(2, '0')}</div>
       {slot.imageUrl && !isUploading && <CheckCircle className="absolute bottom-0.5 right-0.5 w-4 h-4 text-green-400 bg-white rounded-full"/>}
    </div>
  );
};


export default function VideoVidaAdminPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [videoVidaData, setVideoVidaData] = useState<VideoVidaData | null>(null);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      const currentVideoVidaData = fiestaData.videoVida || { galleryEnabled: true, photosUploaded: false, photoCount: 50 };
      setVideoVidaData(currentVideoVidaData);
      
      const photoUrls = await getLifeStoryVideoPhotos(fiestaData.id);
      
      const slotCount = currentVideoVidaData.photoCount || 50;
      const slots: PhotoSlot[] = Array.from({ length: slotCount }).map((_, index) => {
        const photoNumber = index + 1;
        const matchingPhoto = photoUrls.find(url => {
            const filename = url.split('/').pop()?.split('.')[0];
            return parseInt(filename || '0', 10) === photoNumber;
        });
        return { number: photoNumber, imageUrl: matchingPhoto || null };
      });
      setPhotoSlots(slots);

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
    let finalValue = value;
    if (field === 'photoCount') {
        const num = Number(value);
        finalValue = isNaN(num) || num < 1 ? 1 : num;
    }
    setVideoVidaData(prev => prev ? ({...prev, [field]: finalValue}) : null);
  };
  
  const handleSaveSettings = async () => {
    if (!videoVidaData) return;
    setIsSaving(true);
    const result = await updateVideoVidaSettings(videoVidaData);
    if(result.success) {
      toast({title: "Configuración Guardada"});
      await loadData(); // Reload to reflect changes like photoCount
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

  const handleDownloadAll = async () => {
    if (!fiesta) return;
    setIsDownloading(true);
    toast({ title: "Preparando descarga...", description: "Comprimiendo fotos..." });
    try {
      const response = await fetch(`/api/video-vida-photos/${fiesta.id}/download`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'No se pudo generar el archivo ZIP.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-de-vida-${fiesta.id}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Descarga Iniciada" });
    } catch (error: any) {
      toast({ title: "Error en la Descarga", description: error.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUploadComplete = (slotNumber: number, url: string) => {
    setPhotoSlots(prev => prev.map(s => s.number === slotNumber ? {...s, imageUrl: url} : s));
  };

  const handleDeleteAll = async () => {
    if (!fiesta) return;
    setIsDeleting(true);
    try {
      const result = await deleteAllVideoVidaPhotos(fiesta.id);
      if (result.success) {
        toast({ title: "Fotos Eliminadas", description: "Todas las fotos han sido borradas del servidor.", variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error || 'No se pudieron eliminar las fotos.');
      }
    } catch (error: any) {
      toast({ title: "Error al Borrar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }
  if (!fiesta || !videoVidaData) return null;
  
  const photosUploadedCount = photoSlots.filter(s => s.imageUrl).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Video de Vida</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
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
                        <Button type="button" onClick={handleCopyLink}><LinkIcon className="w-4 h-4 mr-2"/>Copiar Enlace</Button>
                    </div>
                </div>
            )}
            <Separator/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="photo-count" className="flex items-center gap-2">Cantidad de Fotos a Solicitar</Label>
                    <Input id="photo-count" type="number" value={videoVidaData.photoCount || 50} onChange={e => handleSettingsChange('photoCount', e.target.value)} min="1" max="200" disabled={isSaving}/>
                    <p className="text-xs text-muted-foreground">Cambia este número para agregar o quitar cuadros de la galería.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="song-suggestion" className="flex items-center gap-2"><Music2 className="w-4 h-4 text-primary"/>Canción Sugerida</Label>
                    <Input id="song-suggestion" value={videoVidaData.songSuggestion || ''} onChange={e => handleSettingsChange('songSuggestion', e.target.value)} placeholder="Ej: 'Viva la Vida' - Coldplay" disabled={isSaving}/>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="custom-text" className="flex items-center gap-2"><Type className="w-4 h-4 text-primary"/>Texto Personalizado para el Cliente</Label>
                <Textarea id="custom-text" value={videoVidaData.customText || ''} onChange={e => handleSettingsChange('customText', e.target.value)} placeholder="Ej: 'Sube una foto por cada año, desde el nacimiento hasta hoy.'" rows={2} disabled={isSaving}/>
            </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                Guardar Configuración
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Galería de Fotos Subidas ({photosUploadedCount} de {videoVidaData.photoCount || 50})</CardTitle>
          <CardDescription>Aquí verás las fotos que el cliente ha subido, en su orden correcto.</CardDescription>
        </CardHeader>
        <CardContent>
           {photoSlots.length > 0 ? (
            <>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {photoSlots.map(slot => (
                    <PhotoUploadSlot
                        key={slot.number}
                        slot={slot}
                        fiestaId={fiesta.id}
                        onUploadComplete={handleUploadComplete}
                    />
                ))}
              </div>
               <div className="flex flex-wrap gap-2 mt-4">
                 <Button onClick={handleDownloadAll} disabled={isDownloading || photosUploadedCount === 0}>
                   {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                   Descargar Todas (.zip)
                 </Button>
                 {photosUploadedCount > 0 && (
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <Button variant="destructive" disabled={isDeleting}>
                         {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2"/>}
                         Borrar Todas las Fotos
                       </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                       <AlertDialogHeader>
                         <AlertDialogTitle>¿Borrar todas las fotos?</AlertDialogTitle>
                         <AlertDialogDescription>
                           Se eliminarán permanentemente las {photosUploadedCount} fotos subidas para este evento. Esta acción no se puede deshacer. Asegurate de haber descargado el ZIP antes de continuar.
                         </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Cancelar</AlertDialogCancel>
                         <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">Sí, borrar todo</AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
                 )}
               </div>
               {photosUploadedCount > 0 && (
                 <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                   <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600"/>
                   <p>
                     <strong>Recordatorio:</strong> Descargá el ZIP y guardalo en tu Google Drive personal antes de borrar las fotos del servidor.
                   </p>
                 </div>
               )}
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
