
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, ClipboardCopy, Gift, Eye, Smartphone, Tablet, Monitor, Download, AlertTriangle, Settings2, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, saveFiesta, updateInvitacionSlug } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, InvitacionDigitalData, InvitacionDigitalConfig, SeccionInvitacion } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { defaultInvitacionConfig, buildInvitacionConfigFromFiesta } from '@/lib/invitacion-config-defaults';
import { merge, cloneDeep } from 'lodash';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GraziaTemplate } from '@/components/invitacion/templates/GraziaTemplate';
import { AllegriaTemplate } from '@/components/invitacion/templates/AllegriaTemplate';
import { InvitacionPublicaClient } from '@/app/invitacion/[fiestaId]/invitacion-publica-client';
import { InvitacionConfigPanel } from '@/components/invitacion/InvitacionConfigPanel';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection } from '@/types/settings';
import { getInvitationTemplates, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import { ControlPanel } from '@/components/invitacion/edit/ControlPanel';
import { SectionEditorPanel } from '@/components/invitacion/edit/SectionEditorPanel';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import QRCodeStylized from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TemplatePickerGallery } from '@/components/invitacion/TemplatePickerGallery';
import { normalizeInvitationSlug } from '@/lib/invitacion-slug';
import { getErrorMessage } from '@/lib/error-utils';

type PreviewMode = 'mobile' | 'tablet' | 'desktop';
type EditorMode = 'simple' | 'avanzado';

function PaginaWebPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fiestaId = searchParams.get('fiestaId');
  const templateId = searchParams.get('templateId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [invitacionConfig, setInvitacionConfig] = useState<InvitacionDigitalConfig>(defaultInvitacionConfig);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [templates, setTemplates] = useState<InvitacionDigitalTemplate[]>([]);
  const [slugInput, setSlugInput] = useState('');
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const { isSaving, lastSaved, saveError, saveNow } = useAutoSave({
    data: { invitacionData, invitacionConfig },
    onSave: async ({ invitacionData: d, invitacionConfig: c }) => {
      if (!fiesta || !fiestaId || fiestaId === 'template_preview') return { success: false, error: 'Guardado no disponible en modo de vista previa' };
      return saveFiesta({ ...fiesta, invitacionDigital: d, invitacionConfig: c });
    },
    debounceMs: 2000,
    enabled: !!fiestaId && fiestaId !== 'template_preview' && !isLoading && !!fiesta,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (!fiestaId && !templateId) {
      toast({ title: "Error", description: "Se requiere un ID de fiesta o de plantilla.", variant: "destructive" });
      router.replace('/eventos');
      return;
    }
    
    try {
      let data;
      let socialData: SocialConnection[] = [];
      
      if(fiestaId) {
        [data, socialData] = await Promise.all([
            getFiestaById(fiestaId),
            getSocialConnections(),
        ]);
        if (!data) throw new Error("Fiesta no encontrada");
        setFiesta(data);
        setSlugInput((data as FiestaEnPlanificacion).invitacionSlug || fiestaId);
      } else if (templateId) {
        const templates = await getInvitationTemplates();
        data = templates.find(t => t.id === templateId);
        if(!data) throw new Error("Plantilla no encontrada");
        setFiesta({ ...defaultInvitacionDigitalData, id: 'template_preview', configuracion: { nombreEvento: data.name, tipoCelebracion: 'Boda', fechaEvento: new Date().toISOString() } } as unknown as FiestaEnPlanificacion);
      } else {
        throw new Error("ID no proporcionado");
      }

      const baseData = cloneDeep(defaultInvitacionDigitalData);
      const savedData = (data as any)?.invitacionDigital || data;
      const mergedData = merge(baseData, savedData);
      // Ensure secciones is always a valid array after merge
      // (it may be null/non-array from corrupted or very old saved data)
      if (!Array.isArray(mergedData.secciones)) {
        mergedData.secciones = cloneDeep(defaultInvitacionDigitalData.secciones);
      }
      
      if (fiestaId && data && (data as any).configuracion) {
          const config = (data as any).configuracion;
          const isXV = config.tipoCelebracion === 'XV años';

          mergedData.cabecera.protagonista1 = config.protagonista1Nombre || mergedData.cabecera.protagonista1;
          mergedData.cabecera.protagonista2 = isXV ? '' : (config.protagonista2Nombre || mergedData.cabecera.protagonista2);
          mergedData.cabecera.subtitulo.text = config.tipoCelebracion || mergedData.cabecera.subtitulo.text;

          if (!mergedData.bienvenida.titulo.text || 
              mergedData.bienvenida.titulo.text === '¡Nos Casamos!' || 
              mergedData.bienvenida.titulo.text === '¡Mis 15 Años!') {
              mergedData.bienvenida.titulo.text = isXV ? '¡Mis 15 Años!' : '¡Nos Casamos!';
          }

          if (config.fechaEvento) {
              if (mergedData.detallesEvento.ceremoniaReligiosa.visible) {
                  mergedData.detallesEvento.ceremoniaReligiosa.fecha = config.fechaEvento;
              }
              if (mergedData.detallesEvento.celebracion.visible) {
                  mergedData.detallesEvento.celebracion.fecha = config.fechaEvento;
              }
          }
      }

      setInvitacionData(mergedData);
      setSocialConnections(socialData);
      setTemplates(await getInvitationTemplates());

      // Load simplified config
      if (fiestaId && data) {
        const fiestaData = data as FiestaEnPlanificacion;
        if (fiestaData.configuracion) {
          const builtConfig = buildInvitacionConfigFromFiesta(fiestaData, fiestaData.invitacionConfig);
          setInvitacionConfig(builtConfig);
        }
      }

    } catch (e: any) {
      toast({ title: "Error", description: `No se pudieron cargar los datos: ${e.message}`, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, templateId, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = useCallback((newData: Partial<InvitacionDigitalData>) => {
    setInvitacionData(prev => ({...prev, ...newData}));
  }, []);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setInvitacionData(prev => {
            const oldIndex = (prev.secciones ?? []).findIndex(s => s.id === active.id);
            const newIndex = (prev.secciones ?? []).findIndex(s => s.id === over.id);
            return { ...prev, secciones: arrayMove(prev.secciones ?? [], oldIndex, newIndex) };
        });
    }
  };

  const handleSave = () => {
    if (!fiesta || fiestaId === 'template_preview') {
      toast({ title: 'Guardado no disponible', description: 'No se puede guardar una vista previa de plantilla. Personaliza el evento directamente.' });
      return;
    };
    saveNow();
  };

  const addSection = (tipo: SeccionInvitacion['tipo']) => {
    const defaultSeccion = defaultInvitacionDigitalData.secciones.find(s => s.tipo === tipo);
    if (defaultSeccion) {
      const newSeccion = { ...cloneDeep(defaultSeccion), id: `${tipo}_${Date.now()}` };
      handleUpdate({ secciones: [...(invitacionData.secciones ?? []), newSeccion] });
    }
  };

  const removeSection = (idToRemove: string) => {
    handleUpdate({ secciones: (invitacionData.secciones ?? []).filter(s => s.id !== idToRemove) });
    if(selectedSectionId === idToRemove) setSelectedSectionId(null);
  };
  
  const getFullLink = (path: string, hash?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseUrl || !fiestaId) return '';
    return `${baseUrl}${path.replace('[fiestaId]', fiestaId)}${hash ? `#${hash}` : ''}`;
  }

  const activeSlug = normalizeInvitationSlug(slugInput || fiesta?.invitacionSlug || fiestaId || '');
  const slugUrl = activeSlug ? getFullLink('/i/[fiestaId]').replace(`/i/${fiestaId}`, `/i/${activeSlug}`) : '';

  const getPublicInvitationLink = (hash?: string) => {
    const base = slugUrl || getFullLink('/invitacion/[fiestaId]');
    return hash ? `${base}#${hash}` : base;
  };

  const slugPrefixLabel = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseUrl) return 'tu-app.com/i/';
    try {
      return `${new URL(baseUrl).host}/i/`;
    } catch {
      return 'tu-app.com/i/';
    }
  }, []);

  const applyTemplate = (tpl: InvitacionDigitalTemplate) => {
    const palette = tpl.cabecera?.paletaColores;
    setInvitacionData(prev => ({
      ...prev,
      plantilla: tpl.plantilla,
      cabecera: palette ? { ...prev.cabecera, paletaColores: { ...palette } } : prev.cabecera,
    }));
    if (palette) {
      setInvitacionConfig(prev => ({
        ...prev,
        colorPrincipal: palette.primary,
        colorSecundario: palette.secondary,
        colorAcento: palette.accent,
        plantillaId: tpl.plantilla,
      }));
    }
    setTemplateGalleryOpen(false);
    toast({ title: 'Plantilla aplicada', description: `${tpl.name} está activa.` });
  };

  const handleSaveSlug = async () => {
    if (!fiestaId || fiestaId === 'template_preview') return;
    const normalized = normalizeInvitationSlug(slugInput);
    if (!normalized) {
      toast({ title: 'Slug inválido', description: 'El enlace debe contener solo letras, números y guiones.', variant: 'destructive' });
      return;
    }
    setIsSavingSlug(true);
    try {
      const result = await updateInvitacionSlug(fiestaId, normalized);
      if (!result.success || !result.slug) {
        throw new Error(result.error || 'No se pudo guardar el enlace.');
      }
      setSlugInput(result.slug);
      setFiesta(prev => (prev ? { ...prev, invitacionSlug: result.slug } : prev));
      toast({ title: 'Enlace guardado', description: 'Tu URL personalizada ya está disponible.' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error, 'No se pudo guardar el slug.'), variant: 'destructive' });
    } finally {
      setIsSavingSlug(false);
    }
  };

  const handleCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace Copiado" });
  };
  
  const downloadQR = (id: string, name: string) => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${name}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
  };

  const renderTemplate = () => {
    if(!fiesta) return null;

    const props = {
      fiesta,
      invitacionData,
      socialConnections,
      isPreview: true,
      onSectionClick: setSelectedSectionId,
      onUpdate: handleUpdate,
      onRsvpSubmit: undefined, 
      selectedSectionId,
    };
    
    switch(invitacionData.plantilla) {
      case 'Grazia':
        return <GraziaTemplate {...props} />;
      case 'Allegria':
        return <AllegriaTemplate {...props} />;
      default:
        return <GraziaTemplate {...props} />;
    }
  };

  const renderEditorPanel = () => (
    <div className="h-full bg-white overflow-y-auto custom-scrollbar">
      {fiestaId && !selectedSectionId && (
        <div className="p-3 border-b bg-slate-50/80 flex items-center gap-1">
          <Button
            variant={editorMode === 'simple' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEditorMode('simple')}
            className={cn("rounded-xl h-8 text-xs flex-1 gap-1.5", editorMode === 'simple' && "shadow-sm")}
          >
            <Wand2 className="w-3.5 h-3.5" />Config Rápida
          </Button>
          <Button
            variant={editorMode === 'avanzado' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEditorMode('avanzado')}
            className={cn("rounded-xl h-8 text-xs flex-1 gap-1.5", editorMode === 'avanzado' && "shadow-sm")}
          >
            <Settings2 className="w-3.5 h-3.5" />Avanzado
          </Button>
        </div>
      )}

      {selectedSectionId ? (
        <SectionEditorPanel
          data={invitacionData}
          update={handleUpdate}
          addSection={addSection}
          removeSection={removeSection}
          selectedSectionId={selectedSectionId}
          fiestaId={fiestaId}
          onClose={() => setSelectedSectionId(null)}
        />
      ) : editorMode === 'simple' && fiestaId ? (
        <>
          <InvitacionConfigPanel
            config={invitacionConfig}
            onChange={setInvitacionConfig}
            fiestaId={fiestaId}
          />
          {fiesta && (
            <div className="p-4 border-t space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Enlace personalizado</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{slugPrefixLabel}</span>
                  <Input
                    value={slugInput}
                    onChange={e => setSlugInput(normalizeInvitationSlug(e.target.value))}
                    placeholder="ej: fiesta-valentina"
                    className="h-9 text-sm"
                  />
                </div>
                <Button onClick={handleSaveSlug} size="sm" className="rounded-xl" disabled={isSavingSlug}>
                  {isSavingSlug ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar enlace
                </Button>
                <div className="flex items-center gap-2">
                  <Input value={slugUrl} readOnly className="h-9 text-xs bg-slate-50 rounded-xl" />
                  <Button size="icon" variant="secondary" className="rounded-xl h-9 w-9 shrink-0" onClick={() => handleCopyToClipboard(slugUrl)}>
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Link técnico de respaldo</Label>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Solo para uso interno o compatibilidad.</p>
                <Input value={getFullLink('/invitacion/[fiestaId]')} readOnly className="h-9 text-xs bg-slate-50 rounded-xl text-muted-foreground" />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ControlPanel
            data={invitacionData}
            update={handleUpdate}
            addSection={addSection}
            removeSection={removeSection}
            onSectionClick={setSelectedSectionId}
          />

          {fiestaId && fiesta && (
            <div className="p-6 space-y-6 border-t bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Marketing y QR</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Integra estos elementos en tus invitaciones físicas.</p>
              </div>
              <div className="space-y-4">
                {invitacionData.regalos.visible && (
                  <Card className="p-4 border-none shadow-sm rounded-2xl bg-white">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Lista de Regalos</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={getPublicInvitationLink('regalos')} readOnly className="h-10 text-xs bg-slate-50 border-none rounded-xl" />
                      <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shrink-0" onClick={() => handleCopyToClipboard(getPublicInvitationLink('regalos'))}><ClipboardCopy className="h-4 w-4" /></Button>
                    </div>
                    <div className="text-center mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <QRCodeStylized id="qr-regalos" value={getPublicInvitationLink('regalos')} size={100} level="M" />
                      <Button size="sm" variant="link" className="text-xs mt-2" onClick={() => downloadQR('qr-regalos', 'qr-regalos')}><Download className="w-3 h-3 mr-1"/>Descargar</Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50">
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white shadow-sm z-50">
        <div className="flex items-center gap-4">
            <Link href={fiestaId ? `/fiestas/nueva?fiestaId=${fiestaId}` : '/settings/templates/invitaciones'}>
                <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-lg md:text-xl font-black font-headline tracking-tight hidden sm:block">
                {fiesta ? `Constructor: ${fiesta.configuracion.nombreEvento}` : 'Editor de Plantilla'}
            </h1>
        </div>
        
        {/* SELECTOR DE DISPOSITIVOS - MEJORADO PARA VISIBILIDAD */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <Button 
                variant={previewMode === 'mobile' ? 'outline' : 'ghost'} 
                size="sm" 
                onClick={() => setPreviewMode('mobile')} 
                className={cn("rounded-xl h-9 px-3", previewMode === 'mobile' && "shadow-sm bg-white")}
            >
                <Smartphone className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Móvil</span>
            </Button>
            <Button 
                variant={previewMode === 'tablet' ? 'outline' : 'ghost'} 
                size="sm" 
                onClick={() => setPreviewMode('tablet')} 
                className={cn("rounded-xl h-9 px-3", previewMode === 'tablet' && "shadow-sm bg-white")}
            >
                <Tablet className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">Tablet</span>
            </Button>
            <Button 
                variant={previewMode === 'desktop' ? 'outline' : 'ghost'} 
                size="sm" 
                onClick={() => setPreviewMode('desktop')} 
                className={cn("rounded-xl h-9 px-3", previewMode === 'desktop' && "shadow-sm bg-white")}
            >
                <Monitor className="w-4 h-4 md:mr-2"/><span className="hidden md:inline">PC</span>
            </Button>
        </div>

        <div className="flex items-center gap-2">
            <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} saveError={saveError} className="hidden sm:flex" />
            <Button variant="outline" className="rounded-xl font-bold h-9" onClick={() => setTemplateGalleryOpen(true)}>
              <Sparkles className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Cambiar Plantilla</span>
            </Button>
            <Link href={fiestaId ? (slugUrl || getFullLink('/invitacion/[fiestaId]')) : '#'} target="_blank" className="hidden xs:block">
              <Button variant="outline" className="rounded-xl font-bold h-9"><Eye className="w-4 h-4 mr-2"/>Ver Real</Button>
            </Link>
           <Button onClick={handleSave} disabled={isSaving || fiestaId === 'template_preview'} className="rounded-xl font-bold h-9 shadow-lg shadow-primary/20">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 sm:mr-2"/>}
                <span className="hidden sm:inline">Guardar</span>
            </Button>
        </div>
      </header>

      <main className="flex-grow flex min-h-0 overflow-hidden">
        <div className="hidden md:block w-[320px] lg:w-[400px] flex-shrink-0 border-r bg-white shadow-xl z-40">
          {renderEditorPanel()}
        </div>

        {/* LIENZO DE PREVISUALIZACIÓN CON MARCO DE DISPOSITIVO */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-0 md:p-8 flex justify-center items-start bg-slate-200 custom-scrollbar">
          <div className={cn(
              "transition-all duration-700 ease-in-out shadow-3xl bg-white relative overflow-hidden w-full h-full",
              previewMode === 'mobile' && "md:w-[390px] md:h-[844px] md:rounded-[3rem] md:border-[12px] md:border-slate-900 md:mt-10",
              previewMode === 'tablet' && "md:w-full md:max-w-[768px] md:h-[1024px] md:rounded-[2rem] md:border-[12px] md:border-slate-900 md:mt-4",
              previewMode === 'desktop' && "md:w-full md:max-w-full md:h-full md:rounded-lg"
          )}>
            {(previewMode === 'mobile' || previewMode === 'tablet') && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-[60] items-center justify-center hidden md:flex">
                    <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20"/></div>
            ) : fiesta ? (
              <div className={cn("h-full", previewMode !== 'desktop' && "overflow-y-auto custom-scrollbar")}>
                {editorMode === 'simple' && fiestaId ? (
                  <InvitacionPublicaClient
                    config={invitacionConfig}
                    fiestaId={fiestaId}
                    socialConnections={socialConnections}
                    isEditorMode={true}
                    onConfigChange={setInvitacionConfig}
                  />
                ) : (
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                      <SortableContext items={(invitacionData.secciones ?? []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                          {renderTemplate()}
                      </SortableContext>
                  </DndContext>
                )}
              </div>
            ) : (
                <div className="flex items-center justify-center h-full"><AlertTriangle className="w-8 h-8 text-destructive"/></div>
            )}
          </div>
        </div>
      </main>

      {!mobileEditorOpen && (
        <button
          onClick={() => setMobileEditorOpen(true)}
          aria-label="Abrir editor de configuración"
          className="fixed bottom-6 left-6 z-50 flex md:hidden items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-2xl font-bold text-sm"
        >
          <Settings2 className="w-4 h-4" /> Editar
        </button>
      )}
      <Sheet open={mobileEditorOpen} onOpenChange={setMobileEditorOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0 md:hidden">
          {renderEditorPanel()}
        </SheetContent>
      </Sheet>

      <TemplatePickerGallery
        open={templateGalleryOpen}
        onOpenChange={setTemplateGalleryOpen}
        templates={templates}
        currentData={invitacionData}
        onApply={applyTemplate}
        tipoCelebracion={fiesta?.configuracion?.tipoCelebracion}
      />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <PaginaWebPageContent />
        </Suspense>
    );
}
