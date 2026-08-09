'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  Image as ImageIcon,
  ListMusic,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  PartyPopper,
  Plus,
  Receipt,
  Send,
  ShieldCheck,
  Upload,
  Users,
  Utensils,
  Video,
  Wallet,
  X,
  ExternalLink,
} from 'lucide-react';
import { addClientMusicSuggestion, initializePortalSession, submitClientMenuChangeRequest, submitClientPayment, submitClientServiceAddRequest, updateClientePortalExperience, checkDateAvailability, cancelServicesOrParty, changeEventDate } from '@/app/actions/fiesta/portal.actions';
import { defaultFaq } from '@/lib/fiesta-defaults';
import { PublicFooter } from '@/components/public-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
  buildWhatsAppHref,
  estimateGuestIncrease,
  formatPortalMoney,
  getGuestStats,
  getPortalPaymentSummary,
} from '@/lib/client-portal/client-portal-summary';
import { calcularEstadoDeCuenta } from '@/lib/budget/saldo-con-ajuste';
import { resolveClientPortalAccess } from '@/lib/client-portal/access-phases';
import { buildGoogleCalendarUrl } from '@/lib/calendar-links';

type PublicPortalClientExperienceProps = {
  fiesta: any;
  companyContact: string;
  companyName: string;
  presupuesto?: any | null;
  catalogServices?: CatalogService[];
  /** Ajuste anual configurado en ajustes. Si no llega, se usa el 15% historico. */
  ajusteAnualPorcentaje?: number;
};

type DisplayIcon = ElementType<{ className?: string }>;

type CatalogService = {
  id: string;
  nombre: string;
  categoria?: string;
  subcategoria?: string;
  precioVenta?: number;
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  precioBase?: number;
  precioPorPersona?: number;
  invitadosPorUnidad?: number;
  tramosDePrecio?: Array<{ id: string; desde: number; hasta: number; precio: number }>;
  unidad?: string;
};

