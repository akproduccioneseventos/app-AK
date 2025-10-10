
'use client';

import React, { useState, type FormEvent, useEffect, useCallback, ChangeEvent, Suspense, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Globe, Sparkles, Image as ImageIcon, Users, Clock, Gift, MapPin, Camera, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Link as LinkIcon, ExternalLink, Heart, Church, Handshake, Mail, Music2, CheckCircle, FolderUp, FolderDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, InvitacionDigitalData, GiftItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { updateInvitacionDigital } from '@/app/actions/fiesta-actual';
import { defaultInvitacionDigitalData } from '@/lib/fiesta-defaults';
import { merge, cloneDeep } from 'lodash';
import { Separator } from '@/components/ui/separator';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInvitationTemplates, saveInvitationTemplate, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';

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
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileContext, setFileContext] = useState<{section: keyof InvitacionDigitalData, field: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<InvitacionDigitalTemplate[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let finalData;
    let finalFiesta: FiestaEnPlanificacion | null = null;
    let finalTemplateName = '';

    try {
        if (isEditingTemplate) {
            const templatesData = await getInvitationTemplates();
            const template = templatesData.find(t => t.id === templateId);
            if (!template) throw new Error("Plantilla no encontrada");
            finalData = template;
            finalTemplateName = template.name || `Plantilla ${template.id.substring(0,5)}`;
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
      if(isEditingTemplate) mergedInvitacionData.name = finalTemplateName;
      setInvitacionData(mergedInvitacionData);
      
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAndSetUrl = async () => {
    if (!fileToUpload || !fileContext || (!fiesta && !isEditingTemplate)) return;
    setIsUploading(true);
    try {
      const ownerId = isEditingTemplate ? templateId! : fiesta!.id;
      const result = await uploadPublicPageAsset(ownerId, fileToUpload);
      if (result.success && result.url) {
        handleDataChange(fileContext.section, fileContext.field as any, result.url);
        toast({ title: "Imagen Subida", description: "La imagen ha sido asignada a la sección." });
        setFileContext(null);
        setFileToUpload(null);
        setPreviewUrl(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Subir", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!invitacionData) return;
    
    setIsSaving(true);
    let finalData = { ...invitacionData };

    try {
        let result;
        if (isEditingTemplate) {
            result = await saveInvitationTemplate(finalData as InvitacionDigitalTemplate);
        } else {
            if (!fiesta) throw new Error("Fiesta no encontrada para guardar");
            result = await updateInvitacionDigital(fiesta.id, finalData);
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
  };
  
  const handleLoadTemplate = async () => {
      setIsLoading(true);
      try {
        const templatesData = await getInvitationTemplates();
        setTemplates(templatesData);
        setIsTemplateModalOpen(true);
      } catch(e:any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  };

  const applyTemplate = (template: InvitacionDigitalTemplate) => {
    const mergedData = merge(cloneDeep(defaultInvitacionDigitalData), template);
    delete (mergedData as Partial<InvitacionDigitalTemplate>).name;
    delete (mergedData as Partial<InvitacionDigitalTemplate>).id;
    setInvitacionData(mergedData);
    setIsTemplateModalOpen(false);
    toast({ title: "Plantilla aplicada", description: `Se ha cargado el diseño "${template.name}".`});
  };

  const renderUploadInput = (section: keyof InvitacionDigitalData, field: string, currentUrl?: string) => (
    <div className="space-y-2">
      <Label>Imagen/Video de Fondo</Label>
      <div className="flex items-center gap-2">
        <Input value={currentUrl || ''} onChange={e => handleDataChange(section, field as any, e.target.value)} placeholder="https://... o sube un archivo"/>
        <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" onClick={() => {
                setFileToUpload(null);
                setPreviewUrl(null);
                setFileContext({section, field})
            }}>Subir</Button>
        </DialogTrigger>
      </div>
      {currentUrl && <NextImage src={currentUrl} alt="Preview" width={100} height={60} className="rounded-md border object-cover"/>}
    </div>
  );

  if (isLoading || (!fiesta && !isEditingTemplate)) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }
  
  const backLink = isEditingTemplate ? "/settings/templates/invitaciones" : `/fiestas/nueva?fiestaId=${fiestaId}`;

  return (
    <div className="space-y-6">
       <Dialog onOpenChange={(open) => !open && setFileContext(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Subir Archivo de Fondo</DialogTitle>
                <DialogDescription>Selecciona una imagen o video para la sección "{fileContext?.section}".</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Input type="file" accept="image/*,video/*" onChange={handleFileChange} />
                {previewUrl && (
                    <div className="relative aspect-video w-full max-w-sm mx-auto">
                        {previewUrl.startsWith('blob:') && fileToUpload?.type.startsWith('video') ?
                            <video src={previewUrl} controls className="w-full h-full rounded-md object-contain"/> :
                            <NextImage src={previewUrl} alt="Vista previa" layout="fill" objectFit="contain" className="rounded-md" />
                        }
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleUploadAndSetUrl} disabled={!fileToUpload || isUploading}>{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Subir y Aplicar</Button>
            </DialogFooter>
        </DialogContent>

        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Cargar Diseño desde Plantilla Maestra</DialogTitle></DialogHeader>
                <div className="max-h-96 overflow-y-auto space-y-2 p-1">
                    {templates.map(t => (
                        <Button key={t.id} variant="secondary" className="w-full justify-start h-auto" onClick={() => applyTemplate(t)}>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-12 bg-gray-200 border rounded-sm relative overflow-hidden">
                                {t.cabecera?.videoFondoUrl && <NextImage src={t.cabecera.videoFondoUrl} alt={`Preview de ${t.name}`} layout="fill" objectFit="cover" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-left">{t.name}</p>
                                    <p className="text-xs text-muted-foreground text-left">{t.category} - Estilo: {t.plantilla}</p>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {isEditingTemplate ? `Editando Plantilla: ${invitacionData.name}` : "Página Pública del Evento"}
          </h1>
        </div>
        <div className="flex gap-2">
            {!isEditingTemplate && fiesta && (
                <Link href={`/evento/actual?fiestaId=${fiesta.id}`} passHref target="_blank">
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
                     {!isEditingTemplate && <Button type="button" onClick={handleLoadTemplate} variant="outline"><FolderUp className="w-4 h-4 mr-2" />Cargar desde Plantilla</Button>}
                    {isEditingTemplate && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="templateName">Nombre de la Plantilla</Label><Input id="templateName" value={invitacionData.name || ''} onChange={(e) => setInvitacionData(p => ({...p, name: e.target.value}))}/></div>
                            <div className="space-y-2"><Label htmlFor="templateCat">Categoría</Label><Select value={invitacionData.category || 'General'} onValueChange={(v) => setInvitacionData(p => ({...p, category: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Boda">Boda</SelectItem><SelectItem value="XV Años">XV Años</SelectItem><SelectItem value="Cumpleaños">Cumpleaños</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select></div>
                        </div>
                    )}
                    <div className="space-y-2"><Label htmlFor="templateStyle">Estilo Visual</Label><Select value={invitacionData.plantilla} onValueChange={(v) => handleDataChange('plantilla', 'plantilla', v)}><SelectTrigger id="templateStyle"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Grazia">Grazia (Clásico y Elegante)</SelectItem></SelectContent></Select></div>
                    <Separator/>
                    <div className="space-y-2"><Label htmlFor="musicaFondoUrl" className="flex items-center gap-2"><Music2 className="w-4 h-4"/>URL de Canción de Fondo (MP3)</Label><Input id="musicaFondoUrl" value={invitacionData.musicaFondoUrl || ''} onChange={(e) => handleDataChange('musicaFondoUrl', 'musicaFondoUrl', e.target.value)} placeholder="https://ejemplo.com/cancion.mp3" /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Módulos de Contenido</CardTitle><CardDescription>Activa y personaliza las secciones que tus invitados verán.</CardDescription></CardHeader>
                    <CardContent>
                    <Accordion type="multiple" className="w-full space-y-2" defaultValue={['cabecera', 'detallesEvento', 'confirmacion']}>
                        {Object.keys(defaultInvitacionDigitalData).filter(k => k !== 'plantilla' && k !== 'name' && k !== 'category' && k !== 'musicaFondoUrl').map(key => {
                            const sectionKey = key as keyof Omit<InvitacionDigitalData, 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>;
                            const sectionData = invitacionData[sectionKey];
                            const defaultSectionData = defaultInvitacionDigitalData[sectionKey];
                            if(typeof sectionData !== 'object' || sectionData === null) return null;

                            const Icon = sectionKey === 'cabecera' ? Sparkles : sectionKey === 'bienvenida' ? Heart : sectionKey === 'detallesEvento' ? Church : sectionKey === 'itinerario' ? Clock : sectionKey === 'regalos' ? Gift : sectionKey === 'confirmacion' ? CheckCircle : MessageSquare;
                            
                            return (
                            <AccordionItem key={sectionKey} value={sectionKey} className="border rounded-md px-3">
                                <AccordionTrigger className="hover:no-underline py-2 [&[data-state=open]>svg]:rotate-180"><div className="flex items-center gap-2 font-medium"><Icon className="w-4 h-4"/>{(defaultSectionData as any).titulo || sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}</div></AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                                    <div className="flex items-center justify-between"><Label htmlFor={`show-${sectionKey}`}>Mostrar esta sección</Label><Switch id={`show-${sectionKey}`} checked={sectionData.visible} onCheckedChange={(v) => handleDataChange(sectionKey, 'visible', v)}/></div>
                                    {Object.keys(defaultSectionData).map(field => {
                                        if (field === 'visible' || field === 'items' || typeof (sectionData as any)[field] === 'boolean') return null;
                                        if (field.toLowerCase().includes('url') || field.toLowerCase().includes('video') || field.toLowerCase().includes('imagen')) {
                                            return renderUploadInput(sectionKey, field, (sectionData as any)[field]);
                                        }
                                        const inputType = typeof (sectionData as any)[field] === 'number' ? 'number' : 'text';
                                        return (
                                            <div key={field} className="space-y-1">
                                                <Label htmlFor={`${sectionKey}-${field}`} className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                                                <Input id={`${sectionKey}-${field}`} type={inputType} value={(sectionData as any)[field] || ''} onChange={e => handleDataChange(sectionKey, field as any, e.target.value)} />
                                            </div>
                                        )
                                    })}
                                    {sectionKey === 'regalos' && <GiftListManagement initialItems={(sectionData as any).items || []} onItemsChange={(items) => handleDataChange('regalos', 'items', items)} />}
                                </AccordionContent>
                            </AccordionItem>
                            )
                        })}
                    </Accordion>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card className="sticky top-20">
                    <CardHeader><CardTitle>Guardar</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Guarda los cambios para que se reflejen en la página pública o en la plantilla maestra.</p></CardContent>
                    <CardFooter><Button type="submit" size="lg" className="w-full" disabled={isSaving}>{isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>} Guardar Cambios</Button></CardFooter>
                </Card>
            </div>
            </div>
        </form>
      </Dialog>
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

