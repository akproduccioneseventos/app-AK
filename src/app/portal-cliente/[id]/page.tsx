'use client';

import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { CompanyLogo } from '@/components/company-logo';
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
import { getFiestaById, updateClienteDebeLlevar } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, Invitado, CuotaPlanPago, ClienteDebeLlevarItem } from '@/types/fiesta';
import NextImage from 'next/image';
import { updateInvitado } from '@/app/actions/fiesta/invitados.actions';
import { useToast } from '@/hooks/use-toast';
import { EventProgressBar } from '@/components/portal/EventProgressBar';
import { calcFiestaProgress } from '@/lib/fiesta-progress';
import { defaultClienteDebeLlevar } from '@/lib/fiesta-defaults';

const SESSION_KEY_PREFIX = 'portal_auth_';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  enviado:   { label: 'Enviado',   color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200'   },
  revisado:  { label: 'En revisión', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  listo:     { label: 'Listo ✓',   color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' });
}

function cuotaStatusColor(estado: CuotaPlanPago['estado']) {
  switch (estado) {
    case 'pagado': return 'bg-green-100 text-green-700 border-green-200';
    case 'parcial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'vencido': return 'bg-red-100 text-red-700 border-red-200';
    default:        return 'bg-slate-100 text-slate-600 border-slate-200';
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
  const [pageError, setPageError]     = useState<string | null>(null);
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
      const data = await getFiestaById(fiestaId);
      if (!data || !data.clientPortalSettings?.enabled) {
        setPageError('El portal de este evento no está habilitado o el evento no existe.');
      } else {
        setFiesta(data);
        setDebeLlevarItems(data.clienteDebeLlevar && data.clienteDebeLlevar.length > 0
          ? data.clienteDebeLlevar
          : defaultClienteDebeLlevar);
        const storedKey = sessionStorage.getItem(sessionKey);
        if (storedKey === data.clientPortalSettings.accessKey) {
          setIsAuth(true);
        }
      }
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
        const data = await getFiestaById(fiestaId);
        if (data) setFiesta(data);
      } catch { /* ignore */ }
    }, intervalMs);
    return () => clearInterval(pollInterval);
  }, [fiestaId, fechaEvento, isAuthenticated]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === fiesta?.clientPortalSettings?.accessKey) {
      sessionStorage.setItem(sessionKey, password);
      setIsAuth(true);
      setAuthError(null);
    } else {
      setAuthError('Contraseña incorrecta. Pedísela a tu organizador.');
    }
  };

  const handleSaveTable = async (invitado: Invitado) => {
    if (!fiesta) return;
    setIsSavingSeat(true);
    const updated = { ...invitado, tableNumber: editingTable.trim() || undefined };
    const res = await updateInvitado(fiestaId, updated);
    if (res.success) {
      setFiesta(prev => prev ? {
        ...prev,
        invitados: (prev.invitados ?? []).map(inv => inv.id === invitado.id ? updated : inv),
      } : prev);
      toast({ title: '✅ Mesa asignada', description: `${invitado.nombre} → Mesa ${editingTable || '—'}` });
    } else {
      toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
    }
    setEditingId(null);
    setIsSavingSeat(false);
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
      await updateClienteDebeLlevar(fiestaId, updated);
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
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md text-center border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <CardTitle className="text-red-700">Acceso no disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{pageError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Login ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white p-4">
        <Card className="max-w-sm w-full shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="relative w-14 h-14 mx-auto opacity-80">
              <CompanyLogo size="md" className="mx-auto" />
            </div>
            <KeyRound className="w-10 h-10 mx-auto text-purple-600" />
            <CardTitle className="text-xl font-black">Portal del Cliente</CardTitle>
            <CardDescription>Ingresá la contraseña que te dio tu organizador.</CardDescription>
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
                />
              </div>
              {authError && <p className="text-sm text-red-600 text-center">{authError}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800">
                <LogIn className="w-4 h-4 mr-2" /> Ingresar
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

  // Module visibility helpers — default true when no settings configured (backward compatible)
  const showFinancials = portalSettings?.pagos?.visible ?? true;
  const showInvitados  = portalSettings?.invitados?.visible ?? true;
  const showCatering   = portalSettings?.menu?.visible ?? true;
  const showTimeline   = portalSettings?.itinerario?.visible ?? true;

  // ── Financials ───────────────────────────────────────────────
  const cuotas      = plan?.cuotas ?? [];
  const totalCost   = cuotas.reduce((acc, c) => acc + c.monto, 0);
  const totalPaid   = cuotas.reduce((acc, c) => {
    if (c.estado === 'pagado')  return acc + c.monto;
    if (c.estado === 'parcial') return acc + (c.montoPagado ?? 0);
    return acc;
  }, 0);
  const balance     = totalCost - totalPaid;

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

  // ── Render ───────────────────────────────────────────────────
  const hasDecorationPreview = !!(fiesta.decoracion && (
    fiesta.decoracion.salonPreview3dUrl ||
    fiesta.decoracion.paletaColores ||
    (fiesta.decoracion.moodboardItems && fiesta.decoracion.moodboardItems.length > 0)
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <CompanyLogo size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{config.nombreEvento}</p>
            <p className="text-xs text-slate-500">{config.tipoCelebracion} · {formatDate(config.fechaEvento)}</p>
          </div>
          <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 shrink-0">
            Portal VIP
          </Badge>
        </div>
      </header>

      {/* ── Hero / Protagonist Card ──────────────────────── */}
      {config.protagonistaFotoUrl && (
        <div
          className="relative w-full overflow-hidden"
          style={{ minHeight: 220, background: config.primaryColor ? `${config.primaryColor}22` : 'linear-gradient(135deg,#6d28d9 0%,#db2777 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          <NextImage
            src={config.protagonistaFotoUrl}
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

        {/* ── Progreso del Evento ──────────────────────── */}
        <EventProgressBar fiesta={fiesta} />

        {/* ── Feature Navigation Cards ─────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Menú', emoji: '🍽️', href: `/portal-cliente/${fiestaId}/menu`, desc: 'Confirmá tu selección' },
            { label: 'Música', emoji: '🎵', href: `/portal-cliente/${fiestaId}/musica`, desc: 'Tu lista de canciones' },
            { label: 'Fotos & Video', emoji: '📸', href: `/portal-cliente/${fiestaId}/fotos-video`, desc: 'Archivos y entregables' },
            { label: 'Invitados', emoji: '👥', href: `/portal-cliente/${fiestaId}/confirmar-invitados`, desc: 'Estado de confirmaciones' },
          ].map((item, i) => (
            <a key={i} href={item.href} className="block">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center hover:shadow-md hover:border-purple-200 transition-all cursor-pointer space-y-1">
                <span className="text-3xl block">{item.emoji}</span>
                <p className="font-black text-sm text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* ── Catálogo Canva contextual ─────────────── */}
        {(() => {
          const tipo = (config.tipoCelebracion || '').toLowerCase();
          const isBoda = tipo.includes('boda') || tipo.includes('casamiento');
          const isXV = tipo.includes('xv') || tipo.includes('quince');
          const canvaUrl = isBoda
            ? 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas'
            : isXV
            ? 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web'
            : 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web';
          const emoji = isBoda ? <BookHeart className="w-6 h-6 text-rose-500" /> : isXV ? '👑' : '🎉';
          const label = isBoda ? 'Ver Catálogo Completo de Bodas' : isXV ? 'Ver Catálogo Completo de XV Años' : 'Ver Catálogo Completo de Fiestas';
          return (
            <a href={canvaUrl} target="_blank" rel="noopener noreferrer" className="block">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-black text-sm text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">Conocé todos los servicios disponibles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary shrink-0" />
              </div>
            </a>
          );
        })()}

        {/* ── Llegadas en Vivo / Resumen post-evento ─────────── */}
        {(isEventToday || isEventPast) && (
          <Card className={isEventToday ? 'border-green-200 bg-green-50/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <Activity className="w-5 h-5 text-green-600" />
                {isEventToday ? 'Llegadas en Vivo' : 'Resumen de Asistencia'}
                {isEventToday && (
                  <span className="ml-2 flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    EN VIVO
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Big counter */}
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-slate-900">{checkedIn.length}</span>
                <span className="text-lg text-slate-400 font-semibold mb-1">/ {confirmed.length} invitados llegaron</span>
              </div>
              {/* Progress bar */}
              {confirmed.length > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Presencia</span>
                    <span>{Math.round((checkedIn.length / confirmed.length) * 100)}% presentes</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, (checkedIn.length / confirmed.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-black text-blue-700">{confirmed.length}</p>
                  <p className="text-xs text-blue-500 font-semibold mt-0.5">Confirmados</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-black text-green-700">{checkedIn.length}</p>
                  <p className="text-xs text-green-500 font-semibold mt-0.5">Presentes</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-black text-amber-700">{confirmed.length - checkedIn.length}</p>
                  <p className="text-xs text-amber-500 font-semibold mt-0.5">Pendientes</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-black text-red-700">{declined.length}</p>
                  <p className="text-xs text-red-500 font-semibold mt-0.5">No vienen</p>
                </div>
              </div>
              {/* Recent arrivals list */}
              {recentArrivals.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    {isEventToday ? 'Últimas llegadas' : 'Asistentes'}
                  </p>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {recentArrivals.map(inv => (
                      <div key={inv.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        <span className="flex-1 font-medium text-slate-800 truncate">{inv.nombre}</span>
                        {inv.tableNumber && (
                          <span className="text-xs text-slate-400 shrink-0">Mesa {inv.tableNumber}</span>
                        )}
                        {inv.checkInTimestamp && (
                          <span className="text-xs text-slate-400 shrink-0">
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
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Confirmados que no asistieron</p>
                  {confirmed.filter(i => !i.checkedIn).length === 0 ? (
                    <p className="text-sm text-green-600 font-semibold">🎉 ¡Todos los confirmados asistieron!</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {confirmed.filter(i => !i.checkedIn).map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="flex-1 font-medium text-slate-600 truncate">{inv.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
            <Card className="border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-black text-amber-800">
                  <Zap className="w-5 h-5 text-amber-500" /> Cosas pendientes
                </CardTitle>
                <CardDescription className="text-amber-600 text-xs">
                  Completá estos pasos para que tu evento esté 100% listo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendientes.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-100 text-sm cursor-pointer hover:bg-white transition-colors text-left"
                      onClick={() => item.href && handlePendienteClick(item.href)}
                    >
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <span className="flex-1 font-semibold text-slate-700">{item.texto}</span>
                      <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ── Secciones plegables ──────────────────────── */}
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">

          {/* ── Resumen del Evento ──────────────────────── */}
          <AccordionItem value="resumen" id="resumen" className="border rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
              <span className="flex items-center gap-2 text-base font-black">
                <CalendarDays className="w-5 h-5 text-purple-600" /> Resumen del Evento
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
                    <InfoRow label="Salón" value={config.nombreLugar} icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />} />
                  )}
                  {config.direccionLugar && (
                    <InfoRow label="Dirección" value={config.direccionLugar} />
                  )}
                  <InfoRow label="Invitados" value={`${config.invitadosEstimados} personas`} icon={<Users className="w-3.5 h-3.5 text-slate-400" />} />
                  {(config.protagonista1Nombre || config.protagonista2Nombre) && (
                    <InfoRow
                      label="Protagonistas"
                      value={[config.protagonista1Nombre, config.protagonista2Nombre].filter(Boolean).join(' & ')}
                    />
                  )}
                </div>
              </div>
              {config.notesAdicionales && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                  <span className="font-semibold text-slate-700">Notas: </span>
                  {config.notesAdicionales}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Lo que tenés que llevar ───────────── */}
          <AccordionItem value="llevar" id="llevar" className="border-2 border-teal-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-teal-50/30">
              <span className="flex items-center gap-2 text-base font-black">
                <PackageCheck className="w-5 h-5 text-teal-600" /> Lo que tenés que llevar
                {debeLlevarItems.filter(i => i.completado).length > 0 && (
                  <Badge className="ml-1 bg-teal-100 text-teal-700 border-0 text-xs">
                    {debeLlevarItems.filter(i => i.completado).length}/{debeLlevarItems.length}
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500 pb-1">Marcá los elementos a medida que los tenés listos para enviarnos.</p>
                {debeLlevarItems.map(item => {
                  const estadoCfg = ESTADO_CONFIG[item.estado ?? (item.completado ? 'enviado' : 'pendiente')];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isSavingLlevar}
                      onClick={() => handleToggleLlevar(item.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                        ${item.completado
                          ? 'border-teal-200 bg-teal-50'
                          : 'border-slate-100 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/40'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${item.completado ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                        {item.completado && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${item.completado ? 'text-teal-800 line-through opacity-70' : 'text-slate-800'}`}>
                          {item.texto}
                          {item.obligatorio && <span className="ml-1 text-red-500 text-xs">*</span>}
                        </p>
                        {item.notas && <p className="text-xs text-slate-500 mt-0.5">{item.notas}</p>}
                        {item.fechaLimite && <p className="text-xs text-amber-600 mt-0.5">⏰ Antes del {formatDate(item.fechaLimite)}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg border shrink-0 ${estadoCfg.bg} ${estadoCfg.color}`}>
                        {estadoCfg.label}
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-slate-400 pt-1">
                  * Obligatorio · Tu organizador puede actualizar esta lista con elementos específicos para tu evento.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Estado Financiero / Pagos ────────────────── */}
          {showFinancials && (
            <AccordionItem value="pagos" id="pagos" className="border rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
                <span className="flex items-center gap-2 text-base font-black">
                  <DollarSign className="w-5 h-5 text-green-600" /> Estado Financiero
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <FinancialStat label="Total"    value={formatCurrency(totalCost)}  color="text-slate-900" />
                  <FinancialStat label="Pagado"   value={formatCurrency(totalPaid)}  color="text-green-700" />
                  <FinancialStat label="Saldo"    value={formatCurrency(balance)}    color={balance > 0 ? 'text-red-600' : 'text-green-700'} />
                </div>
                {totalCost > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progreso de pagos</span>
                      <span>{Math.round((totalPaid / totalCost) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / totalCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {cuotas.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Detalle de cuotas</p>
                    {cuotas.map(cuota => (
                      <div key={cuota.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{cuota.descripcion}</p>
                          <p className="text-xs text-slate-500">Vence: {formatDate(cuota.fechaVencimiento)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-slate-900">{formatCurrency(cuota.monto)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cuotaStatusColor(cuota.estado)}`}>
                            {cuotaStatusLabel(cuota.estado)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay plan de pagos cargado aún.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ── Invitados ────────────────────────────────── */}
          {showInvitados && (
            <AccordionItem value="invitados" id="invitados" className="border rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
                <span className="flex items-center gap-2 text-base font-black">
                  <Users className="w-5 h-5 text-blue-600" /> Invitados
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    {confirmed.length} confirmados · {pending.length} pendientes
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-5">
                {/* RSVP Tracker */}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Estado RSVP — Confirmados: {confirmed.length} · No asisten: {declined.length} · Pendientes: {pending.length}
                  </p>
                  {invitados.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Todavía no hay invitados cargados.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {[...confirmed, ...declined, ...pending].map(inv => (
                        <div key={inv.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                          {rsvpIcon(inv.rsvp)}
                          <span className="flex-1 font-medium text-slate-800 truncate">{inv.nombre}</span>
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
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" /> Plan de Mesas
                    </p>
                    <div className="space-y-2">
                      {confirmed.map(inv => (
                        <div key={inv.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                          <span className="flex-1 font-medium text-slate-800 truncate">{inv.nombre}</span>
                          {editingId === inv.id ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                className="h-7 w-20 text-xs"
                                placeholder="N° mesa"
                                value={editingTable}
                                onChange={e => setEditingTable(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveTable(inv); if (e.key === 'Escape') setEditingId(null); }}
                              />
                              <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveTable(inv)} disabled={isSavingSeat}>
                                {isSavingSeat ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>✕</Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingId(inv.id); setEditingTable(inv.tableNumber ?? ''); }}
                              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold shrink-0"
                            >
                              {inv.tableNumber ? `Mesa ${inv.tableNumber}` : <span className="text-slate-400">Sin mesa</span>}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ── Menú y Cronograma ────────────────────────── */}
          {(showCatering || showTimeline) && (
            <AccordionItem value="catering" id="catering" className="border rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
                <span className="flex items-center gap-2 text-base font-black">
                  <UtensilsCrossed className="w-5 h-5 text-amber-600" /> Menú e Itinerario
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="grid sm:grid-cols-2 gap-6">
                  {showCatering && (
                    <div id="menu" className="space-y-2 text-sm text-slate-600">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" /> Catering
                      </p>
                      {fiesta.modulosContratados?.catering ? (
                        <>
                          <p className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Servicio de catering incluido</p>
                          <p className="text-xs text-slate-400 mt-1">Tu menú personalizado fue coordinado con el equipo de AK Producciones.</p>
                        </>
                      ) : (
                        <p className="text-slate-400">Catering no contratado en este paquete.</p>
                      )}
                    </div>
                  )}
                  {showTimeline && (
                    <div id="itinerario" className="space-y-2 text-sm">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" /> Cronograma
                      </p>
                      {(fiesta.programa ?? []).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(fiesta.programa ?? []).map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <span className="text-xs font-black text-purple-600 shrink-0 pt-0.5">{item.hora}</span>
                              <span className="text-slate-700">{item.titulo}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">El cronograma aún no está cargado.</p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ── Decoración ───────────────────────────────── */}
          {hasDecorationPreview && (
            <AccordionItem value="decoracion" id="decoracion" className="border rounded-2xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
                <span className="flex items-center gap-2 text-base font-black">
                  <Palette className="w-5 h-5 text-pink-500" /> Diseño y Decoración
                  {fiesta.decoracion?.tema && (
                    <span className="ml-1 text-xs font-normal text-slate-500">Tema: {fiesta.decoracion.tema}</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-4">
                {fiesta.decoracion?.paletaColores && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Paleta de Colores</p>
                    <div className="flex gap-3 items-center">
                      {Object.entries(fiesta.decoracion.paletaColores).map(([key, color]) => (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-2xl border-2 border-white shadow-lg" style={{ backgroundColor: color as string }} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundario' : 'Acento'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fiesta.decoracion?.salonPreview3dUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Vista del Salón</p>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm" style={{ aspectRatio: '16/9' }}>
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
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Inspiración / Moodboard
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {fiesta.decoracion.moodboardItems.slice(0, 8).map(item => (
                        <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
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
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-xs text-slate-400 border-t border-slate-100">
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
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-black shadow-2xl text-sm transition-all active:scale-95"
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
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function FinancialStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}
