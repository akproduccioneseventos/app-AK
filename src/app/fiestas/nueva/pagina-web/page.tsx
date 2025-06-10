
'use client';

import { useState, type FormEvent, type ChangeEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, UploadCloud, Image as ImageIcon, Globe, Trash2, Loader2, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; 
import type { EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updateWebPageSettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';


const defaultSettings: EventWebPageSettings = {
  pageTitle: 'Mi Evento Especial',
  heroSubtitle: '¡Una celebración inolvidable!',
  welcomeMessage: '¡Bienvenidos a la celebración!',
  coverImageUrl: '',
  galleryImageUrls: [],
  showCountdown: true,
  ourStoryTitle: 'Nuestra Historia',
  ourStoryText: '',
  ourStoryImageUrl: '',
  showOurStory: true,
  eventDetailsTitle: 'Detalles del Evento',
  eventDetailsText: '',
  showEventDetails: true,
  dressCodeText: '',
  showDressCode: false,
  giftRegistryTitle: 'Lista de Regalos',
  giftRegistryText: '',
  showGiftRegistry: false,
  showGallery: true,
  showRsvp: true,
};


export default function PaginaWebEventoPage() {
  const { toast } = useToast();
  const [fiestaId, setFiestaId] = useState<string | null>(null);
  const [pageSettings, setPageSettings] = useState<EventWebPageSettings>(defaultSettings);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
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
      setPageSettings(fiestaData.webPageSettings || defaultSettings);
      setCoverImagePreview(fiestaData.webPageSettings?.coverImageUrl || null);
      setStoryImagePreview(fiestaData.webPageSettings?.ourStoryImageUrl || null);
      setGalleryPreviews(fiestaData.webPageSettings?.galleryImageUrls || []);
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

  const handleInputChange = (field: keyof EventWebPageSettings, value: string | boolean) => {
    setPageSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>, 
    setFile: (file: File | null) => void, 
    setPreview: (url: string | null) => void,
    originalUrlField?: keyof EventWebPageSettings
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFile(null);
      if (originalUrlField) {
         setPreview(pageSettings[originalUrlField] as string || null);
      } else {
        setPreview(null);
      }
    }
  };
  
  const handleGalleryImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      const currentPreviews = [...galleryPreviews]; 
      
      newFilesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          currentPreviews.push(reader.result as string);
          if (currentPreviews.length === galleryPreviews.length + newFilesArray.length) {
            setGalleryPreviews(currentPreviews.slice(-10)); // Keep up to 10, merge new ones
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const settingsToSave: EventWebPageSettings = {
      ...pageSettings,
      coverImageUrl: coverImagePreview || undefined, // Use preview (data URI or existing URL)
      ourStoryImageUrl: storyImagePreview || undefined,
      galleryImageUrls: galleryPreviews.length > 0 ? galleryPreviews : [],
    };

    try {
      const result = await updateWebPageSettingsFiestaActual(settingsToSave);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Configuración Guardada!",
          description: "Los detalles de la página web del evento se han actualizado.",
        });
        setPageSettings(result.updatedData);
        setCoverImagePreview(result.updatedData.coverImageUrl || null);
        setStoryImagePreview(result.updatedData.ourStoryImageUrl || null);
        setGalleryPreviews(result.updatedData.galleryImageUrls || []);
        setCoverImageFile(null); 
        setStoryImageFile(null);
        // galleryImageFiles are not directly stored, only previews
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
    const eventPageUrl = `${window.location.origin}/evento/actual`; 
    navigator.clipboard.writeText(eventPageUrl)
      .then(() => {
        toast({ title: "Enlace Copiado", description: "Enlace a la página del evento copiado al portapapeles." });
      })
      .catch(err => {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" });
      });
  };
  

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
  
  const publicEventUrl = fiestaId ? `${window.location.origin}/evento/actual` : '';


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
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
                <CardTitle className="font-headline text-xl">Contenido y Apariencia</CardTitle>
                <CardDescription>Define el título, mensajes, imágenes y qué secciones mostrar en la página pública.</CardDescription>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* General Info */}
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Información General</h3>
            <div className="space-y-2">
              <Label htmlFor="page-title" className="text-base">Título de la Página</Label>
              <Input id="page-title" value={pageSettings.pageTitle || ''} onChange={(e) => handleInputChange('pageTitle', e.target.value)} placeholder="Ej: ¡Nuestra Boda! Ana y Juan" className="text-base p-3" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle" className="text-base">Subtítulo del Encabezado (Hero)</Label>
              <Input id="hero-subtitle" value={pageSettings.heroSubtitle || ''} onChange={(e) => handleInputChange('heroSubtitle', e.target.value)} placeholder="Ej: ¡Nos Casamos! / Mis XV Años" className="text-base p-3" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome-message" className="text-base">Mensaje de Bienvenida / Introducción</Label>
              <Textarea id="welcome-message" value={pageSettings.welcomeMessage || ''} onChange={(e) => handleInputChange('welcomeMessage', e.target.value)} placeholder="Ej: ¡Estamos muy felices de compartir este día contigo! Aquí encontrarás todos los detalles..." rows={4} className="text-base p-3" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-image-upload" className="text-base">Imagen de Portada (Hero)</Label>
              <Input id="cover-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setCoverImageFile, setCoverImagePreview, 'coverImageUrl')} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving}/>
              {coverImagePreview && (<div className="mt-3 p-2 border rounded-md inline-block bg-muted/50"><NextImage src={coverImagePreview} alt="Vista previa de Portada" width={300} height={200} className="rounded object-contain max-h-[200px]" data-ai-hint="event cover background"/></div>)}
              {!coverImagePreview && (<div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30"><ImageIcon className="w-10 h-10 mb-2" /><p className="text-sm">Sube una imagen de portada</p></div>)}
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="showCountdown" checked={pageSettings.showCountdown} onCheckedChange={(checked) => handleInputChange('showCountdown', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showCountdown" className="text-sm font-normal">Mostrar Contador Regresivo</Label>
            </div>

            {/* Our Story Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Nuestra Historia"</h3>
            <div className="flex items-center space-x-2">
                <Checkbox id="showOurStory" checked={pageSettings.showOurStory} onCheckedChange={(checked) => handleInputChange('showOurStory', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showOurStory" className="text-sm font-normal">Mostrar esta sección</Label>
            </div>
            {pageSettings.showOurStory && (<>
              <div className="space-y-2">
                <Label htmlFor="ourStoryTitle" className="text-base">Título de la Sección "Nuestra Historia"</Label>
                <Input id="ourStoryTitle" value={pageSettings.ourStoryTitle || ''} onChange={(e) => handleInputChange('ourStoryTitle', e.target.value)} className="text-base p-3" disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ourStoryText" className="text-base">Texto de "Nuestra Historia"</Label>
                <Textarea id="ourStoryText" value={pageSettings.ourStoryText || ''} onChange={(e) => handleInputChange('ourStoryText', e.target.value)} rows={5} className="text-base p-3" disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ourStoryImageUrl" className="text-base">Imagen para "Nuestra Historia"</Label>
                <Input id="ourStoryImageUrl" type="file" accept="image/*" onChange={(e) => handleImageChange(e, setStoryImageFile, setStoryImagePreview, 'ourStoryImageUrl')} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving}/>
                {storyImagePreview && (<div className="mt-3 p-2 border rounded-md inline-block bg-muted/50"><NextImage src={storyImagePreview} alt="Vista previa Historia" width={200} height={150} className="rounded object-contain max-h-[150px]" data-ai-hint="couple story photo"/></div>)}
                 {!storyImagePreview && (<div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[100px] bg-muted/30"><ImageIcon className="w-8 h-8 mb-1" /><p className="text-xs">Sube una imagen para la historia</p></div>)}
              </div>
            </>)}
            
            {/* Event Details Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Detalles del Evento"</h3>
            <div className="flex items-center space-x-2">
                <Checkbox id="showEventDetails" checked={pageSettings.showEventDetails} onCheckedChange={(checked) => handleInputChange('showEventDetails', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showEventDetails" className="text-sm font-normal">Mostrar esta sección</Label>
            </div>
            {pageSettings.showEventDetails && (<>
              <div className="space-y-2">
                <Label htmlFor="eventDetailsTitle" className="text-base">Título de la Sección "Detalles del Evento"</Label>
                <Input id="eventDetailsTitle" value={pageSettings.eventDetailsTitle || ''} onChange={(e) => handleInputChange('eventDetailsTitle', e.target.value)} className="text-base p-3" disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDetailsText" className="text-base">Texto de "Detalles del Evento"</Label>
                <Textarea id="eventDetailsText" value={pageSettings.eventDetailsText || ''} onChange={(e) => handleInputChange('eventDetailsText', e.target.value)} placeholder="Incluye aquí información sobre la ceremonia, recepción, horarios, dirección, mapa, etc." rows={6} className="text-base p-3" disabled={isSaving}/>
              </div>
            </>)}

            {/* Dress Code Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Código de Vestimenta"</h3>
             <div className="flex items-center space-x-2">
                <Checkbox id="showDressCode" checked={pageSettings.showDressCode} onCheckedChange={(checked) => handleInputChange('showDressCode', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showDressCode" className="text-sm font-normal">Mostrar esta sección</Label>
            </div>
            {pageSettings.showDressCode && (<>
              <div className="space-y-2">
                <Label htmlFor="dressCodeText" className="text-base">Texto del Código de Vestimenta</Label>
                <Input id="dressCodeText" value={pageSettings.dressCodeText || ''} onChange={(e) => handleInputChange('dressCodeText', e.target.value)} placeholder="Ej: Elegante Sport, Formal, Temático (Años 80)" className="text-base p-3" disabled={isSaving}/>
              </div>
            </>)}

            {/* Gift Registry Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Lista de Regalos"</h3>
            <div className="flex items-center space-x-2">
                <Checkbox id="showGiftRegistry" checked={pageSettings.showGiftRegistry} onCheckedChange={(checked) => handleInputChange('showGiftRegistry', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showGiftRegistry" className="text-sm font-normal">Mostrar esta sección</Label>
            </div>
            {pageSettings.showGiftRegistry && (<>
               <div className="space-y-2">
                <Label htmlFor="giftRegistryTitle" className="text-base">Título de la Sección "Lista de Regalos"</Label>
                <Input id="giftRegistryTitle" value={pageSettings.giftRegistryTitle || ''} onChange={(e) => handleInputChange('giftRegistryTitle', e.target.value)} className="text-base p-3" disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="giftRegistryText" className="text-base">Información de la Lista de Regalos</Label>
                <Textarea id="giftRegistryText" value={pageSettings.giftRegistryText || ''} onChange={(e) => handleInputChange('giftRegistryText', e.target.value)} placeholder="Pega aquí enlaces a listas de regalos, información sobre transferencias, o un mensaje sobre los regalos." rows={4} className="text-base p-3" disabled={isSaving}/>
              </div>
            </>)}

            {/* Gallery Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Galería de Fotos"</h3>
             <div className="flex items-center space-x-2">
                <Checkbox id="showGallery" checked={pageSettings.showGallery} onCheckedChange={(checked) => handleInputChange('showGallery', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showGallery" className="text-sm font-normal">Mostrar esta sección</Label>
            </div>
            {pageSettings.showGallery && (<>
              <div className="space-y-2">
                <Label htmlFor="gallery-images-upload" className="text-base">Añadir Imágenes a la Galería</Label>
                <Input id="gallery-images-upload" type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving}/>
                {galleryPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative group p-1 border rounded-md bg-muted/50">
                        <NextImage src={preview} alt={`Galería ${index + 1}`} width={150} height={150} className="rounded object-cover w-full h-32" data-ai-hint="event gallery image"/>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeGalleryImage(index)} aria-label={`Eliminar imagen ${index + 1}`} disabled={isSaving}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                {galleryPreviews.length === 0 && (<div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30"><ImageIcon className="w-10 h-10 mb-2" /><p className="text-sm">Sube imágenes para la galería</p></div>)}
              </div>
            </>)}

            {/* RSVP Section */}
            <Separator className="my-6"/>
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Sección: "Confirmar Asistencia (RSVP)"</h3>
            <div className="flex items-center space-x-2">
                <Checkbox id="showRsvp" checked={pageSettings.showRsvp} onCheckedChange={(checked) => handleInputChange('showRsvp', !!checked)} disabled={isSaving}/>
                <Label htmlFor="showRsvp" className="text-sm font-normal">Mostrar sección de RSVP</Label>
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios de la Página'}
            </Button>
             <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={handleCopyLink} className="flex-1 sm:flex-initial" disabled={isSaving || isLoading || !publicEventUrl}>
                    Copiar Enlace
                </Button>
                {publicEventUrl && (
                  <a href={publicEventUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                    <Button type="button" variant="secondary" className="w-full" disabled={isSaving || isLoading}>
                        <ExternalLink className="w-4 h-4 mr-2" /> Ver Página Pública
                    </Button>
                  </a>
                )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
