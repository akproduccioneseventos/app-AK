
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto } from '@/types/presupuesto';
import { Loader2 } from 'lucide-react';
import { getPresupuestos } from '@/app/actions/presupuestos';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { Separator } from '@/components/ui/separator';

function NuevoPresupuestoContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [presupuestosGuardados, setPresupuestosGuardados] = useState<Presupuesto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGuardados = useCallback(async () => {
        setIsLoading(true);
        try {
            const guardados = await getPresupuestos();
            setPresupuestosGuardados(guardados);
        } catch(e) {
            toast({ title: "Error", description: "No se pudieron cargar los presupuestos guardados."});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchGuardados();
    }, [fetchGuardados]);

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Central de Presupuestos</h1>
                <div className="flex gap-2">
                  <Link href="/presupuestos/nuevo/crear" passHref>
                    <Button><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Presupuesto</Button>
                  </Link>
                   <Link href="/empresa/contabilidad" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
                </div>
            </div>
            <p className="text-muted-foreground">
                Desde aquí puedes gestionar todos tus presupuestos, tanto los guardados como borradores y los ya enviados.
            </p>
            
            <Separator className="my-8" />
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline">Presupuestos Guardados</h2>
              {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                presupuestosGuardados.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presupuestosGuardados.map(p => (
                      <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={fetchGuardados}/>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-center py-4">No hay presupuestos guardados.</p>
              }
            </div>
        </div>
    );
}

export default function NuevoPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoPresupuestoContent />
        </Suspense>
    )
}
