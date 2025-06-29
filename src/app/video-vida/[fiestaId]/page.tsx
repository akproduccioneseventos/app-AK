
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpFromLine, Camera, CheckCircle, GripVertical, Image as ImageIcon, Info, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveLifeStoryVideoPhotos } from '@/app/actions/video-vida';
import NextImage from 'next/image';

const MAX_PHOTOS = 50;
const MAX_FILE_SIZE_MB = 5;

interface SortablePhotoProps {
  file: File;
  id: string;
  index: number;
  onRemove: (id: string) => void;
}

function SortablePhoto({ file, id, index, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square group touch-none">
      <div className="absolute top-1 left-1 z-10 bg-black/60 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
        {index + 1}
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(id)}
        aria-label="Eliminar imagen"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      <div className="absolute bottom-1 right-1 z-10 p-1 bg-black/40 rounded-sm cursor-grab" {...listeners} {...attributes}>
         <GripVertical className="h-4 w-4 text-white" />
      </div>
      {previewUrl && (
        <NextImage
          src={previewUrl}
          alt={`Vista previa ${file.name}`}
          layout="fill"
          objectFit="cover"
          className="rounded-md border-2 border-muted"
        />
      )}
    </div>
  );
}

export default function PhotoUploadPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<{ id: string; file: File }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).filter(file => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({ title: "Formato inválido", description: `El archivo ${file.name} no es JPG o PNG.`, variant: "destructive" });
        return false;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "Archivo demasiado grande", description: `El archivo ${file.name} supera los ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    setPhotos(prevPhotos => {
      const combined = [...prevPhotos, ...newPhotos.map(file => ({ id: `${file.name}-${Date.now()}-${Math.random()}`, file }))];
      if (combined.length > MAX_PHOTOS) {
        toast({ title: "Límite excedido", description: `Puedes subir un máximo de ${MAX_PHOTOS} fotos.`, variant: "destructive" });
        return combined.slice(0, MAX_PHOTOS);
      }
      return combined;
    });
  };

  const removePhoto = (idToRemove: string) => {
    setPhotos(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPhotos(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast({ title: "No hay fotos", description: "Por favor, sube al menos una foto.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fiestaId', params.fiestaId);
    photos.forEach(photo => {
      formData.append('photos', photo.file);
    });

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

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-6 md:p-8">
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader className="text-center">
            <Camera className="w-12 h-12 mx-auto text-primary mb-3"/>
            <CardTitle className="text-4xl font-bold font-headline">Carga de Fotos para Video</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Sube y ordena las fotos para tu video de vida.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border-2 border-dashed rounded-lg text-center bg-muted/30">
            <Label htmlFor="photo-upload" className="cursor-pointer space-y-2">
                <ArrowUpFromLine className="w-10 h-10 mx-auto text-primary"/>
                <span className="block font-semibold text-lg">Selecciona tus fotos</span>
                <span className="block text-sm text-muted-foreground">o arrástralas aquí</span>
                 <p className="text-xs text-muted-foreground pt-2">Máximo {MAX_PHOTOS} fotos. Formatos JPG/PNG. Hasta {MAX_FILE_SIZE_MB}MB por foto.</p>
            </Label>
            <Input id="photo-upload" type="file" multiple accept="image/jpeg, image/png" onChange={handleFileChange} className="hidden" />
          </div>

            <div className="mt-6">
                {photos.length > 0 ? (
                <>
                    <h3 className="font-semibold text-lg mb-3">Galería ({photos.length}/{MAX_PHOTOS}):</h3>
                     <p className="text-sm text-muted-foreground mb-3">Arrastra las fotos para cambiar su orden.</p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {photos.map((photo, index) => (
                                    <SortablePhoto key={photo.id} id={photo.id} file={photo.file} index={index} onRemove={removePhoto} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                        <p>Tus fotos aparecerán aquí.</p>
                    </div>
                )}
            </div>

        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 pt-6 border-t">
           <Button onClick={handleSubmit} disabled={isSubmitting || photos.length === 0} size="lg" className="w-full max-w-sm text-lg">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
                {isSubmitting ? "Enviando..." : `Enviar ${photos.length} Fotos`}
            </Button>
            <p className="text-xs text-muted-foreground"><Info className="inline w-3 h-3 mr-1"/>Al enviar, las fotos se guardarán y no podrás modificarlas desde este enlace.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
