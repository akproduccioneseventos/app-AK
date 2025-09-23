
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Globe, Lock, Share2, ClipboardCopy, Link as LinkIcon, Edit, Trash2, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updatePortalSettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultClientPortalSettings, defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import NextImage from 'next/image';

type PortalModule = keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>;

const moduleLabels: Record<PortalModule, { title: string, desc: string, edit?: boolean }> = {
    paginaPublica: { title: 'Página Pública del Evento', desc: 'Permite a los invitados ver la página principal del evento.', },
    documentos: { title: 'Documentos', desc: 'Permite al cliente ver su contrato, presupuesto y facturas.' },
    checklist: { title: 'Checklist del Cliente', desc: 'Permite al cliente ver y/o completar su lista de tareas.', edit: true },
    itinerario: { title: 'Itinerario del Evento', desc: 'Permite al cliente ver el cronograma del evento.' },
    musica: { title: 'Preferencias Musicales', desc: 'Permite al cliente ver y/o editar las canciones.', edit: true },
    videoVida: { title: 'Carga para Video de Vida', desc: 'Activa la página para que el cliente suba fotos.', edit: true },
    listaRegalos: { title: 'Lista de Regalos', desc: 'Permite al cliente ver y gestionar su lista de regalos.' },
    notasCliente: { title: 'Notas y Preferencias', desc: 'Permite al cliente ver y/o añadir notas generales.', edit: true },
    invitados: { title: 'Gestión de Invitados', desc: 'Permite al cliente ver su lista de invitados.' },
    fotografiaYFilmacion: { title: 'Fotografía y Filmación', desc: 'Permite al cliente ver el estado de la entrega del material.' },
};

