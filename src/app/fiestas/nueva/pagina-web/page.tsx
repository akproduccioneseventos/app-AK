
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Sparkles, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, InvitacionDigitalData, SeccionInvitacion } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { getInvitationTemplates, saveInvitationTemplate, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import { merge, cloneDeep } from 'lodash';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error("Fiesta no encontrada");
      setFiesta(data);
      const mergedData = merge(cloneDeep(defaultInvitacionDigitalData), data.invitacionDigital);
      setInvitacionData(mergedData);
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
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (!fiesta) {
    return <div className="text-center p-8">No se pudo cargar la información del evento.</div>;
  }
  
  const renderSection = (seccion: SeccionInvitacion) => {
    const props = { data: seccion.data, update: handleUpdate, fiesta: fiesta };
    switch (seccion.tipo) {
        case 'cabecera': return <SeccionCabecera {...props} />;
        case 'bienvenida': return <SeccionBienvenida {...props} />;
        case 'cuentaRegresiva': return <SeccionCuentaRegresiva {...props} />;
        case 'detallesEvento': return <SeccionDetallesEvento {...props} />;
        case 'itinerario': return <SeccionItinerario {...props} />;
        case 'dressCode': return <SeccionDressCode {...props} />;
        case 'galeria': return <SeccionGaleria {...props} />;
        case 'historia': return <SeccionHistoria {...props} />;
        case 'regalos': return <SeccionRegalos {...props} />;
        case 'instagram': return <SeccionInstagram {...props} />;
        case 'confirmacion': return <SeccionConfirmacion {...props} />;
        case 'despedida': return <SeccionDespedida {...props} />;
        default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-background">
        <h1 className="text-xl font-bold">Constructor de Invitación</h1>
        <div className="flex items-center gap-2">
           <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm">Volver</Button></Link>
           <Button onClick={handleSave} disabled={isSaving} size="sm">{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}Guardar</Button>
        </div>
      </header>
      <main className="flex-grow flex min-h-0">
        <div className="w-1/4 min-w-[300px] border-r overflow-y-auto">
          <ControlPanel data={invitacionData} update={handleUpdate} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
           <div className="max-w-2xl mx-auto bg-background p-4 shadow-lg rounded-md">
                <DndContext sensors={[]} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                    <SortableContext items={invitacionData.secciones.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {invitacionData.secciones.map(seccion => (
                            <SortableSection key={seccion.id} id={seccion.id}>
                                {renderSection(seccion)}
                            </SortableSection>
                        ))}
                    </SortableContext>
                </DndContext>
           </div>
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

