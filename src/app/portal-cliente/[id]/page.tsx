
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2,
  AlertTriangle,
  KeyRound,
  LogIn,
  DollarSign,
  Users,
  MapPin,
  LayoutDashboard,
  Upload,
  CheckCircle2,
  Clock,
  Utensils,
  Calendar,
  CreditCard,
  Banknote,
  AlertCircle,
  Save,
  Music,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Invitado, PlanDePagos } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPlanDePagos } from '@/app/actions/payment-plans';
import { updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { notifyClientPayment } from '@/app/actions/fiesta/portal.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { Presupuesto } from '@/types/presupuesto';

const SESSION_KEY_PREFIX = 'portal_auth_';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return '$0';
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
    const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    return isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
};

const getRsvpBadge = (rsvp: string) => {
  switch (rsvp) {
    case 'Confirmado':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border font-semibold">✅ Confirmado</Badge>;
    case 'Rechazado':
      return <Badge className="bg-red-100 text-red-700 border-red-200 border font-semibold">❌ Rechazado</Badge>;
    case 'Tal vez':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border font-semibold">🤔 Tal vez</Badge>;
    default:
      return <Badge variant="outline" className="text-slate-500">⏳ Pendiente</Badge>;
  }
};

function VipPortalContent() {
  const params = useParams();
  const fiestaId = params.id as string;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [planPagos, setPlanPagos] = useState<PlanDePagos | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Seating state
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isSavingTable, setIsSavingTable] = useState<string | null>(null);

  // Informar Pago modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transferencia Bancaria');
  const [payRef, setPayRef] = useState('');
  const [payFile, setPayFile] = useState<string | null>(null);
  const [isSendingPay, setIsSendingPay] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setLoadError('ID de evento no especificado.');
      setIsLoading(false);
      return;
    }
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData || !fiestaData.clientPortalSettings?.enabled) {
        setLoadError('El portal para este evento no está disponible.');
        setIsLoading(false);
        return;
      }
      setFiesta(fiestaData);
      setInvitados(fiestaData.invitados ?? []);

      const sessionKey = `${SESSION_KEY_PREFIX}${fiestaId}`;
      const stored = sessionStorage.getItem(sessionKey);
      if (stored === fiestaData.clientPortalSettings.accessKey) {
        setIsAuthenticated(true);
      }

      const [presupData, planData] = await Promise.all([
        fiestaData.presupuestoId ? getPresupuestoById(fiestaData.presupuestoId) : Promise.resolve(null),
        getPlanDePagos(fiestaId),
      ]);
      setPresupuesto(presupData);
      setPlanPagos(planData);
    } catch {
      setLoadError('No se pudo cargar la información del evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === fiesta?.clientPortalSettings?.accessKey) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${SESSION_KEY_PREFIX}${fiestaId}`, password);
      }
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Contraseña incorrecta. Por favor, consultá con tu organizador.');
    }
  };

  const handleAssignTable = async (guestId: string, tableNumber: string) => {
    if (!fiestaId) return;
    const prev = invitados;
    const updated = invitados.map(g =>
      g.id === guestId ? { ...g, tableNumber: tableNumber === 'sin-mesa' ? undefined : tableNumber } : g
    );
    setInvitados(updated);
    setIsSavingTable(guestId);
    try {
      const guest = updated.find(g => g.id === guestId);
      if (!guest) return;
      const result = await updateInvitadoFiestaActual(fiestaId, guest);
      if (!result.success) throw new Error(result.error);
    } catch {
      setInvitados(prev);
      toast({ title: 'Error al guardar', description: 'No se pudo asignar la mesa.', variant: 'destructive' });
    } finally {
      setIsSavingTable(null);
    }
  };

  const handleInformarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiestaId || !payAmount) return;
    setIsSendingPay(true);
    try {
      await notifyClientPayment(fiestaId, {
        monto: Number(payAmount),
        metodoPago: payMethod,
        referencia: payRef,
        comprobante: payFile || undefined,
      });
      toast({
        title: '¡Pago informado!',
        description: 'Tu organizador recibió la notificación. Verificará el comprobante a la brevedad.',
      });
      setIsPayModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayFile(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la notificación. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setIsSendingPay(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPayFile(file.name);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md text-center bg-destructive/10">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <CardTitle className="text-destructive">Portal No Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{loadError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !fiesta) {
    if (fiesta && !fiesta.clientPortalSettings?.accessKey) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <KeyRound className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <CardTitle className="font-headline text-2xl">Portal VIP del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                El organizador aún no ha configurado el acceso. Por favor, contactá a tu organizador.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <Card className="max-w-sm w-full shadow-2xl border-none">
          <CardHeader className="text-center pb-4">
            <div className="mb-4 opacity-60 flex justify-center">
              <Image
                src="/logo_ak_producciones.png"
                alt="AK Producciones"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <KeyRound className="w-12 h-12 mx-auto text-primary mb-2" />
            <CardTitle className="font-headline text-2xl">Portal VIP del Cliente</CardTitle>
            <CardDescription>
              {fiesta?.configuracion.nombreEvento && (
                <span className="font-semibold text-foreground block">{fiesta.configuracion.nombreEvento}</span>
              )}
              Ingresá la contraseña que te dio tu organizador.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vip-password">Contraseña de Acceso</Label>
                <Input
                  id="vip-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña..."
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              {authError && (
                <p className="text-sm text-center text-destructive flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {authError}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold">
                <LogIn className="w-5 h-5 mr-2" /> Ingresar a mi Portal
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // ── Compute financial data ─────────────────────────────────────────────
  const config = fiesta.configuracion;
  let totalCosto = 0;
  let totalPagado = 0;

  if (planPagos && planPagos.cuotas.length > 0) {
    totalCosto = planPagos.cuotas.reduce((s, c) => s + c.monto, 0);
    totalPagado = planPagos.cuotas.reduce((s, c) => {
      if (c.estado === 'pagado') return s + c.monto;
      if (c.estado === 'parcial') return s + (c.montoPagado ?? 0);
      return s;
    }, 0);
  } else if (presupuesto) {
    totalCosto = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0;
    totalPagado = (presupuesto.pagosCliente ?? []).reduce((s, p) => s + p.monto, 0);
  } else {
    totalCosto = config.presupuestoEstimado ?? 0;
  }
  const saldoPendiente = Math.max(0, totalCosto - totalPagado);
  const porcentajePagado = totalCosto > 0 ? Math.min(100, Math.round((totalPagado / totalCosto) * 100)) : 0;

  // ── Tables ─────────────────────────────────────────────────────────────
  const tableNames = (() => {
    const salonTables = (fiesta.decoracion?.salonElements ?? [])
      .filter(el => el.category?.toLowerCase().includes('mesa') || el.name?.toLowerCase().includes('mesa'))
      .map(el => el.name);
    if (salonTables.length > 0) return [...new Set(salonTables)].sort();
    // Default 10 tables
    return Array.from({ length: 10 }, (_, i) => `Mesa ${i + 1}`);
  })();

  const confirmedInvitados = invitados.filter(g => g.rsvp === 'Confirmado');
  const rsvpStats = {
    confirmados: invitados.filter(g => g.rsvp === 'Confirmado').length,
    rechazados: invitados.filter(g => g.rsvp === 'Rechazado').length,
    pendientes: invitados.filter(g => g.rsvp === 'Pendiente').length,
    talvez: invitados.filter(g => g.rsvp === 'Tal vez').length,
  };

  // ── Song requests ──────────────────────────────────────────────────────
  const songRequests = invitados.flatMap(g =>
    (g.cancionesDJ ?? []).map(song => ({ guest: g.nombre, song }))
  );

  // ── Itinerary ──────────────────────────────────────────────────────────
  const programa = fiesta.programa ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="opacity-60">
              <Image
                src="/logo_ak_producciones.png"
                alt="AK Producciones"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-tight">{config.nombreEvento}</h1>
              <p className="text-xs text-muted-foreground">
                {config.tipoCelebracion} · {formatDate(config.fechaEvento)}
              </p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 border font-semibold text-xs hidden sm:flex">
            Portal VIP
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="financiero" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl h-auto p-1 bg-white shadow-sm border">
            <TabsTrigger value="financiero" className="rounded-xl py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pagos</span>
              <span className="sm:hidden text-[10px]">Pagos</span>
            </TabsTrigger>
            <TabsTrigger value="invitados" className="rounded-xl py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Invitados</span>
              <span className="sm:hidden text-[10px]">Invitados</span>
            </TabsTrigger>
            <TabsTrigger value="mesas" className="rounded-xl py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Mesas</span>
              <span className="sm:hidden text-[10px]">Mesas</span>
            </TabsTrigger>
            <TabsTrigger value="evento" className="rounded-xl py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Evento</span>
              <span className="sm:hidden text-[10px]">Evento</span>
            </TabsTrigger>
          </TabsList>

          {/* ── RESUMEN FINANCIERO ────────────────────────────────────────── */}
          <TabsContent value="financiero" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-md bg-slate-900 text-white">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs uppercase tracking-widest font-black opacity-60 mb-1">Costo Total</p>
                  <p className="text-2xl font-black">{formatCurrency(totalCosto)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-emerald-600 text-white">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs uppercase tracking-widest font-black opacity-70 mb-1">Total Pagado</p>
                  <p className="text-2xl font-black">{formatCurrency(totalPagado)}</p>
                </CardContent>
              </Card>
              <Card className={`border-none shadow-md ${saldoPendiente > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-100'}`}>
                <CardContent className="pt-5 pb-4">
                  <p className={`text-xs uppercase tracking-widest font-black mb-1 ${saldoPendiente > 0 ? 'opacity-70' : 'text-emerald-700'}`}>
                    Saldo Pendiente
                  </p>
                  <p className={`text-2xl font-black ${saldoPendiente > 0 ? '' : 'text-emerald-700'}`}>
                    {saldoPendiente > 0 ? formatCurrency(saldoPendiente) : '¡Todo pago!'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress bar */}
            {totalCosto > 0 && (
              <Card className="border-none shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-semibold">Progreso de pagos</span>
                    <span className="font-black text-primary">{porcentajePagado}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${porcentajePagado}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment plan cuotas */}
            {planPagos && planPagos.cuotas.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Plan de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {planPagos.cuotas.map(cuota => (
                      <div key={cuota.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm">{cuota.descripcion}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(cuota.fechaVencimiento)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm">{formatCurrency(cuota.monto)}</span>
                          {cuota.estado === 'pagado' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Pagado
                            </Badge>
                          )}
                          {cuota.estado === 'pendiente' && (
                            <Badge variant="outline" className="text-slate-500 text-xs">
                              <Clock className="w-3 h-3 mr-1" /> Pendiente
                            </Badge>
                          )}
                          {cuota.estado === 'vencido' && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Vencido
                            </Badge>
                          )}
                          {cuota.estado === 'parcial' && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">
                              Parcial
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informar Pago button */}
            {saldoPendiente > 0 && (
              <Button
                className="w-full h-14 rounded-2xl text-base font-black shadow-lg"
                onClick={() => setIsPayModalOpen(true)}
              >
                <Banknote className="w-5 h-5 mr-2" /> Informar Pago Realizado
              </Button>
            )}
          </TabsContent>

          {/* ── LISTA DE INVITADOS ────────────────────────────────────────── */}
          <TabsContent value="invitados" className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-none shadow-sm text-center">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-black text-emerald-600">{rsvpStats.confirmados}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Confirmados</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm text-center">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-black text-red-500">{rsvpStats.rechazados}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Rechazados</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm text-center">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-black text-slate-500">{rsvpStats.pendientes}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm text-center">
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-black text-amber-500">{rsvpStats.talvez}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Tal vez</p>
                </CardContent>
              </Card>
            </div>

            {invitados.length === 0 ? (
              <Card className="border-none shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Todavía no hay invitados registrados.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-bold">Lista de Invitados</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Nombre</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Estado</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Dieta</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Mesa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitados.map(inv => (
                        <TableRow key={inv.id} className="border-b border-slate-50">
                          <TableCell className="font-semibold text-sm py-3">
                            <div>
                              {inv.nombre}
                              {inv.partySize && inv.partySize > 1 && (
                                <span className="text-xs text-muted-foreground ml-1">(+{inv.partySize - 1})</span>
                              )}
                              {inv.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{inv.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">{getRsvpBadge(inv.rsvp)}</TableCell>
                          <TableCell className="py-3 hidden sm:table-cell">
                            {inv.dietaryRestriction && inv.dietaryRestriction !== 'Ninguna' ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                {inv.isCeliac ? '🌾 Celíaco' : inv.dietaryRestriction}
                              </Badge>
                            ) : inv.isCeliac ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                🌾 Celíaco
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-semibold hidden md:table-cell">
                            {inv.tableNumber ?? <span className="text-slate-300">Sin asignar</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Song requests */}
            {songRequests.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" /> Pedidos de Canciones al DJ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {songRequests.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0">
                      <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{item.song}</p>
                        <p className="text-xs text-muted-foreground">Pedido de {item.guest}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── DISEÑADOR DE MESAS ────────────────────────────────────────── */}
          <TabsContent value="mesas" className="mt-4 space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-base font-bold">Asignación de Mesas</CardTitle>
                <CardDescription>
                  Asigná a cada invitado confirmado a su mesa. Los cambios se guardan automáticamente.
                </CardDescription>
              </CardHeader>
              {confirmedInvitados.length === 0 ? (
                <CardContent className="py-12 text-center text-muted-foreground">
                  <LayoutDashboard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No hay invitados confirmados todavía.</p>
                  <p className="text-xs mt-1">Una vez que confirmen, podrás asignarles una mesa.</p>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Invitado</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Personas</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Mesa Asignada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedInvitados.map(guest => (
                        <TableRow key={guest.id} className="border-b border-slate-50">
                          <TableCell className="font-semibold text-sm py-3">
                            <div className="flex items-center gap-2">
                              {guest.nombre}
                              {guest.isCeliac && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" title="Celíaco" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-3 hidden sm:table-cell">
                            {guest.partySize ?? 1}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Select
                                value={guest.tableNumber ?? 'sin-mesa'}
                                onValueChange={(val) => handleAssignTable(guest.id, val)}
                                disabled={isSavingTable === guest.id}
                              >
                                <SelectTrigger className="h-9 rounded-xl border-slate-200 w-36 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sin-mesa">Sin asignar</SelectItem>
                                  {tableNames.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isSavingTable === guest.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            {/* Table summary */}
            {confirmedInvitados.some(g => g.tableNumber) && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-bold">Resumen por Mesa</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tableNames.map(tableName => {
                      const guestsAtTable = confirmedInvitados.filter(g => g.tableNumber === tableName);
                      if (guestsAtTable.length === 0) return null;
                      return (
                        <div key={tableName} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="font-black text-sm text-primary mb-2">{tableName}</p>
                          <div className="space-y-1">
                            {guestsAtTable.map(g => (
                              <p key={g.id} className="text-xs text-slate-600 truncate">{g.nombre}</p>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                            {guestsAtTable.reduce((s, g) => s + (g.partySize ?? 1), 0)} personas
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── MI EVENTO ─────────────────────────────────────────────────── */}
          <TabsContent value="evento" className="mt-4 space-y-4">
            <Card className="border-none shadow-md bg-slate-900 text-white overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-widest font-black opacity-60 mb-1">{config.tipoCelebracion}</p>
                <h2 className="text-2xl font-black font-headline mb-4">{config.nombreEvento}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-60 shrink-0" />
                    <div>
                      <p className="opacity-60 text-xs">Fecha</p>
                      <p className="font-semibold">{formatDate(config.fechaEvento)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 opacity-60 shrink-0" />
                    <div>
                      <p className="opacity-60 text-xs">Horario</p>
                      <p className="font-semibold">{config.horaInicio} – {config.horaFin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 opacity-60 shrink-0" />
                    <div>
                      <p className="opacity-60 text-xs">Lugar</p>
                      <p className="font-semibold">{config.nombreLugar}</p>
                      {config.direccionLugar && (
                        <p className="opacity-60 text-xs">{config.direccionLugar}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-60 shrink-0" />
                    <div>
                      <p className="opacity-60 text-xs">Invitados</p>
                      <p className="font-semibold">{config.invitadosEstimados} personas</p>
                    </div>
                  </div>
                  {(config.protagonista1Nombre || config.protagonista2Nombre) && (
                    <div className="flex items-center gap-2">
                      <span className="text-base opacity-60 shrink-0">🎉</span>
                      <div>
                        <p className="opacity-60 text-xs">Protagonista(s)</p>
                        <p className="font-semibold">
                          {[config.protagonista1Nombre, config.protagonista2Nombre].filter(Boolean).join(' & ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Catering / Menú */}
            {fiesta.menuMesa && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" /> Gastronomía
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  <p>El menú de tu evento está confirmado. Consultá con tu organizador para ver los detalles.</p>
                </CardContent>
              </Card>
            )}

            {/* Itinerary / Programa */}
            {programa.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Cronograma del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {programa.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-3">
                        <div className="min-w-[52px] text-xs font-black text-primary bg-primary/10 rounded-lg px-2 py-1 text-center">
                          {item.hora}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.titulo}</p>
                          {item.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.descripcion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {config.notesAdicionales && (
              <Card className="border-none shadow-sm border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notas del Organizador</p>
                  <p className="text-sm">{config.notesAdicionales}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── INFORMAR PAGO MODAL ─────────────────────────────────────────── */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-xl">
              <Banknote className="w-5 h-5 text-primary" /> Informar Pago Realizado
            </DialogTitle>
            <DialogDescription>
              Completá los datos de tu pago y adjuntá el comprobante. Tu organizador lo verificará.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInformarPago} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Monto abonado *</Label>
              <Input
                id="pay-amount"
                type="number"
                min="1"
                step="any"
                placeholder="Ej: 15000"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Método de pago</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger id="pay-method" className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="MercadoPago">MercadoPago</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Referencia / Número de transferencia</Label>
              <Input
                id="pay-ref"
                placeholder="Ej: TRF-2024-001 o nro. de operación"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-file">Comprobante (foto o PDF)</Label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pay-file"
                  className="flex-1 flex items-center justify-center gap-2 h-11 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-primary"
                >
                  <Upload className="w-4 h-4" />
                  {payFile ? (
                    <span className="font-semibold text-primary truncate max-w-[200px]">{payFile}</span>
                  ) : (
                    'Adjuntar comprobante'
                  )}
                </label>
                <input
                  id="pay-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Adjuntar es opcional pero recomendado para agilizar la verificación.</p>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSendingPay || !payAmount} className="rounded-xl font-bold">
                {isSendingPay ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enviar Notificación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PortalClientePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <VipPortalContent />
    </Suspense>
  );
}
