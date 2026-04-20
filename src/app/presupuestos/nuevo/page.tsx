
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, PlusCircle, Loader2, ListChecks, CheckCircle, FileClock, XCircle, FileText, Search, ClipboardPaste, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestos, resetAllPresupuestos } from '@/app/actions/presupuestos';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function PresupuestoDashboardContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isResettingPresupuestos, setIsResettingPresupuestos] = useState(false);

    const fetchPresupuestos = useCallback(async () => {
        setIsLoading(true);
        try {
            const guardados = await getPresupuestos(showArchived);
            setPresupuestos((Array.isArray(guardados) ? guardados : []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch(e) {
            toast({ title: "Error", description: "No se pudieron cargar los presupuestos."});
        } finally {
            setIsLoading(false);
        }
    }, [toast, showArchived]);

    useEffect(() => { fetchPresupuestos(); }, [fetchPresupuestos]);

    const handleBudgetMutation = useCallback(async (id: string, action: 'archive' | 'delete') => {
        setPresupuestos(prev => prev.filter(p => {
            if (p.id !== id) return true;
            if (showArchived && action === 'archive') return true;
            return false;
        }));
        router.refresh();
        await fetchPresupuestos();
    }, [router, fetchPresupuestos, showArchived]);

    const handleResetAllPresupuestos = async () => {
        setIsResettingPresupuestos(true);
        try {
            const result = await resetAllPresupuestos();
            if (result.success) {
                toast({ title: '🗑️ Presupuestos eliminados', description: `${result.deletedCount ?? 0} presupuesto(s) eliminado(s) permanentemente.`, variant: 'destructive' });
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
                  <Link href="/presupuestos/reporte"><Button variant="secondary">Reporte</Button></Link>
                  <Link href="/presupuestos/importar"><Button variant="outline" data-testid="btn-importar-presupuesto"><ClipboardPaste className="w-4 h-4 mr-2"/>Importar desde Texto</Button></Link>
                  <Link href="/presupuestos/nuevo/crear"><Button><PlusCircle className="w-4 h-4 mr-2"/>Nuevo Presupuesto</Button></Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isResettingPresupuestos || presupuestos.length === 0}>
                        {isResettingPresupuestos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        🗑️ Borrar todos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ ¿Borrar TODOS los presupuestos permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará <strong>de forma irreversible</strong> todos los presupuestos ({presupuestos.length}), incluyendo los archivados. Los datos <strong>NO se podrán recuperar</strong>. Esta operación borra directamente de Firestore y no puede deshacerse.
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
                  <Link href="/empresa/contabilidad"><Button variant="outline">Volver</Button></Link>
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
                    <CardTitle className="font-headline text-2xl">Todos los Presupuestos</CardTitle>
                    <CardDescription>Gestiona las cotizaciones generadas manual o automáticamente.</CardDescription>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <Button
                    variant={showArchived ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowArchived(v => !v)}
                    className="rounded-xl text-xs"
                  >
                    {showArchived ? '✅ Mostrando archivados' : '🗂️ Ver archivados'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPresupuestos.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                        </div>
                      </TabsContent>
                       {['Borrador', 'Enviado', 'Aceptado', 'Facturado', 'Rechazado'].map(estado => (
                           <TabsContent key={estado} value={estado}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPresupuestos.filter(p => p.estado === estado).map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={handleBudgetMutation}/>)}
                              </div>
                           </TabsContent>
                        ))}
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
