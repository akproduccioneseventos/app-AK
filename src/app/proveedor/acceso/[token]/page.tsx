'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  MapPin,
  Save,
  Truck,
} from 'lucide-react';

import {
  addNotaProveedor,
  confirmarLlegada,
  confirmarPartida,
  getProveedorByToken,
  toggleTareaProveedor,
  updateProveedorEstado,
} from '@/app/actions/provider-portal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type {
  EstadoProveedorPortal,
  ProveedorPortalAccess,
} from '@/types/provider-portal';

const STATUS_STYLES: Record<EstadoProveedorPortal, string> = {
  Pendiente: 'border-slate-300 bg-slate-50 text-slate-700',
  Confirmado: 'border-blue-200 bg-blue-50 text-blue-700',
  'En Camino': 'border-amber-200 bg-amber-50 text-amber-800',
  Llegó: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Completó: 'border-violet-200 bg-violet-50 text-violet-700',
  'No Llegó': 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function ProveedorAccessPage() {
  const params = useParams();
  const token = String(params.token || '');
  const { toast } = useToast();
  const [provider, setProvider] = useState<ProveedorPortalAccess | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    if (!token) {
      setError('El enlace no contiene un acceso válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getProveedorByToken(token);
    if (!result.success || !result.data) {
      setProvider(null);
      setError(result.error || 'El acceso no existe o fue desactivado.');
    } else {
      setProvider(result.data);
      setNotes(result.data.notas || '');
      setError(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  const runAction = async (
    key: string,
    action: () => Promise<{ success: boolean; data?: ProveedorPortalAccess; error?: string }>,
    successMessage: string,
  ) => {
    setPendingAction(key);
    try {
      const result = await action();
      if (!result.success) throw new Error(result.error || 'No se pudo guardar el cambio.');
      if (result.data) {
        setProvider(result.data);
        setNotes(result.data.notas || '');
      } else {
        await loadAccess();
      }
      toast({ title: successMessage });
    } catch (actionError) {
      toast({
        title: 'No se pudo actualizar',
        description: actionError instanceof Error ? actionError.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Acceso no disponible</AlertTitle>
          <AlertDescription>{error || 'Solicitá un enlace nuevo a AK Producciones.'}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const completedTasks = provider.tareas.filter((task) => task.completada).length;
  const actionLoading = pendingAction !== null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-cyan-700">Acceso de proveedor</p>
              <h1 className="mt-1 text-2xl font-bold">{provider.nombreProveedor}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{provider.tipoProveedor}</p>
            </div>
            <Badge variant="outline" className={STATUS_STYLES[provider.estadoActual]}>
              {provider.estadoActual}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <section className="grid gap-3 border bg-white p-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-cyan-700" />
            <div>
              <p className="text-xs text-muted-foreground">Llegada estimada</p>
              <p className="font-semibold">{provider.horaLlegadaEstimada}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-cyan-700" />
            <div>
              <p className="text-xs text-muted-foreground">Partida estimada</p>
              <p className="font-semibold">{provider.horaPartidaEstimada || 'A coordinar'}</p>
            </div>
          </div>
        </section>

        <section className="border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Estado operativo</h2>
              <p className="text-sm text-muted-foreground">Actualizalo para que producción vea tu avance.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {provider.estadoActual === 'Pendiente' && (
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => void runAction(
                    'confirm',
                    () => updateProveedorEstado(token, 'Confirmado'),
                    'Asistencia confirmada',
                  )}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />Confirmar
                </Button>
              )}
              {(provider.estadoActual === 'Pendiente' || provider.estadoActual === 'Confirmado') && (
                <Button
                  disabled={actionLoading}
                  onClick={() => void runAction(
                    'travel',
                    () => updateProveedorEstado(token, 'En Camino'),
                    'Producción ya sabe que estás en camino',
                  )}
                >
                  <Truck className="mr-2 h-4 w-4" />En camino
                </Button>
              )}
              {provider.estadoActual === 'En Camino' && (
                <Button
                  disabled={actionLoading}
                  onClick={() => void runAction('arrival', () => confirmarLlegada(token), 'Llegada confirmada')}
                >
                  <MapPin className="mr-2 h-4 w-4" />Llegué
                </Button>
              )}
              {provider.estadoActual === 'Llegó' && (
                <Button
                  disabled={actionLoading}
                  onClick={() => void runAction('finish', () => confirmarPartida(token), 'Trabajo finalizado')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />Finalizar
                </Button>
              )}
              {actionLoading && <Loader2 className="h-5 w-5 animate-spin self-center text-cyan-700" />}
            </div>
          </div>
        </section>

        <section className="border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <ClipboardCheck className="h-5 w-5 text-cyan-700" />Tareas asignadas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedTasks}/{provider.tareas.length} completadas
              </p>
            </div>
          </div>
          {provider.tareas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No hay tareas asignadas.</p>
          ) : (
            <div className="mt-4 divide-y">
              {provider.tareas.map((task) => (
                <label key={task.id} className="flex cursor-pointer items-start gap-3 py-3">
                  <Checkbox
                    checked={task.completada}
                    disabled={pendingAction === task.id}
                    onCheckedChange={() => void runAction(
                      task.id,
                      () => toggleTareaProveedor(token, task.id),
                      'Tarea actualizada',
                    )}
                  />
                  <span className={task.completada ? 'text-sm text-muted-foreground line-through' : 'text-sm'}>
                    {task.texto}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 border bg-white p-4">
          <div>
            <Label htmlFor="provider-notes">Notas para producción</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Usá este espacio para avisos operativos. No incluyas datos sensibles.
            </p>
          </div>
          <Textarea
            id="provider-notes"
            value={notes}
            maxLength={2_000}
            rows={5}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Button
            variant="outline"
            disabled={pendingAction === 'notes'}
            onClick={() => void runAction(
              'notes',
              () => addNotaProveedor(token, notes.trim()),
              'Nota guardada',
            )}
          >
            {pendingAction === 'notes'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />}
            Guardar nota
          </Button>
        </section>

        <footer className="py-2 text-center text-xs text-muted-foreground">
          AK Producciones: coordinación operativa del evento.
        </footer>
      </div>
    </main>
  );
}
