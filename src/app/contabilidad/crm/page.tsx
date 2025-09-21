
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Loader2, AlertTriangle, KanbanSquare, Users, CalendarDays, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead, CrmStage } from '@/types/crm';
import { getCrmLeads, getCrmStages, moveCrmLead, deleteCrmLead, convertToClientAndMoveProspect } from '@/app/actions/crm';
import { CrmStageColumn } from '@/components/crm/CrmStageColumn';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { ConvertToClientDialog } from '@/components/crm/ConvertToClientDialog';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { getOcupiedDates } from '@/app/actions/agenda';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


export default function CrmPage() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  
  const [leadToConvert, setLeadToConvert] = useState<CrmLead | null>(null);
  const [isConvertToClientModalOpen, setIsConvertToClientModalOpen] = useState(false);
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);


  const isMobile = useIsMobile();
  const [mobileVisibleStageId, setMobileVisibleStageId] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stagesData, leadsData, occupiedDatesStrings] = await Promise.all([
        getCrmStages(),
        getCrmLeads(),
        getOcupiedDates(),
      ]);
      const sortedStages = stagesData.sort((a,b) => a.order - b.order);
      setStages(sortedStages);
      setLeads(leadsData);
      setOccupiedDates(occupiedDatesStrings.map(d => new Date(d)));
      if(sortedStages.length > 0 && !mobileVisibleStageId) {
        setMobileVisibleStageId(sortedStages[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching CRM data:", err);
      setError("No se pudieron cargar los datos del CRM.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, mobileVisibleStageId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeLeadId = active.id as string;
      const newStageId = over.id as string;
      
      const originalLeads = [...leads];
      const leadToMove = originalLeads.find(l => l.id === activeLeadId);
      const targetStage = stages.find(s => s.id === newStageId);

      if (!leadToMove || !targetStage) return;

      if (targetStage.isConversionStage) {
        setLeadToConvert(leadToMove);
        setIsConvertToClientModalOpen(true);
        return; 
      }

      setLeads(currentLeads =>
        currentLeads.map(lead =>
          lead.id === activeLeadId ? { ...lead, currentStageId: newStageId, updatedAt: new Date().toISOString() } : lead
        )
      );

      try {
        const result = await moveCrmLead(activeLeadId, newStageId);
        if (!result.success) {
          throw new Error(result.error || "No se pudo mover el prospecto.");
        }
        toast({ description: `Prospecto "${result.lead?.name}" movido.` });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLeads(originalLeads); // Rollback on error
      }
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    setDeletingLeadId(leadId);
     const leadToDelete = leads.find(l => l.id === leadId);
    try {
      const result = await deleteCrmLead(leadId);
      if (result.success) {
        toast({ description: `Prospecto "${leadToDelete?.name || 'seleccionado'}" eliminado.`, variant: "destructive" });
        await fetchData();
      } else {
        throw new Error(result.error || "No se pudo eliminar el prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleConversionSubmit = async (formData: FormData) => {
    if (!leadToConvert) return false;
    formData.append('prospectId', leadToConvert.id);
    formData.append('prospectName', leadToConvert.name);
    if (leadToConvert.email) formData.append('email', leadToConvert.email);
    if (leadToConvert.phone) formData.append('phone', leadToConvert.phone);

    setIsLoading(true);
    try {
      const result = await convertToClientAndMoveProspect(formData);
      if (result.success) {
        toast({ title: "Conversión Exitosa", description: `Prospecto "${leadToConvert.name}" convertido a cliente y movido.` });
        setIsConvertToClientModalOpen(false);
        setLeadToConvert(null);
        await fetchData();
        return true;
      } else {
        toast({ title: "Error en Conversión", description: result.error || "No se pudo completar la conversión.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.currentStageId === stage.id);
    return acc;
  }, {} as Record<string, CrmLead[]>);

  if (isLoading && !isConvertToClientModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando CRM...</p>
      </div>
    );
  }

  if (error && !isConvertToClientModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-semibold mb-2">{error}</p>
        <Button onClick={fetchData} variant="outline">Reintentar</Button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Gestión de Prospectos (CRM)
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
             <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline"><CalendarDays className="w-4 h-4 mr-2"/>Ver Calendario</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Calendario de Eventos Ocupados</SheetTitle>
                  <SheetDescription>
                    Los días marcados en rojo ya tienen un evento confirmado. Evita agendar reuniones importantes en estas fechas para no generar conflictos.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 flex justify-center">
                  <DashboardCalendar occupiedDates={occupiedDates} />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/settings/account" passHref>
                <Button variant="secondary"><UserCog className="w-4 h-4 mr-2"/>Gestionar Accesos</Button>
            </Link>
            {stages.length > 0 && <AddLeadDialog stages={stages} onLeadAdded={fetchData} defaultStageId={stages[0].id} />}
            <Link href="/empresa/contabilidad" passHref>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
        
        {isMobile && mobileVisibleStageId && (
            <div className="mb-4">
                <Label htmlFor="stage-selector">Seleccionar Etapa</Label>
                <Select value={mobileVisibleStageId} onValueChange={setMobileVisibleStageId}>
                    <SelectTrigger id="stage-selector"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {stages.map(stage => (
                            <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}

        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">No hay etapas definidas en el CRM.</p>
              <p className="text-sm text-muted-foreground">Verifica la configuración en `src/app/actions/crm.ts`.</p>
          </div>
        ) : isMobile ? (
             <div className="flex-1 min-h-0">
                {stages.filter(s => s.id === mobileVisibleStageId).map(stage => (
                  <CrmStageColumn
                      key={stage.id}
                      stage={stage}
                      leads={leadsByStage[stage.id] || []}
                      onDeleteLead={handleDeleteLead}
                      deletingLeadId={deletingLeadId}
                  />
                ))}
             </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-4">
              {stages.map(stage => (
                  <CrmStageColumn
                      key={stage.id}
                      stage={stage}
                      leads={leadsByStage[stage.id] || []}
                      onDeleteLead={handleDeleteLead}
                      deletingLeadId={deletingLeadId}
                  />
              ))}
              </div>
              <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
        {leadToConvert && (
          <ConvertToClientDialog
            isOpen={isConvertToClientModalOpen}
            onOpenChange={setIsConvertToClientModalOpen}
            lead={leadToConvert}
            onSubmit={handleConversionSubmit}
            onClose={() => setLeadToConvert(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
