
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
import { ArrowLeft, Save, Loader2, Globe, Sparkles, Image as ImageIcon, Users, Clock, Gift, MapPin, Camera, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Link as LinkIcon, ExternalLink, Heart, Church, Mail, Music2, CheckCircle, FolderUp, FolderDown, MessageSquare, Handshake, AlertTriangle } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInvitationTemplates, saveInvitationTemplate, duplicateInvitationTemplate, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import { GraziaTemplate } from '@/app/evento/actual/page';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection } from '@/types/settings';


function PaginaWebPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fiestaId = searchParams.get('fiestaId');
  const templateId = searchParams.get('templateId');
  const isEditingTemplate = !!templateId;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  
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
      const socialData = await getSocialConnections();
      setSocialConnections(socialData);

      if (isEditingTemplate) {
          const templatesData = await getInvitationTemplates();
          const template = templatesData.find(t => t.id === templateId);
          if (!template) throw new Error("Plantilla no encontrada");
          finalData = template;
          finalTemplateName = template.name || `Plantilla ${template.id.substring(0,5)}`;
          // Create a dummy fiesta object for template preview
          const dummyFiesta = {
              id: `template-preview-${Date.now()}`,
              configuracion: {
                  nombreEvento: "Evento de Muestra",
                  tipoCelebracion: "Boda",
                  fechaEvento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                  horaInicio: '21:00',
                  horaFin: '04:00',
                  nombreLugar: "Salón de Fiestas 'Ensueño'",
                  invitadosEstimados: 100
              },
              personalAsignado: [],
              invoiceIds: [],
          } as FiestaEnPlanificacion;
          finalFiesta = dummyFiesta;
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
    <div key={`${section}-${field}`} className="space-y-2">
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
  
  const backLink = isEditingTemplate ? "/settings/templates/invitaciones" : `/fiestas/nueva?fiestaId=${fiestaId}`;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline">
            {isEditingTemplate ? `Editando Plantilla: ${invitacionData.name}` : "Constructor Visual de Invitación"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
            Guardar
          </Button>
          <Link href={backLink} passHref>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Controls Panel */}
        <Card className="lg:col-span-1 h-full flex flex-col">
          <CardHeader><CardTitle>Panel de Control</CardTitle></CardHeader>
          <CardContent className="flex-grow overflow-y-auto pr-2">
            <Dialog onOpenChange={(open) => !open && setFileContext(null)}>
              <Accordion type="multiple" className="w-full space-y-4" defaultValue={['general', 'cabecera', 'detallesEvento']}>
                {/* General Settings */}
                <AccordionItem value="general" className="border rounded-md px-3">
                  <AccordionTrigger className="hover:no-underline py-2 text-md font-medium"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4"/>Diseño General</div></AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                    {!isEditingTemplate && <Button type="button" onClick={handleLoadTemplate} variant="outline" className="w-full"><FolderUp className="w-4 h-4 mr-2" />Cargar desde Plantilla</Button>}
                    {isEditingTemplate && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>Nombre Plantilla</Label><Input value={invitacionData.name || ''} onChange={(e) => setInvitacionData(p => ({...p, name: e.target.value}))}/></div>
                        <div className="space-y-1"><Label>Categoría</Label><Select value={invitacionData.category || 'General'} onValueChange={(v) => setInvitacionData(p => ({...p, category: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Boda">Boda</SelectItem><SelectItem value="XV Años">XV Años</SelectItem><SelectItem value="Cumpleaños">Cumpleaños</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select></div>
                      </div>
                    )}
                    <div className="space-y-1"><Label>Estilo Visual</Label><Select value={invitacionData.plantilla} onValueChange={(v) => setInvitacionData(p => ({...p, plantilla: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Grazia">Grazia (Clásico y Elegante)</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1"><Label>URL Música de Fondo (MP3)</Label><Input value={invitacionData.musicaFondoUrl || ''} onChange={(e) => setInvitacionData(p => ({...p, musicaFondoUrl: e.target.value}))} placeholder="https://..." /></div>
                  </AccordionContent>
                </AccordionItem>

                {/* Content Sections */}
                {Object.keys(defaultInvitacionDigitalData).filter(k => k !== 'plantilla' && k !== 'name' && k !== 'category' && k !== 'musicaFondoUrl').map(key => {
                    const sectionKey = key as keyof Omit<InvitacionDigitalData, 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>;
                    const sectionData = invitacionData[sectionKey];
                    const defaultSectionData = defaultInvitacionDigitalData[sectionKey];
                    if(typeof sectionData !== 'object' || sectionData === null) return null;

                    const Icon = sectionKey === 'cabecera' ? ImageIcon : sectionKey === 'bienvenida' ? Heart : sectionKey === 'detallesEvento' ? Church : sectionKey === 'itinerario' ? Clock : sectionKey === 'regalos' ? Gift : sectionKey === 'confirmacion' ? CheckCircle : MessageSquare;
                    
                    return (
                    <AccordionItem key={sectionKey} value={sectionKey} className="border rounded-md px-3">
                        <AccordionTrigger className="hover:no-underline py-2 text-md font-medium"><div className="flex items-center gap-2"><Icon className="w-4 h-4"/>{(defaultSectionData as any).titulo || key.charAt(0).toUpperCase() + key.slice(1)}</div></AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                            <div className="flex items-center justify-between"><Label htmlFor={`show-${sectionKey}`}>Mostrar sección</Label><Switch id={`show-${sectionKey}`} checked={sectionData.visible} onCheckedChange={(v) => handleDataChange(sectionKey, 'visible', v)}/></div>
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
                        </AccordionContent>
                    </AccordionItem>
                    )
                })}
              </Accordion>
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
            </Dialog>
          </CardContent>
        </Card>
        {/* Preview Panel */}
        <div className="lg:col-span-2 h-full rounded-lg border shadow-inner bg-muted/30 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin"/></div>
          ) : fiesta ? (
             <ScrollArea className="h-full w-full bg-background">
                <div className="w-full h-full">
                    <GraziaTemplate 
                        fiesta={fiesta} 
                        invitacionData={invitacionData}
                        socialConnections={socialConnections}
                        isPreview={true}
                    />
                </div>
             </ScrollArea>
          ) : (
             <div className="flex items-center justify-center h-full"><AlertTriangle className="w-8 h-8 text-destructive"/></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando constructor...</p></div>}>
            <PaginaWebPageContent />
        </Suspense>
    );
}
