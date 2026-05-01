'use client';

import { useRef, useState, type ElementType, type ReactNode } from 'react';
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
} from 'lucide-react';
import { addClientMusicSuggestion, submitClientMenuChangeRequest, submitClientPayment } from '@/app/actions/fiesta/portal.actions';
import { PublicFooter } from '@/components/public-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  buildWhatsAppHref,
  estimateGuestIncrease,
  formatPortalMoney,
  getGuestStats,
  getPortalPaymentSummary,
} from '@/lib/client-portal/client-portal-summary';

type PublicPortalClientExperienceProps = {
  fiesta: any;
  companyContact: string;
  companyName: string;
  presupuesto?: any | null;
};

type DisplayIcon = ElementType<{ className?: string }>;

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
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function QuickButton({ href, icon: Icon, label, helper, color }: { href: string; icon: DisplayIcon; label: string; helper: string; color: string }) {
  return (
    <a href={href} className="group flex min-h-[88px] items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-slate-500">{text}</p>;
}

function NoticeBox({ notice }: { notice: Notice }) {
  const className = notice.type === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-rose-200 bg-rose-50 text-rose-800';

  return <p className={`rounded-lg border p-3 text-sm font-medium ${className}`}>{notice.text}</p>;
}

export default function PublicPortalClientExperience({ fiesta, companyContact, companyName, presupuesto }: PublicPortalClientExperienceProps) {
  const config = fiesta?.configuracion ?? {};
  const settings = fiesta?.clientPortalSettings ?? {};
  const portalExperience = fiesta?.clientePortalExperience ?? {};
  const presupuestoText = getBudgetSearchText(presupuesto);

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

  const invitados = fiesta?.invitados ?? [];
  const guestStats = getGuestStats(invitados);
  const totalPresupuesto = getTotalPresupuesto(presupuesto);
  const paymentSummary = getPortalPaymentSummary({
    total: totalPresupuesto,
    payments: presupuesto?.pagosCliente ?? [],
    notifications: fiesta?.clientPaymentNotifications ?? [],
  });

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

  const nextStep = (() => {
    if (isDefaultLink) return { title: 'Falta personalizar el link', text: 'Antes de enviarlo, AK debe cambiar el link de prueba por uno real.' };
    if (!presupuesto) return { title: 'Falta el presupuesto', text: 'Cuando AK lo cargue, vas a ver pagos, contrato y servicios.' };
    if (paymentSummary.pendingReviewCount > 0) return { title: 'Pago en revisión', text: `Hay ${paymentSummary.pendingReviewCount} pago(s) esperando confirmación de AK.` };
    if (paymentSummary.balance > 0) return { title: 'Saldo pendiente', text: `Saldo actual: ${formatPortalMoney(paymentSummary.balance)}.` };
    if (pendingTasks.length > 0) return { title: 'Pendiente para revisar', text: pendingTasks[0].text };
    if (guestStats.needsAction > 0) return { title: 'Invitados pendientes', text: `${guestStats.needsAction} invitado(s) todavía necesitan respuesta.` };
    return { title: 'Todo encaminado', text: 'La información principal del evento está ordenada.' };
  })();

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
    const key = documento?.fileName || documento?.id || getDocumentName(documento);
    return key && list.findIndex(item => (item?.fileName || item?.id || getDocumentName(item)) === key) === index;
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
  const faqItems = fiesta?.faqPortal ?? [];
  const activeGuestRequests = (fiesta?.clientMenuChangeRequests ?? []).filter((request: any) => request.status === 'pendiente');

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

  const guestEstimate = estimateGuestIncrease({
    currentTotal: totalPresupuesto,
    currentGuestCount,
    adultDelta: extraAdults,
    childDelta: extraChildren,
    annualAdjustmentPercent,
  });

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: heroImage
            ? `linear-gradient(90deg, rgba(15, 23, 42, .86), rgba(15, 23, 42, .34)), url(${heroImage}) center/cover`
            : `linear-gradient(135deg, ${eventColor}, #111827)`,
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:py-8 lg:grid-cols-[1.5fr_.75fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/20 text-white">Portal cliente</Badge>
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
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><PartyPopper className="h-4 w-4" />{days === null ? 'Fecha a confirmar' : days > 0 ? `Faltan ${days} días` : 'Evento en marcha'}</span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 text-slate-950 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <IconBlock icon={ShieldCheck} color={eventColor} />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Próximo paso</p>
                <p className="text-xl font-black">{nextStep.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{nextStep.text}</p>
              </div>
            </div>
            <Button className="w-full" style={{ background: eventColor }} asChild>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Hablar con AK
              </a>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-7">
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

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <QuickButton href="#portal-organizacion" icon={ClipboardList} label="Organización" helper="Música, reuniones, fotos y cronograma" color={eventColor} />
          <QuickButton href="#portal-contable" icon={Wallet} label="Pagos y contrato" helper="Presupuesto, documentos y simulador" color={eventColor} />
          <QuickButton href="#portal-invitados" icon={Users} label="Invitados" helper="Confirmados, pendientes y cambios" color={eventColor} />
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Invitados confirmados" value={guestStats.confirmed} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
          <StatTile label="Invitados pendientes" value={guestStats.needsAction} icon={Users} tone="bg-amber-50 text-amber-700" />
          <StatTile label="Pagado" value={formatPortalMoney(paymentSummary.paid)} icon={Receipt} tone="bg-sky-50 text-sky-700" />
          <StatTile label="Saldo" value={formatPortalMoney(paymentSummary.balance)} icon={CircleDollarSign} tone="bg-rose-50 text-rose-700" />
        </div>

        <Accordion type="multiple" defaultValue={["organizacion", "contable", "invitados"]} className="space-y-4">
          <AccordionItem value="organizacion" id="portal-organizacion" className="rounded-lg border bg-white px-4 shadow-sm">
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
                    {musicMust.length === 0 ? <EmptyLine text="Sin canciones cargadas." /> : musicMust.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-black">Si es posible</p>
                    {musicMaybe.length === 0 ? <EmptyLine text="Sin sugerencias." /> : musicMaybe.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-black">No reproducir</p>
                    {musicNo.length === 0 ? <EmptyLine text="Sin canciones bloqueadas." /> : musicNo.slice(0, 6).map((song: string) => <p key={song} className="mb-2 rounded-md bg-white px-3 py-2 text-sm">{song}</p>)}
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
                  {reuniones.length === 0 ? <EmptyLine text="No hay reuniones cargadas todavía." /> : reuniones.slice(0, 5).map((reunion: any) => (
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
                    ) : <EmptyLine text="El mural social todavía no está activo." />}
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
                  ) : <EmptyLine text="El menú todavía no está cargado." />}
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
                    {!fiesta?.decoracion?.tema && !fiesta?.decoracion?.generalNotesDecoracion && <EmptyLine text="La decoración todavía no tiene notas visibles." />}
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
                {timelineItems.length === 0 ? <EmptyLine text="El cronograma todavía no está cargado." /> : (
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
          </AccordionItem>

          <AccordionItem value="contable" id="portal-contable" className="rounded-lg border bg-white px-4 shadow-sm">
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
              <div className="rounded-full bg-slate-100 p-1"><div className="h-3 rounded-full" style={{ width: `${paymentSummary.paidPercent}%`, background: eventColor }} /></div>

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
                    {documentos.length === 0 && <EmptyLine text="No hay documentos descargables cargados todavía." />}
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

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3"><IconBlock icon={Receipt} color={eventColor} /><div><p className="font-black">Lo contratado</p><InfoBadge>Solo información</InfoBadge></div></div>
                {lineItems.length === 0 ? <EmptyLine text="No hay servicios cargados en el presupuesto." /> : (
                  <div className="grid gap-2 lg:grid-cols-2">
                    {lineItems.slice(0, 12).map((item: any, index: number) => <div key={`${item.idServicioCatalogo}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-900">{item.nombreServicio}</p><p className="text-slate-500">Cantidad: {item.cantidad ?? 1}{item.unidad ? ` ${item.unidad}` : ''}</p><p className="font-bold text-slate-800">{formatPortalMoney(item.costoTotalItem)}</p></div>)}
                  </div>
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="invitados" id="portal-invitados" className="rounded-lg border bg-white px-4 shadow-sm">
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
          </AccordionItem>

          <AccordionItem value="reglas" id="portal-reglas" className="rounded-lg border bg-white px-4 shadow-sm">
            <AccordionTrigger className="text-left text-lg font-black hover:no-underline"><span className="flex items-center gap-3"><IconBlock icon={ShieldCheck} color={eventColor} /> Reglas y preguntas</span></AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              {faqItems.length === 0 ? <EmptyLine text="No hay reglas o preguntas frecuentes cargadas todavía." /> : faqItems.map((faq: any) => <div key={faq.id || faq.pregunta} className="rounded-lg border bg-slate-50 p-4"><p className="font-black text-slate-900">{faq.pregunta}</p><p className="mt-1 text-sm leading-6 text-slate-600">{faq.respuesta}</p></div>)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div><p className="text-lg font-black">Informar pago</p><p className="text-sm text-slate-500">AK lo confirma después de revisarlo.</p></div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPaymentModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3 p-4">
              <Input type="number" min={0} value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} placeholder="Monto pagado" />
              <Textarea value={paymentNote} onChange={event => setPaymentNote(event.target.value)} placeholder="Nota opcional" />
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={event => handlePaymentFile(event.target.files?.[0])} />
              <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> {paymentFile ? paymentFile.name : 'Subir comprobante'}</Button>
              <Button className="w-full" onClick={submitPayment} disabled={paymentLoading} style={{ background: eventColor }}><Send className="h-4 w-4" /> {paymentLoading ? 'Enviando' : 'Enviar pago'}</Button>
              {paymentNotice && <NoticeBox notice={paymentNotice} />}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
