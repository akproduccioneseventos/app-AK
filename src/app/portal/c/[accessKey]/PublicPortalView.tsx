
'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FiestaEnPlanificacion, ClientTarea, MoodboardItem, ProgramaEventoItem, BebidaCalculable, FaqItem, CuentaBancaria } from '@/types/fiesta';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateClientChecklist, updateClientNotes, submitClientPayment, submitClientMenuChangeRequest } from '@/app/actions/fiesta/portal.actions';
import { defaultBebidaItems } from '@/lib/fiesta-defaults';
import { PublicFooter } from '@/components/public-footer';
import { calculateMenuSimulationTotals, resolveMenuUnitPrices } from '@/lib/portal-menu-simulator';
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

export default function PublicPortalView({
  fiesta,
  companyContact,
  companyName,
  presupuesto,
}: PublicPortalViewProps) {
  const topMenuId = 'menu-principal-vip';
  const { configuracion: config, clientPortalSettings: settings } = fiesta;
  const countdown = useCountdown(config.fechaEvento);

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

  // Active section navigation (null = home screen)
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
  const simulationTotals = calculateMenuSimulationTotals({
    adultosDelta: adultDelta,
    ninosAdolescentesDelta: kidsDelta,
    adultUnitPrice: adultUnit,
    kidsUnitPrice: kidsUnit,
    currentTotal: totalCosto,
  });

  // Drink calculator
  const calcBebidas = settings?.calculadoraBebidas;
  const invitados = config.invitadosEstimados || 0;
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
      await submitClientMenuChangeRequest(fiesta.id, {
        adultosDelta: adultDelta,
        ninosAdolescentesDelta: kidsDelta,
        montoAdicional: simulationTotals.aumentoTotal,
        nuevoTotalEstimado: simulationTotals.nuevoTotal,
        notaCliente: simRequestNote,
      });
      setAdultDelta(0);
      setKidsDelta(0);
      setSimRequestNote('');
    } finally {
      setSimRequestLoading(false);
    }
  };

  const visibleSections = [
    {
      id: 'fotografiaYFilmacion',
      label: 'Fotografía y Filmación',
      icon: Camera,
      visible: settings?.fotografiaYFilmacion?.visible,
      description: 'Detalles del registro del evento.',
    },
    {
      id: 'listaRegalos',
      label: 'Lista de Regalos',
      icon: Gift,
      visible: settings?.listaRegalos?.visible,
      description: 'Gestiona tu lista de deseos.',
    },
  ].filter(s => s.visible);

  // Sections that have real rendered content above and don't need the "visibleSections" list
  const sectionsWithContent = new Set(['fotografiaYFilmacion', 'listaRegalos']);
  const remainingVisibleSections = visibleSections.filter(s => !sectionsWithContent.has(s.id));

  // Home screen section cards
  const homeSections = [
    { id: 'overview', label: 'Resumen', emoji: '🏠', color: 'from-violet-500 to-purple-600', desc: 'Cuenta regresiva y alertas', icon: Home },
    { id: 'pagos', label: 'Pagos y Saldo', emoji: '💰', color: 'from-emerald-500 to-teal-600', desc: 'Estado de cuenta e informar pago', icon: DollarSign, visible: settings?.pagos?.visible && !!presupuesto },
    { id: 'presupuesto', label: 'Presupuesto', emoji: '📊', color: 'from-blue-500 to-cyan-600', desc: 'Desglose de servicios contratados', icon: FileText, visible: settings?.serviciosContratados?.visible && itemsPresupuestados.length > 0 },
    { id: 'checklist', label: 'Checklist', emoji: '✅', color: 'from-amber-500 to-orange-500', desc: 'Tareas pendientes de tu evento', icon: ClipboardList, visible: settings?.checklist?.visible && checklist.length > 0 },
    { id: 'menu', label: 'Menú y Comidas', emoji: '🍽️', color: 'from-rose-500 to-pink-600', desc: 'Menú, bebidas y dress code', icon: Utensils, visible: settings?.menu?.visible },
    { id: 'musica', label: 'Música', emoji: '🎵', color: 'from-fuchsia-500 to-purple-600', desc: 'Canciones y preferencias musicales', icon: Music, visible: settings?.musica?.visible && !!musica },
    { id: 'fotografia', label: 'Fotos y Video', emoji: '📸', color: 'from-sky-500 to-blue-600', desc: 'Servicios fotográficos y regalos', icon: Camera, visible: settings?.fotografiaYFilmacion?.visible },
    { id: 'moodboard', label: 'Moodboard', emoji: '🎨', color: 'from-pink-500 to-rose-600', desc: 'Inspiración y estética del evento', icon: Palette, visible: settings?.moodboard?.visible && moodboardItems.length > 0 },
    { id: 'documentos', label: 'Documentos', emoji: '📄', color: 'from-slate-500 to-gray-600', desc: 'Contrato y documentación', icon: FileSignature, visible: settings?.contrato?.visible || settings?.documentos?.visible },
    { id: 'ubicacion', label: 'Ubicación', emoji: '📍', color: 'from-green-500 to-emerald-600', desc: 'Dirección y cómo llegar', icon: MapPin, visible: settings?.ubicacion?.visible && !!celebracion },
    { id: 'itinerario', label: 'Itinerario', emoji: '📅', color: 'from-indigo-500 to-violet-600', desc: 'Programa del evento', icon: Calendar, visible: settings?.itinerario?.visible && programa.length > 0 },
    { id: 'simulador-catering', label: 'Simulador Catering', emoji: '🍴', color: 'from-orange-500 to-amber-600', desc: 'Solicitar cambios de menú', icon: Utensils, visible: !!presupuesto && invitadosContratados > 0 },
    { id: 'simulador-invitados', label: 'Simulador Invitados', emoji: '👥', color: 'from-purple-500 to-indigo-600', desc: 'Simular cambios en la cantidad', icon: Users, visible: settings?.simuladorInvitados?.visible && invitadosContratados > 0 },
    { id: 'faq', label: 'Preguntas Frecuentes', emoji: '❓', color: 'from-teal-500 to-cyan-600', desc: 'Dudas y consultas comunes', icon: HelpCircle, visible: settings?.faq?.visible && faqItems.length > 0 },
    { id: 'notas', label: 'Notas Compartidas', emoji: '📝', color: 'from-yellow-500 to-amber-500', desc: 'Anotaciones y comentarios', icon: MessageSquare, visible: settings?.notasCliente?.visible },
    { id: 'regalos', label: 'Lista de Regalos', emoji: '🎁', color: 'from-red-500 to-rose-600', desc: 'Lista de deseos y regalos', icon: Gift, visible: settings?.listaRegalos?.visible },
  ].filter(s => s.visible !== false);

  const sectionTitles: Record<string, string> = {
    overview: 'Resumen del Evento',
    pagos: 'Pagos y Saldo',
    presupuesto: 'Presupuesto',
    checklist: 'Checklist',
    menu: 'Menú y Comidas',
    musica: 'Música',
    fotografia: 'Fotos y Video',
    moodboard: 'Moodboard',
    documentos: 'Documentos',
    ubicacion: 'Ubicación',
    itinerario: 'Itinerario',
    'simulador-catering': 'Simulador de Catering',
    'simulador-invitados': 'Simulador de Invitados',
    faq: 'Preguntas Frecuentes',
    notas: 'Notas Compartidas',
    regalos: 'Lista de Regalos',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* HOME Hero - VIP Styling (only shown on home screen) */}
      {activeSection === null && (
      <div className="relative bg-gradient-to-br from-violet-900 via-primary to-violet-700 text-primary-foreground px-4 pb-10 pt-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Star className="absolute top-6 right-8 w-20 h-20 text-yellow-300 rotate-12" />
          <Star className="absolute bottom-4 left-6 w-12 h-12 text-yellow-300 -rotate-12" />
          <Sparkles className="absolute top-12 left-12 w-8 h-8 text-yellow-200 rotate-45" />
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/20">
              {companyName}
            </Badge>
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 font-black text-xs px-3 py-1 shadow-lg">
              <Crown className="w-3 h-3 mr-1" />
              PORTAL VIP
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            {config.nombreEvento || 'Tu Evento Especial'}
          </h1>
          {config.protagonista1Nombre && (
            <p className="text-lg font-medium opacity-90">
              ✨ {config.protagonista1Nombre}
              {config.protagonista2Nombre && ` & ${config.protagonista2Nombre}`}
            </p>
          )}
          {eventDate && (
            <div className="flex items-center justify-center gap-2 opacity-90">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{eventDate}</span>
            </div>
          )}
          {config.horaInicio && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {config.horaInicio}
                {config.horaFin ? ` — ${config.horaFin}` : ''}
              </span>
            </div>
          )}
          {config.nombreLugar && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{config.nombreLugar}</span>
            </div>
          )}
          {config.invitadosEstimados > 0 && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <Users className="w-4 h-4" />
              <span className="text-sm">{config.invitadosEstimados} invitados</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* SECTION Header (back button, shown when a section is active) */}
      {activeSection !== null && (
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Inicio
            </button>
            <div className="flex-1 text-center">
              <span className="text-white font-bold text-sm">{sectionTitles[activeSection] ?? activeSection}</span>
            </div>
            <div className="w-14" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* HOME GRID - shown when no section is active */}
      {activeSection === null && (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
          {/* Alert banners on home */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              {alertas.map((alerta, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    alerta.type === 'amber'
                      ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
                      : alerta.type === 'emerald'
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
                      : 'bg-blue-500/20 border border-blue-400/40 text-blue-200'
                  }`}
                >
                  {alerta.message}
                </div>
              ))}
            </div>
          )}
          {/* Countdown on home */}
          {config.fechaEvento && countdown && !countdown.isPast && (
            <div className="bg-gradient-to-br from-violet-600/80 to-purple-800/80 backdrop-blur rounded-3xl p-5 text-white text-center border border-white/10">
              <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-3">🎉 ¡Faltan para tu evento!</p>
              <div className="grid grid-cols-4 gap-2">
                <CountdownUnit value={countdown.days} label="Días" />
                <CountdownUnit value={countdown.hours} label="Horas" />
                <CountdownUnit value={countdown.minutes} label="Min" />
                <CountdownUnit value={countdown.seconds} label="Seg" />
              </div>
            </div>
          )}
          {countdown?.isPast && (
            <div className="bg-gradient-to-br from-violet-600/80 to-purple-800/80 backdrop-blur rounded-3xl p-6 text-white text-center border border-white/10">
              <p className="text-2xl font-black">🎉 ¡Tu evento ya fue!</p>
              <p className="text-sm opacity-70 mt-1">¡Esperamos que haya sido increíble!</p>
            </div>
          )}
          {/* Section cards grid */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3 px-1">Secciones</p>
            <div className="grid grid-cols-2 gap-3">
              {homeSections.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${section.color} shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl leading-none">{section.emoji}</span>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{section.label}</p>
                        <p className="text-white/70 text-xs mt-0.5 leading-tight line-clamp-2">{section.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="absolute right-2 bottom-2 w-4 h-4 text-white/40" />
                  </button>
                );
              })}
            </div>
          </div>
          {/* Contact card on home */}
          <div className="bg-white/5 backdrop-blur rounded-3xl p-5 border border-white/10 text-center space-y-3">
            <p className="text-white/70 text-sm">¿Tenés alguna consulta?</p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button className="w-full h-11 rounded-2xl font-bold bg-[#25D366] hover:bg-[#1eb356] text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contactar por WhatsApp
              </Button>
            </a>
            <p className="text-white/40 text-xs">{companyName}</p>
          </div>
        </div>
      )}

      {/* SECTION CONTENT - shown when a section is active */}
      {activeSection !== null && (
      <div className="max-w-lg mx-auto px-4 -mt-0 space-y-5 pb-28 pt-4">

        {/* Smart Alert Banners */}
        {activeSection === 'overview' && alertas.length > 0 && (
          <div className="space-y-2 pt-1">
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

        {/* Countdown */}
        {activeSection === 'overview' && config.fechaEvento && countdown && !countdown.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-700 text-white">
            <CardContent className="pt-5 pb-5">
              <p className="text-center text-xs uppercase tracking-widest font-bold opacity-80 mb-3">
                🎉 ¡Faltan para tu evento!
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <CountdownUnit value={countdown.days} label="Días" />
                <CountdownUnit value={countdown.hours} label="Horas" />
                <CountdownUnit value={countdown.minutes} label="Min" />
                <CountdownUnit value={countdown.seconds} label="Seg" />
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'overview' && countdown?.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl bg-primary text-primary-foreground">
            <CardContent className="py-6 text-center">
              <p className="text-2xl font-black">🎉 ¡Tu evento ya fue!</p>
              <p className="text-sm opacity-80 mt-1">¡Esperamos que haya sido increíble!</p>
            </CardContent>
          </Card>
        )}

        <Card id={topMenuId} className="shadow-lg border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-violet-50">
            <CardTitle className="text-base font-bold flex items-center justify-between gap-2">
              <span>Menú principal VIP</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-xl text-xs"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    document.getElementById(topMenuId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Atrás
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'seccion-pagos', label: 'Pagos' },
                { id: 'seccion-servicios', label: 'Servicios' },
                { id: 'seccion-menu', label: 'Menú' },
                { id: 'seccion-simulador', label: 'Simulador' },
                { id: 'seccion-itinerario', label: 'Cronograma' },
                { id: 'seccion-moodboard', label: 'Decoración' },
                { id: 'seccion-faq', label: 'FAQ' },
                { id: 'seccion-notas', label: 'Notas' },
              ].map((item) => (
                <a key={item.id} href={`#${item.id}`}>
                  <Button variant="outline" className="w-full rounded-xl text-xs">{item.label}</Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payments & Balance */}
        {activeSection === 'pagos' && settings?.pagos?.visible && presupuesto && (
          <Card id="seccion-pagos" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pagos y Saldo
              </CardTitle>
              <p className="text-xs text-muted-foreground">Resumen de tu estado de cuenta</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Progress bar */}
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

              {/* Summary rows */}
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

              {/* Payment history */}
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
            </CardContent>
          </Card>
        )}

        {/* Informar Pago VIP Section */}
        {activeSection === 'pagos' && settings?.informarPago?.visible !== false && presupuesto && saldoPendiente > 0 && (
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900 to-primary">
            <CardContent className="pt-6 pb-6 space-y-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Crown className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <p className="font-black text-lg">Informar un Pago</p>
                  <p className="text-xs text-white/70">Subí tu comprobante y lo verificamos al instante</p>
                </div>
              </div>

              {/* Bank accounts */}
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
                  onClick={() => setShowPagoModal(true)}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-base shadow-lg border-0"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Informar Pago
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Services / Budget Breakdown */}
        {activeSection === 'presupuesto' && settings?.serviciosContratados?.visible && itemsPresupuestados.length > 0 && (
          <Card id="seccion-servicios" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-primary/5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                ¿Qué estoy contratando?
              </CardTitle>
              <p className="text-xs text-muted-foreground">Lista exacta tomada del presupuesto confirmado</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
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
            </CardContent>
          </Card>
        )}

        {/* Contract Summary + Documents */}
        {activeSection === 'documentos' && settings?.contrato?.visible && (fiesta.contratoServicioTexto || fiesta.contratoFirmaInfo || (fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0)) && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                Contrato y Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {(fiesta.contratoServicioTexto || fiesta.contratoFirmaInfo) && (
                <>
                  {fiesta.contratoFirmaInfo?.isSigned ? (
                    <div className="space-y-2">
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
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {config.tipoCelebracion && (
                      <div className="space-y-0.5 p-2 rounded-lg bg-muted/40">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Tipo</p>
                        <p className="font-semibold">{config.tipoCelebracion}</p>
                      </div>
                    )}
                    {eventDate && (
                      <div className="space-y-0.5 p-2 rounded-lg bg-muted/40">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Fecha</p>
                        <p className="font-semibold capitalize">{eventDate}</p>
                      </div>
                    )}
                    {config.nombreLugar && (
                      <div className="space-y-0.5 p-2 rounded-lg bg-muted/40">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Lugar</p>
                        <p className="font-semibold">{config.nombreLugar}</p>
                      </div>
                    )}
                    {invitadosContratados > 0 && (
                      <div className="space-y-0.5 p-2 rounded-lg bg-muted/40">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Invitados</p>
                        <p className="font-semibold">{invitadosContratados}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Additional documents */}
              {fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Documentos Adicionales</p>
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
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location with Map */}
        {activeSection === 'ubicacion' && settings?.ubicacion?.visible && celebracion?.visible && (celebracion.nombreLugar || celebracion.direccionLugar) && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Ubicación del Evento
              </CardTitle>
              <p className="text-xs text-muted-foreground">¿Cómo llegar?</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {celebracion.nombreLugar && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">{celebracion.nombreLugar}</p>
                    {celebracion.direccionLugar && (
                      <p className="text-xs text-muted-foreground mt-0.5">{celebracion.direccionLugar}</p>
                    )}
                  </div>
                </div>
              )}
              {celebracion.mapaUrl && (
                <div className="rounded-xl overflow-hidden border border-muted">
                  <iframe
                    src={celebracion.mapaUrl}
                    className="w-full h-48"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación del evento"
                  />
                </div>
              )}
              {celebracion.direccionLugar && (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(celebracion.direccionLugar)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full rounded-xl text-xs gap-1.5">
                      <Navigation className="w-3.5 h-3.5" /> Google Maps
                    </Button>
                  </a>
                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(celebracion.direccionLugar)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full rounded-xl text-xs gap-1.5">
                      <Navigation className="w-3.5 h-3.5" /> Waze
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event Menu */}
        {activeSection === 'menu' && settings?.menu?.visible && fiesta.menuMesa && (fiesta.menuMesa.entrada || fiesta.menuMesa.platoPrincipal || fiesta.menuMesa.postres || fiesta.menuMesa.bebidas) && (
          <Card id="seccion-menu" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                Menú del Evento
              </CardTitle>
              <p className="text-xs text-muted-foreground">Lo que vas a disfrutar esa noche</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
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
            </CardContent>
          </Card>
        )}

        {/* Drinks Menu (Carta de Tragos) */}
        {activeSection === 'menu' && settings?.cartaTragos?.visible && fiesta.cartaTragos && fiesta.cartaTragos.items.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wine className="w-5 h-5 text-purple-600" />
                {fiesta.cartaTragos.titulo || 'Carta de Tragos'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Bebidas disponibles en tu evento</p>
            </CardHeader>
            <CardContent className="pt-4">
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
            </CardContent>
          </Card>
        )}

        {/* Dress Code */}
        {activeSection === 'menu' && settings?.dressCode?.visible && dressCode?.visible && (dressCode.texto?.text || (dressCode.sugeridos && dressCode.sugeridos.length > 0) || (dressCode.evitar && dressCode.evitar.length > 0)) && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-rose-50 to-pink-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shirt className="w-5 h-5 text-rose-500" />
                Dress Code
              </CardTitle>
              <p className="text-xs text-muted-foreground">¿Cómo vestirse para este evento?</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
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
            </CardContent>
          </Card>
        )}

        {/* Catering Change Simulator */}
        {activeSection === 'simulador-catering' && presupuesto && invitadosContratados > 0 && (
          <div className="space-y-0">
            <CateringSimulator
              fiestaId={fiesta.id}
              presupuesto={presupuesto}
              fiesta={fiesta}
            />
          </div>
        )}

        {/* Guest Simulator */}
        {activeSection === 'simulador-invitados' && settings?.simuladorInvitados?.visible && invitadosContratados > 0 && (
          <Card id="seccion-simulador" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-primary/5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Simulador de Menús (Sincronizado)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Simulá agregados por Menú Adultos y Menú Niños/Adolescentes.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Menú Adultos</p>
                  <p className="text-xs text-muted-foreground">Base: {adultosBase} · Precio unitario: {formatCurrency(adultUnit)}</p>
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setAdultDelta((d) => Math.max(0, d - 1))}
                      disabled={adultDelta <= 0}
                    >
                      <MinusCircle className="w-4 h-4" />
                    </Button>
                    <p className="text-2xl font-black">+{adultDelta}</p>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setAdultDelta((d) => Math.min(maxDeltaAdult, d + 1))}
                      disabled={adultDelta >= maxDeltaAdult}
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Menú Niños/Adolescentes</p>
                  <p className="text-xs text-muted-foreground">Base: {ninosAdolescentesBase} · Precio unitario: {formatCurrency(kidsUnit)}</p>
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setKidsDelta((d) => Math.max(0, d - 1))}
                      disabled={kidsDelta <= 0}
                    >
                      <MinusCircle className="w-4 h-4" />
                    </Button>
                    <p className="text-2xl font-black">+{kidsDelta}</p>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setKidsDelta((d) => Math.min(maxDeltaKids, d + 1))}
                      disabled={kidsDelta >= maxDeltaKids}
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(adultDelta > 0 || kidsDelta > 0) && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-1">
                  <p className="font-bold text-primary">{simConfig?.textoAumento || 'Resumen del cambio solicitado'}</p>
                  <p className="text-muted-foreground text-xs">
                    Adultos (+{adultDelta}): <strong>{formatCurrency(simulationTotals.aumentoAdultos)}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Niños/Adolescentes (+{kidsDelta}): <strong>{formatCurrency(simulationTotals.aumentoKids)}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Aumento total: <strong className="text-primary">{formatCurrency(simulationTotals.aumentoTotal)}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Nuevo total estimado: <strong className="text-primary">{formatCurrency(simulationTotals.nuevoTotal)}</strong>
                  </p>
                </div>
              )}

              {(adultDelta > 0 || kidsDelta > 0) && (
                <div className="space-y-2">
                  <Textarea
                    value={simRequestNote}
                    onChange={(e) => setSimRequestNote(e.target.value)}
                    placeholder="Nota opcional para el equipo AK (ej: confirmar nuevo menú infantil)."
                    rows={3}
                    className="rounded-xl"
                  />
                  <Button className="w-full rounded-xl" onClick={handleSubmitMenuRequest} disabled={simRequestLoading}>
                    {simRequestLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Enviar solicitud de cambio
                  </Button>
                </div>
              )}

              {adultDelta === 0 && kidsDelta === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Ajustá valores por menú y enviá una solicitud. Estado inicial: pendiente de aprobación.
                </p>
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
            </CardContent>
          </Card>
        )}

        {/* Drink Calculator */}
        {activeSection === 'simulador-invitados' && calcBebidas?.visible && invitados > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-sky-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GlassWater className="w-5 h-5 text-blue-600" />
                Calculadora de Bebidas y Extras
              </CardTitle>
              <p className="text-xs text-muted-foreground">Estimación para {invitados} invitados</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {bebidasItems.some(b => b.clienteLleva && b.visible) ? (
                <p className="text-xs text-blue-700 font-medium bg-blue-50 rounded-xl px-3 py-2">
                  🎉 Según tu contrato, vos traés estos ítems para {invitados} personas:
                </p>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                  Estimación de bebidas y extras para {invitados} invitados:
                </p>
              )}
              <div className="space-y-2">
                {bebidasItems
                  .filter(item => item.visible)
                  .map(item => {
                    const { bg, border, text } = getColorClasses(item.color);
                    const cantidad = Math.round(invitados * item.cantidadPorPersona * 10) / 10;
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${bg} border ${border}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <p className="font-bold text-sm">{item.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.cantidadPorPersona} {item.unidad} por persona
                              {item.clienteLleva && <span className="ml-1 font-semibold text-amber-600">· Vos traés</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${text}`}>{cantidad}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.unidad}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Schedule / Itinerary */}
        {activeSection === 'itinerario' && settings?.itinerario?.visible && programa.length > 0 && (
          <Card id="seccion-itinerario" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Cronograma del Evento
              </CardTitle>
              <p className="text-xs text-muted-foreground">Así va a ser tu noche</p>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-primary/20 rounded-full" />
                <div className="space-y-0">
                  {programa.map((item) => (
                    <div key={item.id} className="relative flex items-start gap-4 py-3">
                      <div className="absolute -left-3.5 top-4 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {item.hora}
                          </span>
                          <span className="font-semibold text-sm">{item.titulo}</span>
                        </div>
                        {item.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.descripcion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Moodboard */}
        {activeSection === 'moodboard' && settings?.moodboard?.visible && moodboardItems.length > 0 && (
          <Card id="seccion-moodboard" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Inspiración y Moodboard
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

        {/* Music */}
        {activeSection === 'musica' && settings?.musica?.visible && musica && (musica.cancionEntrada || musica.cancionVals || (musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0) || musica.listaNoReproducir) && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Música de tu Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
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
            </CardContent>
          </Card>
        )}

        {/* Interactive Checklist */}
        {activeSection === 'checklist' && settings?.checklist?.visible && checklist.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Checklist de Tareas
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {checklist.filter(t => t.completada).length} de {checklist.length} completadas
              </p>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
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
            </CardContent>
          </Card>
        )}

        {/* FAQ Accordion */}
        {activeSection === 'faq' && settings?.faq?.visible && faqItems.length > 0 && (
          <Card id="seccion-faq" className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Preguntas Frecuentes
              </CardTitle>
              <p className="text-xs text-muted-foreground">Todo lo que necesitás saber</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {faqItems.map((faq, idx) => (
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
              ))}
            </CardContent>
          </Card>
        )}

        {/* Shared Notes */}
        {activeSection === 'notas' && settings?.notasCliente?.visible && (
          <Card id="seccion-notas" className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Notas para el Organizador
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

        {/* Weather placeholder */}
        {activeSection === 'overview' && daysUntil !== null && daysUntil > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardContent className="py-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-sky-100">
                <CloudSun className="w-8 h-8 text-sky-500" />
              </div>
              <div>
                <p className="font-bold text-sm">Clima del Día de tu Evento</p>
                <p className="text-xs text-muted-foreground">
                  {daysUntil <= 7
                    ? `¡Tu evento es en ${daysUntil} día${daysUntil > 1 ? 's' : ''}! El pronóstico estará disponible próximamente.`
                    : 'El pronóstico del clima se mostrará 7 días antes del evento.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fotografía y Filmación */}
        {activeSection === 'fotografia' && settings?.fotografiaYFilmacion?.visible && fiesta.fotografiaYFilmacion && fiesta.fotografiaYFilmacion.servicios.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Fotografía y Filmación
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

        {/* Lista de Regalos */}
        {activeSection === 'regalos' && settings?.listaRegalos?.visible && fiesta.invitacionDigital?.regalos?.items && fiesta.invitacionDigital.regalos.items.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Lista de Regalos
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

        {/* Other Sections */}
        {remainingVisibleSections.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Secciones de tu Evento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {remainingVisibleSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div key={section.id}>
                    {idx > 0 && <Separator className="my-1" />}
                    <div className="flex items-center gap-3 py-3 px-1">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Contact card */}
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

        <div className="flex justify-center">
          <a href={`#${topMenuId}`}>
            <Button variant="outline" className="rounded-xl">Volver al menú principal</Button>
          </a>
        </div>

      </div>
      )} {/* End activeSection !== null */}

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

      <PublicFooter variant="light" />
    </div>
  );
}