type Notice = {
  type: 'success' | 'error';
  text: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDate(date?: string): string {
  if (!date) return 'Fecha a confirmar';
  const value = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return 'Fecha a confirmar';

  return value.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date?: string): string {
  if (!date) return 'A confirmar';
  const value = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return 'A confirmar';

  return value.toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntilEvent(date?: string): number | null {
  if (!date) return null;
  const value = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return null;
  return Math.ceil((value.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getTotalPresupuesto(presupuesto?: any | null): number {
  if (!presupuesto) return 0;
  return Number(
    presupuesto.totalConDescuento
      ?? presupuesto.totalFinal
      ?? presupuesto.costoTotalEstimado
      ?? presupuesto.total
      ?? 0
  ) || 0;
}

function getCatalogServiceBasePrice(service: CatalogService | undefined, guestCount: number): number {
  if (!service) return 0;
  if (service.calculationMethod === 'porPersona') {
    return Math.max(0, Number(service.precioPorPersona ?? service.precioVenta ?? 0) || 0) * Math.max(1, guestCount);
  }
  if (service.calculationMethod === 'ratio') {
    const unitPrice = Math.max(0, Number(service.precioBase ?? service.precioVenta ?? 0) || 0);
    const ratio = Math.max(1, Number(service.invitadosPorUnidad ?? 1) || 1);
    return unitPrice * Math.ceil(Math.max(1, guestCount) / ratio);
  }
  if (service.calculationMethod === 'tramos' && service.tramosDePrecio?.length) {
    const tramo = service.tramosDePrecio.find(item => guestCount >= item.desde && guestCount <= item.hasta);
    return Math.max(0, Number(tramo?.precio ?? service.precioVenta ?? 0) || 0);
  }
  return Math.max(0, Number(service.precioVenta ?? service.precioBase ?? service.precioPorPersona ?? 0) || 0);
}

function documentHref(fiestaId: string, fileName: string): string {
  return `/api/documentos-fiesta/${encodeURIComponent(fiestaId)}/${encodeURIComponent(fileName)}`;
}

function getDocumentName(documento: any): string {
  return documento?.nombre || documento?.name || documento?.titulo || documento?.fileName || 'Documento';
}

function getBudgetSearchText(presupuesto?: any | null): string {
  return (presupuesto?.itemsPresupuestados ?? [])
    .map((item: any) => [
      item.nombreServicio,
      item.descripcionServicio,
      item.categoriaServicio,
      item.subcategoria,
    ].filter(Boolean).join(' '))
    .join(' ');
}

function hasBudgetService(searchText: string, keywords: string[]): boolean {
  const normalized = normalizeText(searchText);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

function InfoBadge({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'action' | 'ok' }) {
  const className = tone === 'action'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function IconBlock({ icon: Icon, color }: { icon: DisplayIcon; color: string }) {
  return (
    <div className="ak-public-icon flex h-10 w-10 shrink-0 items-center justify-center text-white" style={{ background: color }}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function QuickButton({ href, icon: Icon, label, helper, color, external = false }: { href: string; icon: DisplayIcon; label: string; helper: string; color: string; external?: boolean }) {
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="ak-public-action group flex min-h-[88px] items-center gap-3 p-3">
      <IconBlock icon={Icon} color={color} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        <span className="block text-xs leading-5 text-slate-500">{helper}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
    </a>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: DisplayIcon; tone: string }) {
  return (
    <div className="ak-public-card p-3">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function PortalEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState
      icon={<ClipboardList className="h-7 w-7" />}
      title={title}
      description={description}
      className="ak-public-card-soft py-6"
    />
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  const className = notice.type === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-rose-200 bg-rose-50 text-rose-800';

  return <p className={`rounded-lg border p-3 text-sm font-medium ${className}`}>{notice.text}</p>;
}

function PhaseRoadmap({ access, eventColor }: { access: ReturnType<typeof resolveClientPortalAccess>; eventColor: string }) {
  const phases = [
    {
      id: 'financiera',
      title: '1. Presupuesto y contrato',
      text: 'El cliente ve presupuesto, pagos, documentos, servicios contratados y puede pedir cambios con ajuste.',
      open: access.canSeeFinancial,
    },
    {
      id: 'organizacion',
      title: '2. Organizacion',
      text: 'Musica, reuniones, fotos, menu, decoracion, cronograma e invitados se abren cuando empieza la coordinacion.',
      open: access.canSeeOrganization,
    },
    {
      id: 'en_vivo',
      title: '3. Fiesta en vivo',
      text: `Muro social y accesos del dia se habilitan cerca del evento${access.daysUntilEvent !== null ? `; faltan ${access.daysUntilEvent} dias` : ''}.`,
      open: access.canSeeLive,
    },
  ];

  return (
    <div className="mb-5 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Acceso del cliente</p>
          <h2 className="text-xl font-black text-slate-950">{access.label}</h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          {access.liveLocked ? `Fiesta en vivo: ${access.liveAccessDaysBefore} dias antes` : 'Fiesta en vivo habilitada'}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`rounded-lg border p-3 ${phase.open ? 'bg-slate-50 text-slate-900' : 'bg-white text-slate-500'}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md text-white"
                style={{ background: phase.open ? eventColor : '#94a3b8' }}
              >
                {phase.open ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
              </span>
              <p className="font-black">{phase.title}</p>
            </div>
            <p className="text-sm leading-6">{phase.text}</p>
            {!phase.open && index > 0 && (
              <p className="mt-2 text-xs font-semibold text-slate-400">Todavia no visible para el cliente.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicPortalClientExperience({ fiesta, companyContact, companyName, presupuesto, catalogServices = [], ajusteAnualPorcentaje = 15 }: PublicPortalClientExperienceProps) {
  const config = fiesta?.configuracion ?? {};
  const settings = fiesta?.clientPortalSettings ?? {};
  const access = resolveClientPortalAccess(fiesta);
  const portalExperience = fiesta?.clientePortalExperience ?? {};
  const presupuestoText = getBudgetSearchText(presupuesto);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  } | null>(null);

  useEffect(() => {
    if (!config.fechaEvento) return;
    const targetDate = new Date(config.fechaEvento);
    if (Number.isNaN(targetDate.getTime())) return;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, isOver: false });
      timeoutId = setTimeout(updateCountdown, diff > 86400000 ? 60000 : 1000);
    };

    updateCountdown();
    return () => clearTimeout(timeoutId);
  }, [config.fechaEvento]);

  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [coverNotice, setCoverNotice] = useState<Notice | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const selectPresetCover = async (url: string) => {
    setCoverNotice(null);
    setIsSavingCover(true);
    try {
      const result = await updateClientePortalExperience(fiesta.id, { heroImageUrl: url });
      if (result.success) {
        setCoverNotice({ type: 'success', text: 'Diseño de portada actualizado.' });
        window.location.reload();
      } else {
        setCoverNotice({ type: 'error', text: result.error || 'No se pudo guardar la portada.' });
      }
    } catch {
      setCoverNotice({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleCustomCoverUrl = async () => {
    if (!customCoverUrl.trim()) return;
    await selectPresetCover(customCoverUrl.trim());
  };

  const [isSavingColor, setIsSavingColor] = useState(false);
  const selectColorTheme = async (color: string) => {
    setCoverNotice(null);
    setIsSavingColor(true);
    try {
      const result = await updateClientePortalExperience(fiesta.id, { primaryColor: color });
      if (result.success) {
        setCoverNotice({ type: 'success', text: 'Color de tema actualizado.' });
        window.location.reload();
      } else {
        setCoverNotice({ type: 'error', text: result.error || 'No se pudo guardar el color.' });
      }
    } catch {
      setCoverNotice({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setIsSavingColor(false);
    }
  };

  const compressImageToDataUrl = (file: File, maxDimension: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleCoverUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setCoverNotice({ type: 'error', text: 'La imagen debe pesar menos de 4 MB.' });
      return;
    }
    setCoverNotice(null);
    setIsSavingCover(true);
    try {
      const base64 = await compressImageToDataUrl(file, 1600, 0.75);
      await selectPresetCover(base64);
    } catch (err) {
      console.error('Failed to compress cover image:', err);
      setCoverNotice({ type: 'error', text: 'Error al procesar la imagen.' });
      setIsSavingCover(false);
    }
  };

  useEffect(() => {
    if (fiesta?.id && settings?.accessKey) {
      initializePortalSession(fiesta.id, settings.accessKey).catch(err => {
        console.error('Failed to initialize portal session:', err);
      });
    }
  }, [fiesta?.id, settings?.accessKey]);

  const eventNameRaw = portalExperience.eventDisplayName || config.nombreEvento;
  const isDefaultEventName = !eventNameRaw || eventNameRaw === 'Nuevo Evento' || eventNameRaw === 'Evento sin configurar';
  const eventName = isDefaultEventName ? 'Tu evento AK' : eventNameRaw;
  const eventColor = portalExperience.primaryColor
    || config.primaryColor
    || fiesta?.invitacionDigital?.cabecera?.paletaColores?.primary
    || fiesta?.decoracion?.paletaColores?.primary
    || '#0f766e';
  const heroImage = portalExperience.heroImageUrl
    || portalExperience.protagonistImageUrl
    || config.protagonistaFotoUrl
    || fiesta?.invitacionConfig?.fotoPortada
    || fiesta?.invitacionDigital?.cabecera?.imagenFondoUrl
    || '';

  const isDefaultLink = settings?.accessKey === 'CLIENTE1';
  const isUnconfigured = isDefaultEventName || isDefaultLink || !config.fechaEvento || !presupuesto;
  const eventDate = formatDate(config.fechaEvento);
  const days = daysUntilEvent(config.fechaEvento);
  const whatsappHref = buildWhatsAppHref(companyContact, eventName);
  const calendarUrl = buildGoogleCalendarUrl({
    title: eventName,
    startDate: config.fechaEvento,
    startTime: config.horaInicio,
    endTime: config.horaFin,
    location: [config.nombreLugar, config.direccionLugar].filter(Boolean).join(' - '),
    details: `Evento coordinado por ${companyName}.`,
  });

  const invitados = fiesta?.invitados ?? [];
  const guestStats = getGuestStats(invitados);
  // El total que ve el cliente tiene que ser el mismo que figura en el estado de
  // cuenta de AK. Antes el portal mostraba el total pelado, sin el ajuste anual,
  // asi que el cliente creia deber menos de lo que realmente debia y la
  // diferencia recien aparecia al ir a pagar la ultima cuota.
  // El porcentaje viene de los ajustes: si no se pasa, el portal se queda
  // clavado en 15% y el cliente ve un saldo distinto al de la pantalla interna.
  const estadoDeCuenta = calcularEstadoDeCuenta(presupuesto ?? null, ajusteAnualPorcentaje);
  const totalPresupuesto = estadoDeCuenta.total || getTotalPresupuesto(presupuesto);
  const paymentSummary = getPortalPaymentSummary({
    total: totalPresupuesto,
    payments: presupuesto?.pagosCliente ?? [],
    notifications: fiesta?.clientPaymentNotifications ?? [],
  });

  const nextPaymentInfo = (() => {
    if (paymentSummary.balance <= 0) {
      return { text: '¡Cuenta totalmente saldada! Gracias.', daysLeft: null, dateStr: null, isOverdue: false, amount: 0 };
    }

    const cuotas = fiesta?.contratoDatos?.planPagos?.cuotas ?? [];
    const nextPending = cuotas
      .filter((c: any) => c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'vencida')
      .sort((a: any, b: any) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];

    if (nextPending) {
      const dueDate = new Date(nextPending.fechaVencimiento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const formattedDue = formatShortDate(nextPending.fechaVencimiento);
      const amount = nextPending.esCuotaClave
        ? Math.max(0, (nextPending.montoObjetivo ?? (fiesta?.contratoDatos?.planPagos?.montoObjetivo30Porciento ?? 0)) - paymentSummary.paid)
        : Math.max(0, nextPending.montoMinimo - (nextPending.montoAcumulado ?? 0));

      return {
        text: `Próximo pago: cuota de ${formatPortalMoney(amount)} vence el ${formattedDue}`,
        daysLeft: diffDays,
        dateStr: formattedDue,
        isOverdue: diffDays < 0,
        amount,
      };
    }

    const eventDateStr = config.fechaEvento;
    let targetDate: Date;
    if (eventDateStr) {
      const eventDate = new Date(eventDateStr);
      targetDate = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (targetDate.getTime() < Date.now()) {
        targetDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      }
    } else {
      targetDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDue = formatShortDate(targetDate.toISOString());

    return {
      text: `Próximo pago sugerido vence el ${formattedDue}`,
      daysLeft: diffDays,
      dateStr: formattedDue,
      isOverdue: diffDays < 0,
      amount: paymentSummary.balance / 2,
    };
  })();

  const currentGuestCount = Number(presupuesto?.invitadosCantidad ?? config.invitadosEstimados ?? guestStats.total ?? 1) || 1;
  const annualAdjustmentPercent = Number(presupuesto?.ajusteAnualPorcentaje ?? fiesta?.contratoDatos?.ajusteAnualPorcentaje ?? 15) || 15;
  const pendingTasks = [
    ...(fiesta?.clienteDebeLlevar ?? []),
    ...(portalExperience.clienteDebeLlevar ?? []),
    ...(fiesta?.clientChecklist ?? []),
  ].map((item: any) => ({
    id: item.id,
    text: item.texto || item.nombre || item.titulo,
    done: item.completado || item.completada || item.estado === 'listo' || item.estado === 'revisado',
  })).filter(task => task.text && !task.done);

  const nextStep: { title: string; text: string; action: 'contact' | 'payment' | 'contable' | 'organizacion' | 'invitados'; label: string } = (() => {
    if (isDefaultLink) return { title: 'Falta personalizar el link', text: 'Antes de enviarlo, AK debe cambiar el link de prueba por uno real.', action: 'contact', label: 'Hablar con AK' };
    if (!presupuesto) return { title: 'Falta el presupuesto', text: 'Cuando AK lo cargue, vas a ver pagos, contrato y servicios.', action: 'contact', label: 'Consultar con AK' };
    if (paymentSummary.pendingReviewCount > 0) return { title: 'Pago en revisión', text: `Hay ${paymentSummary.pendingReviewCount} pago(s) esperando confirmación de AK.`, action: 'contable', label: 'Ver pagos' };
    if (paymentSummary.balance > 0) return { title: 'Saldo pendiente', text: `Saldo actual: ${formatPortalMoney(paymentSummary.balance)}.`, action: 'payment', label: 'Hacer un pago' };
    if (access.canSeeOrganization && pendingTasks.length > 0) return { title: 'Pendiente para revisar', text: pendingTasks[0].text, action: 'organizacion', label: 'Ver pendientes' };
    if (access.canSeeOrganization && guestStats.needsAction > 0) return { title: 'Invitados pendientes', text: `${guestStats.needsAction} invitado(s) todavía necesitan respuesta.`, action: 'invitados', label: 'Ver invitados' };
    return access.canSeeOrganization
      ? { title: 'Todo encaminado', text: 'La información principal del evento está ordenada.', action: 'organizacion', label: 'Ver resumen' }
      : { title: 'Todo encaminado', text: 'La información disponible del evento está ordenada.', action: 'contable', label: 'Ver resumen financiero' };
  })();

  const goToPortalSection = (section: 'contable' | 'organizacion' | 'invitados') => {
    const element = document.getElementById(`portal-${section}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element?.querySelector<HTMLButtonElement>('button')?.click();
  };

  const serviceCards = [
    {
      title: 'Música',
      icon: Music,
      badge: 'Cliente participa',
      active: hasBudgetService(presupuestoText, ['discoteca', 'dj', 'musica', 'música', 'sonido', 'luces', 'vals']) || settings?.musica?.visible,
      text: 'Canciones importantes, lista de no reproducir y momentos especiales.',
    },
    {
      title: 'Reuniones y videollamadas',
      icon: Video,
      badge: 'Cliente participa',
      active: (fiesta?.reuniones ?? []).length > 0,
      text: 'Fechas, acuerdos y próximos encuentros con AK.',
    },
    {
      title: 'Fotos y material',
      icon: Camera,
      badge: 'Cliente participa',
      active: settings?.videoVida?.visible || settings?.fotografiaYFilmacion?.visible || fiesta?.socialGallerySettings?.enabled,
      text: 'Fotos para video, mural social y material de la fiesta.',
    },
    {
      title: 'Menú y bebidas',
      icon: Utensils,
      badge: 'Solo información',
      active: hasBudgetService(presupuestoText, ['catering', 'menu', 'menú', 'entrada', 'plato', 'postre', 'barra', 'tragos', 'bebida']) || settings?.menu?.visible || settings?.calculadoraBebidas?.visible,
      text: 'Menú elegido, bebidas, restricciones y datos gastronómicos.',
    },
    {
      title: 'Decoración',
      icon: Palette,
      badge: 'Solo información',
      active: hasBudgetService(presupuestoText, ['decoracion', 'decoración', 'globos', 'ambientacion', 'ambientación', 'flores']) || settings?.moodboard?.visible,
      text: 'Colores, referencias visuales y estilo del evento.',
    },
    {
      title: 'Cronograma',
      icon: ClipboardList,
      badge: 'Solo información',
      active: (fiesta?.timeline ?? []).length > 0 || (fiesta?.programa ?? []).length > 0 || settings?.itinerario?.visible,
      text: 'Momentos importantes del día, ordenados por hora.',
    },
  ].filter(card => card.active || !presupuesto);

  const documentos = [
    ...(fiesta?.othersDocumentos ?? []),
    ...(fiesta?.otrosDocumentos ?? []),
    ...(fiesta?.documentos ?? []),
  ].filter((documento: any, index: number, list: any[]) => {
    if (!documento) return false;
    const name = normalizeText(getDocumentName(documento));
    const fileName = normalizeText(documento?.fileName ?? '');
    return list.findIndex(item => {
      const otherName = normalizeText(getDocumentName(item));
      const otherFileName = normalizeText(item?.fileName ?? '');
      return (name && otherName === name) || (fileName && otherFileName === fileName);
    }) === index;
  });
  const contractDocuments = documentos.filter((documento: any) => normalizeText(`${documento?.tipo} ${getDocumentName(documento)}`).includes('contrato'));
  const budgetDocuments = documentos.filter((documento: any) => normalizeText(`${documento?.tipo} ${getDocumentName(documento)}`).includes('presupuesto'));
  const documentsOrdered = [
    ...contractDocuments,
    ...budgetDocuments,
    ...documentos.filter((documento: any) => !contractDocuments.includes(documento) && !budgetDocuments.includes(documento)),
  ];
  const contractStatus = fiesta?.contratoFirmaInfo?.isSigned
    ? 'firmado'
    : (fiesta?.contratoServicioTexto || contractDocuments.length > 0 ? 'cargado' : 'pendiente');

  const lineItems = presupuesto?.itemsPresupuestados ?? [];
  const itemsPorCategoria = lineItems.reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.categoriaServicio || 'Otros servicios';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const cuentasBancarias = settings?.cuentasBancarias ?? [];
  const listaMusica = fiesta?.listaMusicaPortal ?? {};
  const [localMusicSuggestions, setLocalMusicSuggestions] = useState<string[]>([]);
  const musicMust = [...(listaMusica.imprescindibles ?? []), ...localMusicSuggestions];
  const musicMaybe = listaMusica.siEsPosible ?? [];
  const musicNo = listaMusica.noQuiero ?? [];
  const reuniones = fiesta?.reuniones ?? [];
  const programaItems = (fiesta?.programa ?? []).map((item: any) => ({ id: item.id, time: item.hora, title: item.titulo, text: item.descripcionCliente || item.descripcion }));
  const timelineItems = programaItems.length > 0
    ? programaItems
    : (fiesta?.timeline ?? []).map((item: any) => ({ id: item.id, time: formatShortDate(item.fechaProgramada), title: item.nombre, text: item.notas }));
  const faqItems = fiesta?.faqPortal && fiesta.faqPortal.length > 0 ? fiesta.faqPortal : defaultFaq;
  const activeGuestRequests = (fiesta?.clientMenuChangeRequests ?? []).filter((request: any) => request.status === 'pendiente');
  const activeServiceRequests = (fiesta?.clientServiceChangeRequests ?? []).filter((request: any) => request.status === 'pendiente');

  // Cancellation and Date Change states
  const [cancelarModalOpen, setCancelarModalOpen] = useState(false);
  const [cancellationMode, setCancellationMode] = useState<'partial' | 'all'>('partial');
  const [selectedServicesToCancel, setSelectedServicesToCancel] = useState<string[]>([]);
  
  const [cambioFechaModalOpen, setCambioFechaModalOpen] = useState(false);
  const [newProposedDate, setNewProposedDate] = useState('');
  const [dateChecking, setDateChecking] = useState(false);
  const [dateAvailabilityResult, setDateAvailabilityResult] = useState<{ available: boolean; suggestions?: string[]; error?: string } | null>(null);

  const [pinVerificationOpen, setPinVerificationOpen] = useState(false);
  const [pinActionType, setPinActionType] = useState<'cancelar' | 'cambiar_fecha' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionSuccessData, setActionSuccessData] = useState<{ fileName: string; refundAmount?: number; pendingDue?: number; penaltyAmount?: number; newBalance?: number } | null>(null);

  const getCancellationImpact = () => {
    const signingYear = fiesta.contratoDatos?.fechaFirmaContrato 
      ? new Date(fiesta.contratoDatos.fechaFirmaContrato).getFullYear() 
      : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsDiff = Math.max(0, currentYear - signingYear);
    const porcentajeAjuste = fiesta.contratoDatos?.ajusteAnualPorcentaje ?? presupuesto?.ajusteAnualPorcentaje ?? 15;
    const factorAjuste = Math.pow(1 + (porcentajeAjuste / 100), yearsDiff);

    const originalTotal = paymentSummary.total;
    const paid = paymentSummary.paid;

    if (cancellationMode === 'all') {
      const adjustedTotal = originalTotal * factorAjuste;
      const penalty = Math.round(adjustedTotal * 0.3);
      const newTotal = penalty;
      const refund = paid > newTotal ? (paid - newTotal) : 0;
      const owed = newTotal > paid ? (newTotal - paid) : 0;

      return { adjustedTotal, penalty, newTotal, refund, owed, factorAjuste, yearsDiff };
    } else {
      // Partial cancellation
      let cancelledOriginalSum = 0;
      const cancelledItems = lineItems.filter((item: any) => selectedServicesToCancel.includes(item.idServicioCatalogo));
      for (const item of cancelledItems) {
        cancelledOriginalSum += item.costoTotalItem || 0;
      }

      const adjustedCancelled = cancelledOriginalSum * factorAjuste;
      const penalty = Math.round(adjustedCancelled * 0.3);
      const newTotal = (originalTotal - cancelledOriginalSum) + penalty;
      const refund = paid > newTotal ? (paid - newTotal) : 0;
      const owed = newTotal > paid ? (newTotal - paid) : 0;

      return { 
        adjustedTotal: adjustedCancelled, 
        penalty, 
        newTotal, 
        refund, 
        owed, 
        factorAjuste, 
        yearsDiff,
        cancelledOriginalSum
      };
    }
  };

  const getDateChangeImpact = () => {
    const originalTotal = paymentSummary.total;
    const paid = paymentSummary.paid;
    const penalty = Math.round(originalTotal * 0.1);
    const newTotal = originalTotal + penalty;
    const newBalance = Math.max(0, newTotal - paid);
    return { penalty, newTotal, newBalance };
  };

  const handleCheckDate = async (date: string) => {
    setNewProposedDate(date);
    if (!date) {
      setDateAvailabilityResult(null);
      return;
    }
    setDateChecking(true);
    setDateAvailabilityResult(null);
    try {
      const res = await checkDateAvailability(fiesta.id, date);
      if (res.success) {
        setDateAvailabilityResult({ available: res.available, suggestions: res.suggestions });
      } else {
        setDateAvailabilityResult({ available: false, error: res.error || 'Error al validar fecha' });
      }
    } catch {
      setDateAvailabilityResult({ available: false, error: 'Error de red al comprobar fecha.' });
    } finally {
      setDateChecking(false);
    }
  };

  const handleConfirmCancellation = async () => {
    setPinError('');
    setActionProcessing(true);
    try {
      const res = await cancelServicesOrParty(fiesta.id, {
        servicesToCancel: selectedServicesToCancel,
        cancelAll: cancellationMode === 'all',
        passwordInput: pinInput
      });
      if (res.success) {
        setActionSuccessData({
          fileName: res.fileName || '',
          refundAmount: res.refundAmount,
          pendingDue: res.pendingDue
        });
      } else {
        setPinError(res.error || 'Error al procesar cancelación.');
      }
    } catch (e: any) {
      setPinError('Error de conexión.');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleConfirmDateChange = async () => {
    setPinError('');
    setActionProcessing(true);
    try {
      const res = await changeEventDate(fiesta.id, {
        newDate: newProposedDate,
        passwordInput: pinInput
      });
      if (res.success) {
        setActionSuccessData({
          fileName: res.fileName || '',
          penaltyAmount: res.penaltyAmount,
          newBalance: res.newBalance
        });
      } else {
        setPinError(res.error || 'Error al procesar cambio de fecha.');
      }
    } catch (e: any) {
      setPinError('Error de conexión.');
    } finally {
      setActionProcessing(false);
    }
  };

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentFileBase64, setPaymentFileBase64] = useState<string | undefined>();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [musicSuggestion, setMusicSuggestion] = useState('');
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicNotice, setMusicNotice] = useState<Notice | null>(null);

  const [extraAdults, setExtraAdults] = useState(0);
  const [extraChildren, setExtraChildren] = useState(0);
  const [guestNote, setGuestNote] = useState('');
  const [guestRequestLoading, setGuestRequestLoading] = useState(false);
  const [guestRequestNotice, setGuestRequestNotice] = useState<Notice | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState(catalogServices[0]?.id ?? '');
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [serviceNote, setServiceNote] = useState('');
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);
  const [serviceRequestNotice, setServiceRequestNotice] = useState<Notice | null>(null);

  const guestEstimate = estimateGuestIncrease({
    currentTotal: totalPresupuesto,
    currentGuestCount,
    adultDelta: extraAdults,
    childDelta: extraChildren,
    annualAdjustmentPercent,
  });
  const selectedService = catalogServices.find(service => service.id === selectedServiceId);
  const selectedServiceBasePrice = getCatalogServiceBasePrice(selectedService, currentGuestCount) * Math.max(1, serviceQuantity);
  const selectedServiceAdditional = Math.round(selectedServiceBasePrice * (1 + annualAdjustmentPercent / 100));
  const selectedServiceNewTotal = totalPresupuesto + selectedServiceAdditional;

  const handlePaymentFile = (file?: File) => {
    if (!file) return;
    setPaymentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPaymentFileBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitPayment = async () => {
    const amount = Number(paymentAmount);
    setPaymentNotice(null);

    if (!amount || amount <= 0) {
      setPaymentNotice({ type: 'error', text: 'Ingresá un monto válido.' });
      return;
    }

    setPaymentLoading(true);
    try {
      const result = await submitClientPayment(fiesta.id, amount, paymentFileBase64, paymentFile?.name || paymentNote || undefined);
      if (result.success) {
        setPaymentNotice({ type: 'success', text: 'Pago informado. AK lo revisará y lo marcará como confirmado.' });
        setPaymentAmount('');
        setPaymentNote('');
        setPaymentFile(null);
        setPaymentFileBase64(undefined);
        return;
      }
      setPaymentNotice({ type: 'error', text: result.error || 'No se pudo informar el pago.' });
    } catch {
      setPaymentNotice({ type: 'error', text: 'No se pudo informar el pago.' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const submitMusicSuggestion = async () => {
    const value = musicSuggestion.trim();
    setMusicNotice(null);

    if (!value) {
      setMusicNotice({ type: 'error', text: 'Escribí una canción antes de agregarla.' });
      return;
    }

    setMusicLoading(true);
    try {
      const result = await addClientMusicSuggestion(fiesta.id, 'imprescindibles', value);
      if (result.success) {
        setLocalMusicSuggestions(current => [...current, value]);
        setMusicSuggestion('');
        setMusicNotice({ type: 'success', text: 'Canción agregada. AK ya la verá dentro del evento.' });
        return;
      }
      setMusicNotice({ type: 'error', text: result.error || 'No se pudo agregar la canción.' });
    } catch {
      setMusicNotice({ type: 'error', text: 'No se pudo agregar la canción.' });
    } finally {
      setMusicLoading(false);
    }
  };

  const submitGuestRequest = async () => {
    setGuestRequestNotice(null);
    if (guestEstimate.adultDelta <= 0 && guestEstimate.childDelta <= 0) {
      setGuestRequestNotice({ type: 'error', text: 'Agregá al menos una persona para enviar la solicitud.' });
      return;
    }

    setGuestRequestLoading(true);
    try {
      const result = await submitClientMenuChangeRequest(fiesta.id, {
        adultosDelta: guestEstimate.adultDelta,
        ninosAdolescentesDelta: guestEstimate.childDelta,
        montoAdicional: guestEstimate.additionalTotal,
        nuevoTotalEstimado: guestEstimate.newTotal,
        notaCliente: guestNote,
      });

      if (result.success) {
        setGuestRequestNotice({ type: 'success', text: 'Solicitud enviada. AK debe aprobarla antes de cambiar el presupuesto.' });
        setExtraAdults(0);
        setExtraChildren(0);
        setGuestNote('');
        return;
      }
      setGuestRequestNotice({ type: 'error', text: result.error || 'No se pudo enviar la solicitud.' });
    } catch {
      setGuestRequestNotice({ type: 'error', text: 'No se pudo enviar la solicitud.' });
    } finally {
      setGuestRequestLoading(false);
    }
  };

  const submitServiceRequest = async () => {
    setServiceRequestNotice(null);
    if (!selectedService || selectedServiceAdditional <= 0) {
      setServiceRequestNotice({ type: 'error', text: 'Elegí un servicio del catálogo antes de enviar la solicitud.' });
      return;
    }

    setServiceRequestLoading(true);
    try {
      const result = await submitClientServiceAddRequest(fiesta.id, {
        servicioId: selectedService.id,
        nombreServicio: selectedService.nombre,
        categoria: selectedService.categoria,
        cantidad: serviceQuantity,
        precioBase: selectedServiceBasePrice,
        ajustePorcentaje: annualAdjustmentPercent,
        montoAdicional: selectedServiceAdditional,
        nuevoTotalEstimado: selectedServiceNewTotal,
        notaCliente: serviceNote,
      });

      if (result.success) {
        setServiceRequestNotice({ type: 'success', text: 'Solicitud enviada. AK la revisará antes de cambiar el presupuesto formal.' });
        setServiceQuantity(1);
        setServiceNote('');
        return;
      }
      setServiceRequestNotice({ type: 'error', text: result.error || 'No se pudo enviar la solicitud.' });
    } catch {
      setServiceRequestNotice({ type: 'error', text: 'No se pudo enviar la solicitud.' });
    } finally {
      setServiceRequestLoading(false);
    }
  };

  return (
    <div className="ak-public-page">
      <section
        className="ak-public-hero text-white relative"
        style={{
          background: heroImage
            ? `linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, ${eventColor}55 100%), url(${heroImage}) center/cover`
            : `linear-gradient(135deg, ${eventColor}, #111827)`,
        }}
      >
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/25 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center gap-1.5"
            onClick={() => setCoverModalOpen(true)}
          >
            <Palette className="h-4 w-4" /> Personalizar portada
          </Button>
        </div>

        <div className="ak-public-shell grid gap-6 py-6 sm:py-8 lg:grid-cols-[1.5fr_.75fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/20 text-white font-bold uppercase tracking-wider">Portal VIP</Badge>
              <Badge className="border-0 bg-white text-slate-950">{companyName}</Badge>
              {isUnconfigured && <Badge className="border-0 bg-amber-400 text-slate-950">Faltan datos</Badge>}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white/80">{config.tipoCelebracion || 'Evento'}</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{eventName}</h1>
              <p className="max-w-2xl text-base leading-7 text-white/90">
                {portalExperience.welcomeMessage || portalExperience.organizerMessage || 'Toda la información importante del evento en un solo lugar.'}
              </p>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><Calendar className="h-4 w-4" />{eventDate}</span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><Clock className="h-4 w-4" />{config.horaInicio || 'Hora a confirmar'}</span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><MapPin className="h-4 w-4" />{config.nombreLugar && config.nombreLugar !== 'Salón a definir' ? config.nombreLugar : 'Lugar a confirmar'}</span>
              {timeLeft ? (
                timeLeft.isOver ? (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 font-semibold">
                    <PartyPopper className="h-4 w-4 text-emerald-400" /> ¡Llegó el gran día!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 font-mono">
                    <Clock className="h-4 w-4 animate-pulse text-emerald-400" />
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><PartyPopper className="h-4 w-4" />{days === null ? 'Fecha a confirmar' : `Faltan ${days} días`}</span>
              )}
            </div>
          </div>

          <div className="ak-public-card p-4 text-slate-950 bg-white/95 backdrop-blur-md">
            <div className="mb-4 flex items-start gap-3">
              <IconBlock icon={ShieldCheck} color={eventColor} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Próximo paso</p>
                <p className="text-xl font-black">{nextStep.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{nextStep.text}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {nextStep.action === 'payment' ? (
                <Button className="h-11 w-full font-extrabold" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard className="h-4 w-4" /> {nextStep.label}
                </Button>
              ) : nextStep.action === 'contact' ? (
                <Button className="h-11 w-full font-extrabold" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> {nextStep.label}
                  </a>
                </Button>
              ) : (
                <Button
                  className="h-11 w-full font-extrabold"
                  onClick={() => {
                    if (nextStep.action === 'contable' || nextStep.action === 'organizacion' || nextStep.action === 'invitados') {
                      goToPortalSection(nextStep.action);
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" /> {nextStep.label}
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full text-slate-700 border-slate-300 rounded-xl h-10" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-slate-500" /> Hablar con AK
                  </a>
                </Button>
                {calendarUrl && (
                  <Button variant="outline" className="w-full text-slate-700 border-slate-300 rounded-xl h-10" asChild>
                    <a href={calendarUrl} target="_blank" rel="noopener noreferrer" title="Sincronizar con Google Calendar (incluye recordatorios)">
                      <Calendar className="h-4 w-4 text-slate-500" /> Sincronizar
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {nextPaymentInfo && nextPaymentInfo.daysLeft !== null && (
              <div className="mt-3 border-t pt-3 text-xs leading-relaxed">
                <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px] mb-1">Recordatorio de Pago</span>
                {nextPaymentInfo.daysLeft < 0 ? (
                  <span className="font-semibold text-rose-600 block">
                    ⚠️ Cuota de {formatPortalMoney(nextPaymentInfo.amount)} vencida hace {Math.abs(nextPaymentInfo.daysLeft)} días ({nextPaymentInfo.dateStr}).
                  </span>
                ) : nextPaymentInfo.daysLeft === 0 ? (
                  <span className="font-semibold text-amber-600 block">
                    ⏰ Hoy vence la cuota de {formatPortalMoney(nextPaymentInfo.amount)}.
                  </span>
                ) : (
                  <span className="text-slate-600 block">
                    La próxima cuota de {formatPortalMoney(nextPaymentInfo.amount)} vence el {nextPaymentInfo.dateStr} (en {nextPaymentInfo.daysLeft} días).
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="ak-public-shell py-5 sm:py-7">
        {isUnconfigured && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">Este portal todavía necesita datos reales.</p>
                <p className="mt-1 text-sm leading-6">Falta completar nombre, link, fecha o presupuesto antes de enviarlo al cliente final.</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Superior Destacado */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* Tarjeta Pagos */}
          <div 
            className="ak-public-card p-5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all bg-white border border-slate-200"
            onClick={() => {
              const el = document.getElementById('portal-contable');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.querySelector('button')?.click();
              }
            }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-150 opacity-70" />
            <div className="flex items-center gap-4 mb-5">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl shadow-sm">
                <CircleDollarSign className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Pagos</h3>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Estado de Cuenta</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 font-medium">Saldo pendiente</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatPortalMoney(paymentSummary.balance)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Tarjeta Menú */}
          <div 
            className="ak-public-card p-5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all bg-white border border-slate-200"
            onClick={() => {
              const el = document.getElementById('portal-organizacion');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.querySelector('button')?.click();
              }
            }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-150 opacity-70" />
            <div className="flex items-center gap-4 mb-5">
              <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl shadow-sm">
                <Utensils className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Menú</h3>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Opciones y Catering</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 font-medium">Plato principal</p>
                <p className="text-lg font-bold text-slate-800 line-clamp-1">{fiesta?.menuSeleccionPortal?.principal || 'A definir'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
              </div>
            </div>
          </div>

          {/* Tarjeta Link de Invitados */}
          <div 
            className="ak-public-card p-5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all bg-white border border-slate-200"
            onClick={() => {
              const url = fiesta?.invitacionSlug ? `/i/${fiesta.invitacionSlug}` : `/invitacion/${fiesta.id}`;
              window.open(url, '_blank');
            }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-50 rounded-full -z-10 transition-transform duration-500 group-hover:scale-150 opacity-70" />
            <div className="flex items-center gap-4 mb-5">
              <div className="bg-sky-100 text-sky-600 p-3 rounded-2xl shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Invitados</h3>
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Link y Confirmaciones</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 font-medium">Confirmados</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{guestStats.confirmed} <span className="text-sm font-semibold text-slate-400">/ {guestStats.total}</span></p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
              </div>
            </div>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={access.canSeeOrganization ? ["organizacion", "contable"] : ["contable"]} className="space-y-4">
          {access.canSeeOrganization && <AccordionItem value="organizacion" id="portal-organizacion" className="ak-public-card px-4">
            <AccordionTrigger className="text-left text-lg font-black hover:no-underline">
              <span className="flex items-center gap-3"><IconBlock icon={ClipboardList} color={eventColor} /> Organización del evento</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <div className="grid gap-3 md:grid-cols-2">
                {serviceCards.map(card => (
                  <div key={card.title} className="rounded-lg border bg-slate-50 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <IconBlock icon={card.icon} color={eventColor} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">{card.title}</p>
                          <InfoBadge tone={card.badge === 'Cliente participa' ? 'action' : 'info'}>{card.badge}</InfoBadge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{card.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <IconBlock icon={Music} color={eventColor} />
                  <div>
                    <p className="font-black">Música</p>
                    <InfoBadge tone="action">Cliente participa</InfoBadge>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-black">Imprescindibles</p>
                    {musicMust.length === 0 ? <PortalEmptyState title="Todavía no hay canciones imprescindibles" description="Podés agregarlas desde esta misma sección cuando tengas tus favoritas." /> : musicMust.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-black">Si es posible</p>
                    {musicMaybe.length === 0 ? <PortalEmptyState title="Todavía no hay sugerencias" description="Usá el formulario de música para compartir canciones que te gustaría escuchar." /> : musicMaybe.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-black">No reproducir</p>
                    {musicNo.length === 0 ? <PortalEmptyState title="No marcaste canciones para evitar" description="Si hay algún tema que no querés escuchar, podés indicarlo desde el formulario de música." /> : musicNo.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input value={musicSuggestion} onChange={event => setMusicSuggestion(event.target.value)} placeholder="Agregar canción importante" />
                  <Button onClick={submitMusicSuggestion} disabled={musicLoading} style={{ background: eventColor }}>
                    <Plus className="h-4 w-4" /> {musicLoading ? 'Agregando' : 'Agregar'}
                  </Button>
                </div>
                {musicNotice && <div className="mt-3"><NoticeBox notice={musicNotice} /></div>}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <IconBlock icon={Video} color={eventColor} />
                    <div>
                      <p className="font-black">Reuniones y videollamadas</p>
                      <InfoBadge tone="action">Cliente participa</InfoBadge>
                    </div>
                  </div>
                  {reuniones.length === 0 ? <PortalEmptyState title="No hay reuniones agendadas" description="AK publicará acá la próxima reunión cuando haya una fecha coordinada." /> : reuniones.slice(0, 5).map((reunion: any) => (
                    <div key={reunion.id} className="mb-2 rounded-lg bg-slate-50 p-3">
                      <p className="font-semibold">{reunion.titulo || 'Reunión'}</p>
                      <p className="text-sm text-slate-600">{formatShortDate(reunion.fecha)}{reunion.notas ? ` · ${reunion.notas}` : ''}</p>
                      {(reunion.link || reunion.meetUrl || reunion.videoUrl) && (
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href={reunion.link || reunion.meetUrl || reunion.videoUrl} target="_blank" rel="noopener noreferrer">Entrar a la videollamada</a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <IconBlock icon={Camera} color={eventColor} />
                    <div>
                      <p className="font-black">Fotos, video y redes</p>
                      <InfoBadge tone="action">Cliente participa</InfoBadge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {fiesta?.videoVida?.galleryEnabled && <p className="rounded-lg bg-slate-50 p-3">Video de vida activo. Fotos cargadas: {fiesta?.videoVida?.photoCount ?? 0}.</p>}
                    {fiesta?.fotografiaYFilmacion?.notasGenerales && <p className="rounded-lg bg-slate-50 p-3">{fiesta.fotografiaYFilmacion.notasGenerales}</p>}
                    {fiesta?.socialGallerySettings?.enabled ? (
                      <Button variant="outline" asChild>
                        <a href={`/evento/social/${fiesta.id}`} target="_blank" rel="noopener noreferrer"><ImageIcon className="h-4 w-4" /> Abrir mural social</a>
                      </Button>
                    ) : <PortalEmptyState title="El mural social todavía no está activo" description="AK lo habilitará cuando el servicio esté listo para tu evento." />}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <IconBlock icon={Utensils} color={eventColor} />
                    <div>
                      <p className="font-black">Menú y bebidas</p>
                      <InfoBadge>Solo información</InfoBadge>
                    </div>
                  </div>
                  {fiesta?.menuSeleccionPortal ? (
                    <div className="grid gap-2 text-sm">
                      {fiesta.menuSeleccionPortal.entrada && <p className="rounded-lg bg-slate-50 p-3"><strong>Entrada:</strong> {fiesta.menuSeleccionPortal.entrada}</p>}
                      {fiesta.menuSeleccionPortal.principal && <p className="rounded-lg bg-slate-50 p-3"><strong>Principal:</strong> {fiesta.menuSeleccionPortal.principal}</p>}
                      {fiesta.menuSeleccionPortal.postre && <p className="rounded-lg bg-slate-50 p-3"><strong>Postre:</strong> {fiesta.menuSeleccionPortal.postre}</p>}
                      {fiesta.menuSeleccionPortal.bebidas && <p className="rounded-lg bg-slate-50 p-3"><strong>Bebidas:</strong> {fiesta.menuSeleccionPortal.bebidas}</p>}
                      {fiesta.menuSeleccionPortal.restriccionesAlimentarias && <p className="rounded-lg bg-amber-50 p-3 text-amber-900"><strong>Restricciones:</strong> {fiesta.menuSeleccionPortal.restriccionesAlimentarias}</p>}
                    </div>
                  ) : <PortalEmptyState title="El menú todavía está en preparación" description="AK lo publicará cuando estén definidos los platos del evento." />}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <IconBlock icon={Palette} color={eventColor} />
                    <div>
                      <p className="font-black">Personalización y decoración</p>
                      <InfoBadge>Solo información</InfoBadge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="rounded-lg bg-slate-50 p-3"><strong>Color principal:</strong> <span className="ml-2 inline-block h-3 w-8 rounded-full align-middle" style={{ background: eventColor }} /> {eventColor}</p>
                    {fiesta?.decoracion?.tema && <p className="rounded-lg bg-slate-50 p-3"><strong>Tema:</strong> {fiesta.decoracion.tema}</p>}
                    {fiesta?.decoracion?.generalNotesDecoracion && <p className="rounded-lg bg-slate-50 p-3">{fiesta.decoracion.generalNotesDecoracion}</p>}
                    {!fiesta?.decoracion?.tema && !fiesta?.decoracion?.generalNotesDecoracion && <PortalEmptyState title="La decoración todavía está en preparación" description="AK publicará acá el concepto y las referencias cuando estén definidos." />}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <IconBlock icon={ListMusic} color={eventColor} />
                  <div>
                    <p className="font-black">Cronograma</p>
                    <InfoBadge>Solo información</InfoBadge>
                  </div>
                </div>
                {timelineItems.length === 0 ? <PortalEmptyState title="El cronograma todavía está en preparación" description="AK lo publicará cuando estén confirmados los horarios principales." /> : (
                  <div className="space-y-2">
                    {timelineItems.map((item: any) => (
                      <div key={item.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[120px_1fr]">
                        <p className="font-black text-slate-900">{item.time || 'A confirmar'}</p>
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          {item.text && <p className="text-sm text-slate-600">{item.text}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>}

          <AccordionItem value="contable" id="portal-contable" className="ak-public-card px-4">
            <AccordionTrigger className="text-left text-lg font-black hover:no-underline">
              <span className="flex items-center gap-3"><IconBlock icon={Wallet} color={eventColor} /> Pagos, contrato y presupuesto</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <div className="grid gap-3 lg:grid-cols-4">
                <div className="rounded-lg border bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Total contratado</p><p className="text-2xl font-black">{formatPortalMoney(paymentSummary.total)}</p></div>
                <div className="rounded-lg border bg-emerald-50 p-4 text-emerald-900"><p className="text-xs font-bold">Pagado</p><p className="text-2xl font-black">{formatPortalMoney(paymentSummary.paid)}</p></div>
                <div className="rounded-lg border bg-rose-50 p-4 text-rose-900"><p className="text-xs font-bold">Saldo</p><p className="text-2xl font-black">{formatPortalMoney(paymentSummary.balance)}</p></div>
                <div className="rounded-lg border bg-amber-50 p-4 text-amber-900"><p className="text-xs font-bold">En revisión</p><p className="text-2xl font-black">{paymentSummary.pendingReviewCount}</p></div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-500">
                  <span>Progreso de Pago</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700">{paymentSummary.paidPercent}% completado</span>
                </div>
                <div className="rounded-full bg-slate-100 p-1">
                  <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${paymentSummary.paidPercent}%`, background: eventColor }} />
                </div>
                <p className="text-xs text-slate-500 text-right font-medium">
                  Se ha pagado {formatPortalMoney(paymentSummary.paid)} de un total de {formatPortalMoney(paymentSummary.total)}
                </p>
              </div>

              {nextPaymentInfo && nextPaymentInfo.daysLeft !== null && (
                <div className={`rounded-xl border p-4 text-sm mt-3 flex items-start gap-3 ${
                  nextPaymentInfo.daysLeft < 0
                    ? 'border-rose-200 bg-rose-50/70 text-rose-900 shadow-sm'
                    : nextPaymentInfo.daysLeft <= 7
                      ? 'border-amber-200 bg-amber-50/70 text-amber-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700'
                }`}>
                  <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${nextPaymentInfo.daysLeft < 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
                  <div>
                    <p className="font-bold mb-0.5 text-slate-900">Recordatorio de Próximo Pago</p>
                    <p className="leading-relaxed text-xs">
                      {nextPaymentInfo.daysLeft < 0 ? (
                        <>La cuota de <strong className="font-extrabold">{formatPortalMoney(nextPaymentInfo.amount)}</strong> está vencida hace <strong className="font-extrabold">{Math.abs(nextPaymentInfo.daysLeft)} días</strong> (debió abonarse el {nextPaymentInfo.dateStr}). Por favor infórmalo a la brevedad.</>
                      ) : nextPaymentInfo.daysLeft === 0 ? (
                        <>Hoy vence tu cuota de <strong className="font-extrabold">{formatPortalMoney(nextPaymentInfo.amount)}</strong>. Puedes subir tu comprobante de pago con el botón de abajo.</>
                      ) : (
                        <>Tu próxima cuota de <strong className="font-extrabold">{formatPortalMoney(nextPaymentInfo.amount)}</strong> vence el <strong className="font-extrabold">{nextPaymentInfo.dateStr}</strong> (en <strong className="font-extrabold">{nextPaymentInfo.daysLeft} días</strong>).</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3"><IconBlock icon={FileText} color={eventColor} /><div><p className="font-black">Contrato y documentos</p><InfoBadge>Solo información</InfoBadge></div></div>
                  <div className="space-y-2">
                    <p className="rounded-lg bg-slate-50 p-3 text-sm">Contrato: {contractStatus}</p>
                    {documentsOrdered.slice(0, 8).map((documento: any) => (
                      documento.fileName ? (
                        <Button key={documento.id || documento.fileName} variant="outline" className="w-full justify-between" asChild>
                          <a href={documentHref(fiesta.id, documento.fileName)} target="_blank" rel="noopener noreferrer"><span className="min-w-0 truncate">{getDocumentName(documento)}</span><Download className="h-4 w-4" /></a>
                        </Button>
                      ) : <p key={documento.id || getDocumentName(documento)} className="rounded-lg bg-slate-50 p-3 text-sm">{getDocumentName(documento)}</p>
                    ))}
                    {documentos.length === 0 && <PortalEmptyState title="Todavía no hay documentos para descargar" description="AK los publicará acá cuando estén listos para revisar o firmar." />}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3"><IconBlock icon={CreditCard} color={eventColor} /><div><p className="font-black">Informar pago</p><InfoBadge tone="action">Cliente participa</InfoBadge></div></div>
                  <div className="space-y-3 text-sm text-slate-600">
                    {cuentasBancarias.length > 0 && cuentasBancarias.slice(0, 2).map((cuenta: any) => <div key={cuenta.id || cuenta.numero} className="rounded-lg bg-slate-50 p-3"><p className="font-semibold text-slate-900">{cuenta.banco}</p><p>{cuenta.titular}</p><p>{cuenta.numero}</p></div>)}
                    <Button onClick={() => setPaymentModalOpen(true)} style={{ background: eventColor }}><Upload className="h-4 w-4" /> Informar pago</Button>
                    {paymentSummary.pendingReviewCount > 0 && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Tenés pagos informados esperando revisión de AK.</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-slate-50/50 mt-2">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconBlock icon={AlertTriangle} color="#e11d48" />
                    <div>
                      <p className="font-black text-slate-800">Modificaciones y Cancelaciones</p>
                      <p className="text-xs text-slate-500">Solicitudes y reprogramaciones de servicios o evento</p>
                    </div>
                  </div>
                  <InfoBadge tone="action">Cliente participa</InfoBadge>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Podés solicitar la reprogramación de fecha del evento o la cancelación de uno o más servicios contratados de forma directa. Estas acciones requieren verificación de tu PIN/Contraseña y generarán el documento de adenda correspondiente para firma manual.
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Button variant="outline" size="sm" className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => { setCancelarModalOpen(true); setSelectedServicesToCancel([]); setCancellationMode('partial'); }}>
                    Cancelar servicios o fiesta
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setCambioFechaModalOpen(true); setNewProposedDate(''); setDateAvailabilityResult(null); }}>
                    Cambiar fecha del evento
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <IconBlock icon={Receipt} color={eventColor} />
                  <div>
                    <p className="font-black">Lo contratado</p>
                    <InfoBadge>Solo información</InfoBadge>
                  </div>
                </div>
                {lineItems.length === 0 ? (
                  <PortalEmptyState title="El presupuesto todavía no tiene servicios visibles" description="Consultá con AK para vincular o completar la propuesta de tu evento." />
                ) : (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {Object.entries(itemsPorCategoria).map(([categoria, items]: [string, any], catIdx) => (
                      <AccordionItem
                        key={categoria}
                        value={`cat-${catIdx}`}
                        className="border rounded-xl bg-slate-50/50 overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/50 text-slate-800 text-sm font-bold">
                          <span>{categoria} ({items.length})</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3 pt-1 bg-white border-t space-y-2">
                          <div className="grid gap-2 sm:grid-cols-2 pt-2">
                            {items.map((item: any, idx: number) => (
                              <div
                                key={`${item.idServicioCatalogo}-${idx}`}
                                className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100"
                              >
                                <p className="font-semibold text-slate-800">{item.nombreServicio}</p>
                                <p className="text-slate-500 mt-0.5 animate-none">
                                  Cantidad: {item.cantidad ?? 1}
                                  {item.unidad ? ` ${item.unidad}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3"><IconBlock icon={Plus} color={eventColor} /><div><p className="font-black">Simular más invitados</p><InfoBadge tone="action">Requiere aprobación de AK</InfoBadge></div></div>
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.1fr]">
                  <label className="space-y-1 text-sm font-semibold text-slate-700">Adultos a agregar<Input type="number" min={0} value={extraAdults} onChange={event => setExtraAdults(Math.max(0, Number(event.target.value) || 0))} /></label>
                  <label className="space-y-1 text-sm font-semibold text-slate-700">Niños/adolescentes<Input type="number" min={0} value={extraChildren} onChange={event => setExtraChildren(Math.max(0, Number(event.target.value) || 0))} /></label>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm"><p>Extra estimado: <strong>{formatPortalMoney(guestEstimate.additionalTotal)}</strong></p><p>Nuevo total: <strong>{formatPortalMoney(guestEstimate.newTotal)}</strong></p><p className="text-xs text-slate-500">Incluye ajuste anual de {annualAdjustmentPercent}%.</p></div>
                </div>
                <Textarea className="mt-3" value={guestNote} onChange={event => setGuestNote(event.target.value)} placeholder="Nota para AK, por ejemplo: necesito sumar 10 personas" />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button onClick={submitGuestRequest} disabled={guestRequestLoading} style={{ background: eventColor }}><Send className="h-4 w-4" /> {guestRequestLoading ? 'Enviando' : 'Enviar solicitud'}</Button>
                  {activeGuestRequests.length > 0 && <InfoBadge tone="action">{activeGuestRequests.length} solicitud(es) pendiente(s)</InfoBadge>}
                </div>
                {guestRequestNotice && <div className="mt-3"><NoticeBox notice={guestRequestNotice} /></div>}
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3"><IconBlock icon={Plus} color={eventColor} /><div><p className="font-black">Agregar servicio del catalogo</p><InfoBadge tone="action">Requiere aprobacion de AK</InfoBadge></div></div>
                {catalogServices.length === 0 ? <PortalEmptyState title="El catálogo no está disponible por ahora" description="AK debe publicar los servicios antes de que puedas solicitar un adicional." /> : (
                  <>
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_.5fr_1fr]">
                      <label className="space-y-1 text-sm font-semibold text-slate-700">
                        Servicio
                        <select className="h-10 rounded-md border bg-white px-3 text-sm" value={selectedServiceId} onChange={event => setSelectedServiceId(event.target.value)}>
                          {catalogServices.map(service => <option key={service.id} value={service.id}>{service.nombre}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-sm font-semibold text-slate-700">Cantidad<Input type="number" min={1} value={serviceQuantity} onChange={event => setServiceQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
                      <div className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p>Extra ajustado: <strong>{formatPortalMoney(selectedServiceAdditional)}</strong></p>
                        <p>Nuevo total estimado: <strong>{formatPortalMoney(selectedServiceNewTotal)}</strong></p>
                        <p className="text-xs text-slate-500">Incluye ajuste anual de {annualAdjustmentPercent}%.</p>
                      </div>
                    </div>
                    <Textarea className="mt-3" value={serviceNote} onChange={event => setServiceNote(event.target.value)} placeholder="Nota para AK sobre este servicio" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button onClick={submitServiceRequest} disabled={serviceRequestLoading} style={{ background: eventColor }}><Send className="h-4 w-4" /> {serviceRequestLoading ? 'Enviando' : 'Solicitar servicio'}</Button>
                      {activeServiceRequests.length > 0 && <InfoBadge tone="action">{activeServiceRequests.length} solicitud(es) pendiente(s)</InfoBadge>}
                    </div>
                    {serviceRequestNotice && <div className="mt-3"><NoticeBox notice={serviceRequestNotice} /></div>}
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {access.canSeeOrganization && <AccordionItem value="invitados" id="portal-invitados" className="ak-public-card px-4">
            <AccordionTrigger className="text-left text-lg font-black hover:no-underline"><span className="flex items-center gap-3"><IconBlock icon={Users} color={eventColor} /> Invitados</span></AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label="Total" value={guestStats.total} icon={Users} tone="bg-slate-50 text-slate-700" />
                <StatTile label="Confirmados" value={guestStats.confirmed} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
                <StatTile label="Pendientes" value={guestStats.pending} icon={Clock} tone="bg-amber-50 text-amber-700" />
                <StatTile label="Tal vez" value={guestStats.maybe} icon={AlertTriangle} tone="bg-sky-50 text-sky-700" />
                <StatTile label="No asisten" value={guestStats.rejected} icon={X} tone="bg-rose-50 text-rose-700" />
              </div>
              <div className="rounded-lg border p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">Resumen rápido</p>
                <p>El cliente ve cuántas personas ya confirmaron y cuántas siguen pendientes, sin tener que buscar en otras pantallas.</p>
                {settings?.invitados?.visible ? <p className="mt-2">La lista de invitados está activa para este portal.</p> : <p className="mt-2">AK puede activar la lista completa desde la configuración del portal.</p>}
              </div>
            </AccordionContent>
          </AccordionItem>}

          {access.canSeeLive && (
            <AccordionItem value="vivo" id="portal-vivo" className="ak-public-card px-4">
              <AccordionTrigger className="text-left text-lg font-black hover:no-underline"><span className="flex items-center gap-3"><IconBlock icon={PartyPopper} color={eventColor} /> Fiesta en vivo</span></AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickButton href={`/evento/social/${fiesta.id}`} icon={ImageIcon} label="Muro social" helper="Fotos, mensajes y contenido aprobado" color={eventColor} />
                  <QuickButton href={whatsappHref} icon={MessageCircle} label="Contacto AK" helper="Canal directo para el dia de la fiesta" color={eventColor} external />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="reglas" id="portal-reglas" className="ak-public-card px-4">
            <AccordionTrigger className="text-left text-lg font-black hover:no-underline"><span className="flex items-center gap-3"><IconBlock icon={ShieldCheck} color={eventColor} /> Reglas y preguntas</span></AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              {faqItems.length === 0 ? <PortalEmptyState title="Todavía no hay preguntas frecuentes" description="AK publicará acá la información importante para organizar tu evento." /> : faqItems.map((faq: any) => <div key={faq.id || faq.pregunta} className="rounded-lg border bg-slate-50 p-4"><p className="font-black text-slate-900">{faq.pregunta}</p><p className="mt-1 text-sm leading-6 text-slate-600">{faq.respuesta}</p></div>)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {coverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <p className="text-lg font-black text-slate-900">Personalizar portada</p>
                <p className="text-xs text-slate-500">Seleccioná un diseño premium o subí tu propia foto.</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setCoverModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Diseños Predeterminados</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Negro & Oro Elegante', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop' },
                    { name: 'Luces de Noche Mágica', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop' },
                    { name: 'Brillos de Fiesta', url: 'https://images.unsplash.com/photo-1507504038482-7621abf83863?q=80&w=1200&auto=format&fit=crop' },
                    { name: 'Neón Violeta Abstracto', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop' },
                    { name: 'Champagne & Brindis', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop' },
                    { name: 'Fondo de Color Acento', url: '' },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      disabled={isSavingCover}
                      onClick={() => selectPresetCover(preset.url)}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-slate-400 hover:shadow-sm"
                      style={{ height: '70px', width: '100%' }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                        style={{
                          background: preset.url
                            ? `linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.5)), url(${preset.url}) center/cover`
                            : `linear-gradient(135deg, ${eventColor}, #111827)`,
                        }}
                      />
                      <div className="absolute inset-0 p-2.5 flex items-end">
                        <span className="text-[11px] font-bold text-white tracking-wide block truncate w-full">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subir Foto o Imagen</p>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => handleCoverUpload(event.target.files?.[0])}
                />
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl h-10 text-slate-700 border-slate-300"
                  disabled={isSavingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  {isSavingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500 mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 text-slate-500 mr-2" />
                  )}
                  {isSavingCover ? 'Guardando diseño...' : 'Seleccionar archivo de imagen'}
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pegar URL de Imagen</p>
                <div className="flex gap-2">
                  <Input
                    value={customCoverUrl}
                    onChange={e => setCustomCoverUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mi-portada.jpg"
                    disabled={isSavingCover}
                    className="flex-1 text-sm rounded-xl h-10"
                  />
                  <Button
                    disabled={isSavingCover || !customCoverUrl.trim()}
                    onClick={handleCustomCoverUrl}
                    style={{ background: eventColor }}
                    className="rounded-xl h-10 text-white font-bold"
                  >
                    Guardar URL
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Color de Acento del Portal</p>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {[
                    { name: 'Dorado / Oro', color: '#d97706' },
                    { name: 'Esmeralda', color: '#0d9488' },
                    { name: 'Violeta / Lavanda', color: '#7c3aed' },
                    { name: 'Rosa / Fucsia', color: '#db2777' },
                    { name: 'Azul Marino', color: '#2563eb' },
                    { name: 'Pizarra / Gris', color: '#475569' },
                  ].map(preset => (
                    <button
                      key={preset.color}
                      type="button"
                      disabled={isSavingColor}
                      onClick={() => selectColorTheme(preset.color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${eventColor.toLowerCase() === preset.color.toLowerCase() ? 'border-slate-800 scale-105 shadow-md' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                  <div className="h-6 w-[1px] bg-slate-200 mx-1" />
                  <label className="relative cursor-pointer flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 overflow-hidden" title="Elegir otro color">
                    <input
                      type="color"
                      disabled={isSavingColor}
                      value={eventColor}
                      onChange={e => selectColorTheme(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Palette className="w-4 h-4 text-slate-500" />
                  </label>
                </div>
              </div>

              {coverNotice && <NoticeBox notice={coverNotice} />}
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL DE CANCELACIÓN DE SERVICIOS O FIESTA ── */}
      {cancelarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b p-4 bg-rose-50">
              <div>
                <p className="text-lg font-black text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" /> Cancelar Servicios o Fiesta
                </p>
                <p className="text-xs text-rose-800/80">Recargo por penalización del 30% según contrato</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cerrar" onClick={() => setCancelarModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${cancellationMode === 'partial' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setCancellationMode('partial')}
                >
                  Cancelar algunos servicios
                </button>
                <button
                  type="button"
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${cancellationMode === 'all' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => { setCancellationMode('all'); setSelectedServicesToCancel([]); }}
                >
                  Cancelar fiesta completa
                </button>
              </div>

              {cancellationMode === 'partial' ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccioná los servicios a quitar:</p>
                  <div className="border rounded-xl divide-y max-h-[200px] overflow-y-auto bg-slate-50/50">
                    {lineItems.filter((item: any) => item.idServicioCatalogo !== 'multa_cancelacion_total' && !item.idServicioCatalogo.startsWith('multa_cancelacion_') && !item.idServicioCatalogo.startsWith('multa_cambio_fecha_')).map((item: any) => {
                      const isChecked = selectedServicesToCancel.includes(item.idServicioCatalogo);
                      return (
                        <label key={item.idServicioCatalogo} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedServicesToCancel(prev =>
                                isChecked
                                  ? prev.filter(id => id !== item.idServicioCatalogo)
                                  : [...prev, item.idServicioCatalogo]
                              );
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{item.nombreServicio}</p>
                            <p className="text-slate-500 text-[10px]">
                              Cantidad: {item.cantidad ?? 1} {item.unidad ? ` ${item.unidad}` : ''} · Precio: {formatPortalMoney(item.costoTotalItem)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 text-xs space-y-2 text-rose-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" /> ATENCIÓN: CANCELACIÓN TOTAL</p>
                  <p>
                    Se cancelará la fiesta en su totalidad. Esta acción es definitiva y dará de baja el evento, generando el contrato de rescisión y la liquidación del 30% de penalización sobre el presupuesto total.
                  </p>
                </div>
              )}

              {/* IMPACTO FINANCIERO */}
              {(() => {
                const impact = getCancellationImpact();
                const hasSelections = cancellationMode === 'all' || selectedServicesToCancel.length > 0;
                if (!hasSelections) return <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Seleccioná al menos un servicio para ver el impacto financiero.</p>;

                return (
                  <div className="border rounded-2xl p-4 bg-slate-50 text-xs space-y-2.5">
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Simulación de impacto financiero:</p>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total original del contrato:</span>
                      <span className="font-bold">{formatPortalMoney(paymentSummary.total)}</span>
                    </div>
                    {cancellationMode === 'partial' && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Valor de servicios a cancelar:</span>
                        <span className="font-bold text-rose-600">-{formatPortalMoney(impact.cancelledOriginalSum || 0)}</span>
                      </div>
                    )}
                    {impact.yearsDiff > 0 && (
                      <div className="flex justify-between text-slate-500 text-[10px] italic">
                        <span>Ajuste acumulado ({impact.yearsDiff} años):</span>
                        <span>x{impact.factorAjuste.toFixed(3)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-semibold">Multa (30% de lo cancelado ajustado):</span>
                      <span className="font-bold text-rose-700">+{formatPortalMoney(impact.penalty)}</span>
                    </div>
                    <div className="border-t my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="font-black text-slate-800">Nuevo total del contrato:</span>
                      <span className="font-black text-slate-900">{formatPortalMoney(impact.newTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total ya abonado por vos:</span>
                      <span className="font-bold text-emerald-700">{formatPortalMoney(paymentSummary.paid)}</span>
                    </div>
                    
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-sm ${impact.refund > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      <span className="font-black flex items-center gap-1.5">
                        {impact.refund > 0 ? <CheckCircle2 className="h-5 w-5 animate-none" /> : <AlertTriangle className="h-5 w-5 animate-none" />}
                        {impact.refund > 0 ? 'SE TE DEVOLVERÁ:' : 'RESTAS DEBER DE MULTA:'}
                      </span>
                      <span className="font-black text-base">
                        {impact.refund > 0 ? formatPortalMoney(impact.refund) : formatPortalMoney(impact.owed)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4 bg-slate-50">
              <Button variant="ghost" className="rounded-xl" onClick={() => setCancelarModalOpen(false)}>Cancelar</Button>
              <Button
                disabled={cancellationMode === 'partial' && selectedServicesToCancel.length === 0}
                onClick={() => {
                  setCancelarModalOpen(false);
                  setPinActionType('cancelar');
                  setPinInput('');
                  setPinError('');
                  setActionSuccessData(null);
                  setPinVerificationOpen(true);
                }}
                className="rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Aceptar y Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CAMBIO DE FECHA ── */}
      {cambioFechaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b p-4 bg-amber-50">
              <div>
                <p className="text-lg font-black text-amber-950 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" /> Cambiar Fecha del Evento
                </p>
                <p className="text-xs text-amber-800/80">Recargo del 10% por cambio de fecha</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cerrar" onClick={() => setCambioFechaModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposed-new-date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elegí la nueva fecha solicitada:</Label>
                <Input
                  id="proposed-new-date"
                  type="date"
                  value={newProposedDate ? newProposedDate.split('T')[0] : ''}
                  onChange={e => handleCheckDate(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {dateChecking && (
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Validando disponibilidad de la fecha...
                </div>
              )}

              {dateAvailabilityResult && (
                <div className="space-y-3">
                  {dateAvailabilityResult.available ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 space-y-2">
                      <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> ¡Fecha disponible!</p>
                      <p>La fecha elegida no tiene eventos asignados y está libre para agendar.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800 space-y-2.5">
                      <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-rose-600" /> Fecha no disponible</p>
                      <p>Lamentablemente ya hay otra fiesta agendada para esa fecha. Te sugerimos las siguientes opciones libres cercanas:</p>
                      
                      {dateAvailabilityResult.suggestions && dateAvailabilityResult.suggestions.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {dateAvailabilityResult.suggestions.map((sugDate) => {
                            const dateObj = new Date(sugDate);
                            const formatted = dateObj.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' });
                            return (
                              <button
                                key={sugDate}
                                type="button"
                                onClick={() => handleCheckDate(sugDate)}
                                className="px-2 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 transition-colors text-center"
                              >
                                {formatted}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-rose-700 italic">No se encontraron alternativas libres automáticas. Probá otra fecha.</p>
                      )}
                    </div>
                  )}

                  {dateAvailabilityResult.available && (() => {
                    const impact = getDateChangeImpact();
                    return (
                      <div className="border rounded-2xl p-4 bg-slate-50 text-xs space-y-2.5">
                        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Impacto financiero del cambio:</p>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total original del contrato:</span>
                          <span className="font-bold">{formatPortalMoney(paymentSummary.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Multa por reprogramación (10%):</span>
                          <span className="font-bold text-amber-700">+{formatPortalMoney(impact.penalty)}</span>
                        </div>
                        <div className="border-t my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="font-black text-slate-800">Nuevo total del contrato:</span>
                          <span className="font-black text-slate-900">{formatPortalMoney(impact.newTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total ya abonado por vos:</span>
                          <span className="font-bold text-emerald-700">{formatPortalMoney(paymentSummary.paid)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span className="font-black text-slate-800">Nuevo saldo pendiente a pagar:</span>
                          <span className="font-black text-amber-700">{formatPortalMoney(impact.newBalance)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-relaxed pt-1 border-t">
                          * Nota: Si reprogramás para otro año diferente al original, se sumará el ajuste por inflación anual estipulado al momento del cobro.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4 bg-slate-50">
              <Button variant="ghost" className="rounded-xl" onClick={() => setCambioFechaModalOpen(false)}>Cancelar</Button>
              <Button
                disabled={!newProposedDate || !dateAvailabilityResult || !dateAvailabilityResult.available}
                onClick={() => {
                  setCambioFechaModalOpen(false);
                  setPinActionType('cambiar_fecha');
                  setPinInput('');
                  setPinError('');
                  setActionSuccessData(null);
                  setPinVerificationOpen(true);
                }}
                className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black"
              >
                Aceptar y Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE VERIFICACIÓN DE PIN Y CONTRASEÑA ── */}
      {pinVerificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b p-4 bg-slate-50">
              <div>
                <p className="text-lg font-black text-slate-800">Autorizar Operación Especial</p>
                <p className="text-xs text-slate-500">Ingresá tu PIN/Contraseña para validar la acción</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cerrar" onClick={() => setPinVerificationOpen(false)} disabled={actionProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 space-y-4">
              {!actionSuccessData ? (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para confirmar el cambio e iniciar la generación del contrato/adenda de firma manual, necesitás ingresar la contraseña de operaciones VIP que te fue entregada.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="operations-pin-code" className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIN / Contraseña de Operaciones:</Label>
                    <Input
                      id="operations-pin-code"
                      type="password"
                      placeholder="Ej: ******"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      className="rounded-xl h-11 text-center font-mono text-lg tracking-widest animate-none"
                      maxLength={12}
                    />
                  </div>

                  {pinError && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                      ⚠️ {pinError}
                    </p>
                  )}

                  <Button
                    className="w-full h-11 rounded-xl font-bold text-white flex items-center justify-center gap-1.5"
                    disabled={!pinInput || actionProcessing}
                    style={{ background: eventColor }}
                    onClick={pinActionType === 'cancelar' ? handleConfirmCancellation : handleConfirmDateChange}
                  >
                    {actionProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      'Confirmar y Generar Contrato'
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-800">¡Acción Autorizada con Éxito!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      El presupuesto se actualizó y se generó el contrato en PDF/Texto para firmar.
                    </p>
                  </div>

                  <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 w-full text-xs text-emerald-900 leading-relaxed text-left space-y-2">
                    <p className="font-bold flex items-center gap-1.5">📢 INSTRUCCIONES DE ACCIÓN REQUERIDA:</p>
                    <p>
                      1. Descargá el documento de rescisión/adenda generado haciendo clic en el botón de abajo.
                    </p>
                    <p>
                      2. Imprimilo y **firmalo manualmente**.
                    </p>
                    <p>
                      3. **Comunicate de inmediato con nosotros** informándonos de tu decisión para coordinar la entrega física/digital y concretar los saldos correspondientes.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-2">
                    <Button className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2" asChild>
                      <a href={documentHref(fiesta.id, actionSuccessData.fileName)} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-5 w-5" /> Descargar Contrato (.txt)
                      </a>
                    </Button>
                    <Button variant="ghost" className="w-full rounded-xl text-slate-500 animate-none" onClick={() => { setPinVerificationOpen(false); window.location.reload(); }}>
                      Cerrar y Recargar Portal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
