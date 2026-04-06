'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanSquare, Users, Clock, TrendingUp, Wallet, CheckCircle, Loader2, ArrowLeft, Search, X, AlertTriangle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { CrmStageColumn } from '@/components/crm/CrmStageColumn';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { ScheduleMeetingDialog } from '@/components/crm/ScheduleMeetingDialog'; 
import { BookingConfirmationDialog } from '@/components/crm/BookingConfirmationDialog';
import { RegisterDepositDialog } from '@/components/crm/RegisterDepositDialog';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CrmLeadCard } from '@/components/crm/CrmLeadCard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCrmBoard } from '@/hooks/useCrmBoard';

const INACTIVITY_DAYS = 7;

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

type QuickFilter = 'all' | 'no_followup' | 'today' | 'this_week' | 'inactive' | 'my_leads';

export default function CrmPage() {
  const {
    stages,
    leads,
    kpiData,
    isLoading,
    deletingLeadId,
    leadsByStage,
    fetchData,
    moveLead,
    deleteLead,
  } = useCrmBoard();

  const { toast } = useToast();
  const router = useRouter();

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [leadForMeeting, setLeadForMeeting] = useState<CrmLead | null>(null);
  const [meetingType, setMeetingType] = useState<'Entrevista' | 'Firma de Contrato'>('Entrevista');

  // Booking Flow State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [leadToBook, setLeadToBook] = useState<CrmLead | null>(null);
  const [bookingPresupuestoInfo, setBookingPresupuestoInfo] = useState<any>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [newFiestaId, setNewFiestaId] = useState<string | null>(null);

  // Search + Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  
  const isMobile = useIsMobile();
  const sensors = useSensors(useSensor(PointerSensor));

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return leads.filter(lead => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.name?.toLowerCase().includes(q) ||
          lead.phone?.toLowerCase().includes(q) ||
          lead.venueName?.toLowerCase().includes(q) ||
          lead.partyType?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Stage filter
      if (activeStageFilter && lead.currentStageId !== activeStageFilter) return false;

      // Quick filters
      if (quickFilter === 'no_followup') {
        if (lead.followUpDate) return false;
      } else if (quickFilter === 'today') {
        if (!lead.followUpDate) return false;
        const d = new Date(lead.followUpDate);
        if (d < todayStart || d >= new Date(todayStart.getTime() + 86400000)) return false;
      } else if (quickFilter === 'this_week') {
        if (!lead.followUpDate) return false;
        const d = new Date(lead.followUpDate);
        if (d < todayStart || d >= weekEnd) return false;
      } else if (quickFilter === 'inactive') {
        const lastActivity = new Date(lead.lastContactedAt || lead.updatedAt || lead.createdAt);
        const diffDays = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < INACTIVITY_DAYS) return false;
      } else if (quickFilter === 'my_leads') {
        // Filter by assignedTo matching current user — we don't have auth context so we use a simple "has assignedTo" filter
        // In a real app this would compare to the logged-in user's name
        if (!lead.assignedTo) return false;
      }

      return true;
    });
  }, [leads, searchQuery, activeStageFilter, quickFilter]);

  const filteredLeadsByStage = useMemo(
    () =>
      stages.reduce((acc, stage) => {
        acc[stage.id] = filteredLeads.filter(l => l.currentStageId === stage.id);
        return acc;
      }, {} as Record<string, CrmLead[]>),
    [stages, filteredLeads]
  );

  const isFiltered = searchQuery.trim() || activeStageFilter || quickFilter !== 'all';
  const inactiveCount = useMemo(() => {
    const now = new Date();
    return leads.filter(l => {
      const last = new Date(l.lastContactedAt || l.updatedAt || l.createdAt);
      return (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24) >= INACTIVITY_DAYS;
    }).length;
  }, [leads]);

  const handleHireClick = useCallback(async (lead: CrmLead) => {
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
  }, [toast]);

  const handleBookingConfirmed = useCallback((fiestaId: string) => {
    setIsBookingModalOpen(false);
    setNewFiestaId(fiestaId);
    setIsDepositModalOpen(true);
  }, []);

  const handleDepositCompleted = useCallback(() => {
    setIsDepositModalOpen(false);
    fetchData(true);
    if (newFiestaId) router.push(`/fiestas/nueva?fiestaId=${newFiestaId}`);
  }, [fetchData, newFiestaId, router]);

  const handleMeetingSubmit = useCallback(async (meetingDate: string) => {
    if (!leadForMeeting) return;
    const success = await moveLead(leadForMeeting.id, leadForMeeting.currentStageId || '', meetingDate);
    if (success) {
      toast({ description: `Reunión agendada para "${leadForMeeting.name}".` });
    }
    setIsMeetingModalOpen(false);
    setLeadForMeeting(null);
  }, [leadForMeeting, moveLead, toast]);
  
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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

      await moveLead(leadToMove.id, targetStage.id);
    }
  }, [leads, stages, moveLead, handleHireClick]);

  if (isLoading && !isBookingModalOpen) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;

  const quickFilters: { key: QuickFilter; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'today', label: 'Hoy', icon: <Clock className="w-3 h-3" /> },
    { key: 'this_week', label: 'Esta semana', icon: <Clock className="w-3 h-3" /> },
    { key: 'no_followup', label: 'Sin cita', icon: <X className="w-3 h-3" /> },
    { key: 'inactive', label: `Sin actividad (${inactiveCount})`, icon: <AlertTriangle className="w-3 h-3" /> },
    { key: 'my_leads', label: 'Con responsable', icon: <User className="w-3 h-3" /> },
  ];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">CRM de Prospectos</h1>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Link href="/contabilidad/crm/agenda" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full h-11"><Clock className="w-4 h-4 mr-2"/>Agenda</Button>
            </Link>
            {stages.length > 0 && <AddLeadDialog stages={stages} onLeadAdded={() => fetchData(true)} defaultStageId={stages[0].id} />}
            <Link href="/empresa/contabilidad" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full h-11"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
            </Link>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Propuestas Activas" value={formatCurrency(kpiData?.pipelineValue)} icon={Wallet} isLoading={isLoading}/>
            <KpiCard title="Prospectos" value={kpiData?.activeLeads} icon={Users} isLoading={isLoading}/>
            <KpiCard title="Tasa Conversión" value={`${(kpiData?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} isLoading={isLoading}/>
            <KpiCard title="Ganados/Perdidos" value={`${kpiData?.wonLeads ?? 0}/${kpiData?.lostLeads ?? 0}`} icon={CheckCircle} isLoading={isLoading}/>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col gap-2">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono, salón..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Quick filters */}
            {quickFilters.map(f => (
              <Button
                key={f.key}
                variant={quickFilter === f.key ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setQuickFilter(f.key)}
              >
                {f.icon}{f.label}
              </Button>
            ))}
            {/* Stage filter */}
            <div className="flex gap-1 ml-2 flex-wrap">
              {stages.map(s => (
                <Button
                  key={s.id}
                  variant={activeStageFilter === s.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("h-7 text-[11px] gap-1", activeStageFilter === s.id && s.headerBgColor, activeStageFilter === s.id && s.headerTextColor)}
                  onClick={() => setActiveStageFilter(prev => prev === s.id ? null : s.id)}
                >
                  {s.name}
                  <Badge variant="outline" className="h-4 px-1 text-[9px] bg-white/20 border-white/30">
                    {(filteredLeadsByStage[s.id] ?? []).length}
                  </Badge>
                </Button>
              ))}
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setSearchQuery(''); setActiveStageFilter(null); setQuickFilter('all'); }}
              >
                <X className="w-3 h-3 mr-1" />Limpiar filtros
              </Button>
            )}
          </div>
          {isFiltered && (
            <p className="text-xs text-muted-foreground">
              Mostrando {filteredLeads.length} de {leads.length} prospectos
            </p>
          )}
        </div>

        {isMobile ? (
             <Accordion type="multiple" defaultValue={stages.map(s => s.id)} className="space-y-3">
              {stages.map((stage) => (
                  <AccordionItem key={stage.id} value={stage.id} className="border rounded-2xl bg-card shadow-sm overflow-hidden" style={{borderTopColor: stage.borderColor, borderTopWidth: '4px'}}>
                    <AccordionTrigger className={cn("px-4 py-4 hover:no-underline", stage.headerBgColor, stage.headerTextColor)}>
                      <div className="flex justify-between w-full pr-4">
                        <span className="font-black uppercase tracking-widest text-[10px]">{stage.name}</span>
                        <Badge variant="secondary" className="h-5 bg-white/20 text-white border-none">{filteredLeadsByStage[stage.id]?.length || 0}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 space-y-2 bg-muted/10">
                       {filteredLeadsByStage[stage.id]?.map(lead => (
                        <CrmLeadCard key={lead.id} lead={lead} onDeleteLead={deleteLead} isDeleting={deletingLeadId === lead.id} isMobile={true} onHire={() => handleHireClick(lead)} />
                       ))}
                       {(!filteredLeadsByStage[stage.id] || filteredLeadsByStage[stage.id].length === 0) && (
                         <p className="text-center py-8 text-xs text-muted-foreground italic font-medium uppercase tracking-widest opacity-50">
                           {isFiltered ? 'Sin resultados' : 'Sin prospectos'}
                         </p>
                       )}
                    </AccordionContent>
                  </AccordionItem>
              ))}
            </Accordion>
        ) : (
          <ScrollArea className="w-full h-full whitespace-nowrap pb-4">
              <div className="flex gap-4 h-full">
              {stages.map(stage => (
                  <CrmStageColumn key={stage.id} stage={stage} leads={filteredLeadsByStage[stage.id] || []} onDeleteLead={deleteLead} deletingLeadId={deletingLeadId} onHire={handleHireClick} />
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

