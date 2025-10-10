
'use client';

import React, { useState, useEffect, useCallback, useRef, type ChangeEvent, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, AlertTriangle, Upload, CheckCircle, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { saveLifeStoryVideoPhoto, getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';
import NextImage from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhotoSlot {
  number: number;
  imageUrl: string | null;
}

// --- Componente Atómico para cada Slot de Foto (Definido AFUERA del componente principal) ---
const PhotoUploadSlot: React.FC<{
  slot: PhotoSlot;
  fiestaId: string;
  onUploadComplete: (slotNumber: number, url: string | null) => void;
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
      onUploadComplete(slot.number, null);
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
        ) : !isUploading && (
          <div className="flex flex-col items-center">
            <Upload className="w-5 h-5 mb-1 text-gray-400 group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium">Subir foto</span>
          </div>
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


// --- Componente Principal que se renderiza solo en el cliente ---
function VideoVidaClientPageContent({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.id !== params.fiestaId) throw new Error("Acceso no válido para este evento.");
      if (!fiestaData.videoVida?.galleryEnabled) throw new Error("La carga de fotos no está habilitada para este evento.");

      setFiesta(fiestaData);
      const photoUrls = await getLifeStoryVideoPhotos(fiestaData.id);
      
      const slotCount = fiestaData.videoVida?.photoCount || 50;
      
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
      setError(err.message || "No se pudo cargar la página.");
    } finally {
      setIsLoading(false);
    }
  }, [params.fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleUploadComplete = useCallback((slotNumber: number, url: string | null) => {
    setPhotoSlots(prev => prev.map(s => {
        if (s.number === slotNumber && url) {
            // Re-create a new URL object to ensure React re-renders the image
            return { ...s, imageUrl: `${url}?t=${new Date().getTime()}` };
        }
        return s;
    }));
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }
  
  if (error || !fiesta) {
    return <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error de Acceso</h1>
        <p className="text-muted-foreground mt-2">{error || "No se encontró la información del evento."}</p>
    </div>;
  }
  
  const photoCount = fiesta.videoVida?.photoCount || 50;
  const photosUploadedCount = photoSlots.filter(s => s.imageUrl).length;

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
            <header className="mb-8 text-center">
                <PartyPopper className="w-12 h-12 mx-auto text-primary mb-3"/>
                <h1 className="text-4xl font-bold tracking-tight font-headline">{fiesta.configuracion.nombreEvento}</h1>
                <p className="text-lg text-muted-foreground mt-1">Carga de Fotos para el Video de Vida</p>
                {fiesta.videoVida?.customText && <p className="mt-4 text-accent-foreground bg-accent/20 p-3 rounded-md max-w-2xl mx-auto">{fiesta.videoVida.customText}</p>}
                {fiesta.videoVida?.songSuggestion && <p className="mt-2 text-sm text-muted-foreground">Canción elegida: <strong>{fiesta.videoVida.songSuggestion}</strong></p>}
            </header>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Tu Galería ({photosUploadedCount} de {photoCount})</CardTitle>
                    <CardDescription>Sube una foto en cada recuadro. Idealmente en orden cronológico para contar tu historia. Se necesitan {photoCount} fotos.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    </div>
  );
}


// --- Página principal que se asegura de renderizar el contenido solo en el cliente ---
export default function VideoVidaPage({ params }: { params: { fiestaId: string } }) {
    const [isClient, setIsClient] = useState(false);
    const unwrappedParams = use(params);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Renderiza el contenido solo cuando isClient es true
    return isClient ? <VideoVidaClientPageContent params={unwrappedParams} /> : <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
}
