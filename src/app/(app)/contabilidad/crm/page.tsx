'use client';
import __akDynamic from 'next/dynamic';
import { Suspense as __AkSuspense } from 'react';
import { TabHostShell as __AkTabHostShell } from '@/components/ui/tab-host-shell';
const __AkPanel1 = __akDynamic(() => import('@/components/panels/crm--agenda'));
const __AkPanel2 = __akDynamic(() => import('@/components/panels/crm--atraccion-fiestas'));
const __AkPanel3 = __akDynamic(() => import('@/components/panels/crm--ciclo-comercial'));
const __AkPanel4 = __akDynamic(() => import('@/components/panels/crm--marketing-ads'));
const __AkPanel5 = __akDynamic(() => import('@/components/panels/crm--comercial-360'));

import { useState, useCallback, useMemo, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KanbanSquare, Users, Clock, TrendingUp, Wallet, CheckCircle, CheckCircle2, Loader2, ArrowLeft, Search, X, AlertTriangle, User, RotateCcw, CalendarDays, Gift, Sparkles, Monitor, ListFilter, History, FileArchive, Upload, MessageCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMisPermisos, esSesionDeSoloLectura } from '@/app/actions/sesion';
import { PERMISOS } from '@/lib/auth/perfiles';
import { rescatarCharlasViejasAction } from '@/app/actions/rescatar-charlas';
import type { ResultadoRescateCharlas } from '@/lib/whatsapp/rescatar-charlas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CrmLeadCard } from '@/components/crm/CrmLeadCard';
import { CrmLeadTimeline } from '@/components/crm/CrmLeadTimeline';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCrmBoard } from '@/hooks/useCrmBoard';
import { daysUntilBirthday } from '@/lib/commercial/birthday';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resetCrm } from '@/app/actions/crm';
import {
  isDirectCrmLead,
  isSimulatorCrmLead,
} from '@/lib/crm/lead-presentation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const INACTIVITY_DAYS = 7;

