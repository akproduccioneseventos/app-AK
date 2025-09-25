'use client';

import React, { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Loader2, AlertTriangle, Upload, CheckCircle, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { saveLifeStoryVideoPhoto, getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';
import NextImage from 'next/image';

const PHOTO_SLOT_COUNT = 50;

interface PhotoSlot {
  number: number;
  imageUrl: string | null;
  uploading: boolean;
}

export default function VideoVidaClientPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      // SECURITY CHECK: This is a minimal check. In a real app, a more robust auth system is needed.
      if (fiestaData.id !== params.fiestaId) throw new Error("Acceso no válido para este evento.");
      if (!fiestaData.videoVida?.galleryEnabled) throw new Error("La carga de fotos no está habilitada para este evento.");
      
      setFiesta(fiestaData);
      const photoUrls = await getLifeStoryVideoPhotos(fiestaData.id);
      
      const slots: PhotoSlot[] = Array.from({ length: PHOTO_SLOT_COUNT }).map((_, index) => {
        const photoNumber = index + 1;
        // Find the photo URL that corresponds to the current slot number.
        // This assumes filenames are like "01.jpg", "02.png", etc.
        const matchingPhoto = photoUrls.find(url => {
            const filename = url.split('/').pop()?.split('.')[0];
            return parseInt(filename || '0', 10) === photoNumber;
        });
        return {
          number: photoNumber,
          imageUrl: matchingPhoto || null,
          uploading: false,
        };
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
  
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>, slotNumber: number) => {
    const file = e.target.files?.[0];
    if (!file || !fiesta) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({title: "Archivo muy grande", description: "El tamaño máximo por foto es 5MB.", variant: "destructive"});
        return;
    }
    
    setPhotoSlots(prev => prev.map(s => s.number === slotNumber ? {...s, uploading: true} : s));

    const formData = new FormData();
    formData.append('fiestaId', fiesta.id);
    formData.append('file', file);
    formData.append('photoNumber', String(slotNumber));

    try {
        const result = await saveLifeStoryVideoPhoto(formData);
        if(result.success && result.url) {
            setPhotoSlots(prev => prev.map(s => s.number === slotNumber ? {...s, imageUrl: result.url, uploading: false} : s));
            toast({title: "¡Foto Subida!", description: `La foto para la posición ${slotNumber} se ha guardado.`});
        } else {
             throw new Error(result.error || "No se pudo guardar la foto.");
        }
    } catch(err: any) {
        toast({title: "Error al subir", description: err.message, variant: "destructive"});
        setPhotoSlots(prev => prev.map(s => s.number === slotNumber ? {...s, uploading: false} : s));
    }
  };
  
  const triggerFileInput = (slotNumber: number) => {
      fileInputRefs.current[slotNumber - 1]?.click();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }
  
  if (error) {
    return <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error de Acceso</h1>
        <p className="text-muted-foreground mt-2">{error}</p>
    </div>;
  }

  if (!fiesta) return null;

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
                    <CardTitle>Galería de Fotos</CardTitle>
                    <CardDescription>Sube una foto en cada recuadro. Idealmente en orden cronológico para contar tu historia. Se necesitan {PHOTO_SLOT_COUNT} fotos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {photoSlots.map(slot => (
                            <div 
                                key={slot.number} 
                                className="aspect-square relative rounded-md bg-muted overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => triggerFileInput(slot.number)}
                            >
                                <Input 
                                    ref={el => fileInputRefs.current[slot.number - 1] = el}
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileSelect(e, slot.number)} 
                                    className="hidden"
                                />
                                {slot.imageUrl ? (
                                    <>
                                        <NextImage src={slot.imageUrl} alt={`Foto ${slot.number}`} layout="fill" objectFit="cover" data-ai-hint="life story photo"/>
                                        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-white"/>
                                        </div>
                                    </>
                                ) : (
                                     <div className="text-center text-muted-foreground">
                                        <Upload className="w-6 h-6 mx-auto"/>
                                    </div>
                                )}
                                {slot.uploading && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin"/>
                                    </div>
                                )}
                                 <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-sm">{String(slot.number).padStart(2, '0')}</div>
                                 {slot.imageUrl && <CheckCircle className="absolute bottom-0.5 right-0.5 w-4 h-4 text-green-400 bg-white rounded-full"/>}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
