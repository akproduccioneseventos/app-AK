
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, ListChecks, CheckCircle, FileClock, XCircle, FileText, Search, ClipboardPaste, Trash2, CalendarDays, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestos, repairVerifiedBudgetDates, resetAllPresupuestos } from '@/app/actions/presupuestos';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { organizeBudgets, sortBudgets, type BudgetSortMode } from '@/lib/budget/budget-ordering';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} demoro demasiado en responder.`)), ms);
        promise
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timer));
    });
}

type DashboardSortMode = 'smart' | BudgetSortMode;

function PresupuestoDashboardContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [totalPresupuestosCount, setTotalPresupuestosCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isResettingPresupuestos, setIsResettingPresupuestos] = useState(false);
    const [sortMode, setSortMode] = useState<DashboardSortMode>('smart');

    const fetchPresupuestos = useCallback(async () => {
        setIsLoading(true);
        try {
            const repairResult = await withTimeout(repairVerifiedBudgetDates(), 30000, 'La correccion de fechas');
            if (!repairResult.success) {
                toast({
                    title: 'No se pudieron corregir las fechas importadas',
                    description: repairResult.error,
                    variant: 'destructive',
                });
            }

            const visibleRequest = withTimeout(getPresupuestos(showArchived), 12000, 'La lista de presupuestos');
            const countRequest = withTimeout(getPresupuestos(true), 12000, 'El conteo total de presupuestos');
            const [visibleResult, countResult] = await Promise.allSettled([visibleRequest, countRequest]);

            if (visibleResult.status === 'fulfilled') {
                const guardados = Array.isArray(visibleResult.value) ? visibleResult.value : [];
                setPresupuestos(guardados);
            } else {
                setPresupuestos([]);
                toast({
                    title: 'No se pudo cargar la lista',
                    description: 'La base demoro o rechazo la consulta. La pantalla queda disponible para volver a intentar.',
                    variant: 'destructive',
                });
            }

            if (countResult.status === 'fulfilled') {
                setTotalPresupuestosCount(Array.isArray(countResult.value) ? countResult.value.length : 0);
            } else if (visibleResult.status === 'fulfilled') {
                setTotalPresupuestosCount(Array.isArray(visibleResult.value) ? visibleResult.value.length : 0);
                toast({
                    title: 'Conteo parcial',
                    description: 'Se cargo la lista, pero no se pudo confirmar el total de archivados.',
                });
            } else {
                setTotalPresupuestosCount(0);
            }
        } catch (error) {
            setPresupuestos([]);
            setTotalPresupuestosCount(0);
            toast({
                title: 'No se pudieron cargar los presupuestos',
                description: error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, showArchived]);

    useEffect(() => { fetchPresupuestos(); }, [fetchPresupuestos]);

    const handleBudgetMutation = useCallback(async (id: string, action: 'archive' | 'delete') => {
        setPresupuestos(prev => prev.filter(p => p.id !== id || (showArchived && action === 'archive')));
        router.refresh();
        await fetchPresupuestos();
    }, [router, fetchPresupuestos, showArchived]);

    const handleResetAllPresupuestos = async () => {
        setIsResettingPresupuestos(true);
        try {
            const result = await resetAllPresupuestos();
            if (result.success) {
                toast({ title: '🗑️ Presupuestos eliminados', description: `${result.deletedCount ?? 0} presupuesto(s) eliminado(s) permanentemente.`, variant: 'destructive' });
                setPresupuestos([]);
                setTotalPresupuestosCount(0);
                router.refresh();
                await fetchPresupuestos();
            } else {
                toast({ title: 'Error', description: result.error || 'No se pudieron eliminar los presupuestos.', variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsResettingPresupuestos(false);
        }
    };

    const filteredPresupuestos = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return presupuestos.filter(p => 
            p.clienteNombre.toLowerCase().includes(lower) || 
            (p.numero?.toString().includes(lower)) ||
            p.id.includes(lower)
        );
    }, [presupuestos, searchTerm]);

    const organizedBudgets = useMemo(() => {
        const organized = organizeBudgets(filteredPresupuestos);
        if (sortMode === 'smart') return organized;
        return {
            contracted: sortBudgets(organized.contracted, sortMode),
            prospects: sortBudgets(organized.prospects, sortMode),
            archived: sortBudgets(organized.archived, sortMode),
        };
    }, [filteredPresupuestos, sortMode]);

    const kpis = useMemo(() => ({
        aceptados: presupuestos.filter(p => p.estado === 'Aceptado').length,
        facturados: presupuestos.filter(p => p.estado === 'Facturado').length,
        pendientes: presupuestos.filter(p => p.estado === 'Enviado').length,
        borradores: presupuestos.filter(p => p.estado === 'Borrador').length,
        rechazados: presupuestos.filter(p => p.estado === 'Rechazado').length,
    }), [presupuestos]);

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                  <ListChecks className="w-8 h-8 text-primary"/> Central de Presupuestos
                </h1>
                <div className="flex gap-2 flex-wrap">
                  {/* El configurador existia y no lo enlazaba ninguna pantalla:
                      el vendedor no tenia como llegar. Va aca, que es donde
                      arma el presupuesto antes de la reunion. */}
                  <Button asChild variant="secondary"><Link href="/empresa/configurador-reunion">Configurador para la reunión</Link></Button>
                  <Button asChild variant="secondary"><Link href="/presupuestos/reporte">Reporte</Link></Button>
                  <Button asChild variant="outline" data-testid="btn-importar-presupuesto"><Link href="/presupuestos/importar"><ClipboardPaste className="w-4 h-4 mr-2"/>Importar desde Texto</Link></Button>
                  <Button asChild><Link href="/presupuestos/nuevo/crear"><PlusCircle className="w-4 h-4 mr-2"/>Nuevo Presupuesto</Link></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isResettingPresupuestos || totalPresupuestosCount === 0}>
                        {isResettingPresupuestos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        🗑️ Borrar todos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ ¿Borrar TODOS los presupuestos permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará <strong>de forma irreversible</strong> todos los presupuestos ({totalPresupuestosCount}), incluyendo los archivados. Los datos <strong>NO se podrán recuperar</strong>. Esta operación borra directamente de Firestore y no puede deshacerse.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAllPresupuestos} className="bg-destructive hover:bg-destructive/90">
                          Sí, borrar todos permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button asChild variant="outline"><Link href="/empresa/contabilidad">Volver</Link></Button>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard title="Pendientes (Enviados)" value={kpis.pendientes} icon={FileClock} isLoading={isLoading}/>
                <KpiCard title="Borradores" value={kpis.borradores} icon={FileText} isLoading={isLoading}/>
                <KpiCard title="Aceptados" value={kpis.aceptados} icon={CheckCircle} isLoading={isLoading}/>
                <KpiCard title="Facturados" value={kpis.facturados} icon={FileText} isLoading={isLoading}/>
                <KpiCard title="Rechazados" value={kpis.rechazados} icon={XCircle} isLoading={isLoading}/>
            </div>
            
            <Card>
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle className="font-headline text-2xl">Presupuestos ordenados</CardTitle>
                    <CardDescription>Separa eventos contratados de prospectos y muestra ambas fechas importantes.</CardDescription>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <Select value={sortMode} onValueChange={(value) => setSortMode(value as DashboardSortMode)}>
                    <SelectTrigger className="w-full md:w-52" aria-label="Ordenar presupuestos">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart">Orden recomendado</SelectItem>
                      <SelectItem value="event-date">Fecha de fiesta</SelectItem>
                      <SelectItem value="created-date">Fecha del presupuesto</SelectItem>
                      <SelectItem value="client">Nombre del cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={showArchived ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowArchived(v => !v)}
                    className="rounded-xl text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                    {showArchived ? 'Mostrando activos + archivados' : 'Incluir archivados'}
                  </Button>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input placeholder="Buscar cliente o Nº..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9"/>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="todos">
                  <TabsList className="mb-4">
                    <TabsTrigger value="todos">Todos ({filteredPresupuestos.length})</TabsTrigger>
                    <TabsTrigger value="Borrador">Borrador</TabsTrigger>
                    <TabsTrigger value="Enviado">Enviado</TabsTrigger>
                    <TabsTrigger value="Aceptado">Aceptado</TabsTrigger>
                    <TabsTrigger value="Facturado">Facturado</TabsTrigger>
                  </TabsList>

                  {isLoading ? <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> : (
                    <>
                      <TabsContent value="todos">
                        {filteredPresupuestos.length === 0 ? (
                          <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                            <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                            <p className="font-semibold text-foreground">
                              {searchTerm ? 'No hay presupuestos con esa busqueda.' : showArchived ? 'No hay presupuestos cargados, ni activos ni archivados.' : 'No hay presupuestos activos.'}
                            </p>
                            <p className="mt-1 text-sm">Crea uno nuevo o importa un presupuesto para iniciar el seguimiento.</p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <section aria-labelledby="eventos-contratados">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <h3 id="eventos-contratados" className="flex items-center gap-2 font-semibold">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                    Eventos contratados
                                  </h3>
                                  <p className="text-xs text-muted-foreground">Ordenados por la fecha de la fiesta más próxima.</p>
                                </div>
                                <span className="text-sm font-semibold tabular-nums">{organizedBudgets.contracted.length}</span>
                              </div>
                              {organizedBudgets.contracted.length > 0 ? (
                                <div className="space-y-2">
                                  {organizedBudgets.contracted.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                                </div>
                              ) : (
                                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay eventos contratados.</div>
                              )}
                            </section>

                            <section aria-labelledby="prospectos-cotizaciones">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <h3 id="prospectos-cotizaciones" className="flex items-center gap-2 font-semibold">
                                    <Users className="h-4 w-4 text-primary" />
                                    Prospectos y cotizaciones
                                  </h3>
                                  <p className="text-xs text-muted-foreground">Ordenados por la fecha en que se hizo el presupuesto.</p>
                                </div>
                                <span className="text-sm font-semibold tabular-nums">{organizedBudgets.prospects.length}</span>
                              </div>
                              {organizedBudgets.prospects.length > 0 ? (
                                <div className="space-y-2">
                                  {organizedBudgets.prospects.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                                </div>
                              ) : (
                                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay prospectos ni cotizaciones pendientes.</div>
                              )}
                            </section>

                            {showArchived && organizedBudgets.archived.length > 0 ? (
                              <section aria-labelledby="presupuestos-archivados">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <h3 id="presupuestos-archivados" className="font-semibold text-muted-foreground">Archivados</h3>
                                  <span className="text-sm font-semibold tabular-nums">{organizedBudgets.archived.length}</span>
                                </div>
                                <div className="space-y-2 opacity-75">
                                  {organizedBudgets.archived.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                                </div>
                              </section>
                            ) : null}
                          </div>
                        )}
                      </TabsContent>
                       {['Borrador', 'Enviado', 'Aceptado', 'Facturado', 'Rechazado'].map(estado => {
                           const statusSortMode: BudgetSortMode = sortMode === 'smart'
                             ? (estado === 'Aceptado' || estado === 'Facturado' ? 'event-date' : 'created-date')
                             : sortMode;
                           const byStatus = sortBudgets(filteredPresupuestos.filter(p => p.estado === estado), statusSortMode);
                           return (
                             <TabsContent key={estado} value={estado}>
                                {byStatus.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                                    No hay presupuestos en estado {estado}.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {byStatus.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                                  </div>
                                )}
                             </TabsContent>
                           );
                        })}
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
        </div>
    );
}

export default function NuevoPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <PresupuestoDashboardContent />
        </Suspense>
    )
}
