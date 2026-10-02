'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Archive,
  FileText,
  Users,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  obtenerFiestasParaRevisarAction,
  actualizarClienteYAgasajadoAction,
  archiveFiesta,
} from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaParaRevisar, ProblemaFiesta } from '@/lib/fiesta/revisar-fiestas';

export default function RevisarMisFiestasPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [fiestasParaRevisar, setFiestasParaRevisar] = useState<FiestaParaRevisar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Diálogo para "¿Quién contrata?"
  const [dialogoQuienContrata, setDialogoQuienContrata] = useState<{
    abierto: boolean;
    fiestaId: string;
    cliente: string;
    agasajado: string;
  }>({
    abierto: false,
    fiestaId: '',
    cliente: '',
    agasajado: '',
  });

  const cargarRevision = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerFiestasParaRevisarAction();
      setFiestasParaRevisar(data || []);
    } catch (err: any) {
      toast({
        title: 'Error al cargar revisión',
        description: err?.message || 'No se pudieron revisar las fiestas.',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarRevision();
  }, [cargarRevision]);

  const handleArchivar = async (fiestaId: string, nombre: string) => {
    setProcesandoId(fiestaId);
    try {
      const res = await archiveFiesta(fiestaId);
      if (res.success) {
        toast({
          title: 'Fiesta archivada',
          description: `Se archivó "${nombre}" con éxito.`,
        });
        await cargarRevision();
      } else {
        throw new Error(res.error || 'No se pudo archivar');
      }
    } catch (err: any) {
      toast({
        title: 'Error al archivar',
        description: err?.message || 'No se pudo archivar la fiesta.',
        variant: 'destructive',
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const handleGuardarQuienContrata = async () => {
    const { fiestaId, cliente, agasajado } = dialogoQuienContrata;
    if (!cliente.trim() || !agasajado.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completá quién contrata y quién es el agasajado.',
        variant: 'destructive',
      });
      return;
    }

    setProcesandoId(fiestaId);
    try {
      const res = await actualizarClienteYAgasajadoAction(fiestaId, cliente, agasajado);
      if (res.success) {
        toast({
          title: 'Datos actualizados',
          description: 'Se aclararon los nombres del cliente y el agasajado.',
        });
        setDialogoQuienContrata((prev) => ({ ...prev, abierto: false }));
        await cargarRevision();
      } else {
        throw new Error(res.error || 'No se pudieron guardar los cambios');
      }
    } catch (err: any) {
      toast({
        title: 'Error al actualizar',
        description: err?.message || 'No se pudo actualizar la información.',
        variant: 'destructive',
      });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent">
              <Link href="/eventos" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a eventos
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-black text-foreground">Revisar mis fiestas</h1>
          <p className="text-sm text-muted-foreground">
            Detección automática de fiestas pasadas sin archivar, faltantes clave o datos confusos.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={cargarRevision}
          disabled={cargando}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Contenido principal */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Revisando todas tus fiestas...</p>
        </div>
      ) : fiestasParaRevisar.length === 0 ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <h2 className="text-lg font-bold text-foreground">¡Todo en orden con tus fiestas!</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              No se detectaron fiestas pasadas sin archivar, confusiones en nombres de clientes ni datos faltantes.
            </p>
            <Button asChild className="mt-2">
              <Link href="/eventos">Volver al panel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Se encontraron {fiestasParaRevisar.length} fiesta(s) para revisar:
            </p>
          </div>

          {fiestasParaRevisar.map((f) => (
            <Card key={f.fiestaId} className="border-amber-500/20 shadow-sm">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      {f.nombreEvento}
                      {f.estado === 'suspendida' && (
                        <Badge variant="destructive" className="text-[10px]">
                          Suspendida
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Fecha: {f.fechaEvento || 'Sin fecha definida'} · Total cobrado:{' '}
                      <span className="font-semibold text-foreground">${f.totalCobrado.toLocaleString('es-UY')}</span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/fiestas/nueva?fiestaId=${f.fiestaId}`}>Ver ficha completa</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <div className="divide-y divide-border/50 border rounded-lg bg-card/50">
                  {f.problemas.map((prob, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-semibold text-foreground">{prob.titulo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{prob.descripcion}</p>
                      </div>

                      <div className="pl-6 sm:pl-0 shrink-0">
                        {prob.accionSugerida === 'archivar' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={procesandoId === f.fiestaId}
                            onClick={() => handleArchivar(f.fiestaId, f.nombreEvento)}
                            className="flex items-center gap-1.5"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            {prob.etiquetaBoton}
                          </Button>
                        )}

                        {prob.accionSugerida === 'abrir_presupuesto' && (
                          <Button size="sm" variant="secondary" asChild className="flex items-center gap-1.5">
                            <Link href={`/fiestas/nueva/presupuesto?fiestaId=${f.fiestaId}`}>
                              <FileText className="w-3.5 h-3.5" />
                              {prob.etiquetaBoton}
                            </Link>
                          </Button>
                        )}

                        {prob.accionSugerida === 'aclarar_quien_contrata' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setDialogoQuienContrata({
                                abierto: true,
                                fiestaId: f.fiestaId,
                                cliente: f.clienteNombre || '',
                                agasajado: f.agasajadoNombre || '',
                              })
                            }
                            className="flex items-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {prob.etiquetaBoton}
                          </Button>
                        )}

                        {prob.accionSugerida === 'ver_cuotas' && (
                          <Button size="sm" variant="secondary" asChild className="flex items-center gap-1.5">
                            <Link href={`/fiestas/nueva/post-evento?fiestaId=${f.fiestaId}`}>
                              <DollarSign className="w-3.5 h-3.5" />
                              {prob.etiquetaBoton}
                            </Link>
                          </Button>
                        )}

                        {prob.accionSugerida === 'editar_datos' && (
                          <Button size="sm" variant="secondary" asChild>
                            <Link href={`/fiestas/nueva?fiestaId=${f.fiestaId}`}>
                              {prob.etiquetaBoton}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo "¿Quién contrata?" */}
      <Dialog
        open={dialogoQuienContrata.abierto}
        onOpenChange={(abierto) => setDialogoQuienContrata((prev) => ({ ...prev, abierto }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Quién contrata?</DialogTitle>
            <DialogDescription>
              Separar claramente los datos de la persona que contrata (cliente) de quien festeja (agasajada/o).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="input-cliente">Quién contrata (cliente)</Label>
              <Input
                id="input-cliente"
                placeholder="Ej: María Rodríguez (Madre)"
                value={dialogoQuienContrata.cliente}
                onChange={(e) =>
                  setDialogoQuienContrata((prev) => ({ ...prev, cliente: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="input-agasajado">Agasajada / agasajado</Label>
              <Input
                id="input-agasajado"
                placeholder="Ej: Sofía (Quinceañera)"
                value={dialogoQuienContrata.agasajado}
                onChange={(e) =>
                  setDialogoQuienContrata((prev) => ({ ...prev, agasajado: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoQuienContrata((prev) => ({ ...prev, abierto: false }))}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarQuienContrata}
              disabled={procesandoId === dialogoQuienContrata.fiestaId}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
