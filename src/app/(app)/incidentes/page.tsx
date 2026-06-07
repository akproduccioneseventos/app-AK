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
import { AlertTriangle, Plus, CheckCircle2, MessageSquare, Clock, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getIncidentes, createIncidente, addActualizacionIncidente, resolverIncidente } from '@/app/actions/incidents';
import type { Incidente, EstadoIncidente, PrioridadIncidente, CategoriaIncidente } from '@/types/incident';

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');
const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const prioridadConfig: Record<PrioridadIncidente, { label: string; className: string }> = {
  Critica: { label: 'Crítica', className: 'bg-red-100 text-red-800 border-red-200' },
  Alta: { label: 'Alta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  Media: { label: 'Media', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  Baja: { label: 'Baja', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const estadoConfig: Record<EstadoIncidente, { label: string; icon: React.ReactNode }> = {
  Abierto: { label: 'Abierto', icon: <AlertTriangle className="h-3 w-3" /> },
  'En Proceso': { label: 'En Proceso', icon: <Zap className="h-3 w-3" /> },
  Resuelto: { label: 'Resuelto', icon: <CheckCircle2 className="h-3 w-3" /> },
  Cerrado: { label: 'Cerrado', icon: <CheckCircle2 className="h-3 w-3" /> },
};

const CATEGORIAS: CategoriaIncidente[] = [
  'Proveedor', 'Catering', 'Técnico', 'Clima', 'Invitados', 'Personal', 'Logística', 'Otro',
];

type NuevoIncidenteForm = {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidente;
  prioridad: PrioridadIncidente;
  estado: EstadoIncidente;
  responsable: string;
  planAccion: string;
  seguimiento: string;
  fiestaId: string;
  registradoPor: string;
};

function IncidenteCard({
  incidente,
  onActualizar,
  onResolver,
}: {
  incidente: Incidente;
  onActualizar: (incidente: Incidente) => void;
  onResolver: (incidente: Incidente) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const prioridad = prioridadConfig[incidente.prioridad];
  const estado = estadoConfig[incidente.estado];

  return (
    <Card className={`border-l-4 ${incidente.prioridad === 'Critica' ? 'border-l-red-500' : incidente.prioridad === 'Alta' ? 'border-l-orange-500' : incidente.prioridad === 'Media' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-base">{incidente.titulo}</CardTitle>
              <Badge variant="outline">{incidente.categoria}</Badge>
              <Badge className={`text-xs ${prioridad.className}`}>{prioridad.label}</Badge>
              <Badge variant="secondary" className="gap-1">{estado.icon}{estado.label}</Badge>
            </div>
            <CardDescription className="text-xs">
              Responsable: <strong>{incidente.responsable}</strong> · Registrado el {formatDate(incidente.registradoEn)}
              {incidente.fiestaId && <> · Evento: {incidente.fiestaId}</>}
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {expanded ? 'Ocultar' : 'Ver Detalles'}
            </Button>
          </div>
        </div>
        {incidente.planAccion && (
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Plan:</strong> {incidente.planAccion}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Separator className="mb-3" />
          {incidente.descripcion && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{incidente.descripcion}</p>
            </div>
          )}
          {incidente.seguimiento && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Seguimiento</p>
              <p className="text-sm">{incidente.seguimiento}</p>
            </div>
          )}
          {incidente.leccionesAprendidas && (
            <div className="mb-3 bg-green-50 p-2 rounded text-sm text-green-800">
              <p className="font-medium text-xs mb-1">Lecciones Aprendidas</p>
              <p>{incidente.leccionesAprendidas}</p>
            </div>
          )}

          {incidente.actualizaciones.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Actualizaciones ({incidente.actualizaciones.length})</p>
              <div className="space-y-2">
                {incidente.actualizaciones.map((act) => (
                  <div key={act.id} className="bg-muted/50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{act.autor}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(act.timestamp)}</span>
                    </div>
                    <p className="text-sm">{act.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => onActualizar(incidente)}>
              <MessageSquare className="h-4 w-4 mr-1" /> Añadir Actualización
            </Button>
            {incidente.estado !== 'Resuelto' && incidente.estado !== 'Cerrado' && (
              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => onResolver(incidente)}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function IncidentesContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') ?? undefined;
  const { toast } = useToast();

  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);

  const [nuevaDialogOpen, setNuevaDialogOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<NuevoIncidenteForm>({
    titulo: '',
    descripcion: '',
    categoria: 'Otro',
    prioridad: 'Media',
    estado: 'Abierto',
    responsable: '',
    planAccion: '',
    seguimiento: '',
    fiestaId: fiestaId ?? '',
    registradoPor: 'admin',
  });

  const [actualizarDialogOpen, setActualizarDialogOpen] = useState(false);
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [textoActualizacion, setTextoActualizacion] = useState('');
  const [guardandoAct, setGuardandoAct] = useState(false);

  const [resolverDialogOpen, setResolverDialogOpen] = useState(false);
  const [incidenteAResolver, setIncidenteAResolver] = useState<Incidente | null>(null);
  const [lecciones, setLecciones] = useState('');
  const [resolviendo, setResolviendo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getIncidentes(fiestaId);
      setIncidentes(data.sort((a, b) => b.registradoEn.localeCompare(a.registradoEn)));
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los incidentes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fiestaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrear = async () => {
    if (!form.titulo.trim() || !form.responsable.trim()) {
      toast({ title: 'Error', description: 'Completá los campos requeridos.', variant: 'destructive' });
      return;
    }
    setCreando(true);
    const result = await createIncidente({
      titulo: form.titulo,
      descripcion: form.descripcion,
      categoria: form.categoria,
      prioridad: form.prioridad,
      estado: form.estado,
      responsable: form.responsable,
      planAccion: form.planAccion,
      seguimiento: form.seguimiento,
      fiestaId: form.fiestaId,
      registradoPor: form.registradoPor,
    });
    setCreando(false);
    if (result.success) {
      toast({ title: 'Incidente creado', description: 'El incidente fue registrado correctamente.' });
      setNuevaDialogOpen(false);
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAbrirActualizar = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setTextoActualizacion('');
    setActualizarDialogOpen(true);
  };

  const handleGuardarActualizacion = async () => {
    if (!selectedIncidente || !textoActualizacion.trim()) return;
    setGuardandoAct(true);
    const result = await addActualizacionIncidente(selectedIncidente.id, textoActualizacion.trim(), 'admin');
    setGuardandoAct(false);
    if (result.success) {
      toast({ title: 'Actualización guardada' });
      setActualizarDialogOpen(false);
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAbrirResolver = (incidente: Incidente) => {
    setIncidenteAResolver(incidente);
    setLecciones('');
    setResolverDialogOpen(true);
  };

  const handleResolver = async () => {
    if (!incidenteAResolver) return;
    setResolviendo(true);
    const result = await resolverIncidente(incidenteAResolver.id, lecciones.trim() || undefined);
    setResolviendo(false);
    if (result.success) {
      toast({ title: 'Incidente resuelto', description: 'El incidente fue marcado como resuelto.' });
      setResolverDialogOpen(false);
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const byEstado = (estado: EstadoIncidente | 'Todos') =>
    estado === 'Todos' ? incidentes : incidentes.filter(i => i.estado === estado);

  const renderList = (items: Incidente[]) =>
    items.length === 0
      ? <p className="text-center text-muted-foreground py-8">No hay incidentes en esta categoría.</p>
      : <div className="grid gap-3">{items.map(i => (
          <IncidenteCard key={i.id} incidente={i} onActualizar={handleAbrirActualizar} onResolver={handleAbrirResolver} />
        ))}</div>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Gestión de Incidentes</h1>
          </div>
          <p className="text-muted-foreground">
            Registrá y gestioná los incidentes del evento.
            {fiestaId && <span className="ml-1 font-medium">Evento: {fiestaId}</span>}
          </p>
        </div>
        <Button onClick={() => setNuevaDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Incidencia
        </Button>
      </div>

      <Tabs defaultValue="Abiertos">
        <TabsList className="mb-4">
          <TabsTrigger value="Abiertos">
            Abiertos <Badge variant="secondary" className="ml-2">{byEstado('Abierto').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="En Proceso">
            En Proceso <Badge variant="secondary" className="ml-2">{byEstado('En Proceso').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Resueltos">Resueltos</TabsTrigger>
          <TabsTrigger value="Todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="Abiertos">{renderList(byEstado('Abierto'))}</TabsContent>
        <TabsContent value="En Proceso">{renderList(byEstado('En Proceso'))}</TabsContent>
        <TabsContent value="Resueltos">{renderList(byEstado('Resuelto'))}</TabsContent>
        <TabsContent value="Todos">{renderList(byEstado('Todos'))}</TabsContent>
      </Tabs>

      {/* Nueva Incidencia Dialog */}
      <Dialog open={nuevaDialogOpen} onOpenChange={setNuevaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Incidencia</DialogTitle>
            <DialogDescription>Registrá un nuevo incidente para el evento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input placeholder="Título del incidente" value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <Textarea placeholder="Describí el incidente..." value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v as CategoriaIncidente }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prioridad</label>
                <Select value={form.prioridad} onValueChange={(v) => setForm(f => ({ ...f, prioridad: v as PrioridadIncidente }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critica">Crítica</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Responsable *</label>
              <Input placeholder="Nombre del responsable" value={form.responsable} onChange={(e) => setForm(f => ({ ...f, responsable: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Plan de Acción</label>
              <Textarea placeholder="Pasos a seguir para resolver..." value={form.planAccion} onChange={(e) => setForm(f => ({ ...f, planAccion: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Seguimiento</label>
              <Input placeholder="Notas de seguimiento..." value={form.seguimiento} onChange={(e) => setForm(f => ({ ...f, seguimiento: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID del Evento</label>
              <Input placeholder="fiesta_1234..." value={form.fiestaId} onChange={(e) => setForm(f => ({ ...f, fiestaId: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaDialogOpen(false)} disabled={creando}>Cancelar</Button>
            <Button onClick={handleCrear} disabled={creando}>
              {creando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Registrar Incidente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actualización Dialog */}
      <Dialog open={actualizarDialogOpen} onOpenChange={setActualizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Actualización</DialogTitle>
            <DialogDescription>{selectedIncidente?.titulo}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Texto de la actualización..."
            value={textoActualizacion}
            onChange={(e) => setTextoActualizacion(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActualizarDialogOpen(false)} disabled={guardandoAct}>Cancelar</Button>
            <Button onClick={handleGuardarActualizacion} disabled={guardandoAct || !textoActualizacion.trim()}>
              {guardandoAct ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolver Dialog */}
      <Dialog open={resolverDialogOpen} onOpenChange={setResolverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Incidente</DialogTitle>
            <DialogDescription>{incidenteAResolver?.titulo}</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1 block">Lecciones Aprendidas (opcional)</label>
            <Textarea
              placeholder="¿Qué aprendimos de este incidente?"
              value={lecciones}
              onChange={(e) => setLecciones(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolverDialogOpen(false)} disabled={resolviendo}>Cancelar</Button>
            <Button onClick={handleResolver} disabled={resolviendo}>
              {resolviendo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Marcar como Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function IncidentesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <IncidentesContent />
    </Suspense>
  );
}