export default function PortalClienteSettingsPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientSettings, setClientSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);
  const [webSettings, setWebSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
  
  const [publicPageUrl, setPublicPageUrl] = useState('');

  useEffect(() => {
    setPublicPageUrl(`${window.location.origin}/evento/actual`);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setClientSettings(fiestaData.clientPortalSettings || defaultClientPortalSettings);
      setWebSettings(fiestaData.webPageSettings || defaultWebPageSettings);
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
  
  const handleClientSettingToggle = (module: PortalModule, field: 'visible' | 'editable', value: boolean) => {
    setClientSettings(prev => {
      const newSettings = {...prev};
      const currentModuleState = newSettings[module] || { visible: false, editable: false };
      const updatedModuleState = { ...currentModuleState, [field]: value };
      if (field === 'visible' && !value) {
        updatedModuleState.editable = false;
      }
      return { ...newSettings, [module]: updatedModuleState };
    });
  };
  
  const handleWebSettingChange = (field: keyof EventWebPageSettings, value: any) => {
    setWebSettings(prev => ({...prev, [field]: value}));
  };

  const addGalleryImageUrl = () => {
    handleWebSettingChange('galleryImageUrls', [...(webSettings.galleryImageUrls || []), '']);
  }
  const updateGalleryImageUrl = (index: number, value: string) => {
    const newUrls = [...(webSettings.galleryImageUrls || [])];
    newUrls[index] = value;
    handleWebSettingChange('galleryImageUrls', newUrls);
  }
  const removeGalleryImageUrl = (index: number) => {
    handleWebSettingChange('galleryImageUrls', (webSettings.galleryImageUrls || []).filter((_, i) => i !== index));
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiesta) return;
    
    setIsSaving(true);
    
    try {
      const result = await updatePortalSettingsFiestaActual(clientSettings, webSettings);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "La configuración del portal y la página pública ha sido actualizada." });
        await loadData();
      } else {
        throw new Error(result.error || "Error al guardar");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publicPageUrl);
    toast({ title: "Enlace Copiado", description: "El enlace se ha copiado al portapapeles." });
  };

  if (isLoading) { return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>; }
  if (error) { return <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p></div>; }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Globe className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Página Pública y Portal del Cliente</h1></div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
      
       <Card className="shadow-md bg-green-50 border-green-200">
            <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><LinkIcon className="text-green-600"/>Enlace a la Página Pública</CardTitle></CardHeader>
            <CardContent><div className="flex gap-2"><Input value={publicPageUrl} readOnly /><Button type="button" size="icon" onClick={handleCopyToClipboard}><ClipboardCopy className="w-4 h-4"/></Button></div></CardContent>
            <CardFooter><p className="text-xs text-muted-foreground">Comparte este enlace con tus invitados. Solo estará activa si la opción "Página Pública del Evento" está habilitada.</p></CardFooter>
      </Card>


      <form onSubmit={handleSubmit}>
        <Accordion type="multiple" defaultValue={['publica', 'portal']} className="w-full space-y-6">
            
            {/* PUBLIC PAGE SETTINGS */}
            <AccordionItem value="publica" className="border rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-lg font-headline text-primary hover:no-underline"><div className="flex items-center gap-2"><Globe className="w-5 h-5"/>Personalización de Página Pública</div></AccordionTrigger>
                <AccordionContent className="p-4 border-t space-y-6">
                    <div className="space-y-2"><Label htmlFor="pageTitle">Título Principal</Label><Input id="pageTitle" value={webSettings.pageTitle || ''} onChange={(e) => handleWebSettingChange('pageTitle', e.target.value)} placeholder="Ej: Nuestra Boda"/></div>
                    <div className="space-y-2"><Label htmlFor="heroSubtitle">Subtítulo (opcional)</Label><Input id="heroSubtitle" value={webSettings.heroSubtitle || ''} onChange={(e) => handleWebSettingChange('heroSubtitle', e.target.value)} placeholder="Ej: ¡Te esperamos para celebrar!"/></div>
                    <div className="space-y-2"><Label htmlFor="coverImageUrl">URL de Imagen de Portada</Label><Input id="coverImageUrl" type="url" value={webSettings.coverImageUrl || ''} onChange={(e) => handleWebSettingChange('coverImageUrl', e.target.value)} placeholder="https://ejemplo.com/foto_pareja.jpg"/>{webSettings.coverImageUrl && <NextImage src={webSettings.coverImageUrl} alt="Preview Portada" width={200} height={100} className="rounded border mt-1 object-cover" data-ai-hint="event cover photo"/>}</div>
                    <div className="space-y-2"><Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label><Textarea id="welcomeMessage" value={webSettings.welcomeMessage || ''} onChange={(e) => handleWebSettingChange('welcomeMessage', e.target.value)} placeholder="Unas palabras para tus invitados..." rows={3}/></div>
                    
                    <Separator/>

                     <div className="space-y-4 p-3 border rounded-md">
                        <div className="flex items-center space-x-2"><Switch id="showOurStory" checked={webSettings.showOurStory} onCheckedChange={(val) => handleWebSettingChange('showOurStory', val)}/><Label htmlFor="showOurStory">Mostrar sección "Nuestra Historia"</Label></div>
                        {webSettings.showOurStory && (
                            <div className="pl-6 space-y-3 animate-in fade-in-50">
                                <div className="space-y-1"><Label htmlFor="ourStoryTitle">Título de la Sección</Label><Input id="ourStoryTitle" value={webSettings.ourStoryTitle || ''} onChange={(e) => handleWebSettingChange('ourStoryTitle', e.target.value)} /></div>
                                <div className="space-y-1"><Label htmlFor="ourStoryText">Texto de la Historia</Label><Textarea id="ourStoryText" value={webSettings.ourStoryText || ''} onChange={(e) => handleWebSettingChange('ourStoryText', e.target.value)} rows={4}/></div>
                                <div className="space-y-1"><Label htmlFor="ourStoryImageUrl">URL de Imagen de la Historia</Label><Input id="ourStoryImageUrl" type="url" value={webSettings.ourStoryImageUrl || ''} onChange={(e) => handleWebSettingChange('ourStoryImageUrl', e.target.value)} /></div>
                            </div>
                        )}
                    </div>
                    
                     <div className="space-y-4 p-3 border rounded-md">
                        <div className="flex items-center space-x-2"><Switch id="showGallery" checked={webSettings.showGallery} onCheckedChange={(val) => handleWebSettingChange('showGallery', val)}/><Label htmlFor="showGallery">Mostrar Galería de Fotos</Label></div>
                        {webSettings.showGallery && (
                            <div className="pl-6 space-y-3 animate-in fade-in-50">
                                <Label>URLs de las Imágenes</Label>
                                {(webSettings.galleryImageUrls || []).map((url, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input value={url} onChange={(e) => updateGalleryImageUrl(index, e.target.value)} placeholder="https://.../foto.jpg"/>
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeGalleryImageUrl(index)}><Trash2 className="w-4 h-4"/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addGalleryImageUrl}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Imagen</Button>
                            </div>
                        )}
                    </div>
                    
                    <Separator/>
                    <div className="flex items-center space-x-2"><Switch id="showCountdown" checked={webSettings.showCountdown} onCheckedChange={(val) => handleWebSettingChange('showCountdown', val)}/><Label htmlFor="showCountdown">Mostrar Cuenta Regresiva</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="showEventDetails" checked={webSettings.showEventDetails} onCheckedChange={(val) => handleWebSettingChange('showEventDetails', val)}/><Label htmlFor="showEventDetails">Mostrar Detalles del Evento (Fecha, Lugar, Mapa)</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="showRsvp" checked={webSettings.showRsvp} onCheckedChange={(val) => handleWebSettingChange('showRsvp', val)}/><Label htmlFor="showRsvp">Mostrar Formulario de RSVP</Label></div>
                </AccordionContent>
            </AccordionItem>

            {/* CLIENT PORTAL SETTINGS */}
            <AccordionItem value="portal" className="border rounded-lg shadow-sm">
                 <AccordionTrigger className="p-4 text-lg font-headline text-primary hover:no-underline"><div className="flex items-center gap-2"><Lock className="w-5 h-5"/>Configuración del Portal del Cliente</div></AccordionTrigger>
                 <AccordionContent className="p-4 border-t space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                        <Label htmlFor="portal-enabled" className="text-base font-medium">Activar Portal del Cliente</Label>
                        <Switch id="portal-enabled" checked={clientSettings.enabled} onCheckedChange={(val) => setClientSettings(p => ({...p, enabled: val}))} />
                    </div>
                    {clientSettings.enabled && (
                        <div className="space-y-2 animate-in fade-in-50"><Label htmlFor="portal-key">Contraseña de Acceso (Opcional)</Label><Input id="portal-key" type="text" value={clientSettings.accessKey || ''} onChange={(e) => setClientSettings(p => ({...p, accessKey: e.target.value}))} placeholder="Dejar vacío para acceso libre"/></div>
                    )}
                    <Separator/>
                    <h4 className="font-medium text-muted-foreground">Visibilidad de Módulos en el Portal</h4>
                    <div className="space-y-4">
                        {(Object.keys(moduleLabels) as PortalModule[]).map(key => {
                            const module = moduleLabels[key];
                            const moduleState = clientSettings[key] as { visible: boolean; editable?: boolean };
                            return (
                                <div key={key} className="p-3 border rounded-md">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={`visible-${key}`} className="flex flex-col space-y-1"><span className="font-medium">{module.title}</span><span className="text-xs font-normal leading-snug text-muted-foreground">{module.desc}</span></Label>
                                        <Switch id={`visible-${key}`} checked={moduleState?.visible || false} onCheckedChange={(val) => handleClientSettingToggle(key, 'visible', val)} />
                                    </div>
                                    {module.edit && moduleState?.visible && (
                                        <div className="flex items-center gap-2 pl-4 mt-3 pt-3 border-t"><Checkbox id={`editable-${key}`} checked={moduleState?.editable || false} onCheckedChange={(val) => handleClientSettingToggle(key, 'editable', !!val)}/><Label htmlFor={`editable-${key}`} className="text-xs font-normal">Permitir que el cliente edite</Label></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                 </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="flex justify-end pt-6 border-t mt-6">
            <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
            </Button>
        </div>
      </form>
    </div>
  );
}
