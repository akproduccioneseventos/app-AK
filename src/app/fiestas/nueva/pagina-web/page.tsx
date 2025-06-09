
'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, UploadCloud, Image as ImageIcon, Globe } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; // Renamed to avoid conflict

interface EventWebPageData {
  pageTitle: string;
  welcomeMessage: string;
  coverImage: File | null;
  coverImagePreview: string | null;
  galleryImages: File[];
  galleryPreviews: string[];
}

export default function PaginaWebEventoPage() {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<EventWebPageData>({
    pageTitle: '',
    welcomeMessage: '',
    coverImage: null,
    coverImagePreview: null,
    galleryImages: [],
    galleryPreviews: [],
  });

  const handleChange = (field: keyof Omit<EventWebPageData, 'coverImage' | 'coverImagePreview' | 'galleryImages' | 'galleryPreviews'>, value: string) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPageData(prev => ({
          ...prev,
          coverImage: file,
          coverImagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPageData(prev => ({
        ...prev,
        coverImage: null,
        coverImagePreview: null,
      }));
    }
  };

  const handleGalleryImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newGalleryFiles: File[] = Array.from(files);
      const newGalleryPreviews: string[] = [];

      newGalleryFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newGalleryPreviews.push(reader.result as string);
          // This check is important to update state only after all files are read
          if (newGalleryPreviews.length === newGalleryFiles.length) {
            setPageData(prev => ({
              ...prev,
              galleryImages: [...prev.galleryImages, ...newGalleryFiles],
              galleryPreviews: [...prev.galleryPreviews, ...newGalleryPreviews],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeGalleryImage = (indexToRemove: number) => {
    setPageData(prev => ({
        ...prev,
        galleryImages: prev.galleryImages.filter((_,index) => index !== indexToRemove),
        galleryPreviews: prev.galleryPreviews.filter((_,index) => index !== indexToRemove)
    }));
  }


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // En una aplicación real, aquí guardarías los datos y las imágenes.
    console.log({ pageData });
    toast({
      title: "Página Web Guardada (Simulación)",
      description: "Los detalles de la página web del evento se han guardado.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Personalizar Página Web del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Contenido de la Página</CardTitle>
                <CardDescription>Define el título, mensaje y sube imágenes para la web de tu fiesta.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="page-title" className="text-base">Título de la Página del Evento</Label>
              <Input
                id="page-title"
                value={pageData.pageTitle}
                onChange={(e) => handleChange('pageTitle', e.target.value)}
                placeholder="Ej: ¡Nuestra Boda! Ana y Juan"
                className="text-base p-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message" className="text-base">Mensaje de Bienvenida / Descripción</Label>
              <Textarea
                id="welcome-message"
                value={pageData.welcomeMessage}
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                placeholder="Ej: ¡Estamos muy felices de compartir este día contigo! Aquí encontrarás todos los detalles..."
                rows={4}
                className="text-base p-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-image-upload" className="text-base">Imagen de Portada</Label>
              <Input
                id="cover-image-upload"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {pageData.coverImagePreview && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50">
                  <NextImage
                    src={pageData.coverImagePreview}
                    alt="Vista previa de la Imagen de Portada"
                    width={300}
                    height={200}
                    className="rounded object-contain max-h-[200px]"
                    data-ai-hint="event cover photo"
                  />
                </div>
              )}
               {!pageData.coverImagePreview && (
                <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm">Sube una imagen de portada</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gallery-images-upload" className="text-base">Galería de Fotos (Opcional)</Label>
              <Input
                id="gallery-images-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImagesChange}
                className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {pageData.galleryPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pageData.galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative group p-1 border rounded-md bg-muted/50">
                      <NextImage
                        src={preview}
                        alt={`Vista previa Galería ${index + 1}`}
                        width={150}
                        height={150}
                        className="rounded object-cover w-full h-32"
                        data-ai-hint="event gallery image"
                      />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                        aria-label={`Eliminar imagen ${index + 1}`}
                       >
                         <UploadCloud className="w-3 h-3" /> {/* Placeholder, replace with Trash icon if available */}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {pageData.galleryPreviews.length === 0 && (
                 <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm">Sube imágenes para la galería</p>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios de la Página Web
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
