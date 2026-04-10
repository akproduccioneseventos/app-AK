'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, DollarSign, Plus, Loader2 } from 'lucide-react';
import { getAprobaciones, aprobarCambio, rechazarCambio, createAprobacion } from '@/app/actions/approvals';
import type { AprobacionRequest, TipoCambio, EstadoAprobacion } from '@/types/approval';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');

const estadoBadge = (estado: EstadoAprobacion) => {
  switch (estado) {
    case 'Pendiente': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
    case 'Aprobado': return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" />Aprobado</Badge>;
    case 'Rechazado': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rechazado</Badge>;
  }
};

const tipoCambioLabel: Record<TipoCambio, string> = {
  presupuesto: 'Presupuesto',
  menu: 'Menú',
  invitados: 'Invitados',
  proveedor: 'Proveedor',
  horario: 'Horario',
  servicio: 'Servicio',
  otro: 'Otro',
};

type NuevaAprobacionForm = {
  tipoCambio: TipoCambio;
  descripcion: string;
  valorAntes: string;
  valorDespues: string;
  impactoEconomico: string;
  impactoOperativo: string;
  fiestaId: string;
  solicitadoPor: string;
};

function AprobacionCard({
  aprobacion,
  onAprobar,
  onRechazar,
}: {
  aprobacion: AprobacionRequest;
  onAprobar: (id: string) => void;
  onRechazar: (aprobacion: AprobacionRequest) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-base">{aprobacion.descripcion}</CardTitle>
              <Badge variant="outline">{tipoCambioLabel[aprobacion.tipoCambio]}</Badge>
              {estadoBadge(aprobacion.estadoAprobacion)}
            </div>
            <CardDescription className="text-xs">
              Solicitado por <strong>{aprobacion.solicitadoPor}</strong> el {formatDate(aprobacion.solicitadoEn)}
              {aprobacion.fiestaId && <> · Evento: {aprobacion.fiestaId}</>}
            </CardDescription>
          </div>
          {aprobacion.estadoAprobacion === 'Pendiente' && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => onAprobar(aprobacion.id)}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
              </Button>
              <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => onRechazar(aprobacion)}>
                <XCircle className="h-4 w-4 mr-1" /> Rechazar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">{aprobacion.valorAntes || '—'}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{aprobacion.valorDespues || '—'}</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Impacto:</span>
          <span className="font-medium">{formatCurrency(aprobacion.impactoEconomico)}</span>
        </div>
        {aprobacion.impactoOperativo && (
          <p className="text-xs text-muted-foreground mt-1">{aprobacion.impactoOperativo}</p>
        )}
        {aprobacion.motivoRechazo && (
          <div className="mt-2 bg-red-50 rounded p-2 text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Motivo de rechazo: {aprobacion.motivoRechazo}
          </div>
        )}
        {aprobacion.aprobadoPor && aprobacion.aprobadoEn && (
          <p className="text-xs text-muted-foreground mt-1">
            {aprobacion.estadoAprobacion === 'Aprobado' ? 'Aprobado' : 'Rechazado'} por {aprobacion.aprobadoPor} el {formatDate(aprobacion.aprobadoEn)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AprobacionesContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') ?? undefined;
  const { toast } = useToast();

  const [aprobaciones, setAprobaciones] = useState<AprobacionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState(false);
  const [selectedForRechazo, setSelectedForRechazo] = useState<AprobacionRequest | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState(false);
  const [nuevaDialogOpen, setNuevaDialogOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<NuevaAprobacionForm>({
    tipoCambio: 'otro',
    descripcion: '',
    valorAntes: '',
    valorDespues: '',
    impactoEconomico: '0',
    impactoOperativo: '',
    fiestaId: fiestaId ?? '',
    solicitadoPor: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAprobaciones(fiestaId);
      setAprobaciones(data.sort((a, b) => b.solicitadoEn.localeCompare(a.solicitadoEn)));
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las aprobaciones.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fiestaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAprobar = async (id: string) => {
    const result = await aprobarCambio(id, 'admin');
    if (result.success) {
      toast({ title: 'Aprobado', description: 'El cambio fue aprobado correctamente.' });
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleOpenRechazar = (aprobacion: AprobacionRequest) => {
    setSelectedForRechazo(aprobacion);
    setMotivoRechazo('');
    setRechazarDialogOpen(true);
  };

  const handleRechazar = async () => {
    if (!selectedForRechazo || !motivoRechazo.trim()) {
      toast({ title: 'Error', description: 'Ingresá un motivo de rechazo.', variant: 'destructive' });
      return;
    }
    setRechazando(true);
    const result = await rechazarCambio(selectedForRechazo.id, motivoRechazo.trim(), 'admin');
    setRechazando(false);
    if (result.success) {
      toast({ title: 'Rechazado', description: 'El cambio fue rechazado.' });
      setRechazarDialogOpen(false);
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrear = async () => {
    if (!form.descripcion.trim() || !form.solicitadoPor.trim()) {
      toast({ title: 'Error', description: 'Completá los campos requeridos.', variant: 'destructive' });
      return;
    }
    setCreando(true);
    const result = await createAprobacion({
      fiestaId: form.fiestaId,
      tipoCambio: form.tipoCambio,
      descripcion: form.descripcion,
      valorAntes: form.valorAntes,
      valorDespues: form.valorDespues,
      impactoEconomico: parseFloat(form.impactoEconomico) || 0,
      impactoOperativo: form.impactoOperativo,
      solicitadoPor: form.solicitadoPor,
    });
    setCreando(false);
    if (result.success) {
      toast({ title: 'Solicitud creada', description: 'La solicitud de aprobación fue registrada.' });
      setNuevaDialogOpen(false);
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const filterByEstado = (estado: EstadoAprobacion | 'Todas') =>
    estado === 'Todas' ? aprobaciones : aprobaciones.filter(a => a.estadoAprobacion === estado);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderList = (items: AprobacionRequest[]) => (
    items.length === 0
      ? <p className="text-center text-muted-foreground py-8">No hay solicitudes en esta categoría.</p>
      : <div className="grid gap-3">{items.map(a => (
          <AprobacionCard key={a.id} aprobacion={a} onAprobar={handleAprobar} onRechazar={handleOpenRechazar} />
        ))}</div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Centro de Aprobaciones</h1>
          </div>
          <p className="text-muted-foreground">
            Gestioná las solicitudes de cambio y aprobaciones del evento.
            {fiestaId && <span className="ml-1 font-medium">Evento: {fiestaId}</span>}
          </p>
        </div>
        <Button onClick={() => setNuevaDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Solicitud
        </Button>
      </div>

      <Tabs defaultValue="Pendientes">
        <TabsList className="mb-4">
          <TabsTrigger value="Pendientes">
            Pendientes
            <Badge variant="secondary" className="ml-2">{filterByEstado('Pendiente').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="Rechazadas">Rechazadas</TabsTrigger>
          <TabsTrigger value="Todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="Pendientes">{renderList(filterByEstado('Pendiente'))}</TabsContent>
        <TabsContent value="Aprobadas">{renderList(filterByEstado('Aprobado'))}</TabsContent>
        <TabsContent value="Rechazadas">{renderList(filterByEstado('Rechazado'))}</TabsContent>
        <TabsContent value="Todas">{renderList(filterByEstado('Todas'))}</TabsContent>
      </Tabs>

      {/* Rechazo Dialog */}
      <Dialog open={rechazarDialogOpen} onOpenChange={setRechazarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Ingresá el motivo del rechazo para <strong>{selectedForRechazo?.descripcion}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazarDialogOpen(false)} disabled={rechazando}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={rechazando || !motivoRechazo.trim()}>
              {rechazando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva Solicitud Dialog */}
      <Dialog open={nuevaDialogOpen} onOpenChange={setNuevaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Aprobación</DialogTitle>
            <DialogDescription>Completá los datos del cambio a solicitar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo de Cambio *</label>
              <Select value={form.tipoCambio} onValueChange={(v) => setForm(f => ({ ...f, tipoCambio: v as TipoCambio }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoCambioLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción *</label>
              <Textarea
                placeholder="Describí el cambio solicitado..."
                value={form.descripcion}
                onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Valor Antes</label>
                <Input placeholder="Valor actual" value={form.valorAntes} onChange={(e) => setForm(f => ({ ...f, valorAntes: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valor Después</label>
                <Input placeholder="Valor propuesto" value={form.valorDespues} onChange={(e) => setForm(f => ({ ...f, valorDespues: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Impacto Económico (ARS)</label>
              <Input type="number" value={form.impactoEconomico} onChange={(e) => setForm(f => ({ ...f, impactoEconomico: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Impacto Operativo</label>
              <Input placeholder="Describí el impacto operativo..." value={form.impactoOperativo} onChange={(e) => setForm(f => ({ ...f, impactoOperativo: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID del Evento</label>
              <Input placeholder="ej: fiesta_1234567890" value={form.fiestaId} onChange={(e) => setForm(f => ({ ...f, fiestaId: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Solicitado Por *</label>
              <Input placeholder="Nombre o usuario" value={form.solicitadoPor} onChange={(e) => setForm(f => ({ ...f, solicitadoPor: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaDialogOpen(false)} disabled={creando}>Cancelar</Button>
            <Button onClick={handleCrear} disabled={creando}>
              {creando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AprobacionesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AprobacionesContent />
    </Suspense>
  );
}
