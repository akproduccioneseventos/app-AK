'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Globe, Share2, ClipboardCopy, Link as LinkIcon, Edit, Trash2, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updatePortalSettingsFiestaActual as updatePortalSettings } from '@/app/actions/fiesta-actual';
import { defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import NextImage from 'next/image';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { cloneDeep, merge } from 'lodash';

interface FileWithPreview extends File {
    preview: string;
}

export default function PaginaWebSettingsPage() {
    const { toast } = useToast();
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [webSettings, setWebSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
    
    const [coverImageFile, setCoverImageFile] = useState<FileWithPreview | null>(null);
    const [storyImageFile, setStoryImageFile] = useState<FileWithPreview | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<(FileWithPreview | string)[]>([]);


    const publicPageUrl = typeof window !== 'undefined' && fiesta ? `${window.location.origin}/evento/actual` : '';

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setFiesta(fiestaData);
            const mergedWebSettings = merge(cloneDeep(defaultWebPageSettings), fiestaData.webPageSettings || {});
            setWebSettings(mergedWebSettings);
            setGalleryImageFiles(mergedWebSettings.galleryImageUrls || []);
        } catch (err: any) {
            setError("No se pudo cargar la configuración.");
            toast({ title: "Error al Cargar", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleWebSettingChange = (field: keyof EventWebPageSettings, value: any) => {
        setWebSettings(prev => ({...prev, [field]: value}));
    };

    const handleFileSelect = (file: File | null, setter: React.Dispatch<React.SetStateAction<FileWithPreview | null>>) => {
        if(file) {
            const fileWithPreview = Object.assign(file, { preview: URL.createObjectURL(file) });
            setter(fileWithPreview);
        } else {
            setter(null);
        }
    };
    
    const handleGalleryFileSelect = (files: FileList | null) => {
      if (files) {
        const newFiles = Array.from(files).map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
        setGalleryImageFiles(prev => [...prev, ...newFiles]);
      }
    };
    
    const removeGalleryImage = (index: number) => {
      setGalleryImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!fiesta) return;
        
        setIsSaving(true);
        let finalWebSettings = { ...webSettings };

        try {
            if (coverImageFile) {
                const result = await uploadPublicPageAsset(fiesta.id, coverImageFile);
                if (result.success) finalWebSettings.coverImageUrl = result.url;
                else throw new Error('Error al subir imagen de portada.');
            }
            if (storyImageFile) {
                const result = await uploadPublicPageAsset(fiesta.id, storyImageFile);
                if (result.success) finalWebSettings.ourStoryImageUrl = result.url;
                else throw new Error('Error al subir imagen de historia.');
            }

            const newGalleryUrls: string[] = [];
            for (const fileOrUrl of galleryImageFiles) {
                if (typeof fileOrUrl === 'string') {
                    newGalleryUrls.push(fileOrUrl);
                } else {
                    const result = await uploadPublicPageAsset(fiesta.id, fileOrUrl);
                    if (result.success && result.url) newGalleryUrls.push(result.url);
                    else throw new Error('Error al subir una de las imágenes de la galería.');
                }
            }
            finalWebSettings.galleryImageUrls = newGalleryUrls;
            
            // Pass the existing client settings to avoid overwriting them
            const currentClientPortalSettings = fiesta.clientPortalSettings || {};
            const result = await updatePortalSettings(currentClientPortalSettings, finalWebSettings);
            if (result.success) {
                toast({ title: "¡Configuración Guardada!", description: "La configuración ha sido actualizada." });
                await loadData();
            } else {
                throw new Error(result.error || "Error al guardar la configuración.");
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
            setCoverImageFile(null);
            setStoryImageFile(null);
        }
    };

    const handleCopyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Enlace Copiado" });
    };

    if (isLoading) { return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>; }
    if (error || !fiesta) { return <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error || 'No se encontró la fiesta'}</p></div>; }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Globe className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Página Pública del Evento</h1></div>
                <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
            </div>
            
            <Card className="shadow-md bg-green-50 border-green-200">
                <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><LinkIcon className="text-green-600"/>Enlace para Invitados</CardTitle></CardHeader>
                <CardContent><div className="flex gap-2"><Input value={publicPageUrl} readOnly /><Button type="button" size="icon" onClick={() => handleCopyToClipboard(publicPageUrl)}><ClipboardCopy className="w-4 h-4"/></Button></div></CardContent>
                <CardFooter><p className="text-xs text-muted-foreground">Comparte este enlace con tus invitados. La página solo estará activa si la opción está habilitada más abajo.</p></CardFooter>
            </Card>

            <form onSubmit={handleSubmit}>
                 <Accordion type="multiple" defaultValue={['publica', 'portal']} className="w-full space-y-6">
                    
                    <AccordionItem value="publica" className="border rounded-lg shadow-sm">
                        <AccordionTrigger className="p-4 text-lg font-headline text-primary hover:no-underline"><div className="flex items-center gap-2"><Globe className="w-5 h-5"/>Personalización de Página Pública</div></AccordionTrigger>
                        <AccordionContent className="p-4 border-t space-y-6">
                            <div className="space-y-2"><Label htmlFor="pageTitle">Título Principal</Label><Input id="pageTitle" value={webSettings.pageTitle || ''} onChange={(e) => handleWebSettingChange('pageTitle', e.target.value)} placeholder="Ej: Nuestra Boda"/></div>
                            <div className="space-y-2"><Label htmlFor="heroSubtitle">Subtítulo (opcional)</Label><Input id="heroSubtitle" value={webSettings.heroSubtitle || ''} onChange={(e) => handleWebSettingChange('heroSubtitle', e.target.value)} placeholder="Ej: ¡Te esperamos para celebrar!"/></div>
                            <div className="space-y-2"><Label htmlFor="cover-image-upload">Imagen de Portada</Label><Input id="cover-image-upload" type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setCoverImageFile)}/>{(coverImageFile?.preview || webSettings.coverImageUrl) && <NextImage src={coverImageFile?.preview || webSettings.coverImageUrl || ''} alt="Preview Portada" width={200} height={100} className="rounded border mt-1 object-cover"/>}</div>
                            <div className="space-y-2"><Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label><Textarea id="welcomeMessage" value={webSettings.welcomeMessage || ''} onChange={(e) => handleWebSettingChange('welcomeMessage', e.target.value)} placeholder="Unas palabras para tus invitados..." rows={3}/></div>
                            <Separator/>
                            <div className="space-y-4 p-3 border rounded-md">
                                <div className="flex items-center space-x-2"><Switch id="showOurStory" checked={webSettings.showOurStory} onCheckedChange={(val) => handleWebSettingChange('showOurStory', val)}/><Label htmlFor="showOurStory">Mostrar sección "Nuestra Historia"</Label></div>
                                {webSettings.showOurStory && (<div className="pl-6 space-y-3 animate-in fade-in-50"><div className="space-y-1"><Label htmlFor="ourStoryTitle">Título de la Sección</Label><Input id="ourStoryTitle" value={webSettings.ourStoryTitle || ''} onChange={(e) => handleWebSettingChange('ourStoryTitle', e.target.value)} /></div><div className="space-y-1"><Label htmlFor="ourStoryText">Texto de la Historia</Label><Textarea id="ourStoryText" value={webSettings.ourStoryText || ''} onChange={(e) => handleWebSettingChange('ourStoryText', e.target.value)} rows={4}/></div><div className="space-y-1"><Label htmlFor="story-image-upload">Imagen de la Historia</Label><Input id="story-image-upload" type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setStoryImageFile)}/>{(storyImageFile?.preview || webSettings.ourStoryImageUrl) && <NextImage src={storyImageFile?.preview || webSettings.ourStoryImageUrl || ''} alt="Preview Historia" width={200} height={100} className="rounded border mt-1 object-cover"/>}</div></div>)}
                            </div>
                            <div className="space-y-4 p-3 border rounded-md">
                                <div className="flex items-center space-x-2"><Switch id="showGallery" checked={webSettings.showGallery} onCheckedChange={(val) => handleWebSettingChange('showGallery', val)}/><Label htmlFor="showGallery">Mostrar Galería de Fotos</Label></div>
                                {webSettings.showGallery && (<div className="pl-6 space-y-3 animate-in fade-in-50"><Label>Imágenes de la Galería</Label><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{galleryImageFiles.map((fileOrUrl, index) => (<div key={index} className="relative group aspect-square"><NextImage src={typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl.preview} alt={`Galería ${index+1}`} layout="fill" objectFit="cover" className="rounded-md border"/><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeGalleryImage(index)}><Trash2 className="w-3 h-3"/></Button></div>))}<Label htmlFor="gallery-upload" className="cursor-pointer aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50"><PlusCircle className="w-6 h-6 mb-1"/><span className="text-xs text-center">Añadir Fotos</span></Label><Input id="gallery-upload" type="file" accept="image/*" multiple onChange={(e) => handleGalleryFileSelect(e.target.files)} className="hidden"/></div></div>)}
                            </div>
                            <Separator/>
                            <div className="flex items-center space-x-2"><Switch id="showCountdown" checked={webSettings.showCountdown} onCheckedChange={(val) => handleWebSettingChange('showCountdown', val)}/><Label htmlFor="showCountdown">Mostrar Cuenta Regresiva</Label></div>
                            <div className="flex items-center space-x-2"><Switch id="showEventDetails" checked={webSettings.showEventDetails} onCheckedChange={(val) => handleWebSettingChange('showEventDetails', val)}/><Label htmlFor="showEventDetails">Mostrar Detalles del Evento (Fecha, Lugar, Mapa)</Label></div>
                            <div className="flex items-center space-x-2"><Switch id="showRsvp" checked={webSettings.showRsvp} onCheckedChange={(val) => handleWebSettingChange('showRsvp', val)}/><Label htmlFor="showRsvp">Mostrar Formulario de RSVP</Label></div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex justify-end pt-6 border-t mt-6">
                    <Button type="submit" disabled={isSaving} size="lg"><Save className="w-5 h-5 mr-2" />{isSaving ? 'Guardando...' : 'Guardar Configuración'}</Button>
                </div>
            </form>
        </div>
    );
}
