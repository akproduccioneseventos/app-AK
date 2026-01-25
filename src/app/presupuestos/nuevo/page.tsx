
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, ArrowRight, Loader2, ListChecks, CheckCircle, FileClock, XCircle, FileText, Printer, FileArchive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestos } from '@/app/actions/presupuestos';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PresupuestoDashboardContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPresupuestos = useCallback(async () => {
        setIsLoading(true);
        try {
            const guardados = await getPresupuestos();
            // Ordenar para mostrar los más recientes primero
            const sorted = guardados.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setPresupuestos(sorted);
        } catch(e) {
            toast({ title: "Error", description: "No se pudieron cargar los presupuestos guardados."});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPresupuestos();
    }, [fetchPresupuestos]);

    const kpis = useMemo(() => {
        return {
            aceptados: presupuestos.filter(p => p.estado === 'Aceptado').length,
            facturados: presupuestos.filter(p => p.estado === 'Facturado').length,
            pendientes: presupuestos.filter(p => p.estado === 'Borrador' || p.estado === 'Enviado').length,
            rechazados: presupuestos.filter(p => p.estado === 'Rechazado').length,
        }
    }, [presupuestos]);

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                  <ListChecks className="w-8 h-8 text-primary"/> Central de Presupuestos
                </h1>
                <div className="flex gap-2 flex-wrap">
                  <Link href="/presupuestos/reporte" passHref>
                    <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Ver Reporte</Button>
                  </Link>
                  <Link href="/admin/carga-historicos" passHref>
                    <Button variant="outline"><FileArchive className="w-4 h-4 mr-2"/>Cargar Históricos</Button>
                  </Link>
                  <Link href="/presupuestos/nuevo/crear" passHref>
                    <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Presupuesto</Button>
                  </Link>
                   <Link href="/empresa/contabilidad" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Aceptados" value={kpis.aceptados} icon={CheckCircle} isLoading={isLoading} description="Presupuestos aprobados por clientes."/>
                <KpiCard title="Facturados" value={kpis.facturados} icon={FileText} isLoading={isLoading} description="Presupuestos convertidos a factura."/>
                <KpiCard title="Pendientes" value={kpis.pendientes} icon={FileClock} isLoading={isLoading} description="En borrador o enviados."/>
                <KpiCard title="Rechazados" value={kpis.rechazados} icon={XCircle} isLoading={isLoading} description="Presupuestos que no se concretaron."/>
            </div>
            
            <Separator className="my-8" />
            
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Todos los Presupuestos</CardTitle>
                <CardDescription>Visualiza, edita y gestiona todos los presupuestos generados, incluyendo los del simulador.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="todos">
                  <TabsList>
                    <TabsTrigger value="todos">Todos ({presupuestos.length})</TabsTrigger>
                    <TabsTrigger value="Borrador">Borrador</TabsTrigger>
                    <TabsTrigger value="Enviado">Enviado</TabsTrigger>
                    <TabsTrigger value="Aceptado">Aceptado</TabsTrigger>
                    <TabsTrigger value="Facturado">Facturado</TabsTrigger>
                    <TabsTrigger value="Rechazado">Rechazado</TabsTrigger>
                  </TabsList>

                  {isLoading ? <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> : (
                    <>
                      <TabsContent value="todos">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                            {presupuestos.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={fetchPresupuestos}/>)}
                        </div>
                        {presupuestos.length === 0 && <p className="text-muted-foreground text-center py-6">No hay presupuestos guardados.</p>}
                      </TabsContent>
                       {['Borrador', 'Enviado', 'Aceptado', 'Facturado', 'Rechazado'].map(estado => {
                         const presupuestosFiltrados = presupuestos.filter(p => p.estado === estado);
                         return (
                           <TabsContent key={estado} value={estado}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                {presupuestosFiltrados.map(p => <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={fetchPresupuestos}/>)}
                              </div>
                              {presupuestosFiltrados.length === 0 && <p className="text-muted-foreground text-center py-6">No hay presupuestos en estado "{estado}".</p>}
                           </TabsContent>
                         )
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
