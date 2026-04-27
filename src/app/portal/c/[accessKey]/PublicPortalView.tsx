
'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FiestaEnPlanificacion, ClientTarea, MoodboardItem, ProgramaEventoItem, BebidaCalculable, FaqItem, CuentaBancaria, ClienteDebeLlevarItem, RsvpStatus } from '@/types/fiesta';
import type { Presupuesto, PagoCliente } from '@/types/presupuesto';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckSquare,
  Music,
  Camera,
  Gift,
  FileText,
  MessageSquare,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Loader2,
  Save,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  FileCheck2,
  Heart,
  MinusCircle,
  PlusCircle,
  CloudSun,
  FileSignature,
  GlassWater,
  Navigation,
  Utensils,
  HelpCircle,
  Shirt,
  Wine,
  Package,
  ExternalLink,
  Crown,
  Upload,
  X,
  Send,
  Sparkles,
  Building2,
  ArrowLeft,
  Home,
  Palette,
  ClipboardList,
  DollarSign,
  Image,
  TrendingUp,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateClientChecklist, updateClientNotes, submitClientPayment, submitClientMenuChangeRequest, updatePortalGuestRsvp } from '@/app/actions/fiesta/portal.actions';
import { updateClienteDebeLlevar } from '@/app/actions/fiesta/fiesta.actions';
import { defaultBebidaItems } from '@/lib/fiesta-defaults';
import { PublicFooter } from '@/components/public-footer';
import { calculateMenuSimulationTotals, resolveMenuUnitPrices, simulateGuestCostImpact } from '@/lib/portal-menu-simulator';
import { CateringSimulator } from '@/components/portal/CateringSimulator';

interface PublicPortalViewProps {
  fiesta: FiestaEnPlanificacion;
  companyContact: string;
  companyName: string;
  presupuesto?: Presupuesto | null;
}

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const now = new Date().getTime();
      const dateStr = targetDate.includes('T') ? targetDate : `${targetDate}T00:00:00`;
      const target = new Date(dateStr).getTime();
      if (isNaN(target)) return;
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isPast: false,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">
        {label}
      </span>
    </div>
  );
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const MetodoPagoIcon = ({ metodo }: { metodo: string }) => {
  switch (metodo) {
    case 'Efectivo':
      return <Banknote className="w-3.5 h-3.5" />;
    case 'MercadoPago':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'Transferencia Bancaria':
      return <CreditCard className="w-3.5 h-3.5" />;
    default:
      return <FileCheck2 className="w-3.5 h-3.5" />;
  }
};

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-700' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700' },
};

function getColorClasses(color: string) {
  return colorMap[color] ?? colorMap['sky'];
}

/** Migrate old-format CalculadoraBebidas (boolean flags) to new items[] format */
function resolveBebidasItems(settings: FiestaEnPlanificacion['clientPortalSettings']): BebidaCalculable[] {
  const calc = settings?.calculadoraBebidas;
  if (!calc) return defaultBebidaItems;
  if (calc.items && calc.items.length > 0) return calc.items;

  // Backward compatibility: convert legacy boolean flags
  return defaultBebidaItems.map(item => {
    let clienteLleva = false;
    if (item.id === 'cerveza') clienteLleva = !!calc.clienteLlevaCerveza;
    else if (item.id === 'refresco') clienteLleva = !!calc.clienteLlevaBebida;
    else if (item.id === 'hielo') clienteLleva = !!calc.clienteLlevaHielo;
    return { ...item, clienteLleva };
  });
}

/** Maximum number of additional guests the simulator allows in a single request */
const MAX_GUEST_DELTA = 200;

/** Pick a representative Lucide icon based on itinerary item title keywords */
function getItineraryIcon(titulo: string): React.ElementType {
  const t = titulo.toLowerCase();
  if (t.includes('música') || t.includes('musica') || t.includes('baile') || t.includes('vals') || t.includes('dj') || t.includes('show'))
    return Music;
  if (t.includes('cena') || t.includes('comida') || t.includes('menú') || t.includes('brindis') || t.includes('cocktail') || t.includes('cóctel'))
    return Utensils;
  if (t.includes('foto') || t.includes('video') || t.includes('filmación') || t.includes('fotografia'))
    return Camera;
  if (t.includes('torta') || t.includes('postre') || t.includes('cumpleaños'))
    return Gift;
  if (t.includes('entrada') || t.includes('llegada') || t.includes('recepción') || t.includes('ingreso'))
    return Users;
  if (t.includes('bienvenida') || t.includes('apertura') || t.includes('inicio') || t.includes('ceremonia'))
    return Sparkles;
  if (t.includes('cierre') || t.includes('despedida') || t.includes('fin') || t.includes('egreso'))
    return Heart;
  if (t.includes('vestimenta') || t.includes('dress') || t.includes('traje') || t.includes('vestido'))
    return Shirt;
  return Clock;
}

