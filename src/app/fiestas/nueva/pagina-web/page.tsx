
'use client';

import { useState, type FormEvent, type ChangeEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, UploadCloud, Image as ImageIcon, Globe, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; // Renamed to avoid conflict
import type { FiestaEnPlanificacion, EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updateWebPageSettingsFiestaActual } from '@/app/actions/fiesta-actual';

export default function PaginaWebEventoPage() {
  const { toast } = useToast();
  const [fiestaId, setFiestaId] = useState<string | null>(null);
  const [pageSettings, setPageSettings] = useState<EventWebPageSettings>({
    pageTitle: '',
    welcomeMessage: '',
    coverImageUrl: '',
    galleryImageUrls: [],
  });
  
  // For local file handling before "saving" (which converts them to data URIs)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWebPageSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiestaId(fiestaData.id);
      if (fiestaData.webPageSettings) {
        setPageSettings(fiestaData.webPageSettings);
        setCoverImagePreview(fiestaData.webPageSettings.coverImageUrl || null);
        setGalleryPreviews(fiestaData.webPageSettings.galleryImageUrls || []);
      } else {
        // Initialize with defaults if no settings exist
        setPageSettings({ 
          pageTitle: fiestaData.configuracion.nombreEvento || 'Mi Evento Especial', 
          welcomeMessage: '¡Bienvenidos a la celebración!',
          coverImageUrl: '',
          galleryImageUrls: []
        });
        setCoverImagePreview(null);
        setGalleryPreviews([]);
      }
    } catch (err: any) {
      console.error("Error loading web page settings:", err);
      setError("No se pudo cargar la configuración de la página web.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWebPageSettings();
  }, [loadWebPageSettings]);

  const handleInputChange = (field: keyof Pick<EventWebPageSettings, 'pageTitle' | 'welcomeMessage'>, value: string) => {
    setPageSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverImageFile(null);
      setCoverImagePreview(pageSettings.coverImageUrl || null); // Revert to saved if deselected
    }
  };

  const handleGalleryImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      setGalleryImageFiles(prev => [...prev, ...newFilesArray]);

      const newPreviewsArray: string[] = [];
      let processedCount = 0;
      newFilesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewsArray.push(reader.result as string);
          processedCount++;
          if (processedCount === newFilesArray.length) {
            setGalleryPreviews(prev => [...prev, ...newPreviewsArray]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeGalleryImage = (indexToRemove: number) => {
    // This logic needs to carefully handle removal from both file list and preview list
    // For simplicity, if it's a preview from a saved URL, we remove it from pageSettings.galleryImageUrls
    // If it's a new file upload preview, we remove from galleryImageFiles and galleryPreviews
    
    // This is a simplified removal for previews; robust logic would track original URLs vs new file previews
    setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    
    // If you were also tracking uploaded files separately:
    // setGalleryImageFiles(prev => prev.filter((_, index) => {
    //    // This logic would need to map preview index to file index, which can be complex
    //    // For now, just removing from previews is a visual fix. Persisting this correctly is key.
    //    return index !== indexToRemove; 
    // }));

    // When saving, ensure the galleryImageUrls in pageSettings reflects the current galleryPreviews
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const settingsToSave: EventWebPageSettings = {
      ...pageSettings,
      coverImageUrl: coverImagePreview || undefined, // Save the data URI or existing URL
      galleryImageUrls: galleryPreviews.length > 0 ? galleryPreviews : undefined, // Save data URIs or existing URLs
    };

    try {
      const result = await updateWebPageSettingsFiestaActual(settingsToSave);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Configuración Guardada!",
          description: "Los detalles de la página web del evento se han actualizado.",
        });
        setPageSettings(result.updatedData); // Re-sync with saved data
        setCoverImagePreview(result.updatedData.coverImageUrl || null);
        setGalleryPreviews(result.updatedData.galleryImageUrls || []);
        setCoverImageFile(null); // Reset file inputs after successful save
        setGalleryImageFiles([]);
      } else {
        throw new Error(result.error || "Error desconocido al guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!fiestaId) {
        toast({title: "Error", description: "ID de la fiesta no disponible para generar el enlace.", variant: "destructive"});
        return;
    }
    // This would be the URL to the public-facing event page, which doesn't exist yet.
    // We'll use a placeholder.
    const eventPageUrl = `${window.location.origin}/evento/${fiestaId}`; 
    navigator.clipboard.writeText(eventPageUrl)
      .then(() => {
        toast({ title: "Enlace Copiado", description: "Enlace de invitación copiado al portapapeles (Simulado)." });
      })
      .catch(err => {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" });
      });
  };
  
  const pagePrimaryColor = fiestaActual?.decoracion?.paletaColores?.primary || 'hsl(var(--primary))';


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando configuración...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button onClick={loadWebPageSettings} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline" style={{ color: pagePrimaryColor }}>
            Personalizar Página Web del Evento
          </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
              <div>
                <CardTitle className="font-headline text-xl">Contenido de la Página</CardTitle>
                <CardDescription>Define el título, mensaje y sube imágenes para la web de tu fiesta.</CardDescription>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="page-title" className="text-base">Título de la Página del Evento</Label>
              <Input
                id="page-title"
                value={pageSettings.pageTitle || ''}
                onChange={(e) => handleInputChange('pageTitle', e.target.value)}
                placeholder="Ej: ¡Nuestra Boda! Ana y Juan"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message" className="text-base">Mensaje de Bienvenida / Descripción</Label>
              <Textarea
                id="welcome-message"
                value={pageSettings.welcomeMessage || ''}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                placeholder="Ej: ¡Estamos muy felices de compartir este día contigo! Aquí encontrarás todos los detalles..."
                rows={4}
                className="text-base p-3"
                disabled={isSaving}
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
                disabled={isSaving}
              />
              {coverImagePreview && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50">
                  <NextImage
                    src={coverImagePreview}
                    alt="Vista previa de la Imagen de Portada"
                    width={300}
                    height={200}
                    className="rounded object-contain max-h-[200px]"
                    data-ai-hint="event cover photo"
                  />
                </div>
              )}
               {!coverImagePreview && (
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
                disabled={isSaving}
              />
              {galleryPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {galleryPreviews.map((preview, index) => (
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
                        disabled={isSaving}
                       >
                         <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {galleryPreviews.length === 0 && (
                 <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm">Sube imágenes para la galería</p>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyLink} className="w-full sm:w-auto" disabled={isSaving || isLoading || !fiestaId}>
                Copiar Enlace de Invitación (Simulado)
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
