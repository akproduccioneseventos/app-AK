'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import {
  createProveedorAcceso,
  getProveedoresPortal,
} from '@/app/actions/provider-portal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type {
  ProveedorPortalAccess,
  TipoProveedor,
} from '@/types/provider-portal';

const PROVIDER_TYPES: TipoProveedor[] = [
  'Fotografía',
  'DJ',
  'Catering',
  'Decoración',
  'Repostería',
  'Animación',
  'Video',
  'Sonido',
  'Otro',
];

const STATUS_STYLES: Record<ProveedorPortalAccess['estadoActual'], string> = {
  Pendiente: 'border-slate-300 bg-slate-50 text-slate-700',
  Confirmado: 'border-blue-200 bg-blue-50 text-blue-700',
  'En Camino': 'border-amber-200 bg-amber-50 text-amber-800',
  Llegó: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Completó: 'border-violet-200 bg-violet-50 text-violet-700',
  'No Llegó': 'border-rose-200 bg-rose-50 text-rose-700',
};

type CreateForm = {
  nombreProveedor: string;
  tipoProveedor: TipoProveedor;
  email: string;
  telefono: string;
  horaLlegadaEstimada: string;
  horaPartidaEstimada: string;
  tareas: string;
};

const EMPTY_FORM: CreateForm = {
  nombreProveedor: '',
  tipoProveedor: 'Otro',
  email: '',
  telefono: '',
  horaLlegadaEstimada: '',
  horaPartidaEstimada: '',
  tareas: '',
};

export default function ProveedoresPortalPlannerPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [providers, setProviders] = useState<ProveedorPortalAccess[]>([]);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [eventData, providerResult] = await Promise.all([
        getFiestaById(fiestaId),
        getProveedoresPortal(fiestaId),
      ]);
      if (!eventData) throw new Error('La fiesta no existe.');
      if (!providerResult.success) {
        throw new Error(providerResult.error || 'No se pudieron cargar los accesos.');
      }
      setFiesta(eventData);
      setProviders(providerResult.data || []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el portal.');
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const providerStats = useMemo(() => ({
    total: providers.length,
    arrived: providers.filter((provider) => (
      provider.estadoActual === 'Llegó' || provider.estadoActual === 'Completó'
    )).length,
    completedTasks: providers.reduce(
      (total, provider) => total + provider.tareas.filter((task) => task.completada).length,
      0,
    ),
    tasks: providers.reduce((total, provider) => total + provider.tareas.length, 0),
  }), [providers]);

  const providerPath = (provider: ProveedorPortalAccess) => (
    `/proveedor/acceso/${encodeURIComponent(provider.token)}`
  );

  const copyProviderUrl = async (provider: ProveedorPortalAccess) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${providerPath(provider)}`);
      setCopiedId(provider.id);
      window.setTimeout(() => setCopiedId(null), 2_000);
      toast({ title: 'Acceso copiado', description: `Ya podés enviárselo a ${provider.nombreProveedor}.` });
    } catch {
      toast({
        title: 'No se pudo copiar',
        description: 'Abrí el acceso y copiá la dirección desde el navegador.',
        variant: 'destructive',
      });
    }
  };

  const createAccess = async () => {
    const providerName = form.nombreProveedor.trim();
    if (!providerName || !form.horaLlegadaEstimada) {
      toast({
        title: 'Faltan datos',
        description: 'Ingresá el proveedor y su hora estimada de llegada.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await createProveedorAcceso({
        fiestaId,
        nombreProveedor: providerName,
        tipoProveedor: form.tipoProveedor,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        horaLlegadaEstimada: form.horaLlegadaEstimada,
        horaPartidaEstimada: form.horaPartidaEstimada || undefined,
        estadoActual: 'Pendiente',
        tareas: form.tareas
          .split('\n')
          .map((text) => text.trim())
          .filter(Boolean)
          .slice(0, 20)
          .map((texto, index) => ({
            id: `tarea-${Date.now()}-${index}`,
            texto: texto.slice(0, 180),
            completada: false,
          })),
        notas: undefined,
        activo: true,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'No se pudo crear el acceso.');
      }
      setProviders((current) => [...current, result.data!]);
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      toast({ title: 'Acceso creado', description: 'El enlace privado está listo para compartir.' });
    } catch (error) {
      toast({
        title: 'No se pudo crear el acceso',
        description: error instanceof Error ? error.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando proveedores...</p>
      </div>
    );
  }

  if (!fiestaId || loadError || !fiesta) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <Button asChild variant="ghost">
          <Link href="/eventos"><ArrowLeft className="mr-2 h-4 w-4" />Volver a eventos</Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>No se pudo abrir el portal</AlertTitle>
          <AlertDescription>
            {loadError || 'Abrí este módulo desde una fiesta para conservar el contexto correcto.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href={`/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />Volver al planificador
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
            <Truck className="h-6 w-6 text-cyan-700" />
            Proveedores y logística
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fiesta.configuracion.nombreEvento || 'Evento'}: accesos privados, horarios y tareas asignadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="icon" onClick={() => void loadData()} title="Actualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href="/proveedores"><Users className="mr-2 h-4 w-4" />Directorio</Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo acceso</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Crear acceso de proveedor</DialogTitle>
                <DialogDescription>
                  El enlace será privado y mostrará solamente el horario y las tareas de este proveedor.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="provider-name">Proveedor</Label>
                  <Input
                    id="provider-name"
                    value={form.nombreProveedor}
                    maxLength={120}
                    onChange={(event) => setForm((current) => ({ ...current, nombreProveedor: event.target.value }))}
                    placeholder="Ej. Sonido Norte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-type">Tipo</Label>
                  <select
                    id="provider-type"
                    value={form.tipoProveedor}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      tipoProveedor: event.target.value as TipoProveedor,
                    }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PROVIDER_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-phone">Teléfono</Label>
                  <Input
                    id="provider-phone"
                    value={form.telefono}
                    maxLength={40}
                    onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-email">Correo</Label>
                  <Input
                    id="provider-email"
                    type="email"
                    value={form.email}
                    maxLength={160}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-arrival">Llegada estimada</Label>
                  <Input
                    id="provider-arrival"
                    type="time"
                    value={form.horaLlegadaEstimada}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      horaLlegadaEstimada: event.target.value,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-departure">Partida estimada</Label>
                  <Input
                    id="provider-departure"
                    type="time"
                    value={form.horaPartidaEstimada}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      horaPartidaEstimada: event.target.value,
                    }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="provider-tasks">Tareas, una por línea</Label>
                  <Textarea
                    id="provider-tasks"
                    value={form.tareas}
                    rows={4}
                    maxLength={3_600}
                    onChange={(event) => setForm((current) => ({ ...current, tareas: event.target.value }))}
                    placeholder={'Descargar equipos\nPrueba de sonido\nRetirar materiales'}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => void createAccess()} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear acceso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Accesos', value: providerStats.total },
          { label: 'Llegaron', value: providerStats.arrived },
          { label: 'Tareas listas', value: providerStats.completedTasks },
          { label: 'Tareas totales', value: providerStats.tasks },
        ].map((stat) => (
          <div key={stat.label} className="border-l-4 border-cyan-600 bg-slate-50 px-4 py-3">
            <p className="text-2xl font-bold tabular-nums text-slate-950">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      {providers.length === 0 ? (
        <div className="border border-dashed bg-slate-50 px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">Todavía no hay accesos</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Creá un acceso por empresa o responsable externo y compartí su enlace privado.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {providers.map((provider) => {
            const completed = provider.tareas.filter((task) => task.completada).length;
            return (
              <Card key={provider.id} className="rounded-lg">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{provider.nombreProveedor}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{provider.tipoProveedor}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[provider.estadoActual]}>
                      {provider.estadoActual}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid min-w-0 flex-1 gap-2 text-sm sm:grid-cols-3">
                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {provider.horaLlegadaEstimada}
                      {provider.horaPartidaEstimada ? ` - ${provider.horaPartidaEstimada}` : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-slate-400" />
                      {completed}/{provider.tareas.length} tareas
                    </span>
                    <span className="truncate text-muted-foreground">
                      {provider.telefono || provider.email || 'Sin contacto cargado'}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyProviderUrl(provider)}
                    >
                      {copiedId === provider.id
                        ? <Check className="mr-2 h-4 w-4 text-emerald-600" />
                        : <Copy className="mr-2 h-4 w-4" />}
                      {copiedId === provider.id ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button asChild size="sm">
                      <a href={providerPath(provider)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />Abrir
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
