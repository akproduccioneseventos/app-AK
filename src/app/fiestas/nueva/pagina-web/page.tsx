
'use client';

import React, { useState, useEffect, useCallback, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Sparkles, PlusCircle, AlertTriangle, GripVertical, Settings2, Eye, LayoutGrid, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, InvitacionDigitalData, SeccionInvitacion } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { merge, cloneDeep } from 'lodash';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GraziaTemplate } from '@/components/invitacion/templates/GraziaTemplate';
import { AllegriaTemplate } from '@/components/invitacion/templates/AllegriaTemplate';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection } from '@/types/settings';
import { getInvitationTemplates, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import { ControlPanel } from '@/components/invitacion/edit/ControlPanel';
import { SectionEditorPanel } from '@/components/invitacion/edit/SectionEditorPanel';
import Link from 'next/link';

function PaginaWebPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fiestaId = searchParams.get('fiestaId');
  const templateId = searchParams.get('templateId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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
        // Create a dummy fiesta object for previewing templates
        setFiesta({ ...defaultInvitacionDigitalData, id: 'template_preview', configuracion: { nombreEvento: data.name, tipoCelebracion: 'Boda', fechaEvento: new Date().toISOString() } } as FiestaEnPlanificacion);
      } else {
        throw new Error("ID no proporcionado");
      }

      const mergedData = merge(cloneDeep(defaultInvitacionDigitalData), data?.invitacionDigital || data);
      setInvitacionData(mergedData);
      setSocialConnections(socialData);

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
    if (!fiesta) return;
    setIsSaving(true);
    try {
      const result = await saveFiesta({ ...fiesta, invitacionDigital: invitacionData });
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

  const renderTemplate = () => {
    if(!fiesta) return null;

    const props = {
      fiesta,
      invitacionData,
      socialConnections,
      isPreview: true,
      onSectionClick: setSelectedSectionId,
      onUpdate: handleUpdate,
      selectedSectionId,
    };
    
    switch(invitacionData.plantilla) {
      case 'Grazia':
        return <GraziaTemplate {...props} />;
      case 'Allegria':
        return <AllegriaTemplate {...props} />;
      default:
        return <GraziaTemplate {...props} />; // Fallback a Grazia
    }
  };
  
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-muted">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-background shadow-sm">
        <h1 className="text-lg font-semibold">{fiesta ? `Editando: ${fiesta.configuracion.nombreEvento}` : 'Editando Plantilla'}</h1>
        <div className="flex items-center gap-2">
            <Link href={fiestaId ? `/evento/actual?fiestaId=${fiestaId}` : '#'} target="_blank" passHref>
              <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2"/>Vista Previa</Button>
            </Link>
            <Link href={fiestaId ? `/fiestas/nueva?fiestaId=${fiestaId}` : '/settings/templates/invitaciones'} passHref>
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
            </Link>
           <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}Guardar</Button>
        </div>
      </header>
      <main className="flex-grow flex min-h-0">
        {/* Left Panel */}
        <div className="w-[380px] flex-shrink-0 border-r bg-background overflow-y-auto">
            {!selectedSectionId ? (
                <ControlPanel
                    data={invitacionData}
                    update={handleUpdate}
                    addSection={addSection}
                    removeSection={removeSection}
                    onSectionClick={setSelectedSectionId}
                />
            ) : (
                <SectionEditorPanel
                    data={invitacionData}
                    update={handleUpdate}
                    selectedSectionId={selectedSectionId}
                    fiestaId={fiestaId}
                    onClose={() => setSelectedSectionId(null)}
                />
            )}
        </div>
        
        {/* Center Panel (Preview) */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-200">
          <div className="w-full max-w-[500px] min-w-[380px] shadow-2xl rounded-lg overflow-hidden bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin"/></div>
            ) : fiesta ? (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                  <SortableContext items={invitacionData.secciones.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      {renderTemplate()}
                  </SortableContext>
              </DndContext>
            ) : (
               <div className="flex items-center justify-center h-full"><AlertTriangle className="w-8 h-8 text-destructive"/></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando constructor...</p></div>}>
            <PaginaWebPageContent />
        </Suspense>
    );
}
