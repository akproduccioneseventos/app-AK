'use client';

import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
  HelpCircle,
  UtensilsCrossed,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, Invitado, CuotaPlanPago } from '@/types/fiesta';
import { updateInvitado } from '@/app/actions/fiesta/invitados.actions';
import { useToast } from '@/hooks/use-toast';

const SESSION_KEY_PREFIX = 'portal_auth_';

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
    case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    case 'declined':  return <XCircle       className="w-4 h-4 text-red-400  shrink-0" />;
    default:          return <HelpCircle    className="w-4 h-4 text-slate-400 shrink-0" />;
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
    if (!fiestaId || !fechaEvento) return;
    const today = new Date();
    const eventDate = new Date(fechaEvento);
    const isToday = eventDate.toDateString() === today.toDateString();
    if (!isToday) return;
    // Poll every 12 seconds on event day
    const pollInterval = setInterval(async () => {
      try {
        const data = await getFiestaById(fiestaId);
        if (data) setFiesta(data);
      } catch { /* ignore */ }
    }, 12000);
    return () => clearInterval(pollInterval);
  }, [fiestaId, fechaEvento]);

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
              <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="56px" />
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
  const confirmed = invitados.filter(i => i.rsvp === 'confirmed');
  const declined  = invitados.filter(i => i.rsvp === 'declined');
  const pending   = invitados.filter(i => i.rsvp !== 'confirmed' && i.rsvp !== 'declined');

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo_ak_producciones.png" alt="AK Producciones" fill className="object-contain" sizes="32px" />
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Event Summary ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <CalendarDays className="w-5 h-5 text-purple-600" /> Resumen del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

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

        {/* ── Financials ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <DollarSign className="w-5 h-5 text-green-600" /> Estado Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <FinancialStat label="Total"    value={formatCurrency(totalCost)}  color="text-slate-900" />
              <FinancialStat label="Pagado"   value={formatCurrency(totalPaid)}  color="text-green-700" />
              <FinancialStat label="Saldo"    value={formatCurrency(balance)}    color={balance > 0 ? 'text-red-600' : 'text-green-700'} />
            </div>
            {/* Progress bar */}
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
            {/* Cuotas table */}
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
          </CardContent>
        </Card>

        {/* ── RSVP Tracker ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <Users className="w-5 h-5 text-blue-600" /> Lista de Invitados (RSVP)
            </CardTitle>
            <CardDescription>
              Confirmados: <strong>{confirmed.length}</strong> · No asisten: <strong>{declined.length}</strong> · Pendientes: <strong>{pending.length}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* ── Seating Plan ─────────────────────────────────── */}
        {confirmed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <MapPin className="w-5 h-5 text-orange-500" /> Plan de Mesas
              </CardTitle>
              <CardDescription>Asigná los invitados confirmados a sus mesas.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* ── Catering / Timeline ──────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" /> Catering
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              {fiesta.modulosContratados?.catering ? (
                <>
                  <p className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Servicio de catering incluido</p>
                  <p className="text-xs text-slate-400 mt-1">Tu menú personalizado fue coordinado con el equipo de AK Producciones.</p>
                </>
              ) : (
                <p className="text-slate-400">Catering no contratado en este paquete.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <Clock className="w-5 h-5 text-purple-600" /> Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
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
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        <p>AK Producciones Eventos · Salto, Uruguay · 098 355 530</p>
      </footer>
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
