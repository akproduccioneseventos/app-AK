'use client';

import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { CompanyLogo } from '@/components/company-logo';
import { cn } from '@/lib/utils';
import {
  Loader2,
  AlertTriangle,
  KeyRound,
  LogIn,
  DollarSign,
  Users,
  MapPin,
  CalendarDays,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Clock,
  ChevronRight,
  Activity,
  Palette,
  Heart,
  Zap,
  BookHeart,
  PackageCheck,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { FiestaEnPlanificacion, Invitado, CuotaPlanPago, ClienteDebeLlevarItem, ClientePortalExperience } from '@/types/fiesta';
import NextImage from 'next/image';
import Link from 'next/link';
import {
  cambiarClavePortal,
  getFiestaForPortalSession,
  initializePortalSession,
  recuperarClavePortal,
  guardarCorreoDeRecuperacion,
  updateClientGuestTable,
  updateClientPackingList,
} from '@/app/actions/fiesta/portal.actions';
import { construirClavePorDefecto } from '@/lib/client-portal/clave-portal';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { useToast } from '@/hooks/use-toast';
import { EventProgressBar } from '@/components/portal/EventProgressBar';
import { calcFiestaProgress } from '@/lib/fiesta-progress';
import { defaultClienteDebeLlevar } from '@/lib/fiesta-defaults';
import { getPaymentPlanSummary } from '@/lib/budget/payment-summary';
import { parseEventDate } from '@/lib/public-experience/event-date';
import { motion } from 'framer-motion';
import { SUAVE, DURACION } from '@/lib/motion';

const SESSION_KEY_PREFIX = 'portal_auth_';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  enviado:   { label: 'Enviado',   color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
  revisado:  { label: 'En revisión', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  listo:     { label: 'Listo ✓',   color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return parseEventDate(iso)?.toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' }) ?? '—';
}

function cuotaStatusColor(estado: CuotaPlanPago['estado']) {
  switch (estado) {
    case 'pagado': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'parcial': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'vencido': return 'bg-destructive/10 text-destructive border-destructive/20';
    default:        return 'bg-muted text-muted-foreground border-border';
  }
}

function cuotaStatusLabel(estado: CuotaPlanPago['estado']) {
  switch (estado) {
    case 'pagado':   return 'Pagado';
    case 'parcial':  return 'Parcial';
    case 'vencido':  return 'Vencido';
    default:         return 'Pendiente';
  }
}

function rsvpIcon(rsvp: Invitado['rsvp']) {
  switch (rsvp) {
    case 'Confirmado': return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    case 'Rechazado':  return <XCircle       className="w-4 h-4 text-red-400  shrink-0" />;
    default:          return <Activity      className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
export default function PortalClientePage() {
  const params   = useParams<{ id: string }>();
  const fiestaId = params.id;
  const { toast } = useToast();

  const [fiesta, setFiesta]           = useState<FiestaEnPlanificacion | null>(null);
  const [isAuthenticated, setIsAuth]  = useState(false);
  const [password, setPassword]       = useState('');
  const [authError, setAuthError]     = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pageError, setPageError]     = useState<string | null>(null);

  // Cambio obligatorio de clave la primera vez y recuperacion por correo.
  const [debeCambiarClave, setDebeCambiarClave] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [claveUsada, setClaveUsada]             = useState('');
  const [claveNueva, setClaveNueva]             = useState('');
  const [claveRepetida, setClaveRepetida]       = useState('');
  const [errorClave, setErrorClave]             = useState<string | null>(null);
  const [guardandoClave, setGuardandoClave]     = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [avisoRecuperacion, setAvisoRecuperacion]       = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(['resumen']);

  // debeLlevar state
  const [debeLlevarItems, setDebeLlevarItems] = useState<ClienteDebeLlevarItem[]>([]);
  const [isSavingLlevar, setIsSavingLlevar]   = useState(false);

  // seating edit state
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editingTable, setEditingTable]   = useState('');
  const [isSavingSeat, setIsSavingSeat]   = useState(false);

  const sessionKey = `${SESSION_KEY_PREFIX}${fiestaId}`;

  const loadFiesta = useCallback(async () => {
    if (!fiestaId) {
      setPageError('ID de evento no especificado.');
      setIsLoading(false);
      return;
    }
    try {
      const storedKey = sessionStorage.getItem(sessionKey);
      if (!storedKey) return;
      const sessionResult = await initializePortalSession(fiestaId, storedKey);
      if (!sessionResult.success) {
        sessionStorage.removeItem(sessionKey);
        return;
      }
      const data = await getFiestaForPortalSession(fiestaId);
      if (!data) throw new Error('No se pudo abrir la sesión del portal.');
      setFiesta(data);
      const rootItems = data.clienteDebeLlevar;
      setDebeLlevarItems(rootItems?.length ? rootItems : defaultClienteDebeLlevar);
      setIsAuth(true);
    } catch {
      setPageError('No se pudo cargar la información del evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, sessionKey]);

  useEffect(() => {
    loadFiesta();
  }, [loadFiesta]);

  const fechaEvento = fiesta?.configuracion?.fechaEvento ?? null;

  useEffect(() => {
    if (!fiestaId || !isAuthenticated) return;
    const today = new Date();
    const eventDate = fechaEvento ? new Date(fechaEvento) : null;
    const isToday = !!eventDate && eventDate.toDateString() === today.toDateString();
    const intervalMs = isToday ? 12000 : 20000;
    const pollInterval = setInterval(async () => {
      try {
        const data = await getFiestaForPortalSession(fiestaId);
        if (data) setFiesta(data);
      } catch { /* ignore */ }
    }, intervalMs);
    return () => clearInterval(pollInterval);
  }, [fiestaId, fechaEvento, isAuthenticated]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await initializePortalSession(fiestaId, password);
      if (!result.success) {
        setAuthError('Contraseña incorrecta. Pedísela a tu organizador.');
        return;
      }
      const data = await getFiestaForPortalSession(fiestaId);
      if (!data) throw new Error('No se pudo cargar el portal.');
      sessionStorage.setItem(sessionKey, password);
      setFiesta(data);
      setDebeLlevarItems(data.clienteDebeLlevar?.length ? data.clienteDebeLlevar : defaultClienteDebeLlevar);
      setClaveUsada(password);
      setDebeCambiarClave(evaluarClaveInicial(data, password));
      setIsAuth(true);
      setPassword('');
    } catch {
      setAuthError('No se pudo ingresar. Verificá tu conexión e intentá nuevamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * La clave que le damos al principio se arma con el nombre del cliente, asi
   * que la puede adivinar cualquiera que sepa quien contrato la fiesta. Mientras
   * siga usando esa, el portal no lo deja pasar sin elegir una propia.
   */
  const evaluarClaveInicial = (data: FiestaEnPlanificacion | null, claveIngresada: string) => {
    if (!data) return false;
    if (data.clientPortalSettings?.claveCambiadaPorCliente) return false;
    const inicial = construirClavePorDefecto(data);
    return Boolean(inicial) && claveIngresada.trim().toUpperCase() === inicial.toUpperCase();
  };

  const handleOlvideMiClave = async () => {
    setEnviandoRecuperacion(true);
    setAuthError(null);
    setAvisoRecuperacion(null);
    try {
      const res = await recuperarClavePortal(fiestaId);
      if (res.success) {
        setAvisoRecuperacion(`Te mandamos la clave a ${res.pista}. Revisá tu correo.`);
      } else {
        setAuthError(res.error || 'No pudimos enviarte la clave. Escribinos por WhatsApp.');
      }
    } catch {
      setAuthError('No pudimos enviarte la clave. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  const handleCambiarClave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorClave(null);

    if (claveNueva !== claveRepetida) {
      setErrorClave('Las dos claves no coinciden.');
      return;
    }

    setGuardandoClave(true);
    try {
      const res = await cambiarClavePortal(fiestaId, claveUsada, claveNueva);
      if (!res.success) {
        setErrorClave(res.error || 'No se pudo guardar la clave. Probá de nuevo.');
        return;
      }
      sessionStorage.setItem(sessionKey, claveNueva.trim());

      // Si dejo su correo, se guarda ahora que ya esta adentro del portal. Es el
      // unico momento por el que pasa seguro, y es lo que le va a permitir
      // recuperar la clave sola si se la olvida. Si falla no se le corta el paso:
      // la clave nueva ya quedo guardada, que es lo que vino a hacer.
      const correo = correoRecuperacion.trim();
      if (correo) {
        const guardado = await guardarCorreoDeRecuperacion(fiestaId, correo).catch(() => null);
        if (guardado && !guardado.success) {
          toast({
            title: 'Guardamos tu clave, pero no el correo',
            description: guardado.error || 'Podés cargarlo más tarde o pedirnos la clave por WhatsApp.',
          });
        }
      }

      setDebeCambiarClave(false);
      setClaveNueva('');
      setClaveRepetida('');
      setFiesta(prev => prev ? {
        ...prev,
        clientPortalSettings: { ...(prev.clientPortalSettings as any), claveCambiadaPorCliente: true },
      } : prev);
      toast({ title: '🔒 Listo', description: 'Tu clave quedó cambiada. Es la que vas a usar de ahora en más.' });
    } catch {
      setErrorClave('No se pudo guardar la clave. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setGuardandoClave(false);
    }
  };

  const handleSaveTable = async (invitado: Invitado) => {
    if (!fiesta) return;
    setIsSavingSeat(true);
    try {
      const updated = { ...invitado, tableNumber: editingTable.trim() || undefined };
      const res = await updateClientGuestTable(fiestaId, invitado.id, updated.tableNumber);
      if (res.success) {
        setFiesta(prev => prev ? {
          ...prev,
          invitados: (prev.invitados ?? []).map(inv => inv.id === invitado.id ? updated : inv),
        } : prev);
        toast({ title: '✅ Mesa asignada', description: `${invitado.nombre} → Mesa ${editingTable || '—'}` });
      } else {
        toast({ title: 'Error', description: 'No se pudo guardar la mesa.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de conexión', description: 'No se pudo guardar la mesa. Verificá tu conexión e intentá nuevamente.', variant: 'destructive' });
    } finally {
      setEditingId(null);
      setIsSavingSeat(false);
    }
  };

  const handleToggleLlevar = async (itemId: string) => {
    const updated = debeLlevarItems.map(item =>
      item.id === itemId
        ? { ...item, completado: !item.completado, estado: (!item.completado ? 'enviado' : 'pendiente') as ClienteDebeLlevarItem['estado'] }
        : item
    );
    setDebeLlevarItems(updated);
    setIsSavingLlevar(true);
    try {
      const result = await updateClientPackingList(fiestaId, updated);
      if (!result.success) throw new Error(result.error);
    } catch {
      toast({ title: 'Error al guardar', description: 'No se pudo guardar el estado. Verificá tu conexión e intentá nuevamente.', variant: 'destructive' });
    } finally {
      setIsSavingLlevar(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md text-center rounded-xl border-destructive/30 bg-destructive/10">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <CardTitle className="text-destructive font-bold">Acceso no disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{pageError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Login ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="ak-public-page flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-xl border-border bg-card shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="relative w-14 h-14 mx-auto opacity-80">
              <CompanyLogo size="md" className="mx-auto" />
            </div>
            <KeyRound className="w-10 h-10 mx-auto text-primary" />
            <CardTitle className="text-xl font-black text-foreground">Portal del Cliente</CardTitle>
            <CardDescription className="text-muted-foreground">Ingresá la contraseña que te dio tu organizador.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="portal-password">Contraseña</Label>
                <Input
                  id="portal-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  placeholder="••••••••"
                  className="rounded-lg"
                />
              </div>
              {authError && <p className="text-sm text-destructive text-center">{authError}</p>}
              {avisoRecuperacion && <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center font-semibold">{avisoRecuperacion}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full rounded-lg" disabled={isAuthenticating || !password.trim()}>
                {isAuthenticating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />} Ingresar
              </Button>
              {/* La salida para el cliente que se la olvido: la clave se le manda
                  al correo que tenemos registrado, no aparece en pantalla. */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleOlvideMiClave}
                  disabled={enviandoRecuperacion}
                  className="text-xs font-semibold text-muted-foreground underline underline-offset-4 disabled:opacity-60 hover:text-foreground"
                >
                  {enviandoRecuperacion ? 'Enviando…' : 'Olvidé mi clave (por correo)'}
                </button>
                {/* La segunda salida, para el que no usa correo: le escribe a AK
                    por WhatsApp. Es mas seguro que mandarsela a un correo que
                    escriba cualquiera en esta pantalla, porque del otro lado AK
                    sabe con quien esta hablando antes de darle nada. */}
                <a
                  href={`https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    'Hola AK, me olvidé la clave de mi portal y no tengo correo a mano. ¿Me ayudan a recuperarla?',
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-4"
                >
                  No uso correo: pedirla por WhatsApp
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // ── Cambio obligatorio de clave ──────────────────────────────
  // Entro con la clave que le dimos nosotros. No ve nada de su fiesta hasta
  // elegir una propia: esa clave la puede adivinar cualquiera que sepa quien
  // contrato el evento, y de aca para adentro estan sus pagos y sus invitados.
  if (debeCambiarClave) {
    return (
      <div className="ak-public-page flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-xl border-border bg-card shadow-xl">
          <CardHeader className="text-center space-y-3">
            <KeyRound className="w-10 h-10 mx-auto text-primary" />
            <CardTitle className="text-xl font-black text-foreground">Elegí tu clave</CardTitle>
            <CardDescription className="text-muted-foreground">
              Estás usando la clave que te dimos al principio. Como se arma con tu nombre,
              cualquiera podría adivinarla. Elegí una tuya para entrar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCambiarClave}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="clave-nueva">Nueva clave</Label>
                <Input
                  id="clave-nueva"
                  type="password"
                  value={claveNueva}
                  onChange={e => setClaveNueva(e.target.value)}
                  autoFocus
                  placeholder="elegí una que recuerdes"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clave-repetida">Repetir nueva clave</Label>
                <Input
                  id="clave-repetida"
                  type="password"
                  value={claveRepetida}
                  onChange={e => setClaveRepetida(e.target.value)}
                  placeholder="escribila otra vez"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="correo-recuperacion">Tu correo (opcional)</Label>
                <Input
                  id="correo-recuperacion"
                  type="email"
                  value={correoRecuperacion}
                  onChange={e => setCorreoRecuperacion(e.target.value)}
                  placeholder="para recuperar la clave si te la olvidás"
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Si no usás correo, dejalo vacío: nos escribís por WhatsApp y te la pasamos.
                </p>
              </div>
              {errorClave && <p className="text-sm text-destructive text-center">{errorClave}</p>}
              <p className="text-xs text-muted-foreground text-center">
                Anotala donde la tengas a mano.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800"
                disabled={guardandoClave || !claveNueva.trim() || !claveRepetida.trim()}
              >
                {guardandoClave ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                Guardar mi clave
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (!fiesta) return null;

  const config    = fiesta.configuracion;
  const invitados = fiesta.invitados ?? [];
  const plan      = fiesta.planDePagos;
  const portalSettings = fiesta.clientPortalSettings;
  const portalExp: ClientePortalExperience = fiesta.clientePortalExperience ?? {};

  // clientePortalExperience overrides
  const heroImageUrl   = portalExp.heroImageUrl   ?? config.protagonistaFotoUrl;
  const primaryColor   = portalExp.primaryColor   ?? config.primaryColor;
  const welcomeMsg     = portalExp.welcomeMessage;
  const organizerMsg   = portalExp.organizerMessage;
  const simplicityMode = portalExp.simplicityMode ?? false;

  // ── Render helpers (computed early so visibility logic can use them) ──
  const hasDecorationPreview = !!(fiesta.decoracion && (
    fiesta.decoracion.salonPreview3dUrl ||
    fiesta.decoracion.paletaColores ||
    (fiesta.decoracion.moodboardItems && fiesta.decoracion.moodboardItems.length > 0)
  ));

  // Module visibility helpers — default true when no settings configured (backward compatible)
  // In simplicityMode: only show essentials (financials, invitados, video-vida, llevar)
  const showFinancials = simplicityMode ? true : (portalSettings?.pagos?.visible ?? true);
  const showInvitados  = simplicityMode ? true : (portalSettings?.invitados?.visible ?? true);
  const showCatering   = simplicityMode ? false : (portalSettings?.menu?.visible ?? true);
  const showTimeline   = simplicityMode ? false : (portalSettings?.itinerario?.visible ?? true);
  const showDecoration = simplicityMode ? false : hasDecorationPreview;
  const showVideoVida  = true; // always show: prompts to upload if needed

  // ── Financials ───────────────────────────────────────────────
  const cuotas      = plan?.cuotas ?? [];
  const paymentSummary = getPaymentPlanSummary(cuotas);
  const totalCost   = paymentSummary.total;
  const totalPaid   = paymentSummary.paid;
  const balance     = paymentSummary.balance;

  // ── RSVP ────────────────────────────────────────────────────
  const confirmed = invitados.filter(i => i.rsvp === 'Confirmado');
  const declined  = invitados.filter(i => i.rsvp === 'Rechazado');
  const pending   = invitados.filter(i => i.rsvp !== 'Confirmado' && i.rsvp !== 'Rechazado');

  // ── Check-in stats ───────────────────────────────────────────
  const today = new Date();
  const eventDate = config.fechaEvento ? new Date(config.fechaEvento) : null;
  const isEventToday = eventDate
    ? eventDate.toDateString() === today.toDateString()
    : false;
  const isEventPast = eventDate ? eventDate < today && !isEventToday : false;
  const checkedIn   = invitados.filter(i => i.checkedIn);
  const recentArrivals = checkedIn
    .filter(i => i.checkInTimestamp)
    .sort((a, b) => b.checkInTimestamp!.localeCompare(a.checkInTimestamp!))
    .slice(0, 10);

  return (
    <div className="ak-public-page">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <CompanyLogo size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground truncate">{config.nombreEvento}</p>
            <p className="text-xs text-muted-foreground">{config.tipoCelebracion} · {formatDate(config.fechaEvento)}</p>
          </div>
          <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/10 text-primary">
            Portal VIP
          </Badge>
        </div>
      </header>

      {/* ── Hero / Protagonist Card ──────────────────────── */}
      {heroImageUrl && (
        <div
          className="relative w-full overflow-hidden"
          style={{ minHeight: 220, background: primaryColor ?? '#991b1b' }}
        >
          <div className="absolute inset-0 bg-slate-950/55" />
          <NextImage
            src={heroImageUrl}
            alt={config.protagonista1Nombre ?? 'Protagonista'}
            fill
            className="object-cover object-top opacity-80"
            priority
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 text-white">
            <p className="text-xs uppercase tracking-widest font-semibold text-white/80 mb-1">Tu evento está siendo organizado por</p>
            <p className="text-sm font-black text-white/90 mb-3">✨ AK Producciones</p>
            <h1 className="text-2xl sm:text-3xl font-black drop-shadow-lg">{config.nombreEvento}</h1>
            {config.protagonista1Nombre && (
              <p className="text-base font-semibold text-white/90 mt-1">{config.protagonista1Nombre}{config.protagonista2Nombre ? ` & ${config.protagonista2Nombre}` : ''}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/80">
              {config.fechaEvento && <span>📅 {formatDate(config.fechaEvento)}</span>}
              {config.nombreLugar && <span>📍 {config.nombreLugar}</span>}
              {config.invitadosEstimados > 0 && <span>👥 {config.invitadosEstimados} invitados</span>}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Mensaje de Bienvenida personalizado ──────── */}
        {welcomeMsg && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-center">
            <p className="text-sm font-semibold text-primary">{welcomeMsg}</p>
          </div>
        )}

        {/* ── Mensaje del Organizador ───────────────────── */}
        {organizerMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <span className="text-2xl shrink-0">💬</span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Mensaje de tu Organizador</p>
              <p className="text-sm text-foreground">{organizerMsg}</p>
            </div>
          </div>
        )}

        {isEventPast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
            className="flex flex-col items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-sm sm:flex-row"
          >
            <div className="flex gap-3.5 items-start">
              <span className="text-3xl shrink-0">✨</span>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">¡Evento Concluido!</p>
                <h3 className="text-base font-black text-foreground">Muro de Recuerdos & Descargas</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Ya podés acceder a todas las fotos y videos compartidos por tus invitados, así como a las dedicatorias y audios.
                </p>
              </div>
            </div>
            <Link href={`/portal-cliente/${fiestaId}/fotos-video`} className="w-full sm:w-auto shrink-0">
              <Button className="h-11 w-full rounded-lg px-5 font-bold sm:w-auto">
                Acceder a Recuerdos
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ── Progreso del Evento ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: DURACION.entrar, ease: SUAVE }}
        >
          <EventProgressBar fiesta={fiesta} />
        </motion.div>

        {/* ── Feature Navigation Cards (hidden in simplicityMode) ─── */}
        {!simplicityMode && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: DURACION.entrar, ease: SUAVE }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { label: 'Mensajes', emoji: '💬', href: `/portal-cliente/${fiestaId}/mensajes`, desc: 'Escribile al equipo' },
            { label: 'Menú', emoji: '🍽️', href: `/portal-cliente/${fiestaId}/menu`, desc: 'Confirmá tu selección' },
            { label: 'Música', emoji: '🎵', href: `/portal-cliente/${fiestaId}/musica`, desc: 'Tu lista de canciones' },
            { label: 'Muro Social', emoji: '📱', href: `/portal-cliente/${fiestaId}/muro-social`, desc: 'Red social del evento' },
            { label: 'Fotos & Video', emoji: '📸', href: `/portal-cliente/${fiestaId}/fotos-video`, desc: 'Archivos y entregables' },
            { label: 'Invitados', emoji: '👥', href: `/portal-cliente/${fiestaId}/confirmar-invitados`, desc: 'Confirmaciones' },
            { label: 'Preguntas Frecuentes', emoji: '❓', href: `/portal-cliente/${fiestaId}/faq`, desc: 'Dudas & Consultas' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="block group">
              <div className="space-y-1.5 rounded-xl border border-border bg-card p-4 text-center transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:-translate-y-1">
                <span className="text-3xl block transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
                <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
              </div>
            </Link>
          ))}
          </div>
        </motion.div>
        )}

        {/* ── Catálogo Digital contextual ─────────────── */}
        {(() => {
          const tipo = (config.tipoCelebracion || '').toLowerCase();
          const isBoda = tipo.includes('boda') || tipo.includes('casamiento');
          const isXV = tipo.includes('xv') || tipo.includes('quince');
          const catalogoPath = isBoda
            ? '/catalogo/bodas'
            : isXV
            ? '/catalogo/xv-anos'
            : '/catalogo/fiestas';
          const emoji = isBoda ? <BookHeart className="w-6 h-6 text-rose-500" /> : isXV ? '👑' : '🎉';
          const label = isBoda ? 'Ver Catálogo Completo de Bodas' : isXV ? 'Ver Catálogo Completo de XV Años' : 'Ver Catálogo Completo de Fiestas';
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: DURACION.entrar, ease: SUAVE }}
            >
              <Link href={catalogoPath} className="block">
                <div className="flex cursor-pointer items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-4 transition-colors hover:bg-primary/15">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-black text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">Conocé todos los servicios disponibles</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                </div>
              </Link>
            </motion.div>
          );
        })()}

        {/* ── Llegadas en Vivo / Resumen post-evento ─────────── */}
        {(isEventToday || isEventPast) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
          >
            <Card className={cn('rounded-xl border-border bg-card', isEventToday && 'border-emerald-500/30 bg-emerald-500/5')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black text-foreground">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {isEventToday ? 'Llegadas en Vivo' : 'Resumen de Asistencia'}
                {isEventToday && (
                  <span className="ml-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    EN VIVO
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Big counter */}
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-foreground">{checkedIn.length}</span>
                <span className="text-lg text-muted-foreground font-semibold mb-1">/ {confirmed.length} invitados llegaron</span>
              </div>
              {/* Progress bar */}
              {confirmed.length > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Presencia</span>
                    <span>{Math.round((checkedIn.length / confirmed.length) * 100)}% presentes</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (checkedIn.length / confirmed.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{confirmed.length}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">Confirmados</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{checkedIn.length}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">Presentes</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{confirmed.length - checkedIn.length}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">Pendientes</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  <p className="text-2xl font-black text-destructive">{declined.length}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">No vienen</p>
                </div>
              </div>
              {/* Recent arrivals list */}
              {recentArrivals.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                    {isEventToday ? 'Últimas llegadas' : 'Asistentes'}
                  </p>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {recentArrivals.map(inv => (
                      <div key={inv.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="flex-1 font-medium text-foreground truncate">{inv.nombre}</span>
                        {inv.tableNumber && (
                          <span className="text-xs text-muted-foreground shrink-0">Mesa {inv.tableNumber}</span>
                        )}
                        {inv.checkInTimestamp && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(inv.checkInTimestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Post-event: who didn't show */}
              {isEventPast && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Confirmados que no asistieron</p>
                  {confirmed.filter(i => !i.checkedIn).length === 0 ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">🎉 ¡Todos los confirmados asistieron!</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {confirmed.filter(i => !i.checkedIn).map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border text-sm">
                          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          <span className="flex-1 font-medium text-muted-foreground truncate">{inv.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* ── Pendientes del Cliente ─────────────────────── */}
        {(() => {
          const progress = calcFiestaProgress(fiesta);
          const pendientes: { texto: string; href?: string; emoji: string }[] = [];

          if (progress.areas.menu.status !== 'verde' && fiesta.modulosContratados?.catering) {
            pendientes.push({ texto: 'Confirmar menú', emoji: '🍽️', href: '#catering' });
          }
          if (progress.areas.musica.status === 'gris' || progress.areas.musica.status === 'amarillo') {
            pendientes.push({ texto: 'Cargar lista de canciones', emoji: '🎵', href: `/portal-cliente/${fiestaId}/musica` });
          }
          if (!fiesta.videoVida?.photosUploaded) {
            pendientes.push({ texto: 'Subir fotos para video de vida', emoji: '📷', href: `/portal-cliente/${fiestaId}/fotos-video` });
          }
          const pendientesRsvp = invitados.filter(i => i.rsvp !== 'Confirmado' && i.rsvp !== 'Rechazado');
          if (pendientesRsvp.length > 0) {
            pendientes.push({ texto: `Confirmar ${pendientesRsvp.length} invitado(s) pendientes`, emoji: '👥', href: '#invitados' });
          }
          const cuotasPendientes = (fiesta.planDePagos?.cuotas ?? []).filter(c => c.estado === 'pendiente' || c.estado === 'vencido');
          if (cuotasPendientes.length > 0) {
            pendientes.push({ texto: `Pago pendiente (${cuotasPendientes.length} cuota(s))`, emoji: '💳', href: '#pagos' });
          }

          if (pendientes.length === 0) return null;

          const handlePendienteClick = (href: string) => {
            if (href.startsWith('/')) {
              window.location.href = href;
            } else if (href.startsWith('#')) {
              const sectionId = href.slice(1);
              setOpenSections(prev => prev.includes(sectionId) ? prev : [...prev, sectionId]);
              setTimeout(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
              }, 200);
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: DURACION.entrar, ease: SUAVE }}
            >
              <Card className="rounded-xl border border-amber-500/20 bg-amber-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-black text-amber-700 dark:text-amber-400">
                    <Zap className="w-5 h-5 text-amber-500" /> Cosas pendientes
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Completá estos pasos para que tu evento esté 100% listo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendientes.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-sm cursor-pointer hover:bg-muted/40 transition-colors text-left"
                        onClick={() => item.href && handlePendienteClick(item.href)}
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <span className="flex-1 font-semibold text-foreground">{item.texto}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* ── Secciones plegables ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: DURACION.entrar, ease: SUAVE }}
        >
          <Tabs defaultValue="progreso" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1">
              <TabsTrigger value="progreso" className="py-2.5 text-sm font-bold">Progreso</TabsTrigger>
              <TabsTrigger value="invitados" className="py-2.5 text-sm font-bold">Invitados</TabsTrigger>
            <TabsTrigger value="pagos" className="py-2.5 text-sm font-bold">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="progreso" className="mt-0">
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">
          {/* ── Resumen del Evento ──────────────────────── */}
          <AccordionItem value="resumen" id="resumen" className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40">
              <span className="flex items-center gap-2 text-base font-black text-foreground">
                <CalendarDays className="w-5 h-5 text-primary" /> Resumen del Evento
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <InfoRow label="Evento"    value={config.nombreEvento} />
                  <InfoRow label="Tipo"      value={config.tipoCelebracion} />
                  <InfoRow label="Fecha"     value={formatDate(config.fechaEvento)} />
                  <InfoRow label="Horario"   value={config.horaInicio && config.horaFin ? `${config.horaInicio} – ${config.horaFin}` : config.horaInicio ?? '—'} />
                </div>
                <div className="space-y-3">
                  {config.nombreLugar && (
                    <InfoRow label="Salón" value={config.nombreLugar} icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />} />
                  )}
                  {config.direccionLugar && (
                    <InfoRow label="Dirección" value={config.direccionLugar} />
                  )}
                  <InfoRow label="Invitados" value={`${config.invitadosEstimados} personas`} icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />} />
                  {(config.protagonista1Nombre || config.protagonista2Nombre) && (
                    <InfoRow
                      label="Protagonistas"
                      value={[config.protagonista1Nombre, config.protagonista2Nombre].filter(Boolean).join(' & ')}
                    />
                  )}
                </div>
              </div>
              {config.notesAdicionales && (
                <div className="mt-4 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground border border-border">
                  <span className="font-semibold text-foreground">Notas: </span>
                  {config.notesAdicionales}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Lo que tenés que llevar ───────────── */}
          <AccordionItem value="llevar" id="llevar" className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40">
              <span className="flex items-center gap-2 text-base font-black text-foreground">
                <PackageCheck className="w-5 h-5 text-primary" /> Lo que tenés que llevar
                {debeLlevarItems.filter(i => i.completado).length > 0 && (
                  <Badge className="ml-1 bg-primary/10 text-primary border-0 text-xs">
                    {debeLlevarItems.filter(i => i.completado).length}/{debeLlevarItems.length}
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground pb-1">Marcá los elementos a medida que los tenés listos para enviarnos.</p>
                {debeLlevarItems.map(item => {
                  const estadoCfg = ESTADO_CONFIG[item.estado ?? (item.completado ? 'enviado' : 'pendiente')];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isSavingLlevar}
                      onClick={() => handleToggleLlevar(item.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                        ${item.completado
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${item.completado ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/40'}`}>
                        {item.completado && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${item.completado ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>
                          {item.texto}
                          {item.obligatorio && <span className="ml-1 text-destructive text-xs">*</span>}
                        </p>
                        {item.notas && <p className="text-xs text-muted-foreground mt-0.5">{item.notas}</p>}
                        {item.fechaLimite && <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">⏰ Antes del {formatDate(item.fechaLimite)}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg border shrink-0 ${estadoCfg.bg} ${estadoCfg.color}`}>
                        {estadoCfg.label}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">
                  * Obligatorio · Tu organizador puede actualizar esta lista con elementos específicos para tu evento.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Menú y Cronograma ────────────────────────── */}
          {(showCatering || showTimeline) && (
            <AccordionItem value="catering" id="catering" className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40">
                <span className="flex items-center gap-2 text-base font-black text-foreground">
                  <UtensilsCrossed className="w-5 h-5 text-amber-500" /> Menú e Itinerario
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="grid sm:grid-cols-2 gap-6">
                  {showCatering && (
                    <div id="menu" className="space-y-2 text-sm text-muted-foreground">
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" /> Catering
                      </p>
                      {fiesta.modulosContratados?.catering ? (
                        <>
                          <p className="flex gap-2 text-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Servicio de catering incluido</p>
                          <p className="text-xs text-muted-foreground mt-1">Tu menú personalizado fue coordinado con el equipo de AK Producciones.</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Catering no contratado en este paquete.</p>
                      )}
                    </div>
                  )}
                  {showTimeline && (
                    <div id="itinerario" className="space-y-2 text-sm">
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Cronograma
                      </p>
                      {(fiesta.programa ?? []).filter(item => item.visibleParaCliente !== false).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(fiesta.programa ?? []).filter(item => item.visibleParaCliente !== false).map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <span className="text-xs font-black text-primary shrink-0 pt-0.5">{item.hora}</span>
                              <div>
                                <span className="text-foreground">{item.titulo}</span>
                                {item.descripcionCliente && (
                                   <p className="text-xs text-muted-foreground mt-0.5">{item.descripcionCliente}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">El cronograma aún no está cargado.</p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ── Video de Vida ────────────────────────────── */}
          <AccordionItem
            data-testid="portal-video-vida"
            value="video-vida"
            id="video-vida"
            className="border border-border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40">
              <span className="flex items-center gap-2 text-base font-black text-foreground">
                <span className="text-xl">🎬</span> Video de Vida
                {fiesta.videoVida?.photosUploaded
                  ? <Badge className="ml-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-xs">Fotos enviadas ✓</Badge>
                  : <Badge className="ml-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 text-xs">Pendiente</Badge>
                }
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                El video de vida es uno de los momentos más especiales de tu fiesta.
                Necesitamos tus fotos y canciones favoritas para crearlo.
              </p>
              {fiesta.videoVida?.photosUploaded ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">¡Fotos recibidas! Tu organizador está trabajando en el video.</span>
                </div>
              ) : null}
              {!fiesta.videoVida?.photosUploaded && (
                <Link
                  href={`/portal-cliente/${fiestaId}/fotos-video`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-sm hover:bg-amber-500/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📷</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Subir fotos para video de vida</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                </Link>
              )}
              {!fiesta.musica?.sugerenciasInvitados && !fiesta.musica?.playlistFiesta && (
                <Link
                  href={`/portal-cliente/${fiestaId}/musica`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-sm hover:bg-blue-500/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎵</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Cargar lista de canciones</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                </Link>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Decoración ───────────────────────────────── */}
          {showDecoration && (
            <AccordionItem value="decoracion" id="decoracion" className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40">
                <span className="flex items-center gap-2 text-base font-black text-foreground">
                  <Palette className="w-5 h-5 text-pink-500" /> Diseño y Decoración
                  {fiesta.decoracion?.tema && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">Tema: {fiesta.decoracion.tema}</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-4">
                {fiesta.decoracion?.paletaColores && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Paleta de Colores</p>
                    <div className="flex gap-3 items-center">
                      {Object.entries(fiesta.decoracion.paletaColores).map(([key, color]) => (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-2xl border-2 border-background shadow-lg" style={{ backgroundColor: color as string }} />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundario' : 'Acento'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fiesta.decoracion?.salonPreview3dUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Vista del Salón</p>
                    <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm" style={{ aspectRatio: '16/9' }}>
                      <NextImage
                        src={fiesta.decoracion.salonPreview3dUrl}
                        alt="Vista 3D del salón"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                {fiesta.decoracion?.moodboardItems && fiesta.decoracion.moodboardItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Inspiración / Moodboard
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {fiesta.decoracion.moodboardItems.slice(0, 8).map(item => (
                        <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-border shadow-sm bg-muted/30">
                          <NextImage src={item.url} alt="inspiración" fill className="object-cover" />
                          {item.likedByClient && (
                            <div className="absolute top-1 right-1 bg-rose-500 text-white p-0.5 rounded-full shadow">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs uppercase tracking-wider mt-2">
                  <Link href={`/portal/${fiesta.id}/decoracion`}>
                    Ver propuesta completa: Así va a quedar tu fiesta
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
          </TabsContent>

          <TabsContent value="invitados" className="mt-0">
          {/* ── Invitados ────────────────────────────────── */}
          {showInvitados && (
            <motion.section
              id="invitados"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: DURACION.entrar, ease: SUAVE }}
              className="border border-border rounded-xl overflow-hidden bg-card shadow-sm"
            >
              <div className="px-5 py-4 border-b border-border">
                <span className="flex items-center gap-2 text-base font-black text-foreground">
                  <Users className="w-5 h-5 text-primary" /> Invitados
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {confirmed.length} confirmados · {pending.length} pendientes
                  </span>
                </span>
              </div>
              <div className="px-5 py-5 space-y-5">
                {/* RSVP Tracker */}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                    Estado RSVP — Confirmados: {confirmed.length} · No asisten: {declined.length} · Pendientes: {pending.length}
                  </p>
                  {invitados.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Todavía no hay invitados cargados.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {[...confirmed, ...declined, ...pending].map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl border border-border text-sm">
                          {rsvpIcon(inv.rsvp)}
                          <span className="flex-1 font-medium text-foreground truncate">{inv.nombre}</span>
                          {inv.categoria && (
                            <Badge variant="outline" className="text-xs shrink-0">{inv.categoria}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seating Plan */}
                {confirmed.length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" /> Plan de Mesas
                    </p>
                    <div className="space-y-2">
                      {confirmed.map(inv => (
                        <div key={inv.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border text-sm">
                          <span className="flex-1 font-medium text-foreground truncate">{inv.nombre}</span>
                          {editingId === inv.id ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                className="h-7 w-20 text-xs rounded-lg"
                                placeholder="N° mesa"
                                value={editingTable}
                                onChange={e => setEditingTable(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveTable(inv); if (e.key === 'Escape') setEditingId(null); }}
                              />
                              <Button size="sm" className="h-7 px-2 text-xs rounded-lg" onClick={() => handleSaveTable(inv)} disabled={isSavingSeat}>
                                {isSavingSeat ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-lg" onClick={() => setEditingId(null)}>✕</Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingId(inv.id); setEditingTable(inv.tableNumber ?? ''); }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold shrink-0"
                            >
                              {inv.tableNumber ? `Mesa ${inv.tableNumber}` : <span className="text-muted-foreground">Sin mesa</span>}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          </TabsContent>

          <TabsContent value="pagos" className="mt-0">
          {/* ── Estado Financiero / Pagos ────────────────── */}
          {showFinancials && (
            <motion.section
              id="pagos"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: DURACION.entrar, ease: SUAVE }}
              className="border border-border rounded-xl overflow-hidden bg-card shadow-sm"
            >
              <div className="px-5 py-4 border-b border-border">
                <span className="flex items-center gap-2 text-base font-black text-foreground">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Estado Financiero
                </span>
              </div>
              <div className="px-5 py-5 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <FinancialStat label="Total"    value={formatCurrency(totalCost)}  color="text-foreground" />
                  <FinancialStat label="Pagado"   value={formatCurrency(totalPaid)}  color="text-emerald-700 dark:text-emerald-400" />
                  <FinancialStat label="Saldo"    value={formatCurrency(balance)}    color={balance > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'} />
                </div>
                {totalCost > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso de pagos</span>
                      <span>{Math.round((totalPaid / totalCost) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / totalCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {cuotas.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Detalle de cuotas</p>
                    {cuotas.map(cuota => (
                      <div key={cuota.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl border border-border text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{cuota.descripcion}</p>
                          <p className="text-xs text-muted-foreground">Vence: {formatDate(cuota.fechaVencimiento)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-foreground">{formatCurrency(cuota.monto)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cuotaStatusColor(cuota.estado)}`}>
                            {cuotaStatusLabel(cuota.estado)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay plan de pagos cargado aún.</p>
                )}
              </div>
            </motion.section>
          )}

          </TabsContent>
        </Tabs>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-xs text-muted-foreground border-t border-border">
        <p>AK Producciones Eventos · Salto, Uruguay · 098 355 530</p>
      </footer>

      {/* ── Floating "Necesito ayuda" button ───────────── */}
      {(() => {
        const waNumber = '59898355530';
        const waText = encodeURIComponent(`Hola, necesito ayuda con mi evento "${config.nombreEvento}".`);
        return (
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="necesito-ayuda-btn"
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-2xl text-sm transition-all active:scale-95"
            aria-label="Contactar al organizador por WhatsApp"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            Necesito ayuda
          </a>
        );
      })()}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Small helper components
// ──────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      {icon && <span className="mt-0.5">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

function FinancialStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-3 bg-muted/30 rounded-xl border border-border">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}