export default function PublicPortalView({
  fiesta,
  companyContact,
  companyName,
  presupuesto,
}: PublicPortalViewProps) {
  const { configuracion: config, clientPortalSettings: settings } = fiesta;
  const portalExperience = fiesta.clientePortalExperience ?? {};
  const countdown = useCountdown(config.fechaEvento);

  // Dynamic event color — clientePortalExperience.primaryColor has highest priority
  const eventColor =
    portalExperience.primaryColor ||
    config.primaryColor ||
    fiesta.invitacionConfig?.colorPrincipal ||
    fiesta.invitacionDigital?.cabecera?.paletaColores?.primary ||
    fiesta.decoracion?.paletaColores?.primary ||
    '#7c3aed';

  // Interactive Checklist state
  const [checklist, setChecklist] = useState<ClientTarea[]>(fiesta.clientChecklist ?? []);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // Shared Notes state
  const [notes, setNotes] = useState(fiesta.clientNotes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Informar Pago modal state
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoFile, setPagoFile] = useState<File | null>(null);
  const [pagoFilePreview, setPagoFilePreview] = useState<string | null>(null);
  const [pagoSubmitting, setPagoSubmitting] = useState(false);
  const [pagoSuccess, setPagoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guest simulator state
  const [adultDelta, setAdultDelta] = useState(0);
  const [kidsDelta, setKidsDelta] = useState(0);
  const [simRequestNote, setSimRequestNote] = useState('');
  const [simRequestLoading, setSimRequestLoading] = useState(false);

  // Moodboard liked state
  const [likedItems, setLikedItems] = useState<Set<string>>(
    new Set((fiesta.decoracion?.moodboardItems ?? []).filter(i => i.likedByClient).map(i => i.id))
  );

  const handlePagoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPagoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPagoFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitPago = async () => {
    const monto = parseFloat(pagoMonto.replace(/[^\d.]/g, ''));
    if (!monto || monto <= 0) return;
    setPagoSubmitting(true);
    try {
      let base64: string | undefined;
      let nombre: string | undefined;
      if (pagoFile) {
        base64 = pagoFilePreview ?? undefined;
        nombre = pagoFile.name;
      }
      const res = await submitClientPayment(fiesta.id, monto, base64, nombre);
      if (res.success) {
        setPagoSuccess(true);
        setShowPagoModal(false);
        setPagoMonto('');
        setPagoFile(null);
        setPagoFilePreview(null);
      }
    } finally {
      setPagoSubmitting(false);
    }
  };

  // FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Itinerary accordion state
  const [openProgramaIds, setOpenProgramaIds] = useState<Set<string>>(new Set());

  // clienteDebeLlevar state
  const [debeLlevarItems, setDebeLlevarItems] = useState<ClienteDebeLlevarItem[]>(fiesta.clienteDebeLlevar ?? []);
  const [isSavingDebeLlevar, setIsSavingDebeLlevar] = useState(false);

  // Panel state
  const [showItinerarioPanel, setShowItinerarioPanel] = useState(false);
  const [showPagosPanel, setShowPagosPanel] = useState(false);

  // Guest list RSVP state
  const [invitados, setInvitados] = useState(fiesta.invitados ?? []);
  const [updatingRsvpId, setUpdatingRsvpId] = useState<string | null>(null);

  const handleUpdateGuestRsvp = async (invitadoId: string, rsvp: RsvpStatus) => {
    setUpdatingRsvpId(invitadoId);
    const previous = invitados;
    setInvitados(prev => prev.map(inv => inv.id === invitadoId ? { ...inv, rsvp } : inv));
    try {
      const res = await updatePortalGuestRsvp(fiesta.id, invitadoId, rsvp);
      if (!res.success) setInvitados(previous);
    } catch {
      setInvitados(previous);
    } finally {
      setUpdatingRsvpId(null);
    }
  };

  const handleToggleDebeLlevar = async (itemId: string) => {
    const previous = debeLlevarItems;
    const updated = debeLlevarItems.map(item =>
      item.id === itemId
        ? { ...item, completado: !item.completado, estado: (!item.completado ? 'enviado' : 'pendiente') as ClienteDebeLlevarItem['estado'] }
        : item
    );
    setDebeLlevarItems(updated);
    setIsSavingDebeLlevar(true);
    try {
      await updateClienteDebeLlevar(fiesta.id, updated);
    } catch {
      setDebeLlevarItems(previous);
    } finally {
      setIsSavingDebeLlevar(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const previous = checklist;
    const newChecklist = checklist.map(t =>
      t.id === taskId ? { ...t, completada: !t.completada } : t
    );
    setChecklist(newChecklist);
    setTogglingTaskId(taskId);
    try {
      await updateClientChecklist(fiesta.id, newChecklist);
    } catch {
      setChecklist(previous);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setNotesSaved(false);
  };

  const handleSaveNotes = async () => {
    setNotesSaved(false);
    setIsSavingNotes(true);
    try {
      await updateClientNotes(fiesta.id, notes);
      setNotesSaved(true);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const eventDate = config.fechaEvento
    ? (() => {
        const d = new Date(
          config.fechaEvento.includes('T') ? config.fechaEvento : `${config.fechaEvento}T00:00:00`
        );
        return isNaN(d.getTime())
          ? config.fechaEvento
          : d.toLocaleDateString('es-UY', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
      })()
    : null;

  const whatsappNumber = companyContact.replace(/\D/g, '');
  const hasValidPhone = whatsappNumber.length >= 7;
  const whatsappMessage = encodeURIComponent(
    `Hola! Te escribo por el evento "${config.nombreEvento}"${config.fechaEvento ? ` (${eventDate})` : ''}.`
  );
  const whatsappHref = hasValidPhone
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  // Payments data
  const totalCosto = presupuesto
    ? (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado)
    : 0;
  const pagos: PagoCliente[] = presupuesto?.pagosCliente ?? [];
  const confirmedPagos = pagos.filter(p => p.estadoPago !== 'pendiente_confirmacion');
  const totalPagado = confirmedPagos.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = totalCosto - totalPagado;
  const isPaid = saldoPendiente <= 0;
  const porcentajePagado = totalCosto > 0 ? Math.min(100, (totalPagado / totalCosto) * 100) : 0;

  // Days until event
  const daysUntil = countdown && !countdown.isPast ? countdown.days : null;

  // Smart alert banners
  const alertas: { type: 'amber' | 'emerald' | 'blue'; message: string }[] = [];
  if (settings?.pagos?.visible && presupuesto && saldoPendiente > 0) {
    alertas.push({ type: 'amber', message: `💳 Recordá: tu saldo pendiente es de ${formatCurrency(saldoPendiente)}` });
  }
  if (daysUntil !== null && daysUntil <= 30 && daysUntil > 0) {
    alertas.push({ type: 'blue', message: `⏰ ¡Faltan ${daysUntil} días para tu evento!` });
  }
  if (settings?.contrato?.visible && fiesta.contratoServicioTexto && !fiesta.contratoFirmaInfo?.isSigned) {
    alertas.push({ type: 'amber', message: `📝 Tu contrato está pendiente de firma` });
  }
  const pendingTasks = checklist.filter(t => !t.completada).length;
  if (settings?.checklist?.visible && pendingTasks > 0) {
    alertas.push({ type: 'blue', message: `✅ Tenés ${pendingTasks} tarea${pendingTasks > 1 ? 's' : ''} pendiente${pendingTasks > 1 ? 's' : ''}` });
  }

  // Guest simulator
  const invitadosContratados = config.invitadosEstimados || 0;
  const adultosBase = presupuesto?.invitadosAdultos ?? Math.max(0, invitadosContratados - ((presupuesto?.invitadosNinos ?? 0) + (presupuesto?.invitadosAdolescentes ?? 0)));
  const ninosAdolescentesBase = (presupuesto?.invitadosNinos ?? 0) + (presupuesto?.invitadosAdolescentes ?? 0);
  const { adultUnit, kidsUnit } = resolveMenuUnitPrices(presupuesto);
  const simConfig = settings?.simuladorInvitadosConfig;
  // Support both new (simuladorInvitados.minReductionPercent) and legacy (simuladorInvitadosConfig) approaches
  const limiteAumento = settings?.simuladorInvitados?.maxIncreasePercent ?? simConfig?.limiteAumentoPorcentaje ?? 30;
  const maxDeltaAdult = Math.floor(Math.max(1, adultosBase || invitadosContratados) * (limiteAumento / 100));
  const maxDeltaKids = Math.floor(Math.max(1, ninosAdolescentesBase || invitadosContratados) * (limiteAumento / 100));
  // Effective limits: prefer admin-configured percentage, fall back to absolute MAX_GUEST_DELTA
  const effectiveMaxAdult = maxDeltaAdult || MAX_GUEST_DELTA;
  const effectiveMaxKids = maxDeltaKids || MAX_GUEST_DELTA;
  // Legacy catering simulator totals (kept for the CateringSimulator component still in use)
  const simulationTotals = calculateMenuSimulationTotals({
    adultosDelta: adultDelta,
    ninosAdolescentesDelta: kidsDelta,
    adultUnitPrice: adultUnit,
    kidsUnitPrice: kidsUnit,
    currentTotal: totalCosto,
  });
  // Real budget-synced simulation — used by the new guest simulator and submission handler
  const guestSim = presupuesto
    ? simulateGuestCostImpact({ presupuesto, adultDelta, kidsDelta })
    : null;

  // Drink calculator
  const calcBebidas = settings?.calculadoraBebidas;
  const numInvitados = config.invitadosEstimados || 0;
  const bebidasItems = resolveBebidasItems(settings);

  // Moodboard and program
  const moodboardItems: MoodboardItem[] = fiesta.decoracion?.moodboardItems ?? [];
  const programa: ProgramaEventoItem[] = fiesta.programa ?? [];
  const musica = fiesta.musica;

  // Location data from digital invitation
  const celebracion = fiesta.invitacionDigital?.detallesEvento?.celebracion;
  const dressCode = fiesta.invitacionDigital?.dressCode;

  // Budget items
  const itemsPresupuestados = presupuesto?.itemsPresupuestados ?? [];

  // FAQ
  const faqItems: FaqItem[] = fiesta.faqPortal ?? [];
  const menuChangeRequests = fiesta.clientMenuChangeRequests ?? [];

  const handleSubmitMenuRequest = async () => {
    if (!fiesta.id || (adultDelta <= 0 && kidsDelta <= 0)) return;
    setSimRequestLoading(true);
    try {
      // Prefer real budget-synced impact; fall back to legacy estimate for events without items
      const montoAdicional = guestSim ? guestSim.impacto : simulationTotals.aumentoTotal;
      const nuevoTotalEstimado = guestSim ? guestSim.costoNuevo : simulationTotals.nuevoTotal;
      await submitClientMenuChangeRequest(fiesta.id, {
        adultosDelta: adultDelta,
        ninosAdolescentesDelta: kidsDelta,
        montoAdicional,
        nuevoTotalEstimado,
        notaCliente: simRequestNote,
      });
      setAdultDelta(0);
      setKidsDelta(0);
      setSimRequestNote('');
    } finally {
      setSimRequestLoading(false);
    }
  };

  const handleOpenInformarPago = () => {
    setShowPagosPanel(false);
    setShowPagoModal(true);
  };

  // Event name display — use eventDisplayName override, fallback to config name
  const rawEventName = portalExperience.eventDisplayName || config.nombreEvento;
  const displayEventName =
    !rawEventName || rawEventName === 'Nuevo Evento'
      ? 'Evento sin configurar'
      : rawEventName;

  // Location display — hide placeholder text
  const rawLocation = config.nombreLugar;
  const isLocationConfirmed = !!rawLocation && rawLocation !== 'Salón a definir';
  const displayLocation = isLocationConfirmed ? rawLocation : 'Lugar a confirmar';

  // Sidebar: pending tasks from debeLlevarItems
  const pendingDebeLlevar = debeLlevarItems.filter(
    item => item.estado !== 'revisado' && item.estado !== 'listo' && !item.completado
  );

  const DEBE_LLEVAR_ESTADO_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    listo: 'Listo',
    revisado: 'En revisión',
  };

  // Guest RSVP stats
  const guestConfirmados = invitados.filter(inv => inv.rsvp === 'Confirmado');
  const guestPendientes = invitados.filter(inv => inv.rsvp === 'Pendiente' || inv.rsvp === 'Tal vez');
  const guestCancelados = invitados.filter(inv => inv.rsvp === 'Rechazado');
  const totalInvitadosConfirmados = guestConfirmados.reduce((sum, inv) => sum + (inv.partySize ?? 1), 0);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">

      {/* ── HERO ── */}
      <div
        className="relative text-white px-4 pb-10 pt-12 overflow-hidden"
        style={{
          background: portalExperience.heroImageUrl
            ? `linear-gradient(to bottom, ${eventColor}cc 0%, #1e1b4b 100%)`
            : `linear-gradient(135deg, ${eventColor}ee 0%, ${eventColor}99 50%, #1e1b4b 100%)`,
        }}
      >
        {/* Hero background image */}
        {portalExperience.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portalExperience.heroImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
        )}
        {/* Decorative background stars */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Star className="absolute top-6 right-8 w-20 h-20 text-yellow-300 rotate-12" />
          <Star className="absolute bottom-4 left-6 w-12 h-12 text-yellow-300 -rotate-12" />
          <Sparkles className="absolute top-12 left-12 w-8 h-8 text-yellow-200 rotate-45" />
        </div>

        <div className="relative max-w-lg mx-auto">
          {/* Badges row */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/20">
              {companyName}
            </Badge>
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 font-black text-xs px-3 py-1 shadow-lg">
              <Crown className="w-3 h-3 mr-1" />
              PORTAL VIP
            </Badge>
          </div>

          {/* Protagonist photo + event name */}
          {config.protagonistaFotoUrl ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl ring-4 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.protagonistaFotoUrl}
                    alt={config.protagonista1Nombre || displayEventName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-black" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
                  {displayEventName}
                </h1>
                {config.protagonista1Nombre && (
                  <p className="text-xl font-bold opacity-95">
                    ✨ {config.protagonista1Nombre}
                    {config.protagonista2Nombre && ` & ${config.protagonista2Nombre}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
                {displayEventName}
              </h1>
              {config.protagonista1Nombre && (
                <p className="text-xl font-bold opacity-95">
                  ✨ {config.protagonista1Nombre}
                  {config.protagonista2Nombre && ` & ${config.protagonista2Nombre}`}
                </p>
              )}
            </div>
          )}

          {/* Event meta badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-white/85">
            {config.tipoCelebracion && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 font-semibold text-xs">
                <PartyPopper className="w-3.5 h-3.5" />
                {config.tipoCelebracion}
              </span>
            )}
            {eventDate && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 font-semibold text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span className="capitalize">{eventDate}</span>
              </span>
            )}
            {config.horaInicio && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 font-semibold text-xs">
                <Clock className="w-3.5 h-3.5" />
                {config.horaInicio}{config.horaFin ? ` — ${config.horaFin}` : ''}
              </span>
            )}
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-xs ${isLocationConfirmed ? 'bg-white/15' : 'bg-white/8 opacity-60'}`}>
              <MapPin className="w-3.5 h-3.5" />
              {displayLocation}
            </span>
            {config.invitadosEstimados > 0 && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 font-semibold text-xs">
                <Users className="w-3.5 h-3.5" />
                {config.invitadosEstimados} invitados
              </span>
            )}
          </div>

          {/* Countdown — simplified, inside hero */}
          {config.fechaEvento && (
            <div className="mt-5 text-center">
              {countdown?.isPast ? (
                <p className="text-xl font-black opacity-90">🎉 ¡El evento ya fue!</p>
              ) : countdown && !countdown.isPast ? (
                <p className="text-2xl font-black opacity-90">
                  ⏳ Faltan <span className="tabular-nums">{countdown.days}</span> día{countdown.days !== 1 ? 's' : ''}
                </p>
              ) : null}
            </div>
          )}

          {/* Guest RSVP stats — only when there are registered guests */}
          {invitados.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 text-white text-xs font-bold px-3 py-2 hover:bg-emerald-500/35 transition-colors"
                onClick={() => document.getElementById('seccion-invitados')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>{guestConfirmados.length} confirmados</span>
                {totalInvitadosConfirmados > guestConfirmados.length && (
                  <span className="opacity-75">({totalInvitadosConfirmados} personas)</span>
                )}
              </button>
              {guestPendientes.length > 0 && (
                <button
                  className="flex items-center gap-1.5 rounded-2xl bg-amber-500/25 border border-amber-400/40 text-white text-xs font-bold px-3 py-2 hover:bg-amber-500/35 transition-colors"
                  onClick={() => document.getElementById('seccion-invitados')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  {guestPendientes.length} sin confirmar
                </button>
              )}
              {guestCancelados.length > 0 && (
                <button
                  className="flex items-center gap-1.5 rounded-2xl bg-red-500/20 border border-red-400/40 text-white text-xs font-bold px-3 py-2 hover:bg-red-500/30 transition-colors"
                  onClick={() => document.getElementById('seccion-invitados')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <MinusCircle className="w-3.5 h-3.5 text-red-300" />
                  {guestCancelados.length} cancelaron
                </button>
              )}
            </div>
          )}

          {/* Quick action buttons */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {config.googleMapsUrl && (
              <a href={config.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <button className="rounded-full bg-white/20 text-white border border-white/30 text-xs flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/30 transition-colors">
                  <Navigation className="w-3.5 h-3.5" />
                  Cómo llegar
                </button>
              </a>
            )}
            {settings?.paginaPublica?.visible && (
              <button
                className="rounded-full bg-white/20 text-white border border-white/30 text-xs flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/30 transition-colors"
                onClick={() => {
                  if (fiesta.invitacionSlug) {
                    window.open(`/i/${fiesta.invitacionSlug}`, '_blank');
                  } else {
                    document.getElementById('seccion-pagina-publica')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Página del evento
              </button>
            )}
            <button
              className="rounded-full bg-white/20 text-white border border-white/30 text-xs flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/30 transition-colors"
              onClick={() => setShowPagosPanel(true)}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Hacer un pago
            </button>
            <button
              className="rounded-full bg-white/20 text-white border border-white/30 text-xs flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/30 transition-colors"
              onClick={() => document.getElementById('seccion-mensajes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Enviar mensaje
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-6">

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Alert banners */}
            {alertas.length > 0 && (
              <div className="space-y-2">
                {alertas.map((alerta, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium border ${
                      alerta.type === 'amber'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : alerta.type === 'emerald'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    {alerta.message}
                  </div>
                ))}
              </div>
            )}

            {/* Welcome / organizer messages */}
            {portalExperience.welcomeMessage && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 text-sm font-medium shadow-sm">
                💬 {portalExperience.welcomeMessage}
              </div>
            )}
            {portalExperience.organizerMessage && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm shadow-sm">
                <span className="font-black uppercase tracking-wider text-xs text-amber-600 block mb-1">📌 Nota del organizador</span>
                {portalExperience.organizerMessage}
              </div>
            )}

            {/* ── 1. Organización del evento ── */}
            <Card id="seccion-organizacion" className="shadow-lg border-0 rounded-3xl overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Home className="w-5 h-5 text-violet-600" />
                  Organización del evento
                </CardTitle>
                <p className="text-xs text-muted-foreground">Resumen general de tu celebración</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Event details grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {config.tipoCelebracion && (
                    <div className="space-y-0.5 p-2.5 rounded-xl bg-muted/40">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Tipo</p>
                      <p className="font-semibold">{config.tipoCelebracion}</p>
                    </div>
                  )}
                  {eventDate && (
                    <div className="space-y-0.5 p-2.5 rounded-xl bg-muted/40">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Fecha</p>
                      <p className="font-semibold capitalize">{eventDate}</p>
                    </div>
                  )}
                  <div className="space-y-0.5 p-2.5 rounded-xl bg-muted/40">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Lugar</p>
                    <p className={`font-semibold ${!isLocationConfirmed ? 'text-muted-foreground italic' : ''}`}>{displayLocation}</p>
                  </div>
                  {invitadosContratados > 0 && (
                    <div className="space-y-0.5 p-2.5 rounded-xl bg-muted/40">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Invitados</p>
                      <p className="font-semibold">{invitadosContratados}</p>
                    </div>
                  )}
                </div>

                {/* Link to public page */}
                {settings?.paginaPublica?.visible && fiesta.invitacionSlug && (
                  <a
                    href={`/i/${fiesta.invitacionSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-semibold text-primary">Ver página pública del evento</p>
                  </a>
                )}

                {/* Music teaser */}
                {settings?.musica?.visible && musica && (musica.cancionEntrada || musica.cancionVals) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-fuchsia-50 border border-fuchsia-100">
                    <Music className="w-4 h-4 text-fuchsia-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase text-fuchsia-600 tracking-wider">Música del evento</p>
                      <p className="text-sm font-semibold text-fuchsia-800 truncate">
                        {musica.cancionEntrada || musica.cancionVals}
                      </p>
                    </div>
                    <a href="#seccion-musica" className="text-xs text-fuchsia-600 font-semibold shrink-0">Ver →</a>
                  </div>
                )}

                {/* Moodboard teaser */}
                {settings?.moodboard?.visible && moodboardItems.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 border border-pink-100">
                    <Palette className="w-4 h-4 text-pink-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase text-pink-600 tracking-wider">Moodboard</p>
                      <p className="text-sm font-semibold text-pink-800">{moodboardItems.length} imágenes de inspiración</p>
                    </div>
                    <a href="#seccion-moodboard" className="text-xs text-pink-600 font-semibold shrink-0">Ver →</a>
                  </div>
                )}

                {/* Interactive Checklist */}
                {settings?.checklist?.visible && checklist.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Checklist · {checklist.filter(t => t.completada).length} de {checklist.length} completadas
                    </p>
                    {checklist.map((tarea, idx) => (
                      <div key={tarea.id}>
                        {idx > 0 && <Separator className="my-1" />}
                        <div className="flex items-center gap-3 py-2">
                          <Checkbox
                            id={`task-${tarea.id}`}
                            checked={tarea.completada}
                            onCheckedChange={() => handleToggleTask(tarea.id)}
                            disabled={togglingTaskId !== null || !settings.checklist.editable}
                          />
                          <Label
                            htmlFor={`task-${tarea.id}`}
                            className={`text-sm cursor-pointer leading-snug ${tarea.completada ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {tarea.texto}
                          </Label>
                          {togglingTaskId === tarea.id && <Loader2 className="w-3 h-3 ml-auto animate-spin text-muted-foreground shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weather placeholder */}
                {daysUntil !== null && daysUntil > 0 && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-sky-50 border border-sky-100">
                    <div className="p-2 rounded-xl bg-sky-100">
                      <CloudSun className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-sky-800">Clima del día del evento</p>
                      <p className="text-xs text-sky-600">
                        {daysUntil <= 7
                          ? `¡Tu evento es en ${daysUntil} día${daysUntil > 1 ? 's' : ''}! El pronóstico estará disponible próximamente.`
                          : 'El pronóstico se mostrará 7 días antes del evento.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 2. Pagos y documentos ── */}
            {(settings?.pagos?.visible || settings?.informarPago?.visible || settings?.serviciosContratados?.visible || settings?.contrato?.visible || settings?.documentos?.visible) && (
              <button
                onClick={() => setShowPagosPanel(true)}
                className="w-full text-left rounded-3xl shadow-lg border-0 bg-white overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-emerald-100 shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      {presupuesto ? (
                        <>
                          <p className="font-bold text-sm text-slate-800">💳 Pagos y documentos</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${porcentajePagado}%`,
                                  background: isPaid
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isPaid ? 'Saldado ✓' : `Saldo: ${formatCurrency(saldoPendiente)}`}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-sm text-slate-800">📄 Documentos y contrato</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Ver contrato y documentos</p>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>
              </button>
            )}


            {/* ── 3. Lo que tengo que enviar o llevar ── */}
            {debeLlevarItems.length > 0 && (
              <Card id="seccion-llevar" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-teal-50 to-emerald-50">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-teal-600" />
                    Lo que tengo que enviar o llevar
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {debeLlevarItems.filter(i => i.completado).length} de {debeLlevarItems.length} ítems listos
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {debeLlevarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isSavingDebeLlevar}
                      onClick={() => handleToggleDebeLlevar(item.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        item.completado
                          ? 'border-teal-200 bg-teal-50'
                          : 'border-slate-100 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/40'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.completado ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
                      }`}>
                        {item.completado && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                          {item.texto}
                          {item.obligatorio && <span className="ml-1 text-red-500 text-xs">*</span>}
                        </p>
                        {item.notas && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.notas}</p>
                        )}
                      </div>
                      {item.completado && (
                        <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-100 rounded-full px-2 py-0.5 shrink-0">
                          {DEBE_LLEVAR_ESTADO_LABELS[item.estado ?? ''] ?? 'Hecho'}
                        </span>
                      )}
                      {isSavingDebeLlevar && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />}
                    </button>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Tocá cada ítem para marcarlo como listo
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── 4. Comida y bebidas ── */}
            {(settings?.menu?.visible || settings?.cartaTragos?.visible || settings?.dressCode?.visible || calcBebidas?.visible) && (
              <Card id="seccion-comida" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-500" />
                    Comida y bebidas
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Menú, bebidas y vestimenta del evento</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">

                  {/* Event Menu */}
                  {settings?.menu?.visible && fiesta.menuMesa && (fiesta.menuMesa.entrada || fiesta.menuMesa.platoPrincipal || fiesta.menuMesa.postres || fiesta.menuMesa.bebidas) && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Menú del evento</p>
                      {[
                        { label: 'Entrada', value: fiesta.menuMesa.entrada, emoji: '🥗' },
                        { label: 'Plato Principal', value: fiesta.menuMesa.platoPrincipal, emoji: '🍽️' },
                        { label: 'Opción Adolescentes', value: fiesta.menuMesa.adolescentes, emoji: '🍕' },
                        { label: 'Postres', value: fiesta.menuMesa.postres, emoji: '🍰' },
                        { label: 'Bebidas', value: fiesta.menuMesa.bebidas, emoji: '🥂' },
                      ]
                        .filter(row => !!row.value)
                        .map(row => (
                          <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                            <span className="text-xl shrink-0">{row.emoji}</span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{row.label}</p>
                              <p className="font-semibold text-sm leading-snug">{row.value}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Drinks Menu (Carta de Tragos) */}
                  {settings?.cartaTragos?.visible && fiesta.cartaTragos && fiesta.cartaTragos.items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        {fiesta.cartaTragos.titulo || 'Carta de tragos'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {fiesta.cartaTragos.items.map(trago => (
                          <div key={trago.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-muted/60">
                            {trago.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={trago.imageUrl} alt={trago.nombre} className="w-8 h-8 object-cover rounded-lg shrink-0" />
                            ) : (
                              <span className="text-xl shrink-0">🍸</span>
                            )}
                            <p className="font-semibold text-sm leading-tight">{trago.nombre}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dress Code */}
                  {settings?.dressCode?.visible && dressCode?.visible && (dressCode.texto?.text || (dressCode.sugeridos && dressCode.sugeridos.length > 0) || (dressCode.evitar && dressCode.evitar.length > 0)) && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <Shirt className="w-3.5 h-3.5" /> Dress Code
                      </p>
                      {dressCode.texto?.text && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{dressCode.texto.text}</p>
                      )}
                      {dressCode.sugeridos && dressCode.sugeridos.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">✅ Sugerido</p>
                          <div className="flex flex-wrap gap-2">
                            {dressCode.sugeridos.map((s, i) => (
                              <Badge key={i} variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {dressCode.evitar && dressCode.evitar.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">🚫 Evitar</p>
                          <div className="flex flex-wrap gap-2">
                            {dressCode.evitar.map((e, i) => (
                              <Badge key={i} variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 rounded-xl">
                                {e}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Drink calculator */}
                  {calcBebidas?.visible && numInvitados > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <GlassWater className="w-3.5 h-3.5" /> Calculadora de bebidas
                      </p>
                      {bebidasItems.some(b => b.clienteLleva && b.visible) ? (
                        <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          📋 Según tu contrato, vos te encargás de estos ítems para {numInvitados} personas:
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                          Estimación de cantidades para {numInvitados} invitados:
                        </p>
                      )}
                      <div className="space-y-2">
                        {bebidasItems
                          .filter(item => item.visible)
                          .map(item => {
                            const { bg, border, text } = getColorClasses(item.color);
                            const cantidad = Math.round(numInvitados * item.cantidadPorPersona * 10) / 10;
                            return (
                              <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${item.clienteLleva ? 'bg-amber-50 border border-amber-200' : `${bg} border ${border}`}`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{item.emoji}</span>
                                  <div>
                                    <p className="font-bold text-sm">{item.nombre}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.cantidadPorPersona} {item.unidad} por persona
                                      {item.clienteLleva && <span className="ml-1 font-bold text-amber-700">· ✋ Vos traés</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-2xl font-black ${item.clienteLleva ? 'text-amber-700' : text}`}>{cantidad}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.unidad}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Catering Change Simulator */}
                  {presupuesto && invitadosContratados > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Solicitar cambio de menú</p>
                      <CateringSimulator
                        fiestaId={fiesta.id}
                        presupuesto={presupuesto}
                        fiesta={fiesta}
                      />
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* ── 5b. Invitados y mesas ── */}
            {settings?.invitados?.visible && invitados.length > 0 && (
              <Card id="seccion-invitados" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Invitados y mesas
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Estado de confirmación de tus invitados</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                      <p className="text-2xl font-black text-emerald-700">{guestConfirmados.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Confirmados</p>
                      {totalInvitadosConfirmados > guestConfirmados.length && (
                        <p className="text-[10px] text-emerald-500 mt-0.5">{totalInvitadosConfirmados} personas</p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-center">
                      <p className="text-2xl font-black text-amber-700">{guestPendientes.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-0.5">Sin confirmar</p>
                    </div>
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center">
                      <p className="text-2xl font-black text-red-700">{guestCancelados.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mt-0.5">Cancelaron</p>
                    </div>
                  </div>

                  {/* Guest list */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lista de invitados</p>
                    {invitados.map(inv => {
                      const rsvpConfig: Record<RsvpStatus, { label: string; bg: string; text: string; border: string }> = {
                        Confirmado: { label: 'Confirmado', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                        Pendiente: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                        'Tal vez': { label: 'Tal vez', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                        Rechazado: { label: 'No va', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                      };
                      const cfg = rsvpConfig[inv.rsvp as RsvpStatus] ?? rsvpConfig.Pendiente;
                      const isUpdating = updatingRsvpId === inv.id;
                      return (
                        <div key={inv.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${cfg.border} ${cfg.bg}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-snug text-slate-800">{inv.nombre}</p>
                            {inv.partySize && inv.partySize > 1 && (
                              <p className="text-xs text-muted-foreground mt-0.5">Grupo de {inv.partySize} personas</p>
                            )}
                            {inv.tableNumber && (
                              <p className="text-xs text-muted-foreground mt-0.5">Mesa {inv.tableNumber}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                              {cfg.label}
                            </span>
                            {/* Cancel button for confirmed guests */}
                            {inv.rsvp === 'Confirmado' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateGuestRsvp(inv.id, 'Rechazado')}
                                className="text-[10px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-full px-2 py-0.5 transition-colors flex items-center gap-1"
                                title="Cancelar confirmación"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MinusCircle className="w-3 h-3" />}
                                Cancelar
                              </button>
                            )}
                            {/* Re-confirm button for cancelled guests */}
                            {inv.rsvp === 'Rechazado' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateGuestRsvp(inv.id, 'Confirmado')}
                                className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 transition-colors flex items-center gap-1"
                                title="Confirmar asistencia"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Confirmar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </CardContent>
              </Card>
            )}

            {/* ── 6. Itinerario ── */}
            {settings?.itinerario?.visible && (
              <button
                onClick={() => setShowItinerarioPanel(true)}
                className="w-full text-left rounded-3xl shadow-lg border-0 bg-white overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ background: `linear-gradient(135deg, ${eventColor}18, ${eventColor}08)` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl shrink-0" style={{ backgroundColor: `${eventColor}22` }}>
                      <Calendar className="w-5 h-5" style={{ color: eventColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800">📋 Ver itinerario</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {programa.length > 0
                          ? `${programa.length} momento${programa.length !== 1 ? 's' : ''} del evento`
                          : 'El itinerario estará disponible próximamente'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: eventColor }} />
                </div>
              </button>
            )}


            {/* ── 7. Fotos y video ── */}
            {settings?.fotografiaYFilmacion?.visible && fiesta.fotografiaYFilmacion && fiesta.fotografiaYFilmacion.servicios.length > 0 && (
              <Card id="seccion-fotos" className="shadow-lg border-0 rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Fotografía y filmación
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Estado de entrega de los materiales.</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {fiesta.fotografiaYFilmacion.servicios.map(servicio => (
                    <div key={servicio.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
                        <Camera className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800">{servicio.nombre}</p>
                        {servicio.fechaEntregaEstimada && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Entrega estimada: {formatDate(servicio.fechaEntregaEstimada)}
                          </p>
                        )}
                        {servicio.notas && (
                          <p className="text-xs text-slate-500 mt-1">{servicio.notas}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {servicio.estado === 'Entregado completo' || servicio.estado === 'Entregado parcial' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">✓ Entregado</Badge>
                        ) : servicio.linkEntrega ? (
                          <a href={servicio.linkEntrega} target="_blank" rel="noopener noreferrer">
                            <Badge className="bg-primary/10 text-primary border-0 text-xs flex items-center gap-1 cursor-pointer hover:bg-primary/20">
                              <ExternalLink className="w-3 h-3" /> Ver
                            </Badge>
                          </a>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-400">Pendiente</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {fiesta.fotografiaYFilmacion.notasGenerales && (
                    <p className="text-xs text-slate-500 italic px-1">{fiesta.fotografiaYFilmacion.notasGenerales}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── 8. Moodboard ── */}
            {settings?.moodboard?.visible && moodboardItems.length > 0 && (
              <Card id="seccion-moodboard" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Moodboard
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Dales ❤️ a las ideas que más te gustan
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {moodboardItems.map(item => (
                      <div key={item.id} className="relative rounded-2xl overflow-hidden aspect-square bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.description || 'Inspiración'}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setLikedItems(prev => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            })
                          }
                          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                            likedItems.has(item.id)
                              ? 'bg-rose-500 text-white'
                              : 'bg-white/80 text-rose-500'
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={likedItems.has(item.id) ? 'currentColor' : 'none'} />
                        </button>
                        {item.description && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-[10px] font-medium leading-tight">{item.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── 9. Música ── */}
            {settings?.musica?.visible && (
              <Card id="seccion-musica" className="shadow-lg border-0 rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Música
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {musica && (musica.cancionEntrada || musica.cancionVals || (musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0) || musica.listaNoReproducir) ? (
                    <>
                  {musica.cancionEntrada && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                      <span className="text-lg">🎵</span>
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Canción de Entrada</p>
                        <p className="font-semibold text-sm">{musica.cancionEntrada}</p>
                      </div>
                    </div>
                  )}
                  {musica.cancionVals && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                      <span className="text-lg">💃</span>
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Vals / Baile</p>
                        <p className="font-semibold text-sm">{musica.cancionVals}</p>
                      </div>
                    </div>
                  )}
                  {musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                      <span className="text-lg">🥂</span>
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">Torta / Brindis</p>
                        {musica.cancionesTortaBrindis.map((c, i) => (
                          <p key={i} className="font-semibold text-sm">{c}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {musica.listaNoReproducir && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-lg">🚫</span>
                      <div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">No Reproducir</p>
                        <p className="text-sm text-muted-foreground">{musica.listaNoReproducir}</p>
                      </div>
                    </div>
                  )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-xl">
                      🎵 La información de música estará disponible próximamente.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── 10. Preguntas frecuentes ── */}
            {settings?.faq?.visible && (
              <Card id="seccion-faq" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Preguntas frecuentes
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Todo lo que necesitás saber</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {faqItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay preguntas frecuentes por el momento.
                    </p>
                  ) : (
                    faqItems.map((faq, idx) => (
                      <div key={faq.id}>
                        {idx > 0 && <Separator className="my-1" />}
                        <button
                          className="w-full flex items-center justify-between gap-3 py-3 px-1 text-left"
                          onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                        >
                          <span className="font-semibold text-sm leading-snug">{faq.pregunta}</span>
                          {openFaqId === faq.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {openFaqId === faq.id && (
                          <div className="pb-3 px-1">
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.respuesta}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── 11. Simulador de invitados ── */}
            {!!presupuesto && (presupuesto.itemsPresupuestados?.length ?? 0) > 0 && (
              <Card id="seccion-simulador" className="shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2" style={{ background: `linear-gradient(135deg, ${eventColor}18, ${eventColor}08)` }}>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: eventColor }} />
                    Simulador de invitados
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Calculá el impacto real en el costo si sumás más invitados. Sincronizado con tu presupuesto.</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border bg-muted/20 p-3 space-y-2">
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Adultos a agregar
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                          onClick={() => setAdultDelta((d) => Math.max(0, d - 1))}
                          disabled={adultDelta <= 0}
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <p className="text-2xl font-black tabular-nums">+{adultDelta}</p>
                        <button
                          className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                          onClick={() => setAdultDelta((d) => Math.min(effectiveMaxAdult, d + 1))}
                          disabled={adultDelta >= effectiveMaxAdult}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">Máx. {effectiveMaxAdult}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/20 p-3 space-y-2">
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Niños/Adolesc. a agregar
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                          onClick={() => setKidsDelta((d) => Math.max(0, d - 1))}
                          disabled={kidsDelta <= 0}
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <p className="text-2xl font-black tabular-nums">+{kidsDelta}</p>
                        <button
                          className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                          onClick={() => setKidsDelta((d) => Math.min(effectiveMaxKids, d + 1))}
                          disabled={kidsDelta >= effectiveMaxKids}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">Máx. {effectiveMaxKids}</p>
                    </div>
                  </div>

                  {/* Budget-synced simulation results */}
                  {guestSim && (() => {
                    const sim = guestSim;
                    const hasChanges = adultDelta > 0 || kidsDelta > 0;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border bg-slate-50 p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Invitados actuales</p>
                            <p className="text-2xl font-black">{sim.totalActual}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {sim.adultosActuales} adultos · {sim.ninosActuales} menores
                            </p>
                          </div>
                          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: hasChanges ? `${eventColor}60` : undefined, backgroundColor: hasChanges ? `${eventColor}08` : '#f8fafc' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Nuevos invitados totales</p>
                            <p className="text-2xl font-black" style={{ color: hasChanges ? eventColor : undefined }}>{sim.totalNuevo}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {sim.adultosNuevos} adultos · {sim.ninosNuevos} menores
                            </p>
                          </div>
                        </div>

                        {hasChanges && (
                          <div className="space-y-2">
                            {sim.serviciosFijos.length > 0 && (
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Servicios fijos (no cambian)
                                </p>
                                <div className="space-y-1">
                                  {sim.serviciosFijos.slice(0, 4).map((s, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                      <span className="text-slate-600 truncate flex-1">{s.nombre}</span>
                                      <span className="text-slate-500 shrink-0 ml-2 font-medium">{formatCurrency(s.costo)}</span>
                                    </div>
                                  ))}
                                  {sim.serviciosFijos.length > 4 && (
                                    <p className="text-xs text-slate-400">+{sim.serviciosFijos.length - 4} más...</p>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs font-bold">
                                  <span className="text-slate-600">Total fijo</span>
                                  <span className="text-slate-700">{formatCurrency(sim.costosFijosActuales)}</span>
                                </div>
                              </div>
                            )}

                            {sim.serviciosVariables.length > 0 && (
                              <div className="rounded-2xl border p-3" style={{ borderColor: `${eventColor}30`, backgroundColor: `${eventColor}06` }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: eventColor }}>
                                  <TrendingUp className="w-3 h-3" /> Servicios por persona (cambian)
                                </p>
                                <div className="space-y-1">
                                  {sim.serviciosVariables.slice(0, 5).map((s, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs gap-2">
                                      <span className="text-slate-600 truncate flex-1">{s.nombre}</span>
                                      <span className="text-slate-400 shrink-0">{formatCurrency(s.costoActual)}</span>
                                      <span className="text-[10px] text-slate-400">→</span>
                                      <span className="shrink-0 font-bold" style={{ color: eventColor }}>{formatCurrency(s.costoNuevo)}</span>
                                    </div>
                                  ))}
                                  {sim.serviciosVariables.length > 5 && (
                                    <p className="text-xs text-slate-400">+{sim.serviciosVariables.length - 5} más...</p>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t flex justify-between text-xs font-bold" style={{ borderColor: `${eventColor}20` }}>
                                  <span className="text-slate-600">Impacto variable</span>
                                  <span style={{ color: eventColor }}>+{formatCurrency(sim.costoVariableNuevo - sim.costoVariableActual)}</span>
                                </div>
                              </div>
                            )}

                            <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${eventColor}, ${eventColor}cc)` }}>
                              <div className="grid grid-cols-2 gap-3 text-center">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total actual</p>
                                  <p className="text-xl font-black">{formatCurrency(sim.costoActual)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Nuevo total estimado</p>
                                  <p className="text-xl font-black">{formatCurrency(sim.costoNuevo)}</p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-white/20 text-center">
                                <p className="text-[10px] uppercase tracking-widest opacity-80">Impacto estimado</p>
                                <p className="text-2xl font-black mt-0.5">
                                  {sim.impacto >= 0 ? '+' : ''}{formatCurrency(sim.impacto)}
                                </p>
                                {sim.impacto > 0 && (adultDelta + kidsDelta) > 0 && (
                                  <p className="text-[11px] opacity-80 mt-1">
                                    ≈ {formatCurrency(Math.round(sim.impacto / (adultDelta + kidsDelta)))} por invitado adicional
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-700">Esta es una estimación basada en el presupuesto. El monto final lo confirma el equipo AK.</p>
                            </div>
                          </div>
                        )}

                        {!hasChanges && (
                          <p className="text-center text-xs text-muted-foreground py-2">
                            Ajustá las cantidades para ver el impacto estimado en el costo de tu evento.
                          </p>
                        )}

                        {hasChanges && (
                          <div className="space-y-2">
                            <Textarea
                              value={simRequestNote}
                              onChange={(e) => setSimRequestNote(e.target.value)}
                              placeholder="Nota opcional para el equipo (ej: son invitados de última hora de la mesa 5)."
                              rows={2}
                              className="rounded-xl text-sm"
                            />
                            <Button
                              className="w-full rounded-xl font-bold"
                              style={{ backgroundColor: eventColor, borderColor: eventColor }}
                              onClick={handleSubmitMenuRequest}
                              disabled={simRequestLoading}
                            >
                              {simRequestLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                              Enviar solicitud al equipo AK
                            </Button>
                          </div>
                        )}

                        {menuChangeRequests.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Solicitudes recientes</p>
                            {menuChangeRequests.slice(-3).reverse().map((request) => (
                              <div key={request.id} className="rounded-xl border bg-muted/30 px-3 py-2 text-xs flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold">+{request.adultosDelta} adultos · +{request.ninosAdolescentesDelta} niños/adolescentes</p>
                                  <p className="text-muted-foreground">{formatDate(request.createdAt)}</p>
                                </div>
                                <Badge variant="outline" className="uppercase text-[10px]">{request.status}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* ── 12. Lista de regalos ── */}
            {settings?.listaRegalos?.visible && fiesta.invitacionDigital?.regalos?.items && fiesta.invitacionDigital.regalos.items.length > 0 && (
              <Card className="shadow-lg border-0 rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Lista de regalos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {fiesta.invitacionDigital.regalos.items.filter(i => i.isClaimed).length} de {fiesta.invitacionDigital.regalos.items.length} regalos elegidos
                  </p>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {fiesta.invitacionDigital.regalos.items.map(item => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${item.isClaimed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${item.isClaimed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-800'}`}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                        {item.isClaimed && item.claimedBy && (
                          <p className="text-xs text-emerald-600 mt-0.5">Por: {item.claimedBy}</p>
                        )}
                      </div>
                      {item.isClaimed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs shrink-0">✓ Elegido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-slate-400 shrink-0">Disponible</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── 13. Mensajes con AK ── */}
            {settings?.notasCliente?.visible && (
              <Card id="seccion-mensajes" className="shadow-lg border-0 rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Mensajes con AK
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Dejá un mensaje o consulta para el equipo de {companyName}.
                  </p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Textarea
                    placeholder="Escribe aquí tus notas, consultas o comentarios..."
                    value={notes}
                    onChange={handleNotesChange}
                    disabled={!settings.notasCliente.editable || isSavingNotes}
                    rows={4}
                    className="resize-none rounded-xl text-sm"
                  />
                  {settings.notasCliente.editable && (
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="w-full rounded-xl"
                      variant={notesSaved ? 'outline' : 'default'}
                    >
                      {isSavingNotes ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                      ) : notesSaved ? (
                        '✓ Notas guardadas'
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Guardar Notas</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── 14. Contact card ── */}
            <Card className="shadow-lg border-0 rounded-3xl">
              <CardContent className="py-6 space-y-3">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  ¿Tenés alguna consulta?
                </p>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-bold text-base shadow-lg"
                    size="lg"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Contactar por WhatsApp
                  </Button>
                </a>
                <p className="text-center text-xs text-muted-foreground">{companyName}</p>
              </CardContent>
            </Card>

          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:w-80 lg:sticky lg:top-4 space-y-4">

            {/* Tareas pendientes */}
            <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-teal-50 to-emerald-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-600" />
                  Tareas pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {pendingDebeLlevar.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No tenés tareas pendientes por ahora.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingDebeLlevar.map(item => (
                      <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                        <p className="text-sm font-semibold leading-snug">{item.texto}</p>
                        {item.notas && (
                          <p className="text-xs text-muted-foreground">{item.notas}</p>
                        )}
                        {item.fechaLimite && (
                          <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Límite: {formatDate(item.fechaLimite)}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {item.estado ?? 'pendiente'}
                          </Badge>
                          <button
                            type="button"
                            disabled={isSavingDebeLlevar}
                            onClick={() => handleToggleDebeLlevar(item.id)}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
                          >
                            {isSavingDebeLlevar ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Marcar como enviado
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mensajes con AK (sidebar preview) */}
            <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-600" />
                  Mensajes con AK
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {fiesta.clientNotes ? (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {fiesta.clientNotes.slice(0, 150)}{fiesta.clientNotes.length > 150 ? '...' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    Todavía no hay mensajes compartidos.
                  </p>
                )}
                <button
                  className="w-full rounded-xl text-xs font-semibold py-2 px-3 bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5"
                  onClick={() => document.getElementById('seccion-mensajes')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar mensaje
                </button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Floating WhatsApp button */}
      <div className="fixed bottom-6 right-4 z-50">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <Button
            className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1eb356] text-white shadow-2xl p-0"
            aria-label="Contactar por WhatsApp"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </a>
      </div>

      {/* Informar Pago Modal */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm space-y-4 p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="font-black text-lg">Informar Pago</h2>
              </div>
              <button
                onClick={() => setShowPagoModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Ingresá el monto transferido y subí la foto de tu comprobante.
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Monto Pagado
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="Ej: 5000"
                value={pagoMonto}
                onChange={e => setPagoMonto(e.target.value)}
                className="h-12 rounded-2xl bg-slate-50 border-slate-200 text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Comprobante / Foto del Recibo
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handlePagoFileChange}
              />
              {pagoFilePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  {pagoFile?.type.startsWith('image/') ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={pagoFilePreview}
                      alt="Comprobante"
                      className="w-full max-h-40 object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-slate-50">
                      <FileCheck2 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium truncate">{pagoFile?.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setPagoFile(null); setPagoFilePreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground"
                >
                  <Upload className="w-7 h-7 text-primary" />
                  <span className="text-sm font-medium">Subir comprobante</span>
                  <span className="text-xs">Foto, captura o PDF</span>
                </button>
              )}
            </div>

            <Button
              onClick={handleSubmitPago}
              disabled={pagoSubmitting || !pagoMonto || parseFloat(pagoMonto) <= 0}
              className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
            >
              {pagoSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Enviar Pago
            </Button>
          </div>
        </div>
      )}

      {/* ── Itinerario Panel (bottom sheet on mobile, modal on desktop) ── */}
      {showItinerarioPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowItinerarioPanel(false)}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: `linear-gradient(135deg, ${eventColor}18, ${eventColor}08)` }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: eventColor }} />
                <h2 className="font-black text-base">Itinerario</h2>
              </div>
              <button
                onClick={() => setShowItinerarioPanel(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {programa.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-2xl text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">El itinerario no está disponible aún</p>
                  <p className="text-xs mt-1">El equipo AK lo cargará próximamente.</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2.5 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: `${eventColor}40` }} />
                  <div className="space-y-0">
                    {programa.map((item) => {
                      const isOpen = openProgramaIds.has(item.id);
                      const toggleItem = () => setOpenProgramaIds(prev => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                      const ItemIcon = getItineraryIcon(item.titulo || '');
                      return (
                        <div key={item.id} className="relative flex items-start gap-4 py-2">
                          <div className="absolute -left-3.5 top-4 w-4 h-4 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: eventColor }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              className="w-full flex items-center gap-2 py-1 text-left"
                              onClick={toggleItem}
                            >
                              <div className="flex items-center gap-2 flex-1 flex-wrap">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: eventColor }}>
                                  {item.hora}
                                </span>
                                <ItemIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                <span className="font-semibold text-sm">{item.titulo}</span>
                              </div>
                              {item.descripcion && (
                                isOpen
                                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </button>
                            {isOpen && item.descripcion && (
                              <div className="mt-1 mb-2 pl-1">
                                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-xl px-3 py-2">
                                  {item.descripcion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pagos y documentos Panel (full-screen slide-up) ── */}
      {showPagosPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPagosPanel(false)}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h2 className="font-black text-base">Pagos y documentos</h2>
              </div>
              <button
                onClick={() => setShowPagosPanel(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* No presupuesto placeholder */}
              {!presupuesto && (
                <div className="text-center py-6 border border-dashed rounded-2xl text-muted-foreground">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Sin presupuesto cargado aún</p>
                  <p className="text-xs mt-1">El equipo AK lo cargará próximamente.</p>
                </div>
              )}

              {/* Payments & Balance */}
              {settings?.pagos?.visible && presupuesto && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>{Math.round(porcentajePagado)}% pagado</span>
                      <span>{formatCurrency(totalPagado)} de {formatCurrency(totalCosto)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentajePagado}%`,
                          background: isPaid
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : 'linear-gradient(90deg, #f59e0b, #d97706)',
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total del evento</span>
                      <span className="font-bold">{formatCurrency(totalCosto)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Total pagado
                      </span>
                      <span className="font-bold text-emerald-700">{formatCurrency(totalPagado)}</span>
                    </div>
                    <Separator />
                    <div className={`flex justify-between items-center rounded-xl p-3 ${isPaid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <span className={`font-black uppercase text-sm tracking-tight flex items-center gap-2 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {isPaid ? 'CUENTA SALDADA' : 'SALDO PENDIENTE'}
                      </span>
                      <span className={`font-black text-lg ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isPaid ? formatCurrency(0) : formatCurrency(saldoPendiente)}
                      </span>
                    </div>
                  </div>
                  {pagos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        Historial de Pagos
                      </p>
                      <div className="border rounded-xl overflow-hidden text-sm">
                        {pagos.map((pago, idx) => (
                          <div key={pago.id}>
                            {idx > 0 && <Separator />}
                            <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="secondary" className="flex items-center gap-1 text-[9px] font-bold uppercase shrink-0">
                                  <MetodoPagoIcon metodo={pago.metodoPago} />
                                  {pago.metodoPago}
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate">{formatDate(pago.fecha)}</span>
                              </div>
                              <span className="font-bold text-emerald-700 shrink-0">{formatCurrency(pago.monto)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pagos.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-xs border border-dashed rounded-xl">
                      Sin pagos registrados aún
                    </div>
                  )}
                </div>
              )}

              {/* Informar Pago VIP */}
              {settings?.informarPago?.visible !== false && presupuesto && saldoPendiente > 0 && (
                <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900 to-primary p-6 space-y-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/20">
                      <Crown className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <p className="font-black text-lg">Informar un Pago</p>
                      <p className="text-xs text-white/70">Subí tu comprobante y lo verificamos al instante</p>
                    </div>
                  </div>
                  {settings?.cuentasBancarias && settings.cuentasBancarias.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        Datos Bancarios para Transferencia
                      </p>
                      {settings.cuentasBancarias.map((cuenta) => (
                        <div key={cuenta.id} className="flex items-start gap-3 bg-white/10 rounded-2xl px-4 py-3">
                          <Building2 className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-bold">{cuenta.banco}</p>
                            <p className="text-white/80">{cuenta.titular}</p>
                            <p className="text-white/60 text-xs font-mono">{cuenta.numero}</p>
                            {cuenta.tipo && <p className="text-white/50 text-xs">{cuenta.tipo}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {pagoSuccess ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <CheckCircle2 className="w-10 h-10 text-green-300" />
                      <p className="font-black text-lg">¡Pago informado!</p>
                      <p className="text-sm text-white/70">
                        Recibirás confirmación cuando lo verifiquemos. 🎉
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleOpenInformarPago}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-base shadow-lg border-0"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Informar Pago
                    </Button>
                  )}
                </div>
              )}

              {/* Services / Budget Breakdown */}
              {settings?.serviciosContratados?.visible && itemsPresupuestados.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    ¿Qué estoy contratando?
                  </p>
                  {presupuesto?.nombrePromocion && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                      <Star className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-xs font-semibold text-primary">Promoción aplicada: {presupuesto.nombrePromocion}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {itemsPresupuestados.map((item, index) => (
                      <div key={`${item.idServicioCatalogo}-${index}`} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/40 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-snug">{item.nombreServicio}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.cantidad} {item.unidad || 'unidad'}{item.cantidad > 1 ? 'es' : ''}{item.categoriaServicio ? ` · ${item.categoriaServicio}` : ''}
                          </p>
                        </div>
                        {item.esRegalo && (
                          <Badge variant="secondary" className="text-[9px] shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                            🎁 Incluido
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract and Documents */}
              {settings?.contrato?.visible && (fiesta.contratoServicioTexto || fiesta.contratoFirmaInfo || (fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0)) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5" />
                    Contrato y Documentos
                  </p>
                  {(fiesta.contratoServicioTexto || fiesta.contratoFirmaInfo) && (
                    <>
                      {fiesta.contratoFirmaInfo?.isSigned ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-emerald-800 text-sm">Contrato Firmado ✅</p>
                            {fiesta.contratoFirmaInfo.signedAt && (
                              <p className="text-xs text-emerald-700">
                                {formatDate(fiesta.contratoFirmaInfo.signedAt)}
                                {fiesta.contratoFirmaInfo.method === 'digital' ? ' · Digital' : fiesta.contratoFirmaInfo.method === 'physical' ? ' · Físico' : ''}
                              </p>
                            )}
                          </div>
                          <a href={`/portal/${fiesta.id}/contrato`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="rounded-xl shrink-0 text-xs gap-1">
                              <ExternalLink className="w-3 h-3" /> Ver
                            </Button>
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <p className="font-bold text-amber-800 text-sm">Pendiente de firma ⏳</p>
                              <p className="text-xs text-amber-700">Tu contrato aún no fue firmado</p>
                            </div>
                          </div>
                          <a href={`/portal/${fiesta.id}/contrato`}>
                            <Button size="sm" className="rounded-xl shrink-0 text-xs">
                              Firmar
                            </Button>
                          </a>
                        </div>
                      )}
                    </>
                  )}
                  {fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0 && (
                    <div className="space-y-1.5">
                      {fiesta.othersDocumentos.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-muted/60">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{doc.nombre}</p>
                            <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <PublicFooter variant="light" />
    </div>
  );
}
