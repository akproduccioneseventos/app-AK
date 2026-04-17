'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileSignature,
  FileText,
  Gift,
  GlassWater,
  Globe,
  HelpCircle,
  KeyRound,
  Loader2,
  LogIn,
  MapPin,
  Music,
  NotebookText,
  Package,
  Palette,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Users,
  Video,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type {
  BebidaCalculable,
  ClientPortalSettings,
  ClientTarea,
  CuentaBancaria,
  FiestaEnPlanificacion,
  FaqItem,
} from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { notifyClientArrival } from '@/app/actions/fiesta/live.actions';
import {
  addClientMusicSuggestion,
  updateClientChecklistItem,
  updateClientNotes,
} from '@/app/actions/fiesta/portal.actions';
import { useToast } from '@/hooks/use-toast';
import { CompanyLogo } from '@/components/company-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const SESSION_KEY_PREFIX = 'portal_auth_';

type ModuleId = keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey' | 'cuentasBancarias' | 'simuladorInvitadosConfig'>;

type PortalModule = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  href?: (fiestaId: string) => string;
};

const portalModules: PortalModule[] = [
  { id: 'checklist', label: 'Mis Tareas', icon: CheckSquare },
  { id: 'itinerario', label: 'Cronograma', icon: Clock3 },
  { id: 'musica', label: 'Sugerencias Musicales', icon: Music, href: (id) => `/portal-cliente/${id}/musica` },
  { id: 'videoVida', label: 'Video de Vida', icon: Video, href: (id) => `/portal-cliente/${id}/fotos-video` },
  { id: 'listaRegalos', label: 'Regalos', icon: Gift, href: (id) => `/fiestas/nueva/regalos?fiestaId=${id}` },
  { id: 'documentos', label: 'Documentos', icon: FileText, href: (id) => `/portal-cliente/${id}/menu` },
  { id: 'notasCliente', label: 'Notas', icon: NotebookText },
  { id: 'paginaPublica', label: 'Invitación Web', icon: Globe, href: (id) => `/invitacion/${id}` },
  { id: 'fotografiaYFilmacion', label: 'Fotografía', icon: Sparkles, href: (id) => `/portal-cliente/${id}/fotos-video` },
  { id: 'moodboard', label: 'Moodboard', icon: Wand2 },
  { id: 'serviciosContratados', label: 'Servicios Contratados', icon: Package },
  { id: 'ubicacion', label: 'Ubicación del Evento', icon: MapPin },
  { id: 'menu', label: 'Menú del Evento', icon: UtensilsCrossed, href: (id) => `/portal-cliente/${id}/menu` },
  { id: 'cartaTragos', label: 'Carta de Tragos', icon: GlassWater },
  { id: 'dressCode', label: 'Dress Code', icon: Shirt },
  { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
  { id: 'informarPago', label: 'Informar Pago', icon: CreditCard, href: (id) => `/portal/c/${id}` },
  { id: 'pagos', label: 'Estado de Pagos', icon: CreditCard },
  { id: 'calculadoraBebidas', label: 'Calculadora de Bebidas', icon: GlassWater },
  { id: 'invitados', label: 'Lista de Invitados', icon: Users, href: (id) => `/portal-cliente/${id}/confirmar-invitados` },
  { id: 'simuladorInvitados', label: 'Cambiar cantidad de invitados', icon: Users },
  { id: 'contrato', label: 'Contrato', icon: FileSignature, href: (id) => `/portal/${id}/contrato` },
];

function hasVisibleFlag(value: unknown): value is { visible: boolean } {
  return typeof value === 'object' && value !== null && 'visible' in value;
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Fecha a confirmar';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
}

function EventCountdown({ fechaEvento }: { fechaEvento: string }) {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  useEffect(() => {
    const update = () => {
      const target = new Date(fechaEvento.includes('T') ? fechaEvento : `${fechaEvento}T00:00:00`).getTime();
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        dias: Math.floor(diff / 86400000),
        horas: Math.floor((diff % 86400000) / 3600000),
        minutos: Math.floor((diff % 3600000) / 60000),
        segundos: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [fechaEvento]);

  return (
    <div className="grid grid-cols-4 gap-3 text-center">
      {Object.entries(timeLeft).map(([k, v]) => (
        <div key={k} className="rounded-2xl bg-black/25 px-2 py-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-black tabular-nums">{String(v).padStart(2, '0')}</div>
          <div className="text-[10px] opacity-70 uppercase tracking-wider">{k}</div>
        </div>
      ))}
    </div>
  );
}

function PortalSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-black/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-bold text-base">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingMusic, setIsSavingMusic] = useState(false);
  const [musicSuggestion, setMusicSuggestion] = useState('');

  useEffect(() => {
    if (!fiestaId) {
      setError('ID de evento no especificado en la URL.');
      setIsLoading(false);
      return;
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${fiestaId}`;

    const currentFiestaId = fiestaId;

    async function loadFiesta() {
      try {
        const data = await getFiestaById(currentFiestaId);
        if (!data || !data.clientPortalSettings?.enabled) {
          setError('El portal para este evento no está habilitado o el evento no existe.');
          return;
        }

        setFiesta(data);
        setNotes(data.clientNotes ?? '');

        const storedAuthKey = sessionStorage.getItem(sessionKey);
        if (storedAuthKey && storedAuthKey === data.clientPortalSettings.accessKey) {
          setIsAuthenticated(true);
        }
      } catch {
        setError('No se pudo cargar la información del evento.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadFiesta();
  }, [fiestaId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiesta || !fiestaId) return;

    if (password === fiesta.clientPortalSettings?.accessKey) {
      sessionStorage.setItem(`${SESSION_KEY_PREFIX}${fiestaId}`, password);
      setIsAuthenticated(true);
      setError(null);
      return;
    }

    setError('Contraseña incorrecta.');
  };

  const handleArrivalNotify = async () => {
    if (!fiestaId) return;
    setIsNotifying(true);
    const res = await notifyClientArrival(fiestaId);
    if (res.success) {
      toast({ title: '¡Aviso enviado!', description: 'El organizador fue notificado de tu llegada.' });
    } else {
      toast({ title: 'Error', description: 'No se pudo enviar el aviso.', variant: 'destructive' });
    }
    setIsNotifying(false);
  };

  const handleToggleTask = async (task: ClientTarea, checked: boolean) => {
    if (!fiesta) return;

    const previous = fiesta.clientChecklist ?? [];
    const nextChecklist = previous.map((item) =>
      item.id === task.id
        ? { ...item, completada: checked, fechaCompletado: checked ? new Date().toISOString() : undefined }
        : item
    );

    setFiesta({ ...fiesta, clientChecklist: nextChecklist });

    const result = await updateClientChecklistItem(fiesta.id, task.id, checked);
    if (!result.success) {
      setFiesta({ ...fiesta, clientChecklist: previous });
      toast({ title: 'Error', description: result.error ?? 'No se pudo actualizar la tarea.', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    if (!fiesta) return;
    setIsSavingNotes(true);
    const result = await updateClientNotes(fiesta.id, notes);
    if (result.success) {
      setFiesta({ ...fiesta, clientNotes: notes });
      toast({ title: 'Notas guardadas' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudieron guardar las notas.', variant: 'destructive' });
    }
    setIsSavingNotes(false);
  };

  const handleAddSong = async () => {
    const value = musicSuggestion.trim();
    if (!fiesta || !value) return;

    setIsSavingMusic(true);
    const result = await addClientMusicSuggestion(fiesta.id, 'siEsPosible', value);
    if (result.success) {
      setFiesta((prev) => {
        if (!prev) return prev;
        const current = prev.listaMusicaPortal?.siEsPosible ?? [];
        return {
          ...prev,
          listaMusicaPortal: {
            ...prev.listaMusicaPortal,
            siEsPosible: [...current, value],
          },
        };
      });
      setMusicSuggestion('');
      toast({ title: 'Sugerencia agregada' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo guardar la sugerencia.', variant: 'destructive' });
    }
    setIsSavingMusic(false);
  };

  const eventImage =
    fiesta?.invitacionConfig?.fotoPortada ||
    fiesta?.invitacionDigital?.cabecera?.imagenFondoUrl ||
    fiesta?.configuracion?.protagonistaFotoUrl ||
    '';

  const primaryColor = fiesta?.invitacionConfig?.colorPrincipal || '#9333ea';
  const secondaryColor = fiesta?.invitacionConfig?.colorSecundario || '#111827';

  const counts = useMemo(() => {
    if (!fiesta?.planDePagos) return { total: 0, pagado: 0, saldo: 0 };
    const cuotas = fiesta.planDePagos.cuotas;
    const total = cuotas.reduce((acc, item) => acc + item.monto, 0);
    const pagado = cuotas.reduce((acc, item) => {
      if (item.estado === 'pagado') return acc + item.monto;
      if (item.estado === 'parcial') return acc + (item.montoPagado ?? 0);
      return acc;
    }, 0);
    const saldo = Math.max(0, total - pagado);
    return { total, pagado, saldo };
  }, [fiesta?.planDePagos]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 to-slate-800">
        <div className="text-center text-white space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          <p className="text-sm tracking-wide uppercase opacity-80">Cargando portal exclusivo</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-4 bg-slate-950">
        <Card className="max-w-md w-full rounded-3xl border-red-400/40 bg-red-500/10 text-center text-white">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-300" />
            <CardTitle>Acceso no disponible</CardTitle>
            <CardDescription className="text-red-100/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!fiesta) return null;

  if (!isAuthenticated) {
    if (!fiesta.clientPortalSettings?.accessKey) {
      return (
        <div className="min-h-screen grid place-items-center p-4 bg-slate-950">
          <Card className="max-w-md w-full rounded-3xl text-center bg-white/10 border-white/20 text-white">
            <CardHeader>
              <KeyRound className="w-10 h-10 mx-auto text-white/80" />
              <CardTitle>Portal del Cliente</CardTitle>
              <CardDescription className="text-white/70">
                El organizador aún no configuró una contraseña para este portal.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${secondaryColor} 100%)` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <motion.div
          className="relative z-10 w-full max-w-sm mx-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl text-white">
            <CompanyLogo className="mx-auto mb-6 opacity-90" size="sm" />
            <h1 className="text-2xl font-bold text-center mb-1">{fiesta.configuracion.nombreEvento}</h1>
            <p className="text-white/70 text-center text-sm mb-6">Portal Exclusivo · Acceso Privado</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="portal-password" className="text-white/90">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="portal-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-200 text-center">{error}</p>}

              <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold">
                <LogIn className="w-4 h-4 mr-2" /> Ingresar al Portal
              </Button>
            </form>
          </div>
          <p className="text-center text-xs mt-4 text-white/70">Powered by AK Producciones</p>
        </motion.div>
      </div>
    );
  }

  const settings = fiesta.clientPortalSettings;
  if (!settings) return null;
  const modulesForQuickAccess = portalModules.filter((module) => {
    const moduleSetting = settings[module.id];
    return hasVisibleFlag(moduleSetting) ? moduleSetting.visible : false;
  });

  const checklistItems = fiesta.clientChecklist ?? [];
  const itinerario = fiesta.timeline ?? fiesta.programa?.map((item) => ({
    id: item.id,
    nombre: item.titulo,
    emoji: item.icono ?? '🕒',
    fechaProgramada: item.hora,
    completado: false,
  })) ?? [];
  const faqItems: FaqItem[] = fiesta.faqPortal ?? [];
  const cuentasBancarias: CuentaBancaria[] = settings.cuentasBancarias ?? [];
  const dressCode = fiesta.invitacionDigital?.dressCode;
  const mapsHref = fiesta.configuracion.googleMapsUrl || (fiesta.configuracion.direccionLugar ? `https://maps.google.com/?q=${encodeURIComponent(fiesta.configuracion.direccionLugar)}` : '');
  const wazeHref = fiesta.configuracion.direccionLugar ? `https://waze.com/ul?q=${encodeURIComponent(fiesta.configuracion.direccionLugar)}` : '';

  const bebidaItems: BebidaCalculable[] = settings.calculadoraBebidas?.items ?? [];
  const invitadosBase = fiesta.configuracion.invitadosEstimados || 0;
  const minReduction = settings.simuladorInvitados.minReductionPercent ?? 10;
  const maxIncrease = settings.simuladorInvitados.maxIncreasePercent ?? 30;
  const minGuests = Math.max(0, Math.floor(invitadosBase * (1 - minReduction / 100)));
  const maxGuests = Math.floor(invitadosBase * (1 + maxIncrease / 100));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <section
          className="rounded-3xl overflow-hidden relative text-white shadow-xl"
          style={{
            background: eventImage
              ? `linear-gradient(0deg, rgba(0,0,0,.62), rgba(0,0,0,.35)), url(${eventImage}) center/cover`
              : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30">{fiesta.configuracion.tipoCelebracion || 'Evento'}</Badge>
              <Badge className="bg-black/30 text-white border-white/20">Portal VIP</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{fiesta.configuracion.nombreEvento}</h1>
              <div className="text-sm sm:text-base opacity-90 space-y-1">
                <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {formatDate(fiesta.configuracion.fechaEvento)}</p>
                {fiesta.configuracion.nombreLugar && (
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {fiesta.configuracion.nombreLugar}</p>
                )}
              </div>
            </div>

            {fiesta.configuracion.fechaEvento && <EventCountdown fechaEvento={fiesta.configuracion.fechaEvento} />}
          </div>
        </section>

        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-r from-primary/90 to-primary text-white" style={{ background: `linear-gradient(120deg, ${primaryColor}, ${secondaryColor})` }}>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.2em] opacity-90">Día del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-bold text-lg">¿Ya están llegando al salón?</p>
            <Button
              onClick={handleArrivalNotify}
              disabled={isNotifying}
              className="h-14 rounded-2xl bg-white text-slate-900 hover:bg-white/90 font-black w-full sm:w-auto"
            >
              {isNotifying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
              ¡ESTAMOS LLEGANDO!
            </Button>
            <p className="text-sm opacity-90">
              {formatDate(fiesta.configuracion.fechaEvento)} · {fiesta.configuracion.horaInicio || 'Hora a confirmar'}
            </p>
            {fiesta.configuracion.direccionLugar && (
              <div className="text-sm opacity-95 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{fiesta.configuracion.direccionLugar}</span>
              </div>
            )}
            {mapsHref && (
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex text-xs font-semibold underline">
                Abrir en Google Maps
              </a>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {settings.checklist.visible && (
            <PortalSection title="Checklist del Cliente" icon={CheckSquare}>
              {checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tareas cargadas todavía.</p>
              ) : (
                <div className="grid gap-3">
                  {checklistItems.map((task) => (
                    <label key={task.id} className="flex items-start gap-3 rounded-2xl border p-3">
                      <Checkbox
                        checked={task.completada}
                        disabled={!settings.checklist.editable}
                        onCheckedChange={(checked) => handleToggleTask(task, checked === true)}
                      />
                      <div>
                        <p className={cn('font-medium', task.completada && 'line-through text-muted-foreground')}>{task.texto}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </PortalSection>
          )}

          {settings.itinerario.visible && (
            <PortalSection title="Itinerario del Evento" icon={Clock3}>
              {itinerario.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no se cargó el cronograma.</p>
              ) : (
                <div className="space-y-4">
                  {itinerario.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <div className="w-px flex-1 bg-primary/20 mt-1" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-primary">{item.fechaProgramada || 'Hora a confirmar'}</p>
                        <p className="font-medium">{item.nombre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PortalSection>
          )}

          {settings.menu.visible && (
            <PortalSection title="Menú del Evento" icon={UtensilsCrossed}>
              {fiesta.menuMesa ? (
                <div className="space-y-3">
                  {[
                    { label: 'Entrada', value: fiesta.menuMesa.entrada },
                    { label: 'Plato Principal', value: fiesta.menuMesa.platoPrincipal },
                    { label: 'Adolescentes', value: fiesta.menuMesa.adolescentes },
                    { label: 'Postres', value: fiesta.menuMesa.postres },
                    { label: 'Bebidas', value: fiesta.menuMesa.bebidas },
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <div key={row.label} className="rounded-xl bg-muted/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                        <p className="font-medium">{row.value}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <Link href={`/portal-cliente/${fiesta.id}/menu`} className="inline-flex items-center text-primary font-semibold">
                  Completar menú en módulo específico <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              )}
            </PortalSection>
          )}

          {settings.cartaTragos.visible && (
            <PortalSection title="Carta de Tragos" icon={GlassWater}>
              {fiesta.cartaTragos?.items?.length ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {fiesta.cartaTragos.items.map((item) => (
                    <div key={item.id} className="border rounded-xl p-3 text-sm font-medium bg-muted/30">🍸 {item.nombre}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay tragos cargados todavía.</p>
              )}
            </PortalSection>
          )}

          {settings.calculadoraBebidas.visible && (
            <PortalSection title="Calculadora de Bebidas" icon={GlassWater}>
              {bebidaItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ítems configurados.</p>
              ) : (
                <div className="space-y-2">
                  {bebidaItems.filter((item) => item.visible).map((item) => {
                    const total = Math.ceil((item.cantidadPorPersona || 0) * (fiesta.configuracion.invitadosEstimados || 0));
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 items-center border rounded-xl p-3">
                        <p className="font-medium">{item.emoji} {item.nombre}</p>
                        <p className="text-sm font-semibold">{total} {item.unidad}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </PortalSection>
          )}

          {settings.serviciosContratados.visible && (
            <PortalSection title="Servicios Contratados" icon={Package}>
              {fiesta.modulosContratados ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(fiesta.modulosContratados).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <Badge variant="secondary" className={enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                        {enabled ? 'Activo' : 'No activo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay servicios detallados para este evento.</p>
              )}
            </PortalSection>
          )}

          {settings.ubicacion.visible && (
            <PortalSection title="Ubicación del Evento" icon={MapPin}>
              <div className="space-y-2">
                <p className="font-semibold">{fiesta.configuracion.nombreLugar || 'Lugar a confirmar'}</p>
                {fiesta.configuracion.direccionLugar && <p className="text-muted-foreground">{fiesta.configuracion.direccionLugar}</p>}
                <div className="flex gap-2 flex-wrap pt-2">
                  {mapsHref && (
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Google Maps</Button>
                    </a>
                  )}
                  {wazeHref && (
                    <a href={wazeHref} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Waze</Button>
                    </a>
                  )}
                </div>
              </div>
            </PortalSection>
          )}

          {settings.dressCode.visible && (
            <PortalSection title="Dress Code" icon={Shirt}>
              {dressCode ? (
                <div className="space-y-3 text-sm">
                  {dressCode.tipo && <p><span className="font-semibold">Tipo:</span> {dressCode.tipo}</p>}
                  {fiesta.invitacionConfig?.colorSugeridoInvitados && (
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">Color sugerido:</span>
                      <span
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: fiesta.invitacionConfig.colorSugeridoInvitados }}
                      />
                      <span>{fiesta.invitacionConfig.colorSugeridoInvitados}</span>
                    </div>
                  )}
                  {dressCode.evitar && dressCode.evitar.length > 0 && (
                    <p><span className="font-semibold">Evitar:</span> {dressCode.evitar.join(', ')}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin información de vestimenta por el momento.</p>
              )}
            </PortalSection>
          )}

          {settings.pagos.visible && (
            <PortalSection title="Pagos y Saldo" icon={CreditCard}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-black">{formatCurrency(counts.total)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Pagado</p>
                    <p className="font-black text-emerald-700">{formatCurrency(counts.pagado)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="font-black text-amber-700">{formatCurrency(counts.saldo)}</p>
                  </div>
                </div>

                {fiesta.planDePagos?.cuotas?.length ? (
                  <div className="space-y-2">
                    {fiesta.planDePagos.cuotas.map((cuota) => (
                      <div key={cuota.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                        <div>
                          <p className="font-medium">{cuota.descripcion}</p>
                          <p className="text-muted-foreground">Vence: {formatDate(cuota.fechaVencimiento)}</p>
                        </div>
                        <Badge variant="secondary">{cuota.estado}</Badge>
                      </div>
                    ))}
                  </div>
                ) : null}

                {cuentasBancarias.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Datos bancarios</p>
                    {cuentasBancarias.map((cuenta) => (
                      <div key={cuenta.id} className="rounded-xl border p-3 text-sm">
                        <p className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> {cuenta.banco}</p>
                        <p>{cuenta.titular} · {cuenta.numero}</p>
                        {cuenta.tipo && <p className="text-muted-foreground">{cuenta.tipo}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {settings.informarPago.visible && (
                  <Button asChild>
                    <a href={`/portal/c/${settings.accessKey || fiesta.id}`} target="_blank" rel="noopener noreferrer">
                      <CreditCard className="w-4 h-4 mr-2" /> Informar Pago
                    </a>
                  </Button>
                )}
              </div>
            </PortalSection>
          )}

          {settings.musica.visible && (
            <PortalSection title="Sugerencias Musicales" icon={Music}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={musicSuggestion}
                    onChange={(e) => setMusicSuggestion(e.target.value)}
                    placeholder="Ej: Coldplay - A Sky Full of Stars"
                  />
                  <Button onClick={handleAddSong} disabled={isSavingMusic || !musicSuggestion.trim()}>
                    {isSavingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {(fiesta.listaMusicaPortal?.siEsPosible ?? []).map((song) => (
                    <div key={song} className="rounded-xl border p-2 text-sm">🎵 {song}</div>
                  ))}
                  {(fiesta.listaMusicaPortal?.siEsPosible ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no hay sugerencias.</p>
                  )}
                </div>
              </div>
            </PortalSection>
          )}

          {settings.moodboard.visible && (
            <PortalSection title="Moodboard" icon={Palette}>
              {fiesta.decoracion?.moodboardItems?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {fiesta.decoracion.moodboardItems.slice(0, 8).map((item) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border p-2 text-xs truncate">
                      {item.description || 'Inspiración'}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay moodboard cargado todavía.</p>
              )}
            </PortalSection>
          )}

          {settings.faq.visible && (
            <PortalSection title="Preguntas Frecuentes" icon={HelpCircle}>
              {faqItems.length ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger>{item.pregunta}</AccordionTrigger>
                      <AccordionContent>{item.respuesta}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No hay preguntas cargadas.</p>
              )}
            </PortalSection>
          )}

          {settings.notasCliente.visible && (
            <PortalSection title="Notas del Cliente" icon={NotebookText}>
              <div className="space-y-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Escribí tus notas..." />
                <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                  {isSavingNotes ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Guardar notas
                </Button>
              </div>
            </PortalSection>
          )}

          {settings.simuladorInvitados.visible && (
            <PortalSection title="Simulador de Invitados" icon={Users}>
              <div className="space-y-2 text-sm">
                <p>Invitados contratados: <strong>{invitadosBase}</strong></p>
                <p>Rango permitido: <strong>{minGuests}</strong> a <strong>{maxGuests}</strong></p>
                <p className="text-muted-foreground">Para confirmar cambios usá contacto directo con tu coordinador.</p>
              </div>
            </PortalSection>
          )}

          <PortalSection title="Accesos rápidos" icon={ArrowRight}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {modulesForQuickAccess.map((module) => {
                const Icon = module.icon;
                const href = module.href?.(fiesta.id);
                return href ? (
                  <Link key={module.id} href={href} className="rounded-2xl border p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{module.label}</p>
                        <p className="text-xs text-muted-foreground">Abrir módulo</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div key={module.id} className="rounded-2xl border p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{module.label}</p>
                        <p className="text-xs text-muted-foreground">Disponible en esta pantalla</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PortalSection>
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground py-8">Powered by AK Producciones</footer>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}
