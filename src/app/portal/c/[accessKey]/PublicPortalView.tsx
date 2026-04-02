
'use client';

import React, { useEffect, useState } from 'react';
import type { FiestaEnPlanificacion, ClientTarea, MoodboardItem, ProgramaEventoItem, BebidaCalculable, FaqItem } from '@/types/fiesta';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateClientChecklist, updateClientNotes } from '@/app/actions/fiesta/portal.actions';
import { defaultBebidaItems } from '@/lib/fiesta-defaults';
import { MarketingBanner } from '@/components/marketing-banner';

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
  const { configuracion: config, clientPortalSettings: settings } = fiesta;
  const countdown = useCountdown(config.fechaEvento);

  // Interactive Checklist state
  const [checklist, setChecklist] = useState<ClientTarea[]>(fiesta.clientChecklist ?? []);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // Shared Notes state
  const [notes, setNotes] = useState(fiesta.clientNotes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Guest simulator state
  const [guestDelta, setGuestDelta] = useState(0);

  // Moodboard liked state
  const [likedItems, setLikedItems] = useState<Set<string>>(
    new Set((fiesta.decoracion?.moodboardItems ?? []).filter(i => i.likedByClient).map(i => i.id))
  );

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
  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
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
  const precioPorPersona = invitadosContratados > 0 ? totalCosto / invitadosContratados : 0;
  const nuevaCantidad = invitadosContratados + guestDelta;

  const guestWhatsappMsg = encodeURIComponent(
    `Hola, quiero modificar la cantidad de invitados de mi evento "${config.nombreEvento}" de ${invitadosContratados} a ${nuevaCantidad}. ¿Es posible?`
  );
  const guestWhatsappHref = hasValidPhone
    ? `https://wa.me/${whatsappNumber}?text=${guestWhatsappMsg}`
    : `https://wa.me/?text=${guestWhatsappMsg}`;

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

  // Budget items grouped by category
  const itemsPresupuestados = presupuesto?.itemsPresupuestados ?? [];
  const itemsByCategory = itemsPresupuestados.reduce<Record<string, typeof itemsPresupuestados>>((acc, item) => {
    const cat = item.categoriaServicio || 'Servicios';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // FAQ
  const faqItems: FaqItem[] = fiesta.faqPortal ?? [];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground px-4 pb-10 pt-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Star className="absolute top-6 right-8 w-20 h-20 text-white rotate-12" />
          <Star className="absolute bottom-4 left-6 w-12 h-12 text-white -rotate-12" />
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            {companyName}
          </Badge>
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

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-5 pb-28">

        {/* Smart Alert Banners */}
        {alertas.length > 0 && (
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
        {config.fechaEvento && countdown && !countdown.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <p className="text-center text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">
                ¡Faltan para tu evento!
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

        {countdown?.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl bg-primary text-primary-foreground">
            <CardContent className="py-6 text-center">
              <p className="text-2xl font-black">🎉 ¡Tu evento ya fue!</p>
              <p className="text-sm opacity-80 mt-1">¡Esperamos que haya sido increíble!</p>
            </CardContent>
          </Card>
        )}

        {/* Payments & Balance */}
        {settings?.pagos?.visible && presupuesto && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
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

        {/* Services / Budget Breakdown */}
        {settings?.serviciosContratados?.visible && itemsPresupuestados.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-primary/5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                ¿Qué estoy contratando?
              </CardTitle>
              <p className="text-xs text-muted-foreground">Resumen de los servicios incluidos en tu evento</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {presupuesto?.nombrePromocion && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <Star className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs font-semibold text-primary">Promoción aplicada: {presupuesto.nombrePromocion}</p>
                </div>
              )}
              {Object.entries(itemsByCategory).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{cat}</p>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <div key={item.idServicioCatalogo} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/40 text-sm">
                        <span className="font-medium leading-snug flex-1">{item.nombreServicio}</span>
                        {item.esRegalo && (
                          <Badge variant="secondary" className="text-[9px] shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                            🎁 ¡Incluido sin cargo!
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Contract Summary + Documents */}
        {settings?.contrato?.visible && (fiesta.contratoServicioTexto || fiesta.contratoFirmaInfo || (fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0)) && (
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
        {settings?.ubicacion?.visible && celebracion?.visible && (celebracion.nombreLugar || celebracion.direccionLugar) && (
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
        {settings?.menu?.visible && fiesta.menuMesa && (fiesta.menuMesa.entrada || fiesta.menuMesa.platoPrincipal || fiesta.menuMesa.postres || fiesta.menuMesa.bebidas) && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
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
        {settings?.cartaTragos?.visible && fiesta.cartaTragos && fiesta.cartaTragos.items.length > 0 && (
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
        {settings?.dressCode?.visible && dressCode?.visible && (dressCode.texto?.text || (dressCode.sugeridos && dressCode.sugeridos.length > 0) || (dressCode.evitar && dressCode.evitar.length > 0)) && (
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

        {/* Guest Simulator */}
        {settings?.simuladorInvitados?.visible && invitadosContratados > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-primary/5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Simulador de Invitados
              </CardTitle>
              <p className="text-xs text-muted-foreground">Simulá agregar o quitar personas (sin confirmar cambios)</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => setGuestDelta(d => d - 1)}
                >
                  <MinusCircle className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <p className="text-4xl font-black tabular-nums">{nuevaCantidad}</p>
                  <p className="text-xs text-muted-foreground">invitados</p>
                  {guestDelta !== 0 && (
                    <Badge variant={guestDelta > 0 ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                      {guestDelta > 0 ? `+${guestDelta}` : guestDelta} vs contrato ({invitadosContratados})
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => setGuestDelta(d => d + 1)}
                >
                  <PlusCircle className="w-5 h-5" />
                </Button>
              </div>

              {guestDelta > 0 && precioPorPersona > 0 && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-1">
                  <p className="font-bold text-primary">Agregar {guestDelta} persona{guestDelta > 1 ? 's' : ''}</p>
                  <p className="text-muted-foreground text-xs">
                    Precio por persona estimado: <strong>{formatCurrency(precioPorPersona)}</strong>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Costo extra estimado: <strong className="text-primary">{formatCurrency(precioPorPersona * guestDelta)}</strong>
                  </p>
                </div>
              )}

              {guestDelta < 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-1">
                  <p className="font-bold text-amber-800">⚠️ Aviso importante</p>
                  <p className="text-amber-700 text-xs">
                    Por contrato, reducir invitados tiene una penalización del{' '}
                    <strong>10% del número contratado</strong> ({Math.ceil(invitadosContratados * 0.1)} personas).
                    No se realiza devolución por ese porcentaje.
                  </p>
                </div>
              )}

              {guestDelta !== 0 && (
                <a href={guestWhatsappHref} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full rounded-xl bg-[#25D366] hover:bg-[#1eb356] text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Solicitar cambio al organizador
                  </Button>
                </a>
              )}

              {guestDelta === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Usá los botones + / − para simular cambios en la cantidad de invitados
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Drink Calculator */}
        {calcBebidas?.visible && invitados > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-sky-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GlassWater className="w-5 h-5 text-blue-600" />
                Calculadora de Bebidas
              </CardTitle>
              <p className="text-xs text-muted-foreground">Estimación para {invitados} invitados</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {bebidasItems.some(b => b.clienteLleva && b.visible) ? (
                <p className="text-xs text-blue-700 font-medium bg-blue-50 rounded-xl px-3 py-2">
                  🎉 Según tu contrato, vos traés las siguientes bebidas para {invitados} personas:
                </p>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                  Estimación de bebidas para {invitados} invitados:
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
        {settings?.itinerario?.visible && programa.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
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
        {settings?.moodboard?.visible && moodboardItems.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
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
        {settings?.musica?.visible && musica && (musica.cancionEntrada || musica.cancionVals || (musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0) || musica.listaNoReproducir) && (
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
        {settings?.checklist?.visible && checklist.length > 0 && (
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
        {settings?.faq?.visible && faqItems.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
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
        {settings?.notasCliente?.visible && (
          <Card className="shadow-lg border-0 rounded-3xl">
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
        {daysUntil !== null && daysUntil > 0 && (
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

        {/* Other Sections */}
        {visibleSections.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Secciones de tu Evento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {visibleSections.map((section, idx) => {
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

        {/* Marketing / Powered by AK Producciones */}
        <MarketingBanner
          variant="compact"
          showCTA={false}
          className="mt-2"
        />
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
    </div>
  );
}
