'use client';

import React, { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpFromLine, Camera, CheckCircle, Image as ImageIcon, Info, Loader2, Trash2, Music2, Type, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { saveLifeStoryVideoPhotos } from '@/app/actions/video-vida';
import NextImage from 'next/image';
import { Textarea } from '@/components/ui/textarea';

const MAX_PHOTOS = 50;
const MAX_FILE_SIZE_MB = 5;

interface PhotoSlotProps {
  index: number;
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
}

function PhotoSlot({ index, file, onFileChange, onRemove, isSubmitting }: PhotoSlotProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (file) {
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  return (
    <div className="relative aspect-square rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 group">
      <div className="absolute top-1 left-1 z-10 bg-black/60 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full pointer-events-none">
        {index + 1}
      </div>
      {previewUrl && file ? (
        <>
          <NextImage src={previewUrl} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(index)}
              aria-label="Eliminar imagen"
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <Label htmlFor={`photo-upload-${index}`} className="cursor-pointer text-center text-muted-foreground p-2 flex flex-col items-center justify-center h-full w-full">
          <PlusCircle className="w-6 h-6 mx-auto mb-1 text-gray-400" />
          <span className="text-xs">Añadir Foto</span>
          <Input 
            id={`photo-upload-${index}`} 
            type="file" 
            accept="image/jpeg, image/png" 
            onChange={(e) => onFileChange(e, index)} 
            className="hidden" 
            disabled={isSubmitting}
          />
        </Label>
      )}
    </div>
  );
}


export default function PhotoUploadPage({ params: paramsProp }: { params: Promise<{ fiestaId: string }> }) {
  const params = React.use(paramsProp);
  const { toast } = useToast();
  const [photos, setPhotos] = useState<(File | null)[]>(Array(MAX_PHOTOS).fill(null));
  const [songSuggestion, setSongSuggestion] = useState('');
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: "Formato inválido", description: `El archivo ${file.name} no es JPG o PNG.`, variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: `El archivo ${file.name} supera los ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
      return;
    }

    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos[index] = file;
      return newPhotos;
    });

    event.target.value = '';
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[indexToRemove] = null;
      return newPhotos;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const filesToUpload = photos.filter(p => p !== null) as File[];

    if (filesToUpload.length === 0) {
      toast({ title: "No hay fotos", description: "Por favor, sube al menos una foto.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fiestaId', params.fiestaId);
    
    // Append files in order of the array, ensuring correct naming on the backend
    photos.forEach(file => {
      // The backend will process the array sequentially. We send empty placeholders for nulls
      // to maintain order, or simply filter and rely on array order. Let's filter.
      if (file) {
          formData.append('photos', file);
      }
    });

    formData.append('songSuggestion', songSuggestion);
    formData.append('customText', customText);

    const result = await saveLifeStoryVideoPhotos(formData);

    if (result.success) {
      toast({ title: "¡Galería Enviada!", description: "Tus fotos se han enviado correctamente. ¡Gracias!" });
      setIsSubmitted(true);
    } else {
      toast({ title: "Error al Enviar", description: result.error || "No se pudieron enviar las fotos.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  if (isSubmitted) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-green-50">
              <Card className="w-full max-w-lg text-center shadow-2xl p-8">
                  <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4"/>
                  <CardTitle className="text-3xl font-bold font-headline text-green-700">¡Gracias!</CardTitle>
                  <CardDescription className="text-lg mt-2 text-muted-foreground">Tus fotos han sido enviadas con éxito al organizador.</CardDescription>
              </Card>
          </div>
      )
  }

  const uploadedCount = photos.filter(p => p !== null).length;

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-6 md:p-8">
      <Card className="max-w-6xl mx-auto shadow-xl">
        <CardHeader className="text-center">
            <Camera className="w-12 h-12 mx-auto text-primary mb-3"/>
            <CardTitle className="text-4xl font-bold font-headline">Carga de Fotos para Video</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Sube y ordena las fotos para tu video de vida.</CardDescription>
             <p className="text-sm text-muted-foreground pt-2">Sube una foto para cada posición. El orden en la cuadrícula será el orden final en el video.</p>
        </CardHeader>
        <CardContent>
           <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="song-suggestion" className="flex items-center gap-2 font-semibold"><Music2 className="w-5 h-5 text-primary"/>Canción Sugerida (Opcional)</Label>
              <Input
                id="song-suggestion"
                placeholder="Nombre de la canción y artista, o enlace de YouTube/Spotify"
                value={songSuggestion}
                onChange={(e) => setSongSuggestion(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-text" className="flex items-center gap-2 font-semibold"><Type className="w-5 h-5 text-primary"/>Frase o Texto para el Video (Opcional)</Label>
              <Textarea
                id="custom-text"
                placeholder="Escribe aquí un texto corto que te gustaría incluir en el video."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

            <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-3">Galería ({uploadedCount}/{MAX_PHOTOS}):</h3>
                 <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {Array.from({ length: MAX_PHOTOS }).map((_, index) => (
                        <PhotoSlot
                            key={index}
                            index={index}
                            file={photos[index]}
                            onFileChange={handleFileChange}
                            onRemove={removePhoto}
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 pt-6 border-t">
           <Button onClick={handleSubmit} disabled={isSubmitting || uploadedCount === 0} size="lg" className="w-full max-w-sm text-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
                {isSubmitting ? "Enviando..." : `Enviar ${uploadedCount} Foto(s)`}
            </Button>
            <p className="text-xs text-muted-foreground"><Info className="inline w-3 h-3 mr-1"/>Al enviar, las fotos se guardarán y no podrás modificarlas desde este enlace.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
