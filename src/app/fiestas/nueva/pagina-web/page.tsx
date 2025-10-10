
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Sparkles, PlusCircle, AlertTriangle, GripVertical, Handshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, InvitacionDigitalData, SeccionInvitacion, ColorPalette } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { merge, cloneDeep } from 'lodash';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SeccionBienvenida } from '@/components/invitacion/edit/SeccionBienvenida';
import { SeccionCabecera } from '@/components/invitacion/edit/SeccionCabecera';
import { SeccionConfirmacion } from '@/components/invitacion/edit/SeccionConfirmacion';
import { SeccionCuentaRegresiva } from '@/components/invitacion/edit/SeccionCuentaRegresiva';
import { SeccionDetallesEvento } from '@/components/invitacion/edit/SeccionDetallesEvento';
import { SeccionDressCode } from '@/components/invitacion/edit/SeccionDressCode';
import { SeccionGaleria } from '@/components/invitacion/edit/SeccionGaleria';
import { SeccionHistoria } from '@/components/invitacion/edit/SeccionHistoria';
import { SeccionInstagram } from '@/components/invitacion/edit/SeccionInstagram';
import { SeccionItinerario } from '@/components/invitacion/edit/SeccionItinerario';
import { SeccionRegalos } from '@/components/invitacion/edit/SeccionRegalos';
import { SeccionDespedida } from '@/components/invitacion/edit/SeccionDespedida';
import { ControlPanel } from '@/components/invitacion/edit/ControlPanel';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraziaTemplate } from '@/app/evento/actual/page';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection } from '@/types/settings';


function SortableSection({ id, children }: { id: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="relative group/section">
            <div {...attributes} {...listeners} className="absolute -left-8 top-1/2 -translate-y-1/2 z-10 cursor-grab p-2 opacity-0 group-hover/section:opacity-50 transition-opacity">
                <GripVertical className="w-5 h-5" />
            </div>
            {children}
        </div>
    );
}

function PaginaWebPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fiestaId = searchParams.get('fiestaId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (!fiestaId) {
      toast({ title: "Error", description: "ID de fiesta no encontrado.", variant: "destructive" });
      router.replace('/eventos');
      return;
    }
    try {
      const [data, socialData] = await Promise.all([
        getFiestaById(fiestaId),
        getSocialConnections(),
      ]);

      if (!data) throw new Error("Fiesta no encontrada");

      setFiesta(data);
      const mergedData = merge(cloneDeep(defaultInvitacionDigitalData), data.invitacionDigital);
      setInvitacionData(mergedData);
      setSocialConnections(socialData);
    } catch (e: any) {
      toast({ title: "Error", description: `No se pudieron cargar los datos: ${e.message}`, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = (newData: Partial<InvitacionDigitalData>) => {
    setInvitacionData(prev => ({...prev, ...newData}));
  };
  
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
        toast({ title: "¡Guardado!", description: "Los cambios en la invitación han sido guardados." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderSectionEditor = (seccion: SeccionInvitacion) => {
    const props = { data: seccion.data, update: handleUpdate, fiesta: fiesta };
    switch (seccion.tipo) {
        case 'cabecera': return <SeccionCabecera {...props as any} />;
        case 'bienvenida': return <SeccionBienvenida {...props as any} />;
        case 'cuentaRegresiva': return <SeccionCuentaRegresiva {...props as any} />;
        case 'detallesEvento': return <SeccionDetallesEvento {...props as any} />;
        case 'itinerario': return <SeccionItinerario {...props as any} />;
        case 'dressCode': return <SeccionDressCode {...props as any} />;
        case 'galeria': return <SeccionGaleria {...props as any} />;
        case 'historia': return <SeccionHistoria {...props as any} />;
        case 'regalos': return <SeccionRegalos {...props as any} />;
        case 'instagram': return <SeccionInstagram {...props as any} />;
        case 'confirmacion': return <SeccionConfirmacion {...props as any} />;
        case 'despedida': return <SeccionDespedida {...props as any} />;
        default: return null;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-muted">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Constructor Visual de Invitación</h1>
        <div className="flex items-center gap-2">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
            </Link>
           <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}Guardar</Button>
        </div>
      </header>
      <main className="flex-grow flex min-h-0">
        <div className="w-1/3 min-w-[350px] border-r">
          <ScrollArea className="h-full">
            <ControlPanel data={invitacionData} update={handleUpdate} />
             <div className="p-4 space-y-2">
                <DndContext sensors={[]} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                    <SortableContext items={invitacionData.secciones.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {invitacionData.secciones.map(seccion => (
                            <SortableSection key={seccion.id} id={seccion.id}>
                                {renderSectionEditor(seccion)}
                            </SortableSection>
                        ))}
                    </SortableContext>
                </DndContext>
             </div>
          </ScrollArea>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin"/></div>
          ) : fiesta ? (
             <ScrollArea className="h-full w-full bg-background rounded-md shadow-inner">
                <div className="w-full h-full">
                    <GraziaTemplate 
                        fiesta={fiesta} 
                        invitacionData={invitacionData} 
                        socialConnections={socialConnections}
                        isPreview={true} // Important: tells template to behave as preview
                    />
                </div>
              </ScrollArea>
          ) : (
             <div className="flex items-center justify-center h-full"><AlertTriangle className="w-8 h-8 text-destructive"/></div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PaginaWebYPortalPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Cargando constructor...</p>
            </div>
        }>
            <PaginaWebPageContent />
        </Suspense>
    );
}
