
'use client';

import React, { useState, type FormEvent, useEffect, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Globe, Sparkles, Image as ImageIcon, Users, Clock, Gift, MapPin, Camera, Wand2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ClientPortalSettings, GiftItem } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updatePortalSettings } from '@/app/actions/fiesta/portal.actions';
import { defaultWebPageSettings, defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { merge, cloneDeep } from 'lodash';
import { Separator } from '@/components/ui/separator';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSearchParams } from 'next/navigation';
import NextImage from 'next/image';
import { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const GiftListManagement: React.FC<{
  initialItems: GiftItem[];
  onItemsChange: (items: GiftItem[]) => void;
}> = ({ initialItems, onItemsChange }) => {
  const [items, setItems] = useState(initialItems);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<GiftItem> | null>(null);

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  const openItemModal = (item?: GiftItem) => {
    setCurrentItem(item || { name: '', description: '', imageUrl: '' });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!currentItem || !currentItem.name?.trim()) return;
    const finalItem: GiftItem = {
      ...currentItem,
      id: currentItem.id || `gift_${Date.now()}`,
      name: currentItem.name.trim(),
      isClaimed: currentItem.isClaimed || false,
    } as GiftItem;

    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === finalItem.id);
      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex] = finalItem;
        return newItems;
      }
      return [...prev, finalItem];
    });
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <div className="space-y-3">
        <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{currentItem?.id ? 'Editar' : 'Añadir'} Regalo</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="gift-name">Nombre del Regalo</Label><Input id="gift-name" value={currentItem?.name || ''} onChange={e => setCurrentItem(p => p ? {...p, name: e.target.value} : null)} /></div>
                    <div className="space-y-1"><Label htmlFor="gift-desc">Descripción</Label><Textarea id="gift-desc" value={currentItem?.description || ''} onChange={e => setCurrentItem(p => p ? {...p, description: e.target.value} : null)} rows={2}/></div>
                    <div className="space-y-1"><Label htmlFor="gift-img">URL de Imagen</Label><Input id="gift-img" type="url" value={currentItem?.imageUrl || ''} onChange={e => setCurrentItem(p => p ? {...p, imageUrl: e.target.value} : null)} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem}>Guardar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Ítems de la Lista</h4>
        <Button size="sm" variant="outline" type="button" onClick={() => openItemModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regalo</Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
            <span>{item.name} {item.isClaimed && <span className="text-xs text-green-600">(Elegido)</span>}</span>
            <div className="flex gap-1">
                <Button size="icon" variant="ghost" type="button" className="h-7 w-7"><Edit className="w-3.5 h-3.5"/></Button>
                <Button size="icon" variant="ghost" type="button" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function PaginaWebPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const fiestaId = searchParams.get('fiestaId');
  
  const [webSettings, setWebSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (!fiestaId) {
      toast({ title: "Error", description: "ID de fiesta no encontrado en la URL.", variant: "destructive"});
      setIsLoading(false);
      return;
    }
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error("Fiesta no encontrada");

      setFiesta(data);
      
      const mergedWebSettings = merge(cloneDeep(defaultWebPageSettings), data.webPageSettings || {});
      setWebSettings(mergedWebSettings);
      
      setCoverImagePreview(mergedWebSettings.coverImageUrl || null);
      setStoryImagePreview(mergedWebSettings.ourStoryImageUrl || null);
      
    } catch (e: any) {
      toast({ title: "Error", description: `No se pudieron cargar los datos: ${e.message}`, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleWebSettingsChange = (field: keyof EventWebPageSettings, value: string | boolean | string[] | GiftItem[]) => {
    setWebSettings(prev => ({...prev, [field]: value}));
  };

  const handleFileUpload = async (file: File | null, assetType: 'cover' | 'story'): Promise<string | undefined> => {
    if (!file || !fiesta) return undefined;

    try {
        const result = await uploadPublicPageAsset(fiesta.id, file);
        if (result.success && result.url) {
            return result.url;
        } else {
            throw new Error(result.error || `No se pudo subir la imagen de ${assetType}.`);
        }
    } catch(e: any) {
        toast({title: "Error de Subida", description: e.message, variant: "destructive"});
        return undefined;
    }
  };
  
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiesta) return;
    
    setIsSaving(true);
    let finalSettings = { ...webSettings };

    try {
        if (coverImageFile) {
            const uploadedUrl = await handleFileUpload(coverImageFile, 'cover');
            if(uploadedUrl) finalSettings.coverImageUrl = uploadedUrl;
        }
        if (storyImageFile) {
            const uploadedUrl = await handleFileUpload(storyImageFile, 'story');
            if(uploadedUrl) finalSettings.ourStoryImageUrl = uploadedUrl;
        }

        const currentPortalSettings = fiesta.clientPortalSettings || defaultClientPortalSettings;
        const result = await updatePortalSettings(fiesta.id, currentPortalSettings, finalSettings);
        if (result.success) {
            toast({ title: "¡Configuración Guardada!", description: "La página pública del evento ha sido actualizada." });
            await loadData();
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'cover' | 'story') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cover') {
        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
      } else {
        setStoryImageFile(file);
        setStoryImagePreview(URL.createObjectURL(file));
      }
    }
  };


  if (isLoading || !fiesta) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Página Pública del Evento
          </h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>
      
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna de Configuración */}
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader><CardTitle>Diseño y Contenido Principal</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageTitle">Título Principal de la Página</Label>
                    <Input id="pageTitle" value={webSettings.pageTitle} onChange={(e) => handleWebSettingsChange('pageTitle', e.target.value)} placeholder={fiesta.configuracion.nombreEvento} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Subtítulo (opcional)</Label>
                    <Input id="heroSubtitle" value={webSettings.heroSubtitle} onChange={(e) => handleWebSettingsChange('heroSubtitle', e.target.value)} placeholder="Ej: ¡Una noche inolvidable!" />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="cover-image">Imagen de Portada / Fondo</Label>
                     <Input id="cover-image" type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'cover')} />
                     <p className="text-xs text-muted-foreground">Sube la foto principal o el video corto (MP4) de tu invitación.</p>
                     {coverImagePreview && <div className="relative aspect-video max-w-sm"><NextImage src={coverImagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border"/></div>}
                  </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Secciones de la Página</CardTitle>
                    <CardDescription>Activa y personaliza las secciones que tus invitados verán en la página pública.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Accordion type="multiple" className="w-full space-y-2" defaultValue={['countdown', 'eventDetails']}>
                      <AccordionItem value="countdown" className="border rounded-md px-3">
                          <div className="flex items-center justify-between py-2">
                            <Label htmlFor="showCountdown" className="flex items-center gap-2 font-medium"><Clock className="w-4 h-4"/>Cuenta Regresiva</Label>
                            <Switch id="showCountdown" checked={webSettings.showCountdown} onCheckedChange={(v) => handleWebSettingsChange('showCountdown', v)}/>
                          </div>
                      </AccordionItem>

                       <AccordionItem value="ourStory" className="border rounded-md px-3">
                           <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180">
                                <div className="flex items-center gap-2 font-medium"><Sparkles className="w-4 h-4"/>Nuestra Historia</div>
                           </AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showOurStory">Mostrar esta sección</Label><Switch id="showOurStory" checked={webSettings.showOurStory} onCheckedChange={(v) => handleWebSettingsChange('showOurStory', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="ourStoryTitle">Título de la Sección</Label><Input id="ourStoryTitle" value={webSettings.ourStoryTitle} onChange={e => handleWebSettingsChange('ourStoryTitle', e.target.value)}/></div>
                               <div className="space-y-1"><Label htmlFor="ourStoryText">Texto</Label><Textarea id="ourStoryText" value={webSettings.ourStoryText} onChange={e => handleWebSettingsChange('ourStoryText', e.target.value)} rows={4}/></div>
                               <div className="space-y-1"><Label htmlFor="ourStoryImage">Imagen</Label><Input id="ourStoryImage" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'story')}/></div>
                               {storyImagePreview && <div className="relative aspect-video max-w-xs"><NextImage src={storyImagePreview} alt="Story Preview" layout="fill" objectFit="cover" className="rounded-md border"/></div>}
                           </AccordionContent>
                       </AccordionItem>
                       
                       <AccordionItem value="eventDetails" className="border rounded-md px-3">
                           <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4"/>Detalles del Evento</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showEventDetails">Mostrar esta sección</Label><Switch id="showEventDetails" checked={webSettings.showEventDetails} onCheckedChange={(v) => handleWebSettingsChange('showEventDetails', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="eventDetailsTitle">Título de la Sección</Label><Input id="eventDetailsTitle" value={webSettings.eventDetailsTitle} onChange={e => handleWebSettingsChange('eventDetailsTitle', e.target.value)}/></div>
                               <div className="space-y-1"><Label htmlFor="eventDetailsText">Texto Adicional</Label><Textarea id="eventDetailsText" value={webSettings.eventDetailsText} onChange={e => handleWebSettingsChange('eventDetailsText', e.target.value)} placeholder="Ej: Estacionamiento disponible, código de vestimenta..." rows={3}/></div>
                           </AccordionContent>
                       </AccordionItem>

                        <AccordionItem value="giftRegistry" className="border rounded-md px-3">
                           <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Gift className="w-4 h-4"/>Lista de Regalos</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showGiftRegistry">Mostrar esta sección</Label><Switch id="showGiftRegistry" checked={webSettings.showGiftRegistry} onCheckedChange={(v) => handleWebSettingsChange('showGiftRegistry', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="giftRegistryTitle">Título de la Sección</Label><Input id="giftRegistryTitle" value={webSettings.giftRegistryTitle} onChange={e => handleWebSettingsChange('giftRegistryTitle', e.target.value)}/></div>
                               <div className="space-y-1"><Label htmlFor="giftRegistryText">Texto Introductorio</Label><Textarea id="giftRegistryText" value={webSettings.giftRegistryText} onChange={e => handleWebSettingsChange('giftRegistryText', e.target.value)} rows={2}/></div>
                               <GiftListManagement 
                                   initialItems={webSettings.giftRegistry || []} 
                                   onItemsChange={(newItems) => handleWebSettingsChange('giftRegistry', newItems)}
                               />
                           </AccordionContent>
                       </AccordionItem>

                       <AccordionItem value="gallery" className="border rounded-md px-3">
                           <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Camera className="w-4 h-4"/>Galería de Fotos</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showGallery">Mostrar esta sección</Label><Switch id="showGallery" checked={webSettings.showGallery} onCheckedChange={(v) => handleWebSettingsChange('showGallery', v)}/></div>
                               <p className="text-xs text-muted-foreground">La galería se poblará con las fotos que subas aquí. Es diferente a la Galería Social del evento.</p>
                                {/* Future: Add multi-image uploader here */}
                           </AccordionContent>
                       </AccordionItem>
                   </Accordion>
                </CardContent>
             </Card>
          </div>
          
          {/* Columna de Guardado */}
          <div className="lg:col-span-1">
             <Card className="sticky top-20">
                <CardHeader><CardTitle>Guardar</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Una vez que estés conforme con la configuración, guarda los cambios para que se reflejen en la página pública del evento.</p>
                </CardContent>
                <CardFooter>
                    <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <PaginaWebPageContent />
        </Suspense>
    );
}
