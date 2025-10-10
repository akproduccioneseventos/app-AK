
'use client';

import React, { useState, type FormEvent, useEffect, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Globe, Sparkles, Image as ImageIcon, Users, Clock, Gift, MapPin, Camera, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Link as LinkIcon, ExternalLink, Heart, Church, Handshake, Mail, Music2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, InvitacionDigitalData, GiftItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { updateInvitacionDigital } from '@/app/actions/fiesta-actual';
import { defaultInvitacionDigitalData } from '@/lib/fiesta-defaults';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInvitationTemplates, saveInvitationTemplate } from '@/app/actions/invitacion-digital-templates';

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
                <Button size="icon" variant="ghost" type="button" className="h-7 w-7" onClick={() => openItemModal(item)}><Edit className="w-3.5 h-3.5"/></Button>
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
  const router = useRouter();

  const fiestaId = searchParams.get('fiestaId');
  const templateId = searchParams.get('templateId');
  const isEditingTemplate = !!templateId;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [welcomeImageFile, setWelcomeImageFile] = useState<File | null>(null);
  const [welcomeImagePreview, setWelcomeImagePreview] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let finalData;
    let finalFiesta: FiestaEnPlanificacion | null = null;
    let finalTemplateName = '';

    try {
        if (isEditingTemplate) {
            const templates = await getInvitationTemplates();
            const template = templates.find(t => t.id === templateId);
            if (!template) throw new Error("Plantilla no encontrada");
            finalData = template;
            finalTemplateName = template.name;
        } else {
            if (!fiestaId) {
                toast({ title: "Error", description: "ID de fiesta no encontrado en la URL.", variant: "destructive" });
                router.replace('/eventos');
                return;
            }
            const data = await getFiestaById(fiestaId);
            if (!data) throw new Error("Fiesta no encontrada");
            finalFiesta = data;
            finalData = data.invitacionDigital || {};
        }

      setFiesta(finalFiesta);
      
      const mergedInvitacionData = merge(cloneDeep(defaultInvitacionDigitalData), finalData);
      if(isEditingTemplate) mergedInvitacionData.name = finalTemplateName; // Preserve template name
      setInvitacionData(mergedInvitacionData);
      
      setCoverImagePreview(mergedInvitacionData.cabecera?.videoFondoUrl || null);
      setWelcomeImagePreview(mergedInvitacionData.bienvenida?.imagenFondoUrl || null);
      
    } catch (e: any) {
      toast({ title: "Error", description: `No se pudieron cargar los datos: ${e.message}`, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, templateId, isEditingTemplate, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleDataChange = <T extends keyof InvitacionDigitalData>(section: T, field: keyof InvitacionDigitalData[T], value: any) => {
    setInvitacionData(prev => {
        const newSectionData = { ...prev[section], [field]: value };
        return { ...prev, [section]: newSectionData };
    });
  };

  const handleFileUpload = async (file: File | null, ownerId: string): Promise<string | undefined> => {
    if (!file) return undefined;

    try {
        const result = await uploadPublicPageAsset(ownerId, file);
        if (result.success && result.url) return result.url;
        else throw new Error(result.error || `No se pudo subir la imagen.`);
    } catch(e: any) {
        toast({title: "Error de Subida", description: e.message, variant: "destructive"});
        return undefined;
    }
  };
  
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!invitacionData) return;
    
    setIsSaving(true);
    let finalData = { ...invitacionData };

    try {
        const ownerId = isEditingTemplate ? templateId! : fiesta!.id;

        if (coverImageFile) {
            const uploadedUrl = await handleFileUpload(coverImageFile, ownerId);
            if(uploadedUrl) finalData = {...finalData, cabecera: {...finalData.cabecera, videoFondoUrl: uploadedUrl}};
        }
        if (welcomeImageFile) {
            const uploadedUrl = await handleFileUpload(welcomeImageFile, ownerId);
            if(uploadedUrl) finalData = {...finalData, bienvenida: {...finalData.bienvenida, imagenFondoUrl: uploadedUrl}};
        }
        
        let result;
        if (isEditingTemplate) {
            result = await saveInvitationTemplate(finalData);
        } else {
            result = await updateInvitacionDigital(fiesta!.id, finalData);
        }

        if (result.success) {
            toast({ title: "¡Configuración Guardada!" });
            if (!isEditingTemplate) {
                router.push(`/fiestas/nueva?fiestaId=${fiestaId}`);
            } else {
                router.push('/settings/templates/invitaciones');
            }
        } else {
            throw new Error((result as any).error);
        }
    } catch (err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'cover' | 'welcome' | 'story') => {
    const file = e.target.files?.[0];
    if (file) {
      const setFile = type === 'cover' ? setCoverImageFile : setWelcomeImageFile;
      const setPreview = type === 'cover' ? setCoverImagePreview : setWelcomeImagePreview;
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };


  if (isLoading || (!fiesta && !isEditingTemplate)) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }
  
  const backLink = isEditingTemplate ? "/settings/templates/invitaciones" : `/fiestas/nueva?fiestaId=${fiestaId}`;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
             {isEditingTemplate ? `Editando Plantilla: ${invitacionData.name}` : "Página Pública del Evento"}
          </h1>
        </div>
        <div className="flex gap-2">
            {!isEditingTemplate && (
                <Link href={`/evento/actual?fiestaId=${fiesta!.id}`} passHref target="_blank">
                    <Button variant="secondary"><ExternalLink className="w-4 h-4 mr-2"/>Ver Página</Button>
                </Link>
            )}
            <Link href={backLink} passHref>
              <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
            </Link>
        </div>
      </div>
      
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle>Configuración General y Diseño</CardTitle>
                  <CardDescription>Ajusta el diseño y los elementos principales de tu invitación digital.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingTemplate && (
                    <div className="space-y-2">
                        <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                        <Input id="templateName" value={invitacionData.name || ''} onChange={(e) => setInvitacionData(p => ({...p, name: e.target.value}))}/>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="templateStyle">Seleccionar Estilo Visual</Label>
                    <Select value={invitacionData.plantilla} onValueChange={(v) => handleDataChange('plantilla', 'plantilla', v)}><SelectTrigger id="templateStyle"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Grazia">Grazia (Clásico y Elegante)</SelectItem></SelectContent></Select>
                  </div>
                  <Separator/>
                   <div className="space-y-2">
                    <Label htmlFor="musicaFondoUrl" className="flex items-center gap-2"><Music2 className="w-4 h-4"/>URL de Canción de Fondo (MP3)</Label>
                    <Input id="musicaFondoUrl" value={invitacionData.musicaFondoUrl || ''} onChange={(e) => handleDataChange('musicaFondoUrl', 'musicaFondoUrl', e.target.value)} placeholder="https://ejemplo.com/cancion.mp3" />
                  </div>
                </CardContent>
             </Card>
             <Card>
                <CardHeader><CardTitle>Módulos de Contenido</CardTitle><CardDescription>Activa y personaliza las secciones que tus invitados verán.</CardDescription></CardHeader>
                <CardContent>
                   <Accordion type="multiple" className="w-full space-y-2" defaultValue={['cabecera', 'detallesEvento', 'confirmacion']}>
                      <AccordionItem value="cabecera" className="border rounded-md px-3">
                          <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Sparkles className="w-4 h-4"/>Cabecera</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showCabecera">Mostrar esta sección</Label><Switch id="showCabecera" checked={invitacionData.cabecera.visible} onCheckedChange={(v) => handleDataChange('cabecera', 'visible', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="cover-image">Imagen/Video de Fondo</Label><Input id="cover-image" type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange(e, 'cover')} /></div>
                                {coverImagePreview && (
                                    <div className="relative aspect-video max-w-sm">
                                        {coverImagePreview.endsWith('.mp4') ? (<video src={coverImagePreview} autoPlay loop muted playsInline className="rounded-md border object-cover w-full h-full" />) : (<NextImage src={coverImagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border"/>)}
                                    </div>
                                 )}
                           </AccordionContent>
                       </AccordionItem>
                       <AccordionItem value="bienvenida" className="border rounded-md px-3">
                          <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Heart className="w-4 h-4"/>Bienvenida</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showBienvenida">Mostrar esta sección</Label><Switch id="showBienvenida" checked={invitacionData.bienvenida.visible} onCheckedChange={(v) => handleDataChange('bienvenida', 'visible', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="welcome-title">Título de Bienvenida</Label><Input id="welcome-title" value={invitacionData.bienvenida.titulo} onChange={e => handleDataChange('bienvenida', 'titulo', e.target.value)}/></div>
                               <div className="space-y-1"><Label htmlFor="welcome-text">Texto de Bienvenida</Label><Textarea id="welcome-text" value={invitacionData.bienvenida.texto} onChange={e => handleDataChange('bienvenida', 'texto', e.target.value)} rows={3}/></div>
                               <div className="space-y-1"><Label htmlFor="welcome-image">Imagen de Fondo</Label><Input id="welcome-image" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'welcome')} /></div>
                               {welcomeImagePreview && <NextImage src={welcomeImagePreview} alt="Preview Bienvenida" width={150} height={100} className="rounded-md border object-cover"/>}
                           </AccordionContent>
                       </AccordionItem>
                      <AccordionItem value="detallesEvento" className="border rounded-md px-3">
                          <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4"/>Detalles del Evento</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showEventDetails">Mostrar esta sección</Label><Switch id="showEventDetails" checked={invitacionData.detallesEvento.visible} onCheckedChange={(v) => handleDataChange('detallesEvento', 'visible', v)}/></div>
                               <div className="flex items-center justify-between"><Label htmlFor="showPadres">Mostrar Nombres de Padres</Label><Switch id="showPadres" checked={invitacionData.detallesEvento.infoPadresVisible} onCheckedChange={(v) => handleDataChange('detallesEvento', 'infoPadresVisible', v)}/></div>
                               {invitacionData.detallesEvento.infoPadresVisible && (
                                   <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor="padre1">Padre/Madre 1</Label><Input id="padre1" value={invitacionData.detallesEvento.nombrePadre1} onChange={e => handleDataChange('detallesEvento', 'nombrePadre1', e.target.value)}/></div><div className="space-y-1"><Label htmlFor="madre1">Padre/Madre 2</Label><Input id="madre1" value={invitacionData.detallesEvento.nombreMadre1} onChange={e => handleDataChange('detallesEvento', 'nombreMadre1', e.target.value)}/></div><div className="space-y-1"><Label htmlFor="padre2">Padre/Madre 3</Label><Input id="padre2" value={invitacionData.detallesEvento.nombrePadre2} onChange={e => handleDataChange('detallesEvento', 'nombrePadre2', e.target.value)}/></div><div className="space-y-1"><Label htmlFor="madre2">Padre/Madre 4</Label><Input id="madre2" value={invitacionData.detallesEvento.nombreMadre2} onChange={e => handleDataChange('detallesEvento', 'nombreMadre2', e.target.value)}/></div></div>
                               )}
                           </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="itinerario" className="border rounded-md px-3">
                          <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Clock className="w-4 h-4"/>Itinerario</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showItinerario">Mostrar esta sección</Label><Switch id="showItinerario" checked={invitacionData.itinerario.visible} onCheckedChange={(v) => handleDataChange('itinerario', 'visible', v)}/></div>
                               <p className="text-xs text-muted-foreground">El itinerario se toma automáticamente del módulo "Itinerario del Evento".</p>
                           </AccordionContent>
                      </AccordionItem>
                       <AccordionItem value="regalos" className="border rounded-md px-3">
                           <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Gift className="w-4 h-4"/>Lista de Regalos</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showRegalos">Mostrar esta sección</Label><Switch id="showRegalos" checked={invitacionData.regalos.visible} onCheckedChange={(v) => handleDataChange('regalos', 'visible', v)}/></div>
                               <div className="space-y-1"><Label htmlFor="regalosTitulo">Título</Label><Input id="regalosTitulo" value={invitacionData.regalos.titulo} onChange={e => handleDataChange('regalos', 'titulo', e.target.value)}/></div>
                               <div className="space-y-1"><Label htmlFor="regalosTexto">Texto</Label><Textarea id="regalosTexto" value={invitacionData.regalos.texto} onChange={e => handleDataChange('regalos', 'texto', e.target.value)} rows={2}/></div>
                               <div className="space-y-1"><Label htmlFor="regalosBanco">Datos Bancarios</Label><Textarea id="regalosBanco" value={invitacionData.regalos.datosBancarios} onChange={e => handleDataChange('regalos', 'datosBancarios', e.target.value)} rows={2} placeholder="Banco, Nombre, Nro de Cuenta"/></div>
                               <Separator/>
                               <GiftListManagement initialItems={invitacionData.regalos.items || []} onItemsChange={(items) => handleDataChange('regalos', 'items', items)} />
                           </AccordionContent>
                       </AccordionItem>
                       <AccordionItem value="confirmacion" className="border rounded-md px-3">
                          <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><CheckCircle className="w-4 h-4"/>Confirmación de Asistencia</div></AccordionTrigger>
                           <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                               <div className="flex items-center justify-between"><Label htmlFor="showRsvp">Mostrar esta sección</Label><Switch id="showRsvp" checked={invitacionData.confirmacion.visible} onCheckedChange={(v) => handleDataChange('confirmacion', 'visible', v)}/></div>
                           </AccordionContent>
                       </AccordionItem>
                   </Accordion>
                </CardContent>
             </Card>
          </div>
          
          <div className="lg:col-span-1">
             <Card className="sticky top-20">
                <CardHeader><CardTitle>Guardar</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Guarda los cambios para que se reflejen en la página pública del evento.</p></CardContent>
                <CardFooter><Button type="submit" size="lg" className="w-full" disabled={isSaving}>{isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>} Guardar Cambios</Button></CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <PaginaWebPageContent />
        </Suspense>
    );
}