const CrmDesktopBoard = dynamic(
  () => import('@/components/crm/CrmDesktopBoard').then((module) => module.CrmDesktopBoard),
  { loading: () => <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div> },
);
const AddLeadDialog = dynamic(
  () => import('@/components/crm/AddLeadDialog').then((module) => module.AddLeadDialog),
  { loading: () => <Button variant="outline" className="h-11" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando</Button> },
);
const ScheduleMeetingDialog = dynamic(
  () => import('@/components/crm/ScheduleMeetingDialog').then((module) => module.ScheduleMeetingDialog),
  { loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"><Loader2 className="h-8 w-8 animate-spin text-white" /></div> },
);
const BookingConfirmationDialog = dynamic(
  () => import('@/components/crm/BookingConfirmationDialog').then((module) => module.BookingConfirmationDialog),
  { loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"><Loader2 className="h-8 w-8 animate-spin text-white" /></div> },
);
const RegisterDepositDialog = dynamic(
  () => import('@/components/crm/RegisterDepositDialog').then((module) => module.RegisterDepositDialog),
  { loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20"><Loader2 className="h-8 w-8 animate-spin text-white" /></div> },
);

const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

type QuickFilter =
  | 'all'
  | 'no_followup'
  | 'today'
  | 'this_week'
  | 'inactive'
  | 'my_leads'
  | 'direct'
  | 'guest'
  | 'simulator'
  | 'portal_led'
  | 'birthday_30'
  | 'birthday_60'
  | 'birthday_90';

function CrmPageInner() {
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
  const searchParams = useSearchParams();

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [leadForMeeting, setLeadForMeeting] = useState<CrmLead | null>(null);
  const [meetingType, setMeetingType] = useState<'Entrevista' | 'Firma de Contrato'>('Entrevista');

  // Booking Flow State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [leadToBook, setLeadToBook] = useState<CrmLead | null>(null);
  const [bookingPresupuestoInfo, setBookingPresupuestoInfo] = useState<any>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [newFiestaId, setNewFiestaId] = useState<string | null>(null);
  const [isResettingCrm, setIsResettingCrm] = useState(false);
  const [puedeBorrar, setPuedeBorrar] = useState(false);

  // Rescatar charlas viejas (Bloque 7, Orden 325)
  const [isRescatarOpen, setIsRescatarOpen] = useState(false);
  const [archivosRescate, setArchivosRescate] = useState<File[]>([]);
  const [resultadoRescate, setResultadoRescate] = useState<ResultadoRescateCharlas | null>(null);
  const [isRescatando, startRescateTransition] = useTransition();

  const handleProcesarRescate = useCallback(() => {
    if (archivosRescate.length === 0) {
      toast({
        title: 'Faltan archivos',
        description: 'Elegí uno o más archivos .txt o .zip exportados desde WhatsApp.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    for (const file of archivosRescate) {
      formData.append('archivos', file);
    }

    startRescateTransition(async () => {
      const res = await rescatarCharlasViejasAction(formData);
      if (res.success && res.data) {
        setResultadoRescate(res.data);
        toast({
          title: 'Charlas procesadas',
          description: `Se rescataron ${res.data.prospectosRescatados.length} prospectos al CRM.`,
        });
        await fetchData(true);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudieron analizar los archivos.',
          variant: 'destructive',
        });
      }
    });
  }, [archivosRescate, fetchData, toast]);

  useEffect(() => {
    let montado = true;
    Promise.all([getMisPermisos(), esSesionDeSoloLectura()])
      .then(([perms, soloLectura]) => {
        if (!montado) return;
        const tieneAdmin = perms.permisos.includes(PERMISOS.ADMINISTRACION);
        setPuedeBorrar(tieneAdmin && !soloLectura);
      })
      .catch(() => {
        if (montado) setPuedeBorrar(false);
      });
    return () => { montado = false; };
  }, []);

  // Search + Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);
  // Enlaces "Ver en CRM" (agenda, bandeja de salida): llegan con ?leadId= y abren la ficha de ese prospecto.
  const requestedLeadId = searchParams.get('leadId');
  const [leadAbiertoId, setLeadAbiertoId] = useState<string | null>(requestedLeadId);
  const requestedView = searchParams.get('view');
  const initialQuickFilter: QuickFilter = requestedView === 'guest'
    ? 'guest'
    : requestedView === 'direct'
      ? 'direct'
    : requestedView === 'simulator'
      ? 'simulator'
      : requestedView === 'portal_led'
        ? 'portal_led'
        : 'all';
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initialQuickFilter);

  const isMobile = useIsMobile();

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
        // No filtra "los mios": filtra los que tienen responsable asignado, que
        // es lo que dice la etiqueta en pantalla ("Con responsable"). La clave
        // interna quedo con nombre viejo. No es una filtracion de datos: el
        // equipo ve el CRM completo igual.
        if (!lead.assignedTo) return false;
      } else if (quickFilter === 'direct') {
        if (!isDirectCrmLead(lead)) return false;
      } else if (quickFilter === 'guest') {
        if (lead.acquisition?.source !== 'guest_portal' || !lead.marketingConsent) return false;
      } else if (quickFilter === 'simulator') {
        if (!isSimulatorCrmLead(lead)) return false;
      } else if (quickFilter === 'portal_led') {
        if (lead.acquisition?.source !== 'portal_led' && lead.budgetSource !== 'portal_led') return false;
      } else if (quickFilter.startsWith('birthday_')) {
        const days = daysUntilBirthday(lead.birthdayMonthDay, now);
        const limit = Number(quickFilter.split('_')[1]);
        if (days == null || days > limit) return false;
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
      const targetStageId = typeof over.data.current?.stageId === 'string'
        ? over.data.current.stageId
        : String(over.id);
      const targetStage = stages.find(s => s.id === targetStageId);
      if (!leadToMove || !targetStage) return;
      if (leadToMove.currentStageId === targetStage.id) return;

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

  const handleMobileMove = useCallback((lead: CrmLead, direction: -1 | 1) => {
    const currentIndex = stages.findIndex(stage => stage.id === lead.currentStageId);
    const targetStage = stages[currentIndex + direction];
    if (!targetStage) {
      toast({ description: direction < 0 ? 'Este prospecto ya está en la primera etapa.' : 'Este prospecto ya está en la última etapa.' });
      return;
    }
    if (targetStage.name.toLowerCase().includes('entrevista')) {
      setLeadForMeeting({ ...lead, currentStageId: targetStage.id });
      setMeetingType('Entrevista');
      setIsMeetingModalOpen(true);
      return;
    }
    if (targetStage.isConversionStage) {
      handleHireClick(lead);
      return;
    }
    void moveLead(lead.id, targetStage.id);
  }, [handleHireClick, moveLead, stages, toast]);

  const handleResetCrm = useCallback(async () => {
    setIsResettingCrm(true);
    try {
      const result = await resetCrm();
      if (result.success) {
        toast({ title: 'CRM reiniciado', description: 'Todos los prospectos han sido eliminados.' });
        await fetchData(true);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo reiniciar el CRM.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsResettingCrm(false);
    }
  }, [toast, fetchData]);

  const quickFilters: { key: QuickFilter; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'simulator', label: 'Presupuestos (Simulador)', icon: <Sparkles className="w-3 h-3 text-amber-500" /> },
    { key: 'direct', label: 'WhatsApp y manuales', icon: <Gift className="w-3 h-3 text-sky-500" /> },
    { key: 'today', label: 'Citas Hoy', icon: <Clock className="w-3 h-3 text-emerald-500" /> },
    { key: 'inactive', label: `Sin actividad (${inactiveCount})`, icon: <AlertTriangle className="w-3 h-3 text-rose-500" /> },
  ];
  const secondaryQuickFilters: { key: QuickFilter; label: string; icon?: React.ReactNode }[] = [
    { key: 'guest', label: 'Invitados interesados', icon: <Gift className="h-3.5 w-3.5" /> },
    { key: 'portal_led', label: 'Portal LED', icon: <Monitor className="h-3.5 w-3.5" /> },
    { key: 'no_followup', label: 'Sin cita', icon: <X className="h-3.5 w-3.5" /> },
    { key: 'this_week', label: 'Citas esta semana', icon: <Clock className="h-3.5 w-3.5" /> },
    { key: 'my_leads', label: 'Con responsable', icon: <User className="h-3.5 w-3.5" /> },
    { key: 'birthday_30', label: 'Cumple en 30 días', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { key: 'birthday_60', label: 'Cumple en 60 días', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { key: 'birthday_90', label: 'Cumple en 90 días', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];
  const secondaryFilters: { key: QuickFilter; label: string }[] = [
    { key: 'portal_led', label: 'Portal LED' },
    { key: 'this_week', label: 'Citas esta semana' },
    { key: 'no_followup', label: 'Sin cita' },
    { key: 'my_leads', label: 'Con responsable' },
    { key: 'birthday_30', label: 'Cumple en 30 días' },
    { key: 'birthday_60', label: 'Cumple en 60 días' },
    { key: 'birthday_90', label: 'Cumple en 90 días' },
  ];
  const activeSecondaryFilter = secondaryFilters.find((filter) => filter.key === quickFilter);

  const leadAbierto = leadAbiertoId ? leads.find((l) => l.id === leadAbiertoId) : undefined;
  const leadPedidoNoExiste = !isLoading && Boolean(requestedLeadId) && leadAbiertoId === requestedLeadId && !leadAbierto;

  return (
      <div className="h-full flex flex-col space-y-4">
        {leadAbierto && (
          <CrmLeadTimeline lead={leadAbierto} isOpen onOpenChange={(abierto) => { if (!abierto) setLeadAbiertoId(null); }} />
        )}
        {leadPedidoNoExiste && (
          <p role="alert" data-testid="crm-prospecto-no-encontrado" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            No encontramos ese prospecto: puede que se haya borrado.
          </p>
        )}
        <div className="sticky top-0 z-20 -mx-2 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Contabilidad › <span className="text-foreground font-medium">CRM de Prospectos</span>
            </p>
            <div className="flex items-center gap-3">
              <KanbanSquare className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">CRM de Prospectos</h1>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Button asChild variant="outline" className="h-11 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Link href="/contabilidad/crm/atraccion-fiestas" className="flex-1 sm:flex-none">
                <Sparkles className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
                Atracción por Fiesta
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-11"
              onClick={() => setIsRescatarOpen(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Rescatar charlas viejas
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto h-11"><Link href="/contabilidad/crm/agenda" className="flex-1 sm:flex-none"><Clock className="w-4 h-4 mr-2"/>Agenda</Link></Button>
            {stages.length > 0 ? (
              <AddLeadDialog stages={stages} onLeadAdded={() => fetchData(true)} defaultStageId={stages[0].id} />
            ) : (
              <Button variant="outline" className="flex-1 sm:flex-none h-11" disabled>
                <Users className="w-4 h-4 mr-2" />
                Nuevo Prospecto
              </Button>
            )}
            {puedeBorrar && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none h-11 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isResettingCrm}>
                    {isResettingCrm ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                    Reiniciar CRM
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reiniciar el CRM?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará <strong>todos los prospectos</strong> del CRM de forma permanente. Las etapas se conservarán. Esta operación no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetCrm} className="bg-destructive hover:bg-destructive/90">
                      Sí, reiniciar CRM
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button asChild variant="outline" className="w-full h-11"><Link href="/empresa/contabilidad" className="flex-1 sm:flex-none"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Link></Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard title="Propuestas Activas" value={formatCurrency(kpiData?.pipelineValue)} icon={Wallet} isLoading={isLoading}/>
            <KpiCard title="Prospectos" value={kpiData?.activeLeads} icon={Users} isLoading={isLoading}/>
            <KpiCard title="Tasa Conversión" value={`${(kpiData?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} isLoading={isLoading}/>
            <KpiCard title="Ganados/Perdidos" value={`${kpiData?.wonLeads ?? 0}/${kpiData?.lostLeads ?? 0}`} icon={CheckCircle} isLoading={isLoading}/>
            <KpiCard title="Reuniones Hoy" value={leads.filter(l => l.followUpDate && new Date(l.followUpDate).toDateString() === new Date().toDateString()).length} icon={CalendarDays} isLoading={isLoading}/>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={secondaryQuickFilters.some((filter) => filter.key === quickFilter) ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  Más filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {secondaryQuickFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.key}
                    onSelect={() => setQuickFilter(filter.key)}
                    className={cn('gap-2', quickFilter === filter.key && 'bg-accent font-semibold')}
                  >
                    {filter.icon}
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                        <CrmLeadCard
                          key={lead.id}
                          lead={lead}
                          onDeleteLead={deleteLead}
                          isDeleting={deletingLeadId === lead.id}
                          isMobile={true}
                          onMove={(direction) => handleMobileMove(lead, direction)}
                          onHire={() => handleHireClick(lead)}
                        />
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
          <CrmDesktopBoard
            stages={stages}
            leadsByStage={filteredLeadsByStage}
            deletingLeadId={deletingLeadId}
            onDeleteLead={deleteLead}
            onHire={handleHireClick}
            onDragEnd={handleDragEnd}
          />
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

        <Dialog open={isRescatarOpen} onOpenChange={setIsRescatarOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <History className="h-5 w-5 text-primary" />
                Rescatar charlas viejas
              </DialogTitle>
              <DialogDescription>
                Subí exportaciones de WhatsApp (.txt o .zip) para detectar prospectos que quedaron sin respuesta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileArchive className="h-4 w-4 text-emerald-600" />
                    Subir chats exportados de WhatsApp
                  </CardTitle>
                  <CardDescription>
                    En tu celular: abrí el chat → Menú → Más → Exportar chat (Sin archivos) y subí el .txt o .zip acá.
                    La IA descarta familia/proveedores, avisa si un cliente con fiesta quedó sin respuesta, y guarda solo prospectos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900">
                    <strong>Sobre Meta (WhatsApp, Instagram y Facebook):</strong> WhatsApp Cloud API no permite leer historial previo a conectar el webhook, por eso las charlas viejas de WhatsApp entran por archivo exportado. Los mensajes nuevos de Instagram y Messenger entran directo por webhook al CRM.
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archivos-whatsapp-crm">Archivos de WhatsApp (.txt o .zip)</Label>
                    <Input
                      id="archivos-whatsapp-crm"
                      type="file"
                      accept=".txt,.zip"
                      multiple
                      onChange={(e) => setArchivosRescate(Array.from(e.target.files || []))}
                      disabled={isRescatando}
                    />
                    {archivosRescate.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {archivosRescate.length} {archivosRescate.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}:{' '}
                        {archivosRescate.map((f) => f.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <Button type="button" onClick={handleProcesarRescate} disabled={isRescatando || archivosRescate.length === 0}>
                    {isRescatando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isRescatando ? 'Analizando charlas...' : 'Analizar y rescatar prospectos'}
                  </Button>
                </CardContent>
              </Card>

              {resultadoRescate && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Prospectos al CRM</p>
                      <p className="text-2xl font-bold text-emerald-700">{resultadoRescate.prospectosRescatados.length}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Clientes avisados</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {resultadoRescate.clientesSinRespuesta.filter((c) => c.notificado).length}
                      </p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Personales descartados</p>
                      <p className="text-2xl font-bold text-slate-600">{resultadoRescate.descartadosPersonal}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Proveedores descartados</p>
                      <p className="text-2xl font-bold text-slate-600">{resultadoRescate.descartadosProveedor}</p>
                    </Card>
                  </div>

                  {resultadoRescate.clientesSinRespuesta.length > 0 && (
                    <Card className="border-amber-300 bg-amber-50/40">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                          <AlertTriangle className="h-4 w-4" />
                          Clientes con fiesta (no se agregaron al CRM)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {resultadoRescate.clientesSinRespuesta.map((cli, idx) => (
                          <div key={`${cli.nombre}-${idx}`} className="rounded border bg-white p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{cli.nombre}</span>
                              <Badge variant={cli.notificado ? 'default' : 'secondary'}>
                                {cli.notificado ? 'Aviso enviado al dueño' : 'Revisado'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Pedido: {cli.quePedia} · Último mensaje: &ldquo;{cli.ultimoMensaje}&rdquo;
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Prospectos rescatados (priorizados para responder a mano)
                      </CardTitle>
                      <CardDescription>
                        Primero aparecen los que quedaron sin respuesta y traen fecha de evento. Ningún mensaje se envía solo.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {resultadoRescate.prospectosRescatados.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No se detectaron nuevos prospectos para rescatar en estos archivos.
                        </p>
                      ) : (
                        resultadoRescate.prospectosRescatados.map((item) => {
                          const recordExtra = item as unknown as { quedo_sin_respuesta?: boolean; que_pedia?: string };
                          const quedoSinRespuesta = Boolean(recordExtra.quedo_sin_respuesta ?? item.quedoSinRespuesta);
                          const quePedia = recordExtra.que_pedia || item.quePedia;

                          return (
                            <div key={item.leadId} className="rounded-lg border p-4 space-y-3 bg-card">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-base">{item.nombre}</span>
                                  {item.telefono && <Badge variant="outline">{item.telefono}</Badge>}
                                  {quedoSinRespuesta && (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                                      Sin respuesta
                                    </Badge>
                                  )}
                                  {item.fechaEvento && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.fechaEstado === 'libre'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                          : item.fechaEstado === 'ocupada'
                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                            : ''
                                      }
                                    >
                                      <CalendarDays className="mr-1 h-3 w-3" />
                                      {item.fechaEvento} ·{' '}
                                      {item.fechaEstado === 'libre'
                                        ? 'Fecha libre'
                                        : item.fechaEstado === 'ocupada'
                                          ? 'Fecha ocupada'
                                          : 'Por confirmar'}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setIsRescatarOpen(false);
                                    setLeadAbiertoId(item.leadId);
                                  }}
                                >
                                  Ver en CRM
                                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Pedido detectado: <strong>{quePedia}</strong> · {item.mensajesGuardados} mensajes guardados en la conversación
                                {item.fechasAlternativas && item.fechasAlternativas.length > 0 && (
                                  <span> · Alternativas libres: {item.fechasAlternativas.join(', ')}</span>
                                )}
                              </div>

                              <div className="rounded bg-muted/40 p-2.5 text-xs text-foreground">
                                {item.mensajePreparado}
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                                  <a href={item.waUrl} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="mr-1.5 h-4 w-4" />
                                    Abrir en WhatsApp
                                  </a>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  {resultadoRescate.errores.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600" />
                          Observaciones de lectura
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground space-y-1">
                        {resultadoRescate.errores.map((err, i) => (
                          <p key={i}>• {err}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}


export default function CrmPage() {
  return (
    <__AkSuspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando…</div>}>
      <__AkTabHostShell
        tabs={[{"id":"crm","label":"Prospectos"},{"id":"agenda","label":"Agenda"},{"id":"atraccion","label":"Atracción de fiestas"},{"id":"ciclo","label":"Ciclo comercial"},{"id":"ads","label":"Anuncios"},{"id":"comercial-360","label":"Comercial 360"}]}
        renderDefault={() => <CrmPageInner />}
        renderTab={(tab) => { if (tab === 'agenda') return <__AkPanel1 />; if (tab === 'atraccion') return <__AkPanel2 />; if (tab === 'ciclo') return <__AkPanel3 />; if (tab === 'ads') return <__AkPanel4 />; if (tab === 'comercial-360') return <__AkPanel5 />; return null; }}
      />
    </__AkSuspense>
  );
}
