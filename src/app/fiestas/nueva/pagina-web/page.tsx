
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Link as LinkIcon, ClipboardCopy, Gift, Camera, Music, Check, Eye, Smartphone, Tablet, Monitor, Download, AlertTriangle, Settings2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
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
import { getInvitationTemplates } from '@/app/actions/invitacion-digital-templates';
import { ControlPanel } from '@/components/invitacion/edit/ControlPanel';
import { SectionEditorPanel } from '@/components/invitacion/edit/SectionEditorPanel';
import Link from 'next/link';
import { Card, CardDescription } from '@/components/ui/card';
import QRCodeStylized from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
            const oldIndex = prev.secciones.findIndex(s => s.id === active.id);
            const newIndex = prev.secciones.findIndex(s => s.id === over.id);
            return { ...prev, secciones: arrayMove(prev.secciones, oldIndex, newIndex) };
        });
    }
  };

  const handleSave = async () => {
    if (!fiesta || fiestaId === 'template_preview') {
      toast({ title: 'Guardado no disponible', description: 'No se puede guardar una vista previa de plantilla. Personaliza el evento directamente.' });
      return;
    };
    setIsSaving(true);
    try {
      const result = await saveFiesta({ ...fiesta, invitacionDigital: invitacionData, invitacionConfig });
      if (result.success) {
        toast({ title: "¡Guardado!", description: "Los cambios en la página del evento han sido guardados." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const addSection = (tipo: SeccionInvitacion['tipo']) => {
    const defaultSeccion = defaultInvitacionDigitalData.secciones.find(s => s.tipo === tipo);
    if (defaultSeccion) {
      const newSeccion = { ...cloneDeep(defaultSeccion), id: `${tipo}_${Date.now()}` };
      handleUpdate({ secciones: [...invitacionData.secciones, newSeccion] });
    }
  };

  const removeSection = (idToRemove: string) => {
    handleUpdate({ secciones: invitacionData.secciones.filter(s => s.id !== idToRemove) });
    if(selectedSectionId === idToRemove) setSelectedSectionId(null);
  };
  
  const getFullLink = (path: string, hash?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseUrl || !fiestaId) return '';
    return `${baseUrl}${path.replace('[fiestaId]', fiestaId)}${hash ? `#${hash}` : ''}`;
  }

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
            <Link href={fiestaId ? `/evento/actual?fiestaId=${fiestaId}` : '#'} target="_blank" className="hidden xs:block">
              <Button variant="outline" className="rounded-xl font-bold h-9"><Eye className="w-4 h-4 mr-2"/>Ver Real</Button>
            </Link>
           <Button onClick={handleSave} disabled={isSaving || fiestaId === 'template_preview'} className="rounded-xl font-bold h-9 shadow-lg shadow-primary/20">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 sm:mr-2"/>}
                <span className="hidden sm:inline">Guardar</span>
            </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">
        <div className="w-full md:w-[320px] lg:w-[400px] flex-shrink-0 border-b md:border-b-0 md:border-r bg-white overflow-y-auto custom-scrollbar shadow-xl z-40 max-h-[45vh] md:max-h-none">
            {/* Editor mode toggle */}
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
                />
                {fiesta && (
                  <div className="p-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground">Enlace de Invitación</Label>
                      <div className="flex items-center gap-2">
                        <Input value={getFullLink('/invitacion/[fiestaId]')} readOnly className="h-9 text-xs bg-slate-50 rounded-xl" />
                        <Button size="icon" variant="secondary" className="rounded-xl h-9 w-9 shrink-0" onClick={() => handleCopyToClipboard(getFullLink('/invitacion/[fiestaId]'))}><ClipboardCopy className="h-4 w-4" /></Button>
                      </div>
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
                                    <Input value={getFullLink('/evento/actual', 'regalos')} readOnly className="h-10 text-xs bg-slate-50 border-none rounded-xl" />
                                    <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shrink-0" onClick={() => handleCopyToClipboard(getFullLink('/evento/actual', 'regalos'))}><ClipboardCopy className="h-4 w-4" /></Button>
                                </div>
                                <div className="text-center mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <QRCodeStylized id="qr-regalos" value={getFullLink('/evento/actual', 'regalos')} size={100} level="M" />
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
        
        {/* LIENZO DE PREVISUALIZACIÓN CON MARCO DE DISPOSITIVO */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-8 flex justify-center items-start bg-slate-200 custom-scrollbar">
          <div className={cn(
              "transition-all duration-700 ease-in-out shadow-3xl bg-white relative overflow-hidden",
              previewMode === 'mobile' && "w-[320px] h-[568px] xs:w-[375px] xs:h-[667px] md:w-[390px] md:h-[844px] rounded-[2rem] md:rounded-[3rem] border-[8px] md:border-[12px] border-slate-900 mt-4 md:mt-10",
              previewMode === 'tablet' && "w-full max-w-[768px] h-[1024px] rounded-[2rem] border-[12px] border-slate-900 mt-4",
              previewMode === 'desktop' && "w-full max-w-full h-full rounded-lg"
          )}>
            {(previewMode === 'mobile' || previewMode === 'tablet') && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-[60] flex items-center justify-center">
                    <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20"/></div>
            ) : fiesta ? (
              <div className={cn("h-full", previewMode !== 'desktop' && "overflow-y-auto custom-scrollbar")}>
                {editorMode === 'simple' && fiestaId ? (
                  <InvitacionPublicaClient config={invitacionConfig} fiestaId={fiestaId} />
                ) : (
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                      <SortableContext items={invitacionData.secciones.map(s => s.id)} strategy={verticalListSortingStrategy}>
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
