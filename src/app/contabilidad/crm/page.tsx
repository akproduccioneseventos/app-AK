
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Loader2, AlertTriangle, KanbanSquare, Users, CalendarDays, UserCog, Clock, ChevronLeft, ChevronRight, TrendingUp, UserRoundCheck, UserRoundX, Wallet, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead, CrmStage } from '@/types/crm';
import { getCrmLeads, getCrmStages, moveCrmLead, deleteCrmLead, convertToClientAndMoveProspect, getCrmKpiData } from '@/app/actions/crm';
import { CrmStageColumn } from '@/components/crm/CrmStageColumn';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { ConvertToClientDialog } from '@/components/crm/ConvertToClientDialog';
import { ScheduleMeetingDialog } from '@/components/crm/ScheduleMeetingDialog'; 
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
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CrmLeadCard } from '@/components/crm/CrmLeadCard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(value);
};

export default function CrmPage() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  
  const [leadToConvert, setLeadToConvert] = useState<CrmLead | null>(null);
  const [isConvertToClientModalOpen, setIsConvertToClientModalOpen] = useState(false);
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [leadForMeeting, setLeadForMeeting] = useState<CrmLead | null>(null);
  const [meetingType, setMeetingType] = useState<'Entrevista' | 'Firma de Contrato'>('Entrevista');

  const isMobile = useIsMobile();
  
  const sensors = useSensors(useSensor(PointerSensor));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stagesData, leadsData, occupiedDatesStrings, crmKpis] = await Promise.all([
        getCrmStages(),
        getCrmLeads(),
        getOcupiedDates(),
        getCrmKpiData(),
      ]);
      const sortedStages = stagesData.sort((a,b) => a.order - b.order);
      setStages(sortedStages);
      const sortedLeads = leadsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(sortedLeads);
      if (crmKpis.success) {
        setKpiData(crmKpis.data);
      }
      setOccupiedDates(occupiedDatesStrings.map(d => new Date(d)));
    } catch (err: any) {
      console.error("Error fetching CRM data:", err);
      setError("No se pudieron cargar los datos del CRM.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMeetingSubmit = async (meetingDate: string) => {
    if (!leadForMeeting) return;

    // Optimistically update the moved lead in the UI
    const targetStageId = leadForMeeting.currentStageId;
    setLeads(currentLeads =>
        currentLeads.map(lead =>
          lead.id === leadForMeeting.id ? { ...lead, currentStageId: targetStageId, followUpDate: meetingDate } : lead
        )
    );

    try {
      const result = await moveCrmLead(leadForMeeting.id, targetStageId, meetingDate);
      if (result.success) {
        toast({ description: `Reunión agendada para "${leadForMeeting.name}".` });
        fetchData(); // Full refresh to get all data consistent from server
      } else {
        throw new Error(result.error);
      }
    } catch(e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
       fetchData(); // Rollback on error
    }
    setIsMeetingModalOpen(false);
    setLeadForMeeting(null);
  };
  
  const moveLeadAndUpdate = async (leadId: string, newStageId: string) => {
    const originalLeads = [...leads];
    setLeads(currentLeads =>
        currentLeads.map(lead =>
          lead.id === leadId ? { ...lead, currentStageId: newStageId, updatedAt: new Date().toISOString() } : lead
        )
    );

    try {
      const result = await moveCrmLead(leadId, newStageId);
      if (!result.success || !result.lead) {
        throw new Error(result.error || "No se pudo mover el prospecto.");
      }
      toast({ description: `Prospecto "${result.lead.name}" movido a "${result.lead.history?.[result.lead.history.length-1]?.stageName || ''}".` });
      // Update the specific lead in the state to reflect all server-side changes (like notes)
      setLeads(currentLeads => currentLeads.map(l => l.id === leadId ? result.lead! : l));

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLeads(originalLeads); // Rollback on error
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeLeadId = active.id as string;
      const newStageId = over.id as string;
      
      const leadToMove = leads.find(l => l.id === activeLeadId);
      const targetStage = stages.find(s => s.id === newStageId);

      if (!leadToMove || !targetStage) return;

      if (targetStage.name.toLowerCase().includes('entrevista')) {
        setLeadForMeeting({ ...leadToMove, currentStageId: newStageId });
        setMeetingType('Entrevista');
        setIsMeetingModalOpen(true);
        return;
      }
      if (targetStage.isConversionStage) {
        setLeadToConvert(leadToMove);
        setIsConvertToClientModalOpen(true);
        return; 
      }

      await moveLeadAndUpdate(activeLeadId, newStageId);
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

  const leadsByStage = useMemo(() => stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.currentStageId === stage.id);
    return acc;
  }, {} as Record<string, CrmLead[]>), [stages, leads]);

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
            <Link href="/fiestas/nueva/reuniones" passHref>
                <Button variant="outline"><Clock className="w-4 h-4 mr-2"/>Ver Agenda de Reuniones</Button>
            </Link>
            <Link href="/settings/accesos-personal" passHref>
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiCard title="Valor del Pipeline" value={formatCurrency(kpiData?.pipelineValue)} icon={Wallet} isLoading={isLoading} description="Suma de presupuestos activos."/>
            <KpiCard title="Prospectos Activos" value={kpiData?.activeLeads} icon={Users} isLoading={isLoading} description="Potenciales clientes en el embudo."/>
            <KpiCard title="Tasa de Conversión" value={`${(kpiData?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} isLoading={isLoading} description="De prospectos a clientes."/>
            <KpiCard title="Ganados vs. Perdidos" value={`${kpiData?.wonLeads ?? 0} / ${kpiData?.lostLeads ?? 0}`} icon={CheckCircle} isLoading={isLoading} description="Clientes confirmados vs. no contratados."/>
        </div>
        <Separator className="mb-6"/>

        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">No hay etapas definidas en el CRM.</p>
              <p className="text-sm text-muted-foreground">Verifica la configuración en `src/app/actions/crm.ts`.</p>
          </div>
        ) : isMobile ? (
             <Accordion type="multiple" defaultValue={stages.map(s => s.id)} className="w-full space-y-3">
              {stages.map((stage, stageIndex) => {
                const stageLeads = leadsByStage[stage.id] || [];
                return (
                  <AccordionItem key={stage.id} value={stage.id} className="border-l-4 rounded-md overflow-hidden bg-card shadow-sm" style={{borderColor: stage.borderColor}}>
                    <AccordionTrigger className={`px-4 py-3 text-left hover:no-underline ${stage.headerBgColor} ${stage.headerTextColor}`}>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold">{stage.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor}`}>{stageLeads.length}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 space-y-2 bg-muted/30">
                       {stageLeads.length > 0 ? stageLeads.map(lead => (
                        <CrmLeadCard
                          key={lead.id}
                          lead={lead}
                          onDeleteLead={handleDeleteLead}
                          isDeleting={deletingLeadId === lead.id}
                          isMobile={true}
                          onMove={async (direction) => {
                            const nextStageIndex = stageIndex + direction;
                            if (nextStageIndex >= 0 && nextStageIndex < stages.length) {
                              await moveLeadAndUpdate(lead.id, stages[nextStageIndex].id);
                            }
                          }}
                        />
                       )) : <p className="p-4 text-center text-sm text-muted-foreground">No hay prospectos en esta etapa.</p>}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
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
        {leadForMeeting && (
            <ScheduleMeetingDialog
                isOpen={isMeetingModalOpen}
                onOpenChange={setIsMeetingModalOpen}
                leadName={leadForMeeting.name}
                meetingType={meetingType}
                onSubmit={handleMeetingSubmit}
                onClose={() => setLeadForMeeting(null)}
            />
        )}
      </div>
    </DndContext>
  );
}
