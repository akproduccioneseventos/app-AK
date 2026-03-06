
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Loader2, AlertTriangle, KanbanSquare, Users, CalendarDays, UserCog, Clock, ChevronLeft, ChevronRight, TrendingUp, UserRoundCheck, UserRoundX, Wallet, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead, CrmStage } from '@/types/crm';
import { getCrmLeads, getCrmStages, moveCrmLead, deleteCrmLead, confirmBooking, getCrmKpiData } from '@/app/actions/crm';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { CrmStageColumn } from '@/components/crm/CrmStageColumn';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { ScheduleMeetingDialog } from '@/components/crm/ScheduleMeetingDialog'; 
import { BookingConfirmationDialog } from '@/components/crm/BookingConfirmationDialog';
import { RegisterDepositDialog } from '@/components/crm/RegisterDepositDialog';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from '@/hooks/use-mobile';
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
import { getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

export default function CrmPage() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [leadForMeeting, setLeadForMeeting] = useState<CrmLead | null>(null);
  const [meetingType, setMeetingType] = useState<'Entrevista' | 'Firma de Contrato'>('Entrevista');

  // Booking Flow State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [leadToBook, setLeadToBook] = useState<CrmLead | null>(null);
  const [bookingPresupuestoInfo, setBookingPresupuestoInfo] = useState<any>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [newFiestaId, setNewFiestaId] = useState<string | null>(null);
  
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
      setStages(stagesData.sort((a,b) => a.order - b.order));
      setLeads(leadsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (crmKpis.success) setKpiData(crmKpis.data);
      setOccupiedDates(occupiedDatesStrings.map(d => new Date(d)));
    } catch (err: any) {
      setError("No se pudieron cargar los datos del CRM.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleHireClick = async (lead: CrmLead) => {
    if (!lead.presupuestoId) return;
    try {
      const pres = await getPresupuestoById(lead.presupuestoId);
      if (pres) {
        setBookingPresupuestoInfo({
          total: pres.totalConDescuento ?? pres.costoTotalEstimado,
          fecha: pres.eventoFecha,
          salon: pres.salonFiestas
        });
        setLeadToBook(lead);
        setIsBookingModalOpen(true);
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo obtener el presupuesto." });
    }
  };

  const handleBookingConfirmed = (fiestaId: string) => {
    setIsBookingModalOpen(false);
    setNewFiestaId(fiestaId);
    setIsDepositModalOpen(true);
  };

  const handleDepositCompleted = () => {
    setIsDepositModalOpen(false);
    fetchData();
    if (newFiestaId) router.push(`/fiestas/nueva?fiestaId=${newFiestaId}`);
  };

  const handleMeetingSubmit = async (meetingDate: string) => {
    if (!leadForMeeting) return;
    try {
      const result = await moveCrmLead(leadForMeeting.id, leadForMeeting.currentStageId, meetingDate);
      if (result.success) {
        toast({ description: `Reunión agendada para "${leadForMeeting.name}".` });
        fetchData(); 
      } else throw new Error(result.error);
    } catch(e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setIsMeetingModalOpen(false);
    setLeadForMeeting(null);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const leadToMove = leads.find(l => l.id === active.id);
      const targetStage = stages.find(s => s.id === over.id);
      if (!leadToMove || !targetStage) return;

      if (targetStage.name.toLowerCase().includes('entrevista')) {
        setLeadForMeeting({ ...leadToMove, currentStageId: targetStage.id });
        setMeetingType('Entrevista');
        setIsMeetingModalOpen(true);
        return;
      }
      if (targetStage.isConversionStage) {
        handleHireClick(leadToMove);
        return; 
      }

      const result = await moveCrmLead(leadToMove.id, targetStage.id);
      if (result.success) fetchData();
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    setDeletingLeadId(leadId);
    try {
      const result = await deleteCrmLead(leadId);
      if (result.success) {
        toast({ description: `Prospecto eliminado.`, variant: "destructive" });
        await fetchData();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const leadsByStage = useMemo(() => stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.currentStageId === stage.id);
    return acc;
  }, {} as Record<string, CrmLead[]>), [stages, leads]);

  if (isLoading && !isBookingModalOpen) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">CRM de Prospectos</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/contabilidad/crm/agenda" passHref><Button variant="outline"><Clock className="w-4 h-4 mr-2"/>Agenda</Button></Link>
            {stages.length > 0 && <AddLeadDialog stages={stages} onLeadAdded={fetchData} defaultStageId={stages[0].id} />}
            <Link href="/empresa/contabilidad" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiCard title="Propuestas Activas" value={formatCurrency(kpiData?.pipelineValue)} icon={Wallet} isLoading={isLoading}/>
            <KpiCard title="Prospectos" value={kpiData?.activeLeads} icon={Users} isLoading={isLoading}/>
            <KpiCard title="Tasa Conversión" value={`${(kpiData?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} isLoading={isLoading}/>
            <KpiCard title="Ganados/Perdidos" value={`${kpiData?.wonLeads ?? 0}/${kpiData?.lostLeads ?? 0}`} icon={CheckCircle} isLoading={isLoading}/>
        </div>

        {isMobile ? (
             <Accordion type="multiple" defaultValue={stages.map(s => s.id)} className="space-y-3">
              {stages.map((stage, idx) => (
                  <AccordionItem key={stage.id} value={stage.id} className="border rounded-md bg-card shadow-sm" style={{borderColor: stage.borderColor}}>
                    <AccordionTrigger className={cn("px-4 py-3", stage.headerBgColor, stage.headerTextColor)}>
                      <div className="flex justify-between w-full pr-4">
                        <span>{stage.name}</span>
                        <Badge variant="secondary">{leadsByStage[stage.id]?.length || 0}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 space-y-2 bg-muted/30">
                       {leadsByStage[stage.id]?.map(lead => (
                        <CrmLeadCard key={lead.id} lead={lead} onDeleteLead={handleDeleteLead} isDeleting={deletingLeadId === lead.id} isMobile={true} onHire={() => handleHireClick(lead)} />
                       ))}
                    </AccordionContent>
                  </AccordionItem>
              ))}
            </Accordion>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-4">
              {stages.map(stage => (
                  <CrmStageColumn key={stage.id} stage={stage} leads={leadsByStage[stage.id] || []} onDeleteLead={handleDeleteLead} deletingLeadId={deletingLeadId} onHire={handleHireClick} />
              ))}
              </div>
              <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
        
        {leadToBook && bookingPresupuestoInfo && (
          <BookingConfirmationDialog isOpen={isBookingModalOpen} onOpenChange={setIsBookingModalOpen} lead={leadToBook} presupuesto={bookingPresupuestoInfo} onConfirmed={handleBookingConfirmed} />
        )}

        {newFiestaId && (
          <RegisterDepositDialog isOpen={isDepositModalOpen} onOpenChange={setIsDepositModalOpen} fiestaId={newFiestaId} onCompleted={handleDepositCompleted} />
        )}

        {leadForMeeting && (
            <ScheduleMeetingDialog isOpen={isMeetingModalOpen} onOpenChange={setIsMeetingModalOpen} leadName={leadForMeeting.name} meetingType={meetingType} onSubmit={handleMeetingSubmit} onClose={() => setLeadForMeeting(null)} />
        )}
      </div>
    </DndContext>
  );
}
